"use client"
import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"

const stats = [
  { value: "200+",  label: "Sistemas Entregues",        accent: true  },
  { value: "98%",   label: "Satisfação dos Clientes",   accent: false },
  { value: "50+",   label: "Empresas Atendidas",        accent: true  },
  { value: "10+",   label: "Anos de Experiência",       accent: false },
]

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Diretor de TI",
    company: "Grupo Varejo Nacional",
    text: "O sistema de gestão que a StackSystems desenvolveu integrou todas as nossas filiais. Reduzimos erros operacionais em 70% no primeiro trimestre.",
    av: "CM",
    color: "from-orange-400 to-orange-600",
  },
  {
    name: "Fernanda Costa",
    role: "CEO",
    company: "LogFast Transportes",
    text: "A automação do nosso processo de faturamento e rastreamento de frota mudou completamente a operação. Entrega impecável e suporte excelente.",
    av: "FC",
    color: "from-blue-400 to-blue-600",
  },
  {
    name: "Ricardo Alves",
    role: "Gerente Geral",
    company: "Rede MedCenter",
    text: "Implementamos o CRM e o módulo financeiro em 8 clínicas simultaneamente. O projeto foi entregue no prazo e com treinamento completo.",
    av: "RA",
    color: "from-emerald-400 to-emerald-600",
  },
]

function AnimatedCounter({ target }: { target: string }) {
  const [count,   setCount]   = useState(0)
  const [started, setStarted] = useState(false)
  const ref     = useRef<HTMLSpanElement>(null)
  const numeric = parseFloat(target.replace(/[^0-9.]/g, ""))

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let start = 0
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1600, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.floor(eased * numeric))
      if (p < 1) requestAnimationFrame(step)
      else setCount(numeric)
    }
    requestAnimationFrame(step)
  }, [started, numeric])

  const suffix = target.includes("+") ? "+" : target.includes("%") ? "%" : ""
  return <span ref={ref}>{count}{suffix}</span>
}

const ease = [0.22, 1, 0.36, 1] as const

export default function Results() {
  return (
    <section id="resultados" className="py-28 px-[5%] bg-slate-950 relative overflow-hidden">
      {/* Top gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />
      {/* Bottom gradient separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease }}
          className="flex flex-col items-center text-center mb-16"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-[11px] font-bold text-orange-400 uppercase tracking-[0.14em] mb-4">
            Números Reais
          </div>
          <h2 className="font-serif text-[clamp(30px,4.5vw,54px)] font-bold mt-1 tracking-tight text-white leading-[1.08]">
            Resultados que{" "}
            <span className="text-gradient">comprovam</span> nossa entrega
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: i * 0.08, ease }}
              className={`group flex flex-col items-center text-center bg-white/[0.04] border rounded-2xl py-10 px-6 hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1.5 ${
                s.accent ? "border-orange-500/25 hover:border-orange-500/50" : "border-white/[0.07] hover:border-white/[0.14]"
              }`}
            >
              <div className={`font-serif text-5xl font-bold leading-none mb-4 tabular-nums ${s.accent ? "text-orange-400" : "text-white"}`}>
                <AnimatedCounter target={s.value} />
              </div>
              <div className="text-xs text-slate-400 leading-relaxed font-medium max-w-[120px]">
                {s.label}
              </div>
              {s.accent && (
                <div className="mt-4 w-8 h-0.5 bg-orange-500/40 rounded-full" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Testimonials header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease }}
          className="flex flex-col items-center mb-10"
        >
          <h3 className="font-serif text-2xl font-semibold text-white">
            O que nossos clientes dizem
          </h3>
          <div className="flex items-center gap-1 mt-3">
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className="text-orange-400 text-base">{s}</span>
            ))}
            <span className="text-sm text-slate-500 ml-2 font-medium">5.0 / 5.0</span>
          </div>
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease }}
              className="group flex flex-col bg-white/[0.04] border border-white/[0.07] hover:border-orange-500/25 rounded-2xl p-7 hover:bg-white/[0.07] hover:-translate-y-2 transition-all duration-300"
            >
              <div className="flex gap-0.5 mb-4">
                {"★★★★★".split("").map((s, j) => (
                  <span key={j} className="text-orange-400 text-xs">{s}</span>
                ))}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6 relative">
                <span className="text-orange-400/40 text-4xl font-serif leading-none absolute -top-2 -left-1">"</span>
                <span className="pl-5">{t.text}</span>
              </p>
              <div className="flex items-center gap-3 pt-5 border-t border-white/[0.06]">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                  {t.av}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role} · {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
