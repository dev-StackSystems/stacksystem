"use client"
const NAV_ITEMS = ["Início", "Serviços", "Sobre", "Resultados", "Contato"]
const sectionMap: Record<string, string> = {
  "Início": "inicio", "Serviços": "servicos", "Sobre": "sobre",
  "Resultados": "resultados", "Contato": "contato",
}

export default function Footer() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

  return (
    <footer className="bg-neutral-900 px-[5%] pt-14 pb-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white text-lg font-serif shadow-md shadow-orange-900/40">
            E
          </div>
          <span className="font-serif text-base font-bold text-white">
            Empre<span className="text-orange-400">Solve</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="flex gap-8 flex-wrap justify-center mb-10">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => scrollTo(sectionMap[item])}
              className="text-xs text-neutral-500 hover:text-orange-400 transition-colors uppercase tracking-widest font-semibold"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-800 pt-6 w-full flex flex-col sm:flex-row justify-center items-center gap-3">
          <p className="text-xs text-neutral-600">© 2025 EmpréSolve. Todos os direitos reservados.</p>
          <span className="hidden sm:block text-neutral-700">·</span>
          <p className="text-xs text-neutral-600">Feito com ❤️ para empreendedores brasileiros</p>
        </div>
      </div>
    </footer>
  )
}