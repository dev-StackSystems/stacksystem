"use client"
import { useState } from "react"
import { Pencil, Trash2, Loader2, Search, Building2, User } from "lucide-react"
import { ContatoFormModal, ContatoData } from "@/components/forms/form-contato"
import { useRowAction } from "@/lib/hooks/use-row-action"
import { formatarDocumento } from "@/lib/financeiro"

interface Props {
  contatos: ContatoData[]
  isAdmin: boolean
  canEdit: boolean
}

const papelConfig: Record<string, { label: string; className: string }> = {
  cliente:    { label: "Cliente",    className: "bg-blue-50 text-blue-600 border border-blue-200" },
  fornecedor: { label: "Fornecedor", className: "bg-purple-50 text-purple-600 border border-purple-200" },
  ambos:      { label: "Cliente/Forn.", className: "bg-teal-50 text-teal-600 border border-teal-200" },
}

const FILTROS = ["todos", "PF", "PJ"] as const
type Filtro = typeof FILTROS[number]

export function ContatosTable({ contatos, isAdmin, canEdit }: Props) {
  const { loadingId, run } = useRowAction()
  const [search, setSearch] = useState("")
  const [filtro, setFiltro] = useState<Filtro>("todos")

  const excluir = (id: string) => {
    if (!confirm("Excluir este contato? Se houver lançamentos vinculados, ele será apenas desativado.")) return
    run(id, () => fetch(`/api/financeiro/contatos/${id}`, { method: "DELETE" }), { success: "Contato removido.", error: "Erro ao remover contato." })
  }

  const filtered = contatos.filter((c) => {
    const mf = filtro === "todos" || c.tipoPessoa === filtro
    const t = search.toLowerCase()
    const ms = !t || c.nome.toLowerCase().includes(t) || (c.documento ?? "").includes(t) || (c.email ?? "").toLowerCase().includes(t)
    return mf && ms
  })

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por nome, documento..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all" />
        </div>
        <div className="flex gap-1.5">
          {FILTROS.map((s) => (
            <button key={s} onClick={() => setFiltro(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${filtro === s ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
              {s === "todos" ? "Todos" : s === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center"><p className="text-slate-400 text-sm">Nenhum contato encontrado.</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Documento</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Relação</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Contato</th>
                <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => {
                const isLoading = loadingId === c.id
                const pInfo = papelConfig[c.papel] ?? { label: c.papel, className: "bg-slate-100 text-slate-500 border border-slate-200" }
                return (
                  <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${!c.ativo ? "opacity-50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.tipoPessoa === "PJ" ? "bg-purple-50 text-purple-500" : "bg-blue-50 text-blue-500"}`}>
                          {c.tipoPessoa === "PJ" ? <Building2 size={15} /> : <User size={15} />}
                        </span>
                        <span className="font-medium text-slate-700">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell font-mono text-xs text-slate-500">{formatarDocumento(c.tipoPessoa, c.documento) || "—"}</td>
                    <td className="px-6 py-4"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pInfo.className}`}>{pInfo.label}</span></td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-500">{c.email || c.telefone || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isLoading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : (
                          <>
                            {canEdit && (
                              <ContatoFormModal mode="edit" contato={c} trigger={
                                <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Pencil size={15} /></button>
                              } />
                            )}
                            {isAdmin && (
                              <button onClick={() => excluir(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={15} /></button>
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
        <p className="text-xs text-slate-400">{filtered.length} de {contatos.length} contato(s)</p>
      </div>
    </div>
  )
}
