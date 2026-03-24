import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { CursoTable } from "@/components/dashboard/CursoTable"
import { CursoFormModal } from "@/components/dashboard/CursoFormModal"
import { Plus } from "lucide-react"

export default async function CursosPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  // F (Corpo Docente) não tem acesso à gestão de cursos
  if (session.user.role === UserRole.F) redirect("/dashboard")

  const isAdmin = session.user.role === UserRole.A

  const [cursos, empresas] = await Promise.all([
    db.empCurso.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        empresa: { select: { nome: true } },
      },
    }),
    db.empresa.findMany({
      where: { ativa: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Cursos</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Cursos cadastrados por empresa
          </p>
        </div>

        <CursoFormModal
          mode="create"
          empresas={empresas}
          trigger={
            <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
              <Plus size={16} />
              Novo Curso
            </button>
          }
        />
      </div>

      <CursoTable cursos={cursos} empresas={empresas} isAdmin={isAdmin} />
    </div>
  )
}
