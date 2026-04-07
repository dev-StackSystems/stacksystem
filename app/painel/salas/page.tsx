import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"
import { Video, Plus } from "lucide-react"
import { SalaCard } from "@/componentes/tabelas/sala-card"
import { SalaFormModal } from "@/componentes/formularios/form-sala"

export const dynamic = "force-dynamic"

export default async function SalasPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session?.user) redirect("/login")

  const isAdmin = session.user.papel === "A"

  const where =
    isAdmin
      ? { ativa: true }
      : { ativa: true, empresaId: session.user.empresaId ?? undefined }

  const salas = await db.sala.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: {
      criadoPor: { select: { nome: true, id: true } },
      empresa: { select: { nome: true } },
    },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Salas de Aula</h1>
          <p className="text-sm text-slate-400 mt-1">Videoconferências em tempo real</p>
        </div>

        <SalaFormModal
          trigger={
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm shadow-orange-200">
              <Plus size={16} />
              Nova Sala
            </button>
          }
        />
      </div>

      {/* Grid de salas */}
      {salas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Video size={28} className="text-slate-300" />
          </div>
          <h3 className="font-serif font-bold text-slate-700 text-lg">Nenhuma sala ativa</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-xs">
            Crie uma nova sala para iniciar videoconferências com sua equipe.
          </p>
          <SalaFormModal
            trigger={
              <button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all">
                <Plus size={16} />
                Criar primeira sala
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salas.map((sala) => (
            <SalaCard
              key={sala.id}
              sala={{
                ...sala,
                criadoEm: sala.criadoEm.toISOString(),
                empresa: sala.empresa ?? null,
              }}
              userId={session.user.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )
}
