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

  const isSystemAdmin = session.user.role === UserRole.A
  const canAccess = isSystemAdmin || session.user.grupoIsAdmin || session.user.role === UserRole.T
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const user = await db.user.findUnique({ where: { id }, select: USER_SELECT })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // T e grupoIsAdmin só acessam usuários da própria empresa
  if (!isSystemAdmin && user.empresaId !== session.user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  return NextResponse.json(user)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const isSystemAdmin = session.user.role === UserRole.A
  const isEmpresaAdmin = session.user.grupoIsAdmin && !!session.user.empresaId

  if (!isSystemAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  // Verifica que o usuário alvo existe e pertence à empresa do requester (se não for admin do sistema)
  if (!isSystemAdmin) {
    const target = await db.user.findUnique({ where: { id }, select: { empresaId: true } })
    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    if (target.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Sem permissão para editar usuários de outra empresa." }, { status: 403 })
    }
  }

  const body = await request.json()
  const { name, email, role, department, phone, active, password, empresaId, setorId, grupoId } = body

  // Não-admin do sistema não pode mudar a empresa do usuário
  const resolvedEmpresaId = isSystemAdmin ? empresaId : session.user.empresaId

  if (role !== UserRole.A && !resolvedEmpresaId) {
    return NextResponse.json({ error: "Empresa é obrigatória para este perfil de usuário." }, { status: 400 })
  }

  // Não-admin não pode promover a UserRole.A
  if (!isSystemAdmin && role === UserRole.A) {
    return NextResponse.json({ error: "Sem permissão para promover administradores do sistema." }, { status: 403 })
  }

  const updateData: Record<string, unknown> = {
    name, email, role, department, phone, active,
    empresaId: resolvedEmpresaId || null,
    setorId:   setorId   || null,
    grupoId:   grupoId   || null,
  }

  if (password) updateData.password = await bcrypt.hash(password, 12)

  const user = await db.user.update({ where: { id }, data: updateData, select: USER_SELECT })
  return NextResponse.json(user)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const isSystemAdmin = session.user.role === UserRole.A
  const isEmpresaAdmin = session.user.grupoIsAdmin && !!session.user.empresaId

  if (!isSystemAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  // grupoIsAdmin só pode desativar usuários da própria empresa
  if (!isSystemAdmin) {
    const target = await db.user.findUnique({ where: { id }, select: { empresaId: true } })
    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    if (target.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Sem permissão para desativar usuários de outra empresa." }, { status: 403 })
    }
  }

  await db.user.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
