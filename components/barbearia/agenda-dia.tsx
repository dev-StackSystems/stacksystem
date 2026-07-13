"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, ChevronRight, Plus, Loader2, Check, RotateCcw, Pencil, Trash2, X, CalendarDays,
} from "lucide-react"
import {
  AgendamentoFormModal, OpcaoBarbeiro, OpcaoServico, OpcaoCliente,
} from "@/components/forms/form-agendamento"
import { useRowAction } from "@/lib/hooks/use-row-action"
import { metaStatusAgendamento, brlBarbearia } from "@/lib/barbearia"

export interface AgendamentoLinha {
  id: string
  dataHora: string
  duracaoMin: number
  preco: number
  status: string
  observacao?: string | null
  barbeiroId: string
  servicoId: string
  clienteId?: string | null
  clienteAvulso?: string | null
  barbeiro?: { nome: string; apelido?: string | null; cor: string } | null
  servico?: { nome: string; cor?: string | null } | null
  cliente?: { nome: string; telefone?: string | null } | null
}

interface Props {
  dia: string            // AAAA-MM-DD
  diaLabel: string
  agendamentos: AgendamentoLinha[]
  barbeiros: OpcaoBarbeiro[]
  servicos: OpcaoServico[]
  clientes: OpcaoCliente[]
  canEdit: boolean
}

const hhmm = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0"); return `${p(d.getHours())}:${p(d.getMinutes())}` }
const fmt = (d: Date) => { const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

export function AgendaDia({ dia, diaLabel, agendamentos, barbeiros, servicos, clientes, canEdit }: Props) {
  const router = useRouter()
  const { loadingId, run } = useRowAction()
  const [filtroBarbeiro, setFiltroBarbeiro] = useState<string>("todos")

  const irPara = (novaData: string) => router.push(`/painel/barbeiro/agenda?data=${novaData}`)
  const deslocar = (dias: number) => { const [y, m, d] = dia.split("-").map(Number); irPara(fmt(new Date(y, m - 1, d + dias))) }

  const mudarStatus = (a: AgendamentoLinha, status: string, opts: { confirmar?: string; success: string; perigo?: boolean }) =>
    run(a.id, () => fetch(`/api/barbearia/agendamentos/${a.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    }), { confirmar: opts.confirmar, perigo: opts.perigo, success: opts.success, error: "Não foi possível atualizar." })

  const excluir = (a: AgendamentoLinha) =>
    run(a.id, () => fetch(`/api/barbearia/agendamentos/${a.id}`, { method: "DELETE" }),
      { confirmar: "Excluir este agendamento?", perigo: true, success: "Agendamento excluído.", error: "Erro ao excluir." })

  const filtrados = agendamentos.filter((a) => filtroBarbeiro === "todos" || a.barbeiroId === filtroBarbeiro)
  const receitaDia = agendamentos.filter((a) => a.status === "concluido").reduce((s, a) => s + a.preco, 0)

  const botaoNovo = (
    <AgendamentoFormModal mode="create" barbeiros={barbeiros} servicos={servicos} clientes={clientes} dataPadrao={dia}
      trigger={
        <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-brand-200">
          <Plus size={16} /> Novo Agendamento
        </button>
      } />
  )

  return (
    <div className="space-y-4">
      {/* Barra de data */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-3 flex flex-wrap items-center gap-2">
        <button onClick={() => deslocar(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Dia anterior"><ChevronLeft size={18} /></button>
        <div className="relative flex items-center">
          <CalendarDays size={15} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <input type="date" value={dia} onChange={(e) => e.target.value && irPara(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-sm outline-none focus:border-brand-400" />
        </div>
        <button onClick={() => deslocar(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Próximo dia"><ChevronRight size={18} /></button>
        <button onClick={() => irPara(fmt(new Date()))} className="text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50">Hoje</button>
        <span className="text-sm text-slate-500 capitalize ml-1 hidden sm:inline">{diaLabel}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400">Receita do dia: <strong className="text-emerald-600 valor-sensivel">{brlBarbearia(receitaDia)}</strong></span>
          {canEdit && botaoNovo}
        </div>
      </div>

      {/* Filtro por profissional */}
      {barbeiros.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFiltroBarbeiro("todos")} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${filtroBarbeiro === "todos" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>Todos</button>
          {barbeiros.map((b) => (
            <button key={b.id} onClick={() => setFiltroBarbeiro(b.id)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${filtroBarbeiro === b.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              <span className="w-2 h-2 rounded-full" style={{ background: barbeirosCor(b.id, agendamentos) }} /> {b.apelido || b.nome}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-3"><CalendarDays size={22} className="text-brand-500" /></div>
            <p className="text-slate-500 text-sm font-medium">Nenhum agendamento neste dia.</p>
            {canEdit && <p className="text-slate-400 text-xs mt-1">Toque em “Novo Agendamento” para marcar um horário.</p>}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtrados.map((a) => {
              const isLoading = loadingId === a.id
              const st = metaStatusAgendamento(a.status)
              const nomeCli = a.cliente?.nome ?? a.clienteAvulso ?? "Sem cliente"
              return (
                <div key={a.id} className="flex items-center gap-3 px-3 sm:px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="text-center shrink-0 w-12">
                    <p className="font-mono font-bold text-slate-800 text-sm">{hhmm(a.dataHora)}</p>
                    <p className="text-[10px] text-slate-400">{a.duracaoMin}min</p>
                  </div>
                  <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: a.barbeiro?.cor ?? "#c9a84c" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{a.servico?.nome ?? "Serviço"} <span className="text-slate-400 font-normal">· {nomeCli}</span></p>
                    <p className="text-xs text-slate-400 truncate">{a.barbeiro?.apelido || a.barbeiro?.nome} · <span className="valor-sensivel">{brlBarbearia(a.preco)}</span></p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 hidden sm:inline ${st.cor}`}>{st.label}</span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {isLoading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : canEdit && (
                      <>
                        {a.status !== "concluido" && a.status !== "cancelado" && (
                          <button onClick={() => mudarStatus(a, "concluido", { success: "Atendimento concluído! Receita registrada no Financeiro." })}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Concluir"><Check size={15} /></button>
                        )}
                        {a.status === "concluido" && (
                          <button onClick={() => mudarStatus(a, "agendado", { confirmar: "Reabrir este atendimento? A receita gerada será removida do Financeiro.", perigo: true, success: "Atendimento reaberto." })}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Reabrir"><RotateCcw size={14} /></button>
                        )}
                        {a.status !== "cancelado" && a.status !== "concluido" && (
                          <button onClick={() => mudarStatus(a, "cancelado", { confirmar: "Cancelar este agendamento?", perigo: true, success: "Agendamento cancelado." })}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Cancelar"><X size={15} /></button>
                        )}
                        <AgendamentoFormModal mode="edit" agendamento={a} barbeiros={barbeiros} servicos={servicos} clientes={clientes}
                          trigger={<button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar"><Pencil size={14} /></button>} />
                        <button onClick={() => excluir(a)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// cor do profissional a partir de um agendamento existente (ou default)
function barbeirosCor(id: string, ags: AgendamentoLinha[]): string {
  return ags.find((a) => a.barbeiroId === id)?.barbeiro?.cor ?? "#c9a84c"
}
