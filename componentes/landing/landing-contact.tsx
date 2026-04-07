"use client"
import { useState } from "react"
import { motion } from "motion/react"
import { Badge } from "@/componentes/ui/badge"
import { Mail, User, MessageSquare, Send, CheckCircle, Building2 } from "lucide-react"

const ease = [0.22, 1, 0.36, 1] as const

export default function Contact() {
  const [form, setForm] = useState({ nome: "", empresa: "", email: "", mensagem: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.nome && form.email && form.mensagem) setSent(true)
  }

  return (
    <section id="contato" className="py-28 px-[5%] bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.4)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(249,115,22,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65, ease }}
          className="flex flex-col items-center text-center mb-12"
        >
          <Badge>Fale Conosco</Badge>
          <h2 className="font-serif text-[clamp(30px,4.5vw,54px)] font-bold mt-5 mb-4 tracking-tight leading-[1.08] text-slate-900">
            Vamos construir seu{" "}
            <span className="text-gradient">sistema</span>
            <br />juntos?
          </h2>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-orange-200 rounded" />
            <div className="w-10 h-1 bg-orange-500 rounded" />
            <div className="h-px w-8 bg-orange-200 rounded" />
          </div>
          <p className="text-slate-500 text-base">
            Envie uma mensagem e nossa equipe retorna em até{" "}
            <span className="text-orange-500 font-semibold">24 horas</span>.
          </p>
        </motion.div>

        {!sent ? (
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-2xl shadow-slate-100"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              {/* Nome */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-slate-500 uppercase tracking-[0.14em] font-bold flex items-center gap-2">
                  <User size={11} /> Nome
                </label>
                <input
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>

              {/* Empresa */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] text-slate-500 uppercase tracking-[0.14em] font-bold flex items-center gap-2">
                  <Building2 size={11} /> Empresa
                </label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="Nome da empresa"
                  value={form.empresa}
                  onChange={e => setForm({ ...form, empresa: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2 mb-5">
              <label className="text-[11px] text-slate-500 uppercase tracking-[0.14em] font-bold flex items-center gap-2">
                <Mail size={11} /> E-mail corporativo
              </label>
              <input
                required
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                placeholder="seu@empresa.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            {/* Mensagem */}
            <div className="flex flex-col gap-2 mb-7">
              <label className="text-[11px] text-slate-500 uppercase tracking-[0.14em] font-bold flex items-center gap-2">
                <MessageSquare size={11} /> Descreva o projeto
              </label>
              <textarea
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                placeholder="Conte sobre sua empresa, o sistema que precisa e os principais desafios..."
                rows={5}
                value={form.mensagem}
                onChange={e => setForm({ ...form, mensagem: e.target.value })}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Retorno em até <strong className="text-orange-500">24h</strong>
              </div>
              <button
                type="submit"
                className="group bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-[0.1em] transition-all shadow-xl shadow-orange-200 flex items-center gap-2.5"
              >
                Solicitar Contato
                <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease }}
            className="bg-gradient-to-b from-orange-50 to-white border border-orange-200 rounded-3xl p-16 flex flex-col items-center text-center shadow-xl shadow-orange-50"
          >
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-6">
              <CheckCircle className="text-orange-500" size={32} />
            </div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 mb-3">Mensagem Enviada!</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed">
              Obrigado pelo contato. Nossa equipe retornará em breve com uma proposta personalizada.
            </p>
            <button
              onClick={() => { setSent(false); setForm({ nome: "", empresa: "", email: "", mensagem: "" }) }}
              className="border-2 border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 font-bold px-7 py-3 rounded-xl text-sm uppercase tracking-[0.1em] transition-all"
            >
              Enviar outra mensagem
            </button>
          </motion.div>
        )}

        {/* Trust */}
        {!sent && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-8 mt-8 flex-wrap"
          >
            {[
              ["🔒", "Dados protegidos"],
              ["⚡", "Resposta rápida"],
              ["📋", "Proposta sem custo"],
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>{icon}</span>
                {label}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
