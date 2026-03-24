import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth-helpers"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

// GET /api/users — ADMIN e TECH podem listar
export async function GET() {
  const authResult = await requireRole([UserRole.A, UserRole.T])
  if (authResult instanceof NextResponse) return authResult

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      phone: true,
      active: true,
      createdAt: true,
      empresaId: true,
      empresa: { select: { nome: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

// POST /api/users — apenas ADMIN
export async function POST(request: NextRequest) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const body = await request.json()
  const { name, email, password, role, department, phone, empresaId } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  // empresaId é obrigatório para roles não-Admin.
  // Apenas Admin (A) pode criar outro Admin sem empresa.
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
      name,
      email,
      password: hashedPassword,
      role,
      department,
      phone,
      ...(empresaId ? { empresaId } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      active: true,
      createdAt: true,
      empresaId: true,
      empresa: { select: { nome: true } },
    },
  })

  return NextResponse.json(user, { status: 201 })
}
