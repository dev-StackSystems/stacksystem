/**
 * componentes/layout/barra-topo.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Barra superior do painel com informações do usuário logado e menu dropdown.
 *
 * Funcionalidades:
 *   - Exibe nome e papel do usuário
 *   - Dropdown com link para configurações, perfil e botão de sair
 *   - Fecha o dropdown ao clicar fora
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Settings, LogOut, User } from "lucide-react"

// Rótulos legíveis para cada papel
const ROTULOS_PAPEL: Record<string, string> = {
  A: "Administrador",
  T: "Técnico",
  F: "Corpo Docente",
}

export function BarraTopo() {
  const { data: sessao } = useSession()
  const usuario = sessao?.user

  // Inicial do avatar (primeira letra do nome)
  const inicial = usuario?.name?.charAt(0).toUpperCase() ?? "U"

  // Rótulo do papel do usuário
  const rotuloPapel = ROTULOS_PAPEL[usuario?.papel ?? ""] ?? usuario?.papel ?? ""

  // Controle do dropdown
  const [aberto, setAberto] = useState(false)
  const refDropdown = useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora dele
  useEffect(() => {
    const fecharAoClicarFora = (e: MouseEvent) => {
      if (refDropdown.current && !refDropdown.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener("mousedown", fecharAoClicarFora)
    return () => document.removeEventListener("mousedown", fecharAoClicarFora)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Espaço para o botão hamburguer em mobile */}
      <div className="w-8 lg:hidden" />

      {/* Mensagem de boas-vindas */}
      <div className="flex-1">
        <p className="text-xs text-slate-400">Bem-vindo à plataforma StackSystems</p>
      </div>

      {/* Perfil com dropdown */}
      <div className="relative" ref={refDropdown}>
        <button
          onClick={() => setAberto(a => !a)}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-colors"
        >
          {/* Avatar circular com inicial do nome */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
            {inicial}
          </div>

          {/* Nome e papel — escondidos em telas pequenas */}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-none">{usuario?.name ?? "..."}</div>
            <div className="text-xs text-slate-400 mt-0.5">{rotuloPapel}</div>
          </div>
        </button>

        {/* Dropdown de perfil */}
        {aberto && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-20">
            {/* Dados do usuário */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-800 truncate">{usuario?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{usuario?.email}</p>
            </div>

            {/* Links */}
            <div className="p-1.5">
              <Link
                href="/painel/configuracoes"
                onClick={() => setAberto(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings size={15} className="text-slate-400" />
                Configurações
              </Link>

              <Link
                href="/painel/usuarios"
                onClick={() => setAberto(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User size={15} className="text-slate-400" />
                Meu Perfil
              </Link>
            </div>

            {/* Sair */}
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
