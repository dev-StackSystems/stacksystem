"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"

type Mode = "create" | "edit"

export interface CursoData {
  id: string
  empresaId: string
  nome: string
  descricao?: string | null
  cargaHoraria?: number | null
  ativo: boolean
  empresa?: { nome: string }
}

interface EmpresaOption {
  id: string
  nome: string
}

interface Props {
  mode: Mode
  curso?: CursoData
  empresas: EmpresaOption[]
  trigger: React.ReactNode
}

export function CursoFormModal({ mode, curso, empresas, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    empresaId: "",
    nome: "",
    descricao: "",
    cargaHoraria: "",
    ativo: true,
  })

  useEffect(() => {
    if (open) {
      if (curso && mode === "edit") {
        setForm({
          empresaId: curso.empresaId,
          nome: curso.nome,
          descricao: curso.descricao ?? "",
          cargaHoraria: curso.cargaHoraria != null ? String(curso.cargaHoraria) : "",
          ativo: curso.ativo,
        })
      } else {
        setForm({
          empresaId: empresas[0]?.id ?? "",
          nome: "",
          descricao: "",
          cargaHoraria: "",
          ativo: true,
        })
      }
      setError("")
    }
  }, [open, curso, mode, empresas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.empresaId) {
      setError("Empresa é obrigatória.")
      return
    }
    if (!form.nome.trim()) {
      setError("Nome do curso é obrigatório.")
      return
    }

    setLoading(true)

    try {
      const url = mode === "create" ? "/api/cursos" : `/api/cursos/${curso!.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: form.empresaId,
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          cargaHoraria: form.cargaHoraria !== "" ? Number(form.cargaHoraria) : null,
          ativo: form.ativo,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar curso.")
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
                {mode === "create" ? "Novo Curso" : "Editar Curso"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Empresa */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Empresa<span className="text-red-400 ml-0.5">*</span>
                </label>
                {empresas.length === 0 ? (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    Nenhuma empresa cadastrada. Cadastre uma empresa antes de criar cursos.
                  </p>
                ) : (
                  <select
                    value={form.empresaId}
                    onChange={(e) => setForm((f) => ({ ...f, empresaId: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Selecione uma empresa...</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Nome do curso<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Pré-vestibular Intensivo"
                  className={inputClass}
                />
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Breve descrição do curso..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Carga Horária */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Carga Horária (horas)</label>
                <input
                  type="number"
                  min={1}
                  value={form.cargaHoraria}
                  onChange={(e) => setForm((f) => ({ ...f, cargaHoraria: e.target.value }))}
                  placeholder="Ex: 120"
                  className={inputClass}
                />
              </div>

              {/* Ativo — apenas no modo edição */}
              {mode === "edit" && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.ativo ? "true" : "false"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ativo: e.target.value === "true" }))
                    }
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
                  disabled={loading || empresas.length === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {mode === "create" ? "Criar Curso" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
