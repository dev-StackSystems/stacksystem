import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/backend/auth/nextauth-config"
import { resolveModulosEfetivos } from "@/backend/auth/session-helpers"
import { db } from "@/backend/database/prisma-client"
import { Sidebar } from "@/frontend/layout/dashboard-sidebar"
import { TopBar } from "@/frontend/layout/dashboard-topbar"
import { SessionWrapper } from "@/frontend/layout/dashboard-session-wrapper"
import { AlertTriangle } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { isSuperAdmin } = session.user

  // Super admin não precisa de empresa vinculada — acesso irrestrito
  if (!isSuperAdmin && !session.user.empresaId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 max-w-md text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <h1 className="font-serif text-xl font-bold text-slate-900 mb-2">Conta sem empresa vinculada</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Sua conta não está vinculada a nenhuma empresa. Entre em contato com o administrador para configurar o acesso.
          </p>
        </div>
      </div>
    )
  }

  const [modulosAtivos, empresa] = await Promise.all([
    resolveModulosEfetivos(session.user),
    session.user.empresaId
      ? db.empresa.findUnique({
          where: { id: session.user.empresaId },
          select: { cor: true, logo: true, nome: true, nomeSistema: true, tipoSistema: true },
        })
      : null,
  ])

  // Empresa sem tipo configurado: bloqueia acesso de usuários não-super-admin
  if (!isSuperAdmin && empresa && !empresa.tipoSistema) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 max-w-md text-center">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-orange-500" />
          </div>
          <h1 className="font-serif text-xl font-bold text-slate-900 mb-2">Sistema não configurado</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            A empresa <span className="font-semibold text-slate-700">{empresa.nome}</span> ainda não tem um tipo de sistema definido. Aguarde a configuração pelo administrador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <SessionWrapper session={session}>
      <div className="min-h-screen flex bg-slate-50 font-sans">
        <Sidebar
          role={session.user.role}
          isSuperAdmin={isSuperAdmin}
          grupoIsAdmin={session.user.grupoIsAdmin}
          modules={modulosAtivos}
          brand={empresa ?? null}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SessionWrapper>
  )
}
