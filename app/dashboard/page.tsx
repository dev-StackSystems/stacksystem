"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  LayoutDashboard, Settings, LogOut, Menu, X,
  TrendingUp, Users, ShoppingCart, DollarSign, Bell,
} from "lucide-react"

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/dashboard" },
  { icon: TrendingUp,      label: "Relatórios",  href: "#" },
  { icon: Users,           label: "Usuários",    href: "#" },
  { icon: ShoppingCart,    label: "Pedidos",     href: "#" },
  { icon: Settings,        label: "Configurações", href: "#" },
]

const CARDS = [
  { icon: DollarSign, label: "Receita do Mês",  value: "R$ 0,00",  change: "—",   up: true,  color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { icon: ShoppingCart, label: "Pedidos",        value: "0",        change: "—",   up: true,  color: "bg-blue-50 text-blue-600 border-blue-100" },
  { icon: Users,       label: "Clientes Ativos", value: "0",        change: "—",   up: true,  color: "bg-purple-50 text-purple-600 border-purple-100" },
  { icon: TrendingUp,  label: "Crescimento",     value: "—",        change: "—",   up: true,  color: "bg-orange-50 text-orange-600 border-orange-100" },
]

const ease = [0.22, 1, 0.36, 1] as const

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [active, setActive] = useState("Dashboard")

  const handleLogout = () => router.push("/")

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">

      {/* ── Sidebar ─────────────────────────────── */}
      <>
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-950 flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Logo */}
          <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-sm font-serif shadow shadow-orange-500/25">
              S
            </div>
            <span className="font-serif text-[15px] font-bold text-white">
              Stack<span className="text-orange-400">Systems</span>
            </span>
            <button className="ml-auto lg:hidden text-white/40 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
              <button
                key={label}
                onClick={() => { setActive(label); setSidebarOpen(false) }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
                  active === label
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                    : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-white/[0.06]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
            >
              <LogOut size={17} />
              Sair
            </button>
          </div>
        </aside>
      </>

      {/* ── Main ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-800 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1">
            <h1 className="font-serif text-lg font-bold text-slate-900">Dashboard</h1>
            <p className="text-xs text-slate-400 -mt-0.5">Bem-vindo à plataforma StackSystems</p>
          </div>

          <button className="relative text-slate-400 hover:text-slate-700 transition-colors p-2">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
              U
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-slate-800 leading-none">Usuário</div>
              <div className="text-xs text-slate-400 mt-0.5">Administrador</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8">

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {CARDS.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.07, ease }}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">{card.label}</span>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.color}`}>
                    <card.icon size={18} />
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-slate-900 mb-1">{card.value}</div>
                <div className="text-xs text-slate-400">{card.change}</div>
              </motion.div>
            ))}
          </div>

          {/* Placeholder area */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease }}
            className="bg-white border border-slate-100 rounded-2xl p-8 md:p-12 flex flex-col items-center text-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-3xl mb-5">
              🚧
            </div>
            <h2 className="font-serif text-xl font-bold text-slate-800 mb-2">
              Sistema em desenvolvimento
            </h2>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
              Esta área está sendo construída. Os módulos do seu sistema aparecerão aqui conforme forem entregues.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Financeiro", "Estoque", "Relatórios", "CRM", "RH"].map(mod => (
                <span
                  key={mod}
                  className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full"
                >
                  {mod}
                </span>
              ))}
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  )
}
