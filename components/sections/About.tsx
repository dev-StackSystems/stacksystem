"use client"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
 
const values = [
  "Foco no resultado real do cliente",
  "Soluções práticas e aplicáveis",
  "Transparência total no processo",
  "Suporte contínuo pós-implementação",
]

const pillars = [
  { n: "Gestão",   d: "Processos claros e eficientes",  icon: "⚙️" },
  { n: "Finanças", d: "Controle total do dinheiro",      icon: "💰" },
  { n: "UX",       d: "Clientes mais satisfeitos",       icon: "✨" },
  { n: "Tech",     d: "Ferramentas sob medida",          icon: "🔧" },
]

export default function About() {
  return (
    <section id="sobre" className="py-28 px-[5%] bg-white relative overflow-hidden">
      {/* Soft background accent */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(249,115,22,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* LEFT – mission card */}
        <div className="anim-slide-right relative mx-auto w-full max-w-lg">
          <div className="bg-neutral-950 rounded-3xl p-10 relative overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
            {/* Corner glows */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[radial-gradient(circle,rgba(249,115,22,0.2)_0%,transparent_70%)]" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[radial-gradient(circle,rgba(249,115,22,0.08)_0%,transparent_70%)]" />

            <div className="relative">
              <div className="text-[10px] text-orange-400/80 uppercase tracking-[0.18em] mb-5 font-bold">
                Nossa missão
              </div>
              <p className="font-serif text-[22px] font-bold leading-[1.4] text-white mb-8">
                "Queremos que cada empreendedor brasileiro{" "}
                <span className="text-orange-400">prospere</span>{" "}
                com as ferramentas certas."
              </p>

              <div className="h-px bg-gradient-to-r from-orange-500/40 to-transparent mb-8" />

              <div className="space-y-4">
                {values.map(v => (
                  <div key={v} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-orange-400 shrink-0 mt-px" />
                    <span className="text-sm text-neutral-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -top-5 -right-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl px-6 py-4 shadow-2xl shadow-orange-300/40">
            <div className="font-serif text-4xl font-black text-white leading-none">5+</div>
            <div className="text-[11px] text-orange-100 mt-1 font-semibold leading-tight">
              Anos de<br />Experiência
            </div>
          </div>

          {/* Bottom floating tag */}
          <div className="absolute -bottom-5 -right-5 bg-white border border-neutral-100 rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3">
            <div className="text-xl">🏆</div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Referência no</div>
              <div className="text-sm font-bold text-neutral-900">Empreendedorismo BR</div>
            </div>
          </div>
        </div>

        {/* RIGHT – text + pillars */}
        <div className="anim-slide-left flex flex-col items-center lg:items-start text-center lg:text-left">
          <Badge>Sobre a EmpréSolve</Badge>
          <h2 className="font-serif text-[clamp(28px,3.8vw,48px)] font-black mt-5 mb-5 tracking-tight leading-[1.08] text-neutral-900">
            Nascemos para{" "}
            <span className="text-orange-500">resolver</span> o<br />
            problema de quem empreende
          </h2>

          <div className="flex items-center gap-3 mb-7">
            <div className="h-px w-8 bg-orange-200 rounded" />
            <div className="w-10 h-1 bg-orange-500 rounded" />
          </div>

          <p className="text-neutral-500 text-[15px] leading-relaxed mb-4 max-w-md">
            Somos uma empresa especializada em transformar negócios. Nossa equipe de
            consultores e desenvolvedores entende profundamente os desafios do
            empreendedorismo brasileiro.
          </p>
          <p className="text-neutral-500 text-[15px] leading-relaxed mb-10 max-w-md">
            Unimos tecnologia, gestão e estratégia para criar soluções que realmente
            funcionam no dia a dia — do MEI à empresa de médio porte.
          </p>

          {/* Pillars grid */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {pillars.map(({ n, d, icon }) => (
              <div
                key={n}
                className="group bg-neutral-50 border border-neutral-200 hover:border-orange-300 hover:bg-orange-50/60 rounded-2xl p-5 transition-all duration-200 cursor-default text-center lg:text-left"
              >
                <div className="text-xl mb-2">{icon}</div>
                <div className="font-serif text-base font-bold text-neutral-900 mb-1 group-hover:text-orange-600 transition-colors">
                  {n}
                </div>
                <div className="text-xs text-neutral-500 leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
