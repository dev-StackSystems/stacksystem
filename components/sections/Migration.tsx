"use client"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"

const pains = [
  { icon: "🐌", text: "Sistema lento que trrava na hora errada" },
  { icon: "🧩", text: "Setores que não se comunicam entre si" },
  { icon: "📊", text: "Relatórios difíceis de entender ou inexistentes" },
  { icon: "💸", text: "Pagando caro por funcionalidades que não usa" },
  { icon: "🖥️", text: "Interface ultrapassada que a equipe odeia usar" },
  { icon: "🔧", text: "Suporte técnico demorado ou caro demais" },
]

const gains = [
  { icon: "⚡", text: "Sistema rápido, estável e pensado para escalar" },
  { icon: "🔗", text: "Todos os setores integrados em uma única plataforma" },
  { icon: "📈", text: "Dashboards claros com os dados que você realmente precisa" },
  { icon: "✂️", text: "Somente o que o seu negócio usa — sem cobranças extras" },
  { icon: "✨", text: "Interface moderna que a equipe adota em dias" },
  { icon: "🛡️", text: "Suporte direto e ágil com quem conhece o sistema" },
]

const ease = [0.22, 1, 0.36, 1] as const

export default function Migration() {
  return (
    <section className="py-28 px-[5%] bg-slate-50 relative overflow-hidden">
      {/* Grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.5)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease }}
          className="flex flex-col items-center text-center mb-16"
        >
          <Badge>Troca de Sistema</Badge>
          <h2 className="font-serif text-[clamp(30px,4.2vw,52px)] font-bold mt-5 tracking-tight text-slate-900 leading-[1.08]">
            Já tem um sistema?{" "}
            <span className="text-gradient">A gente melhora.</span>
          </h2>
          <p className="text-slate-500 text-base mt-4 max-w-xl leading-relaxed">
            Se você já usa algum sistema mas ele não resolve tudo — ou resolve mal — não
            precisa começar do zero. Analisamos o que você tem hoje, mapeamos os problemas
            e entregamos algo feito exatamente para superar essas limitações.
          </p>
        </motion.div>

        {/* Comparison grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">

          {/* LEFT — dores */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Sistema atual
              </span>
            </div>
            <div className="p-6 flex flex-col gap-3">
              {pains.map((p, i) => (
                <motion.div
                  key={p.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease }}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                    {p.icon}
                  </div>
                  <div className="flex items-start gap-2 flex-1 pt-1.5">
                    <div className="w-4 h-4 rounded-full border-2 border-red-300 shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    </div>
                    <p className="text-sm text-slate-500 leading-snug line-through decoration-red-300/60">
                      {p.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CENTER — arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
            className="flex lg:flex-col items-center justify-center gap-3 py-4 lg:py-0 self-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-xl shadow-orange-200 shrink-0">
              <span className="text-white text-xl font-bold lg:rotate-0 rotate-90 inline-block">→</span>
            </div>
            <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest text-center leading-tight">
              Stack<br className="hidden lg:block" />Systems
            </div>
          </motion.div>

          {/* RIGHT — ganhos */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease }}
            className="bg-white border border-orange-200/60 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="bg-orange-50 border-b border-orange-200/60 px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-400" />
                <div className="w-3 h-3 rounded-full bg-orange-300" />
                <div className="w-3 h-3 rounded-full bg-orange-200" />
              </div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest ml-1">
                Novo sistema
              </span>
            </div>
            <div className="p-6 flex flex-col gap-3">
              {gains.map((g, i) => (
                <motion.div
                  key={g.text}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease }}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                    {g.icon}
                  </div>
                  <div className="flex items-start gap-2 flex-1 pt-1.5">
                    <div className="w-4 h-4 rounded-full bg-orange-500 shrink-0 mt-0.5 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-snug">{g.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Process strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="mt-10 bg-white border border-slate-200 rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            {[
              ["🔍", "Diagnóstico do sistema atual"],
              ["📋", "Mapeamento de melhorias"],
              ["🔄", "Migração segura dos dados"],
              ["🎓", "Treinamento da equipe"],
            ].map(([icon, label], i) => (
              <div key={label} className="flex items-center gap-5">
                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                  <span>{icon}</span>
                  {label}
                </div>
                {i < 3 && (
                  <span className="text-slate-300 hidden sm:block">→</span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}
            className="shrink-0 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-md shadow-orange-200 whitespace-nowrap"
          >
            Quero migrar →
          </button>
        </motion.div>

      </div>
    </section>
  )
}
