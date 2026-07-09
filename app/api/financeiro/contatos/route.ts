/**
 * app/api/financeiro/contatos/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Contatos financeiros (clientes/fornecedores PF/PJ) da empresa.
 *
 * GET  /api/financeiro/contatos — lista os contatos da empresa
 * POST /api/financeiro/contatos — cadastra um novo contato
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"
import { limparDocumento, documentoValido } from "@/lib/financeiro"

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const where = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }
  const contatos = await db.contatoFinanceiro.findMany({
    where,
    orderBy: { nome: "asc" },
    include: { _count: { select: { lancamentos: true } } },
  })
  return NextResponse.json(contatos)
}

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const podeCriar =
    usuario.superAdmin ||
    usuario.papel === PapelUsuario.A ||
    usuario.papel === PapelUsuario.T ||
    usuario.grupoIsAdmin
  if (!podeCriar) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const corpo = await requisicao.json()
  const { nome, tipoPessoa, documento, email, telefone, papel } = corpo

  if (!nome || !nome.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })
  }
  const tipo = tipoPessoa === "PJ" ? "PJ" : "PF"
  if (!documentoValido(tipo, documento)) {
    return NextResponse.json(
      { error: tipo === "PJ" ? "CNPJ deve ter 14 dígitos." : "CPF deve ter 11 dígitos." },
      { status: 400 },
    )
  }

  const empresaId = usuario.superAdmin ? (corpo.empresaId ?? null) : usuario.empresaId
  if (!empresaId) return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })

  const doc = limparDocumento(documento) || null
  if (doc) {
    const dup = await db.contatoFinanceiro.findFirst({ where: { empresaId, documento: doc } })
    if (dup) return NextResponse.json({ error: "Documento já cadastrado nesta empresa." }, { status: 409 })
  }

  const contato = await db.contatoFinanceiro.create({
    data: {
      empresaId,
      nome:       nome.trim(),
      tipoPessoa: tipo,
      documento:  doc,
      email:      email?.trim()    || null,
      telefone:   telefone?.trim() || null,
      papel:      papel            || "cliente",
    },
    include: { _count: { select: { lancamentos: true } } },
  })
  return NextResponse.json(contato, { status: 201 })
}
