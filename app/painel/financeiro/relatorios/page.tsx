import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { RelatorioFiltros } from "@/components/financeiro/relatorio-filtros"
import { FileBarChart, TrendingUp, TrendingDown, Scale } from "lucide-react"

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

  const [recPagas, despPagas, aReceber, aPagar, grupos, categorias] = await Promise.all([
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, ...periodo, tipo: "receita", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, ...periodo, tipo: "despesa", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, ...periodo, tipo: "receita", status: "pendente" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, ...periodo, tipo: "despesa", status: "pendente" } }),
    db.lancamentoFinanceiro.groupBy({ by: ["categoriaId", "tipo"], _sum: { valor: true }, where: { ...escopo, ...periodo, status: "pago" } }),
    db.categoriaFinanceira.findMany({ where: escopo, select: { id: true, nome: true, cor: true } }),
  ])

  const receitas = num(recPagas._sum.valor)
  const despesas = num(despPagas._sum.valor)
  const saldo = receitas - despesas
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
        <p className="text-sm text-slate-400 mt-0.5">Fluxo de caixa e DRE simplificado por período</p>
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
