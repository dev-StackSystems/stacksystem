import { BookOpen } from "lucide-react"

export default function MatriculasPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Matrículas</h1>
        <p className="text-sm text-slate-400 mt-0.5">Gestão de matrículas e vínculos aluno-curso</p>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
          <BookOpen size={24} className="text-emerald-500" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-800 mb-2">Módulo em desenvolvimento</h2>
        <p className="text-slate-400 text-sm max-w-sm">Criação e acompanhamento de matrículas em breve.</p>
      </div>
    </div>
  )
}
