import { db } from "@/backend/database/prisma-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/backend/auth/nextauth-config"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Database, Info, KeyRound, ShieldCheck, Users } from "lucide-react"

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.role !== "A") redirect("/dashboard")

  // Testa conexão com o banco
  let dbConectado = false
  try {
    await db.$queryRaw`SELECT 1`
    dbConectado = true
  } catch {
    dbConectado = false
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-400 mt-0.5">Configurações gerais da plataforma</p>
      </div>

      {/* Seção 1 — Informações do Sistema */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Info size={15} className="text-slate-400" />
          <h2 className="font-serif text-base font-bold text-slate-800">Informações do Sistema</h2>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Nome do sistema" value="StackSystems" />
            <InfoRow label="Versão" value="1.0.0" />
            <InfoRow
              label="Ambiente"
              value={process.env.NODE_ENV ?? "—"}
              valueClass={
                process.env.NODE_ENV === "production"
                  ? "text-emerald-600 font-semibold"
                  : "text-amber-600 font-semibold"
              }
            />
            <InfoRow label="URL" value={process.env.NEXTAUTH_URL ?? "—"} mono />
          </dl>
        </div>
      </div>

      {/* Seção 2 — Banco de Dados */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Database size={15} className="text-slate-400" />
          <h2 className="font-serif text-base font-bold text-slate-800">Banco de Dados</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                dbConectado ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                dbConectado ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {dbConectado ? "Conectado" : "Erro de conexão"}
            </span>
            <span className="text-xs text-slate-400">
              {dbConectado
                ? "PostgreSQL (Neon) respondendo normalmente"
                : "Não foi possível alcançar o banco de dados"}
            </span>
          </div>
        </div>
      </div>

      {/* Seção 3 — Contas de Acesso */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <KeyRound size={15} className="text-slate-400" />
          <h2 className="font-serif text-base font-bold text-slate-800">Contas de Acesso</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-slate-500 leading-relaxed">
            Para redefinir senhas ou criar novos usuários, acesse a seção{" "}
            <span className="font-semibold text-slate-700">Usuários</span>.
          </p>
          <Link
            href="/dashboard/usuarios"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200 shrink-0"
          >
            <Users size={15} />
            Ir para Usuários
          </Link>
        </div>
      </div>

      {/* Seção 4 — Segurança */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <ShieldCheck size={15} className="text-slate-400" />
          <h2 className="font-serif text-base font-bold text-slate-800">Segurança</h2>
        </div>
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-slate-500 leading-relaxed">
            Para visualizar o log de atividades e auditoria, acesse a seção{" "}
            <span className="font-semibold text-slate-700">Segurança</span>.
          </p>
          <Link
            href="/dashboard/seguranca"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0"
          >
            <ShieldCheck size={15} />
            Ir para Segurança
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Componente auxiliar ────────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  mono = false,
  valueClass,
}: {
  label: string
  value: string
  mono?: boolean
  valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</dt>
      <dd
        className={`text-sm text-slate-800 ${mono ? "font-mono" : ""} ${valueClass ?? ""}`}
      >
        {value}
      </dd>
    </div>
  )
}
