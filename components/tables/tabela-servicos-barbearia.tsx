"use client"
import { useState } from "react"
import { Pencil, Trash2, Loader2, Search, Clock, Scissors } from "lucide-react"
import { ServicoFormModal, ServicoData } from "@/components/forms/form-servico-barbearia"
import { useRowAction } from "@/lib/hooks/use-row-action"
import { brlBarbearia } from "@/lib/barbearia"

interface Props { servicos: ServicoData[]; isAdmin: boolean; canEdit: boolean }

export function ServicosTable({ servicos, isAdmin, canEdit }: Props) {
  const { loadingId, run } = useRowAction()
  const [busca, setBusca] = useState("")

  const excluir = (s: ServicoData) =>
    run(s.id, () => fetch(`/api/barbearia/servicos/${s.id}`, { method: "DELETE" }), { confirmar: `Excluir o serviço "${s.nome}"? Se houver agendamentos, ele será apenas desativado.`, perigo: true, success: "Serviço removido.", error: "Erro ao remover." })

  const filtrados = servicos.filter((s) => s.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar serviço..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400" />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-3"><Scissors size={22} className="text-brand-500" /></div>
          <p className="text-slate-500 text-sm font-medium">{busca ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado ainda."}</p>
          {!busca && <p className="text-slate-400 text-xs mt-1">Toque em “Novo Serviço” para começar.</p>}
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {filtrados.map((s) => {
            const isLoading = loadingId === s.id
            return (
              <div key={s.id} className={`flex items-center gap-3 px-4 sm:px-6 py-3.5 hover:bg-slate-50/50 transition-colors ${!s.ativo ? "opacity-50" : ""}`}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.cor ?? "#c9a84c" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 truncate">{s.nome}{!s.ativo && <span className="text-xs text-slate-400 font-normal"> · inativo</span>}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} /> {s.duracaoMin} min</p>
                </div>
                <span className="font-serif font-bold text-slate-800 valor-sensivel whitespace-nowrap">{brlBarbearia(Number(s.preco))}</span>
                <div className="flex items-center gap-1 w-16 justify-end">
                  {isLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : (
                    <>
                      {canEdit && <ServicoFormModal mode="edit" servico={s} trigger={<button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar"><Pencil size={14} /></button>} />}
                      {isAdmin && <button onClick={() => excluir(s)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={14} /></button>}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50"><p className="text-xs text-slate-400">{filtrados.length} serviço(s)</p></div>
    </div>
  )
}
