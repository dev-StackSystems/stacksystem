import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { CentrosTable } from "@/components/tables/tabela-centros"
import { CentroCustoFormModal } from "@/components/forms/form-centro-custo"
import { Target, Plus } from "lucide-react"

export default async function CentrosCustoPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  const isAdmin = superAdmin || session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin

  const centros = await db.centroCusto.findMany({
    where: superAdmin ? {} : { empresaId },
    orderBy: { nome: "asc" },
    include: { _count: { select: { lancamentos: true } } },
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target size={22} className="text-brand-500" /> Centros de Custo
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Classifique lançamentos por centro de custo ou projeto</p>
        </div>
        {canEdit && (
          <CentroCustoFormModal mode="create" trigger={
            <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200">
              <Plus size={16} /> Novo Centro de Custo
            </button>
          } />
        )}
      </div>

      <CentrosTable centros={centros} isAdmin={isAdmin} canEdit={canEdit} />
    </div>
  )
}
