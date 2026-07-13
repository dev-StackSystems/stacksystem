/**
 * lib/barbearia.ts
 * Constantes e helpers de domínio do módulo Barbearia (agenda/clientes/serviços/equipe).
 */

export const STATUS_AGENDAMENTO = [
  { value: "agendado",  label: "Agendado",  cor: "bg-blue-50 text-blue-600 border-blue-200" },
  { value: "concluido", label: "Concluído", cor: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { value: "cancelado", label: "Cancelado", cor: "bg-slate-100 text-slate-500 border-slate-200" },
  { value: "faltou",    label: "Faltou",    cor: "bg-red-50 text-red-500 border-red-200" },
] as const

export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number]["value"]

/** Metadados (label/cor) de um status; cai em "agendado". */
export function metaStatusAgendamento(v?: string | null) {
  return STATUS_AGENDAMENTO.find((s) => s.value === v) ?? STATUS_AGENDAMENTO[0]
}

/** Paleta de cores sugeridas para barbeiros/serviços na agenda. */
export const CORES_BARBEARIA = [
  "#c9a84c", "#2563eb", "#059669", "#dc2626",
  "#7c3aed", "#ea580c", "#0891b2", "#db2777",
]

export const brlBarbearia = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
