import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PapelUsuario } from "@prisma/client"
import { OrcamentosTable } from "@/components/tables/tabela-orcamentos"
import { OrcamentoFormModal } from "@/components/forms/form-orcamento"
import { OrcamentoData } from "@/components/forms/form-orcamento"
import { Target, Plus } from "lucide-react"

interface Props { searchParams: Promise<{ ano?: string }> }

export default async function OrcamentoPage({ searchParams }: Props) {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  const isAdmin = superAdmin || session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin
  const escopo = superAdmin ? {} : { empresaId }
  const escopoAtivo = superAdmin ? { ativo: true } : { empresaId, ativo: true }

  const sp = await searchParams
  const anoAtual = new Date().getFullYear()
  const ano = parseInt(sp.ano || "") || anoAtual
  const inicioAno = new Date(ano, 0, 1)
  const fimAno = new Date(ano, 11, 31, 23, 59, 59)

  const [orcamentosRaw, lancs, categorias, centros] = await Promise.all([
    db.orcamento.findMany({
      where: { ...escopo, ano },
      orderBy: [{ mes: "asc" }],
      include: { categoria: { select: { nome: true, natureza: true, cor: true } }, centroCusto: { select: { nome: true } } },
    }),
    db.lancamentoFinanceiro.findMany({
      where: { ...escopo, status: "pago", dataCompetencia: { gte: inicioAno, lte: fimAno } },
      select: {
        categoriaId: true, centroCustoId: true, valor: true, dataCompetencia: true,
        rateios: { select: { categoriaId: true, centroCustoId: true, valor: true } },
      },
    }),
    db.categoriaFinanceira.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true, natureza: true } }),
    db.centroCusto.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ])

  // Realizado por orçamento (considera rateio quando o lançamento é dividido)
  const realizadoDe = (o: { mes: number; categoriaId: string | null; centroCustoId: string | null }) => {
    let total = 0
    for (const l of lancs) {
      const mesL = new Date(l.dataCompetencia).getMonth() + 1
      if (o.mes !== 0 && mesL !== o.mes) continue
      if (l.rateios.length === 0) {
        if ((!o.categoriaId || l.categoriaId === o.categoriaId) && (!o.centroCustoId || l.centroCustoId === o.centroCustoId)) total += Number(l.valor)
      } else {
        for (const r of l.rateios) {
          if ((!o.categoriaId || r.categoriaId === o.categoriaId) && (!o.centroCustoId || r.centroCustoId === o.centroCustoId)) total += Number(r.valor)
        }
      }
    }
    return total
  }

  const orcamentos: OrcamentoData[] = orcamentosRaw.map((o) => ({
    ...o,
    valor: Number(o.valor),
    realizado: realizadoDe(o),
  }))

  const totalOrcado = orcamentos.reduce((s, o) => s + Number(o.valor), 0)
  const totalRealizado = orcamentos.reduce((s, o) => s + (o.realizado ?? 0), 0)
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target size={22} className="text-brand-500" /> Orçamento
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Limites por categoria e centro de custo — orçado vs realizado</p>
        </div>
        {canEdit && (
          <OrcamentoFormModal mode="create" categorias={categorias} centros={centros} anoPadrao={ano} trigger={
            <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200">
              <Plus size={16} /> Novo Orçamento
            </button>
          } />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-1.5">
          {anos.map((a) => (
            <Link key={a} href={`/painel/financeiro/orcamento?ano=${a}`}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${a === ano ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {a}
            </Link>
          ))}
        </div>
        {orcamentos.length > 0 && (
          <p className="text-xs text-slate-400">
            Total orçado <span className="font-semibold text-slate-600">{totalOrcado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span> ·
            Realizado <span className="font-semibold text-slate-600">{totalRealizado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </p>
        )}
      </div>

      <OrcamentosTable orcamentos={orcamentos} categorias={categorias} centros={centros} ano={ano} canEdit={canEdit} isAdmin={isAdmin} />
    </div>
  )
}
