import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { BaixaTable } from "@/frontend/tables/baixa-data-table"
import { BaixaFormModal } from "@/frontend/modals/baixa-form-modal"
import { DollarSign, TrendingUp, Clock, AlertCircle } from "lucide-react"

const formatBRL = (val: number) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default async function BaixasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role === UserRole.F) redirect("/dashboard")

  const { isSuperAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const isAdmin = isSuperAdmin
  const canEdit = isSuperAdmin || session.user.role === UserRole.A || session.user.role === UserRole.T

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  // Filtro de empresa para baixas (via matrícula → curso → empresa)
  const empresaScope = isSuperAdmin ? {} : { matricula: { empCurso: { empresaId } } }
  const matriculaScope = isSuperAdmin ? { status: "ativa" } : { status: "ativa", empCurso: { empresaId } }

  const [baixas, matriculas, kpis] = await Promise.all([
    db.baixa.findMany({
      where: empresaScope,
      orderBy: { createdAt: "desc" },
      include: {
        matricula: {
          select: {
            aluno: { select: { nome: true } },
            empCurso: { select: { nome: true } },
          },
        },
      },
    }),
    db.matricula.findMany({
      where: matriculaScope,
      select: {
        id: true,
        aluno: { select: { nome: true } },
        empCurso: { select: { nome: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      db.baixa.aggregate({ _sum: { valor: true }, where: { status: "pago", ...empresaScope } }),
      db.baixa.aggregate({ _sum: { valor: true }, where: { status: "pendente", ...empresaScope } }),
      db.baixa.aggregate({ _sum: { valor: true }, where: { status: "pago", dataPag: { gte: inicioMes }, ...empresaScope } }),
      db.baixa.count({ where: { status: "pendente", dataVenc: { lt: hoje }, ...empresaScope } }),
    ]),
  ])

  const [totalPago, totalPendente, receitaMes, qtdAtrasados] = kpis

  const baixasSerialized = baixas.map((b) => ({
    ...b,
    valor: b.valor.toString(),
    dataPag: b.dataPag ? b.dataPag.toISOString() : null,
    dataVenc: b.dataVenc ? b.dataVenc.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
  }))

  const kpiCards = [
    {
      label: "Total Recebido",
      value: formatBRL(Number(totalPago._sum.valor ?? 0)),
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "Receita do Mês",
      value: formatBRL(Number(receitaMes._sum.valor ?? 0)),
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "A Receber",
      value: formatBRL(Number(totalPendente._sum.valor ?? 0)),
      icon: Clock,
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "Em Atraso",
      value: `${qtdAtrasados} pagamento${qtdAtrasados !== 1 ? "s" : ""}`,
      icon: AlertCircle,
      color: qtdAtrasados > 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100",
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign size={22} className="text-orange-500" />
            Financeiro
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Controle de pagamentos e baixas</p>
        </div>
        {canEdit && (
          <BaixaFormModal
            mode="create"
            matriculas={matriculas}
            trigger={
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
                <DollarSign size={16} />
                Nova Baixa
              </button>
            }
          />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="font-serif text-xl font-bold text-slate-900 truncate">{card.value}</div>
            </div>
          )
        })}
      </div>

      <BaixaTable
        baixas={baixasSerialized}
        matriculas={matriculas}
        isAdmin={isAdmin}
        canEdit={canEdit}
      />
    </div>
  )
}
