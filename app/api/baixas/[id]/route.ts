import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { exigirPapel } from "@/servidor/autenticacao/sessao"
import { PapelUsuario } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

// PUT /api/baixas/[id] — roles A e T
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A, PapelUsuario.T])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params
  const body = await request.json()
  const { matriculaId, descricao, valor, tipo, status, dataPagamento, dataVencimento } = body

  const existing = await db.baixa.findUnique({
    where: { id },
    include: { matricula: { include: { curso: { select: { empresaId: true } } } } },
  })
  if (!existing) {
    return NextResponse.json({ error: "Baixa não encontrada." }, { status: 404 })
  }

  // Validação de escopo via matrícula → curso → empresa
  if (!user.superAdmin && existing.matricula) {
    if (existing.matricula.curso.empresaId !== user.empresaId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }
  }

  const baixa = await db.baixa.update({
    where: { id },
    data: {
      ...(matriculaId !== undefined && { matriculaId: matriculaId || null }),
      ...(descricao !== undefined && { descricao: descricao || null }),
      ...(valor !== undefined && { valor: parseFloat(valor) }),
      ...(tipo !== undefined && { tipo }),
      ...(status !== undefined && { status }),
      ...(dataPagamento !== undefined && { dataPagamento: dataPagamento ? new Date(dataPagamento) : null }),
      ...(dataVencimento !== undefined && { dataVencimento: dataVencimento ? new Date(dataVencimento) : null }),
    },
    include: {
      matricula: {
        select: {
          aluno: { select: { nome: true } },
          curso: { select: { nome: true } },
        },
      },
    },
  })

  return NextResponse.json(baixa)
}

// DELETE /api/baixas/[id] — só role A
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await exigirPapel([PapelUsuario.A])
  if (auth instanceof NextResponse) return auth
  const user = auth.usuario

  const { id } = await params

  const existing = await db.baixa.findUnique({
    where: { id },
    include: { matricula: { include: { curso: { select: { empresaId: true } } } } },
  })
  if (!existing) {
    return NextResponse.json({ error: "Baixa não encontrada." }, { status: 404 })
  }

  if (!user.superAdmin && existing.matricula) {
    if (existing.matricula.curso.empresaId !== user.empresaId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }
  }

  await db.baixa.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
