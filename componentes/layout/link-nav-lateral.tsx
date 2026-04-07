/**
 * componentes/layout/link-nav-lateral.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Link de navegação da barra lateral com indicador de rota ativa.
 *
 * Destaca automaticamente o item quando a rota atual começa com `href`.
 * Usa a cor da empresa para o estado ativo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

interface Props {
  href:      string       // Rota de destino
  rotulo:    string       // Texto exibido no link
  icone:     LucideIcon   // Ícone Lucide
  corMarca?: string       // Cor hex da empresa (ex: "#f97316")
}

export function LinkNavLateral({ href, rotulo, icone: Icone, corMarca }: Props) {
  const rotaAtual = usePathname()
  const cor = corMarca || "#f97316"

  // Considera ativo se for a rota exata ou se a rota atual começa com href
  // Exceção: /painel nunca é prefixo de outros itens (seria sempre ativo)
  const ativo = rotaAtual === href || (href !== "/painel" && rotaAtual.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        ativo
          ? "border"
          : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
      }`}
      style={
        ativo
          ? {
              background:   `${cor}26`,  // Cor com 15% de opacidade
              color:         cor,
              borderColor:  `${cor}33`,  // Cor com 20% de opacidade
            }
          : undefined
      }
    >
      <Icone size={17} />
      {rotulo}
    </Link>
  )
}
