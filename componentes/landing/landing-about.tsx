"use client"
import { motion } from "motion/react"
import { Badge } from "@/componentes/ui/badge"
import { CheckCircle2 } from "lucide-react"

const values = [
  "Sistemas entregues no prazo e dentro do escopo",
  "Código limpo, escalável e bem documentado",
  "Suporte técnico contínuo pós-implantação",
  "Metodologia ágil com total transparência",
]

const pillars = [
  { n: "Gestão",       d: "Processos claros e eficientes",  icon: "⚙️" },
  { n: "Tecnologia",   d: "Stack moderno e escalável",      icon: "💻" },
  { n: "Integração",   d: "Sistemas conectados",            icon: "🔗" },
  { n: "Suporte",      d: "Atendimento especializado",      icon: "🛡️" },
]

const ease = [0.22, 1, 0.36, 1] as const

export default function About() {
  return (
    <section id="sobre" className="py-28 px-[5%] bg-white relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(249,115,22,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* LEFT – card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="bg-slate-950 rounded-3xl p-10 relative overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[radial-gradient(circle,rgba(249,115,22,0.2)_0%,transparent_70%)]" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[radial-gradient(circle,rgba(249,115,22,0.07)_0%,transparent_70%)]" />
            <div className="relative">
              <div className="text-[10px] text-orange-400/70 uppercase tracking-[0.18em] mb-5 font-bold">
                Nossa missão
              </div>
              <p className="font-serif text-[22px] font-semibold leading-[1.4] text-white mb-8">
                "Simplificar a tecnologia para que empresas{" "}
                <span className="text-orange-400">foquem no que importa:</span>{" "}
                crescer."
              </p>
              <div className="h-px bg-gradient-to-r from-orange-500/30 to-transparent mb-8" />
              <div className="space-y-4">
                {values.map(v => (
                  <div key={v} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-orange-400 shrink-0 mt-px" />
                    <span className="text-sm text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Badge top-right */}
          <div className="absolute -top-5 -right-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl px-6 py-4 shadow-2xl shadow-orange-200/60">
            <div className="font-serif text-4xl font-bold text-white leading-none">10+</div>
            <div className="text-[11px] text-orange-100/80 mt-1 font-semibold leading-tight">
              Anos de<br />Experiência
            </div>
          </div>

          {/* Badge bottom-right */}
          <div className="absolute -bottom-5 -right-5 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3">
            <div className="text-xl">🏆</div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Reconhecida como</div>
              <div className="text-sm font-bold text-slate-900">Referência em Sistemas</div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left"
        >
          <Badge>Sobre a StackSystems</Badge>
          <h2 className="font-serif text-[clamp(28px,3.8vw,48px)] font-bold mt-5 mb-5 tracking-tight leading-[1.08] text-slate-900">
            Desenvolvemos sistemas que{" "}
            <span className="text-gradient">realmente funcionam</span>
          </h2>

          <div className="flex items-center gap-3 mb-7">
            <div className="h-px w-8 bg-orange-200 rounded" />
            <div className="w-10 h-1 bg-orange-500 rounded" />
          </div>

          <p className="text-slate-500 text-[15px] leading-relaxed mb-4 max-w-md">
            Somos uma software house especializada em sistemas corporativos. Atendemos
            empresas de todos os segmentos — varejo, indústria, serviços, saúde e
            logística.
          </p>
          <p className="text-slate-500 text-[15px] leading-relaxed mb-10 max-w-md">
            Nossa equipe de desenvolvedores, analistas e consultores trabalha lado a
            lado com o cliente para entregar soluções que geram resultado real,
            com suporte técnico de verdade.
          </p>

          {/* Pillars */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {pillars.map(({ n, d, icon }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: i * 0.07, ease }}
                className="group bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/60 rounded-2xl p-5 transition-all duration-200 cursor-default text-center lg:text-left"
              >
                <div className="text-xl mb-2">{icon}</div>
                <div className="font-serif text-base font-semibold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">{n}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{d}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
