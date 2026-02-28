"use client"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

const values = [
  "Foco no resultado real do cliente",
  "Soluções práticas e aplicáveis",
  "Transparência total no processo",
  "Suporte contínuo pós-implementação",
]

const pillars = [
  { n: "Gestão", d: "Processos claros e eficientes" },
  { n: "Finanças", d: "Controle total do dinheiro" },
  { n: "UX", d: "Clientes mais satisfeitos" },
  { n: "Tech", d: "Ferramentas sob medida" },
]

export default function About() {
  return (
    <section id="sobre" className="py-28 px-[5%] bg-[#050505]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        {/* Left - Visual */}
        <motion.div
          initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-neutral-900 to-green-950/20 border border-green-900/20 rounded-3xl p-10 relative">
            <div className="text-[11px] text-neutral-600 uppercase tracking-widest mb-4">Nossa missão</div>
            <p className="font-serif text-xl font-bold leading-relaxed text-neutral-200 mb-8">
              "Queremos que cada empreendedor brasileiro{" "}
              <span className="text-green-500">prospere</span>{" "}
              com as ferramentas certas."
            </p>
            <div className="space-y-3">
              {values.map(v => (
                <div key={v} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                  <span className="text-sm text-neutral-400">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating accent */}
          <div className="absolute -top-5 -right-5 bg-red-600 rounded-2xl px-6 py-4 shadow-[0_16px_48px_rgba(220,38,38,0.35)]">
            <div className="font-serif text-4xl font-black text-white leading-none">5+</div>
            <div className="text-xs text-red-200 mt-1">Anos de<br/>Experiência</div>
          </div>
        </motion.div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
        >
          <Badge>Sobre a EmpréSolve</Badge>
          <h2 className="font-serif text-[clamp(28px,3.5vw,46px)] font-black mt-4 mb-6 tracking-tight leading-[1.1]">
            Nascemos para <span className="text-red-500">resolver</span> o problema de quem empreende
          </h2>
          <div className="w-14 h-0.5 bg-gradient-to-r from-green-600 to-green-400 rounded mb-6" />
          <p className="text-neutral-500 text-sm leading-relaxed mb-5">
            Somos uma empresa especializada em transformar negócios. Nossa equipe de consultores e desenvolvedores entende profundamente os desafios do empreendedorismo brasileiro.
          </p>
          <p className="text-neutral-500 text-sm leading-relaxed mb-10">
            Unimos tecnologia, gestão e estratégia para criar soluções que realmente funcionam no dia a dia — do MEI à empresa de médio porte.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {pillars.map(({ n, d }) => (
              <div key={n} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="font-serif text-base font-bold text-neutral-100 mb-1">{n}</div>
                <div className="text-xs text-neutral-600">{d}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
