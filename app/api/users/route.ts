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

  const { isSuperAdmin } = requester
  // Pode listar usuários: super admin, admin de empresa (role A), admin de grupo, técnico
  const canAccess =
    isSuperAdmin ||
    requester.role === UserRole.A ||
    requester.grupoIsAdmin ||
    requester.role === UserRole.T
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  // Super admin vê todos; demais veem apenas da própria empresa
  const where = isSuperAdmin ? {} : { empresaId: requester.empresaId ?? "" }

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

  const { isSuperAdmin } = requester
  // Pode criar usuários: super admin, admin de empresa, admin de grupo
  const isEmpresaAdmin = requester.role === UserRole.A || requester.grupoIsAdmin
  if (!isSuperAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, password, role, department, phone, empresaId, setorId, grupoId } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  // Não-super-admin só pode criar usuários na própria empresa
  const resolvedEmpresaId = isSuperAdmin ? empresaId : requester.empresaId

  if (!resolvedEmpresaId) {
    return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })
  }

  // Não-super-admin não pode criar isSuperAdmin
  if (!isSuperAdmin && (role === "SUPER" || body.isSuperAdmin)) {
    return NextResponse.json({ error: "Sem permissão para criar super administradores." }, { status: 403 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      name, email, password: hashedPassword,
      role: role as UserRole,
      department, phone,
      empresaId: resolvedEmpresaId,
      ...(setorId ? { setorId } : {}),
      ...(grupoId ? { grupoId } : {}),
    },
    select: USER_SELECT,
  })

  return NextResponse.json(user, { status: 201 })
}
