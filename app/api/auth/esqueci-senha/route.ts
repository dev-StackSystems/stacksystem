/**
 * app/api/auth/esqueci-senha/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/auth/esqueci-senha
 *
 * Recebe o e-mail do usuário, cria um token de redefinição com validade de
 * 1 hora e envia o link por e-mail.
 *
 * Em desenvolvimento (sem EMAIL_HOST configurado), o link é exibido no
 * console do servidor.
 *
 * Respostas:
 *   200 — sempre retorna 200 para não vazar se o e-mail existe ou não
 *   400 — e-mail inválido
 *   500 — erro interno
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import { enviarEmailRedefinicaoSenha } from "@/servidor/email/cliente"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email: string = (body.email ?? "").trim().toLowerCase()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 })
    }

    // Busca o usuário — se não existir, retorna 200 mesmo assim (segurança)
    const usuario = await db.usuario.findUnique({
      where: { email },
      select: { id: true, nome: true, ativo: true },
    })

    if (!usuario || !usuario.ativo) {
      // Não revela se o e-mail existe ou não
      return NextResponse.json({ ok: true })
    }

    // Gera token único e seguro
    const token    = crypto.randomBytes(32).toString("hex")
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Invalida tokens anteriores deste usuário (raw SQL — cliente Prisma
    // pode não ter o accessor até o próximo restart + prisma generate)
    await db.$executeRaw`
      DELETE FROM tokens_redefinicao_senha
      WHERE "usuarioId" = ${usuario.id} AND usado = false
    `

    // Insere o novo token
    await db.$executeRaw`
      INSERT INTO tokens_redefinicao_senha ("usuarioId", token, "expiraEm")
      VALUES (${usuario.id}, ${token}, ${expiraEm})
    `

    // Monta o link de redefinição
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const link = `${base}/login/redefinir-senha?token=${token}`

    // Envia o e-mail (ou loga no console em dev)
    await enviarEmailRedefinicaoSenha(email, link)

    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error("[esqueci-senha]", erro)
    return NextResponse.json({ erro: "Erro interno. Tente novamente." }, { status: 500 })
  }
}
