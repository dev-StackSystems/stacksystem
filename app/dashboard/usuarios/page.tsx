import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { UserTable } from "@/components/dashboard/UserTable"
import { UserFormModal } from "@/components/dashboard/UserFormModal"
import { UserPlus } from "lucide-react"

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  // F (Corpo Docente) não tem acesso
  if (session.user.role === UserRole.F) redirect("/dashboard")

  const isAdmin = session.user.role === UserRole.A

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      phone: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

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
            trigger={
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
                <UserPlus size={16} />
                Novo Usuário
              </button>
            }
          />
        )}
      </div>

      <UserTable users={users} isAdmin={isAdmin} />
    </div>
  )
}
