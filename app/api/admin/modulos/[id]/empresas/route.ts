/**
 * GET /api/admin/modulos/[id]/empresas
 * Retorna array de empresaIds que têm este módulo atribuído.
 */

import { NextRequest, NextResponse } from "next/server"
import { exigirSuperAdmin } from "@/servidor/autenticacao/sessao"
import { db } from "@/servidor/banco/cliente"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: catalogoId } = await params

  const registros = await db.moduloCustomDaEmpresa.findMany({
    where:  { catalogoId },
    select: { empresaId: true },
  })

  return NextResponse.json(registros.map(r => r.empresaId))
}
