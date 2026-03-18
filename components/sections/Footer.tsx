"use client"

const NAV_ITEMS = ["Início", "Serviços", "Sobre", "Resultados", "Contato"]
const sectionMap: Record<string, string> = {
  "Início":     "inicio",
  "Serviços":   "servicos",
  "Sobre":      "sobre",
  "Resultados": "resultados",
  "Contato":    "contato",
}

export default function Footer() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

  return (
    <footer className="bg-neutral-950 px-[5%] pt-16 pb-8 relative overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.07)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* Main footer content */}
        <div className="flex flex-col items-center text-center mb-12">
          {/* Logo */}
          <button
            onClick={() => scrollTo("inicio")}
            className="flex items-center gap-3 mb-6 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-xl font-serif shadow-lg shadow-orange-900/50 group-hover:scale-105 transition-transform">
              E
            </div>
            <span className="font-serif text-lg font-bold text-white">
              Empre<span className="text-orange-400">Solve</span>
            </span>
          </button>

          <p className="text-sm text-neutral-500 max-w-xs leading-relaxed mb-8">
            Transformando negócios brasileiros com tecnologia, gestão e estratégia.
          </p>

          {/* Nav */}
          <div className="flex gap-6 flex-wrap justify-center mb-10">
            {NAV_ITEMS.map(item => (
              <button
                key={item}
                onClick={() => scrollTo(sectionMap[item])}
                className="text-[11px] text-neutral-500 hover:text-orange-400 transition-colors uppercase tracking-[0.14em] font-semibold"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Social / contact links */}
          <div className="flex gap-4 mb-10">
            {[
              { label: "Instagram", icon: "📸" },
              { label: "LinkedIn",  icon: "💼" },
              { label: "WhatsApp",  icon: "💬" },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-orange-500/60 hover:bg-orange-500/10 flex items-center justify-center text-base transition-all cursor-pointer"
                title={label}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-neutral-600">
            © 2025 EmpréSolve. Todos os direitos reservados.
          </p>
          <p className="text-xs text-neutral-600">
            Feito com ❤️ para empreendedores brasileiros
          </p>
        </div>

      </div>
    </footer>
  )
}
