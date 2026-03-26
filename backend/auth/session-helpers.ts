import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { db } from "@/backend/database/prisma-client"
import { UserRole } from "@prisma/client"
import { NextResponse } from "next/server"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

type AuthSuccess = { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }

/**
 * Verifica autenticação e perfil.
 * isSuperAdmin bypassa qualquer checagem de role.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthSuccess | NextResponse> {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Super admin (desenvolvedor/i3) passa por qualquer checagem de role
  if (user.isSuperAdmin) return { user }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  return { user }
}

/**
 * Exige super admin (desenvolvedor/i3) — para operações cross-empresa.
 */
export async function requireSuperAdmin(): Promise<AuthSuccess | NextResponse> {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!user.isSuperAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  return { user }
}

type SessionUser = {
  role:         string
  isSuperAdmin: boolean
  empresaId:    string | null
  grupoId:      string | null
  setorId:      string | null
  grupoIsAdmin: boolean
}

/**
 * Resolve os módulos efetivos do usuário.
 *
 * Hierarquia (igual ao i3 pref_sistemas):
 *   isSuperAdmin  → [] (sidebar mostra tudo sem filtro)
 *   UserRole.A    → todos os módulos da empresa (admin da empresa)
 *   grupoIsAdmin  → todos os módulos da empresa
 *   T/F           → empresa ∩ grupo ∩ setor
 */
export async function resolveModulosEfetivos(user: SessionUser): Promise<string[]> {
  // Super admin do sistema: acesso irrestrito ([] = sem filtro na sidebar)
  if (user.isSuperAdmin) return []

  if (!user.empresaId) return []

  // Busca módulos ativos da empresa
  const empMods = await db.empresaModulo
    .findMany({ where: { empresaId: user.empresaId, ativo: true }, select: { modulo: true } })
    .then((r) => r.map((m) => m.modulo))

  // Admin da empresa (role A ou grupoIsAdmin): vê tudo que a empresa permite
  if (user.role === UserRole.A || user.grupoIsAdmin) return empMods

  // Busca módulos do grupo e setor em paralelo
  const [grupoMods, setorMods] = await Promise.all([
    user.grupoId
      ? db.grupoModulo
          .findMany({ where: { grupoId: user.grupoId }, select: { modulo: true } })
          .then((r) => r.map((m) => m.modulo))
      : null,
    user.setorId
      ? db.setorModulo
          .findMany({ where: { setorId: user.setorId }, select: { modulo: true } })
          .then((r) => r.map((m) => m.modulo))
      : null,
  ])

  // Intersecção: empresa ∩ grupo ∩ setor
  let result = empMods
  if (grupoMods !== null) result = result.filter((m) => grupoMods.includes(m))
  if (setorMods !== null) result = result.filter((m) => setorMods.includes(m))

  return result
}
