import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { UserTable } from "@/frontend/tables/user-data-table"
import { UserFormModal } from "@/frontend/modals/user-form-modal"
import { UserPlus } from "lucide-react"

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  // F (Corpo Docente) não tem acesso
  if (session.user.role === UserRole.F) redirect("/dashboard")

  const isAdmin = session.user.role === UserRole.A

  const empresaWhere = isAdmin ? { ativa: true } : { id: session.user.empresaId ?? "", ativa: true }

  const [users, empresas, setores, grupos] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        active: true,
        createdAt: true,
        empresaId: true,
        setorId: true,
        grupoId: true,
        empresa: { select: { nome: true } },
        setor: { select: { nome: true } },
        grupo: { select: { nome: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.empresa.findMany({
      where: empresaWhere,
      select: { id: true, nome: true, tipoSistema: true, cor: true },
      orderBy: { nome: "asc" },
    }),
    db.setor.findMany({
      where: { ativo: true, ...(isAdmin ? {} : { empresaId: session.user.empresaId ?? undefined }) },
      select: { id: true, nome: true, empresaId: true },
      orderBy: { nome: "asc" },
    }),
    db.grupo.findMany({
      where: { ativo: true, ...(isAdmin ? {} : { empresaId: session.user.empresaId ?? undefined }) },
      select: { id: true, nome: true, empresaId: true },
      orderBy: { nome: "asc" },
    }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gestão de usuários internos da plataforma</p>
        </div>
        {isAdmin && (
          <UserFormModal
            mode="create"
            empresas={empresas}
            setores={setores}
            grupos={grupos}
            trigger={
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
                <UserPlus size={16} />
                Novo Usuário
              </button>
            }
          />
        )}
      </div>

      <UserTable users={users} isAdmin={isAdmin} empresas={empresas} setores={setores} grupos={grupos} />
    </div>
  )
}
