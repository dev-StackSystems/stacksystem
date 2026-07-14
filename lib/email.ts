/**
 * servidor/email/cliente.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitário de envio de e-mail via nodemailer.
 *
 * Variáveis de ambiente necessárias (.env.local):
 *   EMAIL_HOST  — servidor SMTP (ex: smtp.gmail.com)
 *   EMAIL_PORT  — porta SMTP (ex: 587)
 *   EMAIL_USER  — e-mail remetente
 *   EMAIL_PASS  — senha ou app password
 *   EMAIL_FROM  — "Nome <email>" (opcional, usa EMAIL_USER se omitido)
 *   EMAIL_CONTATO — caixa que recebe as mensagens do formulário de contato
 *                   (opcional, usa EMAIL_USER se omitido)
 *
 * Em desenvolvimento (sem variáveis configuradas):
 *   O link de redefinição e as mensagens de contato são exibidos no console.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import nodemailer from "nodemailer"

// Verifica se as variáveis de e-mail estão configuradas
const emailConfigurado =
  !!process.env.EMAIL_HOST &&
  !!process.env.EMAIL_USER &&
  !!process.env.EMAIL_PASS

// Cria o transporter apenas se configurado
const transporter = emailConfigurado
  ? nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   Number(process.env.EMAIL_PORT ?? 587),
      secure: Number(process.env.EMAIL_PORT ?? 587) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null
 
/**
 * Envia e-mail de redefinição de senha.
 * Se o e-mail não estiver configurado, imprime o link no console (dev).
 */
export async function enviarEmailRedefinicaoSenha(
  destinatario: string,
  link: string
): Promise<void> {
  if (!transporter) {
    // Modo desenvolvimento: exibe o link no console
    console.log("\n========== REDEFINIÇÃO DE SENHA (DEV) ==========")
    console.log(`Destinatário : ${destinatario}`)
    console.log(`Link         : ${link}`)
    console.log("=================================================\n")
    return
  }

  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_USER

  await transporter.sendMail({
    from,
    to:      destinatario,
    subject: "StackSystems — Redefinição de senha",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <div style="background:#f97316;padding:20px 24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">
            Stack<strong>Systems</strong>
          </h1>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;
                    border-radius:0 0 12px 12px;padding:28px 24px">
          <h2 style="margin-top:0;color:#0f172a;font-size:18px">
            Redefinição de senha
          </h2>
          <p style="color:#64748b;line-height:1.6">
            Recebemos uma solicitação para redefinir a senha da sua conta.
            Clique no botão abaixo para criar uma nova senha.
          </p>
          <a href="${link}"
             style="display:inline-block;background:#f97316;color:#fff;
                    font-weight:bold;padding:12px 28px;border-radius:8px;
                    text-decoration:none;margin:16px 0">
            Redefinir senha
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:20px">
            Este link expira em <strong>1 hora</strong>.<br>
            Se você não solicitou a redefinição, ignore este e-mail.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
          <p style="color:#cbd5e1;font-size:12px;text-align:center;margin:0">
            StackSystems — I3 Soluções
          </p>
        </div>
      </div>
    `,
  })
}

// ── Contato (formulário das landing pages) ───────────────────────────────────

export interface DadosContato {
  nome:     string
  email:    string
  mensagem: string
  empresa?: string
  origem?:  string   // caminho da landing (ex: /barbeiro, /financeiro)
}

/**
 * Envia a mensagem do formulário de contato para a caixa configurada
 * (EMAIL_CONTATO ou EMAIL_USER). O `replyTo` é o e-mail do visitante,
 * então basta responder o e-mail para falar com ele.
 *
 * @returns { enviado } true se saiu por SMTP; false se caiu no console (dev).
 */
export async function enviarEmailContato(dados: DadosContato): Promise<{ enviado: boolean }> {
  const destino = process.env.EMAIL_CONTATO || process.env.EMAIL_USER

  if (!transporter || !destino) {
    console.log("\n========== NOVO CONTATO (e-mail não configurado) ==========")
    console.log(`Nome     : ${dados.nome}`)
    console.log(`E-mail   : ${dados.email}`)
    console.log(`Empresa  : ${dados.empresa ?? "—"}`)
    console.log(`Origem   : ${dados.origem ?? "—"}`)
    console.log(`Mensagem : ${dados.mensagem}`)
    console.log("===========================================================\n")
    return { enviado: false }
  }

  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_USER
  const esc = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;")

  await transporter.sendMail({
    from,
    to:      destino,
    replyTo: dados.email,
    subject: `Novo contato pelo site${dados.empresa ? ` — ${dados.empresa}` : ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <div style="background:#f97316;padding:20px 24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:18px">Nova mensagem de contato</h1>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#0f172a">
            <tr><td style="padding:6px 0;color:#64748b;width:110px">Nome</td><td style="padding:6px 0"><strong>${esc(dados.nome)}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">E-mail</td><td style="padding:6px 0"><a href="mailto:${esc(dados.email)}">${esc(dados.email)}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Empresa</td><td style="padding:6px 0">${esc(dados.empresa ?? "—")}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Origem</td><td style="padding:6px 0">${esc(dados.origem ?? "—")}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;color:#334155;line-height:1.6;white-space:pre-wrap">${esc(dados.mensagem)}</div>
          <p style="color:#94a3b8;font-size:12px;margin-top:18px">Responda este e-mail para falar direto com ${esc(dados.nome)}.</p>
        </div>
      </div>
    `,
  })
  return { enviado: true }
}
