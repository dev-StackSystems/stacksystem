"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"

interface EmpresaData {
  id: string
  nome: string
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  cor?: string | null
  logo?: string | null
  banner?: string | null
  descricao?: string | null
}

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
const labelClass = "block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1"

export function EmpresaConfigForm({ empresa }: { empresa: EmpresaData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    nome: empresa.nome,
    cnpj: empresa.cnpj ?? "",
    email: empresa.email ?? "",
    telefone: empresa.telefone ?? "",
    cor: empresa.cor ?? "#f97316",
    logo: empresa.logo ?? "",
    banner: empresa.banner ?? "",
    descricao: empresa.descricao ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    if (!form.nome.trim()) { setError("Nome é obrigatório."); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/empresas/${empresa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          cnpj: form.cnpj.trim() || null,
          email: form.email.trim() || null,
          telefone: form.telefone.trim() || null,
          cor: form.cor.trim() || null,
          logo: form.logo.trim() || null,
          banner: form.banner.trim() || null,
          descricao: form.descricao.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return }
      setSuccess(true)
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Preview da cor */}
      {form.cor && (
        <div
          className="h-2 rounded-full"
          style={{ background: form.cor }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome <span className="text-red-400">*</span></label>
          <input
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            className={inputClass}
            placeholder="Razão social ou nome fantasia"
          />
        </div>
        <div>
          <label className={labelClass}>CNPJ</label>
          <input
            value={form.cnpj}
            onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
            className={inputClass}
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div>
          <label className={labelClass}>E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={inputClass}
            placeholder="contato@escola.com.br"
          />
        </div>
        <div>
          <label className={labelClass}>Telefone</label>
          <input
            value={form.telefone}
            onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
            className={inputClass}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Cor Primária</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.cor}
            onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
            className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          />
          <input
            type="text"
            value={form.cor}
            onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
            placeholder="#f97316"
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Logo (URL)</label>
          <input
            value={form.logo}
            onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
            className={inputClass}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className={labelClass}>Banner (URL)</label>
          <input
            value={form.banner}
            onChange={e => setForm(f => ({ ...f, banner: e.target.value }))}
            className={inputClass}
            placeholder="https://... (imagem de capa)"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Descrição</label>
        <textarea
          value={form.descricao}
          onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="Breve descrição da instituição (opcional)"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-600 font-medium">
          Dados salvos com sucesso.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar Alterações
        </button>
      </div>
    </form>
  )
}
