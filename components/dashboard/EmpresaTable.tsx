"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Building2, Puzzle } from "lucide-react"
import { EmpresaFormModal, type EmpresaData } from "./EmpresaFormModal"
import { EmpresaModulosModal } from "./EmpresaModulosModal"

interface EmpresaRow extends EmpresaData {
  _count?: { cursos: number }
}

interface Props {
  empresas: EmpresaRow[]
  isAdmin: boolean
}

export function EmpresaTable({ empresas, isAdmin }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggleAtiva = async (empresa: EmpresaRow) => {
    setLoadingId(empresa.id)
    await fetch(`/api/empresas/${empresa.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: empresa.nome,
        cnpj: empresa.cnpj,
        email: empresa.email,
        telefone: empresa.telefone,
        ativa: !empresa.ativa,
      }),
    })
    setLoadingId(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Desativar esta empresa? Esta ação não pode ser desfeita.")) return
    setLoadingId(id)
    await fetch(`/api/empresas/${id}`, { method: "DELETE" })
    setLoadingId(null)
    router.refresh()
  }

  if (empresas.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
        <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm">Nenhuma empresa cadastrada ainda.</p>
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
                Empresa
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                CNPJ
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                Telefone
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                Cursos
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
            {empresas.map((empresa) => {
              const isLoading = loadingId === empresa.id

              return (
                <tr key={empresa.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Empresa */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {empresa.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{empresa.nome}</div>
                        {empresa.email && (
                          <div className="text-xs text-slate-400">{empresa.email}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* CNPJ */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-slate-500 font-mono text-xs">
                      {empresa.cnpj ?? "—"}
                    </span>
                  </td>

                  {/* Telefone */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-slate-500">{empresa.telefone ?? "—"}</span>
                  </td>

                  {/* Cursos */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                      {empresa._count?.cursos ?? 0} curso{(empresa._count?.cursos ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        empresa.ativa
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {empresa.ativa ? "Ativa" : "Inativa"}
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
                          <EmpresaFormModal
                            mode="edit"
                            empresa={empresa}
                            trigger={
                              <button
                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Pencil size={15} />
                              </button>
                            }
                          />

                          {/* Gerenciar Módulos — apenas admin */}
                          {isAdmin && (
                            <EmpresaModulosModal
                              empresaId={empresa.id}
                              empresaNome={empresa.nome}
                              trigger={
                                <button
                                  className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                  title="Gerenciar Módulos"
                                >
                                  <Puzzle size={15} />
                                </button>
                              }
                            />
                          )}

                          {/* Toggle ativo — apenas admin */}
                          {isAdmin && (
                            <button
                              onClick={() => toggleAtiva(empresa)}
                              className={`p-1.5 rounded-lg transition-all ${
                                empresa.ativa
                                  ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                  : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                              }`}
                              title={empresa.ativa ? "Desativar" : "Ativar"}
                            >
                              {empresa.ativa ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                            </button>
                          )}

                          {/* Deletar — apenas admin */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(empresa.id)}
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
          {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} encontrada{empresas.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
