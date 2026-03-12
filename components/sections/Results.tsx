"use client"
import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"

const stats = [
  { value: "150+",  label: "Empreendedores Atendidos",    orange: true  },
  { value: "98%",   label: "Satisfação dos Clientes",     orange: false },
  { value: "3x",    label: "Aumento Médio de Eficiência", orange: true  },
  { value: "R$2M+", label: "Economias Geradas",           orange: false },
]

const testimonials = [
  { name: "Marcos Oliveira", role: "CEO – Padaria Artesanal",    text: "Em 3 meses, meu faturamento cresceu 40%. O controle financeiro que implementaram salvou meu negócio.", av: "MO" },
  { name: "Ana Paula Silva", role: "Fundadora – Boutique Fashion",text: "Finalmente entendo meus números. A organização que trouxeram transformou como eu tomo decisões.", av: "AS" },
  { name: "Roberto Lima",    role: "Dono – Oficina Mecânica",    text: "A automação dos processos reduziu meu tempo operacional em 60%. Agora foco no que importa.", av: "RL" },
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
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1800, 1)
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
    <section id="resultados" className="py-28 px-[5%] bg-neutral-50 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* Header – centered */}
        <div className="flex flex-col items-center text-center mb-16 anim-fade-up">
          <Badge>Números reais</Badge>
          <h2 className="font-serif text-[clamp(28px,4vw,52px)] font-black mt-4 tracking-tight text-neutral-900">
            Resultados que <span className="text-orange-500">falam</span> por si
          </h2>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`anim-fade-up-d${i + 1} flex flex-col items-center text-center bg-white border rounded-2xl py-10 px-6 shadow-sm hover:shadow-md transition-shadow ${
                s.orange ? "border-orange-200 hover:border-orange-300" : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className={`font-serif text-5xl font-black leading-none mb-3 ${s.orange ? "text-orange-500" : "text-neutral-900"}`}>
                <AnimatedCounter target={s.value} />
              </div>
              <div className="text-xs text-neutral-500 leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <h3 className="anim-fade-up font-serif text-2xl font-bold text-center text-neutral-800 mb-10">
          O que nossos clientes dizem
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`anim-fade-up-d${i + 1} flex flex-col items-center text-center bg-white border border-neutral-200 hover:border-orange-300 rounded-2xl p-7 hover:shadow-lg hover:shadow-orange-50 hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="text-orange-400 text-3xl font-serif mb-3">"</div>
              <p className="text-neutral-500 text-sm leading-relaxed mb-6 flex-1">{t.text}</p>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                  {t.av}
                </div>
                <div className="text-sm font-bold text-neutral-800">{t.name}</div>
                <div className="text-xs text-neutral-400">{t.role}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}