import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

// GET /api/cursos — scoped por empresa
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  if (!user.isSuperAdmin && !user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const where = user.isSuperAdmin ? {} : { empresaId: user.empresaId! }

  const cursos = await db.empCurso.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { empresa: { select: { nome: true } } },
  })

  return NextResponse.json(cursos)
}

// POST /api/cursos — admin de empresa ou super admin
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
  const { nome, descricao, cargaHoraria, empresaId: bodyEmpresaId } = body

  // Não-super-admin usa sempre a própria empresa
  const empresaId = user.isSuperAdmin ? bodyEmpresaId : user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })
  }

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const empresa = await db.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })

  const curso = await db.empCurso.create({
    data: {
      empresaId,
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      cargaHoraria: cargaHoraria ? Number(cargaHoraria) : null,
    },
    include: { empresa: { select: { nome: true } } },
  })

  return NextResponse.json(curso, { status: 201 })
}
