"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { BaixaFormModal, BaixaData, MatriculaSimples } from "@/frontend/modals/baixa-form-modal"

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
  pago: {
    label: "Pago",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  pendente: {
    label: "Pendente",
    className: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-50 text-red-500 border border-red-200",
  },
}

const tipoConfig: Record<string, { label: string; className: string }> = {
  mensalidade: {
    label: "Mensalidade",
    className: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  matricula: {
    label: "Matrícula",
    className: "bg-purple-50 text-purple-600 border border-purple-200",
  },
  certificado: {
    label: "Certificado",
    className: "bg-orange-50 text-orange-600 border border-orange-200",
  },
  outros: {
    label: "Outros",
    className: "bg-slate-100 text-slate-500 border border-slate-200",
  },
}

export function BaixaTable({ baixas, matriculas, isAdmin, canEdit }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const deletarBaixa = async (id: string) => {
    if (!confirm("Excluir esta baixa permanentemente?")) return
    setLoadingId(id)
    try {
      await fetch(`/api/baixas/${id}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  if (baixas.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
        <p className="text-slate-400 text-sm">Nenhuma baixa encontrada.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Aluno</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Valor</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Vencimento</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {baixas.map((b) => {
              const isLoading = loadingId === b.id
              const statusInfo = statusConfig[b.status] ?? {
                label: b.status,
                className: "bg-slate-100 text-slate-500 border border-slate-200",
              }
              const tipoInfo = tipoConfig[b.tipo] ?? {
                label: b.tipo,
                className: "bg-slate-100 text-slate-500 border border-slate-200",
              }
              const nomeAluno = b.matricula?.aluno?.nome ?? "—"

              return (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Descrição */}
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-700">{b.descricao || <span className="text-slate-400 italic">Sem descrição</span>}</span>
                  </td>

                  {/* Aluno */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-slate-600">{nomeAluno}</span>
                  </td>

                  {/* Tipo */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tipoInfo.className}`}>
                      {tipoInfo.label}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="font-medium text-slate-700">{formatBRL(b.valor)}</span>
                  </td>

                  {/* Vencimento */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-slate-500">{formatDate(b.dataVenc)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>

                  {/* Ações */}
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
                                <button
                                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Editar"
                                >
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
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400">{baixas.length} registro(s)</p>
      </div>
    </div>
  )
}
