import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

    const sala = await db.sala.create({
      data: {
        nome: nome.trim(),
        maxParticipantes: maxParticipantes ? Number(maxParticipantes) : 10,
        criadoPorId: session.user.id,
        empresaId: session.user.empresaId ?? null,
      },
      include: {
        criadoPor: { select: { name: true, id: true } },
        empresa: { select: { nome: true } },
      },
    })

    return NextResponse.json(sala, { status: 201 })
  } catch (error) {
    console.error("[API/salas POST]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
