import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser } from "@/backend/auth/session-helpers"

// GET /api/alunos — qualquer role autenticado pode listar
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const alunos = await db.aluno.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      telefone: true,
      dataNasc: true,
      ativo: true,
      createdAt: true,
    },
  })

  return NextResponse.json(alunos)
}

// POST /api/alunos — qualquer role autenticado pode criar
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const body = await request.json()
  const { nome, email, cpf, telefone, dataNasc } = body

  if (!nome || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 })
  }

  const existing = await db.aluno.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 })
  }

  if (cpf) {
    const existingCpf = await db.aluno.findUnique({ where: { cpf } })
    if (existingCpf) {
      return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 })
    }
  }

  const aluno = await db.aluno.create({
    data: {
      nome,
      email,
      cpf: cpf || null,
      telefone: telefone || null,
      dataNasc: dataNasc ? new Date(dataNasc) : null,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      telefone: true,
      dataNasc: true,
      ativo: true,
      createdAt: true,
    },
  })

  return NextResponse.json(aluno, { status: 201 })
}
