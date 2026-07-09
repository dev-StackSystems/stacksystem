/**
 * componentes/layout/provedor-confirmacao.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Diálogo de confirmação DINÂMICO (substitui o window.confirm nativo).
 *
 * Como usar:
 *   const confirmar = useConfirm()
 *   const ok = await confirmar({ mensagem: "Excluir este item?", perigo: true })
 *   if (!ok) return
 *
 * O provedor é montado no painel (provedor-sessao.tsx), disponível a todos os
 * Client Components filhos. Retorna uma Promise<boolean> resolvida ao clicar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { AlertTriangle, HelpCircle } from "lucide-react"

export interface OpcoesConfirm {
  titulo?:   string
  mensagem:  string
  confirmar?: string   // rótulo do botão principal (padrão: "Confirmar")
  cancelar?:  string   // rótulo do botão secundário (padrão: "Cancelar")
  perigo?:   boolean   // botão vermelho + ícone de alerta
}

type FnConfirm = (opts: OpcoesConfirm) => Promise<boolean>

const ContextoConfirm = createContext<FnConfirm>(async () => false)

/** Hook para abrir o diálogo de confirmação dinâmico. */
export const useConfirm = () => useContext(ContextoConfirm)

interface Estado extends OpcoesConfirm {
  resolver: (v: boolean) => void
}

export function ConfirmProvedor({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado | null>(null)

  const confirmar = useCallback<FnConfirm>((opts) => {
    return new Promise<boolean>((resolve) => setEstado({ ...opts, resolver: resolve }))
  }, [])

  const fechar = useCallback((valor: boolean) => {
    setEstado((atual) => {
      atual?.resolver(valor)
      return null
    })
  }, [])

  // Teclado: Enter confirma, Esc cancela
  useEffect(() => {
    if (!estado) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar(false)
      if (e.key === "Enter") fechar(true)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [estado, fechar])

  const perigo = estado?.perigo
  const Icone = perigo ? AlertTriangle : HelpCircle

  return (
    <ContextoConfirm.Provider value={confirmar}>
      {children}

      {estado && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150" onClick={() => fechar(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-150">
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${perigo ? "bg-red-50 text-red-500 border border-red-100" : "bg-brand-50 text-brand-500 border border-brand-100"}`}>
                <Icone size={22} />
              </div>
              <h2 className="font-serif text-lg font-bold text-slate-900">{estado.titulo ?? "Confirmar ação"}</h2>
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{estado.mensagem}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => fechar(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-all"
              >
                {estado.cancelar ?? "Cancelar"}
              </button>
              <button
                onClick={() => fechar(true)}
                autoFocus
                className={`flex-1 text-white font-bold py-2.5 rounded-xl text-sm transition-all ${perigo ? "bg-red-500 hover:bg-red-600" : "bg-brand-500 hover:bg-brand-600"}`}
              >
                {estado.confirmar ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ContextoConfirm.Provider>
  )
}
