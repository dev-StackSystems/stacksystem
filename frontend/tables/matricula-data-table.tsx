"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { MatriculaFormModal, MatriculaData } from "@/frontend/modals/matricula-form-modal"

interface CursoData {
  id: string
  nome: string
  empresa: { nome: string }
}

interface Props {
  matriculas: MatriculaData[]
  alunos: { id: string; nome: string }[]
  cursos: CursoData[]
  isAdmin: boolean
  canEdit: boolean
}

const formatBRL = (val: number | string) =>
  Number(val).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const formatDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—"

const statusConfig: Record<string, { label: string; className: string }> = {
  ativa: {
    label: "Ativa",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  concluida: {
    label: "Concluída",
    className: "bg-blue-50 text-blue-600 border border-blue-200",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-red-50 text-red-500 border border-red-200",
  },
}

export function MatriculaTable({ matriculas, alunos, cursos, isAdmin, canEdit }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const cancelarMatricula = async (id: string) => {
    if (!confirm("Cancelar esta matrícula?")) return
    setLoadingId(id)
    try {
      await fetch(`/api/matriculas/${id}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  if (matriculas.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
        <p className="text-slate-400 text-sm">Nenhuma matrícula encontrada.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Aluno</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Curso</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Valor</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Início</th>
              <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {matriculas.map((m) => {
              const isLoading = loadingId === m.id
              const statusInfo = statusConfig[m.status] ?? {
                label: m.status,
                className: "bg-slate-100 text-slate-500 border border-slate-200",
              }

              return (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Aluno */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {m.aluno?.nome?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{m.aluno?.nome ?? "—"}</div>
                        <div className="text-xs text-slate-400">{m.aluno?.email ?? ""}</div>
                      </div>
                    </div>
                  </td>

                  {/* Curso */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div>
                      <div className="font-medium text-slate-700">{m.empCurso?.nome ?? "—"}</div>
                      <div className="text-xs text-slate-400">{m.empCurso?.empresa?.nome ?? ""}</div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-slate-700 font-medium">{formatBRL(m.valor)}</span>
                  </td>

                  {/* Data Início */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-slate-500">{formatDate(m.dataInicio)}</span>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                      ) : (
                        <>
                          {canEdit && (
                            <MatriculaFormModal
                              mode="edit"
                              matricula={m}
                              alunos={alunos}
                              cursos={cursos}
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
                              onClick={() => cancelarMatricula(m.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Cancelar matrícula"
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
        <p className="text-xs text-slate-400">{matriculas.length} registro(s)</p>
      </div>
    </div>
  )
}
