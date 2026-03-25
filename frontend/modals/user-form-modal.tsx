"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"

type Mode = "create" | "edit"

interface UserData {
  id: string
  name: string
  email: string
  role: string
  department?: string | null
  phone?: string | null
  empresaId?: string | null
  setorId?: string | null
  grupoId?: string | null
}

interface Empresa {
  id: string
  nome: string
  tipoSistema?: string | null
  cor?: string | null
}

interface Props {
  mode: Mode
  user?: UserData
  trigger: React.ReactNode
  empresas?: Empresa[]
  setores?: { id: string; nome: string; empresaId: string }[]
  grupos?: { id: string; nome: string; empresaId: string }[]
}

const ROLES = [
  { value: "A", label: "Administrador" },
  { value: "T", label: "Técnico" },
  { value: "F", label: "Corpo Docente" },
]

const labelClass = "block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1"
const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
const selectClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 transition-all"

export function UserFormModal({ mode, user, trigger, empresas = [], setores = [], grupos = [] }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "F",
    department: "",
    phone: "",
    empresaId: "",
    setorId: "",
    grupoId: "",
  })

  useEffect(() => {
    if (user && mode === "edit") {
      setForm({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        department: user.department ?? "",
        phone: user.phone ?? "",
        empresaId: user.empresaId ?? "",
        setorId: user.setorId ?? "",
        grupoId: user.grupoId ?? "",
      })
    } else {
      setForm({ name: "", email: "", password: "", role: "F", department: "", phone: "", empresaId: "", setorId: "", grupoId: "" })
    }
    setError("")
  }, [open, user, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.name || !form.email || !form.role) {
      setError("Nome, e-mail e perfil são obrigatórios.")
      return
    }
    if (mode === "create" && !form.password) {
      setError("Senha é obrigatória para novo usuário.")
      return
    }
    // empresaId obrigatório para não-Admin
    if (form.role !== "A" && !form.empresaId) {
      setError("Empresa é obrigatória para este perfil de usuário.")
      return
    }

    setLoading(true)

    try {
      const url = mode === "create" ? "/api/users" : `/api/users/${user!.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const body: Record<string, string | null> = {
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
        phone: form.phone,
        empresaId: form.empresaId || null,
        setorId: form.setorId || null,
        grupoId: form.grupoId || null,
      }
      if (form.password) body.password = form.password

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar usuário.")
        return
      }

      setOpen(false)
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const empresaSelecionada = empresas.find((e) => e.id === form.empresaId)
  const setoresFiltrados = setores.filter(s => s.empresaId === form.empresaId)
  const gruposFiltrados = grupos.filter(g => g.empresaId === form.empresaId)
  const empresaRequired = form.role !== "A"

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-serif text-base font-bold text-slate-900">
                {mode === "create" ? "Novo Usuário" : "Editar Usuário"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              {/* Linha 1: Nome | Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Nome completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    E-mail <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                    placeholder="joao@empresa.com"
                  />
                </div>
              </div>

              {/* Linha 2: Senha (full width) */}
              <div>
                <label className={labelClass}>
                  {mode === "create" ? (
                    <>Senha <span className="text-red-400">*</span></>
                  ) : (
                    "Nova senha (opcional)"
                  )}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={inputClass}
                  placeholder={mode === "create" ? "Mínimo 8 caracteres" : "Deixe em branco para manter"}
                />
              </div>

              {/* Linha 3: Role | Empresa */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Perfil <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className={selectClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Empresa {empresaRequired && <span className="text-red-400">*</span>}
                  </label>
                  {empresas.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Cadastre uma empresa antes de criar usuários.
                    </p>
                  ) : (
                    <select
                      value={form.empresaId}
                      onChange={(e) => setForm((f) => ({ ...f, empresaId: e.target.value }))}
                      className={selectClass}
                    >
                      {!empresaRequired && <option value="">— Nenhuma —</option>}
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                      ))}
                    </select>
                  )}
                  {/* Badge com tipo de sistema da empresa selecionada */}
                  {empresaSelecionada?.tipoSistema && (
                    <span
                      className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: empresaSelecionada.cor ? `${empresaSelecionada.cor}20` : "#f97316" + "20",
                        color: empresaSelecionada.cor ?? "#f97316",
                        border: `1px solid ${empresaSelecionada.cor ?? "#f97316"}40`,
                      }}
                    >
                      {empresaSelecionada.tipoSistema}
                    </span>
                  )}
                </div>
              </div>

              {/* Linha 4: Departamento | Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Departamento</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className={inputClass}
                    placeholder="Ex: Coordenação"
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputClass}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Linha 5: Setor | Grupo */}
              {form.empresaId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Setor</label>
                    <select
                      value={form.setorId}
                      onChange={(e) => setForm((f) => ({ ...f, setorId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">— Nenhum —</option>
                      {setoresFiltrados.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Grupo</label>
                    <select
                      value={form.grupoId}
                      onChange={(e) => setForm((f) => ({ ...f, grupoId: e.target.value }))}
                      className={selectClass}
                    >
                      <option value="">— Nenhum —</option>
                      {gruposFiltrados.map(g => (
                        <option key={g.id} value={g.id}>{g.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {mode === "create" ? "Criar Usuário" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
