"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { SetorFormModal } from "@/componentes/formularios/form-setor"
import { Pencil, Trash2, Users, ShieldCheck } from "lucide-react"

interface Setor {
  id: string
  nome: string
  descricao?: string | null
  ativo: boolean
  empresaId: string
  empresa: { nome: string }
  modulos: { modulo: string }[]
  _count: { usuarios: number }
}

interface Props {
  setores: Setor[]
  canManage: boolean
  isAdmin: boolean
  empresas: { id: string; nome: string }[]
}

export function SetorTable({ setores, canManage, isAdmin, empresas }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este setor?")) return
    setDeleting(id)
    await fetch(`/api/setores/${id}`, { method: "DELETE" })
    setDeleting(null)
    router.refresh()
  }

  if (setores.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        Nenhum setor cadastrado.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Setor</th>
            {isAdmin && <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresa</th>}
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Módulos</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuários</th>
            {canManage && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {setores.map(setor => (
            <tr key={setor.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-3.5">
                <p className="font-semibold text-slate-800">{setor.nome}</p>
                {setor.descricao && <p className="text-xs text-slate-400 mt-0.5">{setor.descricao}</p>}
              </td>
              {isAdmin && (
                <td className="px-5 py-3.5 text-slate-600">{setor.empresa.nome}</td>
              )}
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-1">
                  {setor.modulos.length === 0 ? (
                    <span className="text-xs text-slate-400">Nenhum</span>
                  ) : (
                    setor.modulos.slice(0, 4).map(m => (
                      <span key={m.modulo} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 font-medium">
                        <ShieldCheck size={10} />
                        {m.modulo}
                      </span>
                    ))
                  )}
                  {setor.modulos.length > 4 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      +{setor.modulos.length - 4}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center gap-1.5 text-slate-600 text-xs">
                  <Users size={13} className="text-slate-400" />
                  {setor._count.usuarios}
                </span>
              </td>
              {canManage && (
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <SetorFormModal
                      mode="edit"
                      setor={setor}
                      empresas={empresas}
                      isAdmin={isAdmin}
                      empresaId={setor.empresaId}
                      trigger={
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                      }
                    />
                    <button
                      onClick={() => handleDelete(setor.id)}
                      disabled={deleting === setor.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
