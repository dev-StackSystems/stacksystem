/**
 * app/api/salas/signal/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servidor de sinalização WebRTC — lógica idêntica ao webtrc.php.
 *
 * O PHP usava /tmp/webrtc_room_{CODE}.json como armazenamento.
 * Aqui usamos SinalWebrtc { codigo, dados } no banco — mesma estrutura JSON.
 *
 * GET  ?action=get&room=CODE    → retorna os dados da sala
 * GET  ?action=reset&room=CODE  → apaga os dados da sala
 * POST ?action=set&room=CODE    body: { offer?, answer?, caller_name?, callee_name? }
 * POST ?action=ice&room=CODE    body: { role, candidate }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"

// ── Tipo do JSON armazenado (espelho do PHP) ───────────────────────────────

interface DadosSala {
  offer?:       { type: string; sdp: string }
  answer?:      { type: string; sdp: string }
  caller_name?: string
  callee_name?: string
  ice_caller:   RTCIceCandidateInit[]
  ice_callee:   RTCIceCandidateInit[]
  updated_at?:  number
}

// ── Helper: lê os dados da sala ou retorna objeto vazio ────────────────────

async function lerDados(codigo: string): Promise<DadosSala> {
  const registro = await db.sinalWebrtc.findUnique({ where: { codigo } })
  if (!registro) return { ice_caller: [], ice_callee: [] }
  try {
    return JSON.parse(registro.dados) as DadosSala
  } catch {
    return { ice_caller: [], ice_callee: [] }
  }
}

// ── Helper: grava os dados da sala ────────────────────────────────────────

async function gravarDados(codigo: string, dados: DadosSala) {
  await db.sinalWebrtc.upsert({
    where:  { codigo },
    update: { dados: JSON.stringify(dados) },
    create: { codigo, dados: JSON.stringify(dados) },
  })
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const codigo = (searchParams.get("room") ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

  if (!codigo) return NextResponse.json({ error: "room obrigatório" }, { status: 400 })

  // ── get ─────────────────────────────────────────────────────────────────
  if (action === "get") {
    const dados = await lerDados(codigo)
    return NextResponse.json(dados)
  }

  // ── reset ────────────────────────────────────────────────────────────────
  if (action === "reset") {
    await db.sinalWebrtc.deleteMany({ where: { codigo } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const codigo = (searchParams.get("room") ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase()

  if (!codigo) return NextResponse.json({ error: "room obrigatório" }, { status: 400 })

  const body = await req.json().catch(() => ({}))

  // ── set ──────────────────────────────────────────────────────────────────
  if (action === "set") {
    const dados = await lerDados(codigo)

    // Mescla os campos do body nos dados existentes (igual ao PHP)
    if (body.offer       !== undefined) dados.offer       = body.offer
    if (body.answer      !== undefined) dados.answer      = body.answer
    if (body.caller_name !== undefined) dados.caller_name = body.caller_name
    if (body.callee_name !== undefined) dados.callee_name = body.callee_name
    dados.updated_at = Date.now()

    await gravarDados(codigo, dados)
    return NextResponse.json({ ok: true })
  }

  // ── ice ──────────────────────────────────────────────────────────────────
  if (action === "ice") {
    const { role, candidate } = body
    if (!role || !candidate) {
      return NextResponse.json({ error: "role e candidate obrigatórios" }, { status: 400 })
    }

    const dados = await lerDados(codigo)

    if (role === "caller") {
      dados.ice_caller = [...(dados.ice_caller ?? []), candidate]
    } else if (role === "callee") {
      dados.ice_callee = [...(dados.ice_callee ?? []), candidate]
    } else {
      return NextResponse.json({ error: "role inválido" }, { status: 400 })
    }

    dados.updated_at = Date.now()
    await gravarDados(codigo, dados)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
