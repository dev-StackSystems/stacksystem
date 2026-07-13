"use client"
import { useState, useEffect } from "react"
import { X, Loader2, CalendarPlus, Clock } from "lucide-react"
import { useFormModal } from "@/lib/hooks/use-form-modal"
import { useToast } from "@/components/layout/provedor-toast"
import { brlBarbearia } from "@/lib/barbearia"

type Mode = "create" | "edit"

export interface OpcaoBarbeiro { id: string; nome: string; apelido?: string | null }
export interface OpcaoServico { id: string; nome: string; duracaoMin: number; preco: number }
export interface OpcaoCliente { id: string; nome: string }

export interface AgendamentoData {
  id: string
  barbeiroId: string
  servicoId: string
  clienteId?: string | null
  clienteAvulso?: string | null
  dataHora: string | Date
  observacao?: string | null
  status: string
}

interface Props {
  mode: Mode
  agendamento?: AgendamentoData
  barbeiros: OpcaoBarbeiro[]
  servicos: OpcaoServico[]
  clientes: OpcaoCliente[]
  dataPadrao?: string   // AAAA-MM-DD para novos agendamentos
  trigger: React.ReactNode
}

const labelClass = "block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1"
const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
const selectClass = inputClass

function splitData(v: string | Date): { data: string; hora: string } {
  const d = new Date(v)
  if (isNaN(d.getTime())) return { data: "", hora: "09:00" }
  const p = (n: number) => String(n).padStart(2, "0")
  return { data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, hora: `${p(d.getHours())}:${p(d.getMinutes())}` }
}

export function AgendamentoFormModal({ mode, agendamento, barbeiros, servicos, clientes, dataPadrao, trigger }: Props) {
  const { open, setOpen, loading, setLoading, error, setError, close, closeAndRefresh } = useFormModal()
  const { toast } = useToast()

  const vazio = {
    barbeiroId: barbeiros[0]?.id ?? "",
    servicoId: servicos[0]?.id ?? "",
    clienteId: "",
    clienteAvulso: "",
    data: dataPadrao ?? new Date().toISOString().slice(0, 10),
    hora: "09:00",
    observacao: "",
  }
  const [form, setForm] = useState(vazio)
  const [tipoCli, setTipoCli] = useState<"cadastrado" | "avulso">("cadastrado")

  useEffect(() => {
    if (open && agendamento && mode === "edit") {
      const { data, hora } = splitData(agendamento.dataHora)
      setForm({
        barbeiroId: agendamento.barbeiroId,
        servicoId: agendamento.servicoId,
        clienteId: agendamento.clienteId ?? "",
        clienteAvulso: agendamento.clienteAvulso ?? "",
        data, hora, observacao: agendamento.observacao ?? "",
      })
      setTipoCli(agendamento.clienteId ? "cadastrado" : agendamento.clienteAvulso ? "avulso" : "cadastrado")
    } else if (open) {
      setForm({ ...vazio, data: dataPadrao ?? new Date().toISOString().slice(0, 10) })
      setTipoCli("cadastrado")
    }
    setError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const servicoSel = servicos.find((s) => s.id === form.servicoId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.barbeiroId) { setError("Escolha o profissional."); return }
    if (!form.servicoId) { setError("Escolha o serviço."); return }
    if (!form.data || !form.hora) { setError("Informe data e horário."); return }
    if (tipoCli === "avulso" && !form.clienteAvulso.trim()) { setError("Digite o nome do cliente."); return }

    setLoading(true)
    try {
      const dataHora = new Date(`${form.data}T${form.hora}:00`).toISOString()
      const payload = {
        barbeiroId: form.barbeiroId,
        servicoId: form.servicoId,
        clienteId: tipoCli === "cadastrado" ? (form.clienteId || null) : null,
        clienteAvulso: tipoCli === "avulso" ? form.clienteAvulso.trim() : null,
        dataHora,
        observacao: form.observacao || null,
      }
      const url = mode === "create" ? "/api/barbearia/agendamentos" : `/api/barbearia/agendamentos/${agendamento!.id}`
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { const msg = data.error ?? "Erro ao salvar agendamento."; setError(msg); toast(msg, "erro"); return }
      toast(mode === "create" ? "Agendamento criado!" : "Agendamento atualizado!", "sucesso")
      closeAndRefresh()
    } catch { const msg = "Erro de conexão. Tente novamente."; setError(msg); toast(msg, "erro") } finally { setLoading(false) }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarPlus size={16} className="text-brand-500" /> {mode === "create" ? "Novo Agendamento" : "Editar Agendamento"}
              </h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              {barbeiros.length === 0 || servicos.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  Cadastre pelo menos um <strong>profissional</strong> e um <strong>serviço</strong> antes de agendar.
                </div>
              ) : null}

              <div>
                <label className={labelClass}>Profissional <span className="text-red-400">*</span></label>
                <select value={form.barbeiroId} onChange={(e) => f("barbeiroId", e.target.value)} className={selectClass}>
                  {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.nome}{b.apelido ? ` (${b.apelido})` : ""}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Serviço <span className="text-red-400">*</span></label>
                <select value={form.servicoId} onChange={(e) => f("servicoId", e.target.value)} className={selectClass}>
                  {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
                {servicoSel && (
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <Clock size={11} /> {servicoSel.duracaoMin} min · <span className="font-semibold text-slate-500">{brlBarbearia(servicoSel.preco)}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Data <span className="text-red-400">*</span></label>
                  <input type="date" value={form.data} onChange={(e) => f("data", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Hora <span className="text-red-400">*</span></label>
                  <input type="time" value={form.hora} onChange={(e) => f("hora", e.target.value)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Cliente</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {(["cadastrado", "avulso"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTipoCli(t)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${tipoCli === t ? "bg-brand-500 border-brand-500 text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}>
                      {t === "cadastrado" ? "Da carteira" : "Avulso"}
                    </button>
                  ))}
                </div>
                {tipoCli === "cadastrado" ? (
                  <select value={form.clienteId} onChange={(e) => f("clienteId", e.target.value)} className={selectClass}>
                    <option value="">— Sem cliente —</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                ) : (
                  <input value={form.clienteAvulso} onChange={(e) => f("clienteAvulso", e.target.value)} className={inputClass} placeholder="Nome do cliente" />
                )}
              </div>

              <div>
                <label className={labelClass}>Observação</label>
                <input value={form.observacao} onChange={(e) => f("observacao", e.target.value)} className={inputClass} placeholder="Opcional" />
              </div>

              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={close} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm transition-all">Cancelar</button>
                <button type="submit" disabled={loading || barbeiros.length === 0 || servicos.length === 0} className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}{mode === "create" ? "Agendar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
