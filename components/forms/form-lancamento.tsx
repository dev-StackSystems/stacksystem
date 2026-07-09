"use client"
import { useState, useEffect } from "react"
import { X, Loader2, Repeat } from "lucide-react"
import { useFormModal } from "@/lib/hooks/use-form-modal"
import { STATUS_LANCAMENTO, FREQUENCIAS } from "@/lib/financeiro"

type Mode = "create" | "edit"

export interface OpcaoSimples { id: string; nome: string }
export interface OpcaoCategoria { id: string; nome: string; natureza: string }

export interface LancamentoData {
  id: string
  tipo: string
  descricao: string
  valor: number | string
  status: string
  dataCompetencia: string | Date
  dataVencimento?: string | Date | null
  dataPagamento?: string | Date | null
  contatoId?: string | null
  contaId?: string | null
  categoriaId?: string | null
  centroCustoId?: string | null
  observacao?: string | null
  parcelaNum?: number | null
  parcelaTotal?: number | null
  grupoRecorrenciaId?: string | null
  conciliado?: boolean
  contato?: { nome: string; tipoPessoa: string; documento: string | null } | null
  conta?: { nome: string } | null
  categoria?: { nome: string; natureza: string } | null
  centroCusto?: { nome: string } | null
}

interface Props {
  mode: Mode
  lancamento?: LancamentoData
  tipoInicial?: "receita" | "despesa"
  contatos: OpcaoSimples[]
  contas: OpcaoSimples[]
  categorias: OpcaoCategoria[]
  centros: OpcaoSimples[]
  trigger: React.ReactNode
}

const labelClass = "block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1"
const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
const selectClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-400 transition-all"

function toDate(v?: string | Date | null): string {
  if (!v) return ""
  const d = new Date(v)
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
}

export function LancamentoFormModal({ mode, lancamento, tipoInicial, contatos, contas, categorias, centros, trigger }: Props) {
  const { open, setOpen, loading, setLoading, error, setError, close, closeAndRefresh } = useFormModal()

  const vazio = {
    tipo: (tipoInicial ?? "despesa") as string,
    descricao: "", valor: "", status: "pendente",
    dataCompetencia: new Date().toISOString().slice(0, 10),
    dataVencimento: "", dataPagamento: "",
    contatoId: "", contaId: "", categoriaId: "", centroCustoId: "", observacao: "",
  }
  const [form, setForm] = useState(vazio)
  const [repetir, setRepetir] = useState(false)
  const [parcelaTotal, setParcelaTotal] = useState("2")
  const [frequencia, setFrequencia] = useState("mensal")
  const [dividirValor, setDividirValor] = useState(false)

  useEffect(() => {
    if (open && lancamento && mode === "edit") {
      setForm({
        tipo: lancamento.tipo,
        descricao: lancamento.descricao,
        valor: String(lancamento.valor),
        status: lancamento.status,
        dataCompetencia: toDate(lancamento.dataCompetencia),
        dataVencimento: toDate(lancamento.dataVencimento),
        dataPagamento: toDate(lancamento.dataPagamento),
        contatoId: lancamento.contatoId ?? "",
        contaId: lancamento.contaId ?? "",
        categoriaId: lancamento.categoriaId ?? "",
        centroCustoId: lancamento.centroCustoId ?? "",
        observacao: lancamento.observacao ?? "",
      })
    } else if (open) {
      setForm({ ...vazio, tipo: tipoInicial ?? "despesa" })
      setRepetir(false); setParcelaTotal("2"); setFrequencia("mensal"); setDividirValor(false)
    }
    setError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const f = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.descricao.trim()) { setError("Descrição é obrigatória."); return }
    if (!form.valor || parseFloat(form.valor) <= 0) { setError("Informe um valor maior que zero."); return }

    setLoading(true)
    try {
      const url = mode === "create" ? "/api/financeiro/lancamentos" : `/api/financeiro/lancamentos/${lancamento!.id}`
      const payload: Record<string, unknown> = {
        tipo: form.tipo,
        descricao: form.descricao.trim(),
        valor: parseFloat(form.valor),
        status: form.status,
        dataCompetencia: form.dataCompetencia || null,
        dataVencimento: form.dataVencimento || null,
        dataPagamento: form.dataPagamento || null,
        contatoId: form.contatoId || null,
        contaId: form.contaId || null,
        categoriaId: form.categoriaId || null,
        centroCustoId: form.centroCustoId || null,
        observacao: form.observacao || null,
      }
      if (mode === "create" && repetir) {
        payload.parcelaTotal = Math.max(2, parseInt(parcelaTotal) || 2)
        payload.frequencia = frequencia
        payload.dividirValor = dividirValor
      }
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erro ao salvar lançamento."); return }
      closeAndRefresh()
    } catch { setError("Erro de conexão. Tente novamente.") } finally { setLoading(false) }
  }

  const categoriasFiltradas = categorias.filter((c) => c.natureza === form.tipo)
  const receita = form.tipo === "receita"

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-base font-bold text-slate-900">{mode === "create" ? "Novo Lançamento" : "Editar Lançamento"}</h2>
              <button onClick={close} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
              {/* Tipo (toggle receita/despesa) */}
              <div className="grid grid-cols-2 gap-2">
                {(["receita", "despesa"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => f("tipo", t)}
                    className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                      form.tipo === t
                        ? t === "receita" ? "bg-emerald-500 border-emerald-500 text-white" : "bg-red-500 border-red-500 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}>
                    {t === "receita" ? "Receita" : "Despesa"}
                  </button>
                ))}
              </div>

              <div>
                <label className={labelClass}>Descrição <span className="text-red-400">*</span></label>
                <input value={form.descricao} onChange={(e) => f("descricao", e.target.value)} className={inputClass} placeholder={receita ? "Ex: Venda de serviço" : "Ex: Aluguel do mês"} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Valor (R$) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => f("valor", e.target.value)} className={inputClass} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={form.status} onChange={(e) => f("status", e.target.value)} className={selectClass}>
                    {STATUS_LANCAMENTO.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Competência</label>
                  <input type="date" value={form.dataCompetencia} onChange={(e) => f("dataCompetencia", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Vencimento</label>
                  <input type="date" value={form.dataVencimento} onChange={(e) => f("dataVencimento", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pagamento</label>
                  <input type="date" value={form.dataPagamento} onChange={(e) => f("dataPagamento", e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Contato (CPF/CNPJ)</label>
                  <select value={form.contatoId} onChange={(e) => f("contatoId", e.target.value)} className={selectClass}>
                    <option value="">— Nenhum —</option>
                    {contatos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Conta</label>
                  <select value={form.contaId} onChange={(e) => f("contaId", e.target.value)} className={selectClass}>
                    <option value="">— Nenhuma —</option>
                    {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Categoria</label>
                  <select value={form.categoriaId} onChange={(e) => f("categoriaId", e.target.value)} className={selectClass}>
                    <option value="">— Nenhuma —</option>
                    {categoriasFiltradas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                {centros.length > 0 && (
                  <div>
                    <label className={labelClass}>Centro de Custo</label>
                    <select value={form.centroCustoId} onChange={(e) => f("centroCustoId", e.target.value)} className={selectClass}>
                      <option value="">— Nenhum —</option>
                      {centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Observação</label>
                <input value={form.observacao} onChange={(e) => f("observacao", e.target.value)} className={inputClass} placeholder="Opcional" />
              </div>

              {/* Recorrência / parcelamento (apenas no cadastro) */}
              {mode === "create" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} className="accent-brand-500 w-4 h-4" />
                    <Repeat size={14} className="text-brand-500" />
                    <span className="text-sm font-semibold text-slate-700">Repetir / parcelar este lançamento</span>
                  </label>
                  {repetir && (
                    <div className="mt-3 flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass}>Nº de ocorrências</label>
                          <input type="number" min="2" max="360" value={parcelaTotal} onChange={(e) => setParcelaTotal(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <label className={labelClass}>Frequência</label>
                          <select value={frequencia} onChange={(e) => setFrequencia(e.target.value)} className={selectClass}>
                            {FREQUENCIAS.map((fr) => <option key={fr.value} value={fr.value}>{fr.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                        <input type="checkbox" checked={dividirValor} onChange={(e) => setDividirValor(e.target.checked)} className="accent-brand-500 w-4 h-4" />
                        Dividir o valor total entre as parcelas (senão, repete o mesmo valor a cada ocorrência)
                      </label>
                    </div>
                  )}
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={close} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}{mode === "create" ? "Criar Lançamento" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
