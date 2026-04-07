/**
 * app/api/usuarios/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para usuários internos do sistema.
 *
 * GET  /api/usuarios — lista usuários (filtrado por empresa, exceto superAdmin)
 * POST /api/usuarios — cria novo usuário
 *
 * Permissões:
 *   GET:  superAdmin, papel A, grupoIsAdmin, papel T
 *   POST: superAdmin, papel A, grupoIsAdmin
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { PapelUsuario } from "@prisma/client"
import bcrypt from "bcryptjs"

// Campos padrão retornados nas consultas de usuário
const CAMPOS_PADRAO = {
  id: true, nome: true, email: true, papel: true,
  departamento: true, telefone: true, ativo: true, criadoEm: true,
  empresaId: true, setorId: true, grupoId: true,
  empresa: { select: { nome: true } },
  setor:   { select: { nome: true } },
  grupo:   { select: { nome: true } },
}

// Helper para obter o usuário da sessão
function getRequisitante(sessao: Awaited<ReturnType<typeof getServerSession<typeof opcoesAuth>>>) {
  if (!sessao?.user) return null
  return sessao.user
}

// ── GET /api/usuarios ──────────────────────────────────────────────────────

export async function GET() {
  const sessao      = await getServerSession(opcoesAuth)
  const requisitante = getRequisitante(sessao)
  if (!requisitante) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { superAdmin } = requisitante

  // Quem pode listar usuários?
  const podeAcessar =
    superAdmin ||
    requisitante.papel === PapelUsuario.A ||
    requisitante.grupoIsAdmin ||
    requisitante.papel === PapelUsuario.T

  if (!podeAcessar) return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })

  // superAdmin vê todos; demais veem apenas da própria empresa
  const filtro = superAdmin ? {} : { empresaId: requisitante.empresaId ?? "" }

  const usuarios = await db.usuario.findMany({
    where:   filtro,
    select:  CAMPOS_PADRAO,
    orderBy: { criadoEm: "desc" },
  })

  return NextResponse.json(usuarios)
}

// ── POST /api/usuarios ─────────────────────────────────────────────────────

export async function POST(requisicao: NextRequest) {
  const sessao      = await getServerSession(opcoesAuth)
  const requisitante = getRequisitante(sessao)
  if (!requisitante) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })

  const { superAdmin } = requisitante

  // Quem pode criar usuários?
  const isAdminEmpresa = requisitante.papel === PapelUsuario.A || requisitante.grupoIsAdmin
  if (!superAdmin && !isAdminEmpresa) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  const corpo = await requisicao.json()
  const { nome, email, senha, papel, departamento, telefone, empresaId, setorId, grupoId } = corpo

  // Validação dos campos obrigatórios
  if (!nome || !email || !senha || !papel) {
    return NextResponse.json({ erro: "Campos obrigatórios faltando" }, { status: 400 })
  }

  // Não-superAdmin só pode criar usuários na própria empresa
  const empresaResolvida = superAdmin ? empresaId : requisitante.empresaId

  if (!empresaResolvida) {
    return NextResponse.json({ erro: "Empresa é obrigatória." }, { status: 400 })
  }

  // Não-superAdmin não pode criar outros superAdmins
  if (!superAdmin && (papel === "SUPER" || corpo.superAdmin)) {
    return NextResponse.json({ erro: "Sem permissão para criar super administradores." }, { status: 403 })
  }

  // Verifica se o e-mail já está cadastrado
  const emailExistente = await db.usuario.findUnique({ where: { email } })
  if (emailExistente) {
    return NextResponse.json({ erro: "E-mail já cadastrado" }, { status: 409 })
  }

  // Criptografa a senha com bcrypt (custo 12)
  const senhaCriptografada = await bcrypt.hash(senha, 12)

  const usuario = await db.usuario.create({
    data: {
      nome, email,
      senha: senhaCriptografada,
      papel: papel as PapelUsuario,
      departamento, telefone,
      empresaId: empresaResolvida,
      ...(setorId ? { setorId } : {}),
      ...(grupoId ? { grupoId } : {}),
    },
    select: CAMPOS_PADRAO,
  })

  return NextResponse.json(usuario, { status: 201 })
}
