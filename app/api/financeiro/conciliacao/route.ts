/**
 * app/api/financeiro/conciliacao/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Importação de extrato (OFX/CSV) e conciliação com lançamentos existentes.
 *
 * POST body: {
 *   contaId:        string        // conta a conciliar (obrigatório)
 *   formato:        "ofx" | "csv"
 *   conteudo:       string        // texto do arquivo
 *   criarFaltantes: boolean       // cria lançamento p/ transações sem match
 * }
 *
 * Match: 1º por fitId; senão por (valor absoluto + data), lançamento ainda não
 * conciliado. Casados → conciliado=true (+fitId). Sem match e criarFaltantes →
 * cria lançamento conciliado (tipo pelo sinal do valor).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exigirPapel } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"
import { registrarAuditoria, ipDaRequisicao } from "@/lib/auditoria"

type Transacao = { fitId: string | null; data: Date; valor: number; memo: string }

// ── Parsers ──────────────────────────────────────────────────────────────────

function parseDataOfx(bruto: string): Date {
  const s = bruto.replace(/[^0-9]/g, "").slice(0, 8)
  const y = +s.slice(0, 4), m = +s.slice(4, 6) - 1, d = +s.slice(6, 8)
  return new Date(y, m || 0, d || 1)
}

function parseOfx(conteudo: string): Transacao[] {
  const trans: Transacao[] = []
  const blocos = conteudo.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? []
  const pegar = (bloco: string, tag: string) => {
    const m = bloco.match(new RegExp(`<${tag}>([^<\r\n]*)`, "i"))
    return m ? m[1].trim() : ""
  }
  for (const b of blocos) {
    const valor = parseFloat(pegar(b, "TRNAMT").replace(",", "."))
    if (isNaN(valor)) continue
    trans.push({
      fitId: pegar(b, "FITID") || null,
      data:  parseDataOfx(pegar(b, "DTPOSTED")),
      valor,
      memo:  pegar(b, "MEMO") || pegar(b, "NAME") || "Transação importada",
    })
  }
  return trans
}

function parseCsv(conteudo: string): Transacao[] {
  const linhas = conteudo.split(/\r?\n/).filter((l) => l.trim())
  if (linhas.length === 0) return []
  const sep = (linhas[0].match(/;/g)?.length ?? 0) >= (linhas[0].match(/,/g)?.length ?? 0) ? ";" : ","
  const parseData = (s: string): Date => {
    const t = s.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) return new Date(t.slice(0, 10))
    const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date()
  }
  // Pula cabeçalho se a 1ª coluna não parecer data
  const inicio = /\d/.test(linhas[0].split(sep)[0]) ? 0 : 1
  const trans: Transacao[] = []
  for (let i = inicio; i < linhas.length; i++) {
    const cols = linhas[i].split(sep).map((c) => c.trim())
    if (cols.length < 2) continue
    const valorTxt = (cols[1] ?? "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.\-]/g, "")
    const valor = parseFloat(valorTxt)
    if (isNaN(valor)) continue
    trans.push({ fitId: null, data: parseData(cols[0]), valor, memo: cols[2] || "Transação importada" })
  }
  return trans
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { contaId, formato, conteudo, criarFaltantes } = await request.json()
  if (!contaId)  return NextResponse.json({ error: "Selecione a conta a conciliar." }, { status: 400 })
  if (!conteudo) return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 })

  const conta = await db.contaFinanceira.findUnique({ where: { id: contaId }, select: { empresaId: true } })
  if (!conta) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 })
  const empresaId = conta.empresaId
  if (!user.superAdmin && empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const transacoes = formato === "csv" ? parseCsv(conteudo) : parseOfx(conteudo)
  if (transacoes.length === 0) {
    return NextResponse.json({ error: "Nenhuma transação reconhecida no arquivo." }, { status: 400 })
  }

  let conciliados = 0, criados = 0, semMatch = 0

  for (const t of transacoes) {
    const abs = Math.abs(t.valor)
    const inicioDia = new Date(t.data); inicioDia.setHours(0, 0, 0, 0)
    const fimDia = new Date(t.data); fimDia.setHours(23, 59, 59, 999)

    // 1) match por fitId
    let alvo = t.fitId
      ? await db.lancamentoFinanceiro.findFirst({ where: { empresaId, contaId, fitId: t.fitId } })
      : null

    // 2) match por valor + data (não conciliado)
    if (!alvo) {
      alvo = await db.lancamentoFinanceiro.findFirst({
        where: {
          empresaId, contaId, conciliado: false, valor: abs,
          dataVencimento: { gte: inicioDia, lte: fimDia },
        },
      })
    }
    if (!alvo) {
      alvo = await db.lancamentoFinanceiro.findFirst({
        where: {
          empresaId, contaId, conciliado: false, valor: abs,
          dataCompetencia: { gte: inicioDia, lte: fimDia },
        },
      })
    }

    if (alvo) {
      await db.lancamentoFinanceiro.update({
        where: { id: alvo.id },
        data:  { conciliado: true, ...(t.fitId ? { fitId: t.fitId } : {}), status: "pago", dataPagamento: alvo.dataPagamento ?? t.data },
      })
      conciliados++
    } else if (criarFaltantes) {
      await db.lancamentoFinanceiro.create({
        data: {
          empresaId, contaId,
          tipo:      t.valor < 0 ? "despesa" : "receita",
          descricao: t.memo,
          valor:     abs,
          status:    "pago",
          dataCompetencia: t.data,
          dataPagamento:   t.data,
          conciliado: true,
          fitId: t.fitId,
        },
      })
      criados++
    } else {
      semMatch++
    }
  }

  await registrarAuditoria(user.id, "financeiro.conciliacao", `conta=${contaId} · ${conciliados} conciliados · ${criados} criados`, ipDaRequisicao(request))
  return NextResponse.json({ ok: true, total: transacoes.length, conciliados, criados, semMatch })
}
