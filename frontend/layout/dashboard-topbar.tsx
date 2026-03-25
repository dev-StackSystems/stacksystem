"use client"
import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  A: "Administrador",
  T: "Técnico",
  F: "Corpo Docente",
}

export function TopBar() {
  const { data: session } = useSession()
  const user = session?.user
  const initial = user?.name?.charAt(0).toUpperCase() ?? "U"
  const roleLabel = ROLE_LABELS[user?.role ?? ""] ?? user?.role ?? ""

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Espaço para o botão hamburger no mobile */}
      <div className="w-8 lg:hidden" />

      <div className="flex-1">
        <p className="text-xs text-slate-400">Bem-vindo à plataforma StackSystems</p>
      </div>

      <button className="relative text-slate-400 hover:text-slate-700 transition-colors p-2">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
      </button>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold select-none">
          {initial}
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-semibold text-slate-800 leading-none">{user?.name ?? "..."}</div>
          <div className="text-xs text-slate-400 mt-0.5">{roleLabel}</div>
        </div>
      </div>
    </header>
  )
}
