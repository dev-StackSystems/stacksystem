import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/backend/database/prisma-client"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("MISSING_FIELDS")
        }

        let user
        try {
          user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { grupo: { select: { isAdmin: true } } },
          })
        } catch (err) {
          console.error("[Auth] Erro ao conectar no banco:", err)
          throw new Error("DB_ERROR")
        }

        if (!user) throw new Error("USER_NOT_FOUND")
        if (!user.active) throw new Error("USER_INACTIVE")

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) throw new Error("WRONG_PASSWORD")

        return {
          id:           user.id,
          name:         user.name,
          email:        user.email,
          role:         user.role as string,
          empresaId:    user.empresaId ?? null,
          grupoId:      user.grupoId ?? null,
          setorId:      user.setorId ?? null,
          grupoIsAdmin: user.grupo?.isAdmin ?? false,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string; role: string; empresaId: string | null
          grupoId: string | null; setorId: string | null; grupoIsAdmin: boolean
        }
        token.id           = u.id
        token.role         = u.role
        token.empresaId    = u.empresaId ?? null
        token.grupoId      = u.grupoId ?? null
        token.setorId      = u.setorId ?? null
        token.grupoIsAdmin = u.grupoIsAdmin ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id           = token.id
        session.user.role         = token.role
        session.user.empresaId    = token.empresaId ?? null
        session.user.grupoId      = token.grupoId ?? null
        session.user.setorId      = token.setorId ?? null
        session.user.grupoIsAdmin = token.grupoIsAdmin ?? false
      }
      return session
    },
  },
}
