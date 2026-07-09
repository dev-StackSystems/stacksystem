/**
 * app/api/financeiro/resumo/route.ts
 * Resumo Inteligente do mês — agrega os lançamentos e gera análise (IA + fallback).
 * GET ?ano=YYYY&mes=1..12
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { resumoPessoal, type LancParaResumo } from "@/lib/financeiro"
import { analisarFinancas } from "@/lib/ia"
import { MESES } from "@/types/system"

export async function GET(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const params = requisicao.nextUrl.searchParams
  const agora = new Date()
  const ano = Number(params.get("ano")) || agora.getFullYear()
  const mesParam = Number(params.get("mes"))
  const mes = mesParam >= 1 && mesParam <= 12 ? mesParam - 1 : agora.getMonth() // 0..11

  const inicio = new Date(ano, mes, 1)
  const fim = new Date(ano, mes + 1, 0, 23, 59, 59)
  const inicioAnt = new Date(ano, mes - 1, 1)
  const fimAnt = new Date(ano, mes, 0, 23, 59, 59)

  const escopo = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }

  const empresa =
    !usuario.superAdmin && usuario.empresaId
      ? await db.empresa.findUnique({ where: { id: usuario.empresaId }, select: { gestaoFinanceira: true } })
      : null
  const gestao: "PF" | "PJ" = empresa?.gestaoFinanceira === "PJ" ? "PJ" : "PF"

  const [lancs, recAnt, despAnt] = await Promise.all([
    db.lancamentoFinanceiro.findMany({
      where: { ...escopo, status: { not: "cancelado" }, dataCompetencia: { gte: inicio, lte: fim } },
      select: { tipo: true, valor: true, categoria: { select: { nome: true, classe: true } } },
    }),
    db.lancamentoFinanceiro.aggregate({
      _sum: { valor: true },
      where: { ...escopo, tipo: "receita", status: { not: "cancelado" }, dataCompetencia: { gte: inicioAnt, lte: fimAnt } },
    }),
    db.lancamentoFinanceiro.aggregate({
      _sum: { valor: true },
      where: { ...escopo, tipo: "despesa", status: { not: "cancelado" }, dataCompetencia: { gte: inicioAnt, lte: fimAnt } },
    }),
  ])

  const entrada: LancParaResumo[] = lancs.map((l) => ({
    tipo: l.tipo,
    valor: Number(l.valor),
    classe: l.categoria?.classe ?? null,
    categoriaNome: l.categoria?.nome ?? null,
  }))

  const stats = resumoPessoal(entrada)

  const despAntNum = Number(despAnt._sum.valor ?? 0)
  const recAntNum = Number(recAnt._sum.valor ?? 0)
  const mesAnterior = despAntNum + recAntNum > 0 ? { despesas: despAntNum, sobra: recAntNum - despAntNum } : null

  const mesLabel = `${MESES[mes]} de ${ano}`

  const analise = await analisarFinancas({
    mesLabel,
    gestao,
    receitas: stats.receitas,
    despesas: stats.despesas,
    sobra: stats.sobra,
    taxaPoupanca: stats.taxaPoupanca,
    porClasse: stats.porClasse,
    topCategorias: stats.topCategorias,
    mesAnterior,
  })

  return NextResponse.json({
    mesLabel,
    gestao,
    stats,
    mesAnterior,
    texto: analise.texto,
    fonte: analise.fonte,
    temDados: lancs.length > 0,
  })
}
