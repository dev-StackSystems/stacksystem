"use client"
import { useState } from "react"
import { Pencil, Trash2, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { CategoriaFormModal, CategoriaData } from "@/components/forms/form-categoria"
import { metaClasse } from "@/lib/financeiro"
import { useRowAction } from "@/lib/hooks/use-row-action"

interface Props { categorias: CategoriaData[]; isAdmin: boolean; canEdit: boolean }

const FILTROS = ["todas", "receita", "despesa"] as const
type Filtro = typeof FILTROS[number]

export function CategoriasTable({ categorias, isAdmin, canEdit }: Props) {
  const { loadingId, run } = useRowAction()
  const [filtro, setFiltro] = useState<Filtro>("todas")

  const excluir = (id: string) =>
    run(id, () => fetch(`/api/financeiro/categorias/${id}`, { method: "DELETE" }), { confirmar: "Excluir esta categoria? Se houver lançamentos vinculados, ela será apenas desativada.", perigo: true, success: "Categoria removida.", error: "Erro ao remover categoria." })

  const filtered = categorias.filter((c) => filtro === "todas" || c.natureza === filtro)

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex gap-1.5">
        {FILTROS.map((s) => (
          <button key={s} onClick={() => setFiltro(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all capitalize ${filtro === s ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {s === "todas" ? "Todas" : s === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center"><p className="text-slate-400 text-sm">Nenhuma categoria cadastrada.</p></div>
      ) : (
        <div className="divide-y divide-slate-50">
          {filtered.map((c) => {
            const isLoading = loadingId === c.id
            const receita = c.natureza === "receita"
            return (
              <div key={c.id} className={`flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50/50 transition-colors ${!c.ativo ? "opacity-50" : ""}`}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.cor ?? "#94a3b8" }} />
                <span className="font-medium text-slate-700 flex-1">{c.nome}</span>
                {!receita && (() => {
                  const m = metaClasse(c.classe)
                  return (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1"
                      style={{ color: m.cor, borderColor: `${m.cor}44`, background: `${m.cor}14` }} title={m.hint}>
                      {m.emoji} {m.label}
                    </span>
                  )
                })()}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${receita ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
                  {receita ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                  {receita ? "Receita" : "Despesa"}
                </span>
                <div className="flex items-center gap-1 w-16 justify-end">
                  {isLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : (
                    <>
                      {canEdit && (
                        <CategoriaFormModal mode="edit" categoria={c} trigger={
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
      )}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400">{filtered.length} categoria(s)</p>
      </div>
    </div>
  )
}
