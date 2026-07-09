"use client"
import { Pencil, Trash2, Loader2, Target } from "lucide-react"
import { OrcamentoFormModal, OrcamentoData } from "@/components/forms/form-orcamento"
import type { OpcaoSimples, OpcaoCategoria } from "@/components/forms/form-lancamento"
import { useRowAction } from "@/lib/hooks/use-row-action"
import { MESES } from "@/types/system"

interface Props {
  orcamentos: OrcamentoData[]
  categorias: OpcaoCategoria[]
  centros: OpcaoSimples[]
  ano: number
  canEdit: boolean
  isAdmin: boolean
}

const brl = (v: number | string) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function OrcamentosTable({ orcamentos, categorias, centros, ano, canEdit, isAdmin }: Props) {
  const { loadingId, run } = useRowAction()

  const excluir = (id: string) =>
    run(id, () => fetch(`/api/financeiro/orcamentos/${id}`, { method: "DELETE" }), { confirmar: "Excluir este orçamento?", perigo: true, success: "Orçamento removido.", error: "Erro ao remover." })

  if (orcamentos.length === 0) {
    return <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center"><p className="text-slate-400 text-sm">Nenhum orçamento definido para {ano}.</p></div>
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
      {orcamentos.map((o) => {
        const orcado = Number(o.valor)
        const realizado = o.realizado ?? 0
        const pct = orcado > 0 ? Math.round((realizado / orcado) * 100) : 0
        const barra = pct > 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"
        const nome = o.categoria?.nome ?? o.centroCusto?.nome ?? "Geral"
        const periodo = o.mes === 0 ? `${o.ano}` : `${MESES[o.mes - 1]}/${o.ano}`
        const complemento = o.categoria && o.centroCusto ? ` · ${o.centroCusto.nome}` : ""
        const isLoading = loadingId === o.id
        return (
          <div key={o.id} className="px-6 py-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${o.categoria?.cor ?? "#94a3b8"}22`, color: o.categoria?.cor ?? "#64748b" }}>
                <Target size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700">{nome}{complemento}</p>
                <p className="text-xs text-slate-400">{periodo}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-800">{brl(realizado)} <span className="text-slate-400 font-normal">/ {brl(orcado)}</span></p>
                <p className={`text-xs font-semibold ${pct > 100 ? "text-red-500" : pct >= 80 ? "text-amber-600" : "text-emerald-600"}`}>{pct}% usado</p>
              </div>
              <div className="flex items-center gap-1 w-16 justify-end">
                {isLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : (
                  <>
                    {canEdit && (
                      <OrcamentoFormModal mode="edit" orcamento={o} categorias={categorias} centros={centros} anoPadrao={ano} trigger={
                        <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Pencil size={14} /></button>
                      } />
                    )}
                    {(isAdmin || canEdit) && (
                      <button onClick={() => excluir(o.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={14} /></button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${barra}`} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
