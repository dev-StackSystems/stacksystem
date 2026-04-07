/**
 * app/api/auth/redefinir-senha/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/auth/redefinir-senha
 *
 * Valida o token de redefinição e atualiza a senha do usuário.
 *
 * Body: { token: string, novaSenha: string }
 *
 * Respostas:
 *   200 — senha alterada com sucesso
 *   400 — campos faltando, token inválido/expirado
 *   500 — erro interno
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servidor/banco/cliente"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body       = await req.json()
    const token      = (body.token     ?? "").trim()
    const novaSenha  = (body.novaSenha ?? "").trim()

    if (!token || !novaSenha) {
      return NextResponse.json({ erro: "Campos obrigatórios faltando." }, { status: 400 })
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ erro: "A senha deve ter ao menos 6 caracteres." }, { status: 400 })
    }

    // Busca o token no banco
    const registros = await db.$queryRaw<Array<{
      id:        string
      usuarioId: string
      expiraEm:  Date
      usado:     boolean
    }>>`
      SELECT id, "usuarioId", "expiraEm", usado
      FROM tokens_redefinicao_senha
      WHERE token = ${token}
      LIMIT 1
    `

    const registro = registros[0]

    if (!registro) {
      return NextResponse.json({ erro: "Link inválido ou já utilizado." }, { status: 400 })
    }

    if (registro.usado) {
      return NextResponse.json({ erro: "Este link já foi utilizado." }, { status: 400 })
    }

    if (new Date() > new Date(registro.expiraEm)) {
      return NextResponse.json({ erro: "Este link expirou. Solicite um novo." }, { status: 400 })
    }

    // Atualiza a senha do usuário
    const senhaHash = await bcrypt.hash(novaSenha, 12)

    await db.usuario.update({
      where: { id: registro.usuarioId },
      data:  { senha: senhaHash },
    })

    // Marca o token como usado
    await db.$executeRaw`
      UPDATE tokens_redefinicao_senha
      SET usado = true
      WHERE id = ${registro.id}
    `

    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error("[redefinir-senha]", erro)
    return NextResponse.json({ erro: "Erro interno. Tente novamente." }, { status: 500 })
  }
}
