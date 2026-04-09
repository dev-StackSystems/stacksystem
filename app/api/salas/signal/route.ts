import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"

// ─── Helpers ───────────────────────────────────────────────────────────────

async function findSignalByCodigo(room: string) {
  const sala = await db.sala.findUnique({
    where: { codigo: room },
    include: { sinal: true },
  })
  return sala
}

// ─── GET /api/salas/signal?action=get&room=CODE
//     GET /api/salas/signal?action=reset&room=CODE
// ─── POST /api/salas/signal?action=set&room=CODE   body: { offer?, answer?, caller_name?, callee_name? }
//     POST /api/salas/signal?action=ice&room=CODE    body: { role, candidate }

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) {
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

    const sig = sala.sinal
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
      offer:       sig.offer  ? JSON.parse(sig.offer)  : null,
      answer:      sig.answer ? JSON.parse(sig.answer) : null,
      caller_name: sig.nomeCaller ?? null,
      callee_name: sig.nomeCallee ?? null,
      ice_caller:  JSON.parse(sig.iceCaller),
      ice_callee:  JSON.parse(sig.iceCallee),
    })
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  if (action === "reset") {
    const sala = await findSignalByCodigo(room)
    if (!sala) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 })
    }

    if (sala.sinal) {
      await db.sinalSala.delete({ where: { salaId: sala.id } })
    }
    // Recria vazio para a próxima sessão
    await db.sinalSala.create({ data: { salaId: sala.id } })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) {
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
  let sig = sala.sinal
  if (!sig) {
    sig = await db.sinalSala.create({ data: { salaId: sala.id } })
  }

  // ── set ───────────────────────────────────────────────────────────────────
  if (action === "set") {
    const body = await req.json()
    const { offer, answer, caller_name, callee_name } = body

    const data: Record<string, string> = {}
    if (offer !== undefined) data.offer = JSON.stringify(offer)
    if (answer !== undefined) data.answer = JSON.stringify(answer)
    if (caller_name !== undefined) data.nomeCaller = caller_name
    if (callee_name !== undefined) data.nomeCallee = callee_name

    await db.sinalSala.update({
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
      await db.sinalSala.update({
        where: { salaId: sala.id },
        data: { iceCaller: JSON.stringify(current) },
      })
    } else if (role === "callee") {
      const current: RTCIceCandidateInit[] = JSON.parse(sig.iceCallee)
      current.push(candidate)
      await db.sinalSala.update({
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
