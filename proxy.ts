import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Mapa de rotas: ?pg=X  ou  ?m=X  →  /X
const ROUTE_MAP: Record<string, string> = {
  login:     "/login",
  logout:    "/",
  dashboard: "/dashboard",
  home:      "/",
  inicio:    "/",
}

export function proxy(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const param = searchParams.get("pg") ?? searchParams.get("m")

  if (param) {
    const destination = ROUTE_MAP[param.toLowerCase()]
    if (destination) {
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Aplica o middleware somente na raiz para não interferir em /login, /dashboard etc.
  matcher: "/",
}
