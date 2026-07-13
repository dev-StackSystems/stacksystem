/**
 * componentes/layout/barra-lateral.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Barra lateral (sidebar) — navegação organizada por SISTEMA, em accordion.
 *
 *   - Cada "sistema" (Acadêmico, Barbearia, Financeiro, Empresa) é uma seção
 *     recolhível: clicar no sistema abre os módulos disponíveis dele.
 *   - Um sistema só aparece se a empresa tiver ≥1 módulo ativo dele.
 *   - O sistema da rota atual já abre expandido; accordion abre um por vez.
 *   - superAdmin vê a navegação da plataforma (lista simples).
 *
 * Em telas pequenas a sidebar abre via botão hamburguer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { motion, AnimatePresence } from "motion/react"
import {
  LayoutDashboard, Users, Settings, LogOut, X, Menu, ChevronDown, Puzzle,
  GraduationCap, BookOpen, Layers, DollarSign,
  Award, Building2, ShieldCheck, Video, Briefcase, UsersRound,
  Wallet, ArrowRightLeft, Contact, Landmark, Tags, Target, FileBarChart, RefreshCw, PiggyBank,
  ClipboardCheck, BellRing, Sparkles, Scissors, CalendarDays, UserCog,
} from "lucide-react"
import { LinkNavLateral } from "./link-nav-lateral"
import type { ModuloCustom } from "@/lib/auth-helpers"

// ── Tipos ───────────────────────────────────────────────────────────────────

type LucideIcon = typeof LayoutDashboard
type ItemNav = { icone: LucideIcon; rotulo: string; href: string; modulo?: string; exato?: boolean }
type SistemaNav = { chave: string; titulo: string; icone: LucideIcon; itens: ItemNav[] }

// ── Catálogo de sistemas (todos os itens possíveis, com seu gate de módulo) ──
// A ordem prioriza a Barbearia. Cada sistema só é exibido se tiver item ativo.

const SISTEMAS: SistemaNav[] = [
  {
    chave: "barbearia", titulo: "Barbearia", icone: Scissors,
    itens: [
      { icone: Scissors,     rotulo: "Painel",   href: "/painel/barbeiro",          modulo: "barbeiro", exato: true },
      { icone: CalendarDays, rotulo: "Agenda",   href: "/painel/barbeiro/agenda",   modulo: "barbeiro_agenda" },
      { icone: Users,        rotulo: "Clientes", href: "/painel/barbeiro/clientes", modulo: "barbeiro_clientes" },
      { icone: Tags,         rotulo: "Serviços", href: "/painel/barbeiro/servicos", modulo: "barbeiro_servicos" },
      { icone: UserCog,      rotulo: "Equipe",   href: "/painel/barbeiro/equipe",   modulo: "barbeiro_equipe" },
    ],
  },
  {
    chave: "academico", titulo: "Acadêmico", icone: GraduationCap,
    itens: [
      { icone: GraduationCap, rotulo: "Alunos",       href: "/painel/alunos",       modulo: "alunos" },
      { icone: BookOpen,      rotulo: "Matrículas",   href: "/painel/matriculas",   modulo: "matriculas" },
      { icone: Layers,        rotulo: "Cursos",       href: "/painel/cursos",       modulo: "cursos" },
      { icone: Video,         rotulo: "Salas de Aula", href: "/painel/salas",       modulo: "salas" },
      { icone: Award,         rotulo: "Certificados", href: "/painel/certificados", modulo: "certificados" },
      { icone: DollarSign,    rotulo: "Mensalidades", href: "/painel/baixas",       modulo: "baixas" },
    ],
  },
  {
    chave: "financeiro", titulo: "Financeiro", icone: Wallet,
    itens: [
      { icone: Wallet,         rotulo: "Visão Geral",     href: "/painel/financeiro",               modulo: "financeiro", exato: true },
      { icone: Sparkles,       rotulo: "Análise do Mês",  href: "/painel/financeiro/resumo",        modulo: "financeiro" },
      { icone: ArrowRightLeft, rotulo: "Lançamentos",     href: "/painel/financeiro/lancamentos",   modulo: "financeiro" },
      { icone: Tags,           rotulo: "Categorias",      href: "/painel/financeiro/categorias",    modulo: "financeiro" },
      { icone: Landmark,       rotulo: "Contas",          href: "/painel/financeiro/contas",        modulo: "financeiro" },
      { icone: Contact,        rotulo: "Contatos",        href: "/painel/financeiro/contatos",      modulo: "financeiro" },
      { icone: Target,         rotulo: "Centros de Custo", href: "/painel/financeiro/centros-custo", modulo: "financeiro" },
      { icone: PiggyBank,      rotulo: "Orçamento",       href: "/painel/financeiro/orcamento",     modulo: "financeiro" },
      { icone: FileBarChart,   rotulo: "Relatórios",      href: "/painel/financeiro/relatorios",    modulo: "financeiro" },
      { icone: RefreshCw,      rotulo: "Conciliação",     href: "/painel/financeiro/conciliacao",   modulo: "financeiro" },
      { icone: ClipboardCheck, rotulo: "Aprovações",      href: "/painel/financeiro/aprovacoes",    modulo: "financeiro" },
      { icone: BellRing,       rotulo: "Cobrança",        href: "/painel/financeiro/cobranca",      modulo: "financeiro" },
    ],
  },
]

// Navegação do superAdmin (plataforma) — lista simples
const NAV_SUPER_ADMIN: ItemNav[] = [
  { icone: Building2,   rotulo: "Empresas",         href: "/painel/empresas" },
  { icone: Users,       rotulo: "Usuários",         href: "/painel/usuarios" },
  { icone: ShieldCheck, rotulo: "Segurança",        href: "/painel/seguranca" },
  { icone: Layers,      rotulo: "Módulos & Sistemas", href: "/painel/catalogo-modulos" },
  { icone: Settings,    rotulo: "Configurações",    href: "/painel/configuracoes" },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function itemAtivo(item: ItemNav, pathname: string): boolean {
  if (item.exato) return pathname === item.href
  return pathname === item.href || (item.href !== "/painel" && pathname.startsWith(item.href))
}

function sistemasVisiveis(papel: string, grupoIsAdmin: boolean, modulos: string[], gestao: string | null): SistemaNav[] {
  const out: SistemaNav[] = []
  for (const sis of SISTEMAS) {
    const itens = sis.itens.filter(
      (it) =>
        (!it.modulo || modulos.includes(it.modulo)) &&
        !(gestao === "PF" && it.href === "/painel/financeiro/centros-custo"),
    )
    if (itens.length) out.push({ ...sis, itens })
  }
  // Seção de gestão da empresa
  if (papel === "A" || grupoIsAdmin) {
    out.push({
      chave: "empresa", titulo: "Empresa", icone: Building2,
      itens: [
        { icone: Briefcase,  rotulo: "Setores",       href: "/painel/setores" },
        { icone: UsersRound, rotulo: "Grupos",        href: "/painel/grupos" },
        { icone: Users,      rotulo: "Usuários",      href: "/painel/usuarios" },
        { icone: Settings,   rotulo: "Configurações", href: "/painel/configuracoes" },
      ],
    })
  } else if (papel === "T") {
    out.push({ chave: "empresa", titulo: "Empresa", icone: Building2, itens: [{ icone: Users, rotulo: "Usuários", href: "/painel/usuarios" }] })
  }
  return out
}

// ── Props ───────────────────────────────────────────────────────────────────

interface MarcaEmpresa {
  cor:        string | null
  logo:       string | null
  nome:       string
  nomeSistema?: string | null
}

interface Props {
  papel:         string
  superAdmin:    boolean
  grupoIsAdmin:  boolean
  modulos:       string[]
  modulosCustom: ModuloCustom[]
  marca?:        MarcaEmpresa | null
  gestao?:       string | null
}

// ── Componente ──────────────────────────────────────────────────────────────

export function BarraLateral({ papel, superAdmin, grupoIsAdmin, modulos, modulosCustom, marca, gestao }: Props) {
  const pathname = usePathname()
  const [drawerAberto, setDrawerAberto] = useState(false)

  const corMarca = marca?.cor || "#f97316"
  const semMarca = !marca
  const cor = superAdmin ? "#f97316" : corMarca

  const sistemas = superAdmin ? [] : sistemasVisiveis(papel, grupoIsAdmin, modulos, gestao ?? null)
  const temCustom = !superAdmin && modulosCustom.length > 0

  // Sistema que começa aberto = o que contém a rota atual (senão o primeiro)
  const chaveAtiva =
    sistemas.find((s) => s.itens.some((it) => itemAtivo(it, pathname)))?.chave ??
    (temCustom && modulosCustom.some((m) => pathname.startsWith(`/painel/app/${m.id}`)) ? "__custom" : sistemas[0]?.chave ?? null)
  const [aberto, setAberto] = useState<string | null>(chaveAtiva)

  const alternar = (chave: string) => setAberto((atual) => (atual === chave ? null : chave))

  return (
    <>
      {/* Hamburguer (mobile) */}
      <button className="fixed top-4 left-4 z-40 lg:hidden bg-slate-950 text-white p-2 rounded-xl border border-white/10 shadow" onClick={() => setDrawerAberto(true)}>
        <Menu size={20} />
      </button>

      {drawerAberto && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setDrawerAberto(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-950 flex flex-col transition-transform duration-300 ${drawerAberto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
          {marca?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={marca.logo} alt={marca.nome} className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm font-serif shadow overflow-hidden"
              style={semMarca ? { background: "linear-gradient(135deg, #fb923c, #ea580c)" } : { background: `linear-gradient(135deg, ${corMarca}cc, ${corMarca})` }}>
              {semMarca ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/favicon.ico" alt="StackSystems" className="w-5 h-5 object-contain" />
              ) : marca.nome.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-serif text-[15px] font-bold text-white truncate">
            {superAdmin ? <>Stack<span style={{ color: "#f97316" }}>Systems</span></> : marca ? (marca.nomeSistema || marca.nome) : <>Stack<span style={{ color: corMarca }}>Systems</span></>}
          </span>
          <button className="ml-auto lg:hidden text-white/40 hover:text-white shrink-0" onClick={() => setDrawerAberto(false)}><X size={18} /></button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto" onClick={() => drawerAberto && setDrawerAberto(false)}>
          {/* Início */}
          <LinkNavLateral href="/painel" rotulo="Início" icone={LayoutDashboard} exato corMarca={cor} />

          {superAdmin ? (
            /* superAdmin — lista simples da plataforma */
            <div className="mt-2">
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">Plataforma</p>
              <div className="flex flex-col gap-0.5">
                {NAV_SUPER_ADMIN.map((it) => <LinkNavLateral key={it.href} href={it.href} rotulo={it.rotulo} icone={it.icone} corMarca="#f97316" />)}
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {sistemas.length === 0 && !temCustom && (
                <p className="px-3 py-6 text-xs text-slate-600 text-center">Nenhum sistema disponível.<br />Fale com o administrador.</p>
              )}

              {/* Sistemas em accordion */}
              {sistemas.map((sis) => {
                const Icone = sis.icone
                const isOpen = aberto === sis.chave
                const contemAtivo = sis.itens.some((it) => itemAtivo(it, pathname))
                return (
                  <div key={sis.chave}>
                    <button onClick={() => alternar(sis.chave)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all"
                      style={contemAtivo ? { color: cor } : undefined}>
                      <Icone size={18} style={{ color: cor }} />
                      <span className="flex-1 text-left">{sis.titulo}</span>
                      <ChevronDown size={15} className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
                          <div className="flex flex-col gap-0.5 mt-0.5 mb-1 ml-3.5 pl-3 border-l border-white/[0.07]">
                            {sis.itens.map((it) => <LinkNavLateral key={it.href} href={it.href} rotulo={it.rotulo} icone={it.icone} exato={it.exato} corMarca={cor} />)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}

              {/* Sistemas custom (catálogo) */}
              {temCustom && (() => {
                const isOpen = aberto === "__custom"
                return (
                  <div>
                    <button onClick={() => alternar("__custom")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all">
                      <Puzzle size={18} style={{ color: cor }} />
                      <span className="flex-1 text-left">Outros Sistemas</span>
                      <ChevronDown size={15} className={`text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden">
                          <div className="flex flex-col gap-0.5 mt-0.5 mb-1 ml-3.5 pl-3 border-l border-white/[0.07]">
                            {modulosCustom.map((m) => (
                              <a key={m.id} href={`/painel/app/${m.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all">
                                <span className="text-base leading-none w-[18px] text-center">{m.icone}</span>
                                <span>{m.rotulo}</span>
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })()}
            </div>
          )}
        </nav>

        {/* Sair */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>
    </>
  )
}
