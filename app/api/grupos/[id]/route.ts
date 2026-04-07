import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { getUsuarioAtual } from "@/servidor/autenticacao/sessao"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  const grupo = await db.grupo.findUnique({
    where: { id },
    include: { modulos: { select: { modulo: true } }, _count: { select: { usuarios: true } } },
  })

  if (!grupo) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 })
  return NextResponse.json(grupo)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (user.papel !== "A" && !user.grupoIsAdmin)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const { nome, descricao, isAdmin, ativo, modulos } = await req.json()

  const existing = await db.grupo.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 })

  if (!user.superAdmin && existing.empresaId !== user.empresaId)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  await db.$transaction([
    db.grupoModulo.deleteMany({ where: { grupoId: id } }),
    db.grupo.update({
      where: { id },
      data: {
        nome: nome?.trim() ?? existing.nome,
        descricao: descricao?.trim() ?? null,
        isAdmin: typeof isAdmin === "boolean" ? isAdmin : existing.isAdmin,
        ativo: typeof ativo === "boolean" ? ativo : existing.ativo,
        modulos: {
          createMany: {
            data: (modulos ?? []).map((m: string) => ({ modulo: m })),
            skipDuplicates: true,
          },
        },
      },
    }),
  ])

  const grupo = await db.grupo.findUnique({
    where: { id },
    include: { modulos: { select: { modulo: true } }, _count: { select: { usuarios: true } } },
  })

  return NextResponse.json(grupo)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const user = await getUsuarioAtual()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (user.papel !== "A" && !user.grupoIsAdmin)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const existing = await db.grupo.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 })
  if (!user.superAdmin && existing.empresaId !== user.empresaId)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  await db.grupo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
