"use client"
import { useState, useEffect } from "react"
import { X, Loader2, Puzzle } from "lucide-react"
import { EmpresaModulosManager } from "./EmpresaModulosManager"

interface Props {
  empresaId: string
  empresaNome: string
  trigger: React.ReactNode
}

export function EmpresaModulosModal({ empresaId, empresaNome, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [modulosAtivos, setModulosAtivos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    setLoading(true)
    fetch(`/api/empresas/${empresaId}/modulos`)
      .then((res) => res.json())
      .then((data: Array<{ modulo: string; ativo: boolean }>) => {
        setModulosAtivos(data.filter((m) => m.ativo).map((m) => m.modulo))
      })
      .catch(() => setModulosAtivos([]))
      .finally(() => setLoading(false))
  }, [open, empresaId])

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <Puzzle size={16} className="text-orange-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-800">Módulos da Empresa</h2>
                <p className="text-xs text-slate-400 truncate">{empresaNome}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="animate-spin text-orange-400" />
                </div>
              ) : (
                <EmpresaModulosManager
                  empresaId={empresaId}
                  modulosAtivos={modulosAtivos}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <p className="text-xs text-slate-400">
                Alterações são salvas automaticamente ao toglar cada módulo.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
