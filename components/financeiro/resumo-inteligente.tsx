"use client"

import { useState } from "react"
import {
  Sparkles, Loader2, TrendingUp, TrendingDown, Wallet, PiggyBank, Cpu, Gauge,
} from "lucide-react"
import { MESES } from "@/types/system"
import { CLASSES_CATEGORIA, metaClasse, type ClasseCategoria } from "@/lib/financeiro"

// ── Tipos da resposta da API ─────────────────────────────────────────────────
interface Stats {
  receitas: number
  despesas: number
  sobra: number
  taxaPoupanca: number
  porClasse: Record<ClasseCategoria, number>
  topCategorias: { nome: string; valor: number }[]
}
interface Resposta {
  mesLabel: string
  gestao: "PF" | "PJ"
  stats: Stats
  texto: string
  fonte: "ia" | "local"
  temDados: boolean
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const pct = (v: number) => `${Math.round(v * 100)}%`

// Renderiza **negrito**, quebras de linha e listas com "- "
function renderTexto(texto: string) {
  return texto.split("\n").map((linha, i) => {
    const bullet = linha.trimStart().startsWith("- ")
    const conteudo = bullet ? linha.trimStart().slice(2) : linha
    const partes = conteudo.split(/\*\*(.*?)\*\*/g)
    const inner = partes.map((p, j) => (j % 2 === 1 ? <strong key={j} className="text-slate-800">{p}</strong> : <span key={j}>{p}</span>))
    if (bullet) return <li key={i} className="ml-4 list-disc text-slate-600">{inner}</li>
    if (!linha.trim()) return <div key={i} className="h-2" />
    return <p key={i} className="text-slate-600">{inner}</p>
  })
}

export function ResumoInteligente({ gestao }: { gestao: "PF" | "PJ" }) {
  const agora = new Date()
  const [ano, setAno] = useState(agora.getFullYear())
  const [mes, setMes] = useState(agora.getMonth() + 1) // 1..12
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [data, setData] = useState<Resposta | null>(null)

  const gerar = async () => {
    setLoading(true)
    setErro("")
    try {
      const res = await fetch(`/api/financeiro/resumo?ano=${ano}&mes=${mes}`)
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? "Erro ao gerar o resumo."); return }
      setData(json)
    } catch { setErro("Erro de conexão. Tente novamente.") } finally { setLoading(false) }
  }

  const anos = [agora.getFullYear(), agora.getFullYear() - 1, agora.getFullYear() - 2]
  const s = data?.stats

  // Segmentos da barra de divisão dos gastos
  const segmentos = s
    ? (["essencial", "lazer", "investimento", "neutro"] as ClasseCategoria[])
        .map((k) => ({ k, valor: s.porClasse[k], meta: metaClasse(k) }))
        .filter((x) => x.valor > 0)
    : []
  const maiorCat = s?.topCategorias[0]?.valor ?? 0

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1">Mês</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400">
              {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1">Ano</label>
            <select value={ano} onChange={(e) => setAno(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400">
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={gerar} disabled={loading}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Analisando…" : data ? "Atualizar análise" : "Gerar análise"}
          </button>
        </div>
        {erro && <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">{erro}</div>}
      </div>

      {/* Estado inicial */}
      {!data && !loading && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={26} className="text-brand-500" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-800">Seu resumo inteligente do mês</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {gestao === "PF"
              ? "Cadastre seu salário e seus gastos, escolha o mês e gere uma análise com a divisão entre essencial e lazer, além de recomendações personalizadas."
              : "Escolha o período e gere uma análise do fluxo do mês, com destaques de gastos e recomendações."}
          </p>
        </div>
      )}

      {data && s && (
        <>
          {/* Sem dados no mês */}
          {!data.temDados && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
              Nenhum lançamento em <strong>{data.mesLabel}</strong>. Registre suas receitas e despesas para uma análise completa.
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label={gestao === "PF" ? "Renda" : "Receitas"} valor={brl(s.receitas)} icon={TrendingUp} cor="bg-emerald-50 text-emerald-600 border-emerald-100" />
            <KpiCard label="Gastos" valor={brl(s.despesas)} icon={TrendingDown} cor="bg-red-50 text-red-600 border-red-100" />
            <KpiCard label="Sobra" valor={brl(s.sobra)} icon={Wallet} cor={s.sobra < 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-brand-50 text-brand-600 border-brand-100"} />
            <KpiCard label="Taxa de poupança" valor={pct(s.taxaPoupanca)} icon={Gauge} cor="bg-blue-50 text-blue-600 border-blue-100" sensivel={false} />
          </div>

          {/* Divisão dos gastos */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <PiggyBank size={18} className="text-brand-500" />
              <h3 className="font-serif text-base font-bold text-slate-900">Para onde foi o dinheiro</h3>
            </div>
            {s.despesas > 0 ? (
              <>
                <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
                  {segmentos.map((seg) => (
                    <div key={seg.k} style={{ width: `${(seg.valor / s.despesas) * 100}%`, background: seg.meta.cor }} title={`${seg.meta.label}: ${brl(seg.valor)}`} />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CLASSES_CATEGORIA.map((c) => {
                    const valor = s.porClasse[c.value]
                    return (
                      <div key={c.value} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.cor }} />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 truncate">{c.emoji} {c.label}</p>
                          <p className="valor-sensivel text-sm font-semibold text-slate-800">{brl(valor)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Nenhuma despesa registrada no período.</p>
            )}
          </div>

          {/* Maiores gastos + Análise */}
          <div className="grid lg:grid-cols-5 gap-6">
            {s.topCategorias.length > 0 && (
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-5">
                <h3 className="font-serif text-base font-bold text-slate-900 mb-4">Maiores gastos</h3>
                <div className="space-y-3">
                  {s.topCategorias.map((c) => (
                    <div key={c.nome}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 truncate">{c.nome}</span>
                        <span className="valor-sensivel font-semibold text-slate-800">{brl(c.valor)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-brand-400" style={{ width: `${maiorCat > 0 ? (c.valor / maiorCat) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`${s.topCategorias.length > 0 ? "lg:col-span-3" : "lg:col-span-5"} bg-white border border-slate-100 rounded-2xl shadow-sm p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-500" />
                  <h3 className="font-serif text-base font-bold text-slate-900">Análise de {data.mesLabel}</h3>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${data.fonte === "ia" ? "bg-brand-50 text-brand-600 border border-brand-100" : "bg-slate-100 text-slate-500"}`}>
                  <Cpu size={11} /> {data.fonte === "ia" ? "Gerado por IA" : "Análise automática"}
                </span>
              </div>
              <div className="text-sm leading-relaxed space-y-1">{renderTexto(data.texto)}</div>
              {data.fonte === "local" && (
                <p className="mt-4 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  Dica: configure <code className="font-mono">GEMINI_API_KEY</code> (grátis no Google AI Studio) nas variáveis de ambiente para análises geradas por IA.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ label, valor, icon: Icon, cor, sensivel = true }: {
  label: string; valor: string; icon: typeof Wallet; cor: string; sensivel?: boolean
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${cor}`}><Icon size={16} /></div>
      </div>
      <div className={`${sensivel ? "valor-sensivel" : ""} font-serif text-lg font-bold text-slate-900 truncate`}>{valor}</div>
    </div>
  )
}
