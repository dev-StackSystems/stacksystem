import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { redirect } from "next/navigation"
import { AlunoTable } from "@/componentes/tabelas/tabela-alunos"
import { AlunoFormModal } from "@/componentes/formularios/form-aluno"
import { UserPlus } from "lucide-react"

export default async function AlunosPage() {
  const session = await getServerSession(opcoesAuth)

  if (!session) redirect("/login")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const whereAluno = superAdmin ? {} : { empresaId }

  const [alunos, empresas] = await Promise.all([
    db.aluno.findMany({
      where: whereAluno,
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        dataNasc: true,
        ativo: true,
        criadoEm: true,
        _count: { select: { matriculas: true } },
      },
      orderBy: { criadoEm: "desc" },
    }),
    superAdmin
      ? db.empresa.findMany({ where: { ativa: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } })
      : [],
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Alunos</h1>
          <p className="text-sm text-slate-400 mt-0.5">Cadastro e gestão de alunos matriculados</p>
        </div>
        <AlunoFormModal
          mode="create"
          empresas={empresas}
          isSystemAdmin={superAdmin}
          trigger={
            <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
              <UserPlus size={16} />
              Novo Aluno
            </button>
          }
        />
      </div>

      <AlunoTable alunos={alunos} isAdmin={superAdmin} />
    </div>
  )
}
