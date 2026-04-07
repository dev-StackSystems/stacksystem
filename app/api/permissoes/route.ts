/**
 * app/api/permissoes/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para permissões granulares por usuário/grupo e módulo.
 *
 * GET  /api/permissoes?empresaId=&usuarioId=&grupoId=&modulo=
 * POST /api/permissoes — cria ou atualiza (upsert) uma permissão
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse }     from "next/server"
import { db }                            from "@/servidor/banco/cliente"
import { exigirPapel }                   from "@/servidor/autenticacao/sessao"
import { PapelUsuario }                  from "@prisma/client"

// ── GET /api/permissoes ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const { usuario } = auth

  const { searchParams } = new URL(req.url)
  const empresaId = searchParams.get("empresaId")
  const usuarioId = searchParams.get("usuarioId") ?? undefined
  const grupoId   = searchParams.get("grupoId")   ?? undefined
  const modulo    = searchParams.get("modulo")    ?? undefined

  // Não-superadmin só pode ver permissões da própria empresa
  const empresaResolvida = usuario.superAdmin
    ? (empresaId ?? undefined)
    : (usuario.empresaId ?? undefined)

  if (!empresaResolvida) {
    return NextResponse.json({ erro: "empresaId é obrigatório" }, { status: 400 })
  }

  const permissoes = await db.permissaoUsuario.findMany({
    where: {
      empresaId: empresaResolvida,
      ...(usuarioId ? { usuarioId } : {}),
      ...(grupoId   ? { grupoId   } : {}),
      ...(modulo    ? { modulo    } : {}),
    },
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
      grupo:   { select: { id: true, nome: true } },
    },
    orderBy: [{ modulo: "asc" }, { criadoEm: "asc" }],
  })

  return NextResponse.json(permissoes)
}

// ── POST /api/permissoes ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const { usuario } = auth

  const corpo = await req.json()
  const { empresaId, usuarioId, grupoId, modulo, podeLer, podeCriar, podeEditar, podeDeletar } = corpo

  if (!modulo) {
    return NextResponse.json({ erro: "modulo é obrigatório" }, { status: 400 })
  }
  if (!usuarioId && !grupoId) {
    return NextResponse.json({ erro: "usuarioId ou grupoId é obrigatório" }, { status: 400 })
  }
  if (usuarioId && grupoId) {
    return NextResponse.json({ erro: "Informe apenas usuarioId OU grupoId, não ambos" }, { status: 400 })
  }

  // Não-superadmin só pode gerenciar permissões da própria empresa
  const empresaResolvida = usuario.superAdmin
    ? (empresaId ?? usuario.empresaId)
    : usuario.empresaId

  if (!empresaResolvida) {
    return NextResponse.json({ erro: "Empresa não determinada" }, { status: 400 })
  }

  const where = usuarioId
    ? { empresaId_usuarioId_modulo: { empresaId: empresaResolvida, usuarioId, modulo } }
    : { empresaId_grupoId_modulo:   { empresaId: empresaResolvida, grupoId: grupoId!, modulo } }

  const dados = {
    empresaId:   empresaResolvida,
    modulo,
    podeLer:     podeLer     ?? true,
    podeCriar:   podeCriar   ?? false,
    podeEditar:  podeEditar  ?? false,
    podeDeletar: podeDeletar ?? false,
    ...(usuarioId ? { usuarioId } : {}),
    ...(grupoId   ? { grupoId   } : {}),
  }

  const permissao = await db.permissaoUsuario.upsert({
    where,
    create: dados,
    update: {
      podeLer:     dados.podeLer,
      podeCriar:   dados.podeCriar,
      podeEditar:  dados.podeEditar,
      podeDeletar: dados.podeDeletar,
    },
  })

  return NextResponse.json(permissao, { status: 201 })
}
