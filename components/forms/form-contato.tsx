"use client"
import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { useFormModal } from "@/lib/hooks/use-form-modal"
import { TIPOS_PESSOA, PAPEIS_CONTATO, formatarDocumento } from "@/lib/financeiro"

type Mode = "create" | "edit"

export interface ContatoData {
  id: string
  nome: string
  tipoPessoa: string
  documento?: string | null
  email?: string | null
  telefone?: string | null
  papel: string
  ativo: boolean
  _count?: { lancamentos: number }
}

interface Props {
  mode: Mode
  contato?: ContatoData
  trigger: React.ReactNode
}

const labelClass = "block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1"
const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
const selectClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 transition-all"

const EMPTY = { nome: "", tipoPessoa: "PF", documento: "", email: "", telefone: "", papel: "cliente" }

export function ContatoFormModal({ mode, contato, trigger }: Props) {
  const { open, setOpen, loading, setLoading, error, setError, close, closeAndRefresh } = useFormModal()
  const [form, setForm] = useState(EMPTY)
  const [ativo, setAtivo] = useState(true)

  useEffect(() => {
    if (open && contato && mode === "edit") {
      setForm({
        nome: contato.nome,
        tipoPessoa: contato.tipoPessoa,
        documento: formatarDocumento(contato.tipoPessoa, contato.documento),
        email: contato.email ?? "",
        telefone: contato.telefone ?? "",
        papel: contato.papel,
      })
      setAtivo(contato.ativo)
    } else if (open) {
      setForm(EMPTY)
      setAtivo(true)
    }
    setError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.nome.trim()) { setError("Nome é obrigatório."); return }

    setLoading(true)
    try {
      const url = mode === "create" ? "/api/financeiro/contatos" : `/api/financeiro/contatos/${contato!.id}`
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(mode === "edit" ? { ativo } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erro ao salvar contato."); return }
      closeAndRefresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const ehPJ = form.tipoPessoa === "PJ"

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-serif text-base font-bold text-slate-900">
                {mode === "create" ? "Novo Contato" : "Editar Contato"}
              </h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              <div>
                <label className={labelClass}>Nome / Razão Social <span className="text-red-400">*</span></label>
                <input value={form.nome} onChange={(e) => f("nome", e.target.value)} className={inputClass} placeholder="Nome do cliente ou fornecedor" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tipo de Pessoa</label>
                  <select value={form.tipoPessoa} onChange={(e) => f("tipoPessoa", e.target.value)} className={selectClass}>
                    {TIPOS_PESSOA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{ehPJ ? "CNPJ" : "CPF"}</label>
                  <input
                    value={form.documento}
                    onChange={(e) => f("documento", e.target.value)}
                    onBlur={(e) => f("documento", formatarDocumento(form.tipoPessoa, e.target.value))}
                    className={`${inputClass} font-mono text-xs`}
                    placeholder={ehPJ ? "00.000.000/0000-00" : "000.000.000-00"}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Relação</label>
                <select value={form.papel} onChange={(e) => f("papel", e.target.value)} className={selectClass}>
                  {PAPEIS_CONTATO.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => f("email", e.target.value)} className={inputClass} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input value={form.telefone} onChange={(e) => f("telefone", e.target.value)} className={inputClass} placeholder="(00) 00000-0000" />
                </div>
              </div>

              {mode === "edit" && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <button type="button" onClick={() => setAtivo((v) => !v)}
                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${ativo ? "bg-emerald-500" : "bg-slate-300"}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${ativo ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700">{ativo ? "Contato ativo" : "Contato inativo"}</span>
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={close} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {mode === "create" ? "Criar Contato" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
