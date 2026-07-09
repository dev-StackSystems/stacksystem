import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GerenciarMfa } from "@/components/seguranca/gerenciar-mfa"
import { ShieldCheck } from "lucide-react"

export default async function ContaPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")

  const user = await db.usuario.findUnique({
    where: { id: session.user.id },
    select: { mfaAtivo: true },
  })

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck size={22} className="text-brand-500" /> Segurança da Conta
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Proteja seu acesso com autenticação em dois fatores (2FA)</p>
      </div>

      <GerenciarMfa ativoInicial={user?.mfaAtivo ?? false} />
    </div>
  )
}
