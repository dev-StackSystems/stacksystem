/**
 * lib/financeiro.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Helpers e constantes de domínio do módulo Financeiro, reutilizados pelas
 * rotas de API e pelos formulários/tabelas do painel.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Constantes (usadas em <select> e badges) ─────────────────────────────────

export const TIPOS_PESSOA = [
  { value: "PF", label: "Pessoa Física (CPF)" },
  { value: "PJ", label: "Pessoa Jurídica (CNPJ)" },
] as const

export const PAPEIS_CONTATO = [
  { value: "cliente",    label: "Cliente" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "ambos",      label: "Cliente e Fornecedor" },
] as const

export const TIPOS_CONTA = [
  { value: "caixa",    label: "Caixa" },
  { value: "banco",    label: "Banco" },
  { value: "carteira", label: "Carteira / Digital" },
] as const

export const NATUREZAS = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
] as const

export const TIPOS_LANCAMENTO = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
] as const

export const STATUS_LANCAMENTO = [
  { value: "pendente",  label: "Pendente" },
  { value: "pago",      label: "Pago / Recebido" },
  { value: "cancelado", label: "Cancelado" },
] as const

export const FREQUENCIAS = [
  { value: "mensal",    label: "Mensal" },
  { value: "semanal",   label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "anual",     label: "Anual" },
] as const

// ── Documento (CPF / CNPJ) ───────────────────────────────────────────────────

/** Remove tudo que não for dígito. */
export function limparDocumento(valor?: string | null): string {
  return (valor ?? "").replace(/\D/g, "")
}

/**
 * Valida o comprimento do documento conforme o tipo de pessoa.
 * PF → 11 dígitos (CPF); PJ → 14 dígitos (CNPJ). Vazio é permitido (opcional).
 */
export function documentoValido(tipoPessoa: string, documento?: string | null): boolean {
  const d = limparDocumento(documento)
  if (d.length === 0) return true
  return tipoPessoa === "PJ" ? d.length === 14 : d.length === 11
}

/** Aplica máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). */
export function formatarDocumento(tipoPessoa: string, documento?: string | null): string {
  const d = limparDocumento(documento)
  if (!d) return ""
  if (tipoPessoa === "PJ" || d.length > 11) {
    return d
      .padEnd(14, " ").slice(0, 14).trim()
      .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, "$1.$2.$3/$4-$5")
      .replace(/[^\d./-]/g, "")
  }
  return d
    .slice(0, 11)
    .replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4")
    .replace(/[^\d.-]/g, "")
}

// ── Recorrência / parcelamento ───────────────────────────────────────────────

/**
 * Calcula a data da i-ésima ocorrência a partir de uma data base, conforme a
 * frequência. Índice 0 = data base.
 */
export function proximaData(base: Date, frequencia: string, indice: number): Date {
  const d = new Date(base.getTime())
  switch (frequencia) {
    case "semanal":   d.setDate(d.getDate() + 7 * indice); break
    case "quinzenal": d.setDate(d.getDate() + 15 * indice); break
    case "anual":     d.setFullYear(d.getFullYear() + indice); break
    case "mensal":
    default:          d.setMonth(d.getMonth() + indice); break
  }
  return d
}

// ── Serialização (Decimal/Date → JSON seguro para Client Components) ──────────

type LancamentoLike = {
  valor: { toString(): string }
  dataCompetencia: Date | string
  dataVencimento: Date | string | null
  dataPagamento: Date | string | null
  criadoEm: Date | string
  [k: string]: unknown
}

/** Converte Decimal→string e Date→ISO para enviar a Client Components. */
export function serializarLancamento<T extends LancamentoLike>(l: T) {
  const iso = (d: Date | string | null) =>
    d == null ? null : d instanceof Date ? d.toISOString() : d
  return {
    ...l,
    valor: l.valor.toString(),
    dataCompetencia: iso(l.dataCompetencia)!,
    dataVencimento: iso(l.dataVencimento),
    dataPagamento: iso(l.dataPagamento),
    criadoEm: iso(l.criadoEm)!,
  }
}
