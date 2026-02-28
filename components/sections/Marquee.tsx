export default function Marquee() {
  const items = ["Gestão Inteligente", "Controle Financeiro", "Experiência do Cliente", "Automação", "Crescimento Acelerado", "Organização Total"]
  return (
    <div className="overflow-hidden bg-green-700 border-y border-green-800 py-3.5">
      <div className="flex animate-marquee whitespace-nowrap">
        {[0, 1].map(k => (
          <span key={k} className="inline-flex gap-10 pr-10">
            {items.map(text => (
              <span key={text} className="text-xs font-bold uppercase tracking-widest text-white">
                ◆ {text}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
