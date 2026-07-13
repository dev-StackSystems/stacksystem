/**
 * app/api/barbearia/clientes/[id]/route.ts — editar / excluir cliente.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exigirPapel } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

const paraData = (v: unknown): Date | null => {
  if (!v || typeof v !== "string") return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.clienteBarbearia.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const b = await request.json()
  const cliente = await db.clienteBarbearia.update({
    where: { id },
    data: {
      ...(b.nome !== undefined       && { nome: String(b.nome).trim() }),
      ...(b.telefone !== undefined   && { telefone: b.telefone?.trim() || null }),
      ...(b.email !== undefined      && { email: b.email?.trim() || null }),
      ...(b.nascimento !== undefined && { nascimento: paraData(b.nascimento) }),
      ...(b.observacao !== undefined && { observacao: b.observacao?.trim() || null }),
      ...(b.ativo !== undefined      && { ativo: Boolean(b.ativo) }),
    },
    include: { _count: { select: { agendamentos: true } } },
  })
  return NextResponse.json(cliente)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.clienteBarbearia.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const vinculados = await db.agendamento.count({ where: { clienteId: id } })
  if (vinculados > 0) {
    await db.clienteBarbearia.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true, desativado: true })
  }
  await db.clienteBarbearia.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
