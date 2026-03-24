"use client"
import { useState } from "react"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Users, Settings, LogOut, X, Menu } from "lucide-react"
import { SidebarNavLink } from "./SidebarNavLink"

const NAV_BY_ROLE: Record<string, { icon: typeof LayoutDashboard; label: string; href: string }[]> = {
  A: [
    { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard" },
    { icon: Users,           label: "Usuários",       href: "/dashboard/usuarios" },
    { icon: Settings,        label: "Configurações",  href: "/dashboard/configuracoes" },
  ],
  T: [
    { icon: LayoutDashboard, label: "Dashboard",  href: "/dashboard" },
    { icon: Users,           label: "Usuários",   href: "/dashboard/usuarios" },
  ],
  F: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  ],
}

interface Props {
  role: string
}

export function Sidebar({ role }: Props) {
  const [open, setOpen] = useState(false)
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.F

  return (
    <>
      {/* Botão hamburger — mobile */}
      <button
        className="fixed top-4 left-4 z-40 lg:hidden bg-slate-950 text-white p-2 rounded-xl border border-white/10 shadow"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-950 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
          <button
            className="ml-auto lg:hidden text-white/40 hover:text-white"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
