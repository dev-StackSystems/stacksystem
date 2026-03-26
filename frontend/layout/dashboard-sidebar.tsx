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

// Template com todos os módulos acadêmicos — usado para filtragem
const MODULE_GROUPS: NavGroup[] = [
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
]

// Nav exclusiva do admin do sistema (UserRole.A)
const SYSTEM_ADMIN_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }],
  },
  {
    label: "Sistema",
    items: [
      { icon: Building2,   label: "Empresas",      href: "/dashboard/empresas" },
      { icon: Users,       label: "Usuários",      href: "/dashboard/usuarios" },
      { icon: ShieldCheck, label: "Segurança",     href: "/dashboard/seguranca" },
      { icon: Settings,    label: "Configurações", href: "/dashboard/configuracoes" },
    ],
  },
]

function buildFilteredGroups(role: string, grupoIsAdmin: boolean, modules: string[]): NavGroup[] {
  const result: NavGroup[] = []

  for (const group of MODULE_GROUPS) {
    if (group.label === null) { result.push(group); continue }
    const filteredItems = group.items.filter(
      (item) => !item.moduleKey || modules.includes(item.moduleKey)
    )
    if (filteredItems.length > 0) result.push({ label: group.label, items: filteredItems })
  }

  if (grupoIsAdmin) {
    result.push({
      label: "Sistema",
      items: [
        { icon: Briefcase,  label: "Setores",       href: "/dashboard/setores" },
        { icon: UsersRound, label: "Grupos",        href: "/dashboard/grupos" },
        { icon: Users,      label: "Usuários",      href: "/dashboard/usuarios" },
        { icon: Settings,   label: "Configurações", href: "/dashboard/configuracoes" },
      ],
    })
  } else if (role === "T") {
    result.push({
      label: "Sistema",
      items: [{ icon: Users, label: "Usuários", href: "/dashboard/usuarios" }],
    })
  }

  return result
}

interface Brand {
  cor: string | null
  logo: string | null
  nome: string
  nomeSistema?: string | null
}

interface Props {
  role: string
  grupoIsAdmin: boolean
  modules: string[]
  brand?: Brand | null
}

export function Sidebar({ role, grupoIsAdmin, modules, brand }: Props) {
  const [open, setOpen] = useState(false)
  const groups = role === "A" ? SYSTEM_ADMIN_GROUPS : buildFilteredGroups(role, grupoIsAdmin, modules)
  const brandColor = brand?.cor || "#f97316"
  const isDefaultBrand = !brand

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
        {/* Header com logo/ícone da empresa */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
          {brand?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logo}
              alt={brand.nome}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm font-serif shadow"
              style={
                isDefaultBrand
                  ? { background: "linear-gradient(135deg, #fb923c, #ea580c)" }
                  : { background: `linear-gradient(135deg, ${brandColor}cc, ${brandColor})` }
              }
            >
              {brand ? brand.nome.charAt(0).toUpperCase() : "S"}
            </div>
          )}
          <span className="font-serif text-[15px] font-bold text-white truncate">
            {brand ? (
              brand.nomeSistema || brand.nome
            ) : (
              <>Stack<span style={{ color: brandColor }}>Systems</span></>
            )}
          </span>
          <button className="ml-auto lg:hidden text-white/40 hover:text-white shrink-0" onClick={() => setOpen(false)}>
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
                  <SidebarNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    brandColor={brandColor}
                  />
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
