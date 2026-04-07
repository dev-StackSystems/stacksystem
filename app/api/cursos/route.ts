/**
 * app/api/cursos/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para cursos da empresa.
 *
 * GET  /api/cursos — lista cursos da empresa
 * POST /api/cursos — cria novo curso
 *
 * Permissões para criar: superAdmin, papel A, papel T, grupoIsAdmin
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

// ── GET /api/cursos ────────────────────────────────────────────────────────

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  const filtro = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }

  const cursos = await db.cursoDaEmpresa.findMany({
    where:   filtro,
    orderBy: { criadoEm: "desc" },
    include: { empresa: { select: { nome: true } } },
  })

  return NextResponse.json(cursos)
}

// ── POST /api/cursos ───────────────────────────────────────────────────────

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  // Docente não pode criar cursos
  const podeCriar =
    usuario.superAdmin ||
    usuario.papel === PapelUsuario.A ||
    usuario.papel === PapelUsuario.T ||
    usuario.grupoIsAdmin

  if (!podeCriar) return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const corpo = await requisicao.json()
  const { nome, descricao, cargaHoraria } = corpo

  // Não-superAdmin usa sempre a própria empresa
  const empresaId = usuario.superAdmin ? corpo.empresaId : usuario.empresaId
  if (!empresaId) {
    return NextResponse.json({ erro: "Empresa é obrigatória." }, { status: 400 })
  }

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 })
  }

  // Valida que a empresa existe
  const empresa = await db.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) return NextResponse.json({ erro: "Empresa não encontrada" }, { status: 404 })

  const curso = await db.cursoDaEmpresa.create({
    data: {
      empresaId,
      nome:         nome.trim(),
      descricao:    descricao?.trim()    || null,
      cargaHoraria: cargaHoraria ? Number(cargaHoraria) : null,
    },
    include: { empresa: { select: { nome: true } } },
  })

  return NextResponse.json(curso, { status: 201 })
}
