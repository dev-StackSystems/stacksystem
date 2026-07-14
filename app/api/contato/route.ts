/**
 * app/api/contato/route.ts
 * Recebe o formulário de contato das landing pages e envia por e-mail.
 * Público (sem autenticação).
 */

import { NextRequest, NextResponse } from "next/server"
import { enviarEmailContato } from "@/lib/email"

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })

  const nome = String(b.nome ?? "").trim().slice(0, 120)
  const email = String(b.email ?? "").trim().slice(0, 160)
  const mensagem = String(b.mensagem ?? "").trim().slice(0, 4000)
  const empresa = String(b.empresa ?? "").trim().slice(0, 120)
  const origem = String(b.origem ?? "").trim().slice(0, 120)

  if (!nome || !email || !mensagem) {
    return NextResponse.json({ error: "Preencha nome, e-mail e mensagem." }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 })
  }

  try {
    await enviarEmailContato({ nome, email, mensagem, empresa: empresa || undefined, origem: origem || undefined })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[contato] falha ao enviar:", e)
    return NextResponse.json({ error: "Não foi possível enviar agora. Tente novamente em instantes." }, { status: 500 })
  }
}
