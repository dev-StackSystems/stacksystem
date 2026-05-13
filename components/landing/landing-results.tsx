"use client"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"

const steps = [
  {
    num: "01",
    icon: "🔍",
    title: "Diagnóstico",
    desc: "Entendemos profundamente sua operação, os gargalos do dia a dia e o que o sistema precisa resolver. Sem achismo — só o que realmente importa para o seu negócio.",
  },
  {
    num: "02",
    icon: "🗺️",
    title: "Planejamento",
    desc: "Desenhamos a arquitetura do sistema, definimos funcionalidades e prazos reais. Você aprova cada etapa antes de qualquer linha de código.",
  },
  {
    num: "03",
    icon: "⚙️",
    title: "Desenvolvimento",
    desc: "Construímos com metodologia ágil — entregas parciais, feedback constante e total transparência no andamento do projeto.",
  },
  {
    num: "04",
    icon: "🚀",
    title: "Entrega & Suporte",
    desc: "Implantamos o sistema, treinamos sua equipe e ficamos ao lado para garantir que tudo funcione. O suporte não acaba na entrega.",
  },
]

const whyUs = [
  {
    icon: "🤝",
    title: "Comunicação direta e sem ruídos",
    desc: "Você fala diretamente com a equipe técnica. Sem intermediários, sem telefone sem fio — cada decisão chega rápida e clara.",
  },
  {
    icon: "✂️",
    title: "Sem pacotes engessados",
    desc: "Cada sistema é construído do zero para o seu negócio. Você paga pelo que precisa, não por funcionalidades que nunca vai usar.",
  },
  {
    icon: "⚡",
    title: "Entregas ágeis e iterativas",
    desc: "Metodologia ágil com entregas parciais e feedback constante. Mudou algo no escopo? Adaptamos sem burocracia.",
  },
  {
    icon: "🔒",
    title: "Comprometimento total com o resultado",
    desc: "Não entregamos e sumimos. Ficamos ao lado até o sistema estar funcionando e sua equipe dominando a ferramenta.",
  },
]

const ease = [0.22, 1, 0.36, 1] as const

export default function Results() {
  return (
    <section id="resultados" className="relative overflow-hidden">

      {/* ── COMO TRABALHAMOS ─────────────────── */}
      <div className="py-28 px-[5%] bg-slate-950 relative">
        {/* Separators */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.07)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease }}
            className="flex flex-col items-center text-center mb-16"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-[11px] font-bold text-orange-400 uppercase tracking-[0.14em]">
              Como trabalhamos
            </div>
            <h2 className="font-serif text-[clamp(30px,4vw,50px)] font-bold mt-5 tracking-tight text-white leading-[1.08]">
              Do problema ao sistema{" "}
              <span className="text-gradient">em 4 etapas</span>
            </h2>
            <p className="text-slate-400 text-base mt-4 max-w-lg leading-relaxed">
              Um processo claro, previsível e colaborativo — para que você saiba exatamente o que está acontecendo em cada fase.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent pointer-events-none z-0" />

            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: i * 0.1, ease }}
                className="relative z-10 flex flex-col items-center text-center bg-white/[0.04] border border-white/[0.07] hover:border-orange-500/25 hover:bg-white/[0.07] rounded-2xl p-7 transition-all duration-300 group"
              >
                {/* Step number bubble */}
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-orange-500/30 flex items-center justify-center mb-5 relative group-hover:border-orange-500/60 transition-colors">
                  <span className="text-2xl">{step.icon}</span>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white">{step.num}</span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-semibold text-white mb-3 group-hover:text-orange-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── POR QUE A STACKSYSTEMS ─────────────── */}
      <div className="py-28 px-[5%] bg-white relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease }}
            className="flex flex-col items-center text-center mb-16"
          >
            <Badge>Por que nos escolher?</Badge>
            <h2 className="font-serif text-[clamp(30px,4vw,50px)] font-bold mt-5 tracking-tight text-slate-900 leading-[1.08]">
              As vantagens de trabalhar com{" "}
              <span className="text-gradient">quem é especializado</span>
            </h2>
            <p className="text-slate-500 text-base mt-4 max-w-lg leading-relaxed">
              Especialização, processo bem definido e foco total no seu projeto — do primeiro contato até o sistema em produção.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: (i % 2) * 0.1, ease }}
                className="group flex gap-5 bg-slate-50 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shrink-0 group-hover:border-orange-200 group-hover:scale-110 transition-all duration-300">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mt-14 bg-slate-950 rounded-3xl p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(249,115,22,0.12)_0%,transparent_60%)] pointer-events-none" />
            <div className="relative text-center md:text-left">
              <div className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">
                Pronto para sair do papel?
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                Conta o que precisa — em até 24h você recebe um retorno com a melhor solução para o seu negócio.
              </p>
            </div>
            <button
              onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}
              className="relative shrink-0 bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-bold px-8 py-4 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-xl shadow-orange-500/25 whitespace-nowrap"
            >
              Falar Conosco →
            </button>
          </motion.div>

        </div>
      </div>

    </section>
  )
}
