/**
 * app/api/grupos/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para grupos de usuários dentro da empresa.
 *
 * GET  /api/grupos — lista grupos da empresa
 * POST /api/grupos — cria novo grupo
 *
 * Um grupo pode ter isAdmin=true (acesso completo aos módulos da empresa)
 * ou uma lista específica de módulos permitidos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"

// ── GET /api/grupos ────────────────────────────────────────────────────────

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  // superAdmin vê todos; demais veem apenas da própria empresa
  const filtro = usuario.superAdmin ? {} : { empresaId: usuario.empresaId ?? undefined }

  const grupos = await db.grupo.findMany({
    where:   filtro,
    orderBy: { nome: "asc" },
    include: {
      empresa: { select: { nome: true } },
      modulos: { select: { modulo: true } },
      _count:  { select: { usuarios: true } }, // Contagem de usuários no grupo
    },
  })

  return NextResponse.json(grupos)
}

// ── POST /api/grupos ───────────────────────────────────────────────────────

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  // Apenas admin da empresa ou superAdmin pode criar grupos
  if (usuario.papel !== "A" && !usuario.grupoIsAdmin) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  const { nome, descricao, isAdmin, empresaId, modulos } = await requisicao.json()

  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 })

  // Resolve a empresa: superAdmin pode criar em qualquer; demais usam a própria
  const empresaResolvida = usuario.superAdmin ? empresaId : usuario.empresaId
  if (!empresaResolvida) return NextResponse.json({ erro: "Empresa não encontrada" }, { status: 400 })

  const grupo = await db.grupo.create({
    data: {
      nome:        nome.trim(),
      descricao:   descricao?.trim() || null,
      isAdmin:     isAdmin ?? false,
      empresaId:   empresaResolvida,
      modulos: {
        createMany: {
          data:            (modulos ?? []).map((m: string) => ({ modulo: m })),
          skipDuplicates:  true,
        },
      },
    },
    include: {
      modulos: { select: { modulo: true } },
      _count:  { select: { usuarios: true } },
    },
  })

  return NextResponse.json(grupo, { status: 201 })
}
