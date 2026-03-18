"use client"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

const metrics = [
  { label: "Receita Mensal", val: "R$ 48.200", up: true  },
  { label: "Despesas",       val: "R$ 18.600", up: false },
  { label: "Lucro Líquido",  val: "R$ 29.600", up: true  },
  { label: "Crescimento",    val: "+34%",       up: true  },
]

const bars = [38, 60, 48, 75, 55, 88, 70, 100]
const ease = [0.22, 1, 0.36, 1] as const

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center pt-28 pb-20 px-[5%] overflow-hidden bg-white"
    >
      {/* Dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px] opacity-60 pointer-events-none" />

      {/* Orange glow — top right */}
      <div className="absolute -top-32 -right-32 w-[750px] h-[750px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.09)_0%,transparent_65%)] pointer-events-none" />
      {/* Soft blue tint — bottom left */}
      <div className="absolute bottom-0 -left-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.04)_0%,transparent_65%)] pointer-events-none" />

      {/* Spinning rings */}
      <div className="absolute top-[14%] right-[5%] w-[280px] h-[280px] border border-dashed border-orange-200/70 rounded-full animate-spin-slow pointer-events-none hidden lg:block" />
      <div className="absolute top-[14%] right-[5%] w-[200px] h-[200px] border border-dashed border-orange-100 rounded-full animate-spin-slow [animation-direction:reverse] [animation-duration:20s] pointer-events-none hidden lg:block" style={{ top: 'calc(14% + 40px)', right: 'calc(5% + 40px)' }} />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <Badge>💼 Sistemas para Empresas</Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease }}
            className="font-serif text-[clamp(42px,5.2vw,70px)] font-bold leading-[1.05] tracking-tight mt-6 mb-6 text-slate-900"
          >
            Sistemas que<br />
            <span className="text-gradient">transformam</span>
            <br />
            <span className="relative inline-block">
              sua empresa.
              <span className="absolute -bottom-1.5 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400 to-transparent rounded-full" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease }}
            className="text-slate-500 text-base leading-relaxed max-w-md mb-10"
          >
            Desenvolvemos sistemas e soluções sob medida para otimizar a gestão,
            automatizar processos e impulsionar os resultados do seu negócio.{" "}
            <span className="text-slate-700 font-medium">Do planejamento à entrega.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease }}
            className="flex gap-4 flex-wrap justify-center lg:justify-start"
          >
            <button
              onClick={() => scrollTo("contato")}
              className="group relative bg-orange-500 hover:bg-orange-600 active:scale-[0.97] text-white font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all animate-pulse-glow overflow-hidden"
            >
              <span className="relative z-10">Solicitar Proposta →</span>
            </button>
            <button
              onClick={() => scrollTo("solucoes")}
              className="border-2 border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-600 hover:text-orange-600 active:scale-[0.97] font-semibold px-8 py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all"
            >
              Ver Soluções
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.45, ease }}
            className="flex gap-8 mt-14 pt-8 border-t border-slate-100 justify-center lg:justify-start"
          >
            {[
              ["200+", "Sistemas Entregues"],
              ["98%",  "Satisfação"],
              ["10+",  "Anos no Mercado"],
            ].map(([val, label]) => (
              <div key={label} className="text-center lg:text-left">
                <div className="font-serif text-3xl font-bold text-orange-500 leading-none">{val}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-[0.14em] mt-1.5 font-semibold">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT – dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.15, ease }}
          className="animate-float relative mx-auto w-full max-w-[430px]"
        >
          <div className="relative bg-slate-950 border border-slate-800/60 rounded-3xl p-8 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.2),0_8px_32px_rgba(249,115,22,0.08)]">
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-[radial-gradient(circle,rgba(249,115,22,0.2)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[radial-gradient(circle,rgba(249,115,22,0.07)_0%,transparent_70%)] pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-semibold">Dashboard — Visão Geral</div>
                <div className="text-white font-bold text-base mt-1 font-serif">Março 2025</div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                <div className="w-2 h-2 rounded-full bg-orange-500/50" />
                <div className="w-2 h-2 rounded-full bg-orange-500" />
              </div>
            </div>

            <div className="flex items-end gap-2 h-28 mb-6 relative">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-[4px]"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 7
                        ? "linear-gradient(to top, #ea580c, #fb923c)"
                        : i % 2 === 0
                        ? "rgba(249,115,22,0.35)"
                        : "rgba(249,115,22,0.15)",
                  }}
                />
              ))}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-800" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {metrics.map(({ label, val, up }) => (
                <div
                  key={label}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-orange-900/40 rounded-2xl p-4 transition-colors"
                >
                  <div className="text-[10px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">{label}</div>
                  <div className={`font-serif text-[15px] font-bold ${up ? "text-orange-400" : "text-red-400"}`}>
                    {val}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${up ? "text-orange-500/60" : "text-red-500/60"}`}>
                    {up ? "↑ 12% vs mês anterior" : "↓ 3% vs mês anterior"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badge — bottom left */}
          <div className="absolute -bottom-5 -left-5 bg-white border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl shadow-orange-100/60">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-xl">⚡</div>
            <div>
              <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Sistema online</div>
              <div className="text-sm font-bold text-slate-800">Deploy concluído</div>
            </div>
          </div>

          {/* Floating badge — top right */}
          <div className="absolute -top-4 -right-4 bg-orange-500 text-white rounded-2xl px-4 py-2.5 shadow-xl shadow-orange-300/40">
            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Uptime</div>
            <div className="font-serif text-2xl font-bold leading-none">99.9%</div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
