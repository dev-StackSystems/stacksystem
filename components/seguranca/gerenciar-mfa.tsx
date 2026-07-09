"use client"
import { useState } from "react"
import { ShieldCheck, Loader2, QrCode } from "lucide-react"
import { useToast } from "@/components/layout/provedor-toast"
import { useConfirm } from "@/components/layout/provedor-confirmacao"

export function GerenciarMfa({ ativoInicial }: { ativoInicial: boolean }) {
  const { toast } = useToast()
  const confirmar = useConfirm()
  const [ativo, setAtivo] = useState(ativoInicial)
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState("")
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  const call = async (action: string, extra?: Record<string, unknown>) => {
    const res = await fetch("/api/seguranca/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    })
    return { res, data: await res.json() }
  }

  const iniciar = async () => {
    setLoading(true); setErro("")
    const { res, data } = await call("setup")
    setLoading(false)
    if (!res.ok) { setErro(data.error ?? "Erro ao gerar QR Code."); return }
    setQr(data.qr); setSecret(data.secret)
  }

  const ativar = async () => {
    setLoading(true); setErro("")
    const { res, data } = await call("ativar", { codigo })
    setLoading(false)
    if (!res.ok) { setErro(data.error ?? "Código inválido."); return }
    setAtivo(true); setQr(null); setCodigo(""); toast("2FA ativado com sucesso.", "sucesso")
  }

  const desativar = async () => {
    if (!(await confirmar({ titulo: "Desativar 2FA", mensagem: "Sua conta ficará protegida apenas por senha. Deseja desativar o 2FA?", confirmar: "Desativar", perigo: true }))) return
    setLoading(true)
    const { res } = await call("desativar")
    setLoading(false)
    if (res.ok) { setAtivo(false); toast("2FA desativado.", "info") }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ativo ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500"}`}>
          <ShieldCheck size={20} />
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-base font-bold text-slate-900">Autenticação em dois fatores</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {ativo
              ? "Ativa — além da senha, seu login exige um código do app autenticador."
              : "Adicione uma camada extra de segurança usando um app como Google Authenticator ou Authy."}
          </p>
          <span className={`inline-block mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${ativo ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
            {ativo ? "Ativado" : "Desativado"}
          </span>
        </div>
      </div>

      {/* Ativo → botão desativar */}
      {ativo && (
        <button onClick={desativar} disabled={loading}
          className="mt-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />} Desativar 2FA
        </button>
      )}

      {/* Inativo → fluxo de ativação */}
      {!ativo && !qr && (
        <button onClick={iniciar} disabled={loading}
          className="mt-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={16} />} Ativar 2FA
        </button>
      )}

      {!ativo && qr && (
        <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-6">
          <div className="shrink-0 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR Code do 2FA" width={160} height={160} className="rounded-xl border border-slate-200" />
            <p className="text-[11px] text-slate-400 mt-2 font-mono break-all max-w-[160px]">{secret}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600 mb-3">
              1. Escaneie o QR Code no seu app autenticador (ou digite o código manual acima).<br />
              2. Informe o código de 6 dígitos gerado para confirmar.
            </p>
            <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Código de verificação</label>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} inputMode="numeric" placeholder="000000"
              className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all tracking-[0.3em] text-center font-mono" />
            {erro && <p className="text-xs text-red-600 font-medium mt-2">{erro}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setQr(null); setErro("") }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm transition-all">Cancelar</button>
              <button onClick={ativar} disabled={loading || codigo.length < 6}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />} Confirmar e ativar
              </button>
            </div>
          </div>
        </div>
      )}

      {erro && !qr && <p className="text-xs text-red-600 font-medium mt-2">{erro}</p>}
    </div>
  )
}
