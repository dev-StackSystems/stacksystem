/**
 * app/api/salas/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para salas de videoaula (WebRTC).
 *
 * GET  /api/salas — lista salas da empresa
 * POST /api/salas — cria nova sala
 *
 * Regras de isolamento de tenant:
 *   - superAdmin vê todas as salas
 *   - demais veem apenas salas da própria empresa
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"

/** Gera código de sala aleatório de 6 caracteres (ex: "ABC123") */
function gerarCodigo(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ── GET /api/salas ─────────────────────────────────────────────────────────

export async function GET() {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  // superAdmin vê todas as salas; demais veem apenas da própria empresa
  const filtro = sessao.user.superAdmin
    ? { ativa: true }
    : { ativa: true, empresaId: sessao.user.empresaId ?? undefined }

  try {
    const salas = await db.sala.findMany({
      where:   filtro,
      orderBy: { criadoEm: "desc" },
      include: {
        criadoPor: { select: { nome: true, id: true } },
        empresa:   { select: { nome: true } },
      },
    })
    return NextResponse.json(salas)
  } catch (erro) {
    console.error("[API/salas GET]", erro)
    return NextResponse.json({ erro: "Erro interno do servidor" }, { status: 500 })
  }
}

// Papéis que podem criar salas e hospedar chamadas
const PAPEIS_INTERNOS = ["A", "T", "I"]

// ── POST /api/salas ────────────────────────────────────────────────────────

export async function POST(requisicao: NextRequest) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const ehInterno = sessao.user.superAdmin || PAPEIS_INTERNOS.includes(sessao.user.papel ?? "")
  if (!ehInterno) {
    return NextResponse.json({ erro: "Sem permissão para criar salas." }, { status: 403 })
  }

  try {
    const corpo = await requisicao.json()
    const { nome, maxParticipantes } = corpo

    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      return NextResponse.json({ erro: "Nome da sala é obrigatório" }, { status: 400 })
    }

    // Gera código único tentando até 5 vezes
    let codigo = gerarCodigo()
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const existente = await db.sala.findUnique({ where: { codigo } })
      if (!existente) break
      codigo = gerarCodigo()
    }

    const sala = await db.sala.create({
      data: {
        nome:             nome.trim(),
        codigo,
        maxParticipantes: maxParticipantes ? Number(maxParticipantes) : 10,
        criadoPorId:      sessao.user.id,
        empresaId:        sessao.user.empresaId ?? null,
      },
      include: {
        criadoPor: { select: { nome: true, id: true } },
        empresa:   { select: { nome: true } },
      },
    })

    // Cria o registro de sinalização WebRTC vazio para a sala
    await db.sinalSala.create({ data: { salaId: sala.id } })

    return NextResponse.json(sala, { status: 201 })
  } catch (erro) {
    console.error("[API/salas POST]", erro)
    return NextResponse.json({ erro: "Erro interno do servidor" }, { status: 500 })
  }
}
