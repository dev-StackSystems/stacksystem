"use client"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const services = [
  { icon: "📊", title: "Gestão Inteligente", desc: "Transformamos a operação da sua empresa com processos organizados, dashboards em tempo real e decisões baseadas em dados.", color: "#16a34a" },
  { icon: "💳", title: "Controle Financeiro", desc: "Fluxo de caixa, contas a pagar/receber, relatórios mensais e visão 360° das finanças do seu negócio.", color: "#dc2626" },
  { icon: "🚀", title: "Experiência do Cliente", desc: "Mapeamos a jornada do seu cliente e desenvolvemos soluções digitais que encantam e fidelizam.", color: "#16a34a" },
  { icon: "🧩", title: "Automação de Processos", desc: "Eliminamos retrabalho e tarefas manuais com automações que economizam tempo e reduzem erros.", color: "#dc2626" },
  { icon: "📈", title: "Estratégia de Crescimento", desc: "Planejamento estratégico, metas SMART e acompanhamento de KPIs para escalar sua empresa com consistência.", color: "#16a34a" },
  { icon: "🔐", title: "Organização Interna", desc: "Estruturamos equipes, fluxos de trabalho e ferramentas para que sua empresa funcione com eficiência máxima.", color: "#dc2626" },
]

export default function Services() {
  return (
    <section id="servicos" className="py-28 px-[5%] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="mb-16"
        >
          <Badge>O que fazemos</Badge>
          <h2 className="font-serif text-[clamp(32px,4vw,52px)] font-black mt-4 mb-4 tracking-tight">
            Soluções que <span className="text-green-500">transformam</span><br />seu negócio
          </h2>
          <div className="w-14 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded mb-4" />
          <p className="text-neutral-500 text-base max-w-xl leading-relaxed">
            Cada empreendedor tem desafios únicos. Desenvolvemos soluções sob medida para resolver os problemas reais da sua empresa.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              <Card className="p-8 group transition-all duration-300 hover:border-green-700/60 hover:shadow-[0_24px_60px_rgba(22,163,74,0.15)] relative overflow-hidden cursor-default">
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/0 to-green-900/0 group-hover:from-green-900/10 transition-all duration-300" />
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 border"
                  style={{ background: `${s.color}18`, borderColor: `${s.color}33` }}
                >
                  {s.icon}
                </div>
                <h3 className="font-serif text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
                <div
                  className="mt-5 pt-5 border-t border-neutral-800 text-sm font-semibold flex items-center gap-1"
                  style={{ color: s.color }}
                >
                  Saiba mais <span>→</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
