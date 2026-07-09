/**
 * app/api/financeiro/contatos/[id]/route.ts — editar / excluir contato
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exigirPapel } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"
import { limparDocumento, documentoValido } from "@/lib/financeiro"

type Params = { params: Promise<{ id: string }> }

async function carregar(id: string) {
  return db.contatoFinanceiro.findUnique({ where: { id }, select: { id: true, empresaId: true, tipoPessoa: true } })
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await carregar(id)
  if (!atual) return NextResponse.json({ error: "Contato não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const body = await request.json()
  const { nome, tipoPessoa, documento, email, telefone, papel, ativo } = body

  const tipo = tipoPessoa === "PJ" ? "PJ" : tipoPessoa === "PF" ? "PF" : atual.tipoPessoa
  if (documento !== undefined && !documentoValido(tipo, documento)) {
    return NextResponse.json(
      { error: tipo === "PJ" ? "CNPJ deve ter 14 dígitos." : "CPF deve ter 11 dígitos." },
      { status: 400 },
    )
  }

  const doc = documento !== undefined ? (limparDocumento(documento) || null) : undefined
  if (doc) {
    const dup = await db.contatoFinanceiro.findFirst({
      where: { empresaId: atual.empresaId, documento: doc, NOT: { id } },
    })
    if (dup) return NextResponse.json({ error: "Documento já cadastrado nesta empresa." }, { status: 409 })
  }

  const contato = await db.contatoFinanceiro.update({
    where: { id },
    data: {
      ...(nome !== undefined       && { nome: String(nome).trim() }),
      ...(tipoPessoa !== undefined && { tipoPessoa: tipo }),
      ...(doc !== undefined        && { documento: doc }),
      ...(email !== undefined      && { email: email?.trim() || null }),
      ...(telefone !== undefined   && { telefone: telefone?.trim() || null }),
      ...(papel !== undefined      && { papel }),
      ...(ativo !== undefined      && { ativo: Boolean(ativo) }),
    },
    include: { _count: { select: { lancamentos: true } } },
  })
  return NextResponse.json(contato)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await carregar(id)
  if (!atual) return NextResponse.json({ error: "Contato não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  // Se houver lançamentos vinculados, desativa em vez de excluir (preserva histórico)
  const vinculados = await db.lancamentoFinanceiro.count({ where: { contatoId: id } })
  if (vinculados > 0) {
    await db.contatoFinanceiro.update({ where: { id }, data: { ativo: false } })
    return NextResponse.json({ ok: true, desativado: true })
  }

  await db.contatoFinanceiro.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
