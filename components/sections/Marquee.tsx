const items = [
  "Sistemas de Gestão",
  "ERPs Personalizados",
  "Automação de Processos",
  "Dashboards Inteligentes",
  "Integrações de Sistemas",
  "Soluções em Nuvem",
  "CRM Empresarial",
  "Suporte Especializado",
]

export default function Marquee() {
  return (
    <div className="overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 py-4 border-y border-orange-400/20 relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-orange-600 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-orange-600 to-transparent z-10 pointer-events-none" />

      <div className="flex animate-marquee whitespace-nowrap">
        {[0, 1].map(k => (
          <span key={k} className="inline-flex items-center gap-10 pr-10">
            {items.map(text => (
              <span key={text} className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
                <span className="text-white/40 text-[7px]">◆</span>
                {text}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
