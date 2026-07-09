"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, CheckCircle2, FileText } from "lucide-react"

interface Conta { id: string; nome: string }

interface Resultado { total: number; conciliados: number; criados: number; semMatch: number }

export function ConciliacaoForm({ contas }: { contas: Conta[] }) {
  const router = useRouter()
  const [contaId, setContaId] = useState(contas[0]?.id ?? "")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [criarFaltantes, setCriarFaltantes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const enviar = async () => {
    setError(""); setResultado(null)
    if (!contaId) { setError("Selecione a conta a conciliar."); return }
    if (!arquivo) { setError("Selecione um arquivo OFX ou CSV."); return }

    setLoading(true)
    try {
      const conteudo = await arquivo.text()
      const formato = arquivo.name.toLowerCase().endsWith(".ofx") ? "ofx" : "csv"
      const res = await fetch("/api/financeiro/conciliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contaId, formato, conteudo, criarFaltantes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erro ao conciliar."); return }
      setResultado(data)
      router.refresh()
    } catch { setError("Erro ao ler o arquivo ou enviar. Tente novamente.") } finally { setLoading(false) }
  }

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
  const labelClass = "block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1"

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 max-w-2xl">
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Conta a conciliar</label>
          <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={inputClass}>
            {contas.length === 0 && <option value="">Nenhuma conta cadastrada</option>}
            {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Arquivo do extrato (.ofx ou .csv)</label>
          <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-6 cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-all">
            <FileText size={20} className="text-slate-400" />
            <span className="text-sm text-slate-500">{arquivo ? arquivo.name : "Clique para selecionar o arquivo"}</span>
            <input type="file" accept=".ofx,.csv,.txt" className="hidden" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          </label>
          <p className="text-[11px] text-slate-400 mt-1.5">CSV esperado: <code className="font-mono">data;valor;descrição</code> (data dd/mm/aaaa ou aaaa-mm-dd; valor negativo = despesa).</p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={criarFaltantes} onChange={(e) => setCriarFaltantes(e.target.checked)} className="accent-brand-500 w-4 h-4" />
          <span className="text-sm text-slate-600">Criar lançamentos para transações sem correspondência</span>
        </label>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">{error}</div>}

        {resultado && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-2"><CheckCircle2 size={16} /> Conciliação concluída</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div><p className="font-serif text-xl font-bold text-slate-900">{resultado.total}</p><p className="text-[11px] text-slate-500">Transações</p></div>
              <div><p className="font-serif text-xl font-bold text-emerald-600">{resultado.conciliados}</p><p className="text-[11px] text-slate-500">Conciliadas</p></div>
              <div><p className="font-serif text-xl font-bold text-blue-600">{resultado.criados}</p><p className="text-[11px] text-slate-500">Criadas</p></div>
              <div><p className="font-serif text-xl font-bold text-amber-600">{resultado.semMatch}</p><p className="text-[11px] text-slate-500">Sem match</p></div>
            </div>
          </div>
        )}

        <button onClick={enviar} disabled={loading || contas.length === 0}
          className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {loading ? "Processando..." : "Importar e Conciliar"}
        </button>
      </div>
    </div>
  )
}
