import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { requireSuperAdmin } from "@/backend/auth/session-helpers"
import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/shared/constants/sistema-types"

// GET /api/empresas — apenas super admin (desenvolvedor/i3)
export async function GET() {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const empresas = await db.empresa.findMany({
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { cursos: true, usuarios: true } },
    },
  })

  return NextResponse.json(empresas)
}

// POST /api/empresas — apenas super admin
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await request.json()
  const {
    nome, sigla, cnpj,
    email, telefone, fax, site,
    endereco, bairro, cep, municipio, uf, latitude, longitude,
    cor, cor2, logo, brasao, banner,
    nomeSistema, tipoSistema, mascara, descricao,
  } = body

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  if (!tipoSistema || tipoSistema.trim() === "") {
    return NextResponse.json({ error: "Tipo de sistema é obrigatório" }, { status: 400 })
  }

  if (cnpj && cnpj.trim() !== "") {
    const existing = await db.empresa.findUnique({ where: { cnpj: cnpj.trim() } })
    if (existing) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }
  }

  const empresa = await db.empresa.create({
    data: {
      nome: nome.trim(),
      sigla: sigla?.trim() || null,
      cnpj: cnpj?.trim() || null,
      email: email?.trim() || null,
      telefone: telefone?.trim() || null,
      fax: fax?.trim() || null,
      site: site?.trim() || null,
      endereco: endereco?.trim() || null,
      bairro: bairro?.trim() || null,
      cep: cep?.trim() || null,
      municipio: municipio?.trim() || null,
      uf: uf?.trim() || null,
      latitude: latitude?.trim() || null,
      longitude: longitude?.trim() || null,
      cor: cor?.trim() || null,
      cor2: cor2?.trim() || null,
      logo: logo?.trim() || null,
      brasao: brasao?.trim() || null,
      banner: banner?.trim() || null,
      nomeSistema: nomeSistema?.trim() || null,
      tipoSistema: tipoSistema?.trim() || null,
      mascara: mascara?.trim() || null,
      descricao: descricao?.trim() || null,
    },
  })

  // Cria módulos automaticamente baseados no tipo de sistema
  if (tipoSistema && tipoSistema !== "personalizado") {
    const tipo = TIPOS_SISTEMA.find((t) => t.key === tipoSistema)
    if (tipo) {
      await db.empresaModulo.createMany({
        data: MODULOS_DISPONIVEIS.map((m) => ({
          empresaId: empresa.id,
          modulo: m.key,
          ativo: tipo.modulos.includes(m.key),
        })),
      })
    }
  }

  return NextResponse.json(empresa, { status: 201 })
}
