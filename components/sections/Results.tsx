"use client"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

const stats = [
  { value: "150+", label: "Empreendedores Atendidos", red: false },
  { value: "98%", label: "Satisfação dos Clientes", red: true },
  { value: "3x", label: "Aumento Médio de Eficiência", red: false },
  { value: "R$2M+", label: "Economias Geradas", red: true },
]

const testimonials = [
  { name: "Marcos Oliveira", role: "CEO - Padaria Artesanal", text: "Em 3 meses, meu faturamento cresceu 40%. O controle financeiro que implementaram salvou meu negócio.", av: "MO" },
  { name: "Ana Paula Silva", role: "Fundadora - Boutique Fashion", text: "Finalmente entendo meus números. A organização que trouxeram transformou como eu tomo decisões.", av: "AS" },
  { name: "Roberto Lima", role: "Dono - Oficina Mecânica", text: "A automação dos processos reduziu meu tempo operacional em 60%. Agora foco no que importa.", av: "RL" },
]

function AnimatedCounter({ target }: { target: string }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const numeric = parseFloat(target.replace(/[^0-9.]/g, ""))

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let start = 0
    const duration = 1800
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.floor(eased * numeric))
      if (p < 1) requestAnimationFrame(step)
      else setCount(numeric)
    }
    requestAnimationFrame(step)
  }, [started, numeric])

  const prefix = target.startsWith("R$") ? "R$" : ""
  const suffix = target.includes("+") ? "+" : target.includes("%") ? "%" : target.includes("x") ? "x" : ""

  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

export default function Results() {
  return (
    <section id="resultados" className="py-28 px-[5%] relative overflow-hidden bg-gradient-to-br from-[#0a1f0d] via-[#1a0505] to-[#0a0a0a]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(22,163,74,0.1),transparent_60%),radial-gradient(ellipse_at_70%_50%,rgba(220,38,38,0.07),transparent_60%)]" />
      
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge>Números reais</Badge>
          <h2 className="font-serif text-[clamp(28px,4vw,52px)] font-black mt-4 tracking-tight">
            Resultados que <span className="text-green-500">falam</span> por si
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center bg-white/[0.03] border border-white/[0.06] rounded-2xl py-10 px-6 backdrop-blur-sm"
            >
              <div className={`font-serif text-5xl font-black leading-none mb-3 ${s.red ? "text-red-500" : "text-green-500"}`}>
                <AnimatedCounter target={s.value} />
              </div>
              <div className="text-xs text-neutral-500 leading-relaxed">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <motion.h3
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="font-serif text-2xl font-bold text-center text-neutral-300 mb-10"
        >
          O que nossos clientes dizem
        </motion.h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7 transition-colors hover:border-neutral-700"
            >
              <div className="text-green-500 text-3xl font-serif mb-3">"</div>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-red-700 flex items-center justify-center text-xs font-bold text-white">
                  {t.av}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-200">{t.name}</div>
                  <div className="text-xs text-neutral-600">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
