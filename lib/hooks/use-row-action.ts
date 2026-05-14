"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/layout/provedor-toast"

type ToastType = "sucesso" | "erro" | "info"

interface ActionMessages {
  success?: string
  successType?: ToastType
  error?: string
}

/**
 * Manages per-row async actions in tables: tracks which row is loading,
 * calls the action, shows a toast, and refreshes the page data.
 */
export function useRowAction() {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const run = async (
    id: string,
    fn: () => Promise<Response>,
    messages?: ActionMessages,
  ) => {
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
