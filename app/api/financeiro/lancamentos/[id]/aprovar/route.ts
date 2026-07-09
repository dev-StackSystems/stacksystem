/**
 * app/api/financeiro/lancamentos/[id]/aprovar/route.ts
 * Alçada de aprovação — aprova ou reprova um lançamento pendente.
 * POST body { aprovar: boolean }. Só admin da empresa / grupoIsAdmin / superAdmin.
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"
import { registrarAuditoria, ipDaRequisicao } from "@/lib/auditoria"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const podeAprovar = user.superAdmin || user.papel === PapelUsuario.A || user.grupoIsAdmin
  if (!podeAprovar) return NextResponse.json({ error: "Sem permissão para aprovar." }, { status: 403 })

  const { id } = await params
  const atual = await db.lancamentoFinanceiro.findUnique({ where: { id }, select: { empresaId: true, aprovacao: true } })
  if (!atual) return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 })
  if (!user.superAdmin && atual.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }
  if (atual.aprovacao !== "pendente") {
    return NextResponse.json({ error: "Este lançamento não está pendente de aprovação." }, { status: 400 })
  }

  const { aprovar } = await request.json()
  const aprovado = Boolean(aprovar)

  const lanc = await db.lancamentoFinanceiro.update({
    where: { id },
    data: {
      aprovacao:     aprovado ? "aprovado" : "reprovado",
      aprovadoPorId: user.id,
      aprovadoEm:    new Date(),
      // Reprovado → cancela o lançamento
      ...(aprovado ? {} : { status: "cancelado" }),
    },
  })
  await registrarAuditoria(
    user.id,
    aprovado ? "financeiro.lancamento.aprovar" : "financeiro.lancamento.reprovar",
    `id=${id}`,
    ipDaRequisicao(request),
  )
  return NextResponse.json({ ok: true, aprovacao: lanc.aprovacao })
}
