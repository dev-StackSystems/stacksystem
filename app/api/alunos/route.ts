/**
 * app/api/alunos/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para alunos matriculados na empresa.
 *
 * GET  /api/alunos — lista alunos da empresa
 * POST /api/alunos — cadastra novo aluno
 *
 * Regras:
 *   - E-mail e CPF são únicos dentro da empresa
 *   - papel F não pode criar alunos
 *   - superAdmin pode criar alunos em qualquer empresa via corpo.empresaId
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

// Campos padrão dos alunos retornados pela API
const CAMPOS_ALUNO = {
  id: true, nome: true, email: true, cpf: true,
  telefone: true, dataNasc: true, ativo: true, criadoEm: true,
  _count: { select: { matriculas: true } }, // Contagem de matrículas do aluno
}

// ── GET /api/alunos ────────────────────────────────────────────────────────

export async function GET() {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  // Não-superAdmin precisa ter empresa vinculada
  if (!usuario.superAdmin && !usuario.empresaId) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  // superAdmin vê todos os alunos; demais veem apenas da própria empresa
  const filtro = usuario.superAdmin ? {} : { empresaId: usuario.empresaId! }

  const alunos = await db.aluno.findMany({
    where:   filtro,
    orderBy: { criadoEm: "desc" },
    select:  CAMPOS_ALUNO,
  })

  return NextResponse.json(alunos)
}

// ── POST /api/alunos ───────────────────────────────────────────────────────

export async function POST(requisicao: NextRequest) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  // Docente não pode cadastrar alunos
  if (usuario.papel === PapelUsuario.F && !usuario.superAdmin) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  const corpo = await requisicao.json()
  const { nome, email, cpf, telefone, dataNasc } = corpo

  if (!nome || !email) {
    return NextResponse.json({ erro: "Nome e e-mail são obrigatórios." }, { status: 400 })
  }

  // superAdmin pode passar empresaId no corpo; demais usam a própria empresa
  const empresaId = usuario.superAdmin ? (corpo.empresaId ?? null) : usuario.empresaId
  if (!empresaId) {
    return NextResponse.json({ erro: "Empresa é obrigatória." }, { status: 400 })
  }

  // Valida unicidade de e-mail dentro da empresa
  const emailDuplicado = await db.aluno.findFirst({ where: { empresaId, email } })
  if (emailDuplicado) {
    return NextResponse.json({ erro: "E-mail já cadastrado nesta empresa." }, { status: 409 })
  }

  // Valida unicidade de CPF dentro da empresa (se fornecido)
  if (cpf) {
    const cpfDuplicado = await db.aluno.findFirst({ where: { empresaId, cpf } })
    if (cpfDuplicado) {
      return NextResponse.json({ erro: "CPF já cadastrado nesta empresa." }, { status: 409 })
    }
  }

  const aluno = await db.aluno.create({
    data: {
      empresaId,
      nome,
      email,
      cpf:      cpf      || null,
      telefone: telefone || null,
      dataNasc: dataNasc ? new Date(dataNasc) : null,
    },
    select: CAMPOS_ALUNO,
  })

  return NextResponse.json(aluno, { status: 201 })
}
