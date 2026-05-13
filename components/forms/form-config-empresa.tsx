"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"

interface EmpresaData {
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
  cor?: string | null
  cor2?: string | null
  logo?: string | null
  brasao?: string | null
  banner?: string | null
  nomeSistema?: string | null
  mascara?: string | null
  descricao?: string | null
}

const inputClass =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
const labelClass = "block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1"
const sectionClass = "flex flex-col gap-3"
const sectionTitleClass = "text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2"

const UF_OPTIONS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA",
  "MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN",
  "RO","RR","RS","SC","SE","SP","TO",
]

export function EmpresaConfigForm({ empresa }: { empresa: EmpresaData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
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
    cor: empresa.cor ?? "#f97316",
    cor2: empresa.cor2 ?? "",
    logo: empresa.logo ?? "",
    brasao: empresa.brasao ?? "",
    banner: empresa.banner ?? "",
    nomeSistema: empresa.nomeSistema ?? "",
    mascara: empresa.mascara ?? "",
    descricao: empresa.descricao ?? "",
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

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
          uf: form.uf.trim() || null,
          latitude: form.latitude.trim() || null,
          longitude: form.longitude.trim() || null,
          cor: form.cor.trim() || null,
          cor2: form.cor2.trim() || null,
          logo: form.logo.trim() || null,
          brasao: form.brasao.trim() || null,
          banner: form.banner.trim() || null,
          nomeSistema: form.nomeSistema.trim() || null,
          mascara: form.mascara.trim() || null,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Preview da cor */}
      {form.cor && (
        <div
          className="h-1.5 rounded-full"
          style={{ background: form.cor2 ? `linear-gradient(to right, ${form.cor}, ${form.cor2})` : form.cor }}
        />
      )}

      {/* Identificação */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Identificação</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nome <span className="text-red-400">*</span></label>
            <input value={form.nome} onChange={set("nome")} className={inputClass} placeholder="Razão social ou nome fantasia" />
          </div>
          <div>
            <label className={labelClass}>Sigla</label>
            <input value={form.sigla} onChange={set("sigla")} className={inputClass} placeholder="Ex: SEMEDUC" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>CNPJ</label>
            <input value={form.cnpj} onChange={set("cnpj")} className={inputClass} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label className={labelClass}>Nome do Sistema</label>
            <input value={form.nomeSistema} onChange={set("nomeSistema")} className={inputClass} placeholder="Ex: Portal SEMEDUC" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Máscara de numeração</label>
          <input value={form.mascara} onChange={set("mascara")} className={inputClass} placeholder="Ex: ###/AAAA" />
        </div>
        <div>
          <label className={labelClass}>Descrição</label>
          <textarea
            value={form.descricao}
            onChange={set("descricao")}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Breve descrição da instituição (opcional)"
          />
        </div>
      </div>

      {/* Contato */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Contato</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>E-mail</label>
            <input type="email" value={form.email} onChange={set("email")} className={inputClass} placeholder="contato@escola.com.br" />
          </div>
          <div>
            <label className={labelClass}>Site</label>
            <input value={form.site} onChange={set("site")} className={inputClass} placeholder="https://escola.gov.br" />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input value={form.telefone} onChange={set("telefone")} className={inputClass} placeholder="(00) 3000-0000" />
          </div>
          <div>
            <label className={labelClass}>Fax</label>
            <input value={form.fax} onChange={set("fax")} className={inputClass} placeholder="(00) 3000-0001" />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Endereço</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Logradouro</label>
            <input value={form.endereco} onChange={set("endereco")} className={inputClass} placeholder="Rua das Flores, 100" />
          </div>
          <div>
            <label className={labelClass}>CEP</label>
            <input value={form.cep} onChange={set("cep")} className={inputClass} placeholder="00000-000" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Bairro</label>
            <input value={form.bairro} onChange={set("bairro")} className={inputClass} placeholder="Centro" />
          </div>
          <div>
            <label className={labelClass}>Município</label>
            <input value={form.municipio} onChange={set("municipio")} className={inputClass} placeholder="Santa Maria" />
          </div>
          <div>
            <label className={labelClass}>UF</label>
            <select value={form.uf} onChange={set("uf")} className={inputClass}>
              <option value="">— Selecione —</option>
              {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Latitude</label>
            <input value={form.latitude} onChange={set("latitude")} className={`${inputClass} font-mono text-xs`} placeholder="-29.6830" />
          </div>
          <div>
            <label className={labelClass}>Longitude</label>
            <input value={form.longitude} onChange={set("longitude")} className={`${inputClass} font-mono text-xs`} placeholder="-53.8069" />
          </div>
        </div>
      </div>

      {/* Identidade Visual */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>Identidade Visual</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cor Primária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.cor}
                onChange={set("cor")}
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              />
              <input
                type="text"
                value={form.cor}
                onChange={set("cor")}
                placeholder="#f97316"
                className={`${inputClass} font-mono text-xs`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Cor Secundária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.cor2 || "#000000"}
                onChange={set("cor2")}
                className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              />
              <input
                type="text"
                value={form.cor2}
                onChange={set("cor2")}
                placeholder="#ea580c"
                className={`${inputClass} font-mono text-xs`}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Logo (URL)</label>
            <input value={form.logo} onChange={set("logo")} className={inputClass} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Brasão / Ícone (URL)</label>
            <input value={form.brasao} onChange={set("brasao")} className={inputClass} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Banner / Capa (URL)</label>
            <input value={form.banner} onChange={set("banner")} className={inputClass} placeholder="https://..." />
          </div>
        </div>
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
