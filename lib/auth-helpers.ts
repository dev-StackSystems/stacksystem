import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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
