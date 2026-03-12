"use client"
import { Badge } from "@/components/ui/badge"

const services = [
  { icon: "📊", title: "Gestão Inteligente",      desc: "Transformamos a operação da sua empresa com processos organizados, dashboards em tempo real e decisões baseadas em dados." },
  { icon: "💳", title: "Controle Financeiro",      desc: "Fluxo de caixa, contas a pagar/receber, relatórios mensais e visão 360° das finanças do seu negócio." },
  { icon: "🚀", title: "Experiência do Cliente",   desc: "Mapeamos a jornada do seu cliente e desenvolvemos soluções digitais que encantam e fidelizam." },
  { icon: "🧩", title: "Automação de Processos",   desc: "Eliminamos retrabalho e tarefas manuais com automações que economizam tempo e reduzem erros." },
  { icon: "📈", title: "Estratégia de Crescimento",desc: "Planejamento estratégico, metas SMART e acompanhamento de KPIs para escalar sua empresa com consistência." },
  { icon: "🔐", title: "Organização Interna",      desc: "Estruturamos equipes, fluxos de trabalho e ferramentas para que sua empresa funcione com eficiência máxima." },
]

export default function Services() {
  return (
    <section id="servicos" className="py-28 px-[5%] bg-neutral-50">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col items-center text-center mb-16 anim-fade-up">
          <Badge>O que fazemos</Badge>
          <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-black mt-4 mb-4 tracking-tight text-neutral-900">
            Soluções que <span className="text-orange-500">transformam</span><br />seu negócio
          </h2>
          <div className="w-14 h-1 bg-orange-500 rounded mb-5" />
          <p className="text-neutral-500 text-base max-w-xl leading-relaxed">
            Cada empreendedor tem desafios únicos. Desenvolvemos soluções sob medida
            para resolver os problemas reais da sua empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={s.title}
              className={`anim-fade-up-d${Math.min(i + 1, 5)} group bg-white border border-neutral-200 rounded-2xl p-8 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 hover:-translate-y-1 cursor-default flex flex-col items-center text-center`}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 bg-orange-50 border border-orange-100 group-hover:bg-orange-500 group-hover:border-orange-500 transition-colors">
                {s.icon}
              </div>
              <h3 className="font-serif text-xl font-bold mb-3 text-neutral-900">{s.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed flex-1">{s.desc}</p>
              <div className="mt-5 pt-5 border-t border-neutral-100 w-full text-sm font-bold text-orange-500 flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                Saiba mais <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}