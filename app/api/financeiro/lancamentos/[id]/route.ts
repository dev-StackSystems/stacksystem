/**
 * app/api/financeiro/lancamentos/[id]/route.ts — editar / excluir lançamento
 *
 * DELETE aceita ?escopo=serie para excluir toda a série de recorrência/parcelas.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exigirPapel } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

const INCLUDE = {
  contato:     { select: { nome: true, tipoPessoa: true, documento: true } },
  conta:       { select: { nome: true } },
  categoria:   { select: { nome: true, natureza: true } },
  centroCusto: { select: { nome: true } },
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.lancamentoFinanceiro.findUnique({ where: { id }, select: { empresaId: true } })
  if (!atual) return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const b = await request.json()
  if (b.tipo !== undefined && b.tipo !== "receita" && b.tipo !== "despesa") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 })
  }

  const lanc = await db.lancamentoFinanceiro.update({
    where: { id },
    data: {
      ...(b.tipo !== undefined            && { tipo: b.tipo }),
      ...(b.descricao !== undefined       && { descricao: String(b.descricao).trim() }),
      ...(b.valor !== undefined           && { valor: parseFloat(b.valor) }),
      ...(b.status !== undefined          && { status: b.status }),
      ...(b.dataCompetencia !== undefined && { dataCompetencia: b.dataCompetencia ? new Date(b.dataCompetencia) : undefined }),
      ...(b.dataVencimento !== undefined  && { dataVencimento: b.dataVencimento ? new Date(b.dataVencimento) : null }),
      ...(b.dataPagamento !== undefined   && { dataPagamento: b.dataPagamento ? new Date(b.dataPagamento) : null }),
      ...(b.contatoId !== undefined       && { contatoId: b.contatoId || null }),
      ...(b.contaId !== undefined         && { contaId: b.contaId || null }),
      ...(b.categoriaId !== undefined     && { categoriaId: b.categoriaId || null }),
      ...(b.centroCustoId !== undefined   && { centroCustoId: b.centroCustoId || null }),
      ...(b.observacao !== undefined      && { observacao: b.observacao?.trim() || null }),
      ...(b.tags !== undefined            && { tags: typeof b.tags === "string" && b.tags.trim() ? b.tags.trim() : null }),
      ...(b.conciliado !== undefined      && { conciliado: Boolean(b.conciliado) }),
    },
    include: INCLUDE,
  })
  return NextResponse.json(lanc)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.lancamentoFinanceiro.findUnique({
    where: { id },
    select: { empresaId: true, grupoRecorrenciaId: true },
  })
  if (!atual) return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const escopo = request.nextUrl.searchParams.get("escopo")
  if (escopo === "serie" && atual.grupoRecorrenciaId) {
    const r = await db.lancamentoFinanceiro.deleteMany({
      where: { grupoRecorrenciaId: atual.grupoRecorrenciaId, empresaId: atual.empresaId },
    })
    return NextResponse.json({ ok: true, excluidos: r.count })
  }

  await db.lancamentoFinanceiro.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
