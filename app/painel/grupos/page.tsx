import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { redirect } from "next/navigation"
import { GrupoTable } from "@/componentes/tabelas/tabela-grupos"
import { GrupoFormModal } from "@/componentes/formularios/form-grupo"
import { UsersRound, Plus } from "lucide-react"

export default async function GruposPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")

  const { superAdmin } = session.user
  const isEmpresaAdmin = session.user.papel === "A" || session.user.grupoIsAdmin
  const canManage = superAdmin || isEmpresaAdmin

  if (!canManage && session.user.papel === "F") redirect("/painel")

  const where = superAdmin ? {} : { empresaId: session.user.empresaId ?? undefined }

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
    superAdmin
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
            isAdmin={superAdmin}
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

      <GrupoTable grupos={grupos} canManage={canManage} isAdmin={superAdmin} empresas={empresas} />
    </div>
  )
}
