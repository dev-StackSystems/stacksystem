"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"

type Mode = "create" | "edit"

export interface EmpresaData {
  id: string
  nome: string
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  ativa: boolean
}

interface Props {
  mode: Mode
  empresa?: EmpresaData
  trigger: React.ReactNode
}

export function EmpresaFormModal({ mode, empresa, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    ativa: true,
  })

  useEffect(() => {
    if (open) {
      if (empresa && mode === "edit") {
        setForm({
          nome: empresa.nome,
          cnpj: empresa.cnpj ?? "",
          email: empresa.email ?? "",
          telefone: empresa.telefone ?? "",
          ativa: empresa.ativa,
        })
      } else {
        setForm({ nome: "", cnpj: "", email: "", telefone: "", ativa: true })
      }
      setError("")
    }
  }, [open, empresa, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.nome.trim()) {
      setError("Nome é obrigatório.")
      return
    }

    setLoading(true)

    try {
      const url = mode === "create" ? "/api/empresas" : `/api/empresas/${empresa!.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          cnpj: form.cnpj.trim() || null,
          email: form.email.trim() || null,
          telefone: form.telefone.trim() || null,
          ativa: form.ativa,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar empresa.")
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
  const labelClass =
    "text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]"

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-serif text-lg font-bold text-slate-900">
                {mode === "create" ? "Nova Empresa" : "Editar Empresa"}
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
                  Nome<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Razão social ou nome fantasia"
                  className={inputClass}
                />
              </div>

              {/* CNPJ */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>CNPJ</label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                  className={inputClass}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="contato@empresa.com.br"
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

              {/* Ativa — apenas no modo edição */}
              {mode === "edit" && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.ativa ? "true" : "false"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ativa: e.target.value === "true" }))
                    }
                    className={inputClass}
                  >
                    <option value="true">Ativa</option>
                    <option value="false">Inativa</option>
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
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {mode === "create" ? "Criar Empresa" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
