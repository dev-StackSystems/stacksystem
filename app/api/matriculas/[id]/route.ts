import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { exigirPapel } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

// PUT /api/matriculas/[id] — roles A e T
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const body = await request.json()
  const { status, valor, dataInicio, dataFim } = body

  const existing = await db.matricula.findUnique({
    where: { id },
    include: { curso: { select: { empresaId: true } } },
  })
  if (!existing) {
    return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 })
  }

  if (!user.superAdmin && existing.curso.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const matricula = await db.matricula.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(valor !== undefined && { valor: parseFloat(valor) }),
      ...(dataInicio !== undefined && { dataInicio: dataInicio ? new Date(dataInicio) : existing.dataInicio }),
      ...(dataFim !== undefined && { dataFim: dataFim ? new Date(dataFim) : null }),
    },
    include: {
      aluno: { select: { nome: true, email: true } },
      curso: {
        select: {
          nome: true,
          empresa: { select: { nome: true } },
        },
      },
    },
  })

  return NextResponse.json(matricula)
}

// DELETE /api/matriculas/[id] — soft delete (status = "cancelada"), só role A
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params

  const existing = await db.matricula.findUnique({
    where: { id },
    include: { curso: { select: { empresaId: true } } },
  })
  if (!existing) {
    return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 })
  }

  if (!user.superAdmin && existing.curso.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  await db.matricula.update({
    where: { id },
    data: { status: "cancelada" },
  })

  return NextResponse.json({ ok: true })
}
