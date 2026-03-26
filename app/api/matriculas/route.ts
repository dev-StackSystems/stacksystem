import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

// GET /api/matriculas — scoped por empresa via empCurso
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  if (!user.isSuperAdmin && !user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  // Filtra matrículas pelos cursos da empresa do usuário
  const where = user.isSuperAdmin
    ? {}
    : { empCurso: { empresaId: user.empresaId! } }

  const matriculas = await db.matricula.findMany({
    where,
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

// POST /api/matriculas — admin de empresa ou super admin
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const canCreate =
    user.isSuperAdmin ||
    user.role === UserRole.A ||
    user.role === UserRole.T ||
    user.grupoIsAdmin
  if (!canCreate) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const body = await request.json()
  const { alunoId, empCursoId, status, valor, dataInicio, dataFim } = body

  if (!alunoId || !empCursoId) {
    return NextResponse.json({ error: "Aluno e curso são obrigatórios." }, { status: 400 })
  }

  // Valida que o curso e o aluno pertencem à empresa do usuário (se não for super admin)
  if (!user.isSuperAdmin && user.empresaId) {
    const curso = await db.empCurso.findUnique({ where: { id: empCursoId }, select: { empresaId: true } })
    if (!curso || curso.empresaId !== user.empresaId) {
      return NextResponse.json({ error: "Curso não pertence à sua empresa." }, { status: 403 })
    }
    const aluno = await db.aluno.findUnique({ where: { id: alunoId }, select: { empresaId: true } })
    if (!aluno || aluno.empresaId !== user.empresaId) {
      return NextResponse.json({ error: "Aluno não pertence à sua empresa." }, { status: 403 })
    }
  }

  const matricula = await db.matricula.create({
    data: {
      alunoId, empCursoId,
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
