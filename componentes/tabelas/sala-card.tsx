"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Video, Users, Trash2, LogIn, Loader2, Copy, Check } from "lucide-react"

interface SalaData {
  id: string
  nome: string
  codigo: string
  maxParticipantes: number
  ativa: boolean
  criadoEm: string
  criadoPorId: string
  criadoPor: { nome: string; id: string }
  empresa?: { nome: string } | null
}

interface Props {
  sala: SalaData
  userId: string
  isAdmin: boolean
}

export function SalaCard({ sala, userId, isAdmin }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const canDelete = isAdmin || sala.criadoPorId === userId

  async function handleDelete() {
    if (!confirm(`Excluir a sala "${sala.nome}"? Esta ação não pode ser desfeita.`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/salas/${sala.id}`, { method: "DELETE" })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? "Erro ao excluir sala.")
      }
    } catch {
      alert("Erro de conexão. Tente novamente.")
    } finally {
      setDeleting(false)
    }
  }

  function handleEnter() {
    router.push(`/painel/salas/${sala.id}`)
  }

  async function handleCopyCodigo() {
    try {
      await navigator.clipboard.writeText(sala.codigo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Icon + Badge */}
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
          <Video size={20} className="text-orange-500" />
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
          Ativa
        </span>
      </div>

      {/* Nome */}
      <div>
        <h3 className="font-serif font-bold text-slate-900 text-base leading-snug">{sala.nome}</h3>
        <p className="text-xs text-slate-400 mt-1">Criado por: {sala.criadoPor.nome}</p>
        {sala.empresa && (
          <p className="text-xs text-slate-400">{sala.empresa.nome}</p>
        )}
      </div>

      {/* Codigo */}
      <button
        onClick={handleCopyCodigo}
        className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 w-full text-left hover:bg-slate-100 transition-colors group"
        title="Clique para copiar o código"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Código</span>
        <span className="text-xs text-slate-600 font-mono truncate flex-1">{sala.codigo.slice(0, 12)}…</span>
        {copied ? (
          <Check size={12} className="text-emerald-500 shrink-0" />
        ) : (
          <Copy size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
        )}
      </button>

      {/* Max participantes */}
      <div className="flex items-center gap-2">
        <Users size={14} className="text-slate-400" />
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          Máx. {sala.maxParticipantes} participantes
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-slate-50">
        <button
          onClick={handleEnter}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          <LogIn size={15} />
          Entrar na Sala
        </button>

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 transition-all disabled:opacity-50 shrink-0"
            title="Excluir sala"
          >
            {deleting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
