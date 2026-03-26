"use client"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Settings, LogOut, User } from "lucide-react"

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

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="w-8 lg:hidden" />

      <div className="flex-1">
        <p className="text-xs text-slate-400">Bem-vindo à plataforma StackSystems</p>
      </div>

      {/* Perfil com dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
            {initial}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-none">{user?.name ?? "..."}</div>
            <div className="text-xs text-slate-400 mt-0.5">{roleLabel}</div>
          </div>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-20">
            {/* Cabeçalho */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>

            <div className="p-1.5">
              <Link
                href="/dashboard/configuracoes"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={15} className="text-slate-400" />
                Configurações
              </Link>

              <Link
                href="/dashboard/usuarios"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User size={15} className="text-slate-400" />
                Meu Perfil
              </Link>
            </div>

            <div className="p-1.5 border-t border-slate-100">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
