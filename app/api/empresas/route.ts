/**
 * app/api/empresas/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API REST para gerenciamento de empresas (tenants do sistema).
 * Acesso exclusivo do superAdmin (desenvolvedor/i3).
 *
 * GET  /api/empresas — lista todas as empresas
 * POST /api/empresas — cria nova empresa e ativa os módulos conforme o tipo
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { exigirSuperAdmin } from "@/servidor/autenticacao/sessao"
import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/tipos/sistema"

// ── GET /api/empresas ──────────────────────────────────────────────────────

export async function GET() {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const empresas = await db.empresa.findMany({
    orderBy: { nome: "asc" },
    include: {
      // Contagem de cursos e usuários vinculados
      _count: { select: { cursos: true, usuarios: true } },
    },
  })

  return NextResponse.json(empresas)
}

// ── POST /api/empresas ─────────────────────────────────────────────────────

export async function POST(requisicao: NextRequest) {
  const auth = await exigirSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const corpo = await requisicao.json()
  const {
    nome, sigla, cnpj,
    email, telefone, fax, site,
    endereco, bairro, cep, municipio, uf, latitude, longitude,
    cor, cor2, logo, brasao, banner,
    nomeSistema, tipoSistema, mascara, descricao,
  } = corpo

  // Validações obrigatórias
  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ erro: "Nome é obrigatório" }, { status: 400 })
  }
  if (!tipoSistema || tipoSistema.trim() === "") {
    return NextResponse.json({ erro: "Tipo de sistema é obrigatório" }, { status: 400 })
  }

  // CNPJ único (se fornecido)
  if (cnpj && cnpj.trim() !== "") {
    const cnpjExistente = await db.empresa.findUnique({ where: { cnpj: cnpj.trim() } })
    if (cnpjExistente) {
      return NextResponse.json({ erro: "CNPJ já cadastrado" }, { status: 409 })
    }
  }

  // Cria a empresa
  const empresa = await db.empresa.create({
    data: {
      nome:        nome.trim(),
      sigla:       sigla?.trim()       || null,
      cnpj:        cnpj?.trim()        || null,
      email:       email?.trim()       || null,
      telefone:    telefone?.trim()    || null,
      fax:         fax?.trim()         || null,
      site:        site?.trim()        || null,
      endereco:    endereco?.trim()    || null,
      bairro:      bairro?.trim()      || null,
      cep:         cep?.trim()         || null,
      municipio:   municipio?.trim()   || null,
      uf:          uf?.trim()          || null,
      latitude:    latitude?.trim()    || null,
      longitude:   longitude?.trim()   || null,
      cor:         cor?.trim()         || null,
      cor2:        cor2?.trim()        || null,
      logo:        logo?.trim()        || null,
      brasao:      brasao?.trim()      || null,
      banner:      banner?.trim()      || null,
      nomeSistema: nomeSistema?.trim() || null,
      tipoSistema: tipoSistema?.trim() || null,
      mascara:     mascara?.trim()     || null,
      descricao:   descricao?.trim()   || null,
    },
  })

  // Ativa automaticamente os módulos conforme o tipo de sistema
  if (tipoSistema && tipoSistema !== "personalizado") {
    const configTipo = TIPOS_SISTEMA.find(t => t.key === tipoSistema)
    if (configTipo) {
      await db.moduloDaEmpresa.createMany({
        data: MODULOS_DISPONIVEIS.map(m => ({
          empresaId: empresa.id,
          modulo:    m.key,
          ativo:     (configTipo.modulos as readonly string[]).includes(m.key),
        })),
      })
    }
  }

  return NextResponse.json(empresa, { status: 201 })
}
