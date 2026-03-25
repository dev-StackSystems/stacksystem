import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { requireRole } from "@/backend/auth/session-helpers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { UserRole } from "@prisma/client"

// PUT /api/empresas/[id]
// — UserRole.A: edita tudo
// — grupoIsAdmin da empresa: edita dados básicos e identidade visual (sem tipoSistema, sem ativa)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  const isSystemAdmin = session.user.role === UserRole.A
  const isEmpresaAdmin = session.user.grupoIsAdmin && session.user.empresaId === id

  if (!isSystemAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const body = await request.json()
  const { nome, cnpj, email, telefone, ativa, cor, logo, banner, tipoSistema, descricao } = body

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }

  const existing = await db.empresa.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  if (cnpj && cnpj.trim() !== "" && cnpj.trim() !== existing.cnpj) {
    const cnpjConflict = await db.empresa.findUnique({ where: { cnpj: cnpj.trim() } })
    if (cnpjConflict) {
      return NextResponse.json({ error: "CNPJ já cadastrado em outra empresa" }, { status: 409 })
    }
  }

  const empresa = await db.empresa.update({
    where: { id },
    data: {
      nome: nome.trim(),
      cnpj: cnpj?.trim() || null,
      email: email?.trim() || null,
      telefone: telefone?.trim() || null,
      cor: cor?.trim() || null,
      logo: logo?.trim() || null,
      banner: banner?.trim() || null,
      descricao: descricao?.trim() || null,
      // Apenas admin do sistema pode mudar tipo e status
      ...(isSystemAdmin && {
        ativa: typeof ativa === "boolean" ? ativa : existing.ativa,
        // Não permite remover tipoSistema — mantém o existente se não for fornecido
        tipoSistema: tipoSistema?.trim() || existing.tipoSistema,
      }),
    },
  })

  return NextResponse.json(empresa)
}

// DELETE /api/empresas/[id] — soft delete, apenas admin do sistema
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole([UserRole.A])
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const existing = await db.empresa.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  const empresa = await db.empresa.update({
    where: { id },
    data: { ativa: false },
  })

  return NextResponse.json(empresa)
}
