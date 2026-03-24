import { GraduationCap } from "lucide-react"

export default function AlunosPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Alunos</h1>
        <p className="text-sm text-slate-400 mt-0.5">Gestão de alunos matriculados</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
          <GraduationCap size={24} className="text-blue-500" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-800 mb-2">Módulo em desenvolvimento</h2>
        <p className="text-slate-400 text-sm max-w-sm">Cadastro, busca e gestão completa de alunos em breve.</p>
      </div>
    </div>
  )
}
