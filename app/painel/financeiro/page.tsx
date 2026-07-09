import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PapelUsuario } from "@prisma/client"
import {
  Wallet, TrendingUp, TrendingDown, Clock, AlertCircle, ArrowRight, CalendarClock,
  ArrowUpCircle, ArrowDownCircle, Sparkles,
} from "lucide-react"
import { LancamentoFormModal } from "@/components/forms/form-lancamento"

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const num = (v: { toString(): string } | null | undefined) => Number(v ?? 0)
const dataBR = (d: Date | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—")

export default async function FinanceiroDashboard() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const escopo = superAdmin ? {} : { empresaId }
  const escopoAtivo = superAdmin ? { ativo: true } : { empresaId, ativo: true }
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)

  const [
    contasAgg, recPagas, despPagas, recMes, despMes, aReceber, aPagar, qtdAtraso, proximos,
    contatos, contas, categorias, centros,
  ] = await Promise.all([
    db.contaFinanceira.aggregate({ _sum: { saldoInicial: true }, where: escopo }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, tipo: "receita", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, tipo: "despesa", status: "pago" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, tipo: "receita", status: "pago", dataCompetencia: { gte: inicioMes, lte: fimMes } } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, tipo: "despesa", status: "pago", dataCompetencia: { gte: inicioMes, lte: fimMes } } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, tipo: "receita", status: "pendente" } }),
    db.lancamentoFinanceiro.aggregate({ _sum: { valor: true }, where: { ...escopo, tipo: "despesa", status: "pendente" } }),
    db.lancamentoFinanceiro.count({ where: { ...escopo, status: "pendente", dataVencimento: { lt: hoje } } }),
    db.lancamentoFinanceiro.findMany({
      where: { ...escopo, status: "pendente", dataVencimento: { gte: hoje } },
      orderBy: { dataVencimento: "asc" },
      take: 6,
      include: { contato: { select: { nome: true } }, categoria: { select: { nome: true } } },
    }),
    db.contatoFinanceiro.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.contaFinanceira.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.categoriaFinanceira.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true, natureza: true } }),
    db.centroCusto.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ])

  const saldoTotal = num(contasAgg._sum.saldoInicial) + num(recPagas._sum.valor) - num(despPagas._sum.valor)

  const kpis = [
    { label: "Saldo Consolidado", value: brl(saldoTotal), icon: Wallet, color: saldoTotal < 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-brand-50 text-brand-600 border-brand-100" },
    { label: "Receitas do Mês", value: brl(num(recMes._sum.valor)), icon: TrendingUp, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { label: "Despesas do Mês", value: brl(num(despMes._sum.valor)), icon: TrendingDown, color: "bg-red-50 text-red-600 border-red-100" },
    { label: "A Receber", value: brl(num(aReceber._sum.valor)), icon: Clock, color: "bg-blue-50 text-blue-600 border-blue-100" },
    { label: "A Pagar", value: brl(num(aPagar._sum.valor)), icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100" },
    { label: "Em Atraso", value: `${qtdAtraso} conta${qtdAtraso !== 1 ? "s" : ""}`, icon: AlertCircle, color: qtdAtraso > 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100" },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet size={22} className="text-brand-500" /> Financeiro
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Visão geral do fluxo de caixa</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <LancamentoFormModal mode="create" tipoInicial="receita" contatos={contatos} contas={contas} categorias={categorias} centros={centros} trigger={
                <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-emerald-200"><ArrowUpCircle size={16} /> Receita</button>
              } />
              <LancamentoFormModal mode="create" tipoInicial="despesa" contatos={contatos} contas={contas} categorias={categorias} centros={centros} trigger={
                <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-red-200"><ArrowDownCircle size={16} /> Despesa</button>
              } />
            </>
          )}
          <Link href="/painel/financeiro/resumo" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200">
            <Sparkles size={16} /> Análise do Mês
          </Link>
          <Link href="/painel/financeiro/lancamentos" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            Ver Lançamentos <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{k.label}</span>
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${k.color}`}><Icon size={16} /></div>
              </div>
              <div className="valor-sensivel font-serif text-lg font-bold text-slate-900 truncate">{k.value}</div>
            </div>
          )
        })}
      </div>

      {/* Próximos vencimentos */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <CalendarClock size={18} className="text-brand-500" />
          <h2 className="font-serif text-base font-bold text-slate-900">Próximos Vencimentos</h2>
        </div>
        {proximos.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Nenhuma conta a vencer. 🎉</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {proximos.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-6 py-3.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${l.tipo === "receita" ? "bg-emerald-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 truncate">{l.descricao}</p>
                  <p className="text-xs text-slate-400">{l.contato?.nome ?? l.categoria?.nome ?? "—"}</p>
                </div>
                <span className="text-xs text-slate-400 hidden sm:block">{dataBR(l.dataVencimento)}</span>
                <span className={`valor-sensivel font-semibold text-sm ${l.tipo === "receita" ? "text-emerald-600" : "text-red-500"}`}>{brl(num(l.valor))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
