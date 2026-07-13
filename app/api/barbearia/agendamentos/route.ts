/**
 * app/api/barbearia/agendamentos/route.ts
 * Agendamentos / atendimentos da barbearia.
 * GET  ?de&ate&barbeiroId&status — lista
 * POST — cria (snapshot de duração/preço do serviço)
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { PapelUsuario } from "@prisma/client"

const INCLUDE = {
  barbeiro: { select: { nome: true, apelido: true, cor: true } },
  servico:  { select: { nome: true, cor: true } },
  cliente:  { select: { nome: true, telefone: true } },
}

const serializar = (a: { preco: { toString(): string }; [k: string]: unknown }) => ({ ...a, preco: Number(a.preco) })

export async function GET(req: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin && !usuario.empresaId) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const where: Record<string, unknown> = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }
  if (sp.get("barbeiroId")) where.barbeiroId = sp.get("barbeiroId")
  if (sp.get("status"))     where.status = sp.get("status")
  const de = sp.get("de"), ate = sp.get("ate")
  if (de || ate) where.dataHora = { ...(de ? { gte: new Date(de) } : {}), ...(ate ? { lte: new Date(ate) } : {}) }

  const lista = await db.agendamento.findMany({ where, orderBy: { dataHora: "asc" }, include: INCLUDE })
  return NextResponse.json(lista.map(serializar))
}

export async function POST(req: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  const podeCriar = usuario.superAdmin || usuario.papel === PapelUsuario.A || usuario.papel === PapelUsuario.T || usuario.grupoIsAdmin
  if (!podeCriar) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const b = await req.json()
  const empresaId = usuario.superAdmin ? (b.empresaId ?? null) : usuario.empresaId
  if (!empresaId) return NextResponse.json({ error: "Empresa é obrigatória." }, { status: 400 })
  if (!b.barbeiroId) return NextResponse.json({ error: "Escolha o profissional." }, { status: 400 })
  if (!b.servicoId)  return NextResponse.json({ error: "Escolha o serviço." }, { status: 400 })
  if (!b.dataHora)   return NextResponse.json({ error: "Informe data e hora." }, { status: 400 })
  const dataHora = new Date(b.dataHora)
  if (isNaN(dataHora.getTime())) return NextResponse.json({ error: "Data/hora inválida." }, { status: 400 })

  // Vínculos precisam ser da mesma empresa
  const [barbeiro, servico, cliente] = await Promise.all([
    db.barbeiro.findUnique({ where: { id: b.barbeiroId }, select: { empresaId: true } }),
    db.servicoBarbearia.findUnique({ where: { id: b.servicoId }, select: { empresaId: true, duracaoMin: true, preco: true } }),
    b.clienteId ? db.clienteBarbearia.findUnique({ where: { id: b.clienteId }, select: { empresaId: true } }) : Promise.resolve(null),
  ])
  if (!barbeiro || barbeiro.empresaId !== empresaId) return NextResponse.json({ error: "Profissional inválido." }, { status: 400 })
  if (!servico  || servico.empresaId  !== empresaId) return NextResponse.json({ error: "Serviço inválido." }, { status: 400 })
  if (b.clienteId && (!cliente || cliente.empresaId !== empresaId)) return NextResponse.json({ error: "Cliente inválido." }, { status: 400 })

  const ag = await db.agendamento.create({
    data: {
      empresaId,
      barbeiroId:    b.barbeiroId,
      servicoId:     b.servicoId,
      clienteId:     b.clienteId || null,
      clienteAvulso: b.clienteId ? null : (b.clienteAvulso?.trim() || null),
      dataHora,
      duracaoMin:    servico.duracaoMin,
      preco:         Number(servico.preco),
      status:        "agendado",
      observacao:    b.observacao?.trim() || null,
    },
    include: INCLUDE,
  })
  return NextResponse.json(serializar(ag), { status: 201 })
}
