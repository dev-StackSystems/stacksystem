"use client"
import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"

const stats = [
  { value: "150+",  label: "Empreendedores Atendidos",    accent: true  },
  { value: "98%",   label: "Satisfação dos Clientes",     accent: false },
  { value: "3x",    label: "Aumento Médio de Eficiência", accent: true  },
  { value: "R$2M+", label: "Economias Geradas",           accent: false },
]

const testimonials = [
  {
    name: "Marcos Oliveira",
    role: "CEO",
    company: "Padaria Artesanal",
    text: "Em 3 meses, meu faturamento cresceu 40%. O controle financeiro que implementaram salvou meu negócio.",
    av: "MO",
    color: "from-orange-400 to-orange-600",
  },
  {
    name: "Ana Paula Silva",
    role: "Fundadora",
    company: "Boutique Fashion",
    text: "Finalmente entendo meus números. A organização que trouxeram transformou como eu tomo decisões.",
    av: "AS",
    color: "from-pink-400 to-rose-600",
  },
  {
    name: "Roberto Lima",
    role: "Proprietário",
    company: "Oficina Mecânica",
    text: "A automação dos processos reduziu meu tempo operacional em 60%. Agora foco no que importa.",
    av: "RL",
    color: "from-blue-400 to-blue-600",
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

  const prefix = target.startsWith("R$") ? "R$" : ""
  const suffix = target.includes("+") ? "+" : target.includes("%") ? "%" : target.includes("x") ? "x" : ""
  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

export default function Results() {
  return (
    <section id="resultados" className="py-28 px-[5%] bg-neutral-50 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.07)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 anim-fade-up">
          <Badge>Números reais</Badge>
          <h2 className="font-serif text-[clamp(30px,4.5vw,54px)] font-black mt-5 tracking-tight text-neutral-900 leading-[1.08]">
            Resultados que{" "}
            <span className="text-orange-500">falam</span> por si
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`anim-fade-up-d${i + 1} group flex flex-col items-center text-center bg-white border-2 rounded-2xl py-10 px-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                s.accent
                  ? "border-orange-200 hover:border-orange-400"
                  : "border-neutral-100 hover:border-neutral-200"
              }`}
            >
              <div className={`font-serif text-5xl font-black leading-none mb-4 tabular-nums ${s.accent ? "text-orange-500" : "text-neutral-900"}`}>
                <AnimatedCounter target={s.value} />
              </div>
              <div className="text-xs text-neutral-500 leading-relaxed font-medium max-w-[120px]">
                {s.label}
              </div>
              {s.accent && (
                <div className="mt-4 w-8 h-0.5 bg-orange-300 rounded-full" />
              )}
            </div>
          ))}
        </div>

        {/* Testimonials header */}
        <div className="flex flex-col items-center mb-10 anim-fade-up">
          <h3 className="font-serif text-2xl font-bold text-neutral-800">
            O que nossos clientes dizem
          </h3>
          <div className="flex items-center gap-1 mt-3">
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className="text-orange-400 text-base">{s}</span>
            ))}
            <span className="text-sm text-neutral-400 ml-2 font-medium">5.0 / 5.0</span>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`anim-fade-up-d${i + 1} group flex flex-col bg-white border border-neutral-100 hover:border-orange-200 rounded-2xl p-7 hover:shadow-xl hover:shadow-orange-50 hover:-translate-y-1.5 transition-all duration-300`}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {"★★★★★".split("").map((s, j) => (
                  <span key={j} className="text-orange-400 text-xs">{s}</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-neutral-600 text-sm leading-relaxed flex-1 mb-6 relative">
                <span className="text-orange-300 text-4xl font-serif leading-none absolute -top-2 -left-1">"</span>
                <span className="pl-5">{t.text}</span>
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-neutral-100">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                  {t.av}
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-800">{t.name}</div>
                  <div className="text-xs text-neutral-400">{t.role} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
