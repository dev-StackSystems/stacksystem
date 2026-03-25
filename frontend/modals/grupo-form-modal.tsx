"use client"
import { useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { MODULOS_DISPONIVEIS } from "@/shared/constants/sistema-types"
import { X, Loader2 } from "lucide-react"

interface GrupoData {
  id: string
  nome: string
  descricao?: string | null
  isAdmin: boolean
  ativo: boolean
  empresaId: string
  modulos: { modulo: string }[]
}

interface Props {
  trigger: ReactNode
  mode?: "create" | "edit"
  grupo?: GrupoData
  empresas: { id: string; nome: string }[]
  isAdmin: boolean
  empresaId?: string | null
}

export function GrupoFormModal({ trigger, mode = "create", grupo, empresas, isAdmin, empresaId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(grupo?.nome ?? "")
  const [descricao, setDescricao] = useState(grupo?.descricao ?? "")
  const [empId, setEmpId] = useState(grupo?.empresaId ?? empresaId ?? "")
  const [grupoIsAdmin, setGrupoIsAdmin] = useState(grupo?.isAdmin ?? false)
  const [modulos, setModulos] = useState<string[]>(grupo?.modulos.map(m => m.modulo) ?? [])

  const toggleModulo = (key: string) =>
    setModulos(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = mode === "edit" ? `/api/grupos/${grupo!.id}` : "/api/grupos"
      const method = mode === "edit" ? "PUT" : "POST"
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao, empresaId: empId, isAdmin: grupoIsAdmin, modulos }),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const grouped = MODULOS_DISPONIVEIS.reduce<Record<string, typeof MODULOS_DISPONIVEIS>>((acc, m) => {
    ;(acc[m.group] ??= []).push(m)
    return acc
  }, {})

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-serif font-bold text-slate-900">
                {mode === "edit" ? "Editar Grupo" : "Novo Grupo"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Empresa</label>
                  <select
                    value={empId}
                    onChange={e => setEmpId(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Selecionar...</option>
                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Grupo *</label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  placeholder="Ex: Técnico, Corpo Docente, Admin..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição</label>
                <input
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setGrupoIsAdmin(v => !v)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                    grupoIsAdmin ? "bg-orange-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      grupoIsAdmin ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Grupo Administrador</p>
                  <p className="text-xs text-slate-400">Acesso total aos módulos da empresa</p>
                </div>
              </div>

              {!grupoIsAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Módulos de acesso</label>
                  {Object.entries(grouped).map(([group, mods]) => (
                    <div key={group} className="mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{group}</p>
                      <div className="flex flex-wrap gap-2">
                        {mods.map(m => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => toggleModulo(m.key)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                              modulos.includes(m.key)
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {mode === "edit" ? "Salvar" : "Criar Grupo"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
