import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { ServicosTable } from "@/components/tables/tabela-servicos-barbearia"
import { ServicoFormModal } from "@/components/forms/form-servico-barbearia"
import { Scissors, Plus } from "lucide-react"

export default async function ServicosBarbeariaPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  const isAdmin = superAdmin || session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin

  const servicosRaw = await db.servicoBarbearia.findMany({
    where: superAdmin ? {} : { empresaId },
    orderBy: { nome: "asc" },
    include: { _count: { select: { agendamentos: true } } },
  })
  const servicos = servicosRaw.map((s) => ({ ...s, preco: Number(s.preco) }))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scissors size={22} className="text-brand-500" /> Serviços
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Cortes, barba e outros — com duração e preço</p>
        </div>
        {canEdit && (
          <ServicoFormModal mode="create" trigger={
            <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200">
              <Plus size={16} /> Novo Serviço
            </button>
          } />
        )}
      </div>

      <ServicosTable servicos={servicos} isAdmin={isAdmin} canEdit={canEdit} />
    </div>
  )
}
