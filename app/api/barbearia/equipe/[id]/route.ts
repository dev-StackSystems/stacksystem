/**
 * app/api/barbearia/equipe/[id]/route.ts — editar / excluir barbeiro.
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
  const atual = await db.barbeiro.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Barbeiro não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const b = await request.json()
  const barbeiro = await db.barbeiro.update({
    where: { id },
    data: {
      ...(b.nome !== undefined     && { nome: String(b.nome).trim() }),
      ...(b.apelido !== undefined  && { apelido: b.apelido?.trim() || null }),
      ...(b.telefone !== undefined && { telefone: b.telefone?.trim() || null }),
      ...(b.cor !== undefined      && { cor: b.cor?.trim() || "#c9a84c" }),
      ...(b.ativo !== undefined    && { ativo: Boolean(b.ativo) }),
    },
    include: { _count: { select: { agendamentos: true } } },
  })
  return NextResponse.json(barbeiro)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.barbeiro.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Barbeiro não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const vinculados = await db.agendamento.count({ where: { barbeiroId: id } })
  if (vinculados > 0) {
    await db.barbeiro.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true, desativado: true })
  }
  await db.barbeiro.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
