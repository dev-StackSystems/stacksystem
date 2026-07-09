import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { RelatorioFiltros } from "@/components/financeiro/relatorio-filtros"
import { FileBarChart, TrendingUp, TrendingDown, Scale, LineChart, Wallet } from "lucide-react"

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const num = (v: { toString(): string } | null | undefined) => Number(v ?? 0)
const iso = (d: Date) => d.toISOString().slice(0, 10)

interface Props { searchParams: Promise<{ de?: string; ate?: string }> }

export default async function RelatoriosPage({ searchParams }: Props) {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const escopo = superAdmin ? {} : { empresaId }

  const sp = await searchParams
  const hoje = new Date()
  const de = sp.de || iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const ate = sp.ate || iso(hoje)
  const periodo = { dataCompetencia: { gte: new Date(de), lte: new Date(ate + "T23:59:59") } }

  // Janela de projeção do fluxo de caixa: 12 meses a partir do mês atual
  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimProjecao    = new Date(hoje.getFullYear(), hoje.getMonth() + 12, 0, 23, 59, 59)

  const [recPagas, despPagas, aReceber, aPagar, grupos, categorias, contaAgg, recTotal, despTotal, pendentesFuturos] = await Promise.all([
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, ...periodo, tipo: "receita", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, ...periodo, tipo: "despesa", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, ...periodo, tipo: "receita", status: "pendente" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, ...periodo, tipo: "despesa", status: "pendente" } }),
    db.lancamentoFinanceiro.groupBy({ by: ["categoriaId", "tipo"], _sum: { valor: true }, where: { ...escopo, ...periodo, status: "pago" } }),
    db.categoriaFinanceira.findMany({ where: escopo, select: { id: true, nome: true, cor: true } }),
    db.contaFinanceira.aggregate({ _sum: { saldoInicial: true }, where: escopo }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, tipo: "receita", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, tipo: "despesa", status: "pago" } }),
    db.lancamentoFinanceiro.findMany({ where: { ...escopo, status: "pendente", dataVencimento: { gte: inicioMesAtual, lte: fimProjecao } }, select: { tipo: true, valor: true, dataVencimento: true } }),
  ])

  const receitas = num(recPagas._sum.valor)
  const despesas = num(despPagas._sum.valor)
  const saldo = receitas - despesas

  // ── Fluxo de caixa projetado (saldo atual + pendentes por mês de vencimento) ──
  const saldoAtual = num(contaAgg._sum.saldoInicial) + num(recTotal._sum.valor) - num(despTotal._sum.valor)
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
    return { rotulo: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), entradas: 0, saidas: 0 }
  })
  for (const l of pendentesFuturos) {
    if (!l.dataVencimento) continue
    const dv = new Date(l.dataVencimento)
    const idx = (dv.getFullYear() - hoje.getFullYear()) * 12 + (dv.getMonth() - hoje.getMonth())
    if (idx < 0 || idx > 11) continue
    if (l.tipo === "receita") meses[idx].entradas += num(l.valor)
    else meses[idx].saidas += num(l.valor)
  }
  let saldoRun = saldoAtual
  const projecao = meses.map((m) => { saldoRun += m.entradas - m.saidas; return { ...m, saldo: saldoRun } })
  const marcos = [
    { label: "Saldo hoje",  valor: saldoAtual },
    { label: "Em 3 meses",  valor: projecao[2]?.saldo ?? saldoAtual },
    { label: "Em 6 meses",  valor: projecao[5]?.saldo ?? saldoAtual },
    { label: "Em 12 meses", valor: projecao[11]?.saldo ?? saldoAtual },
  ]
  const nomeCat = (id: string | null) => (id ? categorias.find((c) => c.id === id)?.nome ?? "Sem categoria" : "Sem categoria")
  const corCat = (id: string | null) => (id ? categorias.find((c) => c.id === id)?.cor ?? "#94a3b8" : "#94a3b8")

  const linhasReceita = grupos.filter((g) => g.tipo === "receita").map((g) => ({ nome: nomeCat(g.categoriaId), cor: corCat(g.categoriaId), total: num(g._sum.valor) })).sort((a, b) => b.total - a.total)
  const linhasDespesa = grupos.filter((g) => g.tipo === "despesa").map((g) => ({ nome: nomeCat(g.categoriaId), cor: corCat(g.categoriaId), total: num(g._sum.valor) })).sort((a, b) => b.total - a.total)

  const resumo = [
    { label: "Receitas (pagas)", value: brl(receitas), icon: TrendingUp, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { label: "Despesas (pagas)", value: brl(despesas), icon: TrendingDown, color: "bg-red-50 text-red-600 border-red-100" },
    { label: "Resultado (DRE)", value: brl(saldo), icon: Scale, color: saldo < 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-brand-50 text-brand-600 border-brand-100" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileBarChart size={22} className="text-brand-500" /> Relatórios
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">DRE gerencial, fluxo de caixa e projeção de saldo</p>
      </div>

      <RelatorioFiltros de={de} ate={ate} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {resumo.map((r) => {
          const Icon = r.icon
          return (
            <div key={r.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{r.label}</span>
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${r.color}`}><Icon size={16} /></div>
              </div>
              <div className="font-serif text-xl font-bold text-slate-900">{r.value}</div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 mb-4">A receber no período: <span className="font-semibold text-slate-600">{brl(num(aReceber._sum.valor))}</span> · A pagar: <span className="font-semibold text-slate-600">{brl(num(aPagar._sum.valor))}</span></p>

      {/* ── Fluxo de Caixa Projetado ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <LineChart size={18} className="text-brand-500" />
          <h2 className="font-serif text-base font-bold text-slate-900">Fluxo de Caixa Projetado</h2>
          <span className="text-xs text-slate-400 hidden sm:inline">— saldo atual + contas a pagar/receber por vencimento</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {marcos.map((m) => (
            <div key={m.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">{m.label}</span>
                <Wallet size={14} className="text-slate-300" />
              </div>
              <div className={`font-serif text-xl font-bold ${m.valor < 0 ? "text-red-500" : "text-slate-900"}`}>{brl(m.valor)}</div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Mês</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Entradas previstas</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Saídas previstas</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo projetado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projecao.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-2.5 font-medium text-slate-700 capitalize">{m.rotulo}</td>
                  <td className="px-6 py-2.5 text-right text-emerald-600">{m.entradas ? brl(m.entradas) : "—"}</td>
                  <td className="px-6 py-2.5 text-right text-red-500">{m.saidas ? brl(m.saidas) : "—"}</td>
                  <td className={`px-6 py-2.5 text-right font-semibold ${m.saldo < 0 ? "text-red-500" : "text-slate-800"}`}>{brl(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BlocoCategoria titulo="Receitas por categoria" linhas={linhasReceita} total={receitas} vazio="Sem receitas no período." />
        <BlocoCategoria titulo="Despesas por categoria" linhas={linhasDespesa} total={despesas} vazio="Sem despesas no período." />
      </div>
    </div>
  )
}

function BlocoCategoria({ titulo, linhas, total, vazio }: { titulo: string; linhas: { nome: string; cor: string; total: number }[]; total: number; vazio: string }) {
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100"><h2 className="font-serif text-base font-bold text-slate-900">{titulo}</h2></div>
      {linhas.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-400">{vazio}</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {linhas.map((l) => {
            const pct = total > 0 ? Math.round((l.total / total) * 100) : 0
            return (
              <div key={l.nome} className="px-6 py-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.cor }} />
                  <span className="text-sm font-medium text-slate-700 flex-1">{l.nome}</span>
                  <span className="text-sm font-semibold text-slate-900">{brl(l.total)}</span>
                  <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: l.cor }} /></div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
