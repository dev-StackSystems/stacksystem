import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { requireRole } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

type Params = { params: Promise<{ id: string }> }

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  department: true, phone: true, active: true, createdAt: true,
  empresaId: true, setorId: true, grupoId: true,
  empresa: { select: { nome: true } },
  setor:   { select: { nome: true } },
  grupo:   { select: { nome: true } },
}

export async function GET(_: NextRequest, { params }: Params) {
  const authResult = await requireRole([UserRole.A, UserRole.T])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const user = await db.user.findUnique({ where: { id }, select: USER_SELECT })

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const body = await request.json()
  const { name, email, role, department, phone, active, password, empresaId, setorId, grupoId } = body

  if (role !== UserRole.A && !empresaId) {
    return NextResponse.json(
      { error: "Empresa é obrigatória para este perfil de usuário." },
      { status: 400 }
    )
  }

  const updateData: Record<string, unknown> = {
    name, email, role, department, phone, active,
    empresaId: empresaId || null,
    setorId:   setorId   || null,
    grupoId:   grupoId   || null,
  }

  if (password) updateData.password = await bcrypt.hash(password, 12)

  const user = await db.user.update({ where: { id }, data: updateData, select: USER_SELECT })
  return NextResponse.json(user)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  await db.user.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
