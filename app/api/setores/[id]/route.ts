import { NextRequest, NextResponse } from "next/server"
import { db } from "@/backend/database/prisma-client"
import { getCurrentUser } from "@/backend/auth/session-helpers"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { id } = await params
  const setor = await db.setor.findUnique({
    where: { id },
    include: { modulos: { select: { modulo: true } }, _count: { select: { usuarios: true } } },
  })

  if (!setor) return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 })
  return NextResponse.json(setor)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (user.role !== "A" && !user.grupoIsAdmin)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  const { nome, descricao, ativo, modulos } = await req.json()

  const existing = await db.setor.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 })

  // Upsert modulos: apaga os atuais e recria
  await db.$transaction([
    db.setorModulo.deleteMany({ where: { setorId: id } }),
    db.setor.update({
      where: { id },
      data: {
        nome: nome?.trim() ?? existing.nome,
        descricao: descricao?.trim() ?? null,
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

  const setor = await db.setor.findUnique({
    where: { id },
    include: { modulos: { select: { modulo: true } }, _count: { select: { usuarios: true } } },
  })

  return NextResponse.json(setor)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  if (user.role !== "A" && !user.grupoIsAdmin)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })

  const { id } = await params
  await db.setor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
