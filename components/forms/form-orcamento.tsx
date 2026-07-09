"use client"
import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { useFormModal } from "@/lib/hooks/use-form-modal"
import { MESES } from "@/types/system"
import type { OpcaoSimples, OpcaoCategoria } from "@/components/forms/form-lancamento"

type Mode = "create" | "edit"

export interface OrcamentoData {
  id: string
  ano: number
  mes: number
  categoriaId?: string | null
  centroCustoId?: string | null
  valor: number | string
  categoria?: { nome: string; natureza: string; cor: string | null } | null
  centroCusto?: { nome: string } | null
  realizado?: number
}

interface Props {
  mode: Mode
  orcamento?: OrcamentoData
  categorias: OpcaoCategoria[]
  centros: OpcaoSimples[]
  anoPadrao: number
  trigger: React.ReactNode
}

const labelClass = "block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1"
const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
const selectClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 transition-all"

export function OrcamentoFormModal({ mode, orcamento, categorias, centros, anoPadrao, trigger }: Props) {
  const { open, setOpen, loading, setLoading, error, setError, close, closeAndRefresh } = useFormModal()

  const vazio = { ano: String(anoPadrao), mes: "0", categoriaId: "", centroCustoId: "", valor: "" }
  const [form, setForm] = useState(vazio)

  useEffect(() => {
    if (open && orcamento && mode === "edit") {
      setForm({
        ano: String(orcamento.ano),
        mes: String(orcamento.mes),
        categoriaId: orcamento.categoriaId ?? "",
        centroCustoId: orcamento.centroCustoId ?? "",
        valor: String(orcamento.valor),
      })
    } else if (open) {
      setForm({ ...vazio })
    }
    setError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.categoriaId && !form.centroCustoId) { setError("Escolha uma categoria e/ou centro de custo."); return }
    if (!form.valor || parseFloat(form.valor) <= 0) { setError("Informe o valor orçado."); return }

    setLoading(true)
    try {
      const url = mode === "create" ? "/api/financeiro/orcamentos" : `/api/financeiro/orcamentos/${orcamento!.id}`
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano: parseInt(form.ano),
          mes: parseInt(form.mes),
          categoriaId: form.categoriaId || null,
          centroCustoId: form.centroCustoId || null,
          valor: parseFloat(form.valor),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erro ao salvar orçamento."); return }
      closeAndRefresh()
    } catch { setError("Erro de conexão. Tente novamente.") } finally { setLoading(false) }
  }

  const anos = Array.from({ length: 5 }, (_, i) => anoPadrao - 1 + i)

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-serif text-base font-bold text-slate-900">{mode === "create" ? "Novo Orçamento" : "Editar Orçamento"}</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Ano</label>
                  <select value={form.ano} onChange={(e) => f("ano", e.target.value)} className={selectClass} disabled={mode === "edit"}>
                    {anos.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Período</label>
                  <select value={form.mes} onChange={(e) => f("mes", e.target.value)} className={selectClass} disabled={mode === "edit"}>
                    <option value="0">Ano inteiro</option>
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Categoria</label>
                <select value={form.categoriaId} onChange={(e) => f("categoriaId", e.target.value)} className={selectClass} disabled={mode === "edit"}>
                  <option value="">— Todas / nenhuma —</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Centro de Custo</label>
                <select value={form.centroCustoId} onChange={(e) => f("centroCustoId", e.target.value)} className={selectClass} disabled={mode === "edit"}>
                  <option value="">— Todos / nenhum —</option>
                  {centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Valor Orçado (R$) <span className="text-red-400">*</span></label>
                <input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => f("valor", e.target.value)} className={inputClass} placeholder="0,00" />
              </div>

              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={close} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}{mode === "create" ? "Criar Orçamento" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
