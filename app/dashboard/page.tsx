import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import {
  GraduationCap, BookOpen, Layers, Play,
  DollarSign, Award, Users, TrendingUp,
  CheckCircle2, Clock, XCircle,
} from "lucide-react"
import { TIPOS_SISTEMA } from "@/lib/sistemas"

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

// ────────────────────────────────────────────────────────
// Anúncio JSON shape
// ────────────────────────────────────────────────────────
interface Anuncio {
  titulo: string
  texto: string
  cor?: string
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user.role ?? ""
  const empresaId = session?.user.empresaId ?? null
  const isAdmin = role === UserRole.A

  // ── Dados da empresa (quando o usuário tem empresa vinculada) ──
  let empresa: {
    nome: string
    cor: string | null
    logo: string | null
    banner: string | null
    tipoSistema: string | null
    descricao: string | null
    anuncios: string | null
  } | null = null

  if (empresaId) {
    empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        nome: true,
        cor: true,
        logo: true,
        banner: true,
        tipoSistema: true,
        descricao: true,
        anuncios: true,
      },
    })
  }

  const tipoInfo = empresa?.tipoSistema
    ? TIPOS_SISTEMA.find((t) => t.key === empresa!.tipoSistema)
    : null

  let anunciosList: Anuncio[] = []
  if (empresa?.anuncios) {
    try {
      anunciosList = JSON.parse(empresa.anuncios) as Anuncio[]
    } catch {
      anunciosList = []
    }
  }

  // ── KPIs em paralelo (filtrados por empresa se necessário) ──
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  // Admin global: sem filtro. Outros: filtrar pelos cursos da empresa
  const empresaFilter = !isAdmin && empresaId
    ? { empCurso: { empresaId } }
    : undefined
  const cursoFilter = !isAdmin && empresaId
    ? { empresaId }
    : undefined

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
    db.matricula.count({ where: empresaFilter }),
    db.matricula.count({ where: { ...empresaFilter, status: "ativa" } }),
    db.empCurso.count({ where: { ...cursoFilter, ativo: true } }),
    db.aula.count({ where: { ativa: true } }),
    db.certificado.count({ where: cursoFilter ? { empCurso: cursoFilter } : undefined }),
    db.baixa.aggregate({
      _sum: { valor: true },
      where: {
        status: "pago",
        dataPag: { gte: inicioMes },
        ...(empresaFilter ? { matricula: empresaFilter } : {}),
      },
    }),
    db.user.count({ where: { active: true, ...(empresaId && !isAdmin ? { empresaId } : {}) } }),
    db.matricula.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: empresaFilter,
      select: {
        id: true, status: true, valor: true, createdAt: true,
        aluno:    { select: { nome: true, email: true } },
        empCurso: { select: { nome: true } },
      },
    }),
    db.baixa.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      where: empresaFilter ? { matricula: empresaFilter } : undefined,
      select: {
        id: true, descricao: true, valor: true, tipo: true, status: true, dataPag: true, createdAt: true,
        matricula: { select: { aluno: { select: { nome: true } } } },
      },
    }),
  ])

  const receitaValor = Number(receitaMes._sum.valor ?? 0)
  const corEmpresa = empresa?.cor ?? "#f97316"

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
      {/* ── Banner / Header da empresa ── */}
      {empresa ? (
        <div className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
          {/* Banner */}
          {empresa.banner ? (
            <div className="relative h-36 md:h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={empresa.banner}
                alt={`Banner ${empresa.nome}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 flex items-end gap-4">
                {empresa.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={empresa.logo}
                    alt={empresa.nome}
                    className="w-14 h-14 rounded-xl border-2 border-white/80 object-cover shrink-0 shadow-lg"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-serif text-xl font-bold text-white drop-shadow">
                      {empresa.nome}
                    </h1>
                    {tipoInfo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                        {tipoInfo.emoji} {tipoInfo.label}
                      </span>
                    )}
                  </div>
                  {empresa.descricao && (
                    <p className="text-xs text-white/80 mt-0.5 truncate">{empresa.descricao}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Sem banner: degradê com a cor da empresa */
            <div
              className="px-6 py-6 flex items-center gap-4"
              style={{
                background: `linear-gradient(135deg, ${corEmpresa}22, ${corEmpresa}44)`,
                borderBottom: `3px solid ${corEmpresa}`,
              }}
            >
              {empresa.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={empresa.logo}
                  alt={empresa.nome}
                  className="w-14 h-14 rounded-xl border border-white shadow-sm object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm"
                  style={{ background: corEmpresa }}
                >
                  {empresa.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-xl font-bold text-slate-900">
                    {empresa.nome}
                  </h1>
                  {tipoInfo && (
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                      style={{
                        background: `${corEmpresa}18`,
                        color: corEmpresa,
                        borderColor: `${corEmpresa}44`,
                      }}
                    >
                      {tipoInfo.emoji} {tipoInfo.label}
                    </span>
                  )}
                </div>
                {empresa.descricao && (
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{empresa.descricao}</p>
                )}
              </div>

              {/* Saudação inline (sem banner) */}
              <div className="ml-auto text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">
                  Olá, {session?.user.name?.split(" ")[0]}
                </p>
                <p className="text-xs text-slate-400">
                  {ROLE_LABELS[role] ?? ""} ·{" "}
                  {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                </p>
              </div>
            </div>
          )}

          {/* Saudação abaixo do banner (quando tem banner) */}
          {empresa.banner && (
            <div className="px-6 py-3 bg-white flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Olá, <span className="font-semibold text-slate-800">{session?.user.name?.split(" ")[0]}</span>
                {" "} — {ROLE_LABELS[role] ?? ""}
              </p>
              <p className="text-xs text-slate-400">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Admin global sem empresa — saudação padrão */
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-slate-900">
            Olá, {session?.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {ROLE_LABELS[role] ?? ""} ·{" "}
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>
      )}

      {/* ── Anúncios / Avisos da empresa ── */}
      {anunciosList.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {anunciosList.map((a, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-3 border text-sm"
              style={{
                background: a.cor ? `${a.cor}12` : "#fff7ed",
                borderColor: a.cor ? `${a.cor}44` : "#fed7aa",
                color: a.cor ?? "#c2410c",
              }}
            >
              {a.titulo && (
                <span className="font-bold mr-2">{a.titulo}:</span>
              )}
              {a.texto}
            </div>
          ))}
        </div>
      )}

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
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: `linear-gradient(135deg, ${corEmpresa}bb, ${corEmpresa})` }}
                    >
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
