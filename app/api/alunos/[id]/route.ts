import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser, requireRole } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

// GET /api/alunos/[id] — qualquer role autenticado
export async function GET(_: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { id } = await params

  const aluno = await db.aluno.findUnique({
    where: { id },
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

  if (!aluno) {
    return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 })
  }

  return NextResponse.json(aluno)
}

// PUT /api/alunos/[id] — qualquer role autenticado pode editar
export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { nome, email, cpf, telefone, dataNasc, ativo } = body

  if (!nome || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 })
  }

  // Verifica e-mail duplicado (exceto o próprio)
  const existingEmail = await db.aluno.findFirst({
    where: { email, NOT: { id } },
  })
  if (existingEmail) {
    return NextResponse.json({ error: "E-mail já cadastrado para outro aluno." }, { status: 409 })
  }

  // Verifica CPF duplicado (exceto o próprio)
  if (cpf) {
    const existingCpf = await db.aluno.findFirst({
      where: { cpf, NOT: { id } },
    })
    if (existingCpf) {
      return NextResponse.json({ error: "CPF já cadastrado para outro aluno." }, { status: 409 })
    }
  }

  const aluno = await db.aluno.update({
    where: { id },
    data: {
      nome,
      email,
      cpf: cpf || null,
      telefone: telefone || null,
      dataNasc: dataNasc ? new Date(dataNasc) : null,
      ativo: typeof ativo === "boolean" ? ativo : true,
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

  return NextResponse.json(aluno)
}

// DELETE /api/alunos/[id] — soft delete, apenas ADMIN
export async function DELETE(_: NextRequest, { params }: Params) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  await db.aluno.update({
    where: { id },
    data: { ativo: false },
  })

  return NextResponse.json({ success: true })
}
