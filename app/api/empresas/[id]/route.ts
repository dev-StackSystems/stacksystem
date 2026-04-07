import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

// PUT /api/empresas/[id]
// — isSuperAdmin: edita tudo
// — PapelUsuario.A da empresa / grupoIsAdmin: edita dados e identidade visual (sem tipoSistema/ativa)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params

  const isSuperAdmin = user.superAdmin
  const isEmpresaAdmin =
    (user.papel === PapelUsuario.A || user.grupoIsAdmin) && user.empresaId === id

  if (!isSuperAdmin && !isEmpresaAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const body = await request.json()
  const {
    nome, sigla, cnpj,
    email, telefone, fax, site,
    endereco, bairro, cep, municipio, uf, latitude, longitude,
    cor, cor2, logo, brasao, banner,
    nomeSistema, tipoSistema, mascara, descricao, ativa,
  } = body

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
      mascara: mascara?.trim() || null,
      descricao: descricao?.trim() || null,
      // Apenas super admin pode mudar tipo de sistema e status de ativação
      ...(isSuperAdmin && {
        ativa: typeof ativa === "boolean" ? ativa : existing.ativa,
        tipoSistema: tipoSistema?.trim() || existing.tipoSistema,
      }),
    },
  })

  return NextResponse.json(empresa)
}

// DELETE /api/empresas/[id] — soft delete, apenas super admin
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (!user.superAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params

  const existing = await db.empresa.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
  }

  const empresa = await db.empresa.update({ where: { id }, data: { ativa: false } })
  return NextResponse.json(empresa)
}
