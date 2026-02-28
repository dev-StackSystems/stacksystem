"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"

const NAV_ITEMS = ["Início", "Serviços", "Sobre", "Resultados", "Contato"]

const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: "smooth" })
}

const sectionMap: Record<string, string> = {
  "Início": "inicio",
  "Serviços": "servicos",
  "Sobre": "sobre",
  "Resultados": "resultados",
  "Contato": "contato",
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
      scrolled ? "bg-black/90 backdrop-blur-xl border-b border-neutral-900" : "bg-transparent"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav("Início")}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-600 to-red-700 flex items-center justify-center font-bold text-white text-lg font-serif">E</div>
        <div>
          <div className="font-serif text-base font-bold tracking-tight leading-none">
            Empre<span className="text-green-500">Solve</span>
          </div>
          <div className="text-[10px] text-neutral-600 uppercase tracking-widest">Soluções Empresariais</div>
        </div>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_ITEMS.map(item => (
          <button
            key={item}
            onClick={() => handleNav(item)}
            className={cn(
              "text-xs uppercase tracking-widest font-medium transition-colors relative pb-1",
              "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-green-500 after:transition-all after:duration-300",
              active === item
                ? "text-green-500 after:w-full"
                : "text-neutral-400 hover:text-green-400 after:w-0 hover:after:w-full"
            )}
          >{item}</button>
        ))}
        <Button size="sm" onClick={() => handleNav("Contato")}>Falar Conosco</Button>
      </div>

      {/* Mobile menu button */}
      <button className="md:hidden text-neutral-400" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/95 border-b border-neutral-900 p-6 flex flex-col gap-4 md:hidden">
          {NAV_ITEMS.map(item => (
            <button key={item} onClick={() => handleNav(item)}
              className={cn("text-sm uppercase tracking-widest font-medium text-left", active === item ? "text-green-500" : "text-neutral-400")}>
              {item}
            </button>
          ))}
          <Button onClick={() => handleNav("Contato")} className="mt-2 w-full">Falar Conosco</Button>
        </div>
      )}
    </nav>
  )
}
