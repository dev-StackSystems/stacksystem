import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { exigirPapel } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"
import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/tipos/sistema"

const MODULOS_KEYS = MODULOS_DISPONIVEIS.map((m) => m.key)

// GET /api/empresas/[id]/modulos — retorna todos os módulos da empresa
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await exigirPapel([PapelUsuario.A, PapelUsuario.T, PapelUsuario.F])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const modulos = await db.moduloDaEmpresa.findMany({
    where: { empresaId: id },
  })

  return NextResponse.json(modulos)
}

// POST /api/empresas/[id]/modulos — upsert dos módulos da empresa (apenas ADMIN)
// Body: { modulos: string[] }  — lista de keys ativas
// Body: { aplicarTipo: true }  — redefine baseado no tipoSistema da empresa
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await exigirPapel([PapelUsuario.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  const body = await request.json()

  const empresa = await db.empresa.findUnique({ where: { id } })
  if (!empresa) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  // Modo: aplicar tipo de sistema
  if (body.aplicarTipo === true) {
    if (!empresa.tipoSistema || empresa.tipoSistema === "personalizado") {
      return NextResponse.json(
        { error: "Empresa não tem um tipo de sistema definido ou usa o modo personalizado." },
        { status: 400 }
      )
    }

    const tipo = TIPOS_SISTEMA.find((t) => t.key === empresa.tipoSistema)
    if (!tipo) {
      return NextResponse.json({ error: "Tipo de sistema inválido" }, { status: 400 })
    }

    const upserts = MODULOS_KEYS.map((key) =>
      db.moduloDaEmpresa.upsert({
        where: { empresaId_modulo: { empresaId: id, modulo: key } },
        create: { empresaId: id, modulo: key, ativo: (tipo.modulos as readonly string[]).includes(key) },
        update: { ativo: (tipo.modulos as readonly string[]).includes(key) },
      })
    )

    const result = await db.$transaction(upserts)
    return NextResponse.json(result)
  }

  // Modo: lista manual de módulos ativos
  const { modulos } = body as { modulos: string[] }

  if (!Array.isArray(modulos)) {
    return NextResponse.json({ error: "Campo 'modulos' deve ser um array" }, { status: 400 })
  }

  // Upsert de cada módulo disponível
  const upserts = MODULOS_KEYS.map((key) =>
    db.moduloDaEmpresa.upsert({
      where: { empresaId_modulo: { empresaId: id, modulo: key } },
      create: { empresaId: id, modulo: key, ativo: modulos.includes(key) },
      update: { ativo: modulos.includes(key) },
    })
  )

  const result = await db.$transaction(upserts)

  return NextResponse.json(result)
}
