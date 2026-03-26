import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { requireRole } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

// PUT /api/baixas/[id] — roles A e T
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireRole([UserRole.A, UserRole.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.user

  const { id } = await params
  const body = await request.json()
  const { matriculaId, descricao, valor, tipo, status, dataPag, dataVenc } = body

  const existing = await db.baixa.findUnique({
    where: { id },
    include: { matricula: { include: { empCurso: { select: { empresaId: true } } } } },
  })
  if (!existing) {
    return NextResponse.json({ error: "Baixa não encontrada." }, { status: 404 })
  }

  // Validação de escopo via matrícula → curso → empresa
  if (!user.isSuperAdmin && existing.matricula) {
    if (existing.matricula.empCurso.empresaId !== user.empresaId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }
  }

  const baixa = await db.baixa.update({
    where: { id },
    data: {
      ...(matriculaId !== undefined && { matriculaId: matriculaId || null }),
      ...(descricao !== undefined && { descricao: descricao || null }),
      ...(valor !== undefined && { valor: parseFloat(valor) }),
      ...(tipo !== undefined && { tipo }),
      ...(status !== undefined && { status }),
      ...(dataPag !== undefined && { dataPag: dataPag ? new Date(dataPag) : null }),
      ...(dataVenc !== undefined && { dataVenc: dataVenc ? new Date(dataVenc) : null }),
    },
    include: {
      matricula: {
        select: {
          aluno: { select: { nome: true } },
          empCurso: { select: { nome: true } },
        },
      },
    },
  })

  return NextResponse.json(baixa)
}

// DELETE /api/baixas/[id] — só role A
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireRole([UserRole.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.user

  const { id } = await params

  const existing = await db.baixa.findUnique({
    where: { id },
    include: { matricula: { include: { empCurso: { select: { empresaId: true } } } } },
  })
  if (!existing) {
    return NextResponse.json({ error: "Baixa não encontrada." }, { status: 404 })
  }

  if (!user.isSuperAdmin && existing.matricula) {
    if (existing.matricula.empCurso.empresaId !== user.empresaId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }
  }

  await db.baixa.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
