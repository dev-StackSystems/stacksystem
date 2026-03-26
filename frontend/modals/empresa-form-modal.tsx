"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/shared/constants/sistema-types"

type Mode = "create" | "edit"

export interface EmpresaData {
  id: string
  nome: string
  sigla?: string | null
  cnpj?: string | null
  email?: string | null
  telefone?: string | null
  fax?: string | null
  site?: string | null
  endereco?: string | null
  bairro?: string | null
  cep?: string | null
  municipio?: string | null
  uf?: string | null
  latitude?: string | null
  longitude?: string | null
  ativa: boolean
  cor?: string | null
  cor2?: string | null
  logo?: string | null
  brasao?: string | null
  banner?: string | null
  nomeSistema?: string | null
  tipoSistema?: string | null
  mascara?: string | null
  descricao?: string | null
}

interface Props {
  mode: Mode
  empresa?: EmpresaData
  trigger: React.ReactNode
}

const EMPTY_FORM = {
  nome: "", sigla: "", cnpj: "", email: "", telefone: "", fax: "", site: "",
  endereco: "", bairro: "", cep: "", municipio: "", uf: "",
  latitude: "", longitude: "",
  ativa: true,
  cor: "#f97316", cor2: "#1e293b",
  logo: "", brasao: "", banner: "",
  nomeSistema: "", tipoSistema: "", mascara: "", descricao: "",
}

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]

export function EmpresaFormModal({ mode, empresa, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (open) {
      if (empresa && mode === "edit") {
        setForm({
          nome: empresa.nome,
          sigla: empresa.sigla ?? "",
          cnpj: empresa.cnpj ?? "",
          email: empresa.email ?? "",
          telefone: empresa.telefone ?? "",
          fax: empresa.fax ?? "",
          site: empresa.site ?? "",
          endereco: empresa.endereco ?? "",
          bairro: empresa.bairro ?? "",
          cep: empresa.cep ?? "",
          municipio: empresa.municipio ?? "",
          uf: empresa.uf ?? "",
          latitude: empresa.latitude ?? "",
          longitude: empresa.longitude ?? "",
          ativa: empresa.ativa,
          cor: empresa.cor ?? "#f97316",
          cor2: empresa.cor2 ?? "#1e293b",
          logo: empresa.logo ?? "",
          brasao: empresa.brasao ?? "",
          banner: empresa.banner ?? "",
          nomeSistema: empresa.nomeSistema ?? "",
          tipoSistema: empresa.tipoSistema ?? "",
          mascara: empresa.mascara ?? "",
          descricao: empresa.descricao ?? "",
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setError("")
    }
  }, [open, empresa, mode])

  const tipoAtual = TIPOS_SISTEMA.find((t) => t.key === form.tipoSistema)
  const f = (key: keyof typeof form, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.nome.trim()) { setError("Nome é obrigatório."); return }
    if (!form.tipoSistema) { setError("Tipo de sistema é obrigatório."); return }
    setLoading(true)
    try {
      const url = mode === "create" ? "/api/empresas" : `/api/empresas/${empresa!.id}`
      const method = mode === "create" ? "POST" : "PUT"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(),
          sigla: form.sigla.trim() || null,
          cnpj: form.cnpj.trim() || null,
          email: form.email.trim() || null,
          telefone: form.telefone.trim() || null,
          fax: form.fax.trim() || null,
          site: form.site.trim() || null,
          endereco: form.endereco.trim() || null,
          bairro: form.bairro.trim() || null,
          cep: form.cep.trim() || null,
          municipio: form.municipio.trim() || null,
          uf: form.uf || null,
          latitude: form.latitude.trim() || null,
          longitude: form.longitude.trim() || null,
          ativa: form.ativa,
          cor: form.cor.trim() || null,
          cor2: form.cor2.trim() || null,
          logo: form.logo.trim() || null,
          brasao: form.brasao.trim() || null,
          banner: form.banner.trim() || null,
          nomeSistema: form.nomeSistema.trim() || null,
          tipoSistema: form.tipoSistema.trim() || null,
          mascara: form.mascara.trim() || null,
          descricao: form.descricao.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erro ao salvar empresa."); return }
      setOpen(false)
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
  const labelClass = "text-[10px] font-bold uppercase tracking-wide text-slate-500"
  const sectionLabel = "text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 mb-3"

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-base font-bold text-slate-900">
                {mode === "create" ? "Nova Empresa / Prefeitura" : "Editar Empresa"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

              {/* ── Identificação ── */}
              <div>
                <p className={sectionLabel}>Identificação</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Nome / Razão Social <span className="text-red-400">*</span></label>
                    <input value={form.nome} onChange={e => f("nome", e.target.value)} className={inputClass} placeholder="Ex: Prefeitura Municipal de São Marcos" />
                  </div>
                  <div>
                    <label className={labelClass}>Sigla</label>
                    <input value={form.sigla} onChange={e => f("sigla", e.target.value)} className={inputClass} placeholder="Ex: PMSM" />
                  </div>
                  <div>
                    <label className={labelClass}>CNPJ</label>
                    <input value={form.cnpj} onChange={e => f("cnpj", e.target.value)} className={inputClass} placeholder="00.000.000/0000-00" />
                  </div>
                </div>
              </div>

              {/* ── Contato ── */}
              <div>
                <p className={sectionLabel}>Contato</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>E-mail</label>
                    <input type="email" value={form.email} onChange={e => f("email", e.target.value)} className={inputClass} placeholder="contato@municipio.gov.br" />
                  </div>
                  <div>
                    <label className={labelClass}>Site</label>
                    <input value={form.site} onChange={e => f("site", e.target.value)} className={inputClass} placeholder="https://municipio.gov.br" />
                  </div>
                  <div>
                    <label className={labelClass}>Telefone</label>
                    <input value={form.telefone} onChange={e => f("telefone", e.target.value)} className={inputClass} placeholder="(00) 0000-0000" />
                  </div>
                  <div>
                    <label className={labelClass}>Fax</label>
                    <input value={form.fax} onChange={e => f("fax", e.target.value)} className={inputClass} placeholder="(00) 0000-0000" />
                  </div>
                </div>
              </div>

              {/* ── Endereço ── */}
              <div>
                <p className={sectionLabel}>Endereço</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>Logradouro</label>
                    <input value={form.endereco} onChange={e => f("endereco", e.target.value)} className={inputClass} placeholder="Rua das Flores, 100 — Centro" />
                  </div>
                  <div>
                    <label className={labelClass}>Bairro</label>
                    <input value={form.bairro} onChange={e => f("bairro", e.target.value)} className={inputClass} placeholder="Centro" />
                  </div>
                  <div>
                    <label className={labelClass}>CEP</label>
                    <input value={form.cep} onChange={e => f("cep", e.target.value)} className={inputClass} placeholder="00000-000" />
                  </div>
                  <div>
                    <label className={labelClass}>Município</label>
                    <input value={form.municipio} onChange={e => f("municipio", e.target.value)} className={inputClass} placeholder="São Paulo" />
                  </div>
                  <div>
                    <label className={labelClass}>UF</label>
                    <select value={form.uf} onChange={e => f("uf", e.target.value)} className={inputClass}>
                      <option value="">—</option>
                      {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Latitude</label>
                    <input value={form.latitude} onChange={e => f("latitude", e.target.value)} className={inputClass} placeholder="-23.5505" />
                  </div>
                  <div>
                    <label className={labelClass}>Longitude</label>
                    <input value={form.longitude} onChange={e => f("longitude", e.target.value)} className={inputClass} placeholder="-46.6333" />
                  </div>
                </div>
              </div>

              {/* ── Identidade Visual ── */}
              <div>
                <p className={sectionLabel}>Identidade Visual</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Cor Primária</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.cor} onChange={e => f("cor", e.target.value)} className="h-9 w-10 cursor-pointer rounded border border-slate-200 p-0.5" />
                      <input value={form.cor} onChange={e => f("cor", e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="#f97316" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Cor Secundária</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.cor2} onChange={e => f("cor2", e.target.value)} className="h-9 w-10 cursor-pointer rounded border border-slate-200 p-0.5" />
                      <input value={form.cor2} onChange={e => f("cor2", e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="#1e293b" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Logomarca (URL)</label>
                    <input value={form.logo} onChange={e => f("logo", e.target.value)} className={inputClass} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={labelClass}>Brasão / Ícone (URL)</label>
                    <input value={form.brasao} onChange={e => f("brasao", e.target.value)} className={inputClass} placeholder="https://..." />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Banner / Capa (URL)</label>
                    <input value={form.banner} onChange={e => f("banner", e.target.value)} className={inputClass} placeholder="https://... (imagem de capa do portal)" />
                  </div>
                </div>
              </div>

              {/* ── Configuração do Sistema ── */}
              <div>
                <p className={sectionLabel}>Configuração do Sistema</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Nome da Plataforma</label>
                    <input value={form.nomeSistema} onChange={e => f("nomeSistema", e.target.value)} className={inputClass} placeholder="Ex: Portal SEMEDUC" />
                  </div>
                  <div>
                    <label className={labelClass}>Máscara de Numeração</label>
                    <input value={form.mascara} onChange={e => f("mascara", e.target.value)} className={inputClass} placeholder="Ex: ###/AAAA" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Tipo de Sistema <span className="text-red-400">*</span></label>
                    <select value={form.tipoSistema} onChange={e => f("tipoSistema", e.target.value)} className={inputClass}>
                      <option value="">-- Selecionar --</option>
                      {TIPOS_SISTEMA.map(t => <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>)}
                    </select>
                  </div>
                  {tipoAtual && (
                    <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                        {tipoAtual.emoji} {tipoAtual.label} — módulos habilitados automaticamente
                      </p>
                      {tipoAtual.key === "personalizado" ? (
                        <p className="text-xs text-slate-500">Configure os módulos manualmente após criar.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {MODULOS_DISPONIVEIS.map(m => {
                            const ativo = tipoAtual.modulos.includes(m.key)
                            return (
                              <span key={m.key} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ativo ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-slate-100 text-slate-400 border-slate-200 line-through"}`}>
                                {m.label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className={labelClass}>Descrição</label>
                    <textarea value={form.descricao} onChange={e => f("descricao", e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Breve descrição da instituição" />
                  </div>
                  {mode === "edit" && (
                    <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <button type="button" onClick={() => f("ativa", !form.ativa)}
                        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${form.ativa ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.ativa ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{form.ativa ? "Empresa Ativa" : "Empresa Inativa"}</p>
                        <p className="text-xs text-slate-400">Empresas inativas não aparecem para usuários</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600 font-medium">{error}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
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
