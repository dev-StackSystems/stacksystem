import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser } from "@/backend/auth/session-helpers"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const where = user.role === "A" ? {} : { empresaId: user.empresaId ?? undefined }

  const grupos = await db.grupo.findMany({
    where,
    orderBy: { nome: "asc" },
    include: {
      empresa: { select: { nome: true } },
      modulos: { select: { modulo: true } },
      _count: { select: { usuarios: true } },
    },
  })

  return NextResponse.json(grupos)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (user.role !== "A" && !user.grupoIsAdmin)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { nome, descricao, isAdmin, empresaId, modulos } = await req.json()

  if (!nome?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })

  const empId = user.role === "A" ? empresaId : user.empresaId
  if (!empId) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 400 })

  const grupo = await db.grupo.create({
    data: {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      isAdmin: isAdmin ?? false,
      empresaId: empId,
      modulos: {
        createMany: {
          data: (modulos ?? []).map((m: string) => ({ modulo: m })),
          skipDuplicates: true,
        },
      },
    },
    include: {
      modulos: { select: { modulo: true } },
      _count: { select: { usuarios: true } },
    },
  })

  return NextResponse.json(grupo, { status: 201 })
}
