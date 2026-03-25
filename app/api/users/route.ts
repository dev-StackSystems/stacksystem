import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { requireRole } from "@/backend/auth/session-helpers"
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

export async function GET() {
  const authResult = await requireRole([UserRole.A, UserRole.T])
  if (authResult instanceof NextResponse) return authResult

  const users = await db.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const body = await request.json()
  const { name, email, password, role, department, phone, empresaId, setorId, grupoId } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  if (role !== UserRole.A && !empresaId) {
    return NextResponse.json(
      { error: "Empresa é obrigatória para este perfil de usuário." },
      { status: 400 }
    )
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      name, email, password: hashedPassword, role, department, phone,
      ...(empresaId ? { empresaId } : {}),
      ...(setorId   ? { setorId }   : {}),
      ...(grupoId   ? { grupoId }   : {}),
    },
    select: USER_SELECT,
  })

  return NextResponse.json(user, { status: 201 })
}
