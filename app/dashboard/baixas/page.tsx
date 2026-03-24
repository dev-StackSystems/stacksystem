import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { BaixaTable } from "@/components/dashboard/BaixaTable"
import { BaixaFormModal } from "@/components/dashboard/BaixaFormModal"
import { DollarSign } from "lucide-react"

export default async function BaixasPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  // Apenas Admin e Técnico acessam; Corpo Docente é redirecionado
  if (session.user.role === UserRole.F) redirect("/dashboard")

  const isAdmin = session.user.role === UserRole.A
  const canEdit = session.user.role === UserRole.A || session.user.role === UserRole.T

  const [baixas, matriculas] = await Promise.all([
    db.baixa.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        matricula: {
          select: {
            aluno: { select: { nome: true } },
            empCurso: { select: { nome: true } },
          },
        },
      },
    }),
    db.matricula.findMany({
      where: { status: "ativa" },
      select: {
        id: true,
        aluno: { select: { nome: true } },
        empCurso: { select: { nome: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Serializa datas e decimais para Client Components
  const baixasSerialized = baixas.map((b) => ({
    ...b,
    valor: b.valor.toString(),
    dataPag: b.dataPag ? b.dataPag.toISOString() : null,
    dataVenc: b.dataVenc ? b.dataVenc.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign size={22} className="text-orange-500" />
            Baixas
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Controle financeiro e acompanhamento de pagamentos</p>
        </div>
        {canEdit && (
          <BaixaFormModal
            mode="create"
            matriculas={matriculas}
            trigger={
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
                <DollarSign size={16} />
                Nova Baixa
              </button>
            }
          />
        )}
      </div>

      <BaixaTable
        baixas={baixasSerialized}
        matriculas={matriculas}
        isAdmin={isAdmin}
        canEdit={canEdit}
      />
    </div>
  )
}
