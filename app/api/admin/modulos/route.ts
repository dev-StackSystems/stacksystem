/**
 * app/api/admin/modulos/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Catálogo de módulos — apenas superAdmin.
 *
 * GET  /api/admin/modulos  — lista todos os módulos do catálogo
 * POST /api/admin/modulos  — cria novo módulo
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { exigirSuperAdmin } from "@/servidor/autenticacao/sessao"
import { db } from "@/servidor/banco/cliente"

export async function GET() {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const modulos = await db.moduloCatalogo.findMany({
    orderBy: { criadoEm: "desc" },
  })

  return NextResponse.json(modulos)
}

export async function POST(req: NextRequest) {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const { chave, rotulo, href, icone, descricao, tipo } = await req.json()

  if (!chave || !rotulo || !href) {
    return NextResponse.json({ erro: "chave, rotulo e href são obrigatórios" }, { status: 400 })
  }

  // Valida chave: somente letras minúsculas, números e hífens
  if (!/^[a-z0-9-]+$/.test(chave)) {
    return NextResponse.json(
      { erro: "Chave inválida — use apenas letras minúsculas, números e hífens" },
      { status: 400 }
    )
  }

  try {
    const modulo = await db.moduloCatalogo.create({
      data: {
        chave:    chave.trim(),
        rotulo:   rotulo.trim(),
        href:     href.trim(),
        icone:    icone?.trim() || "📦",
        descricao: descricao?.trim() || null,
        tipo:     tipo || "iframe",
      },
    })
    return NextResponse.json(modulo, { status: 201 })
  } catch {
    return NextResponse.json(
      { erro: "Chave já existe. Use uma chave única." },
      { status: 409 }
    )
  }
}
