"use client"

const NAV_ITEMS = ["Início", "Soluções", "Sobre", "Resultados", "Contato"]
const sectionMap: Record<string, string> = {
  "Início":     "inicio",
  "Soluções":   "solucoes",
  "Sobre":      "sobre",
  "Resultados": "resultados",
  "Contato":    "contato",
}

export default function Footer() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

  return (
    <footer className="bg-slate-950 px-[5%] pt-16 pb-8 relative overflow-hidden">
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="shimmer-border h-full" />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col items-center text-center mb-12">

          {/* Logo */}
          <button
            onClick={() => scrollTo("inicio")}
            className="flex items-center gap-3 mb-6 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-xl font-serif shadow-lg shadow-orange-900/40 group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-serif text-lg font-bold text-white">
              Stack<span className="text-orange-400">Systems</span>
            </span>
          </button>

          <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
            Desenvolvendo sistemas e soluções corporativas para empresas de todos os segmentos.
          </p>

          {/* Nav */}
          <div className="flex gap-6 flex-wrap justify-center mb-10">
            {NAV_ITEMS.map(item => (
              <button
                key={item}
                onClick={() => scrollTo(sectionMap[item])}
                className="text-[11px] text-slate-500 hover:text-orange-400 transition-colors uppercase tracking-[0.14em] font-semibold"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Social */}
          <div className="flex gap-4 mb-10">
            {[
              { label: "Instagram", icon: "📸" },
              { label: "LinkedIn",  icon: "💼" },
              { label: "WhatsApp",  icon: "💬" },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-orange-500/40 hover:bg-orange-500/10 flex items-center justify-center text-base transition-all cursor-pointer"
                title={label}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-600">
            © 2025 StackSystems. Todos os direitos reservados.
          </p>
          <p className="text-xs text-slate-600">
            Sistemas & Soluções para empresas
          </p>
        </div>
      </div>
    </footer>
  )
}
