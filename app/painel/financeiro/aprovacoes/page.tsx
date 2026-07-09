import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { AprovacoesTable } from "@/components/tables/tabela-aprovacoes"
import { CheckCircle2 } from "lucide-react"

export default async function AprovacoesPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const escopo = superAdmin ? {} : { empresaId }
  const podeAprovar = superAdmin || session.user.papel === PapelUsuario.A || session.user.grupoIsAdmin

  const raw = await db.lancamentoFinanceiro.findMany({
    where: { ...escopo, aprovacao: "pendente" },
    orderBy: { criadoEm: "desc" },
    include: { contato: { select: { nome: true } }, categoria: { select: { nome: true } } },
  })

  const itens = raw.map((l) => ({
    id: l.id,
    descricao: l.descricao,
    tipo: l.tipo,
    valor: l.valor.toString(),
    dataVencimento: l.dataVencimento ? l.dataVencimento.toISOString() : null,
    criadoEm: l.criadoEm.toISOString(),
    contato: l.contato,
    categoria: l.categoria,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle2 size={22} className="text-brand-500" /> Aprovações
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Despesas acima do limite aguardando aprovação para liquidação
          {!podeAprovar && " — apenas visualização"}
        </p>
      </div>

      <AprovacoesTable itens={itens} podeAprovar={podeAprovar} />
    </div>
  )
}
