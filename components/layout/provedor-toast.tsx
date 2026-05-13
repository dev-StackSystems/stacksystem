/**
 * componentes/layout/provedor-toast.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Sistema de notificações toast (mensagens temporárias na tela).
 *
 * Como usar:
 *   // 1. Envolva os filhos com ToastProvedor (já feito no provedor-sessao.tsx)
 *   // 2. Use o hook useToast() nos componentes filhos:
 *
 *   const { toast } = useToast()
 *   toast("Operação realizada com sucesso!")          // tipo "sucesso" (padrão)
 *   toast("Erro ao salvar.", "erro")
 *   toast("Aguarde...", "info")
 *
 * As mensagens desaparecem automaticamente após 4 segundos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"

// Tipos de toast disponíveis
type TipoToast = "sucesso" | "erro" | "info"

// Estrutura de um toast individual
interface Toast {
  id:      string
  mensagem: string
  tipo:    TipoToast
}

// Interface do contexto
interface ContextoToast {
  toast: (mensagem: string, tipo?: TipoToast) => void
}

// Contexto com valor padrão vazio
const ContextoToast = createContext<ContextoToast>({ toast: () => {} })

/** Hook para usar o toast em qualquer componente filho */
export const useToast = () => useContext(ContextoToast)

// Ícones por tipo de toast
const ICONES = {
  sucesso: CheckCircle2,
  erro:    XCircle,
  info:    Info,
}

// Estilos por tipo de toast
const ESTILOS = {
  sucesso: "bg-emerald-50 border-emerald-200 text-emerald-800",
  erro:    "bg-red-50 border-red-200 text-red-800",
  info:    "bg-blue-50 border-blue-200 text-blue-800",
}
const ESTILOS_ICONE = {
  sucesso: "text-emerald-500",
  erro:    "text-red-500",
  info:    "text-blue-500",
}

/** Provedor do contexto de toast — envolve o layout do painel */
export function ToastProvedor({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Armazena referências aos timers para limpar ao desmontar
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Remove um toast pelo ID
  const dispensar = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  // Adiciona um novo toast e agenda sua remoção em 4 segundos
  const toast = useCallback((mensagem: string, tipo: TipoToast = "sucesso") => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, mensagem, tipo }])
    timers.current[id] = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
      delete timers.current[id]
    }, 4000)
  }, [])

  // Limpa todos os timers ao desmontar o componente
  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout)
  }, [])

  return (
    <ContextoToast.Provider value={{ toast }}>
      {children}

      {/* Container dos toasts — fixo no canto superior direito */}
      <div
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(t => {
          const Icone = ICONES[t.tipo]
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium pointer-events-auto max-w-sm w-full animate-in slide-in-from-right-5 fade-in duration-200 ${ESTILOS[t.tipo]}`}
            >
              <Icone size={16} className={`mt-0.5 shrink-0 ${ESTILOS_ICONE[t.tipo]}`} />
              <span className="flex-1 leading-snug">{t.mensagem}</span>
              <button
                onClick={() => dispensar(t.id)}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ContextoToast.Provider>
  )
}
