/**
 * servidor/autenticacao/config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Configuração do NextAuth.js para autenticação por e-mail e senha.
 *
 * Estratégia: JWT (token no cookie, sem tabela de sessões ativa)
 * Provider:   CredentialsProvider (e-mail + senha com bcrypt)
 *
 * O que é armazenado no token JWT (e na sessão):
 *   - id, nome, email
 *   - papel (A/T/F)
 *   - superAdmin (flag para o desenvolvedor/i3)
 *   - empresaId, grupoId, setorId (vínculos organizacionais)
 *   - grupoIsAdmin (flag do grupo com acesso total)
 *
 * Uso:
 *   import { opcoesAuth } from "@/servidor/autenticacao/config"
 *   const sessao = await getServerSession(opcoesAuth)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/servidor/banco/cliente"
import bcrypt from "bcryptjs"

export const opcoesAuth: NextAuthOptions = {
  // Estratégia JWT: sessão fica no cookie, não no banco
  // maxAge máximo = 30 dias (quando "lembrar de mim" está marcado)
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

  // Página customizada de login
  pages: { signIn: "/login" },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:   { label: "E-mail",        type: "email"    },
        senha:   { label: "Senha",         type: "password" },
        lembrar: { label: "Lembrar de mim", type: "text"    },
      },

      /**
       * Valida as credenciais e retorna o objeto do usuário (ou lança erro).
       * Os erros são códigos em MAIÚSCULAS para facilitar mensagens no frontend.
       */
      async authorize(credenciais, req) {
        // Campos obrigatórios
        if (!credenciais?.email || !credenciais?.senha) {
          throw new Error("CAMPOS_FALTANDO")
        }
        const lembrar = credenciais.lembrar === "true"

        // Busca o usuário com o grupo (para verificar isAdmin do grupo)
        let usuario
        try {
          usuario = await db.usuario.findUnique({
            where: { email: credenciais.email },
            include: { grupo: { select: { isAdmin: true } } },
          })
        } catch (erro) {
          console.error("[Auth] Erro ao buscar usuário no banco:", erro)
          throw new Error("ERRO_BANCO")
        }

        if (!usuario)       throw new Error("USUARIO_NAO_ENCONTRADO")
        if (!usuario.ativo) throw new Error("USUARIO_INATIVO")

        // Verifica a senha com bcrypt
        const senhaCorreta = await bcrypt.compare(credenciais.senha, usuario.senha)
        if (!senhaCorreta)  throw new Error("SENHA_INCORRETA")

        // Registra o login no log de auditoria (assíncrono, não bloqueia o login)
        const ip =
          (req?.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
          (req as unknown as { socket?: { remoteAddress?: string } })?.socket?.remoteAddress ??
          null

        db.segurancaUsuario.create({
          data: {
            usuarioId: usuario.id,
            acao:      "login",
            detalhes:  "Acesso autenticado com e-mail e senha",
            ip,
          },
        }).catch(erro => console.error("[Auth] Falha ao salvar log de login:", erro))

        // Retorna o objeto que será gravado no JWT
        // IMPORTANTE: NextAuth espera o campo `name` (padrão JWT) — mapeamos `nome` para ele
        return {
          id:           usuario.id,
          name:         usuario.nome,   // 'name' é o campo padrão do JWT (RFC 7519)
          email:        usuario.email,
          papel:        usuario.papel as string,
          superAdmin:   usuario.superAdmin,
          empresaId:    usuario.empresaId ?? null,
          grupoId:      usuario.grupoId  ?? null,
          setorId:      usuario.setorId  ?? null,
          grupoIsAdmin: usuario.grupo?.isAdmin ?? false,
          lembrar,
        }
      },
    }),
  ],

  callbacks: {
    /**
     * jwt: chamado ao criar/atualizar o token.
     * Transfere os dados do usuário para dentro do token JWT.
     */
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id:           string
          papel:        string
          superAdmin:   boolean
          empresaId:    string | null
          grupoId:      string | null
          setorId:      string | null
          grupoIsAdmin: boolean
          lembrar:      boolean
        }
        token.id           = u.id
        token.papel        = u.papel
        token.superAdmin   = u.superAdmin ?? false
        token.empresaId    = u.empresaId  ?? null
        token.grupoId      = u.grupoId    ?? null
        token.setorId      = u.setorId    ?? null
        token.grupoIsAdmin = u.grupoIsAdmin ?? false

        // Sem "lembrar de mim": sessão expira em 8 horas
        // Com "lembrar de mim": usa o maxAge padrão de 30 dias
        if (!u.lembrar) {
          token.exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60
        }
      }
      return token
    },

    /**
     * session: chamado ao ler a sessão no servidor ou cliente.
     * Disponibiliza os dados do token para `session.user`.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id           = token.id
        session.user.papel        = token.papel
        session.user.superAdmin   = token.superAdmin  ?? false
        session.user.empresaId    = token.empresaId   ?? null
        session.user.grupoId      = token.grupoId     ?? null
        session.user.setorId      = token.setorId     ?? null
        session.user.grupoIsAdmin = token.grupoIsAdmin ?? false
      }
      return session
    },
  },
}
