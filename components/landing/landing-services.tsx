"use client"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"

const services = [
  {
    icon: "🗂️",
    title: "Sistemas de Gestão (ERP)",
    desc:  "Sistemas integrados que centralizam estoque, financeiro, vendas e RH em um único lugar, dando visibilidade total ao seu negócio.",
    hover: "hover:border-blue-300 hover:shadow-blue-100",
    iconBg: "bg-blue-50",
  },
  {
    icon: "💳",
    title: "Controle Financeiro",
    desc:  "Módulos de fluxo de caixa, contas a pagar/receber, DRE automatizado e relatórios gerenciais em tempo real.",
    hover: "hover:border-emerald-300 hover:shadow-emerald-100",
    iconBg: "bg-emerald-50",
  },
  {
    icon: "🔁",
    title: "Automação de Processos",
    desc:  "Eliminamos tarefas manuais e retrabalho integrando seus sistemas com automações que economizam horas por semana.",
    hover: "hover:border-orange-300 hover:shadow-orange-100",
    iconBg: "bg-orange-50",
  },
  {
    icon: "📊",
    title: "Dashboards & Analytics",
    desc:  "Painéis inteligentes com KPIs, gráficos interativos e alertas automáticos para decisões baseadas em dados.",
    hover: "hover:border-purple-300 hover:shadow-purple-100",
    iconBg: "bg-purple-50",
  },
  {
    icon: "🤝",
    title: "CRM & Relacionamento",
    desc:  "Gerencie toda a jornada do cliente, do primeiro contato ao pós-venda, com rastreamento completo de oportunidades.",
    hover: "hover:border-rose-300 hover:shadow-rose-100",
    iconBg: "bg-rose-50",
  },
  {
    icon: "🔗",
    title: "Integrações & APIs",
    desc:  "Conectamos sistemas legados, plataformas de e-commerce, ERPs e ferramentas externas via APIs robustas.",
    hover: "hover:border-teal-300 hover:shadow-teal-100",
    iconBg: "bg-teal-50",
  },
]

const ease = [0.22, 1, 0.36, 1] as const

export default function Services() {
  return (
    <section id="solucoes" className="py-28 px-[5%] bg-slate-50 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.4)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease }}
          className="flex flex-col items-center text-center mb-16"
        >
          <Badge>Nossas Soluções</Badge>
          <h2 className="font-serif text-[clamp(32px,4.5vw,54px)] font-bold mt-5 mb-5 tracking-tight text-slate-900 leading-[1.08]">
            Tecnologia feita para{" "}
            <span className="text-gradient">o seu negócio</span>
          </h2>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-10 bg-orange-200 rounded" />
            <div className="w-10 h-1 bg-orange-500 rounded" />
            <div className="h-px w-10 bg-orange-200 rounded" />
          </div>
          <p className="text-slate-500 text-base max-w-xl leading-relaxed">
            Desenvolvemos sistemas personalizados para empresas de todos os portes e segmentos —
            do varejo à indústria, do MEI à multinacional.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease }}
              className={`group bg-white border border-slate-200 ${s.hover} rounded-2xl p-7 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-default flex flex-col`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 ${s.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                {s.icon}
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3 text-slate-900 group-hover:text-orange-600 transition-colors">
                {s.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed flex-1">{s.desc}</p>
              <div className="mt-6 pt-5 border-t border-slate-100 text-sm font-semibold text-orange-500/70 group-hover:text-orange-500 flex items-center gap-1.5 group-hover:gap-3 transition-all duration-200">
                Saiba mais
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
