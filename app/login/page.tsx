"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "motion/react"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"

// ─────────────────────────────────────────────
//  BANNERS — edite à vontade
// ─────────────────────────────────────────────
const BANNERS = [
  {
    icon: "📊",
    title: "Dashboards em tempo real",
    desc: "Acompanhe faturamento, despesas e KPIs do seu negócio em um único painel.",
  },
  {
    icon: "🔁",
    title: "Processos automatizados",
    desc: "Tarefas manuais eliminadas, erros reduzidos e mais tempo para o que importa.",
  },
  {
    icon: "🔗",
    title: "Tudo integrado",
    desc: "Vendas, estoque, financeiro e RH conectados em uma só plataforma.",
  },
]

const ease = [0.22, 1, 0.36, 1] as const

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]         = useState({ email: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.email || !form.password) {
      setError("Preencha e-mail e senha para continuar.")
      return
    }

    setLoading(true)

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      const errorMessages: Record<string, string> = {
        USER_NOT_FOUND:  "Nenhuma conta encontrada com este e-mail.",
        WRONG_PASSWORD:  "Senha incorreta. Tente novamente.",
        USER_INACTIVE:   "Este usuário está inativo. Contate o administrador.",
        MISSING_FIELDS:  "Preencha e-mail e senha para continuar.",
        DB_ERROR:        "Erro ao conectar no banco de dados. Verifique as configurações do servidor.",
      }
      setError(errorMessages[result.error] ?? `Erro de autenticação: ${result.error}`)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ══════════════════════════════════════
          ESQUERDA — Banner / Branding
      ══════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col bg-slate-950 overflow-hidden">

        {/* Background glows */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.18)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.07)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

        {/* Spinning ring decoration */}
        <div className="absolute top-[38%] right-[-80px] w-[320px] h-[320px] border border-dashed border-orange-500/15 rounded-full animate-spin-slow pointer-events-none" />

        <div className="relative flex flex-col h-full p-12">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-xl font-serif shadow-lg shadow-orange-500/25">
              S
            </div>
            <div>
              <div className="font-serif text-[17px] font-bold text-white">
                Stack<span className="text-orange-400">Systems</span>
              </div>
              <div className="text-[9px] text-white/30 uppercase tracking-[0.15em] font-semibold">
                Sistemas &amp; Soluções
              </div>
            </div>
          </motion.div>

          {/* Main copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="mt-auto mb-10"
          >
            <h1 className="font-serif text-[clamp(28px,3vw,42px)] font-bold text-white leading-[1.1] mb-4">
              Sua plataforma de<br />
              <span className="text-gradient">gestão inteligente</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Acesse seus sistemas, dashboards e relatórios — tudo em um único lugar, disponível 24h.
            </p>
          </motion.div>

          {/* Banners */}
          <div className="flex flex-col gap-3 mb-auto">
            {BANNERS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.1, ease }}
                className="flex items-start gap-4 bg-white/[0.04] border border-white/[0.07] rounded-xl px-5 py-4 hover:bg-white/[0.07] hover:border-orange-500/25 transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center text-lg shrink-0">
                  {b.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-0.5 group-hover:text-orange-400 transition-colors">
                    {b.title}
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed">{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom version */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-10 flex items-center justify-between"
          >
            <span className="text-xs text-slate-600">© 2025 StackSystems</span>
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
            S
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]">
                E-mail
              </label>
              <input
                type="email"
                required
                autoComplete="email"
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
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
    </div>
  )
}
