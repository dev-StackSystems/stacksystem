"use client"
import { useState } from "react"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, Settings, LogOut, X, Menu,
  GraduationCap, BookOpen, Layers, Play, DollarSign,
  Award, Building2, ShieldCheck, Video, Briefcase, UsersRound,
} from "lucide-react"
import { SidebarNavLink } from "./dashboard-sidebar-nav-link"

type NavItem = { icon: typeof LayoutDashboard; label: string; href: string; moduleKey?: string }
type NavGroup = { label: string | null; items: NavItem[] }

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }],
  },
  {
    label: "Acadêmico",
    items: [
      { icon: GraduationCap, label: "Alunos",     href: "/dashboard/alunos",     moduleKey: "alunos" },
      { icon: BookOpen,      label: "Matrículas", href: "/dashboard/matriculas", moduleKey: "matriculas" },
      { icon: Layers,        label: "Cursos",     href: "/dashboard/cursos",     moduleKey: "cursos" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { icon: Play,  label: "Aulas",         href: "/dashboard/aulas",  moduleKey: "aulas" },
      { icon: Video, label: "Salas de Aula", href: "/dashboard/salas",  moduleKey: "salas" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { icon: DollarSign, label: "Financeiro",   href: "/dashboard/baixas",       moduleKey: "baixas" },
      { icon: Award,      label: "Certificados", href: "/dashboard/certificados", moduleKey: "certificados" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { icon: Building2,   label: "Empresas",      href: "/dashboard/empresas" },
      { icon: Briefcase,   label: "Setores",       href: "/dashboard/setores" },
      { icon: UsersRound,  label: "Grupos",        href: "/dashboard/grupos" },
      { icon: Users,       label: "Usuários",      href: "/dashboard/usuarios" },
      { icon: ShieldCheck, label: "Segurança",     href: "/dashboard/seguranca" },
      { icon: Settings,    label: "Configurações", href: "/dashboard/configuracoes" },
    ],
  },
]

function buildFilteredGroups(role: string, grupoIsAdmin: boolean, modules: string[]): NavGroup[] {
  const result: NavGroup[] = []

  for (const group of ADMIN_GROUPS) {
    if (group.label === "Sistema") {
      if (grupoIsAdmin) {
        result.push({
          label: "Sistema",
          items: [
            { icon: Briefcase,  label: "Setores",  href: "/dashboard/setores" },
            { icon: UsersRound, label: "Grupos",   href: "/dashboard/grupos" },
            { icon: Users,      label: "Usuários", href: "/dashboard/usuarios" },
          ],
        })
      } else if (role === "T") {
        result.push({
          label: "Sistema",
          items: [{ icon: Users, label: "Usuários", href: "/dashboard/usuarios" }],
        })
      }
      continue
    }

    if (group.label === null) { result.push(group); continue }

    const filteredItems = group.items.filter(
      (item) => !item.moduleKey || modules.includes(item.moduleKey)
    )
    if (filteredItems.length > 0) result.push({ label: group.label, items: filteredItems })
  }

  return result
}

interface Props { role: string; grupoIsAdmin: boolean; modules: string[] }

export function Sidebar({ role, grupoIsAdmin, modules }: Props) {
  const [open, setOpen] = useState(false)
  const groups = role === "A" ? ADMIN_GROUPS : buildFilteredGroups(role, grupoIsAdmin, modules)

  return (
    <>
      <button
        className="fixed top-4 left-4 z-40 lg:hidden bg-slate-950 text-white p-2 rounded-xl border border-white/10 shadow"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-950 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-sm font-serif shadow shadow-orange-500/25">
            S
          </div>
          <span className="font-serif text-[15px] font-bold text-white">
            Stack<span className="text-orange-400">Systems</span>
          </span>
          <button className="ml-auto lg:hidden text-white/40 hover:text-white" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <SidebarNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
                ))}
              </div>
            </div>
          ))}
        </nav>

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
