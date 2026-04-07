/**
 * app/api/setores/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para setores (departamentos) da empresa.
 *
 * GET  /api/setores — lista setores da empresa
 * POST /api/setores — cria novo setor
 *
 * Cada setor pode ter uma lista de módulos permitidos.
 * Usuários vinculados a um setor herdam a restrição de módulos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"

// ── GET /api/setores ───────────────────────────────────────────────────────

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const filtro = usuario.superAdmin ? {} : { empresaId: usuario.empresaId ?? undefined }

  const setores = await db.setor.findMany({
    where:   filtro,
    orderBy: { nome: "asc" },
    include: {
      empresa: { select: { nome: true } },
      modulos: { select: { modulo: true } },
      _count:  { select: { usuarios: true } },
    },
  })

  return NextResponse.json(setores)
}

// ── POST /api/setores ──────────────────────────────────────────────────────

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  if (usuario.papel !== "A" && !usuario.grupoIsAdmin) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  const { nome, descricao, empresaId, modulos } = await requisicao.json()

  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 })

  const empresaResolvida = usuario.superAdmin ? empresaId : usuario.empresaId
  if (!empresaResolvida) return NextResponse.json({ erro: "Empresa não encontrada" }, { status: 400 })

  const setor = await db.setor.create({
    data: {
      nome:      nome.trim(),
      descricao: descricao?.trim() || null,
      empresaId: empresaResolvida,
      modulos: {
        createMany: {
          data:           (modulos ?? []).map((m: string) => ({ modulo: m })),
          skipDuplicates: true,
        },
      },
    },
    include: {
      modulos: { select: { modulo: true } },
      _count:  { select: { usuarios: true } },
    },
  })

  return NextResponse.json(setor, { status: 201 })
}
