/**
 * app/api/financeiro/orcamentos/[id]/route.ts — editar / excluir orçamento
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exigirPapel } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.orcamento.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const b = await request.json()
  const orcamento = await db.orcamento.update({
    where: { id },
    data: {
      ...(b.valor !== undefined && { valor: parseFloat(b.valor) }),
      ...(b.mes !== undefined && { mes: Math.max(0, Math.min(12, parseInt(b.mes) || 0)) }),
    },
    include: {
      categoria:   { select: { nome: true, natureza: true, cor: true } },
      centroCusto: { select: { nome: true } },
    },
  })
  return NextResponse.json(orcamento)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.orcamento.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  await db.orcamento.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
