/**
 * lib/tema.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tema dinâmico do painel: gera uma escala de cor "brand" (50–950) a partir da
 * cor primária escolhida no cadastro da empresa (Empresa.cor).
 *
 * Como funciona:
 *   - O Tailwind expõe a cor `brand` mapeada para variáveis CSS
 *     (rgb(var(--brand-500) / <alpha>)) — ver tailwind.config.ts.
 *   - `paletaBrand(hex)` deriva os 11 tons a partir do hex base (500 = base;
 *     tons claros misturam com branco, escuros com preto) e devolve um objeto
 *     de estilo com as variáveis --brand-50..950 (como triplas "R G B").
 *   - O layout do painel aplica esse objeto no wrapper raiz; sem cor definida,
 *     o padrão (laranja, em globals.css) permanece.
 *
 * Uso:
 *   <div style={paletaBrand(empresa?.cor)}> ... </div>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { CSSProperties } from "react"

type RGB = { r: number; g: number; b: number }

// Laranja padrão (#f97316) — fallback quando a empresa não tem cor definida
const LARANJA_BASE = "#f97316"

// Peso de mistura por tom: [alvo, quantidade do alvo].
// 500 é a cor base; tons < 500 clareiam (branco), tons > 500 escurecem (preto).
const MIX: Record<number, ["white" | "black" | "base", number]> = {
  50:  ["white", 0.90],
  100: ["white", 0.80],
  200: ["white", 0.62],
  300: ["white", 0.42],
  400: ["white", 0.20],
  500: ["base",  0.00],
  600: ["black", 0.10],
  700: ["black", 0.24],
  800: ["black", 0.36],
  900: ["black", 0.48],
  950: ["black", 0.62],
}

const TONS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

/** Converte "#rrggbb" (ou "#rgb") em {r,g,b}; retorna null se inválido. */
function hexParaRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/** Mistura linear entre a cor base e branco/preto. */
function misturar(base: RGB, alvo: "white" | "black" | "base", qtd: number): RGB {
  if (alvo === "base" || qtd <= 0) return base
  const t = alvo === "white" ? 255 : 0
  const mix = (c: number) => Math.round(c * (1 - qtd) + t * qtd)
  return { r: mix(base.r), g: mix(base.g), b: mix(base.b) }
}

/**
 * Gera as variáveis CSS --brand-50..950 a partir de um hex base.
 * Retorna um objeto de estilo pronto para aplicar em `style={...}`.
 * Se o hex for inválido/ausente, usa o laranja padrão.
 */
export function paletaBrand(hex?: string | null): CSSProperties {
  const base = hexParaRgb(hex || "") ?? hexParaRgb(LARANJA_BASE)!
  const vars: Record<string, string> = {}
  for (const tom of TONS) {
    const [alvo, qtd] = MIX[tom]
    const { r, g, b } = misturar(base, alvo, qtd)
    vars[`--brand-${tom}`] = `${r} ${g} ${b}`
  }
  return vars as CSSProperties
}
