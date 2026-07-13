/**
 * app/api/barbearia/equipe/route.ts — barbeiros/profissionais (equipe).
 * GET lista · POST cadastra
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const where = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }
  const barbeiros = await db.barbeiro.findMany({
    where,
    orderBy: { nome: "asc" },
    include: { _count: { select: { agendamentos: true } } },
  })
  return NextResponse.json(barbeiros)
}

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  const podeCriar = usuario.superAdmin || usuario.papel === PapelUsuario.A || usuario.papel === PapelUsuario.T || usuario.grupoIsAdmin
  if (!podeCriar) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const b = await req.json()
  if (!b.nome || !b.nome.trim()) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })

  const empresaId = usuario.superAdmin ? (b.empresaId ?? null) : usuario.empresaId
  if (!empresaId) return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })

  const barbeiro = await db.barbeiro.create({
    data: {
      empresaId,
      nome:     b.nome.trim(),
      apelido:  b.apelido?.trim()  || null,
      telefone: b.telefone?.trim() || null,
      cor:      b.cor?.trim()      || "#c9a84c",
    },
    include: { _count: { select: { agendamentos: true } } },
  })
  return NextResponse.json(barbeiro, { status: 201 })
}
