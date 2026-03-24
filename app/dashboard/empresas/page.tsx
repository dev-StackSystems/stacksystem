import { Building2 } from "lucide-react"

export default function EmpresasPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Empresas</h1>
        <p className="text-sm text-slate-400 mt-0.5">Cursinhos e instituições cadastradas</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
          <Building2 size={24} className="text-slate-500" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-800 mb-2">Módulo em desenvolvimento</h2>
        <p className="text-slate-400 text-sm max-w-sm">Cadastro e gerenciamento de empresas parceiras em breve.</p>
      </div>
    </div>
  )
}
