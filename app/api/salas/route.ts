import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { db } from "@/backend/database/prisma-client"

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const where =
    session.user.role !== "A"
      ? { ativa: true, empresaId: session.user.empresaId ?? undefined }
      : { ativa: true }

  try {
    const salas = await db.sala.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        criadoPor: { select: { name: true, id: true } },
        empresa: { select: { nome: true } },
      },
    })

    return NextResponse.json(salas)
  } catch (error) {
    console.error("[API/salas GET]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { nome, maxParticipantes } = body

    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      return NextResponse.json({ error: "Nome da sala é obrigatório" }, { status: 400 })
    }

    // Gera código único de 6 chars (ex: ABC123)
    let codigo = genCode()
    // Garante unicidade tentando até 5 vezes
    for (let i = 0; i < 5; i++) {
      const existe = await db.sala.findUnique({ where: { codigo } })
      if (!existe) break
      codigo = genCode()
    }

    const sala = await db.sala.create({
      data: {
        nome: nome.trim(),
        codigo,
        maxParticipantes: maxParticipantes ? Number(maxParticipantes) : 10,
        criadoPorId: session.user.id,
        empresaId: session.user.empresaId ?? null,
      },
      include: {
        criadoPor: { select: { name: true, id: true } },
        empresa: { select: { nome: true } },
      },
    })

    // Cria o SalaSignal inicial vazio
    await db.salaSignal.create({ data: { salaId: sala.id } })

    return NextResponse.json(sala, { status: 201 })
  } catch (error) {
    console.error("[API/salas POST]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
