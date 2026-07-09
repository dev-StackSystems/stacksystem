/**
 * app/api/financeiro/lancamentos/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lançamentos financeiros (movimentos de receita/despesa).
 *
 * GET  /api/financeiro/lancamentos      — lista (aceita filtros por query)
 * POST /api/financeiro/lancamentos      — cria 1 lançamento OU uma série
 *                                          (recorrência / parcelamento)
 *
 * Recorrência/parcelamento no POST:
 *   parcelaTotal > 1  → gera N lançamentos com o mesmo grupoRecorrenciaId,
 *                       datas deslocadas pela `frequencia`.
 *   dividirValor=true → `valor` é o TOTAL, dividido entre as N parcelas.
 *   dividirValor=false→ `valor` se repete a cada ocorrência (valor fixo).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"
import { proximaData } from "@/lib/financeiro"
import { registrarAuditoria, ipDaRequisicao } from "@/lib/auditoria"

const INCLUDE = {
  contato:     { select: { nome: true, tipoPessoa: true, documento: true } },
  conta:       { select: { nome: true } },
  categoria:   { select: { nome: true, natureza: true } },
  centroCusto: { select: { nome: true } },
}

export async function GET(req: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const where: Record<string, unknown> = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }
  if (sp.get("tipo"))        where.tipo = sp.get("tipo")
  if (sp.get("status"))      where.status = sp.get("status")
  if (sp.get("contaId"))     where.contaId = sp.get("contaId")
  if (sp.get("categoriaId")) where.categoriaId = sp.get("categoriaId")
  const de = sp.get("de"), ate = sp.get("ate")
  if (de || ate) {
    where.dataCompetencia = {
      ...(de  ? { gte: new Date(de) }  : {}),
      ...(ate ? { lte: new Date(ate) } : {}),
    }
  }

  const lancamentos = await db.lancamentoFinanceiro.findMany({
    where,
    orderBy: { dataCompetencia: "desc" },
    include: INCLUDE,
  })
  return NextResponse.json(lancamentos)
}

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const podeCriar =
    usuario.superAdmin || usuario.papel === PapelUsuario.A ||
    usuario.papel === PapelUsuario.T || usuario.grupoIsAdmin
  if (!podeCriar) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const c = await requisicao.json()
  const {
    tipo, descricao, valor, status, dataCompetencia, dataVencimento, dataPagamento,
    contatoId, contaId, categoriaId, centroCustoId, observacao,
    frequencia, parcelaTotal, dividirValor,
  } = c

  if (tipo !== "receita" && tipo !== "despesa") {
    return NextResponse.json({ error: "Tipo deve ser receita ou despesa." }, { status: 400 })
  }
  if (!descricao || !descricao.trim()) {
    return NextResponse.json({ error: "Descrição é obrigatória." }, { status: 400 })
  }
  const total = parseFloat(valor)
  if (isNaN(total) || total <= 0) {
    return NextResponse.json({ error: "Valor deve ser maior que zero." }, { status: 400 })
  }

  const empresaId = usuario.superAdmin ? (c.empresaId ?? null) : usuario.empresaId
  if (!empresaId) return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })

  // Valida que os vínculos (contato/conta/categoria/centro) são da mesma empresa
  const checarVinculo = async (
    model: "contatoFinanceiro" | "contaFinanceira" | "categoriaFinanceira" | "centroCusto",
    id?: string | null,
  ) => {
    if (!id) return true
    // @ts-expect-error indexação dinâmica do client Prisma
    const reg = await db[model].findUnique({ where: { id }, select: { empresaId: true } })
    return reg && reg.empresaId === empresaId
  }
  const [okContato, okConta, okCat, okCentro] = await Promise.all([
    checarVinculo("contatoFinanceiro", contatoId),
    checarVinculo("contaFinanceira", contaId),
    checarVinculo("categoriaFinanceira", categoriaId),
    checarVinculo("centroCusto", centroCustoId),
  ])
  if (!okContato || !okConta || !okCat || !okCentro) {
    return NextResponse.json({ error: "Vínculo não pertence à sua empresa." }, { status: 403 })
  }

  // Snapshot do documento do contato (para exibição/relatórios históricos)
  let documento: string | null = c.documento ?? null
  if (contatoId && !documento) {
    const ct = await db.contatoFinanceiro.findUnique({ where: { id: contatoId }, select: { documento: true } })
    documento = ct?.documento ?? null
  }

  const baseComp = dataCompetencia ? new Date(dataCompetencia) : new Date()
  const baseVenc = dataVencimento ? new Date(dataVencimento) : null
  const freq = frequencia || "mensal"
  const n = Math.max(1, Math.min(360, parseInt(parcelaTotal) || 1))

  // Alçada de aprovação: despesa >= limite da empresa entra pendente de aprovação
  const empresaCfg = await db.empresa.findUnique({ where: { id: empresaId }, select: { aprovacaoMinimo: true } })
  const limiteAprov = empresaCfg?.aprovacaoMinimo != null ? Number(empresaCfg.aprovacaoMinimo) : null
  const exigeAprovacao = tipo === "despesa" && limiteAprov != null && total >= limiteAprov

  const comum = {
    empresaId,
    tipo,
    status:        exigeAprovacao ? "pendente" : (status || "pendente"),
    aprovacao:     exigeAprovacao ? "pendente" : "nao_requer",
    contatoId:     contatoId     || null,
    contaId:       contaId       || null,
    categoriaId:   categoriaId   || null,
    centroCustoId: centroCustoId || null,
    documento,
    observacao:    observacao?.trim() || null,
    tags:          typeof c.tags === "string" && c.tags.trim() ? c.tags.trim() : null,
  }

  // ── Lançamento único ──────────────────────────────────────────────────────
  if (n === 1) {
    // Rateio: divide o lançamento em várias categorias/centros de custo
    type RateioIn = { categoriaId?: string; centroCustoId?: string; percentual: string | number }
    const rateiosIn: RateioIn[] = Array.isArray(c.rateios) ? c.rateios : []
    const rateios = rateiosIn.filter(r => r && (r.categoriaId || r.centroCustoId) && Number(r.percentual) > 0)
    const usarRateio = rateios.length > 0

    let rateioData: { categoriaId: string | null; centroCustoId: string | null; percentual: number; valor: number }[] = []
    if (usarRateio) {
      const totalCent = Math.round(total * 100)
      let acumulado = 0
      rateioData = rateios.map((r, i) => {
        const pct = Number(r.percentual)
        const cent = i === rateios.length - 1 ? totalCent - acumulado : Math.round((totalCent * pct) / 100)
        acumulado += cent
        return { categoriaId: r.categoriaId || null, centroCustoId: r.centroCustoId || null, percentual: pct, valor: cent / 100 }
      })
    }

    const lanc = await db.lancamentoFinanceiro.create({
      data: {
        ...comum,
        descricao:       descricao.trim(),
        valor:           total,
        dataCompetencia: baseComp,
        dataVencimento:  baseVenc,
        dataPagamento:   dataPagamento ? new Date(dataPagamento) : null,
        // Quando rateado, a alocação vem dos rateios (não da categoria/centro do lançamento)
        ...(usarRateio ? { categoriaId: null, centroCustoId: null, rateios: { create: rateioData } } : {}),
      },
      include: INCLUDE,
    })
    await registrarAuditoria(usuario.id, "financeiro.lancamento.criar", `${tipo} · ${descricao.trim()} · R$ ${total.toFixed(2)}`, ipDaRequisicao(requisicao))
    return NextResponse.json(lanc, { status: 201 })
  }

  // ── Série (recorrência / parcelamento) ────────────────────────────────────
  const grupoRecorrenciaId = crypto.randomUUID()

  // valor de cada parcela (em centavos p/ evitar erro de ponto flutuante)
  let valores: number[]
  if (dividirValor) {
    const totalCent = Math.round(total * 100)
    const base = Math.floor(totalCent / n)
    valores = Array.from({ length: n }, (_, i) => (i === n - 1 ? totalCent - base * (n - 1) : base) / 100)
  } else {
    valores = Array.from({ length: n }, () => total)
  }

  const dados = Array.from({ length: n }, (_, i) => ({
    ...comum,
    descricao:       `${descricao.trim()} (${i + 1}/${n})`,
    valor:           valores[i],
    dataCompetencia: proximaData(baseComp, freq, i),
    dataVencimento:  baseVenc ? proximaData(baseVenc, freq, i) : null,
    dataPagamento:   null,
    recorrente:      true,
    frequencia:      freq,
    grupoRecorrenciaId,
    parcelaNum:      i + 1,
    parcelaTotal:    n,
  }))

  await db.lancamentoFinanceiro.createMany({ data: dados })
  await registrarAuditoria(usuario.id, "financeiro.lancamento.criar_serie", `${descricao.trim()} · ${n}x · R$ ${total.toFixed(2)}`, ipDaRequisicao(requisicao))
  return NextResponse.json({ ok: true, criados: n, grupoRecorrenciaId }, { status: 201 })
}
