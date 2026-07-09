import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { Sparkles } from "lucide-react"
import { ResumoInteligente } from "@/components/financeiro/resumo-inteligente"

export default async function ResumoPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const empresaId = session.user.empresaId ?? undefined
  const empresa = empresaId
    ? await db.empresa.findUnique({ where: { id: empresaId }, select: { gestaoFinanceira: true } })
    : null
  const gestao: "PF" | "PJ" = empresa?.gestaoFinanceira === "PJ" ? "PJ" : "PF"

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles size={22} className="text-brand-500" /> Análise do Mês
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {gestao === "PF"
            ? "Resumo inteligente das suas finanças pessoais — renda, gastos essenciais x lazer e recomendações"
            : "Resumo inteligente do fluxo do mês com destaques e recomendações"}
        </p>
      </div>

      <ResumoInteligente gestao={gestao} />
    </div>
  )
}
