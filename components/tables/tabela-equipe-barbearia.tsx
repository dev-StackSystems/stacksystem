"use client"
import { Pencil, Trash2, Loader2, Phone, UserCog } from "lucide-react"
import { BarbeiroFormModal, BarbeiroData } from "@/components/forms/form-barbeiro"
import { useRowAction } from "@/lib/hooks/use-row-action"

interface Props { barbeiros: BarbeiroData[]; isAdmin: boolean; canEdit: boolean }

const inicial = (nome: string) => nome.trim().charAt(0).toUpperCase() || "?"

export function EquipeTable({ barbeiros, isAdmin, canEdit }: Props) {
  const { loadingId, run } = useRowAction()

  const excluir = (b: BarbeiroData) =>
    run(b.id, () => fetch(`/api/barbearia/equipe/${b.id}`, { method: "DELETE" }), { confirmar: `Remover "${b.nome}" da equipe? Se houver agendamentos, ele será apenas desativado.`, perigo: true, success: "Profissional removido.", error: "Erro ao remover." })

  if (barbeiros.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-3"><UserCog size={22} className="text-brand-500" /></div>
        <p className="text-slate-500 text-sm font-medium">Nenhum profissional cadastrado ainda.</p>
        <p className="text-slate-400 text-xs mt-1">Toque em “Novo Profissional” para montar sua equipe.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {barbeiros.map((b) => {
        const isLoading = loadingId === b.id
        return (
          <div key={b.id} className={`bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex items-center gap-3 ${!b.ativo ? "opacity-50" : ""}`}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: b.cor }}>{inicial(b.nome)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{b.nome}{b.apelido ? <span className="text-slate-400 font-normal"> · {b.apelido}</span> : null}</p>
              {b.telefone
                ? <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={11} /> {b.telefone}</p>
                : <p className="text-xs text-slate-300">sem telefone</p>}
              {!b.ativo && <span className="text-[10px] font-bold text-slate-400 uppercase">inativo</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : (
                <>
                  {canEdit && <BarbeiroFormModal mode="edit" barbeiro={b} trigger={<button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar"><Pencil size={14} /></button>} />}
                  {isAdmin && <button onClick={() => excluir(b)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={14} /></button>}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
