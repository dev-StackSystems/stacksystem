/**
 * app/api/financeiro/categorias/route.ts
 * Categorias (plano de contas) — natureza receita/despesa.
 * GET lista · POST cadastra
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const where = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }
  const categorias = await db.categoriaFinanceira.findMany({
    where,
    orderBy: [{ natureza: "asc" }, { nome: "asc" }],
    include: { _count: { select: { lancamentos: true } } },
  })
  return NextResponse.json(categorias)
}

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const podeCriar =
    usuario.superAdmin || usuario.papel === PapelUsuario.A ||
    usuario.papel === PapelUsuario.T || usuario.grupoIsAdmin
  if (!podeCriar) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const corpo = await requisicao.json()
  const { nome, natureza, cor } = corpo
  if (!nome || !nome.trim()) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })

  const empresaId = usuario.superAdmin ? (corpo.empresaId ?? null) : usuario.empresaId
  if (!empresaId) return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })

  const categoria = await db.categoriaFinanceira.create({
    data: {
      empresaId,
      nome:     nome.trim(),
      natureza: natureza === "receita" ? "receita" : "despesa",
      cor:      cor?.trim() || null,
    },
    include: { _count: { select: { lancamentos: true } } },
  })
  return NextResponse.json(categoria, { status: 201 })
}
