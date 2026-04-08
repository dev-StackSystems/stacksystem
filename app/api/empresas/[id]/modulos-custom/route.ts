/**
 * app/api/empresas/[id]/modulos-custom/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gerencia quais módulos do catálogo uma empresa tem acesso.
 *
 * GET    /api/empresas/[id]/modulos-custom          — lista módulos da empresa
 * POST   /api/empresas/[id]/modulos-custom          — atribui módulo à empresa  { catalogoId }
 * DELETE /api/empresas/[id]/modulos-custom          — remove módulo da empresa  { catalogoId }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { exigirSuperAdmin } from "@/servidor/autenticacao/sessao"
import { db } from "@/servidor/banco/cliente"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Ctx) {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: empresaId } = await params

  const registros = await db.moduloCustomDaEmpresa.findMany({
    where:   { empresaId },
    include: { catalogo: true },
    orderBy: { criadoEm: "asc" },
  })

  return NextResponse.json(registros)
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: empresaId } = await params
  const { catalogoId } = await req.json()

  if (!catalogoId) {
    return NextResponse.json({ erro: "catalogoId é obrigatório" }, { status: 400 })
  }

  try {
    const registro = await db.moduloCustomDaEmpresa.create({
      data: { empresaId, catalogoId },
      include: { catalogo: true },
    })
    return NextResponse.json(registro, { status: 201 })
  } catch {
    return NextResponse.json({ erro: "Módulo já atribuído a esta empresa" }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: empresaId } = await params
  const { catalogoId } = await req.json()

  await db.moduloCustomDaEmpresa.deleteMany({
    where: { empresaId, catalogoId },
  })

  return NextResponse.json({ ok: true })
}
