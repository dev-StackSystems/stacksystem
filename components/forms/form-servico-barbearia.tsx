"use client"
import { useState, useEffect } from "react"
import { X, Loader2, Scissors } from "lucide-react"
import { useFormModal } from "@/lib/hooks/use-form-modal"
import { useToast } from "@/components/layout/provedor-toast"
import { CORES_BARBEARIA } from "@/lib/barbearia"

type Mode = "create" | "edit"

export interface ServicoData {
  id: string
  nome: string
  duracaoMin: number
  preco: number | string
  cor?: string | null
  ativo: boolean
  _count?: { agendamentos: number }
}

interface Props { mode: Mode; servico?: ServicoData; trigger: React.ReactNode }

const labelClass = "block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1"
const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"

const EMPTY = { nome: "", duracaoMin: "30", preco: "", cor: CORES_BARBEARIA[0] }

export function ServicoFormModal({ mode, servico, trigger }: Props) {
  const { open, setOpen, loading, setLoading, error, setError, close, closeAndRefresh } = useFormModal()
  const { toast } = useToast()
  const [form, setForm] = useState(EMPTY)
  const [ativo, setAtivo] = useState(true)

  useEffect(() => {
    if (open && servico && mode === "edit") {
      setForm({ nome: servico.nome, duracaoMin: String(servico.duracaoMin), preco: String(servico.preco), cor: servico.cor ?? CORES_BARBEARIA[0] })
      setAtivo(servico.ativo)
    } else if (open) { setForm(EMPTY); setAtivo(true) }
    setError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.nome.trim()) { setError("Dê um nome ao serviço."); return }
    setLoading(true)
    try {
      const url = mode === "create" ? "/api/barbearia/servicos" : `/api/barbearia/servicos/${servico!.id}`
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(mode === "edit" ? { ativo } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) { const msg = data.error ?? "Erro ao salvar serviço."; setError(msg); toast(msg, "erro"); return }
      toast(mode === "create" ? "Serviço criado!" : "Serviço atualizado!", "sucesso")
      closeAndRefresh()
    } catch { const msg = "Erro de conexão. Tente novamente."; setError(msg); toast(msg, "erro") } finally { setLoading(false) }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
                <Scissors size={16} className="text-brand-500" /> {mode === "create" ? "Novo Serviço" : "Editar Serviço"}
              </h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              <div>
                <label className={labelClass}>Nome do serviço <span className="text-red-400">*</span></label>
                <input value={form.nome} onChange={(e) => f("nome", e.target.value)} className={inputClass} placeholder="Ex: Corte, Barba, Corte + Barba..." autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Duração (minutos)</label>
                  <input type="number" min="5" step="5" value={form.duracaoMin} onChange={(e) => f("duracaoMin", e.target.value)} className={inputClass} placeholder="30" />
                </div>
                <div>
                  <label className={labelClass}>Preço (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.preco} onChange={(e) => f("preco", e.target.value)} className={inputClass} placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Cor na agenda</label>
                <div className="flex flex-wrap gap-2">
                  {CORES_BARBEARIA.map((c) => (
                    <button key={c} type="button" onClick={() => f("cor", c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.cor === c ? "border-slate-800 scale-110" : "border-white shadow"}`}
                      style={{ background: c }} aria-label={`Cor ${c}`} />
                  ))}
                </div>
              </div>

              {mode === "edit" && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <button type="button" onClick={() => setAtivo((v) => !v)} className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${ativo ? "bg-emerald-500" : "bg-slate-300"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ativo ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">{ativo ? "Serviço ativo" : "Serviço inativo"}</span>
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={close} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}{mode === "create" ? "Criar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
