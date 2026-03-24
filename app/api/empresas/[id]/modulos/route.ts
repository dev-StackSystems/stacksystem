import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth-helpers"
import { UserRole } from "@prisma/client"

const MODULOS_DISPONIVEIS = [
  "alunos",
  "matriculas",
  "cursos",
  "aulas",
  "salas",
  "baixas",
  "certificados",
]

// GET /api/empresas/[id]/modulos — retorna todos os módulos da empresa
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([UserRole.A, UserRole.T, UserRole.F])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const modulos = await db.empresaModulo.findMany({
    where: { empresaId: id },
  })

  return NextResponse.json(modulos)
}

// POST /api/empresas/[id]/modulos — upsert dos módulos da empresa (apenas ADMIN)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const body = await request.json()
  const { modulos } = body as { modulos: string[] }

  if (!Array.isArray(modulos)) {
    return NextResponse.json({ error: "Campo 'modulos' deve ser um array" }, { status: 400 })
  }

  const empresa = await db.empresa.findUnique({ where: { id } })
  if (!empresa) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  // Upsert de cada módulo disponível
  const upserts = MODULOS_DISPONIVEIS.map((key) =>
    db.empresaModulo.upsert({
      where: { empresaId_modulo: { empresaId: id, modulo: key } },
      create: { empresaId: id, modulo: key, ativo: modulos.includes(key) },
      update: { ativo: modulos.includes(key) },
    })
  )

  const result = await db.$transaction(upserts)

  return NextResponse.json(result)
}
