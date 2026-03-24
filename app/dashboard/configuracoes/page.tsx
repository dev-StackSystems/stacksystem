import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "A") redirect("/dashboard")

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-400 mt-0.5">Configurações gerais da empresa e da plataforma</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
          <Settings size={24} className="text-slate-400" />
        </div>
        <h2 className="font-serif text-lg font-bold text-slate-800 mb-2">Em breve</h2>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
          As configurações da empresa, como nome, logo, CNPJ e regras de acesso, estarão disponíveis nesta seção.
        </p>
      </div>
    </div>
  )
}
