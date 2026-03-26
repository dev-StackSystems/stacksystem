import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser, requireRole } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"

// PUT /api/cursos/[id] — ADMIN e TECH
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([UserRole.A, UserRole.T])
  if (authResult instanceof NextResponse) return authResult
  const user = authResult.user

  const { id } = await params
  const body = await request.json()
  const { empresaId, nome, descricao, cargaHoraria, ativo } = body

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const existing = await db.empCurso.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 })
  }

  // Validação de escopo: empresa admin só edita cursos da própria empresa
  if (!user.isSuperAdmin && existing.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  if (empresaId && empresaId !== existing.empresaId) {
    const empresa = await db.empresa.findUnique({ where: { id: empresaId } })
    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }
  }

  const curso = await db.empCurso.update({
    where: { id },
    data: {
      empresaId: empresaId?.trim() || existing.empresaId,
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      cargaHoraria: cargaHoraria !== undefined && cargaHoraria !== "" ? Number(cargaHoraria) : null,
      ativo: typeof ativo === "boolean" ? ativo : existing.ativo,
    },
    include: {
      empresa: { select: { nome: true } },
    },
  })

  return NextResponse.json(curso)
}

// DELETE /api/cursos/[id] — soft delete, apenas ADMIN
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult
  const user = authResult.user

  const { id } = await params

  const existing = await db.empCurso.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 })
  }

  if (!user.isSuperAdmin && existing.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const curso = await db.empCurso.update({
    where: { id },
    data: { ativo: false },
  })

  return NextResponse.json(curso)
}
