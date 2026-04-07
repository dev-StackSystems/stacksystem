/**
 * app/api/matriculas/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para matrículas (vínculo aluno ↔ curso).
 *
 * GET  /api/matriculas — lista matrículas da empresa
 * POST /api/matriculas — cria nova matrícula
 *
 * Status possíveis: "ativa" | "concluida" | "cancelada"
 *
 * Validação de tenant: aluno e curso devem pertencer à mesma empresa do usuário.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

// ── GET /api/matriculas ────────────────────────────────────────────────────

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  // Filtra matrículas pelos cursos da empresa (via relacionamento curso → empresa)
  const filtro = usuario.superAdmin
    ? {}
    : { curso: { empresaId: usuario.empresaId! } }

  const matriculas = await db.matricula.findMany({
    where:   filtro,
    orderBy: { criadoEm: "desc" },
    include: {
      aluno: { select: { nome: true, email: true } },
      curso: {
        select: {
          nome: true,
          empresa: { select: { nome: true } },
        },
      },
    },
  })

  return NextResponse.json(matriculas)
}

// ── POST /api/matriculas ───────────────────────────────────────────────────

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const podeCriar =
    usuario.superAdmin ||
    usuario.papel === PapelUsuario.A ||
    usuario.papel === PapelUsuario.T ||
    usuario.grupoIsAdmin

  if (!podeCriar) return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const corpo = await requisicao.json()
  const { alunoId, cursoId, status, valor, dataInicio, dataFim } = corpo

  if (!alunoId || !cursoId) {
    return NextResponse.json({ erro: "Aluno e curso são obrigatórios." }, { status: 400 })
  }

  // Valida que o curso e o aluno pertencem à empresa do usuário
  if (!usuario.superAdmin && usuario.empresaId) {
    const curso = await db.cursoDaEmpresa.findUnique({
      where:  { id: cursoId },
      select: { empresaId: true },
    })
    if (!curso || curso.empresaId !== usuario.empresaId) {
      return NextResponse.json({ erro: "Curso não pertence à sua empresa." }, { status: 403 })
    }

    const aluno = await db.aluno.findUnique({
      where:  { id: alunoId },
      select: { empresaId: true },
    })
    if (!aluno || aluno.empresaId !== usuario.empresaId) {
      return NextResponse.json({ erro: "Aluno não pertence à sua empresa." }, { status: 403 })
    }
  }

  const matricula = await db.matricula.create({
    data: {
      alunoId,
      cursoId,
      status:     status     ?? "ativa",
      valor:      valor ? parseFloat(valor) : 0,
      dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
      dataFim:    dataFim    ? new Date(dataFim)    : null,
    },
    include: {
      aluno: { select: { nome: true, email: true } },
      curso: {
        select: {
          nome: true,
          empresa: { select: { nome: true } },
        },
      },
    },
  })

  return NextResponse.json(matricula, { status: 201 })
}
