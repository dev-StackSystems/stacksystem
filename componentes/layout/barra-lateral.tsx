/**
 * componentes/layout/barra-lateral.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Barra lateral (sidebar) de navegação do painel.
 *
 * Comportamento:
 *   - superAdmin: vê o menu da plataforma (todas as empresas, configurações)
 *   - papel A ou grupoIsAdmin: vê módulos + seção de configurações da empresa
 *   - papel T: vê módulos + link de usuários
 *   - papel F: vê apenas os módulos permitidos
 *
 * Os módulos exibidos são filtrados pela lista `modulos` recebida via prop,
 * que já foi calculada pelo `resolverModulos()` no layout do painel.
 *
 * Em telas pequenas a sidebar é ocultada e abre via botão hamburguer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useState } from "react"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, Settings, LogOut, X, Menu,
  GraduationCap, BookOpen, Layers, DollarSign,
  Award, Building2, ShieldCheck, Video, Briefcase, UsersRound,
} from "lucide-react"
import { LinkNavLateral } from "./link-nav-lateral"

// ── Tipos internos ─────────────────────────────────────────────────────────

type ItemNav = {
  icone:    typeof LayoutDashboard
  rotulo:   string
  href:     string
  modulo?:  string // se preenchido, o item só aparece se o módulo estiver ativo
}

type GrupoNav = {
  titulo: string | null // null = sem título de seção
  itens:  ItemNav[]
}

// ── Grupos de navegação para usuários normais ──────────────────────────────

const GRUPOS_MODULOS: GrupoNav[] = [
  {
    titulo: null,
    itens: [{ icone: LayoutDashboard, rotulo: "Painel", href: "/painel" }],
  },
  {
    titulo: "Acadêmico",
    itens: [
      { icone: GraduationCap, rotulo: "Alunos",     href: "/painel/alunos",     modulo: "alunos"     },
      { icone: BookOpen,      rotulo: "Matrículas", href: "/painel/matriculas", modulo: "matriculas" },
      { icone: Layers,        rotulo: "Cursos",     href: "/painel/cursos",     modulo: "cursos"     },
    ],
  },
  {
    titulo: "Conteúdo",
    itens: [
      { icone: Video, rotulo: "Salas de Aula", href: "/painel/salas", modulo: "salas" },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      { icone: DollarSign, rotulo: "Financeiro",   href: "/painel/baixas",       modulo: "baixas"       },
      { icone: Award,      rotulo: "Certificados", href: "/painel/certificados", modulo: "certificados" },
    ],
  },
]

// ── Grupos de navegação para o superAdmin (plataforma inteira) ─────────────

const GRUPOS_SUPER_ADMIN: GrupoNav[] = [
  {
    titulo: null,
    itens: [{ icone: LayoutDashboard, rotulo: "Painel", href: "/painel" }],
  },
  {
    titulo: "Plataforma",
    itens: [
      { icone: Building2,   rotulo: "Empresas",      href: "/painel/empresas"      },
      { icone: Users,       rotulo: "Usuários",      href: "/painel/usuarios"      },
      { icone: ShieldCheck, rotulo: "Segurança",     href: "/painel/seguranca"     },
      { icone: Settings,    rotulo: "Configurações", href: "/painel/configuracoes" },
    ],
  },
]

// ── Função que monta os grupos filtrados para usuários normais ─────────────

function montarGruposFiltrados(papel: string, grupoIsAdmin: boolean, modulos: string[]): GrupoNav[] {
  const resultado: GrupoNav[] = []

  for (const grupo of GRUPOS_MODULOS) {
    // Grupo sem título (ex: Painel) sempre incluído
    if (grupo.titulo === null) { resultado.push(grupo); continue }

    // Filtra itens sem módulo (sempre visíveis) ou com módulo ativo
    const itensFiltrados = grupo.itens.filter(
      item => !item.modulo || modulos.includes(item.modulo)
    )
    if (itensFiltrados.length > 0) {
      resultado.push({ titulo: grupo.titulo, itens: itensFiltrados })
    }
  }

  // Admin da empresa ou admin do grupo: vê configurações
  if (papel === "A" || grupoIsAdmin) {
    resultado.push({
      titulo: "Empresa",
      itens: [
        { icone: Briefcase,  rotulo: "Setores",       href: "/painel/setores"       },
        { icone: UsersRound, rotulo: "Grupos",        href: "/painel/grupos"        },
        { icone: Users,      rotulo: "Usuários",      href: "/painel/usuarios"      },
        { icone: Settings,   rotulo: "Configurações", href: "/painel/configuracoes" },
      ],
    })
  } else if (papel === "T") {
    // Técnico: só lista de usuários
    resultado.push({
      titulo: "Empresa",
      itens: [{ icone: Users, rotulo: "Usuários", href: "/painel/usuarios" }],
    })
  }

  return resultado
}

// ── Interface de props ─────────────────────────────────────────────────────

interface MarcaEmpresa {
  cor:        string | null
  logo:       string | null
  nome:       string
  nomeSistema?: string | null
}

interface Props {
  papel:        string         // Papel do usuário: "A" | "T" | "F"
  superAdmin:   boolean        // Flag do desenvolvedor/i3
  grupoIsAdmin: boolean        // Flag do grupo admin
  modulos:      string[]       // Módulos ativos para o usuário
  marca?:       MarcaEmpresa | null // Branding da empresa
}

// ── Componente principal ───────────────────────────────────────────────────

export function BarraLateral({ papel, superAdmin, grupoIsAdmin, modulos, marca }: Props) {
  // Controla se a sidebar está aberta em mobile
  const [aberta, setAberta] = useState(false)

  // superAdmin usa o menu da plataforma; demais usam o menu filtrado por módulos
  const grupos = superAdmin
    ? GRUPOS_SUPER_ADMIN
    : montarGruposFiltrados(papel, grupoIsAdmin, modulos)

  const corMarca = marca?.cor || "#f97316"
  const semMarca = !marca

  return (
    <>
      {/* Botão hamburguer — visível apenas em mobile */}
      <button
        className="fixed top-4 left-4 z-40 lg:hidden bg-slate-950 text-white p-2 rounded-xl border border-white/10 shadow"
        onClick={() => setAberta(true)}
      >
        <Menu size={20} />
      </button>

      {/* Overlay escurecido ao abrir em mobile */}
      {aberta && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setAberta(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-950 flex flex-col transition-transform duration-300 ${
          aberta ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Cabeçalho com logo/nome da empresa */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
          {marca?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={marca.logo}
              alt={marca.nome}
              className="w-8 h-8 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm font-serif shadow overflow-hidden"
              style={
                semMarca
                  ? { background: "linear-gradient(135deg, #fb923c, #ea580c)" }
                  : { background: `linear-gradient(135deg, ${corMarca}cc, ${corMarca})` }
              }
            >
              {/* Sem marca = StackSystems (favicon); com marca = inicial da empresa */}
              {semMarca ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/favicon.ico" alt="StackSystems" className="w-5 h-5 object-contain" />
              ) : (
                marca.nome.charAt(0).toUpperCase()
              )}
            </div>
          )}

          <span className="font-serif text-[15px] font-bold text-white truncate">
            {superAdmin ? (
              <>Stack<span style={{ color: "#f97316" }}>Systems</span></>
            ) : marca ? (
              marca.nomeSistema || marca.nome
            ) : (
              <>Stack<span style={{ color: corMarca }}>Systems</span></>
            )}
          </span>

          <button
            className="ml-auto lg:hidden text-white/40 hover:text-white shrink-0"
            onClick={() => setAberta(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto">
          {grupos.map((grupo, indice) => (
            <div key={indice}>
              {grupo.titulo && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                  {grupo.titulo}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {grupo.itens.map(item => (
                  <LinkNavLateral
                    key={item.href}
                    href={item.href}
                    rotulo={item.rotulo}
                    icone={item.icone}
                    corMarca={superAdmin ? "#f97316" : corMarca}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Botão de sair */}
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
