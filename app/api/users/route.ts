import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  department: true, phone: true, active: true, createdAt: true,
  empresaId: true, setorId: true, grupoId: true,
  empresa: { select: { nome: true } },
  setor:   { select: { nome: true } },
  grupo:   { select: { nome: true } },
}

function getRequester(session: Awaited<ReturnType<typeof getServerSession<typeof authOptions>>>) {
  if (!session?.user) return null
  return session.user
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const requester = getRequester(session)
  if (!requester) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const isSystemAdmin = requester.role === UserRole.A
  const canAccess = isSystemAdmin || requester.grupoIsAdmin || requester.role === UserRole.T
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  // T e grupoIsAdmin só veem usuários da própria empresa
  const where = isSystemAdmin ? {} : { empresaId: requester.empresaId ?? "" }

  const users = await db.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const requester = getRequester(session)
  if (!requester) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const isSystemAdmin = requester.role === UserRole.A
  const isEmpresaAdmin = requester.grupoIsAdmin && !!requester.empresaId

  if (!isSystemAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, password, role, department, phone, empresaId, setorId, grupoId } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  // Não-admin do sistema só pode criar usuários na própria empresa
  const resolvedEmpresaId = isSystemAdmin ? empresaId : requester.empresaId

  if (role !== UserRole.A && !resolvedEmpresaId) {
    return NextResponse.json({ error: "Empresa é obrigatória para este perfil de usuário." }, { status: 400 })
  }

  // Não-admin não pode criar UserRole.A
  if (!isSystemAdmin && role === UserRole.A) {
    return NextResponse.json({ error: "Sem permissão para criar administradores do sistema." }, { status: 403 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      name, email, password: hashedPassword, role, department, phone,
      ...(resolvedEmpresaId ? { empresaId: resolvedEmpresaId } : {}),
      ...(setorId ? { setorId } : {}),
      ...(grupoId ? { grupoId } : {}),
    },
    select: USER_SELECT,
  })

  return NextResponse.json(user, { status: 201 })
}
