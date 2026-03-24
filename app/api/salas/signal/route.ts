import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { db } from "@/lib/db"

// ─── Helpers ───────────────────────────────────────────────────────────────

async function findSignalByCodigo(room: string) {
  const sala = await db.sala.findUnique({
    where: { codigo: room },
    include: { signal: true },
  })
  return sala
}

// ─── GET /api/salas/signal?action=get&room=CODE
//     GET /api/salas/signal?action=reset&room=CODE
// ─── POST /api/salas/signal?action=set&room=CODE   body: { offer?, answer?, caller_name?, callee_name? }
//     POST /api/salas/signal?action=ice&room=CODE    body: { role, candidate }

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const room = searchParams.get("room")?.toUpperCase()

  if (!room) {
    return NextResponse.json({ error: "Parâmetro 'room' obrigatório" }, { status: 400 })
  }

  // ── get ──────────────────────────────────────────────────────────────────
  if (action === "get") {
    const sala = await findSignalByCodigo(room)
    if (!sala) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 })
    }

    const sig = sala.signal
    if (!sig) {
      return NextResponse.json({
        offer: null,
        answer: null,
        caller_name: null,
        callee_name: null,
        ice_caller: [],
        ice_callee: [],
      })
    }

    return NextResponse.json({
      offer: sig.offer ? JSON.parse(sig.offer) : null,
      answer: sig.answer ? JSON.parse(sig.answer) : null,
      caller_name: sig.callerName,
      callee_name: sig.calleeName,
      ice_caller: JSON.parse(sig.iceCaller),
      ice_callee: JSON.parse(sig.iceCallee),
    })
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  if (action === "reset") {
    const sala = await findSignalByCodigo(room)
    if (!sala) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 })
    }

    if (sala.signal) {
      await db.salaSignal.delete({ where: { salaId: sala.id } })
    }
    // Recria vazio para a próxima sessão
    await db.salaSignal.create({ data: { salaId: sala.id } })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const room = searchParams.get("room")?.toUpperCase()

  if (!room) {
    return NextResponse.json({ error: "Parâmetro 'room' obrigatório" }, { status: 400 })
  }

  const sala = await findSignalByCodigo(room)
  if (!sala) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 })
  }

  // Garante que o SalaSignal existe
  let sig = sala.signal
  if (!sig) {
    sig = await db.salaSignal.create({ data: { salaId: sala.id } })
  }

  // ── set ───────────────────────────────────────────────────────────────────
  if (action === "set") {
    const body = await req.json()
    const { offer, answer, caller_name, callee_name } = body

    const data: Record<string, string> = {}
    if (offer !== undefined) data.offer = JSON.stringify(offer)
    if (answer !== undefined) data.answer = JSON.stringify(answer)
    if (caller_name !== undefined) data.callerName = caller_name
    if (callee_name !== undefined) data.calleeName = callee_name

    await db.salaSignal.update({
      where: { salaId: sala.id },
      data,
    })

    return NextResponse.json({ ok: true })
  }

  // ── ice ───────────────────────────────────────────────────────────────────
  if (action === "ice") {
    const body = await req.json()
    const { role, candidate } = body

    if (!role || !candidate) {
      return NextResponse.json({ error: "Campos 'role' e 'candidate' obrigatórios" }, { status: 400 })
    }

    if (role === "caller") {
      const current: RTCIceCandidateInit[] = JSON.parse(sig.iceCaller)
      current.push(candidate)
      await db.salaSignal.update({
        where: { salaId: sala.id },
        data: { iceCaller: JSON.stringify(current) },
      })
    } else if (role === "callee") {
      const current: RTCIceCandidateInit[] = JSON.parse(sig.iceCallee)
      current.push(candidate)
      await db.salaSignal.update({
        where: { salaId: sala.id },
        data: { iceCallee: JSON.stringify(current) },
      })
    } else {
      return NextResponse.json({ error: "Role deve ser 'caller' ou 'callee'" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
