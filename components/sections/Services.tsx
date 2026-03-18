"use client"
import { Badge } from "@/components/ui/badge"

const services = [
  {
    icon: "📊",
    title: "Gestão Inteligente",
    desc:  "Transformamos a operação da sua empresa com processos organizados, dashboards em tempo real e decisões baseadas em dados.",
    color: "from-blue-500/10 to-blue-500/5",
    border: "group-hover:border-blue-200",
  },
  {
    icon: "💳",
    title: "Controle Financeiro",
    desc:  "Fluxo de caixa, contas a pagar/receber, relatórios mensais e visão 360° das finanças do seu negócio.",
    color: "from-green-500/10 to-green-500/5",
    border: "group-hover:border-green-200",
  },
  {
    icon: "🚀",
    title: "Experiência do Cliente",
    desc:  "Mapeamos a jornada do seu cliente e desenvolvemos soluções digitais que encantam e fidelizam.",
    color: "from-purple-500/10 to-purple-500/5",
    border: "group-hover:border-purple-200",
  },
  {
    icon: "🧩",
    title: "Automação de Processos",
    desc:  "Eliminamos retrabalho e tarefas manuais com automações que economizam tempo e reduzem erros.",
    color: "from-orange-500/10 to-orange-500/5",
    border: "group-hover:border-orange-200",
  },
  {
    icon: "📈",
    title: "Estratégia de Crescimento",
    desc:  "Planejamento estratégico, metas SMART e acompanhamento de KPIs para escalar sua empresa com consistência.",
    color: "from-rose-500/10 to-rose-500/5",
    border: "group-hover:border-rose-200",
  },
  {
    icon: "🔐",
    title: "Organização Interna",
    desc:  "Estruturamos equipes, fluxos de trabalho e ferramentas para que sua empresa funcione com eficiência máxima.",
    color: "from-teal-500/10 to-teal-500/5",
    border: "group-hover:border-teal-200",
  },
]

export default function Services() {
  return (
    <section id="servicos" className="py-28 px-[5%] bg-neutral-50 relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 anim-fade-up">
          <Badge>O que fazemos</Badge>
          <h2 className="font-serif text-[clamp(32px,4.5vw,54px)] font-black mt-5 mb-5 tracking-tight text-neutral-900 leading-[1.08]">
            Soluções que{" "}
            <span className="text-orange-500">transformam</span>
            <br />seu negócio
          </h2>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-10 bg-orange-200 rounded" />
            <div className="w-10 h-1 bg-orange-500 rounded" />
            <div className="h-px w-10 bg-orange-200 rounded" />
          </div>
          <p className="text-neutral-500 text-base max-w-xl leading-relaxed">
            Cada empreendedor tem desafios únicos. Desenvolvemos soluções sob medida
            para resolver os problemas reais da sua empresa.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={s.title}
              className={`anim-fade-up-d${Math.min(i + 1, 5)} group bg-white border border-neutral-200/80 ${s.border} rounded-2xl p-7 hover:shadow-2xl hover:shadow-neutral-200/80 transition-all duration-300 hover:-translate-y-1.5 cursor-default flex flex-col`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 bg-gradient-to-br ${s.color} border border-neutral-100 group-hover:scale-110 transition-transform duration-300`}>
                {s.icon}
              </div>

              <h3 className="font-serif text-xl font-bold mb-3 text-neutral-900 group-hover:text-orange-600 transition-colors">
                {s.title}
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed flex-1">
                {s.desc}
              </p>

              {/* Link */}
              <div className="mt-6 pt-5 border-t border-neutral-100 text-sm font-bold text-orange-500 flex items-center gap-1.5 group-hover:gap-3 transition-all duration-200">
                Saiba mais
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
