import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser, requireRole } from "@/backend/auth/session-helpers"
import { UserRole } from "@prisma/client"
import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/shared/constants/sistema-types"

// GET /api/empresas — qualquer usuário autenticado pode listar
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const empresas = await db.empresa.findMany({
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { cursos: true } },
    },
  })

  return NextResponse.json(empresas)
}

// POST /api/empresas — apenas admin do sistema
export async function POST(request: NextRequest) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const body = await request.json()
  const { nome, cnpj, email, telefone, cor, logo, banner, tipoSistema, descricao } = body

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  // Verificar CNPJ duplicado se fornecido
  if (cnpj && cnpj.trim() !== "") {
    const existing = await db.empresa.findUnique({ where: { cnpj: cnpj.trim() } })
    if (existing) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }
  }

  const empresa = await db.empresa.create({
    data: {
      nome: nome.trim(),
      cnpj: cnpj?.trim() || null,
      email: email?.trim() || null,
      telefone: telefone?.trim() || null,
      cor: cor?.trim() || null,
      logo: logo?.trim() || null,
      banner: banner?.trim() || null,
      tipoSistema: tipoSistema?.trim() || null,
      descricao: descricao?.trim() || null,
    },
  })

  // Criar módulos automaticamente baseados no tipo de sistema
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
