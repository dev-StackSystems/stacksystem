"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"

type Mode = "create" | "edit"

export interface BaixaData {
  id: string
  matriculaId?: string | null
  descricao?: string | null
  valor: number | string
  tipo: string
  status: string
  dataPagamento?: Date | string | null
  dataVencimento?: Date | string | null
  criadoEm: Date | string
  matricula?: {
    aluno: { nome: string }
    curso: { nome: string }
  } | null
}

export interface MatriculaSimples {
  id: string
  aluno: { nome: string }
  curso: { nome: string }
}

interface Props {
  mode: Mode
  baixa?: BaixaData
  matriculas: MatriculaSimples[]
  trigger: React.ReactNode
}

function toDateInputValue(value?: Date | string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

const labelClass = "block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1"
const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
const selectClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 transition-all"

export function BaixaFormModal({ mode, baixa, matriculas, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const emptyForm = {
    matriculaId: "",
    descricao: "",
    valor: "",
    tipo: "mensalidade",
    status: "pendente",
    dataPagamento: "",
    dataVencimento: "",
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open && baixa && mode === "edit") {
      setForm({
        matriculaId: baixa.matriculaId ?? "",
        descricao: baixa.descricao ?? "",
        valor: String(baixa.valor),
        tipo: baixa.tipo,
        status: baixa.status,
        dataPagamento: toDateInputValue(baixa.dataPagamento),
        dataVencimento: toDateInputValue(baixa.dataVencimento),
      })
    } else if (open) {
      setForm(emptyForm)
    }
    setError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.valor === "" || form.valor === undefined) {
      setError("Valor é obrigatório.")
      return
    }

    setLoading(true)
    try {
      const url = mode === "create" ? "/api/baixas" : `/api/baixas/${baixa!.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matriculaId: form.matriculaId || null,
          descricao: form.descricao || null,
          valor: parseFloat(form.valor),
          tipo: form.tipo,
          status: form.status,
          dataPagamento: form.dataPagamento || null,
          dataVencimento: form.dataVencimento || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar baixa.")
        return
      }

      setOpen(false)
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-serif text-base font-bold text-slate-900">
                {mode === "create" ? "Nova Baixa" : "Editar Baixa"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              {/* Matrícula (full) */}
              <div>
                <label className={labelClass}>
                  Matrícula <span className="text-slate-300 font-normal normal-case tracking-normal">(opcional)</span>
                </label>
                <select
                  value={form.matriculaId}
                  onChange={(e) => setForm((f) => ({ ...f, matriculaId: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Nenhuma matrícula vinculada</option>
                  {matriculas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.aluno.nome} — {m.curso.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo | Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Tipo <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="mensalidade">Mensalidade</option>
                    <option value="matricula">Matrícula</option>
                    <option value="certificado">Certificado</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Valor (full) */}
              <div>
                <label className={labelClass}>
                  Valor (R$) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00"
                  className={inputClass}
                />
              </div>

              {/* Vencimento | Pagamento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Data de Vencimento</label>
                  <input
                    type="date"
                    value={form.dataVencimento}
                    onChange={(e) => setForm((f) => ({ ...f, dataVencimento: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Data de Pagamento</label>
                  <input
                    type="date"
                    value={form.dataPagamento}
                    onChange={(e) => setForm((f) => ({ ...f, dataPagamento: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Descrição (full) */}
              <div>
                <label className={labelClass}>Descrição</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Mensalidade Janeiro/2026"
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {mode === "create" ? "Criar Baixa" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
