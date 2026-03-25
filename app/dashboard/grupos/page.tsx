import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import { GrupoTable } from "@/frontend/tables/grupo-data-table"
import { GrupoFormModal } from "@/frontend/modals/grupo-form-modal"
import { UsersRound, Plus } from "lucide-react"

export default async function GruposPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const isAdmin = session.user.role === "A"
  const canManage = isAdmin || session.user.grupoIsAdmin

  if (!canManage && session.user.role === "F") redirect("/dashboard")

  const where = isAdmin ? {} : { empresaId: session.user.empresaId ?? undefined }

  const [grupos, empresas] = await Promise.all([
    db.grupo.findMany({
      where,
      orderBy: { nome: "asc" },
      include: {
        empresa: { select: { nome: true } },
        modulos: { select: { modulo: true } },
        _count: { select: { usuarios: true } },
      },
    }),
    isAdmin
      ? db.empresa.findMany({ where: { ativa: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } })
      : [],
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <UsersRound size={20} className="text-orange-500" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-slate-900">Grupos de Usuário</h1>
            <p className="text-sm text-slate-400 mt-0.5">Grupos, permissões e módulos de acesso</p>
          </div>
        </div>
        {canManage && (
          <GrupoFormModal
            empresas={empresas}
            isAdmin={isAdmin}
            empresaId={session.user.empresaId}
            trigger={
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
                <Plus size={16} />
                Novo Grupo
              </button>
            }
          />
        )}
      </div>

      <GrupoTable grupos={grupos} canManage={canManage} isAdmin={isAdmin} empresas={empresas} />
    </div>
  )
}
