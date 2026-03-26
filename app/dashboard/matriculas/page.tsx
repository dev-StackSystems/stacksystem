import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { MatriculaTable } from "@/frontend/tables/matricula-data-table"
import { MatriculaFormModal } from "@/frontend/modals/matricula-form-modal"
import { BookOpen } from "lucide-react"

export default async function MatriculasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  // Apenas Admin e Técnico acessam; Corpo Docente é redirecionado
  if (session.user.role === UserRole.F) redirect("/dashboard")

  const { isSuperAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const isAdmin = isSuperAdmin
  const canEdit = isSuperAdmin || session.user.role === UserRole.A || session.user.role === UserRole.T

  const empresaFilter = isSuperAdmin ? {} : { empCurso: { empresaId } }
  const alunoFilter   = isSuperAdmin ? { ativo: true } : { ativo: true, empresaId }
  const cursoFilter   = isSuperAdmin ? { ativo: true } : { ativo: true, empresaId }

  const [matriculas, alunos, cursos] = await Promise.all([
    db.matricula.findMany({
      where: empresaFilter,
      orderBy: { createdAt: "desc" },
      include: {
        aluno: { select: { nome: true, email: true } },
        empCurso: {
          select: {
            nome: true,
            empresa: { select: { nome: true } },
          },
        },
      },
    }),
    db.aluno.findMany({
      where: alunoFilter,
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    db.empCurso.findMany({
      where: cursoFilter,
      select: {
        id: true,
        nome: true,
        empresa: { select: { nome: true } },
      },
      orderBy: { nome: "asc" },
    }),
  ])

  // Serializa datas para evitar erro de Server Component → Client Component
  const matriculasSerialized = matriculas.map((m) => ({
    ...m,
    valor: m.valor.toString(),
    dataInicio: m.dataInicio.toISOString(),
    dataFim: m.dataFim ? m.dataFim.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={22} className="text-orange-500" />
            Matrículas
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Gestão de matrículas e vínculos aluno-curso</p>
        </div>
        {canEdit && (
          <MatriculaFormModal
            mode="create"
            alunos={alunos}
            cursos={cursos}
            trigger={
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
                <BookOpen size={16} />
                Nova Matrícula
              </button>
            }
          />
        )}
      </div>

      <MatriculaTable
        matriculas={matriculasSerialized}
        alunos={alunos}
        cursos={cursos}
        isAdmin={isAdmin}
        canEdit={canEdit}
      />
    </div>
  )
}
