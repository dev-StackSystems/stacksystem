import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { ConciliacaoForm } from "@/components/financeiro/conciliacao-form"
import { RefreshCw } from "lucide-react"

export default async function ConciliacaoPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  // Conciliação altera dados: só quem edita (bloqueia F e demais sem permissão)
  const canEdit = session.user.superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  if (!canEdit) redirect("/painel/financeiro")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const contas = await db.contaFinanceira.findMany({
    where: superAdmin ? { ativo: true } : { empresaId, ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw size={22} className="text-brand-500" /> Conciliação Bancária
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Importe o extrato (OFX/CSV) e concilie com seus lançamentos</p>
      </div>

      <ConciliacaoForm contas={contas} />
    </div>
  )
}
