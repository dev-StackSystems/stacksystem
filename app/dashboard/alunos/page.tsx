import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { AlunoTable } from "@/frontend/tables/aluno-data-table"
import { AlunoFormModal } from "@/frontend/modals/aluno-form-modal"
import { UserPlus } from "lucide-react"

export default async function AlunosPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  const isAdmin = session.user.role === UserRole.A

  const alunos = await db.aluno.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      telefone: true,
      dataNasc: true,
      ativo: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Alunos</h1>
          <p className="text-sm text-slate-400 mt-0.5">Cadastro e gestão de alunos matriculados</p>
        </div>
        <AlunoFormModal
          mode="create"
          trigger={
            <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
              <UserPlus size={16} />
              Novo Aluno
            </button>
          }
        />
      </div>

      <AlunoTable alunos={alunos} isAdmin={isAdmin} />
    </div>
  )
}
