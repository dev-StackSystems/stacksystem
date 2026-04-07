/**
 * app/api/salas/[id]/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para operações em uma sala específica.
 *
 * GET    /api/salas/[id] — busca uma sala pelo ID
 * DELETE /api/salas/[id] — remove a sala (criador ou admin)
 *
 * Regras de isolamento de tenant:
 *   - Não-superAdmin só pode operar em salas da própria empresa
 *   - DELETE: apenas o criador, admin da empresa ou superAdmin
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"

// ── DELETE /api/salas/[id] ─────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { id } = await params

  try {
    const sala = await db.sala.findUnique({ where: { id } })
    if (!sala) return NextResponse.json({ erro: "Sala não encontrada" }, { status: 404 })

    const { superAdmin } = sessao.user

    // Isolamento de tenant: não-superAdmin só pode operar na própria empresa
    if (!superAdmin && sala.empresaId !== sessao.user.empresaId) {
      return NextResponse.json({ erro: "Sem permissão para excluir esta sala" }, { status: 403 })
    }

    // Apenas o criador, admin da empresa ou superAdmin pode excluir
    const isAdmin  = superAdmin || sessao.user.papel === "A" || sessao.user.grupoIsAdmin
    const isCriador = sala.criadoPorId === sessao.user.id

    if (!isAdmin && !isCriador) {
      return NextResponse.json({ erro: "Sem permissão para excluir esta sala" }, { status: 403 })
    }

    await db.sala.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error("[API/salas DELETE]", erro)
    return NextResponse.json({ erro: "Erro interno do servidor" }, { status: 500 })
  }
}

// ── GET /api/salas/[id] ────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { id } = await params

  try {
    const sala = await db.sala.findUnique({
      where:   { id },
      include: {
        criadoPor: { select: { nome: true, id: true } },
        empresa:   { select: { nome: true } },
      },
    })

    if (!sala || !sala.ativa) {
      return NextResponse.json({ erro: "Sala não encontrada ou inativa" }, { status: 404 })
    }

    return NextResponse.json(sala)
  } catch (erro) {
    console.error("[API/salas/:id GET]", erro)
    return NextResponse.json({ erro: "Erro interno do servidor" }, { status: 500 })
  }
}
