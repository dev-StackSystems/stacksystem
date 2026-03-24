import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth-helpers"
import { UserRole } from "@prisma/client"

// PUT /api/empresas/[id] — ADMIN e TECH
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([UserRole.A, UserRole.T])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const body = await request.json()
  const { nome, cnpj, email, telefone, ativa, cor, logo, banner, tipoSistema, descricao } = body

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const existing = await db.empresa.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  // Verificar CNPJ duplicado se mudou
  if (cnpj && cnpj.trim() !== "" && cnpj.trim() !== existing.cnpj) {
    const cnpjConflict = await db.empresa.findUnique({ where: { cnpj: cnpj.trim() } })
    if (cnpjConflict) {
      return NextResponse.json({ error: "CNPJ já cadastrado em outra empresa" }, { status: 409 })
    }
  }

  const empresa = await db.empresa.update({
    where: { id },
    data: {
      nome: nome.trim(),
      cnpj: cnpj?.trim() || null,
      email: email?.trim() || null,
      telefone: telefone?.trim() || null,
      ativa: typeof ativa === "boolean" ? ativa : existing.ativa,
      cor: cor?.trim() || null,
      logo: logo?.trim() || null,
      banner: banner?.trim() || null,
      tipoSistema: tipoSistema?.trim() || null,
      descricao: descricao?.trim() || null,
    },
  })

  return NextResponse.json(empresa)
}

// DELETE /api/empresas/[id] — soft delete, apenas ADMIN
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const existing = await db.empresa.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  const empresa = await db.empresa.update({
    where: { id },
    data: { ativa: false },
  })

  return NextResponse.json(empresa)
}
