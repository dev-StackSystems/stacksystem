import { Layers } from "lucide-react"

export default function CursosPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Cursos</h1>
        <p className="text-sm text-slate-400 mt-0.5">Cursos cadastrados por empresa</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4">
          <Layers size={24} className="text-purple-500" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-800 mb-2">Módulo em desenvolvimento</h2>
        <p className="text-slate-400 text-sm max-w-sm">Criação e gerenciamento de cursos e módulos em breve.</p>
      </div>
    </div>
  )
}
