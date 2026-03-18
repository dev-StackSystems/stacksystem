"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Mail, User, MessageSquare, Send, CheckCircle } from "lucide-react"

export default function Contact() {
  const [form, setForm] = useState({ nome: "", email: "", mensagem: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.nome && form.email && form.mensagem) setSent(true)
  }

  return (
    <section id="contato" className="py-28 px-[5%] bg-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12 anim-fade-up">
          <Badge>Fale Conosco</Badge>
          <h2 className="font-serif text-[clamp(30px,4.5vw,54px)] font-black mt-5 mb-4 tracking-tight leading-[1.08] text-neutral-900">
            Pronto para{" "}
            <span className="text-orange-500">transformar</span>
            <br />seu negócio?
          </h2>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-orange-200 rounded" />
            <div className="w-10 h-1 bg-orange-500 rounded" />
            <div className="h-px w-8 bg-orange-200 rounded" />
          </div>
          <p className="text-neutral-500 text-base">
            Envie uma mensagem e respondemos em até{" "}
            <span className="text-orange-500 font-semibold">24 horas</span>.
          </p>
        </div>

        {!sent ? (
          <form
            onSubmit={handleSubmit}
            className="anim-fade-up-d1 bg-white border border-neutral-200/80 rounded-3xl p-8 md:p-10 shadow-2xl shadow-neutral-100"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              {/* Nome */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-neutral-500 uppercase tracking-[0.14em] font-bold flex items-center gap-2">
                  <User size={11} />
                  Nome
                </label>
                <input
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-neutral-500 uppercase tracking-[0.14em] font-bold flex items-center gap-2">
                  <Mail size={11} />
                  E-mail
                </label>
                <input
                  required
                  type="email"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Mensagem */}
            <div className="flex flex-col gap-2 mb-7">
              <label className="text-[11px] text-neutral-500 uppercase tracking-[0.14em] font-bold flex items-center gap-2">
                <MessageSquare size={11} />
                Como podemos ajudar?
              </label>
              <textarea
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                placeholder="Conte sobre sua empresa e o principal desafio que enfrenta..."
                rows={5}
                value={form.mensagem}
                onChange={e => setForm({ ...form, mensagem: e.target.value })}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Respondemos em até{" "}
                <strong className="text-orange-500">24h</strong>
              </div>
              <button
                type="submit"
                className="group bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-xl shadow-orange-200 flex items-center gap-2.5"
              >
                Enviar Mensagem
                <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </form>
        ) : (
          <div className="anim-fade-in bg-gradient-to-b from-orange-50 to-white border border-orange-200 rounded-3xl p-16 flex flex-col items-center text-center shadow-xl shadow-orange-50">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-6">
              <CheckCircle className="text-orange-500" size={32} />
            </div>
            <h3 className="font-serif text-2xl font-bold text-neutral-900 mb-3">
              Mensagem Enviada!
            </h3>
            <p className="text-neutral-500 text-sm mb-8 max-w-xs leading-relaxed">
              Obrigado por entrar em contato. Nossa equipe retornará em breve.
            </p>
            <button
              onClick={() => { setSent(false); setForm({ nome: "", email: "", mensagem: "" }) }}
              className="border-2 border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 font-bold px-7 py-3 rounded-xl text-sm uppercase tracking-[0.1em] transition-all"
            >
              Enviar outra mensagem
            </button>
          </div>
        )}

        {/* Trust indicators */}
        {!sent && (
          <div className="anim-fade-up-d2 flex items-center justify-center gap-8 mt-8 flex-wrap">
            {[
              ["🔒", "100% seguro"],
              ["⚡", "Resposta rápida"],
              ["💬", "Sem compromisso"],
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                <span>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
