import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
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
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { isSuperAdmin } = session.user
  const canAccess =
    isSuperAdmin ||
    session.user.role === UserRole.A ||
    session.user.grupoIsAdmin ||
    session.user.role === UserRole.T
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const user = await db.user.findUnique({ where: { id }, select: USER_SELECT })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // Não-super-admin só acessa usuários da própria empresa
  if (!isSuperAdmin && user.empresaId !== session.user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  return NextResponse.json(user)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { isSuperAdmin } = session.user
  const isEmpresaAdmin = session.user.role === UserRole.A || session.user.grupoIsAdmin

  if (!isSuperAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  // Verifica que o usuário alvo existe e pertence à empresa do requester
  if (!isSuperAdmin) {
    const target = await db.user.findUnique({ where: { id }, select: { empresaId: true } })
    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    if (target.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Sem permissão para editar usuários de outra empresa." }, { status: 403 })
    }
  }

  const body = await request.json()
  const { name, email, role, department, phone, active, password, empresaId, setorId, grupoId } = body

  // Não-empresa-admin não pode mudar a empresa do usuário
  const resolvedEmpresaId = isSuperAdmin ? empresaId : session.user.empresaId

  if (!resolvedEmpresaId) {
    return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    name, email,
    role: role as UserRole,
    department, phone, active,
    empresaId: resolvedEmpresaId,
    setorId: setorId || null,
    grupoId: grupoId || null,
  }

  if (password) updateData.password = await bcrypt.hash(password, 12)

  const user = await db.user.update({ where: { id }, data: updateData, select: USER_SELECT })
  return NextResponse.json(user)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { isSuperAdmin } = session.user
  const isEmpresaAdmin = session.user.role === UserRole.A || session.user.grupoIsAdmin

  if (!isSuperAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  if (!isSuperAdmin) {
    const target = await db.user.findUnique({ where: { id }, select: { empresaId: true } })
    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    if (target.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Sem permissão para desativar usuários de outra empresa." }, { status: 403 })
    }
  }

  await db.user.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
