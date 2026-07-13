/**
 * app/api/barbearia/servicos/[id]/route.ts — editar / excluir serviço.
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
  const atual = await db.servicoBarbearia.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const b = await request.json()
  const preco = b.preco !== undefined ? parseFloat(b.preco) : undefined
  const servico = await db.servicoBarbearia.update({
    where: { id },
    data: {
      ...(b.nome !== undefined       && { nome: String(b.nome).trim() }),
      ...(b.duracaoMin !== undefined && { duracaoMin: Math.max(5, parseInt(b.duracaoMin) || 30) }),
      ...(preco !== undefined && isFinite(preco) && { preco: preco >= 0 ? preco : 0 }),
      ...(b.cor !== undefined        && { cor: b.cor?.trim() || null }),
      ...(b.ativo !== undefined      && { ativo: Boolean(b.ativo) }),
    },
    include: { _count: { select: { agendamentos: true } } },
  })
  return NextResponse.json({ ...servico, preco: Number(servico.preco) })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.servicoBarbearia.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const vinculados = await db.agendamento.count({ where: { servicoId: id } })
  if (vinculados > 0) {
    await db.servicoBarbearia.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true, desativado: true })
  }
  await db.servicoBarbearia.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
