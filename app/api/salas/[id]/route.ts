import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const sala = await db.sala.findUnique({ where: { id } })

    if (!sala) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 })
    }

    const isAdmin = session.user.role === "A"
    const isCriador = sala.criadoPorId === session.user.id

    if (!isAdmin && !isCriador) {
      return NextResponse.json({ error: "Sem permissão para excluir esta sala" }, { status: 403 })
    }

    await db.sala.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[API/salas DELETE]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const sala = await db.sala.findUnique({
      where: { id },
      include: {
        criadoPor: { select: { name: true, id: true } },
        empresa: { select: { nome: true } },
      },
    })

    if (!sala || !sala.ativa) {
      return NextResponse.json({ error: "Sala não encontrada ou inativa" }, { status: 404 })
    }

    return NextResponse.json(sala)
  } catch (error) {
    console.error("[API/salas/:id GET]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
