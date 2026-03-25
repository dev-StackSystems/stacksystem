"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/shared/constants/sistema-types"

type Mode = "create" | "edit"

export interface EmpresaData {
  id: string
  nome: string
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  ativa: boolean
  cor?: string | null
  logo?: string | null
  banner?: string | null
  tipoSistema?: string | null
  descricao?: string | null
}

interface Props {
  mode: Mode
  empresa?: EmpresaData
  trigger: React.ReactNode
}

export function EmpresaFormModal({ mode, empresa, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    ativa: true,
    cor: "#f97316",
    logo: "",
    banner: "",
    tipoSistema: "",
    descricao: "",
  })

  useEffect(() => {
    if (open) {
      if (empresa && mode === "edit") {
        setForm({
          nome: empresa.nome,
          cnpj: empresa.cnpj ?? "",
          email: empresa.email ?? "",
          telefone: empresa.telefone ?? "",
          ativa: empresa.ativa,
          cor: empresa.cor ?? "#f97316",
          logo: empresa.logo ?? "",
          banner: empresa.banner ?? "",
          tipoSistema: empresa.tipoSistema ?? "",
          descricao: empresa.descricao ?? "",
        })
      } else {
        setForm({
          nome: "",
          cnpj: "",
          email: "",
          telefone: "",
          ativa: true,
          cor: "#f97316",
          logo: "",
          banner: "",
          tipoSistema: "",
          descricao: "",
        })
      }
      setError("")
    }
  }, [open, empresa, mode])

  const tipoAtual = TIPOS_SISTEMA.find((t) => t.key === form.tipoSistema)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.nome.trim()) {
      setError("Nome é obrigatório.")
      return
    }

    setLoading(true)

    try {
      const url = mode === "create" ? "/api/empresas" : `/api/empresas/${empresa!.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          cnpj: form.cnpj.trim() || null,
          email: form.email.trim() || null,
          telefone: form.telefone.trim() || null,
          ativa: form.ativa,
          cor: form.cor.trim() || null,
          logo: form.logo.trim() || null,
          banner: form.banner.trim() || null,
          tipoSistema: form.tipoSistema.trim() || null,
          descricao: form.descricao.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar empresa.")
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

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
  const labelClass =
    "text-[10px] font-bold uppercase tracking-wide text-slate-500"

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-serif text-base font-bold text-slate-900">
                {mode === "create" ? "Nova Empresa" : "Editar Empresa"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">

              {/* ── Seção: Dados Básicos ── */}
              <p className={`${labelClass} text-slate-400`}>Dados Básicos</p>

              {/* Nome (full width) */}
              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Nome<span className="text-red-400 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Razão social ou nome fantasia"
                  className={inputClass}
                />
              </div>

              {/* CNPJ + Telefone (2 colunas) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>CNPJ</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* E-mail + Status (2 colunas) */}
              <div className={`grid gap-3 ${mode === "edit" ? "grid-cols-2" : "grid-cols-1"}`}>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="contato@empresa.com.br"
                    className={inputClass}
                  />
                </div>
                {mode === "edit" && (
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Status</label>
                    <select
                      value={form.ativa ? "true" : "false"}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, ativa: e.target.value === "true" }))
                      }
                      className={inputClass}
                    >
                      <option value="true">Ativa</option>
                      <option value="false">Inativa</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Divisor */}
              <div className="border-t border-slate-100 pt-1" />

              {/* ── Seção: Identidade Visual ── */}
              <p className={`${labelClass} text-slate-400`}>Identidade Visual</p>

              {/* Cor + Logo URL (2 colunas) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Cor Primária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.cor}
                      onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value }))}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-0.5"
                    />
                    <input
                      type="text"
                      value={form.cor}
                      onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value }))}
                      placeholder="#f97316"
                      className={`${inputClass} font-mono text-xs`}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Logo (URL)</label>
                  <input
                    type="text"
                    value={form.logo}
                    onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Banner URL (full width) */}
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Banner (URL)</label>
                <input
                  type="text"
                  value={form.banner}
                  onChange={(e) => setForm((f) => ({ ...f, banner: e.target.value }))}
                  placeholder="https://... (imagem de capa da empresa)"
                  className={inputClass}
                />
              </div>

              {/* Divisor */}
              <div className="border-t border-slate-100 pt-1" />

              {/* ── Seção: Tipo de Sistema ── */}
              <p className={`${labelClass} text-slate-400`}>Tipo de Sistema</p>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Tipo</label>
                <select
                  value={form.tipoSistema}
                  onChange={(e) => setForm((f) => ({ ...f, tipoSistema: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">-- Selecionar tipo --</option>
                  {TIPOS_SISTEMA.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview dos módulos do tipo selecionado */}
              {tipoAtual && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                    {tipoAtual.emoji} {tipoAtual.label} — módulos habilitados automaticamente
                  </p>
                  {tipoAtual.key === "personalizado" ? (
                    <p className="text-xs text-slate-500">
                      Configure os módulos manualmente após criar a empresa.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {MODULOS_DISPONIVEIS.map((m) => {
                        const ativo = tipoAtual.modulos.includes(m.key)
                        return (
                          <span
                            key={m.key}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              ativo
                                ? "bg-orange-50 text-orange-600 border-orange-200"
                                : "bg-slate-100 text-slate-400 border-slate-200 line-through"
                            }`}
                          >
                            {m.label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">{tipoAtual.descricao}</p>
                </div>
              )}

              {/* Descrição (textarea) */}
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Breve descrição da empresa (opcional)"
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Erro */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {mode === "create" ? "Criar Empresa" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
