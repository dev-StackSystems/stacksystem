import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { Users, UserCheck, Shield, UserPlus } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  A: "Administrador",
  T: "Técnico",
  F: "Corpo Docente",
}

const UPCOMING_MODULES = [
  "Alunos", "Professores", "Aulas", "Horários",
  "Planos", "Turnos", "Videoaulas", "Videochamadas",
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  const [totalUsers, activeUsers, adminCount, latestUser] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { active: true } }),
    db.user.count({ where: { role: UserRole.A } }),
    db.user.findFirst({
      orderBy: { createdAt: "desc" },
      select: { name: true, createdAt: true },
    }),
  ])

  const kpis = [
    {
      icon: Users,
      label: "Total de Usuários",
      value: totalUsers.toString(),
      sub: "usuários cadastrados",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      icon: UserCheck,
      label: "Usuários Ativos",
      value: activeUsers.toString(),
      sub: "com acesso habilitado",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      icon: Shield,
      label: "Administradores",
      value: adminCount.toString(),
      sub: "com nível máximo",
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      icon: UserPlus,
      label: "Último Cadastro",
      value: latestUser?.name ?? "—",
      sub: latestUser
        ? new Date(latestUser.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        : "nenhum cadastro",
      color: "bg-orange-50 text-orange-600 border-orange-100",
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
          {ROLE_LABELS[session?.user.role ?? ""] ?? ""} · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpis.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.color}`}>
                <card.icon size={18} />
              </div>
            </div>
            <div className="font-serif text-2xl font-bold text-slate-900 mb-1 truncate">{card.value}</div>
            <div className="text-xs text-slate-400">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Módulos em desenvolvimento */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 md:p-10 flex flex-col items-center text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-3xl mb-5">
          🚧
        </div>
        <h2 className="font-serif text-xl font-bold text-slate-800 mb-2">
          Módulos em desenvolvimento
        </h2>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
          Os módulos do sistema de cursinho aparecerão aqui conforme forem entregues.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {UPCOMING_MODULES.map((mod) => (
            <span
              key={mod}
              className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full"
            >
              {mod}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
