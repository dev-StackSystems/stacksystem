"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlunoFormModal } from "./AlunoFormModal"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"

interface Aluno {
  id: string
  nome: string
  email: string
  cpf?: string | null
  telefone?: string | null
  dataNasc?: Date | string | null
  ativo: boolean
  createdAt: Date | string
}

interface Props {
  alunos: Aluno[]
  isAdmin: boolean
}

function formatCpf(cpf?: string | null): string {
  if (!cpf) return "—"
  const digits = cpf.replace(/\D/g, "")
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }
  return cpf
}

export function AlunoTable({ alunos, isAdmin }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggleAtivo = async (aluno: Aluno) => {
    setLoadingId(aluno.id)
    await fetch(`/api/alunos/${aluno.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: aluno.nome,
        email: aluno.email,
        cpf: aluno.cpf,
        telefone: aluno.telefone,
        dataNasc: aluno.dataNasc,
        ativo: !aluno.ativo,
      }),
    })
    setLoadingId(null)
    router.refresh()
  }

  const deleteAluno = async (id: string) => {
    if (!confirm("Desativar este aluno?")) return
    setLoadingId(id)
    await fetch(`/api/alunos/${id}`, { method: "DELETE" })
    setLoadingId(null)
    router.refresh()
  }

  if (alunos.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
        <p className="text-slate-400 text-sm">Nenhum aluno cadastrado ainda.</p>
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
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">CPF</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Telefone</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {alunos.map((aluno) => {
              const isLoading = loadingId === aluno.id

              return (
                <tr key={aluno.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Nome / Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {aluno.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{aluno.nome}</div>
                        <div className="text-xs text-slate-400">{aluno.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* CPF */}
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-slate-500">{formatCpf(aluno.cpf)}</span>
                  </td>

                  {/* Telefone */}
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-slate-500">{aluno.telefone ?? "—"}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      aluno.ativo
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                      {aluno.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                      ) : (
                        <>
                          {/* Editar — qualquer autenticado */}
                          <AlunoFormModal
                            mode="edit"
                            aluno={aluno}
                            trigger={
                              <button
                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Pencil size={15} />
                              </button>
                            }
                          />

                          {/* Toggle ativo/inativo — apenas admin */}
                          {isAdmin && (
                            <button
                              onClick={() => toggleAtivo(aluno)}
                              className={`p-1.5 rounded-lg transition-all ${
                                aluno.ativo
                                  ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                  : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                              }`}
                              title={aluno.ativo ? "Desativar" : "Ativar"}
                            >
                              {aluno.ativo ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                            </button>
                          )}

                          {/* Soft delete — apenas admin */}
                          {isAdmin && (
                            <button
                              onClick={() => deleteAluno(aluno.id)}
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
        <p className="text-xs text-slate-400">{alunos.length} aluno{alunos.length !== 1 ? "s" : ""} encontrado{alunos.length !== 1 ? "s" : ""}</p>
      </div>
    </div>
  )
}
