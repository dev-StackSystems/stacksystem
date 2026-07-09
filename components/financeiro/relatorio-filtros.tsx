"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Filter, Download } from "lucide-react"

export function RelatorioFiltros({ de, ate }: { de: string; ate: string }) {
  const router = useRouter()
  const [d, setD] = useState(de)
  const [a, setA] = useState(ate)

  const aplicar = () => router.push(`/painel/financeiro/relatorios?de=${d}&ate=${a}`)

  const inputClass = "bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">De</label>
        <input type="date" value={d} onChange={(e) => setD(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Até</label>
        <input type="date" value={a} onChange={(e) => setA(e.target.value)} className={inputClass} />
      </div>
      <button onClick={aplicar} className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all">
        <Filter size={14} /> Aplicar
      </button>
      <a href={`/api/financeiro/relatorios?de=${d}&ate=${a}&formato=csv`}
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm transition-all ml-auto">
        <Download size={14} /> Exportar CSV
      </a>
    </div>
  )
}
