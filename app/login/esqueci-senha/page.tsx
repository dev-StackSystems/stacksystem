"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

export default function EsqueciSenhaPage() {
  const router = useRouter()
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro,    setErro]    = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!email) { setErro("Informe o e-mail cadastrado."); return }

    setLoading(true)
    try {
      const res  = await fetch("/api/auth/esqueci-senha", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.erro ?? "Erro ao enviar. Tente novamente."); return }
      setEnviado(true)
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">

      {/* Fundo decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px] opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.07)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="relative w-full max-w-[400px]"
      >
        {/* Voltar */}
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-orange-500 transition-colors font-semibold uppercase tracking-wider mb-8 group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao login
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.ico" alt="StackSystems" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-serif text-[17px] font-bold text-slate-900">
            Stack<span className="text-orange-500">Systems</span>
          </span>
        </div>

        {enviado ? (
          /* ── Estado: e-mail enviado ────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <h2 className="font-serif text-[24px] font-bold text-slate-900 mb-3">
              E-mail enviado!
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Se o endereço <span className="font-semibold text-slate-700">{email}</span> estiver
              cadastrado, você receberá um link para redefinir a senha em alguns instantes.
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Verifique também a pasta de spam. O link expira em <strong>1 hora</strong>.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-lg shadow-orange-200"
            >
              Voltar ao login
            </button>
          </motion.div>
        ) : (
          /* ── Formulário ───────────────────────────────────────────── */
          <>
            <h2 className="font-serif text-[26px] font-bold text-slate-900 mb-2">
              Esqueceu a senha?
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  />
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 font-medium">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                ) : (
                  "Enviar link de redefinição"
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
