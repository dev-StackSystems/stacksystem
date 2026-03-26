"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlunoFormModal } from "@/frontend/modals/aluno-form-modal"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Search } from "lucide-react"
import { useToast } from "@/frontend/layout/toast-provider"

interface Aluno {
  id: string
  nome: string
  email: string
  cpf?: string | null
  telefone?: string | null
  dataNasc?: Date | string | null
  ativo: boolean
  createdAt: Date | string
  _count?: { matriculas?: number }
}

interface Props {
  alunos: Aluno[]
  isAdmin: boolean
}

function formatCpf(cpf?: string | null): string {
  if (!cpf) return "—"
  const digits = cpf.replace(/\D/g, "")
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  return cpf
}

function getInitials(nome: string): string {
  const words = nome.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

export function AlunoTable({ alunos, isAdmin }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const toggleAtivo = async (aluno: Aluno) => {
    setLoadingId(aluno.id)
    const res = await fetch(`/api/alunos/${aluno.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: aluno.nome, email: aluno.email, cpf: aluno.cpf,
        telefone: aluno.telefone, dataNasc: aluno.dataNasc,
        ativo: !aluno.ativo,
      }),
    })
    setLoadingId(null)
    if (res.ok) {
      toast(aluno.ativo ? "Aluno desativado." : "Aluno ativado.", "info")
      router.refresh()
    } else {
      toast("Erro ao alterar status.", "error")
    }
  }

  const deleteAluno = async (id: string) => {
    if (!confirm("Desativar este aluno permanentemente?")) return
    setLoadingId(id)
    const res = await fetch(`/api/alunos/${id}`, { method: "DELETE" })
    setLoadingId(null)
    if (res.ok) {
      toast("Aluno desativado com sucesso.")
      router.refresh()
    } else {
      toast("Erro ao desativar aluno.", "error")
    }
  }

  const filtered = alunos.filter(a => {
    const term = search.toLowerCase()
    return (
      !term ||
      a.nome.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      (a.cpf ?? "").toLowerCase().includes(term) ||
      (a.telefone ?? "").toLowerCase().includes(term)
    )
  })

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Barra de busca */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, CPF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-400 text-sm">
            {search ? "Nenhum aluno encontrado para esta busca." : "Nenhum aluno cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Aluno</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">CPF</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Telefone</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Matrículas</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((aluno) => {
                const isLoading = loadingId === aluno.id
                const matriculasCount = aluno._count?.matriculas ?? null

                return (
                  <tr key={aluno.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                          {getInitials(aluno.nome)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{aluno.nome}</div>
                          <div className="text-xs text-slate-400">{aluno.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-slate-500 font-mono text-xs">{formatCpf(aluno.cpf)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-500">{aluno.telefone || "—"}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {matriculasCount !== null ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          matriculasCount > 0
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}>
                          {matriculasCount} ativa{matriculasCount !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        aluno.ativo
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}>
                        {aluno.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                        ) : (
                          <>
                            <AlunoFormModal
                              mode="edit"
                              aluno={aluno}
                              trigger={
                                <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                  <Pencil size={15} />
                                </button>
                              }
                            />
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
      )}

      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400">
          {filtered.length} de {alunos.length} aluno{alunos.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
