import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-helpers"

// In-memory para Fase 1 — substituir por tabela DB na Fase 2
const roomStore = new Map<string, { id: string; name: string; createdBy: string; createdAt: string }>()

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  return NextResponse.json(Array.from(roomStore.values()))
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { name } = await request.json()
  const id = crypto.randomUUID()
  const room = {
    id,
    name: name ?? `Sala ${id.slice(0, 8)}`,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }
  roomStore.set(id, room)

  return NextResponse.json(room, { status: 201 })
}
