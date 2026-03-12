"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

const NAV_ITEMS = ["Início", "Serviços", "Sobre", "Resultados", "Contato"]

const sectionMap: Record<string, string> = {
  "Início": "inicio",
  "Serviços": "servicos",
  "Sobre": "sobre",
  "Resultados": "resultados",
  "Contato": "contato",
}

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState("Início")
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNav = (item: string) => {
    setActive(item)
    setMenuOpen(false)
    scrollToSection(sectionMap[item])
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 px-[5%] h-[72px] flex items-center justify-between transition-all duration-500",
      scrolled
        ? "bg-white/95 backdrop-blur-xl border-b border-neutral-200 shadow-sm"
        : "bg-white/80 backdrop-blur-sm"
    )}>
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav("Início")}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white text-lg font-serif shadow-md shadow-orange-200">
          S
        </div>
        <div>
          <div className="font-serif text-base font-bold tracking-tight leading-none text-neutral-900">
            Stack<span className="text-orange-500">Sytems</span>
          </div>
          <div className="text-[10px] text-neutral-400 uppercase tracking-widest">Soluções Empresariais</div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {NAV_ITEMS.map(item => (
          <button
            key={item}
            onClick={() => handleNav(item)}
            className={cn(
              "text-xs uppercase tracking-widest font-semibold transition-colors relative pb-1",
              "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-orange-500 after:rounded after:transition-all after:duration-300",
              active === item
                ? "text-orange-500 after:w-full"
                : "text-neutral-500 hover:text-orange-500 after:w-0 hover:after:w-full"
            )}
          >{item}</button>
        ))}
        <button
          onClick={() => handleNav("Contato")}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-200"
        >
          Falar Conosco
        </button>
      </div>

      <button className="md:hidden text-neutral-500" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-200 shadow-lg p-6 flex flex-col gap-4 md:hidden">
          {NAV_ITEMS.map(item => (
            <button key={item} onClick={() => handleNav(item)}
              className={cn(
                "text-sm uppercase tracking-widest font-semibold text-left transition-colors",
                active === item ? "text-orange-500" : "text-neutral-500"
              )}>
              {item}
            </button>
          ))}
          <button
            onClick={() => handleNav("Contato")}
            className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold uppercase tracking-widest py-3 rounded-xl transition-colors"
          >
            Falar Conosco
          </button>
        </div>
      )}
    </nav>
  )
}