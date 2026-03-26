import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

// GET /api/baixas — scoped por empresa via matricula → empCurso
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  if (!user.isSuperAdmin && !user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  // Filtra baixas pelas matrículas dos cursos da empresa
  const where = user.isSuperAdmin
    ? {}
    : { matricula: { empCurso: { empresaId: user.empresaId! } } }

  const baixas = await db.baixa.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      matricula: {
        select: {
          aluno: { select: { nome: true } },
          empCurso: { select: { nome: true } },
        },
      },
    },
  })

  return NextResponse.json(baixas)
}

// POST /api/baixas — admin de empresa ou super admin
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
  const { matriculaId, descricao, valor, tipo, status, dataPag, dataVenc } = body

  if (valor === undefined || valor === null || valor === "") {
    return NextResponse.json({ error: "Valor é obrigatório." }, { status: 400 })
  }

  // Valida que a matrícula pertence à empresa do usuário
  if (!user.isSuperAdmin && matriculaId && user.empresaId) {
    const matricula = await db.matricula.findUnique({
      where: { id: matriculaId },
      select: { empCurso: { select: { empresaId: true } } },
    })
    if (!matricula || matricula.empCurso.empresaId !== user.empresaId) {
      return NextResponse.json({ error: "Matrícula não pertence à sua empresa." }, { status: 403 })
    }
  }

  const baixa = await db.baixa.create({
    data: {
      matriculaId: matriculaId || null,
      descricao: descricao || null,
      valor: parseFloat(valor),
      tipo: tipo ?? "mensalidade",
      status: status ?? "pendente",
      dataPag: dataPag ? new Date(dataPag) : null,
      dataVenc: dataVenc ? new Date(dataVenc) : null,
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

  return NextResponse.json(baixa, { status: 201 })
}
