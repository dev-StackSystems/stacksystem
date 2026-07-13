import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { EquipeTable } from "@/components/tables/tabela-equipe-barbearia"
import { BarbeiroFormModal } from "@/components/forms/form-barbeiro"
import { UserCog, Plus } from "lucide-react"

export default async function EquipeBarbeariaPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  const isAdmin = superAdmin || session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin

  const barbeiros = await db.barbeiro.findMany({
    where: superAdmin ? {} : { empresaId },
    orderBy: { nome: "asc" },
    include: { _count: { select: { agendamentos: true } } },
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCog size={22} className="text-brand-500" /> Equipe
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Barbeiros e profissionais que atendem</p>
        </div>
        {canEdit && (
          <BarbeiroFormModal mode="create" trigger={
            <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200">
              <Plus size={16} /> Novo Profissional
            </button>
          } />
        )}
      </div>

      <EquipeTable barbeiros={barbeiros} isAdmin={isAdmin} canEdit={canEdit} />
    </div>
  )
}
