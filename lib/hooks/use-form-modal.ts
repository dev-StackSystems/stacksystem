"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Manages the shared state for modal forms: open/close, loading spinner, and error message.
 * Each form keeps its own `form` data state and validation logic.
 */
export function useFormModal() {
  const router = useRouter()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const close = () => setOpen(false)

  const openModal = () => {
    setError("")
    setOpen(true)
  }

  const closeAndRefresh = () => {
    setOpen(false)
    router.refresh()
  }

  return { open, setOpen, loading, setLoading, error, setError, close, openModal, closeAndRefresh }
}
