"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Layers } from "lucide-react"
import { CursoFormModal, type CursoData } from "./CursoFormModal"

interface EmpresaOption {
  id: string
  nome: string
}

interface Props {
  cursos: CursoData[]
  empresas: EmpresaOption[]
  isAdmin: boolean
}

export function CursoTable({ cursos, empresas, isAdmin }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggleAtivo = async (curso: CursoData) => {
    setLoadingId(curso.id)
    await fetch(`/api/cursos/${curso.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empresaId: curso.empresaId,
        nome: curso.nome,
        descricao: curso.descricao,
        cargaHoraria: curso.cargaHoraria,
        ativo: !curso.ativo,
      }),
    })
    setLoadingId(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Desativar este curso? Esta ação não pode ser desfeita.")) return
    setLoadingId(id)
    await fetch(`/api/cursos/${id}`, { method: "DELETE" })
    setLoadingId(null)
    router.refresh()
  }

  if (cursos.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
        <Layers size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm">Nenhum curso cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Curso
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                Descrição
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                Carga Horária
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {cursos.map((curso) => {
              const isLoading = loadingId === curso.id

              return (
                <tr key={curso.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Curso + empresa */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {curso.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{curso.nome}</div>
                        {curso.empresa?.nome && (
                          <div className="text-xs text-slate-400">{curso.empresa.nome}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Descrição */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-slate-500 line-clamp-2 max-w-xs">
                      {curso.descricao ?? "—"}
                    </span>
                  </td>

                  {/* Carga Horária */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    {curso.cargaHoraria != null ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {curso.cargaHoraria}h
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        curso.ativo
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {curso.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                      ) : (
                        <>
                          {/* Editar — A e T */}
                          <CursoFormModal
                            mode="edit"
                            curso={curso}
                            empresas={empresas}
                            trigger={
                              <button
                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Pencil size={15} />
                              </button>
                            }
                          />

                          {/* Toggle ativo — apenas admin */}
                          {isAdmin && (
                            <button
                              onClick={() => toggleAtivo(curso)}
                              className={`p-1.5 rounded-lg transition-all ${
                                curso.ativo
                                  ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                  : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                              }`}
                              title={curso.ativo ? "Desativar" : "Ativar"}
                            >
                              {curso.ativo ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                            </button>
                          )}

                          {/* Deletar — apenas admin */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(curso.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Desativar permanentemente"
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
        <p className="text-xs text-slate-400">
          {cursos.length} curso{cursos.length !== 1 ? "s" : ""} encontrado{cursos.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
