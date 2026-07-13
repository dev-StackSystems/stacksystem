import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { CalendarDays } from "lucide-react"
import { AgendaDia } from "@/components/barbearia/agenda-dia"

const fmt = (d: Date) => { const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  const escopo = superAdmin ? {} : { empresaId }
  const escopoAtivo = superAdmin ? { ativo: true } : { empresaId, ativo: true }

  const sp = await searchParams
  const base = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : fmt(new Date())
  const [y, m, d] = base.split("-").map(Number)
  const inicio = new Date(y, m - 1, d, 0, 0, 0)
  const fim = new Date(y, m - 1, d, 23, 59, 59)
  const diaLabel = inicio.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })

  const [agsRaw, barbeiros, servicosRaw, clientes] = await Promise.all([
    db.agendamento.findMany({
      where: { ...escopo, dataHora: { gte: inicio, lte: fim } },
      orderBy: { dataHora: "asc" },
      include: {
        barbeiro: { select: { nome: true, apelido: true, cor: true } },
        servico:  { select: { nome: true, cor: true } },
        cliente:  { select: { nome: true, telefone: true } },
      },
    }),
    db.barbeiro.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true, apelido: true } }),
    db.servicoBarbearia.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true, duracaoMin: true, preco: true } }),
    db.clienteBarbearia.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ])

  const agendamentos = agsRaw.map((a) => ({ ...a, preco: Number(a.preco), dataHora: a.dataHora.toISOString() }))
  const servicos = servicosRaw.map((s) => ({ ...s, preco: Number(s.preco) }))

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays size={22} className="text-brand-500" /> Agenda
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Agendamentos do dia — conclua para lançar a receita no Financeiro</p>
      </div>

      <AgendaDia dia={base} diaLabel={diaLabel} agendamentos={agendamentos} barbeiros={barbeiros} servicos={servicos} clientes={clientes} canEdit={canEdit} />
    </div>
  )
}
