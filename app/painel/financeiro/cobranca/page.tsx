import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { AlertCircle, Clock, Phone } from "lucide-react"

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default async function CobrancaPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session) redirect("/login")
  if (session.user.papel === PapelUsuario.F && !session.user.superAdmin) redirect("/painel")

  const { superAdmin } = session.user
  const empresaId = session.user.empresaId ?? undefined
  const escopo = superAdmin ? {} : { empresaId }

  const hoje = new Date()
  const empresa = empresaId ? await db.empresa.findUnique({ where: { id: empresaId }, select: { gestaoFinanceira: true } }) : null
  const ehPessoal = empresa?.gestaoFinanceira === "PF"

  const vencidos = await db.lancamentoFinanceiro.findMany({
    where: { ...escopo, tipo: "receita", status: "pendente", dataVencimento: { lt: hoje } },
    orderBy: { dataVencimento: "asc" },
    include: { contato: { select: { nome: true, telefone: true } } },
  })

  const diasAtraso = (d: Date | null) => (d ? Math.floor((hoje.getTime() - new Date(d).getTime()) / 86_400_000) : 0)

  const linhas = vencidos.map((l) => ({
    id: l.id,
    descricao: l.descricao,
    nome: l.contato?.nome ?? "—",
    telefone: l.contato?.telefone ?? null,
    valor: Number(l.valor),
    dias: diasAtraso(l.dataVencimento),
    venc: l.dataVencimento,
  }))

  const somar = (fn: (dias: number) => boolean) => linhas.filter((l) => fn(l.dias)).reduce((s, l) => s + l.valor, 0)
  const buckets = {
    b1: somar((d) => d <= 15),
    b2: somar((d) => d > 15 && d <= 30),
    b3: somar((d) => d > 30 && d <= 60),
    b4: somar((d) => d > 60),
  }
  const total = linhas.reduce((s, l) => s + l.valor, 0)

  const faixas = [
    { label: "1–15 dias",  valor: buckets.b1, cor: "bg-amber-50 text-amber-600 border-amber-100" },
    { label: "16–30 dias", valor: buckets.b2, cor: "bg-orange-50 text-orange-600 border-orange-100" },
    { label: "31–60 dias", valor: buckets.b3, cor: "bg-red-50 text-red-600 border-red-100" },
    { label: "60+ dias",   valor: buckets.b4, cor: "bg-red-100 text-red-700 border-red-200" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle size={22} className="text-brand-500" /> {ehPessoal ? "Contas Vencidas" : "Cobrança"}
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {ehPessoal ? "Lembretes de recebimentos em atraso" : "Régua de cobrança — recebíveis vencidos por faixa de atraso"}
        </p>
      </div>

      {/* Resumo por faixa de atraso */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {faixas.map((f) => (
          <div key={f.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{f.label}</span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${f.cor}`}><Clock size={15} /></div>
            </div>
            <div className="font-serif text-lg font-bold text-slate-900 valor-sensivel">{brl(f.valor)}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Total vencido: <span className="font-semibold text-red-600 valor-sensivel">{brl(total)}</span> · {linhas.length} título(s) em atraso
      </p>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {linhas.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">Nada vencido. Em dia! 🎉</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{ehPessoal ? "Origem" : "Cliente"}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Descrição</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Vencimento</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Atraso</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {linhas.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-slate-700">{l.nome}</p>
                      {l.telefone && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={10} />{l.telefone}</p>}
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell text-slate-500">{l.descricao}</td>
                    <td className="px-6 py-3.5 text-slate-500">{l.venc ? new Date(l.venc).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${l.dias > 60 ? "bg-red-100 text-red-700" : l.dias > 30 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{l.dias} dias</span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-red-500 valor-sensivel">{brl(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
