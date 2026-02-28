"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

const metrics = [
  { label: "Receita Mensal", val: "R$ 48.200", up: true },
  { label: "Despesas", val: "R$ 18.600", up: false },
  { label: "Lucro Líquido", val: "R$ 29.600", up: true },
  { label: "Crescimento", val: "+34%", up: true },
]

const bars = [40, 65, 50, 80, 60, 90, 75, 100]

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-28 pb-20 px-[5%] overflow-hidden bg-[#050505]">
      {/* Grid BG */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      {/* Glow blobs */}
      <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(22,163,74,0.12)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.09)_0%,transparent_70%)] pointer-events-none" />

      {/* Rotating ring */}
      <div className="absolute top-[15%] right-[8%] w-[300px] h-[300px] border border-dashed border-green-900/40 rounded-full animate-spin-slow pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        {/* Left */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Badge>🇧🇷 Soluções para Empreendedores</Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            className="font-serif text-[clamp(42px,5vw,70px)] font-black leading-[1.05] tracking-tight mt-6 mb-6"
          >
            Sua empresa<br />
            <span className="bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">organizada</span>{" "}e<br />
            <span className="text-red-500">lucrativa.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-neutral-400 text-base leading-relaxed max-w-md mb-10"
          >
            Desenvolvemos soluções digitais que transformam a gestão, experiência do cliente e saúde financeira do seu negócio. Do caos à clareza.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-4 flex-wrap">
            <Button size="lg" className="animate-pulse-glow" onClick={() => scrollTo("contato")}>
              Começar Agora →
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollTo("servicos")}>
              Ver Serviços
            </Button>
          </motion.div>

          {/* Mini stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="flex gap-8 mt-14 pt-8 border-t border-neutral-900"
          >
            {[["150+", "Clientes"], ["98%", "Satisfação"], ["3x", "Crescimento"]].map(([val, label]) => (
              <div key={label}>
                <div className="font-serif text-3xl font-black text-green-500">{val}</div>
                <div className="text-[11px] text-neutral-600 uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right - Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.8 }}
          className="relative animate-float"
        >
          <div className="relative bg-gradient-to-br from-neutral-900 to-green-950/30 border border-green-900/30 rounded-3xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(22,163,74,0.12)_0%,transparent_70%)]" />
            
            <div className="text-[11px] text-neutral-600 uppercase tracking-widest mb-5">Dashboard Financeiro</div>
            
            {/* Chart bars */}
            <div className="flex items-end gap-2 h-28 mb-5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md transition-all duration-1000"
                  style={{
                    height: `${h}%`,
                    background: i === 7
                      ? "linear-gradient(to top, #16a34a, #22c55e)"
                      : i % 2 === 0
                        ? "rgba(22,163,74,0.3)"
                        : "rgba(22,163,74,0.15)",
                  }}
                />
              ))}
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(({ label, val, up }) => (
                <div key={label} className="bg-black/60 border border-neutral-800 rounded-xl p-4">
                  <div className="text-[11px] text-neutral-600 mb-1">{label}</div>
                  <div className={`font-serif text-base font-bold ${up ? "text-green-500" : "text-red-500"}`}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-4 bg-red-600 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_8px_32px_rgba(220,38,38,0.4)]">
            <span className="text-xl">🔥</span>
            <div>
              <div className="text-[11px] text-red-200">Novo cliente hoje</div>
              <div className="text-sm font-semibold text-white">Empresa crescendo +40%</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
