import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser, requireRole } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

// GET /api/matriculas — qualquer role autenticado pode listar
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const matriculas = await db.matricula.findMany({
    orderBy: { createdAt: "desc" },
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

  return NextResponse.json(matriculas)
}

// POST /api/matriculas — roles A e T
export async function POST(request: NextRequest) {
  const auth = await requireRole([UserRole.A, UserRole.T])
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const { alunoId, empCursoId, status, valor, dataInicio, dataFim } = body

  if (!alunoId || !empCursoId) {
    return NextResponse.json({ error: "Aluno e curso são obrigatórios." }, { status: 400 })
  }

  const matricula = await db.matricula.create({
    data: {
      alunoId,
      empCursoId,
      status: status ?? "ativa",
      valor: valor ? parseFloat(valor) : 0,
      dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
      dataFim: dataFim ? new Date(dataFim) : null,
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

  return NextResponse.json(matricula, { status: 201 })
}
