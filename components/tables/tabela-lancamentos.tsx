"use client"
import { useState } from "react"
import { Pencil, Trash2, Loader2, Search, ArrowUpCircle, ArrowDownCircle, Repeat } from "lucide-react"
import {
  LancamentoFormModal, LancamentoData, OpcaoSimples, OpcaoCategoria,
} from "@/components/forms/form-lancamento"
import { useRowAction } from "@/lib/hooks/use-row-action"
import { useConfirm } from "@/components/layout/provedor-confirmacao"

interface Props {
  lancamentos: LancamentoData[]
  contatos: OpcaoSimples[]
  contas: OpcaoSimples[]
  categorias: OpcaoCategoria[]
  centros: OpcaoSimples[]
  isAdmin: boolean
  canEdit: boolean
}

const brl = (v: number | string) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const data = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—")

const statusConfig: Record<string, { label: string; className: string }> = {
  pago:      { label: "Pago",      className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  pendente:  { label: "Pendente",  className: "bg-amber-50 text-amber-600 border border-amber-200" },
  cancelado: { label: "Cancelado", className: "bg-slate-100 text-slate-500 border border-slate-200" },
}

const FILTROS_TIPO = ["todos", "receita", "despesa"] as const
const FILTROS_STATUS = ["todos", "pendente", "pago", "cancelado"] as const
type FiltroTipo = typeof FILTROS_TIPO[number]
type FiltroStatus = typeof FILTROS_STATUS[number]

export function LancamentosTable({ lancamentos, contatos, contas, categorias, centros, isAdmin, canEdit }: Props) {
  const { loadingId, run } = useRowAction()
  const confirmar = useConfirm()
  const [search, setSearch] = useState("")
  const [fTipo, setFTipo] = useState<FiltroTipo>("todos")
  const [fStatus, setFStatus] = useState<FiltroStatus>("todos")

  const excluir = async (l: LancamentoData) => {
    let escopo = ""
    if (l.grupoRecorrenciaId) {
      const serie = await confirmar({
        titulo: "Excluir série",
        mensagem: "Este lançamento faz parte de uma série (recorrência/parcelas). Deseja excluir TODA a série?",
        confirmar: "Excluir toda a série",
        cancelar: "Escolher só este",
        perigo: true,
      })
      if (serie) escopo = "?escopo=serie"
      else if (!(await confirmar({ mensagem: "Excluir apenas este lançamento?", confirmar: "Excluir este", perigo: true }))) return
    } else if (!(await confirmar({ mensagem: "Excluir este lançamento?", perigo: true }))) return
    run(l.id, () => fetch(`/api/financeiro/lancamentos/${l.id}${escopo}`, { method: "DELETE" }), { success: "Lançamento excluído.", error: "Erro ao excluir." })
  }

  const marcarPago = (l: LancamentoData) => {
    run(l.id, () => fetch(`/api/financeiro/lancamentos/${l.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pago", dataPagamento: new Date().toISOString().slice(0, 10) }),
    }), { success: "Marcado como pago.", error: "Erro ao atualizar." })
  }

  const hoje = new Date()
  const filtered = lancamentos.filter((l) => {
    const mt = fTipo === "todos" || l.tipo === fTipo
    const ms = fStatus === "todos" || l.status === fStatus
    const t = search.toLowerCase()
    const mq = !t || l.descricao.toLowerCase().includes(t) || (l.contato?.nome ?? "").toLowerCase().includes(t) || (l.categoria?.nome ?? "").toLowerCase().includes(t)
    return mt && ms && mq
  })

  const atrasado = (l: LancamentoData) => l.status === "pendente" && l.dataVencimento && new Date(l.dataVencimento) < hoje

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 lg:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por descrição, contato..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS_TIPO.map((s) => (
            <button key={s} onClick={() => setFTipo(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${fTipo === s ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{s}</button>
          ))}
          <span className="w-px bg-slate-200 mx-1" />
          {FILTROS_STATUS.map((s) => (
            <button key={s} onClick={() => setFStatus(s)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${fStatus === s ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center"><p className="text-slate-400 text-sm">Nenhum lançamento encontrado.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Contato</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Categoria</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Vencimento</th>
                <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((l) => {
                const isLoading = loadingId === l.id
                const receita = l.tipo === "receita"
                const st = statusConfig[l.status] ?? { label: l.status, className: "bg-slate-100 text-slate-500 border border-slate-200" }
                const late = atrasado(l)
                return (
                  <tr key={l.id} className={`hover:bg-slate-50/50 transition-colors ${late ? "bg-red-50/30" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {receita ? <ArrowUpCircle size={15} className="text-emerald-500 shrink-0" /> : <ArrowDownCircle size={15} className="text-red-500 shrink-0" />}
                        <span className="font-medium text-slate-700">{l.descricao}</span>
                        {l.parcelaTotal && l.parcelaTotal > 1 && (
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Repeat size={9} />{l.parcelaNum}/{l.parcelaTotal}</span>
                        )}
                        {late && <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Atrasado</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-500">{l.contato?.nome ?? "—"}</td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-500">{l.categoria?.nome ?? "—"}</td>
                    <td className="px-6 py-4 hidden lg:table-cell"><span className={late ? "text-red-500 font-medium" : "text-slate-500"}>{data(l.dataVencimento)}</span></td>
                    <td className={`px-6 py-4 text-right font-semibold ${receita ? "text-emerald-600" : "text-red-500"}`}>{receita ? "+" : "−"} {brl(l.valor)}</td>
                    <td className="px-6 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.className}`}>{st.label}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {isLoading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : (
                          <>
                            {canEdit && l.status !== "pago" && (
                              <button onClick={() => marcarPago(l)} className="text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-all" title="Marcar como pago">Pagar</button>
                            )}
                            {canEdit && (
                              <LancamentoFormModal mode="edit" lancamento={l} contatos={contatos} contas={contas} categorias={categorias} centros={centros} trigger={
                                <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Pencil size={15} /></button>
                              } />
                            )}
                            {(isAdmin || canEdit) && (
                              <button onClick={() => excluir(l)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={15} /></button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400">{filtered.length} de {lancamentos.length} lançamento(s)</p>
      </div>
    </div>
  )
}
