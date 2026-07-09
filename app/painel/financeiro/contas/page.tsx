import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { ContasTable, ContaComSaldo } from "@/components/tables/tabela-contas"
import { ContaFormModal } from "@/components/forms/form-conta"
import { Landmark, Plus } from "lucide-react"

export default async function ContasPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  const isAdmin = superAdmin || session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin
  const escopo = superAdmin ? {} : { empresaId }

  const [contas, movimentos] = await Promise.all([
    db.contaFinanceira.findMany({ where: escopo, orderBy: { nome: "asc" } }),
    db.lancamentoFinanceiro.groupBy({
      by: ["contaId", "tipo"],
      _sum: { valor: true },
      where: { ...escopo, status: "pago", contaId: { not: null } },
    }),
  ])

  const contasComSaldo: ContaComSaldo[] = contas.map((c) => {
    const receita = movimentos.find((m) => m.contaId === c.id && m.tipo === "receita")?._sum.valor
    const despesa = movimentos.find((m) => m.contaId === c.id && m.tipo === "despesa")?._sum.valor
    const saldoAtual = Number(c.saldoInicial) + Number(receita ?? 0) - Number(despesa ?? 0)
    return { ...c, saldoInicial: c.saldoInicial.toString(), saldoAtual }
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark size={22} className="text-brand-500" /> Contas
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Caixa, bancos e carteiras — com saldo consolidado</p>
        </div>
        {canEdit && (
          <ContaFormModal mode="create" trigger={
            <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200">
              <Plus size={16} /> Nova Conta
            </button>
          } />
        )}
      </div>

      <ContasTable contas={contasComSaldo} isAdmin={isAdmin} canEdit={canEdit} />
    </div>
  )
}
