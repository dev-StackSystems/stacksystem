/**
 * componentes/layout/provedor-sessao.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Envolve os filhos com os provedores necessários para o painel:
 *   - SessionProvider (NextAuth): disponibiliza useSession() em Client Components
 *   - ToastProvedor: disponibiliza useToast() em qualquer componente filho
 *
 * Usado no layout principal do painel (app/painel/layout.tsx).
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import { ToastProvedor } from "./provedor-toast"

interface Props {
  children: React.ReactNode
  sessao:   Session | null
}

/** Provedor combinado de sessão + toast para o painel */
export function ProvedorSessao({ children, sessao }: Props) {
  return (
    <SessionProvider session={sessao}>
      <ToastProvedor>
        {children}
      </ToastProvedor>
    </SessionProvider>
  )
}
