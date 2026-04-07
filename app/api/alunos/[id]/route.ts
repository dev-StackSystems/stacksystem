import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

const ALUNO_SELECT = {
  id: true, nome: true, email: true, cpf: true,
  telefone: true, dataNasc: true, ativo: true, criadoEm: true,
  _count: { select: { matriculas: true } },
}

async function getAlunoScoped(id: string, user: NonNullable<Awaited<ReturnType<typeof getUsuarioAtual>>>) {
  const aluno = await db.aluno.findUnique({ where: { id }, select: { ...ALUNO_SELECT, empresaId: true } })
  if (!aluno) return null
  // Super admin acessa qualquer um; demais apenas da própria empresa
  if (!user.superAdmin && aluno.empresaId !== user.empresaId) return null
  return aluno
}

export async function GET(_: NextRequest, { params }: Params) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  const aluno = await getAlunoScoped(id, user)
  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 })

  return NextResponse.json(aluno)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  if (user.papel === PapelUsuario.F && !user.superAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params
  const aluno = await getAlunoScoped(id, user)
  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 })

  const body = await request.json()
  const { nome, email, cpf, telefone, dataNasc, ativo } = body

  if (!nome || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 })
  }

  // Email único por empresa (exceto o próprio)
  const existingEmail = await db.aluno.findFirst({
    where: { empresaId: aluno.empresaId, email, NOT: { id } },
  })
  if (existingEmail) {
    return NextResponse.json({ error: "E-mail já cadastrado para outro aluno nesta empresa." }, { status: 409 })
  }

  if (cpf) {
    const existingCpf = await db.aluno.findFirst({
      where: { empresaId: aluno.empresaId, cpf, NOT: { id } },
    })
    if (existingCpf) {
      return NextResponse.json({ error: "CPF já cadastrado para outro aluno nesta empresa." }, { status: 409 })
    }
  }

  const updated = await db.aluno.update({
    where: { id },
    data: {
      nome, email,
      cpf: cpf || null,
      telefone: telefone || null,
      dataNasc: dataNasc ? new Date(dataNasc) : null,
      ativo: typeof ativo === "boolean" ? ativo : true,
    },
    select: ALUNO_SELECT,
  })

  return NextResponse.json(updated)
}

// DELETE — soft delete, apenas admin de empresa ou super admin
export async function DELETE(_: NextRequest, { params }: Params) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const isEmpresaAdmin = user.papel === PapelUsuario.A || user.grupoIsAdmin
  if (!user.superAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params
  const aluno = await getAlunoScoped(id, user)
  if (!aluno) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 })

  await db.aluno.update({ where: { id }, data: { ativo: false } })
  return NextResponse.json({ success: true })
}
