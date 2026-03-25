import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/backend/auth/nextauth-config"
import { resolveModulosEfetivos } from "@/backend/auth/session-helpers"
import { Sidebar } from "@/frontend/layout/dashboard-sidebar"
import { TopBar } from "@/frontend/layout/dashboard-topbar"
import { SessionWrapper } from "@/frontend/layout/dashboard-session-wrapper"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const modulosAtivos = await resolveModulosEfetivos(session.user)

  return (
    <SessionWrapper session={session}>
      <div className="min-h-screen flex bg-slate-50 font-sans">
        <Sidebar
          role={session.user.role}
          grupoIsAdmin={session.user.grupoIsAdmin}
          modules={modulosAtivos}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SessionWrapper>
  )
}
