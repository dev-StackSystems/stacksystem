import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser, requireRole } from "@/lib/auth-helpers"
import { UserRole } from "@prisma/client"

// GET /api/empresas — qualquer usuário autenticado pode listar
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const empresas = await db.empresa.findMany({
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { cursos: true } },
    },
  })

  return NextResponse.json(empresas)
}

// POST /api/empresas — apenas ADMIN e TECH
export async function POST(request: NextRequest) {
  const authResult = await requireRole([UserRole.A, UserRole.T])
  if (authResult instanceof NextResponse) return authResult

  const body = await request.json()
  const { nome, cnpj, email, telefone } = body

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  // Verificar CNPJ duplicado se fornecido
  if (cnpj && cnpj.trim() !== "") {
    const existing = await db.empresa.findUnique({ where: { cnpj: cnpj.trim() } })
    if (existing) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }
  }

  const empresa = await db.empresa.create({
    data: {
      nome: nome.trim(),
      cnpj: cnpj?.trim() || null,
      email: email?.trim() || null,
      telefone: telefone?.trim() || null,
    },
  })

  return NextResponse.json(empresa, { status: 201 })
}
