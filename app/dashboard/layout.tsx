import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { TopBar } from "@/components/dashboard/TopBar"
import { SessionWrapper } from "@/components/dashboard/SessionWrapper"

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
