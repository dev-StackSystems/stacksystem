import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { CursoTable } from "@/componentes/tabelas/tabela-cursos"
import { CursoFormModal } from "@/componentes/formularios/form-curso"
import { Plus } from "lucide-react"

export default async function CursosPage() {
  const session = await getServerSession(opcoesAuth)

  if (!session) redirect("/login")

  // F (Corpo Docente) não tem acesso à gestão de cursos
  if (session.user.papel === PapelUsuario.F) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const isAdmin = superAdmin

  const [cursos, empresas] = await Promise.all([
    db.cursoDaEmpresa.findMany({
      where: superAdmin ? {} : { empresaId },
      orderBy: { criadoEm: "desc" },
      include: {
        empresa: { select: { nome: true } },
      },
    }),
    superAdmin
      ? db.empresa.findMany({ where: { ativa: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } })
      : [],
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
