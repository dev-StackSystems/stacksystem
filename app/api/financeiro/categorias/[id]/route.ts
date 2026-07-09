/**
 * app/api/financeiro/categorias/[id]/route.ts — editar / excluir categoria
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
  const atual = await db.categoriaFinanceira.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const b = await request.json()
  const categoria = await db.categoriaFinanceira.update({
    where: { id },
    data: {
      ...(b.nome !== undefined     && { nome: String(b.nome).trim() }),
      ...(b.natureza !== undefined && { natureza: b.natureza === "receita" ? "receita" : "despesa" }),
      ...(b.cor !== undefined      && { cor: b.cor?.trim() || null }),
      ...(b.ativo !== undefined    && { ativo: Boolean(b.ativo) }),
    },
    include: { _count: { select: { lancamentos: true } } },
  })
  return NextResponse.json(categoria)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.categoriaFinanceira.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const vinculados = await db.lancamentoFinanceiro.count({ where: { categoriaId: id } })
  if (vinculados > 0) {
    await db.categoriaFinanceira.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true, desativado: true })
  }
  await db.categoriaFinanceira.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
