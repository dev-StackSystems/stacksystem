import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth-helpers"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const authResult = await requireRole([UserRole.A, UserRole.T])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, department: true, phone: true, active: true, createdAt: true },
  })

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const body = await request.json()
  const { name, email, role, department, phone, active, password, empresaId } = body

  const updateData: Record<string, unknown> = {
    name,
    email,
    role,
    department,
    phone,
    active,
    empresaId: empresaId || null,
  }

  if (password) {
    updateData.password = await bcrypt.hash(password, 12)
  }

  const user = await db.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, department: true, active: true, empresaId: true, empresa: { select: { nome: true } } },
  })

  return NextResponse.json(user)
}

// Soft delete: marca active = false
export async function DELETE(_: NextRequest, { params }: Params) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  await db.user.update({
    where: { id },
    data: { active: false },
  })

  return NextResponse.json({ success: true })
}
