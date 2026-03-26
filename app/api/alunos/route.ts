import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

const ALUNO_SELECT = {
  id: true, nome: true, email: true, cpf: true,
  telefone: true, dataNasc: true, ativo: true, createdAt: true,
  _count: { select: { matriculas: true } },
}

// GET /api/alunos — scoped por empresa
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  // Super admin vê todos; demais precisam de empresa
  if (!user.isSuperAdmin && !user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const where = user.isSuperAdmin ? {} : { empresaId: user.empresaId! }

  const alunos = await db.aluno.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: ALUNO_SELECT,
  })

  return NextResponse.json(alunos)
}

// POST /api/alunos — cria aluno vinculado à empresa do usuário
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  // Apenas quem pode gerenciar alunos: não-F com empresa definida
  if (user.role === UserRole.F && !user.isSuperAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const body = await request.json()
  const { nome, email, cpf, telefone, dataNasc } = body

  if (!nome || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 })
  }

  // Empresa: super admin pode receber empresaId no body; demais usam a própria
  const empresaId = user.isSuperAdmin ? (body.empresaId ?? null) : user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })
  }

  // Email único por empresa
  const existingEmail = await db.aluno.findFirst({ where: { empresaId, email } })
  if (existingEmail) {
    return NextResponse.json({ error: "E-mail já cadastrado nesta empresa." }, { status: 409 })
  }

  if (cpf) {
    const existingCpf = await db.aluno.findFirst({ where: { empresaId, cpf } })
    if (existingCpf) {
      return NextResponse.json({ error: "CPF já cadastrado nesta empresa." }, { status: 409 })
    }
  }

  const aluno = await db.aluno.create({
    data: {
      empresaId,
      nome,
      email,
      cpf: cpf || null,
      telefone: telefone || null,
      dataNasc: dataNasc ? new Date(dataNasc) : null,
    },
    select: ALUNO_SELECT,
  })

  return NextResponse.json(aluno, { status: 201 })
}
