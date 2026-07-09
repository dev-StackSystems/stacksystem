"use client"
import { Check, X, Loader2, ArrowDownCircle, Clock } from "lucide-react"
import { useRowAction } from "@/lib/hooks/use-row-action"

export interface AprovacaoItem {
  id: string
  descricao: string
  tipo: string
  valor: number | string
  dataVencimento?: string | null
  criadoEm: string
  contato?: { nome: string } | null
  categoria?: { nome: string } | null
}

const brl = (v: number | string) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const data = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—")

export function AprovacoesTable({ itens, podeAprovar }: { itens: AprovacaoItem[]; podeAprovar: boolean }) {
  const { loadingId, run } = useRowAction()

  const decidir = (id: string, aprovar: boolean) =>
    run(
      id,
      () => fetch(`/api/financeiro/lancamentos/${id}/aprovar`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aprovar }),
      }),
      aprovar
        ? { success: "Lançamento aprovado.", error: "Erro ao aprovar." }
        : { confirmar: "Reprovar este lançamento? Ele será cancelado.", confirmLabel: "Reprovar", perigo: true, success: "Lançamento reprovado.", error: "Erro ao reprovar." },
    )

  if (itens.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
        <Clock size={28} className="text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Nenhum lançamento pendente de aprovação. 🎉</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
      {itens.map((l) => {
        const isLoading = loadingId === l.id
        return (
          <div key={l.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0"><ArrowDownCircle size={18} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-700 truncate">{l.descricao}</p>
              <p className="text-xs text-slate-400 truncate">
                {l.contato?.nome ?? l.categoria?.nome ?? "—"} · vence {data(l.dataVencimento)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-serif text-lg font-bold text-red-500 valor-sensivel">{brl(l.valor)}</p>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Aguardando aprovação</span>
            </div>
            {podeAprovar && (
              <div className="flex items-center gap-2 w-24 justify-end shrink-0">
                {isLoading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : (
                  <>
                    <button onClick={() => decidir(l.id, false)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all" title="Reprovar"><X size={16} /></button>
                    <button onClick={() => decidir(l.id, true)} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all" title="Aprovar"><Check size={16} /></button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
