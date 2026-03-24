import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth-helpers"
import { UserRole } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

// PUT /api/matriculas/[id] — roles A e T
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireRole([UserRole.A, UserRole.T])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const body = await request.json()
  const { status, valor, dataInicio, dataFim } = body

  const existing = await db.matricula.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 })
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
      empCurso: {
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
  const auth = await requireRole([UserRole.A])
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const existing = await db.matricula.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Matrícula não encontrada." }, { status: 404 })
  }

  await db.matricula.update({
    where: { id },
    data: { status: "cancelada" },
  })

  return NextResponse.json({ ok: true })
}
