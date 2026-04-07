import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { PapelUsuario } from "@prisma/client"
import bcrypt from "bcryptjs"

type Params = { params: Promise<{ id: string }> }

const USER_SELECT = {
  id: true, nome: true, email: true, papel: true,
  departamento: true, telefone: true, ativo: true, criadoEm: true,
  empresaId: true, setorId: true, grupoId: true,
  empresa: { select: { nome: true } },
  setor:   { select: { nome: true } },
  grupo:   { select: { nome: true } },
}

export async function GET(_: NextRequest, { params }: Params) {
  const session = await getServerSession(opcoesAuth)
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { superAdmin } = session.user
  const canAccess =
    superAdmin ||
    session.user.papel === PapelUsuario.A ||
    session.user.grupoIsAdmin ||
    session.user.papel === PapelUsuario.T
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const user = await db.usuario.findUnique({ where: { id }, select: USER_SELECT })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  // Não-super-admin só acessa usuários da própria empresa
  if (!superAdmin && user.empresaId !== session.user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  return NextResponse.json(user)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(opcoesAuth)
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { superAdmin } = session.user
  const isEmpresaAdmin = session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin

  if (!superAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  // Verifica que o usuário alvo existe e pertence à empresa do requester
  if (!superAdmin) {
    const target = await db.usuario.findUnique({ where: { id }, select: { empresaId: true } })
    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    if (target.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Sem permissão para editar usuários de outra empresa." }, { status: 403 })
    }
  }

  const body = await request.json()
  const { name, email, role, department, phone, active, password, empresaId, setorId, grupoId } = body

  // Não-empresa-admin não pode mudar a empresa do usuário
  const resolvedEmpresaId = superAdmin ? empresaId : session.user.empresaId

  if (!resolvedEmpresaId) {
    return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    name, email,
    papel: role as PapelUsuario,
    department, phone, active,
    empresaId: resolvedEmpresaId,
    setorId: setorId || null,
    grupoId: grupoId || null,
  }

  if (password) updateData.senha = await bcrypt.hash(password, 12)

  const user = await db.usuario.update({ where: { id }, data: updateData, select: USER_SELECT })
  return NextResponse.json(user)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getServerSession(opcoesAuth)
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { superAdmin } = session.user
  const isEmpresaAdmin = session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin

  if (!superAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  if (!superAdmin) {
    const target = await db.usuario.findUnique({ where: { id }, select: { empresaId: true } })
    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    if (target.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Sem permissão para desativar usuários de outra empresa." }, { status: 403 })
    }
  }

  await db.usuario.update({ where: { id }, data: { ativo: false } })
  return NextResponse.json({ success: true })
}
