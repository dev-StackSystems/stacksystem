/**
 * app/api/financeiro/relatorios/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Relatórios financeiros por período.
 *
 * GET /api/financeiro/relatorios?de=YYYY-MM-DD&ate=YYYY-MM-DD
 *      → JSON: { resumo, porCategoria }
 *
 * GET /api/financeiro/relatorios?...&formato=csv
 *      → download CSV (separador ";", BOM UTF-8 p/ Excel) dos lançamentos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"

const fmtData = (d: Date | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "")
const fmtValor = (v: { toString(): string }) =>
  Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function csvCampo(s: string): string {
  const t = (s ?? "").replace(/"/g, '""')
  return /[;"\n]/.test(t) ? `"${t}"` : t
}

export async function GET(req: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const de = sp.get("de"), ate = sp.get("ate"), formato = sp.get("formato")

  const where: Record<string, unknown> = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }
  if (de || ate) {
    where.dataCompetencia = {
      ...(de  ? { gte: new Date(de) }  : {}),
      ...(ate ? { lte: new Date(ate + "T23:59:59") } : {}),
    }
  }

  // ── Exportação CSV ─────────────────────────────────────────────────────────
  if (formato === "csv") {
    const lancs = await db.lancamentoFinanceiro.findMany({
      where,
      orderBy: { dataCompetencia: "asc" },
      include: {
        contato:   { select: { nome: true } },
        conta:     { select: { nome: true } },
        categoria: { select: { nome: true } },
      },
    })
    const cab = ["Competência", "Vencimento", "Pagamento", "Tipo", "Descrição", "Valor", "Status", "Categoria", "Conta", "Contato", "Documento"]
    const linhas = lancs.map((l) =>
      [
        fmtData(l.dataCompetencia), fmtData(l.dataVencimento), fmtData(l.dataPagamento),
        l.tipo, l.descricao, fmtValor(l.valor), l.status,
        l.categoria?.nome ?? "", l.conta?.nome ?? "", l.contato?.nome ?? "", l.documento ?? "",
      ].map(csvCampo).join(";"),
    )
    const csv = "﻿" + [cab.join(";"), ...linhas].join("\r\n")
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="financeiro-${de || "inicio"}-${ate || "fim"}.csv"`,
      },
    })
  }

  // ── Resumo JSON ──────────────────────────────────────────────────────────────
  const [recPago, despPago, recPend, despPend, porCategoria] = await Promise.all([
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...where, tipo: "receita", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...where, tipo: "despesa", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...where, tipo: "receita", status: "pendente" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...where, tipo: "despesa", status: "pendente" } }),
    db.lancamentoFinanceiro.groupBy({ by: ["categoriaId", "tipo"], _sum: { valor: true }, where: { ...where, status: "pago" } }),
  ])

  const num = (v: { toString(): string } | null | undefined) => Number(v ?? 0)
  const receitas = num(recPago._sum.valor)
  const despesas = num(despPago._sum.valor)

  return NextResponse.json({
    resumo: {
      receitas,
      despesas,
      saldo: receitas - despesas,
      aReceber: num(recPend._sum.valor),
      aPagar: num(despPend._sum.valor),
    },
    porCategoria: porCategoria.map((g) => ({
      categoriaId: g.categoriaId,
      tipo: g.tipo,
      total: num(g._sum.valor),
    })),
  })
}
