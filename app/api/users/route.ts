import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { PapelUsuario } from "@prisma/client"
import bcrypt from "bcryptjs"

const USER_SELECT = {
  id: true, nome: true, email: true, papel: true,
  departamento: true, telefone: true, ativo: true, criadoEm: true,
  empresaId: true, setorId: true, grupoId: true,
  empresa: { select: { nome: true } },
  setor:   { select: { nome: true } },
  grupo:   { select: { nome: true } },
}

function getRequester(session: Awaited<ReturnType<typeof getServerSession<typeof opcoesAuth>>>) {
  if (!session?.user) return null
  return session.user
}

export async function GET() {
  const session = await getServerSession(opcoesAuth)
  const requester = getRequester(session)
  if (!requester) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { superAdmin } = requester
  // Pode listar usuários: super admin, admin de empresa (role A), admin de grupo, técnico
  const canAccess =
    superAdmin ||
    requester.papel === PapelUsuario.A ||
    requester.grupoIsAdmin ||
    requester.papel === PapelUsuario.T
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  // Super admin vê todos; demais veem apenas da própria empresa
  const where = superAdmin ? {} : { empresaId: requester.empresaId ?? "" }

  const users = await db.usuario.findMany({
    where,
    select: USER_SELECT,
    orderBy: { criadoEm: "desc" },
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(opcoesAuth)
  const requester = getRequester(session)
  if (!requester) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { superAdmin } = requester
  // Pode criar usuários: super admin, admin de empresa, admin de grupo
  const isEmpresaAdmin = requester.papel === PapelUsuario.A || requester.grupoIsAdmin
  if (!superAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const body = await request.json()
  const { nome, email, senha, papel, departamento, telefone, empresaId, setorId, grupoId } = body

  if (!nome || !email || !senha || !papel) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
  }

  // Não-super-admin só pode criar usuários na própria empresa
  const resolvedEmpresaId = superAdmin ? empresaId : requester.empresaId

  if (!resolvedEmpresaId) {
    return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })
  }

  // Não-super-admin não pode criar superAdmin
  if (!superAdmin && (papel === "SUPER" || body.superAdmin)) {
    return NextResponse.json({ error: "Sem permissão para criar super administradores." }, { status: 403 })
  }

  const existing = await db.usuario.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 })
  }

  const senhaHash = await bcrypt.hash(senha, 12)

  const user = await db.usuario.create({
    data: {
      nome, email, senha: senhaHash,
      papel: papel as PapelUsuario,
      departamento, telefone,
      empresaId: resolvedEmpresaId,
      ...(setorId ? { setorId } : {}),
      ...(grupoId ? { grupoId } : {}),
    },
    select: USER_SELECT,
  })

  return NextResponse.json(user, { status: 201 })
}
