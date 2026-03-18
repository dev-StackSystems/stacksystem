"use client"
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

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center pt-28 pb-20 px-[5%] overflow-hidden bg-white"
    >
      {/* Dot grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:28px_28px] opacity-50 pointer-events-none" />

      {/* Orange radial glow - top right */}
      <div className="absolute -top-24 -right-24 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.1)_0%,transparent_65%)] pointer-events-none" />

      {/* Orange radial glow - bottom left */}
      <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Spinning ring */}
      <div className="absolute top-[14%] right-[5%] w-[260px] h-[260px] border border-dashed border-orange-200/70 rounded-full animate-spin-slow pointer-events-none hidden lg:block" />
      <div className="absolute top-[14%] right-[5%] w-[200px] h-[200px] border border-dashed border-orange-100/60 rounded-full animate-spin-slow [animation-direction:reverse] [animation-duration:20s] pointer-events-none hidden lg:block" style={{ top: 'calc(14% + 30px)', right: 'calc(5% + 30px)' }} />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT – copy */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">

          <div className="anim-fade-up">
            <Badge>🇧🇷 Soluções para Empreendedores</Badge>
          </div>

          <h1 className="anim-fade-up-d1 font-serif text-[clamp(44px,5.5vw,72px)] font-black leading-[1.03] tracking-tight mt-6 mb-6 text-neutral-900">
            Sua empresa<br />
            <span className="relative inline-block">
              <span className="text-orange-500">organizada</span>
            </span>
            {" "}e<br />
            <span className="relative inline-block">
              lucrativa.
              <span className="absolute -bottom-1.5 left-0 w-full h-[5px] bg-gradient-to-r from-orange-300 to-orange-100 rounded-full" />
            </span>
          </h1>

          <p className="anim-fade-up-d2 text-neutral-500 text-base leading-relaxed max-w-md mb-10">
            Desenvolvemos soluções digitais que transformam a gestão, experiência
            do cliente e saúde financeira do seu negócio.{" "}
            <span className="text-neutral-700 font-medium">Do caos à clareza.</span>
          </p>

          <div className="anim-fade-up-d3 flex gap-4 flex-wrap justify-center lg:justify-start">
            <button
              onClick={() => scrollTo("contato")}
              className="group relative bg-orange-500 hover:bg-orange-600 active:scale-[0.97] text-white font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-xl shadow-orange-300/50 animate-pulse-glow overflow-hidden"
            >
              <span className="relative z-10">Começar Agora →</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => scrollTo("servicos")}
              className="border-2 border-neutral-200 hover:border-orange-300 hover:bg-orange-50 text-neutral-700 hover:text-orange-600 active:scale-[0.97] font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all"
            >
              Ver Serviços
            </button>
          </div>

          {/* Metrics row */}
          <div className="anim-fade-up-d4 flex gap-8 mt-14 pt-8 border-t border-neutral-100 justify-center lg:justify-start">
            {[
              ["150+", "Clientes"],
              ["98%",  "Satisfação"],
              ["3×",   "Crescimento"],
            ].map(([val, label]) => (
              <div key={label} className="text-center lg:text-left">
                <div className="font-serif text-3xl font-black text-orange-500 leading-none">{val}</div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-[0.14em] mt-1.5 font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT – dashboard mockup */}
        <div className="anim-slide-left relative animate-float mx-auto w-full max-w-[430px]">
          {/* Main card */}
          <div className="relative bg-neutral-950 border border-neutral-800 rounded-3xl p-8 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.28)]">
            {/* Inner glow */}
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-[radial-gradient(circle,rgba(249,115,22,0.22)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[radial-gradient(circle,rgba(249,115,22,0.1)_0%,transparent_70%)] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-[0.15em] font-semibold">Dashboard Financeiro</div>
                <div className="text-white font-bold text-base mt-1 font-serif">Março 2025</div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-700" />
                <div className="w-2 h-2 rounded-full bg-orange-500/60" />
                <div className="w-2 h-2 rounded-full bg-orange-500" />
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-2 h-28 mb-6 relative">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-[5px] transition-all"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 7
                        ? "linear-gradient(to top, #ea580c, #fb923c)"
                        : i % 2 === 0
                        ? "rgba(249,115,22,0.4)"
                        : "rgba(249,115,22,0.18)",
                  }}
                />
              ))}
              {/* Chart baseline */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-800" />
            </div>

            {/* Metric grid */}
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(({ label, val, up }) => (
                <div
                  key={label}
                  className="bg-neutral-900 border border-neutral-800 hover:border-orange-900/60 rounded-2xl p-4 transition-colors"
                >
                  <div className="text-[10px] text-neutral-500 font-medium mb-1.5 uppercase tracking-wider">{label}</div>
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

          {/* Floating badge */}
          <div className="absolute -bottom-5 -left-5 bg-white border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl shadow-orange-100/80">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-xl">🔥</div>
            <div>
              <div className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Novo cliente hoje</div>
              <div className="text-sm font-bold text-neutral-800">Empresa crescendo +40%</div>
            </div>
          </div>

          {/* Top-right floating badge */}
          <div className="absolute -top-4 -right-4 bg-orange-500 text-white rounded-2xl px-4 py-2.5 shadow-xl shadow-orange-300/50">
            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Eficiência</div>
            <div className="font-serif text-2xl font-black leading-none">98%</div>
          </div>
        </div>

      </div>
    </section>
  )
}
