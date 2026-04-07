import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { MatriculaTable } from "@/componentes/tabelas/tabela-matriculas"
import { MatriculaFormModal } from "@/componentes/formularios/form-matricula"
import { BookOpen } from "lucide-react"

export default async function MatriculasPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")

  // Apenas Admin e Técnico acessam; Corpo Docente é redirecionado
  if (session.user.papel === PapelUsuario.F) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const isAdmin = superAdmin
  const canEdit = superAdmin || session.user.papel === PapelUsuario.A || session.user.papel === PapelUsuario.T

  const empresaFilter = superAdmin ? {} : { curso: { empresaId } }
  const alunoFilter   = superAdmin ? { ativo: true } : { ativo: true, empresaId }
  const cursoFilter   = superAdmin ? { ativo: true } : { ativo: true, empresaId }

  const [matriculas, alunos, cursos] = await Promise.all([
    db.matricula.findMany({
      where: empresaFilter,
      orderBy: { criadoEm: "desc" },
      include: {
        aluno: { select: { nome: true, email: true } },
        curso: {
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
    db.cursoDaEmpresa.findMany({
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
    criadoEm: m.criadoEm.toISOString(),
    atualizadoEm: m.atualizadoEm.toISOString(),
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
