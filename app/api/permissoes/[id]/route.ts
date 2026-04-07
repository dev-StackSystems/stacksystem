import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { exigirPapel } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const { usuario } = auth

  const { id } = await params

  const perm = await db.permissaoUsuario.findUnique({ where: { id } })
  if (!perm) {
    return NextResponse.json({ error: "Permissão não encontrada" }, { status: 404 })
  }

  // Não-superadmin só pode remover permissões da própria empresa
  if (!usuario.superAdmin && perm.empresaId !== usuario.empresaId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  await db.permissaoUsuario.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
