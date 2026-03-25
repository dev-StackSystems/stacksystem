import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/backend/auth/nextauth-config"
import { db } from "@/backend/database/prisma-client"
import { Sidebar } from "@/frontend/layout/dashboard-sidebar"
import { TopBar } from "@/frontend/layout/dashboard-topbar"
import { SessionWrapper } from "@/frontend/layout/dashboard-session-wrapper"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  // Buscar módulos ativos da empresa do usuário.
  // Admin (A) sem empresa → array vazio; a Sidebar ignora modules quando role === "A".
  const modulosAtivos: string[] = session.user.empresaId
    ? await db.empresaModulo
        .findMany({
          where: { empresaId: session.user.empresaId, ativo: true },
          select: { modulo: true },
        })
        .then((mods) => mods.map((m) => m.modulo))
    : []

  return (
    <SessionWrapper session={session}>
      <div className="min-h-screen flex bg-slate-50 font-sans">
        <Sidebar role={session.user.role} modules={modulosAtivos} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SessionWrapper>
  )
}
