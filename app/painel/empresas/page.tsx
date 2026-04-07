import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { redirect } from "next/navigation"
import { EmpresaTable } from "@/componentes/tabelas/tabela-empresas"
import { EmpresaFormModal } from "@/componentes/formularios/form-empresa"
import { Plus } from "lucide-react"

export default async function EmpresasPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")

  // Apenas o super admin (desenvolvedor/i3) gerencia a lista de empresas contratantes
  if (!session.user.superAdmin) redirect("/painel")

  const empresas = await db.empresa.findMany({
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { cursos: true, usuarios: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestão das empresas contratantes da plataforma
          </p>
        </div>

        <EmpresaFormModal
          mode="create"
          trigger={
            <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
              <Plus size={16} />
              Nova Empresa
            </button>
          }
        />
      </div>

      <EmpresaTable empresas={empresas} isAdmin={true} />
    </div>
  )
}
