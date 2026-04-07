export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { redirect } from "next/navigation"
import { db } from "@/servidor/banco/cliente"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

type CheckResult = { ok: boolean; label: string; value?: string; error?: string }

async function runChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  // ── Variáveis de ambiente ──────────────────────────────
  results.push({
    ok: !!process.env.DATABASE_URL,
    label: "DATABASE_URL definida",
    value: process.env.DATABASE_URL
      ? `...${process.env.DATABASE_URL.slice(-30)}`
      : undefined,
  })

  results.push({
    ok: !!process.env.NEXTAUTH_SECRET,
    label: "NEXTAUTH_SECRET definida",
    value: process.env.NEXTAUTH_SECRET ? "✓ presente" : undefined,
  })

  results.push({
    ok: !!process.env.NEXTAUTH_URL,
    label: "NEXTAUTH_URL definida",
    value: process.env.NEXTAUTH_URL ?? undefined,
  })

  // ── Conexão com o banco ────────────────────────────────
  try {
    await db.$queryRaw`SELECT 1`
    results.push({ ok: true, label: "Conexão com o banco de dados", value: "Conectado com sucesso" })
  } catch (err) {
    results.push({
      ok: false,
      label: "Conexão com o banco de dados",
      error: err instanceof Error ? err.message : String(err),
    })
    return results
  }

  // ── Contagem de registros ──────────────────────────────
  try {
    const [users, alunos, empresas, cursos, matriculas, baixas, certificados] = await Promise.all([
      db.usuario.count(),
      db.aluno.count(),
      db.empresa.count(),
      db.cursoDaEmpresa.count(),
      db.matricula.count(),
      db.baixa.count(),
      db.certificado.count(),
    ])

    results.push({ ok: true, label: "users",        value: `${users} registros` })
    results.push({ ok: true, label: "alunos",       value: `${alunos} registros` })
    results.push({ ok: true, label: "empresas",     value: `${empresas} registros` })
    results.push({ ok: true, label: "emp_cursos",   value: `${cursos} registros` })
    results.push({ ok: true, label: "matriculas",   value: `${matriculas} registros` })
    results.push({ ok: true, label: "baixas",       value: `${baixas} registros` })
    results.push({ ok: true, label: "certificados", value: `${certificados} registros` })
  } catch (err) {
    results.push({
      ok: false,
      label: "Leitura das tabelas",
      error: err instanceof Error ? err.message : String(err),
    })
  }

  return results
}

export default async function DebugPage() {
  const session = await getServerSession(opcoesAuth)
  if (!session || session.user.papel !== "A") redirect("/painel")

  const checks = await runChecks()
  const allOk = checks.every(c => c.ok)

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-mono">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="font-sans font-bold text-lg">
              Stack<span className="text-orange-400">Systems</span>
              <span className="text-slate-500 font-normal text-sm ml-2">/ debug</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm">Diagnóstico de conexão — {new Date().toLocaleString("pt-BR")}</p>
        </div>

        {/* Status geral */}
        <div className={`rounded-2xl border px-5 py-4 mb-6 flex items-center gap-3 ${
          allOk
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {allOk
            ? <CheckCircle2 size={20} />
            : <XCircle size={20} />
          }
          <span className="font-sans font-semibold text-sm">
            {allOk ? "Tudo funcionando corretamente." : "Problemas detectados — veja os itens abaixo."}
          </span>
        </div>

        {/* Checklist */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
          {checks.map((check, i) => (
            <div key={i} className="px-5 py-3.5 flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {check.ok
                  ? <CheckCircle2 size={16} className="text-emerald-400" />
                  : <XCircle size={16} className="text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-300">{check.label}</span>
                {check.value && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{check.value}</p>
                )}
                {check.error && (
                  <p className="text-xs text-red-400 mt-0.5 break-all">{check.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Aviso */}
        <div className="mt-6 flex items-start gap-2 text-amber-500/80">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <p className="text-xs font-sans">
            Esta página é apenas para diagnóstico. Remova ou proteja o acesso em produção após verificar a conexão.
          </p>
        </div>

      </div>
    </div>
  )
}
