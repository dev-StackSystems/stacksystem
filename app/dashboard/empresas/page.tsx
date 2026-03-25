import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { EmpresaTable } from "@/frontend/tables/empresa-data-table"
import { EmpresaFormModal } from "@/frontend/modals/empresa-form-modal"
import { Plus } from "lucide-react"

export default async function EmpresasPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  // Apenas admin do sistema pode gerenciar empresas contratantes
  if (session.user.role !== UserRole.A) redirect("/dashboard")

  const isAdmin = true

  const empresas = await db.empresa.findMany({
    orderBy: { nome: "asc" },
    include: {
      _count: { select: { cursos: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Empresas</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestão das empresas parceiras e contratantes
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

      <EmpresaTable empresas={empresas} isAdmin={isAdmin} />
    </div>
  )
}
