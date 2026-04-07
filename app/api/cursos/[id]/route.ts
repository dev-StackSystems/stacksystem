import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual, exigirPapel } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

// PUT /api/cursos/[id] — ADMIN e TECH
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (authResult instanceof NextResponse) return authResult
  const user = authResult.usuario

  const { id } = await params
  const body = await request.json()
  const { empresaId, nome, descricao, cargaHoraria, ativo } = body

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const existing = await db.cursoDaEmpresa.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 })
  }

  // Validação de escopo: empresa admin só edita cursos da própria empresa
  if (!user.superAdmin && existing.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  if (empresaId && empresaId !== existing.empresaId) {
    const empresa = await db.empresa.findUnique({ where: { id: empresaId } })
    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }
  }

  const curso = await db.cursoDaEmpresa.update({
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
  const authResult = await exigirPapel([PapelUsuario.A])
  if (authResult instanceof NextResponse) return authResult
  const user = authResult.usuario

  const { id } = await params

  const existing = await db.cursoDaEmpresa.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 })
  }

  if (!user.superAdmin && existing.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const curso = await db.cursoDaEmpresa.update({
    where: { id },
    data: { ativo: false },
  })

  return NextResponse.json(curso)
}
