"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function Contact() {
  const [form, setForm] = useState({ nome: "", email: "", mensagem: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = () => {
    if (form.nome && form.email && form.mensagem) setSent(true)
  }

  return (
    <section id="contato" className="py-28 px-[5%] bg-white">
      <div className="max-w-3xl mx-auto">

        <div className="flex flex-col items-center text-center mb-14 anim-fade-up">
          <Badge>Fale Conosco</Badge>
          <h2 className="font-serif text-[clamp(28px,4vw,52px)] font-black mt-4 mb-4 tracking-tight text-neutral-900">
            Pronto para <span className="text-orange-500">transformar</span><br />seu negócio?
          </h2>
          <div className="w-14 h-1 bg-orange-500 rounded mb-5" />
          <p className="text-neutral-500 text-base">Envie uma mensagem e respondemos em até 24 horas.</p>
        </div>

        {!sent ? (
          <div className="anim-fade-up-d1 bg-white border border-neutral-200 rounded-3xl p-10 shadow-xl shadow-neutral-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-[11px] text-neutral-500 uppercase tracking-widest block mb-2 font-semibold">Nome</label>
                <input
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-500 uppercase tracking-widest block mb-2 font-semibold">E-mail</label>
                <input
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] text-neutral-500 uppercase tracking-widest block mb-2 font-semibold">Como podemos ajudar?</label>
              <textarea
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all resize-y"
                placeholder="Conte sobre sua empresa e o principal desafio que enfrenta..."
                rows={5}
                value={form.mensagem}
                onChange={e => setForm({ ...form, mensagem: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-center flex-wrap gap-4">
              <p className="text-sm text-neutral-400">
                Respondemos em até <strong className="text-orange-500">24 horas</strong>
              </p>
              <button
                onClick={handleSubmit}
                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold px-8 py-3.5 rounded-xl text-sm uppercase tracking-widest transition-all shadow-lg shadow-orange-200"
              >
                Enviar Mensagem →
              </button>
            </div>
          </div>
        ) : (
          <div className="anim-fade-in bg-orange-50 border border-orange-200 rounded-3xl p-16 flex flex-col items-center text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-serif text-2xl font-bold text-orange-600 mb-3">Mensagem Enviada!</h3>
            <p className="text-neutral-500 text-sm mb-6">Obrigado por entrar em contato. Retornaremos em breve.</p>
            <button
              onClick={() => setSent(false)}
              className="border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white font-bold px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all"
            >
              Enviar outra mensagem
            </button>
          </div>
        )}
      </div>
    </section>
  )
}