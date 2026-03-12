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
  { n: "Gestão",   d: "Processos claros e eficientes" },
  { n: "Finanças", d: "Controle total do dinheiro" },
  { n: "UX",       d: "Clientes mais satisfeitos" },
  { n: "Tech",     d: "Ferramentas sob medida" },
]

export default function About() {
  return (
    <section id="sobre" className="py-28 px-[5%] bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        <div className="anim-slide-right relative mx-auto w-full max-w-lg">
          <div className="bg-neutral-900 rounded-3xl p-10 relative overflow-hidden shadow-2xl shadow-neutral-200 text-center">
            <div className="absolute top-0 right-0 w-56 h-56 bg-[radial-gradient(circle,rgba(249,115,22,0.18)_0%,transparent_70%)]" />
            <div className="text-[11px] text-neutral-500 uppercase tracking-widest mb-4 font-semibold">
              Nossa missão
            </div>
            <p className="font-serif text-xl font-bold leading-relaxed text-white mb-8">
              "Queremos que cada empreendedor brasileiro{" "}
              <span className="text-orange-400">prospere</span>{" "}
              com as ferramentas certas."
            </p>
            <div className="space-y-3 flex flex-col items-center">
              {values.map(v => (
                <div key={v} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-orange-400 shrink-0" />
                  <span className="text-sm text-neutral-400">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -top-5 -right-5 bg-orange-500 rounded-2xl px-6 py-4 shadow-xl shadow-orange-200">
            <div className="font-serif text-4xl font-black text-white leading-none">5+</div>
            <div className="text-xs text-orange-100 mt-1 font-semibold">Anos de<br />Experiência</div>
          </div>
        </div>

        <div className="anim-slide-left flex flex-col items-center text-center">
          <Badge>Sobre a EmpréSolve</Badge>
          <h2 className="font-serif text-[clamp(28px,3.5vw,46px)] font-black mt-4 mb-5 tracking-tight leading-[1.1] text-neutral-900">
            Nascemos para <span className="text-orange-500">resolver</span> o<br />
            problema de quem empreende
          </h2>
          <div className="w-14 h-1 bg-orange-500 rounded mb-6" />
          <p className="text-neutral-500 text-sm leading-relaxed mb-4 max-w-md">
            Somos uma empresa especializada em transformar negócios. Nossa equipe de consultores
            e desenvolvedores entende profundamente os desafios do empreendedorismo brasileiro.
          </p>
          <p className="text-neutral-500 text-sm leading-relaxed mb-10 max-w-md">
            Unimos tecnologia, gestão e estratégia para criar soluções que realmente funcionam
            no dia a dia — do MEI à empresa de médio porte.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {pillars.map(({ n, d }) => (
              <div
                key={n}
                className="bg-neutral-50 border border-neutral-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl p-5 transition-all group text-center"
              >
                <div className="font-serif text-base font-bold text-neutral-900 mb-1 group-hover:text-orange-600 transition-colors">{n}</div>
                <div className="text-xs text-neutral-500">{d}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}