/**
 * app/api/seguranca/mfa/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestão do 2FA (TOTP) do usuário logado.
 *
 * POST body:
 *   { action: "setup" }               → gera segredo, retorna otpauth + QR (data URL)
 *   { action: "ativar", codigo }      → valida o código e ativa o 2FA
 *   { action: "desativar" }           → desativa e apaga o segredo
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUsuarioAtual } from "@/lib/auth-helpers"
import { authenticator } from "otplib"
import QRCode from "qrcode"
import { registrarAuditoria, ipDaRequisicao } from "@/lib/auditoria"

export async function POST(req: Request) {
  const usuario = await getUsuarioAtual()
  if (!usuario) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { action, codigo } = await req.json()
  const dbUser = await db.usuario.findUnique({
    where: { id: usuario.id },
    select: { email: true, mfaSecret: true, mfaAtivo: true },
  })
  if (!dbUser) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  if (action === "setup") {
    const secret = authenticator.generateSecret()
    await db.usuario.update({ where: { id: usuario.id }, data: { mfaSecret: secret, mfaAtivo: false } })
    const otpauth = authenticator.keyuri(dbUser.email, "StackSystems", secret)
    const qr = await QRCode.toDataURL(otpauth)
    return NextResponse.json({ ok: true, secret, otpauth, qr })
  }

  if (action === "ativar") {
    if (!dbUser.mfaSecret) return NextResponse.json({ error: "Gere o QR Code primeiro." }, { status: 400 })
    const valido = authenticator.verify({ token: String(codigo || "").replace(/\s/g, ""), secret: dbUser.mfaSecret })
    if (!valido) return NextResponse.json({ error: "Código inválido. Tente novamente." }, { status: 400 })
    await db.usuario.update({ where: { id: usuario.id }, data: { mfaAtivo: true } })
    await registrarAuditoria(usuario.id, "seguranca.mfa.ativar", null, ipDaRequisicao(req))
    return NextResponse.json({ ok: true })
  }

  if (action === "desativar") {
    await db.usuario.update({ where: { id: usuario.id }, data: { mfaAtivo: false, mfaSecret: null } })
    await registrarAuditoria(usuario.id, "seguranca.mfa.desativar", null, ipDaRequisicao(req))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
