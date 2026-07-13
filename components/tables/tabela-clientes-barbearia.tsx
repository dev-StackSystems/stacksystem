"use client"
import { useState } from "react"
import { Pencil, Trash2, Loader2, Search, Phone, User, Mail } from "lucide-react"
import { ClienteBarbeariaFormModal, ClienteBarbeariaData } from "@/components/forms/form-cliente-barbearia"
import { useRowAction } from "@/lib/hooks/use-row-action"

interface Props { clientes: ClienteBarbeariaData[]; isAdmin: boolean; canEdit: boolean }

const inicial = (nome: string) => nome.trim().charAt(0).toUpperCase() || "?"

export function ClientesBarbeariaTable({ clientes, isAdmin, canEdit }: Props) {
  const { loadingId, run } = useRowAction()
  const [busca, setBusca] = useState("")

  const excluir = (c: ClienteBarbeariaData) =>
    run(c.id, () => fetch(`/api/barbearia/clientes/${c.id}`, { method: "DELETE" }), { confirmar: `Excluir o cliente "${c.nome}"? Se houver agendamentos, ele será apenas desativado.`, perigo: true, success: "Cliente removido.", error: "Erro ao remover." })

  const q = busca.toLowerCase()
  const filtrados = clientes.filter((c) => c.nome.toLowerCase().includes(q) || (c.telefone ?? "").includes(busca))

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400" />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-3"><User size={22} className="text-brand-500" /></div>
          <p className="text-slate-500 text-sm font-medium">{busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</p>
          {!busca && <p className="text-slate-400 text-xs mt-1">Toque em “Novo Cliente” para começar sua carteira.</p>}
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {filtrados.map((c) => {
            const isLoading = loadingId === c.id
            const visitas = c._count?.agendamentos ?? 0
            return (
              <div key={c.id} className={`flex items-center gap-3 px-4 sm:px-6 py-3.5 hover:bg-slate-50/50 transition-colors ${!c.ativo ? "opacity-50" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0">{inicial(c.nome)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 truncate">{c.nome}{!c.ativo && <span className="text-xs text-slate-400 font-normal"> · inativo</span>}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                    {c.telefone && <span className="flex items-center gap-1"><Phone size={10} /> {c.telefone}</span>}
                    {c.email && <span className="hidden sm:flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                  </div>
                </div>
                {visitas > 0 && <span className="hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 whitespace-nowrap">{visitas} visita{visitas !== 1 ? "s" : ""}</span>}
                <div className="flex items-center gap-1 w-16 justify-end">
                  {isLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : (
                    <>
                      {canEdit && <ClienteBarbeariaFormModal mode="edit" cliente={c} trigger={<button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar"><Pencil size={14} /></button>} />}
                      {isAdmin && <button onClick={() => excluir(c)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={14} /></button>}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50"><p className="text-xs text-slate-400">{filtrados.length} cliente(s)</p></div>
    </div>
  )
}
