"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Loader2, Search } from "lucide-react"
import { BaixaFormModal, BaixaData, MatriculaSimples } from "@/frontend/modals/baixa-form-modal"
import { useToast } from "@/frontend/layout/toast-provider"

interface Props {
  baixas: BaixaData[]
  matriculas: MatriculaSimples[]
  isAdmin: boolean
  canEdit: boolean
}

const formatBRL = (val: number | string) =>
  Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—"

const statusConfig: Record<string, { label: string; className: string }> = {
  pago:      { label: "Pago",      className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  pendente:  { label: "Pendente",  className: "bg-amber-50 text-amber-600 border border-amber-200" },
  cancelado: { label: "Cancelado", className: "bg-red-50 text-red-500 border border-red-200" },
}

const tipoConfig: Record<string, { label: string; className: string }> = {
  mensalidade: { label: "Mensalidade", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  matricula:   { label: "Matrícula",   className: "bg-purple-50 text-purple-600 border border-purple-200" },
  certificado: { label: "Certificado", className: "bg-orange-50 text-orange-600 border border-orange-200" },
  outros:      { label: "Outros",      className: "bg-slate-100 text-slate-500 border border-slate-200" },
}

const STATUS_FILTERS = ["todos", "pago", "pendente", "cancelado"] as const
type StatusFilter = typeof STATUS_FILTERS[number]

export function BaixaTable({ baixas, matriculas, isAdmin, canEdit }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos")

  const deletarBaixa = async (id: string) => {
    if (!confirm("Excluir esta baixa permanentemente?")) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/baixas/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast("Baixa excluída com sucesso.")
        router.refresh()
      } else {
        toast("Erro ao excluir baixa.", "error")
      }
    } finally {
      setLoadingId(null)
    }
  }

  const filtered = baixas.filter(b => {
    const matchStatus = statusFilter === "todos" || b.status === statusFilter
    const term = search.toLowerCase()
    const matchSearch =
      !term ||
      b.descricao?.toLowerCase().includes(term) ||
      b.matricula?.aluno?.nome?.toLowerCase().includes(term) ||
      b.tipo?.toLowerCase().includes(term)
    return matchStatus && matchSearch
  })

  // Verifica se há pagamentos em atraso
  const hoje = new Date()
  const isAtrasado = (b: BaixaData) =>
    b.status === "pendente" && b.dataVenc && new Date(b.dataVenc) < hoje

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Barra de busca + filtros */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por aluno, descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all capitalize ${
                statusFilter === s
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {s === "todos" ? "Todos" : statusConfig[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-400 text-sm">Nenhuma baixa encontrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Aluno</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Valor</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Vencimento</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Pago em</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((b) => {
                const isLoading = loadingId === b.id
                const statusInfo = statusConfig[b.status] ?? { label: b.status, className: "bg-slate-100 text-slate-500 border border-slate-200" }
                const tipoInfo   = tipoConfig[b.tipo]     ?? { label: b.tipo,   className: "bg-slate-100 text-slate-500 border border-slate-200" }
                const nomeAluno = b.matricula?.aluno?.nome ?? "—"
                const atrasado = isAtrasado(b)

                return (
                  <tr key={b.id} className={`hover:bg-slate-50/50 transition-colors ${atrasado ? "bg-red-50/30" : ""}`}>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-slate-700">{b.descricao || <span className="text-slate-400 italic">Sem descrição</span>}</span>
                        {atrasado && (
                          <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Em atraso</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-slate-600">{nomeAluno}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tipoInfo.className}`}>{tipoInfo.label}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="font-medium text-slate-700">{formatBRL(b.valor)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={`text-slate-500 ${atrasado ? "text-red-500 font-medium" : ""}`}>{formatDate(b.dataVenc)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-500">{formatDate(b.dataPag)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.className}`}>{statusInfo.label}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                        ) : (
                          <>
                            {canEdit && (
                              <BaixaFormModal
                                mode="edit"
                                baixa={b}
                                matriculas={matriculas}
                                trigger={
                                  <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                    <Pencil size={15} />
                                  </button>
                                }
                              />
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => deletarBaixa(b.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Excluir baixa"
                              >
                                <Trash2 size={15} />
                              </button>
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
        <p className="text-xs text-slate-400">{filtered.length} de {baixas.length} registro(s)</p>
      </div>
    </div>
  )
}
