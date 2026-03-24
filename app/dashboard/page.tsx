import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import {
  GraduationCap, BookOpen, Layers, Play,
  DollarSign, Award, Users, TrendingUp,
  CheckCircle2, Clock, XCircle,
} from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  A: "Administrador",
  T: "Técnico",
  F: "Corpo Docente",
}

const STATUS_MATRICULA: Record<string, { label: string; cls: string }> = {
  ativa:     { label: "Ativa",     cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  concluida: { label: "Concluída", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  cancelada: { label: "Cancelada", cls: "bg-red-50 text-red-500 border-red-200" },
}

const STATUS_BAIXA: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  pago:      { label: "Pago",      cls: "text-emerald-600", icon: CheckCircle2 },
  pendente:  { label: "Pendente",  cls: "text-amber-500",   icon: Clock },
  cancelado: { label: "Cancelado", cls: "text-red-500",     icon: XCircle },
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // ── KPIs em paralelo ──────────────────────────────────────
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [
    totalAlunos,
    alunosAtivos,
    totalMatriculas,
    matriculasAtivas,
    totalCursos,
    totalAulas,
    totalCertificados,
    receitaMes,
    totalUsuarios,
    recentMatriculas,
    recentBaixas,
  ] = await Promise.all([
    db.aluno.count(),
    db.aluno.count({ where: { ativo: true } }),
    db.matricula.count(),
    db.matricula.count({ where: { status: "ativa" } }),
    db.empCurso.count({ where: { ativo: true } }),
    db.aula.count({ where: { ativa: true } }),
    db.certificado.count(),
    db.baixa.aggregate({
      _sum: { valor: true },
      where: { status: "pago", dataPag: { gte: inicioMes } },
    }),
    db.user.count({ where: { active: true } }),
    db.matricula.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, valor: true, createdAt: true,
        aluno:    { select: { nome: true, email: true } },
        empCurso: { select: { nome: true } },
      },
    }),
    db.baixa.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, descricao: true, valor: true, tipo: true, status: true, dataPag: true, createdAt: true,
        matricula: { select: { aluno: { select: { nome: true } } } },
      },
    }),
  ])

  const receitaValor = Number(receitaMes._sum.valor ?? 0)

  const kpisRow1 = [
    {
      icon: GraduationCap,
      label: "Alunos Ativos",
      value: alunosAtivos.toString(),
      sub: `${totalAlunos} cadastrados`,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      icon: BookOpen,
      label: "Matrículas Ativas",
      value: matriculasAtivas.toString(),
      sub: `${totalMatriculas} no total`,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      icon: Layers,
      label: "Cursos Ativos",
      value: totalCursos.toString(),
      sub: "disponíveis na plataforma",
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      icon: Play,
      label: "Aulas Cadastradas",
      value: totalAulas.toString(),
      sub: "em todos os cursos",
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
  ]

  const kpisRow2 = [
    {
      icon: DollarSign,
      label: "Receita do Mês",
      value: receitaValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      sub: "baixas pagas este mês",
      color: "bg-teal-50 text-teal-600 border-teal-100",
    },
    {
      icon: Award,
      label: "Certificados",
      value: totalCertificados.toString(),
      sub: "emitidos até hoje",
      color: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      icon: TrendingUp,
      label: "Taxa de Conclusão",
      value: totalMatriculas > 0
        ? `${Math.round(((totalMatriculas - matriculasAtivas) / totalMatriculas) * 100)}%`
        : "—",
      sub: "matrículas finalizadas",
      color: "bg-orange-50 text-orange-600 border-orange-100",
    },
    {
      icon: Users,
      label: "Usuários Internos",
      value: totalUsuarios.toString(),
      sub: "com acesso ativo",
      color: "bg-slate-100 text-slate-600 border-slate-200",
    },
  ]

  return (
    <div>
      {/* Saudação */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-slate-900">
          Olá, {session?.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {ROLE_LABELS[session?.user.role ?? ""] ?? ""} ·{" "}
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </div>

      {/* KPIs — linha 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {kpisRow1.map(card => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* KPIs — linha 2 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpisRow2.map(card => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Tabelas de atividade recente */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Últimas Matrículas */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-slate-800 text-base">Últimas Matrículas</h2>
              <p className="text-xs text-slate-400 mt-0.5">Registros mais recentes</p>
            </div>
            <BookOpen size={16} className="text-slate-300" />
          </div>
          <div className="divide-y divide-slate-50">
            {recentMatriculas.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Nenhuma matrícula ainda.</p>
            ) : (
              recentMatriculas.map(m => {
                const s = STATUS_MATRICULA[m.status] ?? STATUS_MATRICULA.ativa
                return (
                  <div key={m.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {m.aluno.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{m.aluno.nome}</p>
                      <p className="text-xs text-slate-400 truncate">{m.empCurso.nome}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>
                        {s.label}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Últimas Baixas */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-slate-800 text-base">Últimas Baixas</h2>
              <p className="text-xs text-slate-400 mt-0.5">Movimentações financeiras</p>
            </div>
            <DollarSign size={16} className="text-slate-300" />
          </div>
          <div className="divide-y divide-slate-50">
            {recentBaixas.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">Nenhuma baixa ainda.</p>
            ) : (
              recentBaixas.map(b => {
                const s = STATUS_BAIXA[b.status] ?? STATUS_BAIXA.pendente
                const StatusIcon = s.icon
                return (
                  <div key={b.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className={`shrink-0 ${s.cls}`}>
                      <StatusIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {b.matricula?.aluno?.nome ?? b.descricao ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">{b.tipo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-800">
                        {Number(b.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(b.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: typeof GraduationCap
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 leading-snug">{label}</span>
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="font-serif text-2xl font-bold text-slate-900 mb-0.5 truncate">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  )
}
