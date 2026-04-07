"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "motion/react"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import Mascote from "@/componentes/mascote"

// ─────────────────────────────────────────────
//  BANNERS — edite à vontade
// ─────────────────────────────────────────────
const STATS = [
  { val: "+2.4k", label: "Alunos ativos"       },
  { val: "99.9%", label: "Disponibilidade"      },
  { val: "12+",   label: "Módulos integrados"   },
]

const MODULOS = [
  { icon: "🎓", texto: "Alunos & Matrículas"   },
  { icon: "📚", texto: "Cursos & Aulas"         },
  { icon: "💰", texto: "Financeiro"             },
  { icon: "🎥", texto: "Salas ao vivo"          },
  { icon: "🏆", texto: "Certificados"           },
  { icon: "📊", texto: "Relatórios"             },
]

const BARRAS = [42, 65, 50, 78, 58, 90, 72, 100]

const ease = [0.22, 1, 0.36, 1] as const

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]         = useState({ email: "", senha: "" })
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.email || !form.senha) {
      setError("Preencha e-mail e senha para continuar.")
      return
    }

    setLoading(true)

    const result = await signIn("credentials", {
      email: form.email,
      senha: form.senha,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      const errorMessages: Record<string, string> = {
        USUARIO_NAO_ENCONTRADO: "Nenhuma conta encontrada com este e-mail.",
        SENHA_INCORRETA:        "Senha incorreta. Tente novamente.",
        USUARIO_INATIVO:        "Este usuário está inativo. Contate o administrador.",
        CAMPOS_FALTANDO:        "Preencha e-mail e senha para continuar.",
        ERRO_BANCO:             "Erro ao conectar no banco de dados. Verifique as configurações do servidor.",
      }
      setError(errorMessages[result.error] ?? `Erro de autenticação: ${result.error}`)
      return
    }

    router.push("/painel")
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ══════════════════════════════════════
          ESQUERDA — Branding visual
      ══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col bg-slate-950 overflow-hidden">

        {/* Camadas de fundo */}
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.22)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

        {/* Anéis giratórios */}
        <div className="absolute top-[30%] right-[-60px] w-[340px] h-[340px] border border-dashed border-orange-500/10 rounded-full animate-spin-slow pointer-events-none" />
        <div className="absolute top-[30%] right-[-20px] w-[260px] h-[260px] border border-dashed border-orange-400/08 rounded-full animate-spin-slow [animation-direction:reverse] [animation-duration:20s] pointer-events-none" />

        <div className="relative flex flex-col h-full p-12">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex items-center gap-3"
          >
            <img src="/favicon.ico" alt="StackSystems" className="w-10 h-10 object-contain" />
            <div>
              <div className="font-serif text-[17px] font-bold text-white">
                Stack<span className="text-orange-400">Systems</span>
              </div>
              <div className="text-[9px] text-white/30 uppercase tracking-[0.15em] font-semibold">
                Sistemas &amp; Soluções
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease }}
            className="mt-10"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-orange-300 text-[10px] font-bold uppercase tracking-[0.14em]">
                Plataforma online · 24h disponível
              </span>
            </div>
            <h1 className="font-serif text-[clamp(26px,2.8vw,40px)] font-bold text-white leading-[1.1] mb-4">
              Tudo que seu cursinho<br />
              precisa em um só lugar.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Gerencie alunos, matrículas, finanças e aulas ao vivo — com dados em tempo real
              e acesso de qualquer dispositivo.
            </p>
          </motion.div>

          {/* Mockup de dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.28, ease }}
            className="mt-8 bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 relative overflow-hidden"
          >
            {/* Glow interno */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_70%)] pointer-events-none" />

            {/* Cabeçalho do mockup */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-semibold">Visão geral — Hoje</div>
                <div className="text-white font-bold text-sm font-serif mt-0.5">Dashboard Acadêmico</div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[9px] font-bold">Ao vivo</span>
              </div>
            </div>

            {/* Gráfico de barras */}
            <div className="flex items-end gap-1.5 h-16 mb-4">
              {BARRAS.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.06, ease }}
                  className="flex-1 rounded-t-sm origin-bottom"
                  style={{
                    height: `${h}%`,
                    background: i === 7
                      ? "linear-gradient(to top,#ea580c,#fb923c)"
                      : i % 2 === 0
                      ? "rgba(249,115,22,0.4)"
                      : "rgba(249,115,22,0.15)",
                  }}
                />
              ))}
            </div>

            {/* Mini KPIs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Matrículas",  val: "184",   cor: "text-orange-400" },
                { label: "Receita",     val: "R$48k", cor: "text-emerald-400" },
                { label: "Salas ativas",val: "6",     cor: "text-blue-400"   },
              ].map(({ label, val, cor }) => (
                <div key={label} className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/40">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">{label}</div>
                  <div className={`font-serif text-sm font-bold ${cor}`}>{val}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Grade de módulos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.5, ease }}
            className="mt-6 grid grid-cols-3 gap-2"
          >
            {MODULOS.map((m, i) => (
              <motion.div
                key={m.texto}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.55 + i * 0.06, ease }}
                className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 hover:bg-orange-500/10 hover:border-orange-500/20 transition-all duration-200 group"
              >
                <span className="text-base leading-none">{m.icon}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors font-medium leading-tight">
                  {m.texto}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="mt-auto pt-6 flex items-center justify-between border-t border-white/[0.05]"
          >
            {STATS.map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="font-serif text-lg font-bold text-orange-400">{val}</div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
            <span className="text-xs text-slate-700 bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full">
              v1.0.0
            </span>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DIREITA — Formulário de Login
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-16 relative">

        {/* Back to site */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          onClick={() => router.push("/")}
          className="absolute top-8 left-8 flex items-center gap-2 text-xs text-slate-400 hover:text-orange-500 transition-colors font-semibold uppercase tracking-wider group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao site
        </motion.button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-lg font-serif">
            <img src="/favicon.ico" alt="StackSystems" style={{ width: "50px", height: "50px" }} />
          </div>
          <span className="font-serif text-lg font-bold text-slate-900">
            Stack<span className="text-orange-500">Systems</span>
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="w-full max-w-[400px]"
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="font-serif text-[28px] font-bold text-slate-900 mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-slate-500 text-sm">
              Entre com suas credenciais para acessar a plataforma.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5">

            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]">
                E-mail
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-11 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setRemember(v => !v)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                    remember
                      ? "bg-orange-500 border-orange-500"
                      : "border-slate-300 group-hover:border-orange-400"
                  }`}
                >
                  {remember && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-slate-500 select-none">Lembrar de mim</span>
              </label>
              <button
                type="button"
                onClick={() => router.push("/login/esqueci-senha")}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Erro */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar na Plataforma"
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Não tem acesso?{" "}
              <button
                onClick={() => router.push("/?pg=contato")}
                className="text-orange-500 hover:text-orange-600 font-semibold transition-colors"
              >
                Fale com a nossa equipe
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Stacky — assistente de suporte ao login */}
      <Mascote modo="login" />
    </div>
  )
}
