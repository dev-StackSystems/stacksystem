"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"

type Mode = "create" | "edit"

export interface MatriculaData {
  id: string
  alunoId: string
  empCursoId: string
  status: string
  valor: number | string
  dataInicio: Date | string
  dataFim?: Date | string | null
  aluno?: { nome: string; email: string }
  empCurso?: { nome: string; empresa: { nome: string } }
}

interface AlunoSimples {
  id: string
  nome: string
}

interface CursoData {
  id: string
  nome: string
  empresa: { nome: string }
}

interface Props {
  mode: Mode
  matricula?: MatriculaData
  alunos: AlunoSimples[]
  cursos: CursoData[]
  trigger: React.ReactNode
}

function toDateInputValue(value?: Date | string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
const labelClass = "text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]"

export function MatriculaFormModal({ mode, matricula, alunos, cursos, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const emptyForm = {
    alunoId: "",
    empCursoId: "",
    status: "ativa",
    valor: "",
    dataInicio: toDateInputValue(new Date()),
    dataFim: "",
  }

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open && matricula && mode === "edit") {
      setForm({
        alunoId: matricula.alunoId,
        empCursoId: matricula.empCursoId,
        status: matricula.status,
        valor: String(matricula.valor),
        dataInicio: toDateInputValue(matricula.dataInicio),
        dataFim: toDateInputValue(matricula.dataFim),
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

    if (!form.alunoId || !form.empCursoId) {
      setError("Aluno e curso são obrigatórios.")
      return
    }

    setLoading(true)
    try {
      const url = mode === "create" ? "/api/matriculas" : `/api/matriculas/${matricula!.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId: form.alunoId,
          empCursoId: form.empCursoId,
          status: form.status,
          valor: form.valor !== "" ? parseFloat(form.valor) : 0,
          dataInicio: form.dataInicio || undefined,
          dataFim: form.dataFim || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar matrícula.")
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-serif text-lg font-bold text-slate-900">
                {mode === "create" ? "Nova Matrícula" : "Editar Matrícula"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Aluno */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Aluno<span className="text-red-400 ml-0.5">*</span>
                </label>
                <select
                  value={form.alunoId}
                  onChange={(e) => setForm((f) => ({ ...f, alunoId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Selecione um aluno...</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Curso */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Curso<span className="text-red-400 ml-0.5">*</span>
                </label>
                <select
                  value={form.empCursoId}
                  onChange={(e) => setForm((f) => ({ ...f, empCursoId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Selecione um curso...</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} — {c.empresa.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>
                  Status<span className="text-red-400 ml-0.5">*</span>
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={inputClass}
                >
                  <option value="ativa">Ativa</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              {/* Valor */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Valor (R$)</label>
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

              {/* Data Início */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Data de Início</label>
                <input
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Data Fim */}
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Data de Encerramento <span className="text-slate-400 font-normal">(opcional)</span></label>
                <input
                  type="date"
                  value={form.dataFim}
                  onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
                  className={inputClass}
                />
              </div>

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
                  {mode === "create" ? "Criar Matrícula" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
