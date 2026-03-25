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

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthSuccess | NextResponse> {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  return { user }
}

type SessionUser = {
  role:         string
  empresaId:    string | null
  grupoId:      string | null
  setorId:      string | null
  grupoIsAdmin: boolean
}

/**
 * Resolve os módulos efetivos do usuário.
 * Hierarquia: UserRole.A → tudo | grupoIsAdmin → módulos da empresa |
 * caso contrário → empresa ∩ grupo ∩ setor
 */
export async function resolveModulosEfetivos(user: SessionUser): Promise<string[]> {
  // Super admin do sistema: acesso irrestrito (sidebar usa [] para mostrar tudo)
  if (user.role === UserRole.A) return []

  if (!user.empresaId) return []

  // Busca módulos da empresa
  const empMods = await db.empresaModulo
    .findMany({ where: { empresaId: user.empresaId, ativo: true }, select: { modulo: true } })
    .then((r) => r.map((m) => m.modulo))

  // Admin do grupo (ex.: diretoria): vê tudo que a empresa permite
  if (user.grupoIsAdmin) return empMods

  // Busca módulos do grupo e setor em paralelo (quando existem)
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

  // Intersecção progressiva: empresa ∩ grupo ∩ setor
  let result = empMods
  if (grupoMods !== null) result = result.filter((m) => grupoMods.includes(m))
  if (setorMods !== null) result = result.filter((m) => setorMods.includes(m))

  return result
}
