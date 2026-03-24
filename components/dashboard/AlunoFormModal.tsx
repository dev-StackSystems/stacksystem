"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"

type Mode = "create" | "edit"

interface AlunoData {
  id: string
  nome: string
  email: string
  cpf?: string | null
  telefone?: string | null
  dataNasc?: Date | string | null
  ativo: boolean
}

interface Props {
  mode: Mode
  aluno?: AlunoData
  trigger: React.ReactNode
}

function toDateInputValue(value?: Date | string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10)
}

export function AlunoFormModal({ mode, aluno, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    dataNasc: "",
    ativo: true,
  })

  useEffect(() => {
    if (aluno && mode === "edit") {
      setForm({
        nome: aluno.nome,
        email: aluno.email,
        cpf: aluno.cpf ?? "",
        telefone: aluno.telefone ?? "",
        dataNasc: toDateInputValue(aluno.dataNasc),
        ativo: aluno.ativo,
      })
    } else {
      setForm({ nome: "", email: "", cpf: "", telefone: "", dataNasc: "", ativo: true })
    }
    setError("")
  }, [open, aluno, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.nome || !form.email) {
      setError("Nome e e-mail são obrigatórios.")
      return
    }

    setLoading(true)

    try {
      const url = mode === "create" ? "/api/alunos" : `/api/alunos/${aluno!.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const body: Record<string, unknown> = {
        nome: form.nome,
        email: form.email,
        cpf: form.cpf || null,
        telefone: form.telefone || null,
        dataNasc: form.dataNasc ? new Date(form.dataNasc).toISOString() : null,
        ativo: form.ativo,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar aluno.")
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

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
  const labelClass = "text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]"

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-serif text-lg font-bold text-slate-900">
                {mode === "create" ? "Novo Aluno" : "Editar Aluno"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Nome completo<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* E-mail */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  E-mail<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* CPF */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>CPF</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  className={inputClass}
                />
              </div>

              {/* Telefone */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Telefone</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className={inputClass}
                />
              </div>

              {/* Data de nascimento */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Data de nascimento</label>
                <input
                  type="date"
                  value={form.dataNasc}
                  onChange={(e) => setForm((f) => ({ ...f, dataNasc: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Status — somente no modo edição */}
              {mode === "edit" && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.ativo ? "true" : "false"}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.value === "true" }))}
                    className={inputClass}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {mode === "create" ? "Criar Aluno" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
