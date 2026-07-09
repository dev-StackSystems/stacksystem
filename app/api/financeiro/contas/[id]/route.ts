/**
 * app/api/financeiro/contas/[id]/route.ts — editar / excluir conta
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
  const atual = await db.contaFinanceira.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const b = await request.json()
  const conta = await db.contaFinanceira.update({
    where: { id },
    data: {
      ...(b.nome !== undefined         && { nome: String(b.nome).trim() }),
      ...(b.tipo !== undefined         && { tipo: b.tipo }),
      ...(b.banco !== undefined        && { banco: b.banco?.trim() || null }),
      ...(b.agencia !== undefined      && { agencia: b.agencia?.trim() || null }),
      ...(b.numero !== undefined       && { numero: b.numero?.trim() || null }),
      ...(b.saldoInicial !== undefined && { saldoInicial: b.saldoInicial ? parseFloat(b.saldoInicial) : 0 }),
      ...(b.ativo !== undefined        && { ativo: Boolean(b.ativo) }),
    },
    include: { _count: { select: { lancamentos: true } } },
  })
  return NextResponse.json(conta)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.contaFinanceira.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const vinculados = await db.lancamentoFinanceiro.count({ where: { contaId: id } })
  if (vinculados > 0) {
    await db.contaFinanceira.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true, desativado: true })
  }
  await db.contaFinanceira.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
