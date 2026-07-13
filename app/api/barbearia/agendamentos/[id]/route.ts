/**
 * app/api/barbearia/agendamentos/[id]/route.ts
 * Editar / mudar status / excluir agendamento.
 *
 * Integração com o Financeiro (reutiliza LancamentoFinanceiro):
 *   status → "concluido"  cria um lançamento de receita (valor = preço snapshot)
 *   sair de "concluido"    apaga o lançamento vinculado
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exigirPapel } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

const INCLUDE = {
  barbeiro: { select: { nome: true, apelido: true, cor: true } },
  servico:  { select: { nome: true, cor: true } },
  cliente:  { select: { nome: true, telefone: true } },
}
const serializar = (a: { preco: { toString(): string }; [k: string]: unknown }) => ({ ...a, preco: Number(a.preco) })

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.agendamento.findUnique({
    where: { id },
    select: {
      empresaId: true, status: true, lancamentoId: true, preco: true, dataHora: true, clienteAvulso: true,
      servico: { select: { nome: true } }, cliente: { select: { nome: true } },
    },
  })
  if (!atual) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const b = await request.json()
  const data: Record<string, unknown> = {}

  // Re-snapshot ao trocar o serviço (exceto se já concluído)
  if (b.servicoId !== undefined) {
    const s = await db.servicoBarbearia.findUnique({ where: { id: b.servicoId }, select: { empresaId: true, preco: true, duracaoMin: true } })
    if (!s || s.empresaId !== atual.empresaId) return NextResponse.json({ error: "Serviço inválido." }, { status: 400 })
    data.servicoId = b.servicoId
    if (atual.status !== "concluido") { data.preco = Number(s.preco); data.duracaoMin = s.duracaoMin }
  }
  if (b.barbeiroId !== undefined) data.barbeiroId = b.barbeiroId
  if (b.clienteId !== undefined) { data.clienteId = b.clienteId || null; if (b.clienteId) data.clienteAvulso = null }
  if (b.clienteAvulso !== undefined && !b.clienteId) data.clienteAvulso = b.clienteAvulso?.trim() || null
  if (b.dataHora !== undefined) { const d = new Date(b.dataHora); if (!isNaN(d.getTime())) data.dataHora = d }
  if (b.observacao !== undefined) data.observacao = b.observacao?.trim() || null

  // Transição de status + integração financeira
  if (b.status !== undefined && b.status !== atual.status) {
    data.status = b.status
    if (b.status === "concluido" && !atual.lancamentoId) {
      const nomeCli = atual.cliente?.nome ?? atual.clienteAvulso ?? "Cliente"
      const valor = (data.preco as number | undefined) ?? Number(atual.preco)
      const lanc = await db.lancamentoFinanceiro.create({
        data: {
          empresaId:       atual.empresaId,
          tipo:            "receita",
          descricao:       `Atendimento: ${atual.servico?.nome ?? "Serviço"} · ${nomeCli}`,
          valor,
          status:          "pago",
          dataCompetencia: atual.dataHora,
          dataPagamento:   new Date(),
        },
      })
      data.lancamentoId = lanc.id
    } else if (b.status !== "concluido" && atual.lancamentoId) {
      await db.lancamentoFinanceiro.delete({ where: { id: atual.lancamentoId } }).catch(() => {})
      data.lancamentoId = null
    }
  }

  const ag = await db.agendamento.update({ where: { id }, data, include: INCLUDE })
  return NextResponse.json(serializar(ag))
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const atual = await db.agendamento.findUnique({ where: { id }, select: { empresaId: true, lancamentoId: true } })
  if (!atual) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  if (atual.lancamentoId) await db.lancamentoFinanceiro.delete({ where: { id: atual.lancamentoId } }).catch(() => {})
  await db.agendamento.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
