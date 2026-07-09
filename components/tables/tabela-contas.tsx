"use client"
import { Pencil, Trash2, Loader2, Wallet, Landmark, CreditCard } from "lucide-react"
import { ContaFormModal, ContaData } from "@/components/forms/form-conta"
import { useRowAction } from "@/lib/hooks/use-row-action"

export interface ContaComSaldo extends ContaData {
  saldoAtual: number
}

interface Props { contas: ContaComSaldo[]; isAdmin: boolean; canEdit: boolean }

const brl = (v: number | string) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const tipoConfig: Record<string, { label: string; icon: typeof Wallet; className: string }> = {
  caixa:    { label: "Caixa",    icon: Wallet,     className: "bg-emerald-50 text-emerald-500" },
  banco:    { label: "Banco",    icon: Landmark,   className: "bg-blue-50 text-blue-500" },
  carteira: { label: "Carteira", icon: CreditCard, className: "bg-purple-50 text-purple-500" },
}

export function ContasTable({ contas, isAdmin, canEdit }: Props) {
  const { loadingId, run } = useRowAction()

  const excluir = (id: string) => {
    if (!confirm("Excluir esta conta? Se houver lançamentos vinculados, ela será apenas desativada.")) return
    run(id, () => fetch(`/api/financeiro/contas/${id}`, { method: "DELETE" }), { success: "Conta removida.", error: "Erro ao remover conta." })
  }

  if (contas.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center">
        <p className="text-slate-400 text-sm">Nenhuma conta cadastrada.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {contas.map((c) => {
        const info = tipoConfig[c.tipo] ?? tipoConfig.banco
        const Icon = info.icon
        const isLoading = loadingId === c.id
        return (
          <div key={c.id} className={`bg-white border border-slate-100 rounded-2xl shadow-sm p-5 ${!c.ativo ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${info.className}`}><Icon size={18} /></div>
                <div>
                  <p className="font-semibold text-slate-800 leading-tight">{c.nome}</p>
                  <p className="text-xs text-slate-400">{info.label}{c.banco ? ` · ${c.banco}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isLoading ? <Loader2 size={15} className="animate-spin text-slate-400" /> : (
                  <>
                    {canEdit && (
                      <ContaFormModal mode="edit" conta={c} trigger={
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
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Saldo Atual</p>
                <p className={`font-serif text-xl font-bold ${c.saldoAtual < 0 ? "text-red-500" : "text-slate-900"}`}>{brl(c.saldoAtual)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Inicial</p>
                <p className="text-sm text-slate-500">{brl(c.saldoInicial)}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
