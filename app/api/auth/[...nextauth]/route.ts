/**
 * app/api/auth/[...nextauth]/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handler do NextAuth — gerencia automaticamente todas as rotas de auth:
 *   POST /api/auth/signin/credentials — login
 *   POST /api/auth/signout            — logout
 *   GET  /api/auth/session            — sessão atual
 *
 * A lógica de autenticação fica em: servidor/autenticacao/config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import NextAuth from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"

const handler = NextAuth(opcoesAuth)
export { handler as GET, handler as POST }
