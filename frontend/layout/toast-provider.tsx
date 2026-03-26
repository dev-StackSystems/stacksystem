"use client"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "info"
interface Toast { id: string; message: string; type: ToastType }
interface ToastCtx { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
}
const STYLES = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error:   "bg-red-50 border-red-200 text-red-800",
  info:    "bg-blue-50 border-blue-200 text-blue-800",
}
const ICON_STYLES = {
  success: "text-emerald-500",
  error:   "text-red-500",
  info:    "text-blue-500",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, message, type }])
    timers.current[id] = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
      delete timers.current[id]
    }, 4000)
  }, [])

  // limpa timers ao desmontar
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout) }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium pointer-events-auto max-w-sm w-full animate-in slide-in-from-right-5 fade-in duration-200 ${STYLES[t.type]}`}
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${ICON_STYLES[t.type]}`} />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
