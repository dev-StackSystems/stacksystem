/**
 * app/api/admin/modulos/[id]/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * PUT    /api/admin/modulos/[id] — atualiza módulo do catálogo
 * DELETE /api/admin/modulos/[id] — remove módulo do catálogo
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { exigirSuperAdmin } from "@/servidor/autenticacao/sessao"
import { db } from "@/servidor/banco/cliente"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const { rotulo, href, icone, descricao, tipo, ativo } = await req.json()

  const modulo = await db.moduloCatalogo.update({
    where: { id },
    data: {
      ...(rotulo    !== undefined && { rotulo:    rotulo.trim()    }),
      ...(href      !== undefined && { href:      href.trim()      }),
      ...(icone     !== undefined && { icone:     icone.trim()     }),
      ...(descricao !== undefined && { descricao: descricao?.trim() || null }),
      ...(tipo      !== undefined && { tipo                        }),
      ...(ativo     !== undefined && { ativo                       }),
    },
  })

  return NextResponse.json(modulo)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  await db.moduloCatalogo.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
