const items = [
  "Gestão Inteligente",
  "Controle Financeiro",
  "Experiência do Cliente",
  "Automação de Processos",
  "Crescimento Acelerado",
  "Organização Total",
]

export default function Marquee() {
  return (
    <div className="overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 py-4 border-y border-orange-400/30">
      <div className="flex animate-marquee whitespace-nowrap">
        {[0, 1].map(k => (
          <span key={k} className="inline-flex items-center gap-10 pr-10">
            {items.map(text => (
              <span key={text} className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
                <span className="text-white/50 text-[8px]">◆</span>
                {text}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
