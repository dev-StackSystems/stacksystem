/**
 * app/api/financeiro/orcamentos/route.ts
 * Orçamento matricial (limite por categoria/centro de custo por período).
 * GET lista (aceita ?ano=) · POST cadastra
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

const INCLUDE = {
  categoria:   { select: { nome: true, natureza: true, cor: true } },
  centroCusto: { select: { nome: true } },
}

export async function GET(req: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const ano = parseInt(req.nextUrl.searchParams.get("ano") || "") || undefined
  const where = { ...(usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }), ...(ano ? { ano } : {}) }

  const orcamentos = await db.orcamento.findMany({
    where,
    orderBy: [{ ano: "desc" }, { mes: "asc" }],
    include: INCLUDE,
  })
  return NextResponse.json(orcamentos)
}

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const podeCriar =
    usuario.superAdmin || usuario.papel === PapelUsuario.A ||
    usuario.papel === PapelUsuario.T || usuario.grupoIsAdmin
  if (!podeCriar) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const c = await requisicao.json()
  const { ano, mes, categoriaId, centroCustoId, valor } = c

  const anoNum = parseInt(ano)
  if (!anoNum || anoNum < 2000 || anoNum > 2100) {
    return NextResponse.json({ error: "Ano inválido." }, { status: 400 })
  }
  const valorNum = parseFloat(valor)
  if (isNaN(valorNum) || valorNum <= 0) {
    return NextResponse.json({ error: "Valor deve ser maior que zero." }, { status: 400 })
  }
  if (!categoriaId && !centroCustoId) {
    return NextResponse.json({ error: "Informe uma categoria e/ou um centro de custo." }, { status: 400 })
  }

  const empresaId = usuario.superAdmin ? (c.empresaId ?? null) : usuario.empresaId
  if (!empresaId) return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })

  const mesNum = Math.max(0, Math.min(12, parseInt(mes) || 0))

  try {
    const orcamento = await db.orcamento.create({
      data: {
        empresaId,
        ano: anoNum,
        mes: mesNum,
        categoriaId:   categoriaId   || null,
        centroCustoId: centroCustoId || null,
        valor: valorNum,
      },
      include: INCLUDE,
    })
    return NextResponse.json(orcamento, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Já existe orçamento para essa combinação de período/categoria/centro." }, { status: 409 })
  }
}
