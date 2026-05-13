/**
 * tipos/autenticacao.d.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Extensão dos tipos do NextAuth para incluir os campos customizados
 * que armazenamos no token JWT e na sessão.
 *
 * Por que estender?
 *   Por padrão, NextAuth só disponibiliza `id`, `name`, `email`, `image` na
 *   sessão. Precisamos de campos extras como `papel`, `superAdmin`, `empresaId`
 *   etc. — esta declaração informa o TypeScript sobre esses campos adicionais.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id:           string        // ID único do usuário (cuid)
      name:         string        // Nome completo (campo padrão JWT)
      email:        string        // E-mail (campo padrão JWT)
      papel:        string        // Papel: "A" | "T" | "I" | "E" | "F"
      superAdmin:   boolean       // Acesso irrestrito a todas as empresas (desenvolvedor/i3)
      empresaId:    string | null // ID da empresa vinculada
      grupoId:      string | null // ID do grupo do usuário
      setorId:      string | null // ID do setor do usuário
      grupoIsAdmin: boolean       // Flag: grupo com acesso completo à empresa
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:           string
    papel:        string
    superAdmin:   boolean
    empresaId:    string | null
    grupoId:      string | null
    setorId:      string | null
    grupoIsAdmin: boolean
  }
}
