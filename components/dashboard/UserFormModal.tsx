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
}

interface Empresa {
  id: string
  nome: string
}

interface Props {
  mode: Mode
  user?: UserData
  trigger: React.ReactNode
  empresas?: Empresa[]
}

const ROLES = [
  { value: "A", label: "Administrador" },
  { value: "T", label: "Técnico" },
  { value: "F", label: "Corpo Docente" },
]

export function UserFormModal({ mode, user, trigger, empresas = [] }: Props) {
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
      })
    } else {
      setForm({ name: "", email: "", password: "", role: "F", department: "", phone: "", empresaId: "" })
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

  const field = (label: string, key: keyof typeof form, type = "text", required = false) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
      />
    </div>
  )

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-serif text-lg font-bold text-slate-900">
                {mode === "create" ? "Novo Usuário" : "Editar Usuário"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {field("Nome completo", "name", "text", true)}
              {field("E-mail", "email", "email", true)}
              {field(mode === "create" ? "Senha" : "Nova senha (opcional)", "password", "password", mode === "create")}

              {/* Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]">
                  Perfil<span className="text-red-400 ml-0.5">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {field("Departamento", "department")}
              {field("Telefone", "phone")}

              {/* Empresa */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]">
                  Empresa
                </label>
                <select
                  value={form.empresaId}
                  onChange={(e) => setForm((f) => ({ ...f, empresaId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                >
                  <option value="">— Nenhuma empresa —</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
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
