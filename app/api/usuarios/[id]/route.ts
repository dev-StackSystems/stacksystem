/**
 * app/api/usuarios/[id]/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para operações em um usuário específico.
 *
 * GET    /api/usuarios/[id] — busca um usuário pelo ID
 * PUT    /api/usuarios/[id] — atualiza dados do usuário
 * DELETE /api/usuarios/[id] — desativa o usuário (soft delete: ativo = false)
 *
 * Regra de tenant: não-superAdmin só pode operar em usuários da própria empresa.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { PapelUsuario } from "@prisma/client"
import bcrypt from "bcryptjs"

type Params = { params: Promise<{ id: string }> }

// Campos retornados nas consultas
const CAMPOS_PADRAO = {
  id: true, nome: true, email: true, papel: true,
  departamento: true, telefone: true, ativo: true, criadoEm: true,
  empresaId: true, setorId: true, grupoId: true,
  empresa: { select: { nome: true } },
  setor:   { select: { nome: true } },
  grupo:   { select: { nome: true } },
}

// ── GET /api/usuarios/[id] ─────────────────────────────────────────────────

export async function GET(_: NextRequest, { params }: Params) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { superAdmin } = sessao.user
  const podeAcessar =
    superAdmin ||
    sessao.user.papel === PapelUsuario.A ||
    sessao.user.grupoIsAdmin ||
    sessao.user.papel === PapelUsuario.T

  if (!podeAcessar) return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const usuario = await db.usuario.findUnique({ where: { id }, select: CAMPOS_PADRAO })
  if (!usuario) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 })

  // Não-superAdmin só acessa usuários da própria empresa
  if (!superAdmin && usuario.empresaId !== sessao.user.empresaId) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  return NextResponse.json(usuario)
}

// ── PUT /api/usuarios/[id] ─────────────────────────────────────────────────

export async function PUT(requisicao: NextRequest, { params }: Params) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { superAdmin } = sessao.user
  const isAdminEmpresa = sessao.user.papel === PapelUsuario.A || sessao.user.grupoIsAdmin

  if (!superAdmin && !isAdminEmpresa) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  // Verifica que o usuário alvo pertence à empresa do requisitante
  if (!superAdmin) {
    const alvo = await db.usuario.findUnique({ where: { id }, select: { empresaId: true } })
    if (!alvo) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 })
    if (alvo.empresaId !== sessao.user.empresaId) {
      return NextResponse.json({ erro: "Sem permissão para editar usuários de outra empresa." }, { status: 403 })
    }
  }

  const corpo = await requisicao.json()
  const { nome, email, papel, departamento, telefone, ativo, senha, empresaId, setorId, grupoId } = corpo

  // Não-superAdmin não pode mudar a empresa do usuário
  const empresaResolvida = superAdmin ? empresaId : sessao.user.empresaId
  if (!empresaResolvida) {
    return NextResponse.json({ erro: "Empresa é obrigatória." }, { status: 400 })
  }

  // Monta os dados de atualização
  const dadosAtualizacao: Record<string, unknown> = {
    nome, email,
    papel: papel as PapelUsuario,
    departamento, telefone, ativo,
    empresaId: empresaResolvida,
    setorId: setorId || null,
    grupoId: grupoId || null,
  }

  // Só atualiza a senha se uma nova foi fornecida
  if (senha) dadosAtualizacao.senha = await bcrypt.hash(senha, 12)

  const usuario = await db.usuario.update({
    where: { id },
    data:  dadosAtualizacao,
    select: CAMPOS_PADRAO,
  })

  return NextResponse.json(usuario)
}

// ── DELETE /api/usuarios/[id] ──────────────────────────────────────────────

export async function DELETE(_: NextRequest, { params }: Params) {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { superAdmin } = sessao.user
  const isAdminEmpresa = sessao.user.papel === PapelUsuario.A || sessao.user.grupoIsAdmin

  if (!superAdmin && !isAdminEmpresa) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  const { id } = await params

  // Verifica que o usuário alvo pertence à empresa do requisitante
  if (!superAdmin) {
    const alvo = await db.usuario.findUnique({ where: { id }, select: { empresaId: true } })
    if (!alvo) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 })
    if (alvo.empresaId !== sessao.user.empresaId) {
      return NextResponse.json({ erro: "Sem permissão para desativar usuários de outra empresa." }, { status: 403 })
    }
  }

  // Soft delete: apenas marca como inativo, não remove o registro
  await db.usuario.update({ where: { id }, data: { ativo: false } })
  return NextResponse.json({ sucesso: true })
}
