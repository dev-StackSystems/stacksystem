/**
 * proxy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Middleware do Next.js 16 (exportado como `proxy`).
 *
 * Responsabilidades:
 *   1. Guarda de autenticação: redireciona para /login se o usuário não estiver
 *      logado ao tentar acessar qualquer rota dentro de /painel/*
 *
 *   2. Roteamento por query param: converte ?pg=X ou ?m=X na raiz para o
 *      caminho correto (compatibilidade com links antigos)
 *
 * Este arquivo roda no Edge Runtime (muito rápido, antes do Next.js processar
 * a requisição). Por isso só pode usar APIs Web padrão (sem Node.js).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Mapeamento de query params para rotas
const MAPA_ROTAS: Record<string, string> = {
  login:   "/login",
  logout:  "/",
  painel:  "/painel",
  home:    "/",
  inicio:  "/",
  contato: "/#contato",
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ── 1. Proteção do painel ────────────────────────────────────────────────
  // Qualquer rota dentro de /painel/* exige autenticação válida
  if (pathname.startsWith("/painel")) {
    const token = await getToken({
      req:    request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Sem token → redireciona para a página de login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // ── 2. Roteamento por query param (apenas na raiz "/") ───────────────────
  // Ex: /?pg=painel → redireciona para /painel
  if (pathname === "/") {
    const param = searchParams.get("pg") ?? searchParams.get("m")
    if (param) {
      const destino = MAPA_ROTAS[param.toLowerCase()]
      if (destino) {
        return NextResponse.redirect(new URL(destino, request.url))
      }
    }
  }

  // Continua normalmente
  return NextResponse.next()
}

// Aplica o middleware somente nas rotas do painel e na raiz
export const config = {
  matcher: ["/painel/:path*", "/"],
}
