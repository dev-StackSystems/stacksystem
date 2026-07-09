/**
 * components/landing/landing-vertical.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Compõe uma landing page a partir de um LandingConfig.
 *
 * - `/`            → config `stacksystems` (landing corporativa completa,
 *                    com as seções Migration e About)
 * - `/barbeiro`    → config `barbeiro`
 * - `/escolar`     → config `escolar`
 * - `/financeiro`  → config `financeiro`
 *
 * As verticais omitem as seções corporativas (Migration/About), que só fazem
 * sentido na landing da própria StackSystems.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Navbar from "@/components/landing/landing-navbar"
import Hero from "@/components/landing/landing-hero"
import Marquee from "@/components/landing/landing-marquee"
import Services from "@/components/landing/landing-services"
import Migration from "@/components/landing/landing-migration"
import About from "@/components/landing/landing-about"
import Results from "@/components/landing/landing-results"
import Contact from "@/components/landing/landing-contact"
import Footer from "@/components/landing/landing-footer"
import Mascot from "@/components/mascote"
import type { LandingConfig } from "@/lib/landings"

export function LandingVertical({ config }: { config: LandingConfig }) {
  const corporativa = config.slug === "stacksystems"

  return (
    <main>
      <Navbar config={config} />
      <Hero config={config} />
      <Marquee />
      <Services config={config} />
      {corporativa && <Migration />}
      {corporativa && <About />}
      <Results />
      <Contact />
      <Footer />
      <Mascot />
    </main>
  )
}
