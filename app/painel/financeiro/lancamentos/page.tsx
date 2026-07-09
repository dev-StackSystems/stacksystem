import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { LancamentosTable } from "@/components/tables/tabela-lancamentos"
import { LancamentoFormModal } from "@/components/forms/form-lancamento"
import { serializarLancamento } from "@/lib/financeiro"
import { ArrowRightLeft, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

export default async function LancamentosPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  const isAdmin = superAdmin || session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin
  const escopo = superAdmin ? {} : { empresaId }
  const escopoAtivo = superAdmin ? { ativo: true } : { empresaId, ativo: true }

  const [lancamentosRaw, contatos, contas, categorias, centros] = await Promise.all([
    db.lancamentoFinanceiro.findMany({
      where: escopo,
      orderBy: { dataCompetencia: "desc" },
      take: 500,
      include: {
        contato:     { select: { nome: true, tipoPessoa: true, documento: true } },
        conta:       { select: { nome: true } },
        categoria:   { select: { nome: true, natureza: true } },
        centroCusto: { select: { nome: true } },
      },
    }),
    db.contatoFinanceiro.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.contaFinanceira.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.categoriaFinanceira.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true, natureza: true } }),
    db.centroCusto.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ])

  const lancamentos = lancamentosRaw.map(serializarLancamento)

  const btnBase = "flex items-center gap-2 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft size={22} className="text-brand-500" /> Lançamentos
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Movimentos de receita e despesa (PF/PJ)</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <LancamentoFormModal mode="create" tipoInicial="receita" contatos={contatos} contas={contas} categorias={categorias} centros={centros} trigger={
              <button className={`${btnBase} bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200`}><ArrowUpCircle size={16} /> Receita</button>
            } />
            <LancamentoFormModal mode="create" tipoInicial="despesa" contatos={contatos} contas={contas} categorias={categorias} centros={centros} trigger={
              <button className={`${btnBase} bg-red-500 hover:bg-red-600 shadow-red-200`}><ArrowDownCircle size={16} /> Despesa</button>
            } />
          </div>
        )}
      </div>

      <LancamentosTable
        lancamentos={lancamentos}
        contatos={contatos}
        contas={contas}
        categorias={categorias}
        centros={centros}
        isAdmin={isAdmin}
        canEdit={canEdit}
      />
    </div>
  )
}
