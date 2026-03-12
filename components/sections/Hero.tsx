"use client"
import { Badge } from "@/components/ui/badge"

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

const metrics = [
  { label: "Receita Mensal", val: "R$ 48.200", up: true },
  { label: "Despesas",       val: "R$ 18.600", up: false },
  { label: "Lucro Líquido",  val: "R$ 29.600", up: true },
  { label: "Crescimento",    val: "+34%",       up: true },
]
const bars = [40, 65, 50, 80, 60, 90, 75, 100]

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center pt-28 pb-20 px-[5%] overflow-hidden bg-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
   
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.08)_0%,transparent_70%)] pointer-events-none" />
   
      <div className="absolute top-[15%] right-[6%] w-[280px] h-[280px] border border-dashed border-orange-200 rounded-full animate-spin-slow pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        <div className="flex flex-col items-center text-center">

          <div className="anim-fade-up">
            <Badge>🇧🇷 Soluções para Empreendedores</Badge>
          </div>

          <h1 className="anim-fade-up-d1 font-serif text-[clamp(42px,5vw,70px)] font-black leading-[1.05] tracking-tight mt-6 mb-6 text-neutral-900">
            Sua empresa<br />
            <span className="text-orange-500">organizada</span>{" "}e<br />
            <span className="relative inline-block">
              lucrativa.
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-orange-200 rounded" />
            </span>
          </h1>

          <p className="anim-fade-up-d2 text-neutral-500 text-base leading-relaxed max-w-md mb-10">
            Desenvolvemos soluções digitais que transformam a gestão, experiência do
            cliente e saúde financeira do seu negócio. Do caos à clareza.
          </p>

          <div className="anim-fade-up-d3 flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => scrollTo("contato")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3.5 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-orange-200 animate-pulse-glow"
            >
              Começar Agora →
            </button>
            <button
              onClick={() => scrollTo("servicos")}
              className="border-2 border-neutral-200 hover:border-orange-300 text-neutral-700 hover:text-orange-600 font-bold px-7 py-3.5 rounded-xl text-sm uppercase tracking-widest transition-all"
            >
              Ver Serviços
            </button>
          </div>

          <div className="anim-fade-up-d4 flex gap-10 mt-14 pt-8 border-t border-neutral-100 justify-center">
            {[["150+", "Clientes"], ["98%", "Satisfação"], ["3x", "Crescimento"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="font-serif text-3xl font-black text-orange-500">{val}</div>
                <div className="text-[11px] text-neutral-400 uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="anim-slide-left relative animate-float mx-auto w-full max-w-md">
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl p-8 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_70%)]" />

            <div className="text-[11px] text-neutral-500 uppercase tracking-widest mb-5 font-semibold">
              Dashboard Financeiro
            </div>

            <div className="flex items-end gap-2 h-28 mb-5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 7
                        ? "linear-gradient(to top, #f97316, #fb923c)"
                        : i % 2 === 0
                        ? "rgba(249,115,22,0.35)"
                        : "rgba(249,115,22,0.15)",
                  }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {metrics.map(({ label, val, up }) => (
                <div key={label} className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
                  <div className="text-[11px] text-neutral-500 mb-1">{label}</div>
                  <div className={`font-serif text-base font-bold ${up ? "text-orange-400" : "text-red-400"}`}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-4 bg-white border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl shadow-orange-100">
            <span className="text-xl">🔥</span>
            <div>
              <div className="text-[11px] text-orange-500 font-semibold">Novo cliente hoje</div>
              <div className="text-sm font-bold text-neutral-800">Empresa crescendo +40%</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}