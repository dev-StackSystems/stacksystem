import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser, requireRole } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

// GET /api/cursos — qualquer usuário autenticado pode listar
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const cursos = await db.empCurso.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      empresa: { select: { nome: true } },
    },
  })

  return NextResponse.json(cursos)
}

// POST /api/cursos — apenas ADMIN e TECH
export async function POST(request: NextRequest) {
  const authResult = await requireRole([UserRole.A, UserRole.T])
  if (authResult instanceof NextResponse) return authResult

  const body = await request.json()
  const { empresaId, nome, descricao, cargaHoraria } = body

  if (!empresaId || typeof empresaId !== "string" || empresaId.trim() === "") {
    return NextResponse.json({ error: "Empresa é obrigatória" }, { status: 400 })
  }

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const empresa = await db.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  const curso = await db.empCurso.create({
    data: {
      empresaId: empresaId.trim(),
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      cargaHoraria: cargaHoraria ? Number(cargaHoraria) : null,
    },
    include: {
      empresa: { select: { nome: true } },
    },
  })

  return NextResponse.json(curso, { status: 201 })
}
