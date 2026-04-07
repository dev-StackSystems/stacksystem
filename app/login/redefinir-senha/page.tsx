"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

function RedefinirSenhaForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get("token") ?? ""

  const [novaSenha,   setNovaSenha]   = useState("")
  const [confirmar,   setConfirmar]   = useState("")
  const [showPass,    setShowPass]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [sucesso,     setSucesso]     = useState(false)
  const [erro,        setErro]        = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    if (!token)               { setErro("Token inválido. Solicite um novo link."); return }
    if (novaSenha.length < 6) { setErro("A senha deve ter ao menos 6 caracteres."); return }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem."); return }

    setLoading(true)
    try {
      const res  = await fetch("/api/auth/redefinir-senha", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, novaSenha }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.erro ?? "Erro ao redefinir senha."); return }
      setSucesso(true)
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
          <XCircle size={28} className="text-red-500" />
        </div>
        <h2 className="font-serif text-[22px] font-bold text-slate-900 mb-3">Link inválido</h2>
        <p className="text-slate-500 text-sm mb-6">
          O link de redefinição é inválido ou está incompleto.
        </p>
        <button
          onClick={() => router.push("/login/esqueci-senha")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-lg shadow-orange-200"
        >
          Solicitar novo link
        </button>
      </div>
    )
  }

  if (sucesso) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={28} className="text-emerald-500" />
        </div>
        <h2 className="font-serif text-[24px] font-bold text-slate-900 mb-3">Senha redefinida!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-lg shadow-orange-200"
        >
          Ir para o login
        </button>
      </motion.div>
    )
  }

  return (
    <>
      <h2 className="font-serif text-[26px] font-bold text-slate-900 mb-2">
        Nova senha
      </h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">
        Defina sua nova senha de acesso. Use ao menos 6 caracteres.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Nova senha */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]">
            Nova senha
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              required
              placeholder="••••••••"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-11 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirmar senha */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]">
            Confirmar senha
          </label>
          <input
            type={showPass ? "text" : "password"}
            required
            placeholder="••••••••"
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
          />
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
            <><Loader2 size={16} className="animate-spin" /> Salvando...</>
          ) : (
            "Salvar nova senha"
          )}
        </button>
      </form>
    </>
  )
}

export default function RedefinirSenhaPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px] opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.07)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="relative w-full max-w-[400px]"
      >
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-orange-500 transition-colors font-semibold uppercase tracking-wider mb-8 group"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao login
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white text-lg font-serif shadow-md shadow-orange-200">
            S
          </div>
          <span className="font-serif text-[17px] font-bold text-slate-900">
            Stack<span className="text-orange-500">Systems</span>
          </span>
        </div>

        <Suspense fallback={<div className="text-slate-400 text-sm">Carregando...</div>}>
          <RedefinirSenhaForm />
        </Suspense>
      </motion.div>
    </div>
  )
}
