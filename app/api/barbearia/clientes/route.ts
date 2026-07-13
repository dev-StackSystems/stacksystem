/**
 * app/api/barbearia/clientes/route.ts — clientes da barbearia.
 * GET lista · POST cadastra
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

const paraData = (v: unknown): Date | null => {
  if (!v || typeof v !== "string") return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const where = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }
  const clientes = await db.clienteBarbearia.findMany({
    where,
    orderBy: { nome: "asc" },
    include: { _count: { select: { agendamentos: true } } },
  })
  return NextResponse.json(clientes)
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

  const cliente = await db.clienteBarbearia.create({
    data: {
      empresaId,
      nome:       b.nome.trim(),
      telefone:   b.telefone?.trim()   || null,
      email:      b.email?.trim()      || null,
      nascimento: paraData(b.nascimento),
      observacao: b.observacao?.trim() || null,
    },
    include: { _count: { select: { agendamentos: true } } },
  })
  return NextResponse.json(cliente, { status: 201 })
}
