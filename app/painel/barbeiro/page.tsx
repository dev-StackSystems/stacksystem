import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PapelUsuario } from "@prisma/client"
import { Scissors, CalendarDays, CheckCircle2, Wallet, Clock, ArrowRight, Plus, UserCog, Tags } from "lucide-react"
import { AgendamentoFormModal } from "@/components/forms/form-agendamento"
import { metaStatusAgendamento, brlBarbearia } from "@/lib/barbearia"

const hhmm = (d: Date) => { const p = (n: number) => String(n).padStart(2, "0"); return `${p(d.getHours())}:${p(d.getMinutes())}` }

export default async function PainelBarbeariaPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T || session.user.grupoIsAdmin
  const escopo = superAdmin ? {} : { empresaId }
  const escopoAtivo = superAdmin ? { ativo: true } : { empresaId, ativo: true }

  const agora = new Date()
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0)
  const fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59)

  const [agsRaw, barbeirosOpt, servicosRaw, clientesOpt, nBarbeiros, nServicos] = await Promise.all([
    db.agendamento.findMany({
      where: { ...escopo, dataHora: { gte: inicio, lte: fim } },
      orderBy: { dataHora: "asc" },
      include: { barbeiro: { select: { nome: true, apelido: true, cor: true } }, servico: { select: { nome: true } }, cliente: { select: { nome: true } } },
    }),
    db.barbeiro.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true, apelido: true } }),
    db.servicoBarbearia.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true, duracaoMin: true, preco: true } }),
    db.clienteBarbearia.findMany({ where: escopoAtivo, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.barbeiro.count({ where: escopoAtivo }),
    db.servicoBarbearia.count({ where: escopoAtivo }),
  ])

  const servicos = servicosRaw.map((s) => ({ ...s, preco: Number(s.preco) }))
  const concluidos = agsRaw.filter((a) => a.status === "concluido")
  const receitaDia = concluidos.reduce((s, a) => s + Number(a.preco), 0)
  const proximo = agsRaw.find((a) => a.status === "agendado" && a.dataHora >= agora)

  const kpis = [
    { label: "Agendamentos hoje", value: String(agsRaw.length), icon: CalendarDays, color: "bg-brand-50 text-brand-600 border-brand-100", sensivel: false },
    { label: "Concluídos", value: String(concluidos.length), icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-100", sensivel: false },
    { label: "Receita do dia", value: brlBarbearia(receitaDia), icon: Wallet, color: "bg-emerald-50 text-emerald-600 border-emerald-100", sensivel: true },
    { label: "Próximo horário", value: proximo ? hhmm(proximo.dataHora) : "—", icon: Clock, color: "bg-blue-50 text-blue-600 border-blue-100", sensivel: false },
  ]

  const precisaConfig = canEdit && (nBarbeiros === 0 || nServicos === 0)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scissors size={22} className="text-brand-500" /> Barbearia
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Resumo do dia e agenda</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && barbeirosOpt.length > 0 && servicos.length > 0 && (
            <AgendamentoFormModal mode="create" barbeiros={barbeirosOpt} servicos={servicos} clientes={clientesOpt} dataPadrao={new Date().toISOString().slice(0, 10)}
              trigger={<button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200"><Plus size={16} /> Novo Agendamento</button>} />
          )}
          <Link href="/painel/barbeiro/agenda" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all">Ver Agenda <ArrowRight size={16} /></Link>
        </div>
      </div>

      {/* Onboarding — primeiro uso */}
      {precisaConfig && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-amber-800 flex-1">
            Para começar, cadastre {nServicos === 0 && <strong>seus serviços</strong>}{nServicos === 0 && nBarbeiros === 0 && " e "}{nBarbeiros === 0 && <strong>sua equipe</strong>}. Depois é só agendar.
          </p>
          <div className="flex gap-2">
            {nServicos === 0 && <Link href="/painel/barbeiro/servicos" className="flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 font-semibold px-3 py-2 rounded-lg text-xs"><Tags size={14} /> Serviços</Link>}
            {nBarbeiros === 0 && <Link href="/painel/barbeiro/equipe" className="flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 font-semibold px-3 py-2 rounded-lg text-xs"><UserCog size={14} /> Equipe</Link>}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{k.label}</span>
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${k.color}`}><Icon size={16} /></div>
              </div>
              <div className={`${k.sensivel ? "valor-sensivel" : ""} font-serif text-lg font-bold text-slate-900 truncate`}>{k.value}</div>
            </div>
          )
        })}
      </div>

      {/* Agendamentos de hoje */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2"><CalendarDays size={18} className="text-brand-500" /> Hoje</h2>
          <Link href="/painel/barbeiro/agenda" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Abrir agenda</Link>
        </div>
        {agsRaw.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">Nenhum agendamento para hoje. 💈</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {agsRaw.map((a) => {
              const st = metaStatusAgendamento(a.status)
              const nomeCli = a.cliente?.nome ?? a.clienteAvulso ?? "Sem cliente"
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                  <span className="font-mono font-bold text-slate-700 text-sm w-12 text-center shrink-0">{hhmm(a.dataHora)}</span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.barbeiro?.cor ?? "#c9a84c" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 truncate text-sm">{a.servico?.nome} · {nomeCli}</p>
                    <p className="text-xs text-slate-400 truncate">{a.barbeiro?.apelido || a.barbeiro?.nome}</p>
                  </div>
                  <span className="valor-sensivel text-sm font-semibold text-slate-700 hidden sm:inline">{brlBarbearia(Number(a.preco))}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${st.cor}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
