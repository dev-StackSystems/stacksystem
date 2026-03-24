"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2, Video } from "lucide-react"

interface Props {
  trigger: React.ReactNode
}

export function SalaFormModal({ trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nome: "",
    maxParticipantes: "10",
  })

  function handleOpen() {
    setForm({ nome: "", maxParticipantes: "10" })
    setError("")
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.nome.trim()) {
      setError("Nome da sala é obrigatório.")
      return
    }

    const max = parseInt(form.maxParticipantes, 10)
    if (isNaN(max) || max < 2 || max > 100) {
      setError("Máximo de participantes deve ser entre 2 e 100.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/salas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: form.nome.trim(), maxParticipantes: max }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao criar sala.")
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
      <div onClick={handleOpen}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <Video size={18} className="text-orange-500" />
                </div>
                <h2 className="font-serif text-lg font-bold text-slate-900">Nova Sala</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]">
                  Nome da Sala<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Aula de Matemática"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Max Participantes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]">
                  Máx. Participantes
                </label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={form.maxParticipantes}
                  onChange={(e) => setForm((f) => ({ ...f, maxParticipantes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
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
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Criar Sala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
