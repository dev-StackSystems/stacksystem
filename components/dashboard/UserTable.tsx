"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserFormModal } from "./UserFormModal"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string | null
  phone?: string | null
  active: boolean
  createdAt: Date | string
}

interface Props {
  users: User[]
  isAdmin: boolean
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  A: { label: "Administrador", className: "bg-purple-50 text-purple-600 border border-purple-200" },
  T: { label: "Técnico",       className: "bg-blue-50 text-blue-600 border border-blue-200" },
  F: { label: "Corpo Docente", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
}

export function UserTable({ users, isAdmin }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggleActive = async (user: User) => {
    setLoadingId(user.id)
    await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, active: !user.active }),
    })
    setLoadingId(null)
    router.refresh()
  }

  const deleteUser = async (id: string) => {
    if (!confirm("Desativar este usuário?")) return
    setLoadingId(id)
    await fetch(`/api/users/${id}`, { method: "DELETE" })
    setLoadingId(null)
    router.refresh()
  }

  if (users.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
        <p className="text-slate-400 text-sm">Nenhum usuário cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Perfil</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Departamento</th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              {isAdmin && (
                <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => {
              const role = ROLE_CONFIG[user.role] ?? { label: user.role, className: "bg-slate-50 text-slate-500 border border-slate-200" }
              const isLoading = loadingId === user.id

              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${role.className}`}>
                      {role.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-slate-500">{user.department ?? "—"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      user.active
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isLoading ? (
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                        ) : (
                          <>
                            {/* Editar */}
                            <UserFormModal
                              mode="edit"
                              user={user}
                              trigger={
                                <button
                                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Pencil size={15} />
                                </button>
                              }
                            />
                            {/* Toggle ativo */}
                            <button
                              onClick={() => toggleActive(user)}
                              className={`p-1.5 rounded-lg transition-all ${
                                user.active
                                  ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                  : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                              }`}
                              title={user.active ? "Desativar" : "Ativar"}
                            >
                              {user.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                            </button>
                            {/* Deletar (soft) */}
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Desativar permanentemente"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400">{users.length} usuário{users.length !== 1 ? "s" : ""} encontrado{users.length !== 1 ? "s" : ""}</p>
      </div>
    </div>
  )
}
