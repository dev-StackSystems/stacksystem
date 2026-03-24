import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const ROUTE_MAP: Record<string, string> = {
  login:     "/login",
  logout:    "/",
  dashboard: "/dashboard",
  home:      "/",
  inicio:    "/",
  contato:   "/#contato",
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ── Guarda de autenticação para /dashboard/* ──────────────
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // ── Roteamento por query param (somente na raiz) ──────────
  if (pathname === "/") {
    const param = searchParams.get("pg") ?? searchParams.get("m")
    if (param) {
      const destination = ROUTE_MAP[param.toLowerCase()]
      if (destination) {
        return NextResponse.redirect(new URL(destination, request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/"],
}
