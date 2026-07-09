"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/layout/provedor-toast"
import { useConfirm } from "@/components/layout/provedor-confirmacao"

type ToastType = "sucesso" | "erro" | "info"

interface ActionMessages {
  /** Se informado, abre o diálogo de confirmação dinâmico antes de executar. */
  confirmar?:    string
  /** Título do diálogo de confirmação (opcional). */
  confirmTitulo?: string
  /** Rótulo do botão de confirmação (opcional). */
  confirmLabel?: string
  /** Usa botão vermelho / ícone de alerta no diálogo. */
  perigo?:       boolean
  success?:      string
  successType?:  ToastType
  error?:        string
}

/**
 * Manages per-row async actions in tables: optional dynamic confirmation,
 * tracks which row is loading, calls the action, shows a toast, and refreshes.
 */
export function useRowAction() {
  const router = useRouter()
  const { toast } = useToast()
  const confirmar = useConfirm()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const run = async (
    id: string,
    fn: () => Promise<Response>,
    messages?: ActionMessages,
  ) => {
    // Confirmação dinâmica (substitui window.confirm)
    if (messages?.confirmar) {
      const ok = await confirmar({
        titulo:    messages.confirmTitulo,
        mensagem:  messages.confirmar,
        confirmar: messages.confirmLabel,
        perigo:    messages.perigo ?? true,
      })
      if (!ok) return
    }

    setLoadingId(id)
    try {
      const res = await fn()
      if (res.ok) {
        if (messages?.success) toast(messages.success, messages.successType)
        router.refresh()
      } else {
        if (messages?.error) toast(messages.error, "erro")
        else router.refresh()
      }
    } catch {
      if (messages?.error) toast(messages.error, "erro")
    } finally {
      setLoadingId(null)
    }
  }

  return { loadingId, run }
}
