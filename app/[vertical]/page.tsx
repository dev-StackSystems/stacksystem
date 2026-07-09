/**
 * app/[vertical]/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Landing pages públicas por vertical de produto:
 *   /barbeiro   /escolar   /financeiro
 *
 * `dynamicParams = false` + `generateStaticParams` restringem esta rota às
 * verticais conhecidas (SLUGS_VERTICAIS). Qualquer outro slug cai em 404, e as
 * rotas estáticas existentes (/login, /painel, /api, /debug) têm precedência.
 *
 * A rota raiz "/" (StackSystems) fica em app/page.tsx.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { LandingVertical } from "@/components/landing/landing-vertical"
import { getLandingConfig, SLUGS_VERTICAIS } from "@/lib/landings"

interface Props {
  params: Promise<{ vertical: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return SLUGS_VERTICAIS.map((vertical) => ({ vertical }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vertical } = await params
  const config = getLandingConfig(vertical)
  if (!config) return {}
  const nome = `${config.marcaNome}${config.marcaDestaque}`
  return {
    title: `${nome} — ${config.marcaSufixo}`,
    description: config.sub,
  }
}

export default async function LandingVerticalPage({ params }: Props) {
  const { vertical } = await params
  const config = getLandingConfig(vertical)
  if (!config || vertical === "stacksystems") notFound()

  return <LandingVertical config={config} />
}
