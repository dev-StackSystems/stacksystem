"use client"
const NAV_ITEMS = ["Início", "Serviços", "Sobre", "Resultados", "Contato"]
const sectionMap: Record<string, string> = { "Início": "inicio", "Serviços": "servicos", "Sobre": "sobre", "Resultados": "resultados", "Contato": "contato" }

export default function Footer() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  return (
    <footer className="bg-[#050505] border-t border-neutral-900 px-[5%] pt-12 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-red-700 flex items-center justify-center font-bold text-white text-sm font-serif">E</div>
            <span className="font-serif text-base font-bold">Empre<span className="text-green-500">Solve</span></span>
          </div>
          <div className="flex gap-8 flex-wrap">
            {NAV_ITEMS.map(item => (
              <button key={item} onClick={() => scrollTo(sectionMap[item])}
                className="text-xs text-neutral-600 hover:text-green-500 transition-colors uppercase tracking-widest">
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-neutral-900 pt-6 flex flex-wrap justify-between gap-2">
          <p className="text-xs text-neutral-700">© 2025 EmpréSolve. Todos os direitos reservados.</p>
          <p className="text-xs text-neutral-700">Feito com ❤️ para empreendedores brasileiros</p>
        </div>
      </div>
    </footer>
  )
}
