"use client"
import { Pencil, Trash2, Loader2, Target } from "lucide-react"
import { CentroCustoFormModal, CentroCustoData } from "@/components/forms/form-centro-custo"
import { useRowAction } from "@/lib/hooks/use-row-action"

interface Props { centros: CentroCustoData[]; isAdmin: boolean; canEdit: boolean }

export function CentrosTable({ centros, isAdmin, canEdit }: Props) {
  const { loadingId, run } = useRowAction()

  const excluir = (id: string) =>
    run(id, () => fetch(`/api/financeiro/centros-custo/${id}`, { method: "DELETE" }), { confirmar: "Excluir este centro de custo? Se houver lançamentos vinculados, ele será apenas desativado.", perigo: true, success: "Centro de custo removido.", error: "Erro ao remover." })

  if (centros.length === 0) {
    return <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center"><p className="text-slate-400 text-sm">Nenhum centro de custo cadastrado.</p></div>
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-50">
      {centros.map((c) => {
        const isLoading = loadingId === c.id
        return (
          <div key={c.id} className={`flex items-center gap-3 px-6 py-4 hover:bg-slate-50/50 transition-colors ${!c.ativo ? "opacity-50" : ""}`}>
            <span className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center shrink-0"><Target size={16} /></span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-700">{c.nome}</p>
              {c.descricao && <p className="text-xs text-slate-400 truncate">{c.descricao}</p>}
            </div>
            <span className="text-xs text-slate-400 hidden sm:block">{c._count?.lancamentos ?? 0} lançamento(s)</span>
            <div className="flex items-center gap-1 w-16 justify-end">
              {isLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : (
                <>
                  {canEdit && (
                    <CentroCustoFormModal mode="edit" centro={c} trigger={
                      <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Pencil size={14} /></button>
                    } />
                  )}
                  {isAdmin && (
                    <button onClick={() => excluir(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={14} /></button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
