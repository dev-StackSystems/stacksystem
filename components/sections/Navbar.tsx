"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

const NAV_ITEMS = ["Início", "Serviços", "Sobre", "Resultados", "Contato"]

const sectionMap: Record<string, string> = {
  "Início":     "inicio",
  "Serviços":   "servicos",
  "Sobre":      "sobre",
  "Resultados": "resultados",
  "Contato":    "contato",
}

const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [active,    setActive]    = useState("Início")
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleNav = (item: string) => {
    setActive(item)
    setMenuOpen(false)
    scrollToSection(sectionMap[item])
  }

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-[5%] transition-all duration-500",
        scrolled
          ? "bg-white/95 backdrop-blur-2xl border-b border-neutral-100 shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      )}
    >
      {/* Logo */}
      <button
        onClick={() => handleNav("Início")}
        className="flex items-center gap-3 group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-lg font-serif shadow-lg shadow-orange-300/50 group-hover:scale-105 transition-transform">
          S
        </div>
        <div className="leading-none">
          <div className="font-serif text-[15px] font-bold tracking-tight text-neutral-900">
            Stack<span className="text-orange-500">Systems</span>
          </div>
          <div className="text-[9px] text-neutral-400 uppercase tracking-[0.15em] font-semibold mt-0.5">
            Soluções Empresariais
          </div>
        </div>
      </button>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-7">
        {NAV_ITEMS.map(item => (
          <button
            key={item}
            onClick={() => handleNav(item)}
            className={cn(
              "text-[11px] uppercase tracking-[0.12em] font-bold transition-colors relative pb-1 group",
              "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:rounded after:bg-orange-500 after:transition-all after:duration-300",
              active === item
                ? "text-orange-500 after:w-full"
                : "text-neutral-500 hover:text-neutral-900 after:w-0 hover:after:w-full"
            )}
          >
            {item}
          </button>
        ))}
        <button
          onClick={() => handleNav("Contato")}
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[11px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-xl transition-all shadow-md shadow-orange-200 ml-2"
        >
          Falar Conosco
        </button>
      </div>

      {/* Mobile toggle */}
      <button
        className="md:hidden text-neutral-600 hover:text-orange-500 transition-colors p-1"
        onClick={() => setMenuOpen(v => !v)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white/98 backdrop-blur-xl border-b border-neutral-100 shadow-xl p-6 flex flex-col gap-3 md:hidden">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => handleNav(item)}
              className={cn(
                "text-sm uppercase tracking-[0.1em] font-bold text-left py-2 px-3 rounded-lg transition-all",
                active === item
                  ? "text-orange-500 bg-orange-50"
                  : "text-neutral-600 hover:text-orange-500 hover:bg-orange-50"
              )}
            >
              {item}
            </button>
          ))}
          <button
            onClick={() => handleNav("Contato")}
            className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold uppercase tracking-[0.1em] py-3 rounded-xl transition-colors shadow-md shadow-orange-200"
          >
            Falar Conosco
          </button>
        </div>
      )}
    </nav>
  )
}
