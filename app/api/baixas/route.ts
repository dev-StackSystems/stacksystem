import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, requireRole } from "@/lib/auth-helpers"
import { UserRole } from "@prisma/client"

// GET /api/baixas — qualquer role autenticado pode listar
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const baixas = await db.baixa.findMany({
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

// POST /api/baixas — roles A e T
export async function POST(request: NextRequest) {
  const auth = await requireRole([UserRole.A, UserRole.T])
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const { matriculaId, descricao, valor, tipo, status, dataPag, dataVenc } = body

  if (valor === undefined || valor === null || valor === "") {
    return NextResponse.json({ error: "Valor é obrigatório." }, { status: 400 })
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
