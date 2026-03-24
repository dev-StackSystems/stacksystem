import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"

export default async function SegurancaPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "A") redirect("/dashboard")

  const logs = await db.segurancaUser.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  })

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
          <ShieldCheck size={20} className="text-slate-500" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Segurança</h1>
          <p className="text-sm text-slate-400 mt-0.5">Auditoria de ações dos usuários internos</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">Nenhum registro de auditoria ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ação</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">IP</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3.5">
                    <p className="font-semibold text-slate-800">{log.user.name}</p>
                    <p className="text-xs text-slate-400">{log.user.email}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{log.acao}</span>
                    {log.detalhes && <p className="text-xs text-slate-400 mt-0.5">{log.detalhes}</p>}
                  </td>
                  <td className="px-6 py-3.5 hidden md:table-cell text-slate-500 text-xs">{log.ip ?? "—"}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
