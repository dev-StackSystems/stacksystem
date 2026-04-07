/**
 * app/api/baixas/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para baixas financeiras (cobranças e pagamentos).
 *
 * GET  /api/baixas — lista baixas da empresa
 * POST /api/baixas — registra nova baixa
 *
 * Tipos: mensalidade | matricula | certificado | outros
 * Status: pago | pendente | cancelado
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

// ── GET /api/baixas ────────────────────────────────────────────────────────

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  // Filtra baixas pelas matrículas dos cursos da empresa
  const filtro = usuario.superAdmin
    ? {}
    : { matricula: { curso: { empresaId: usuario.empresaId! } } }

  const baixas = await db.baixa.findMany({
    where:   filtro,
    orderBy: { criadoEm: "desc" },
    include: {
      matricula: {
        select: {
          aluno: { select: { nome: true } },
          curso: { select: { nome: true } },
        },
      },
    },
  })

  return NextResponse.json(baixas)
}

// ── POST /api/baixas ───────────────────────────────────────────────────────

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
  const { matriculaId, descricao, valor, tipo, status, dataPagamento, dataVencimento } = corpo

  if (valor === undefined || valor === null || valor === "") {
    return NextResponse.json({ erro: "Valor é obrigatório." }, { status: 400 })
  }

  // Valida que a matrícula pertence à empresa do usuário
  if (!usuario.superAdmin && matriculaId && usuario.empresaId) {
    const matricula = await db.matricula.findUnique({
      where:  { id: matriculaId },
      select: { curso: { select: { empresaId: true } } },
    })
    if (!matricula || matricula.curso.empresaId !== usuario.empresaId) {
      return NextResponse.json({ erro: "Matrícula não pertence à sua empresa." }, { status: 403 })
    }
  }

  const baixa = await db.baixa.create({
    data: {
      matriculaId:    matriculaId     || null,
      descricao:      descricao       || null,
      valor:          parseFloat(valor),
      tipo:           tipo            ?? "mensalidade",
      status:         status          ?? "pendente",
      dataPagamento:  dataPagamento   ? new Date(dataPagamento)  : null,
      dataVencimento: dataVencimento  ? new Date(dataVencimento) : null,
    },
    include: {
      matricula: {
        select: {
          aluno: { select: { nome: true } },
          curso: { select: { nome: true } },
        },
      },
    },
  })

  return NextResponse.json(baixa, { status: 201 })
}
