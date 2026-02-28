"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Contact() {
  const [form, setForm] = useState({ nome: "", email: "", mensagem: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = () => {
    if (form.nome && form.email && form.mensagem) setSent(true)
  }

  return (
    <section id="contato" className="py-28 px-[5%] bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge>Fale Conosco</Badge>
          <h2 className="font-serif text-[clamp(28px,4vw,52px)] font-black mt-4 mb-4 tracking-tight">
            Pronto para <span className="text-green-500">transformar</span><br />seu negócio?
          </h2>
          <div className="w-14 h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded mx-auto mb-4" />
          <p className="text-neutral-500 text-base">Envie uma mensagem e respondemos em até 24 horas.</p>
        </motion.div>

        {!sent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-[11px] text-neutral-600 uppercase tracking-widest block mb-2">Nome</label>
                <input
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-100 placeholder-neutral-700 outline-none focus:border-green-700 transition-colors"
                  placeholder="Seu nome completo"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-600 uppercase tracking-widest block mb-2">E-mail</label>
                <input
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-100 placeholder-neutral-700 outline-none focus:border-green-700 transition-colors"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="text-[11px] text-neutral-600 uppercase tracking-widest block mb-2">Como podemos ajudar?</label>
              <textarea
                className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-100 placeholder-neutral-700 outline-none focus:border-green-700 transition-colors resize-y"
                placeholder="Conte sobre sua empresa e o principal desafio que enfrenta..."
                rows={5}
                value={form.mensagem}
                onChange={e => setForm({ ...form, mensagem: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-sm text-neutral-600">
                Respondemos em até <strong className="text-green-500">24 horas</strong>
              </p>
              <Button size="lg" onClick={handleSubmit}>Enviar Mensagem →</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-neutral-900 to-green-950/20 border border-green-900/30 rounded-3xl p-16 text-center"
          >
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-serif text-2xl font-bold text-green-500 mb-3">Mensagem Enviada!</h3>
            <p className="text-neutral-500 text-sm mb-6">Obrigado por entrar em contato. Retornaremos em breve.</p>
            <Button variant="outline" onClick={() => setSent(false)}>Enviar outra mensagem</Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
