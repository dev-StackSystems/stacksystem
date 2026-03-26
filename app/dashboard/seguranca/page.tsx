import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { ShieldCheck } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  A: "Admin",
  T: "Técnico",
  F: "Docente",
}

const ROLE_BADGE: Record<string, string> = {
  A: "bg-orange-50 text-orange-600 border-orange-200",
  T: "bg-blue-50 text-blue-600 border-blue-200",
  F: "bg-purple-50 text-purple-600 border-purple-200",
}

const ACAO_BADGE: Record<string, string> = {
  login:       "bg-emerald-50 text-emerald-600 border-emerald-200",
  logout:      "bg-slate-100 text-slate-500 border-slate-200",
  create_user: "bg-blue-50 text-blue-600 border-blue-200",
  edit_user:   "bg-amber-50 text-amber-600 border-amber-200",
  delete_user: "bg-red-50 text-red-600 border-red-200",
}

function acaoBadgeClass(acao: string): string {
  return ACAO_BADGE[acao] ?? "bg-orange-50 text-orange-600 border-orange-200"
}

function acaoLabel(acao: string): string {
  const labels: Record<string, string> = {
    login:       "Login",
    logout:      "Logout",
    create_user: "Criar Usuário",
    edit_user:   "Editar Usuário",
    delete_user: "Remover Usuário",
  }
  return labels[acao] ?? acao
}

export default async function SegurancaPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  // Apenas admin de empresa (role A) ou super admin — Técnico e Docente não têm acesso
  const { isSuperAdmin } = session.user
  const isEmpresaAdmin = session.user.role === UserRole.A
  if (!isSuperAdmin && !isEmpresaAdmin) redirect("/dashboard")

  // Super admin vê todos os logs; admin de empresa vê apenas os da sua empresa
  const where = isSuperAdmin
    ? {}
    : { user: { empresaId: session.user.empresaId ?? "" } }

  const logs = await db.segurancaUser.findMany({
    where,
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-slate-500" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Segurança</h1>
          <p className="text-sm text-slate-400 mt-0.5">Log de auditoria e atividades do sistema</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">
            Nenhum registro de auditoria ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                    Detalhes
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    IP
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Data/Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => {
                  const roleCls = ROLE_BADGE[log.user.role] ?? ROLE_BADGE.F
                  const roleLabel = ROLE_LABELS[log.user.role] ?? log.user.role
                  const acaoCls = acaoBadgeClass(log.acao)

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Usuário */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{log.user.name}</p>
                        <p className="text-xs text-slate-400 mb-1">{log.user.email}</p>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleCls}`}>
                          {roleLabel}
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${acaoCls}`}>
                          {acaoLabel(log.acao)}
                        </span>
                      </td>

                      {/* Detalhes */}
                      <td className="px-6 py-4 hidden lg:table-cell text-xs text-slate-500 max-w-xs">
                        {log.detalhes ? (
                          <span className="line-clamp-2">{log.detalhes}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* IP */}
                      <td className="px-6 py-4 hidden md:table-cell text-xs text-slate-400 font-mono">
                        {log.ip ?? "—"}
                      </td>

                      {/* Data/Hora */}
                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé */}
        {logs.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400">
              {logs.length} registro{logs.length !== 1 ? "s" : ""}
              {logs.length === 200 ? " (últimos 200 exibidos)" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
