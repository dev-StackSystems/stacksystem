import { DollarSign } from "lucide-react"

export default function BaixasPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Baixas</h1>
        <p className="text-sm text-slate-400 mt-0.5">Controle financeiro e pagamentos</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
          <DollarSign size={24} className="text-teal-500" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-800 mb-2">Módulo em desenvolvimento</h2>
        <p className="text-slate-400 text-sm max-w-sm">Registro e acompanhamento de pagamentos em breve.</p>
      </div>
    </div>
  )
}
