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

/**
 * Classe de essencialidade do gasto (uso pessoal / PF). Permite ao usuário
 * classificar cada tipo de despesa e alimenta o Resumo Inteligente do mês.
 */
export const CLASSES_CATEGORIA = [
  { value: "essencial",    label: "Essencial",    emoji: "🏠", hint: "Contas que você precisa pagar (moradia, comida, saúde, transporte)", cor: "#0ea5e9" },
  { value: "lazer",        label: "Lazer",        emoji: "🎉", hint: "Diversão e supérfluos (restaurantes, streaming, passeios)",         cor: "#f59e0b" },
  { value: "investimento", label: "Investimento", emoji: "📈", hint: "Poupança e aplicações que constroem seu patrimônio",                cor: "#10b981" },
  { value: "neutro",       label: "Neutro",       emoji: "⚪", hint: "Sem classificação definida",                                        cor: "#94a3b8" },
] as const

export type ClasseCategoria = (typeof CLASSES_CATEGORIA)[number]["value"]

/** Metadados (label/cor/emoji) de uma classe pelo seu value; cai em "neutro". */
export function metaClasse(valor?: string | null) {
  return CLASSES_CATEGORIA.find((c) => c.value === valor) ?? CLASSES_CATEGORIA[3]
}

// Mapa de classe padrão por nome de categoria semeada (ver CATEGORIAS_PADRAO).
const CLASSE_POR_NOME: Record<string, ClasseCategoria> = {
  Moradia: "essencial", "Alimentação": "essencial", Transporte: "essencial",
  "Saúde": "essencial", "Educação": "essencial", Lazer: "lazer", Outros: "neutro",
  Aluguel: "essencial", "Folha de Pagamento": "essencial", "Impostos e Taxas": "essencial",
  Fornecedores: "essencial", Marketing: "lazer", "Despesas Administrativas": "neutro",
}

/** Classe padrão para uma categoria recém-criada: receitas são neutras; despesas
 * conhecidas usam o mapa acima, demais caem em "essencial". */
export function classePadraoCategoria(nome: string, natureza: string): ClasseCategoria {
  if (natureza === "receita") return "neutro"
  return CLASSE_POR_NOME[nome] ?? "essencial"
}

/** Sanitiza o valor de classe vindo do cliente: receita sempre neutro; despesa
 * aceita apenas os valores válidos, caindo em "essencial". */
export function normalizarClasse(classe: unknown, natureza: string): ClasseCategoria {
  if (natureza === "receita") return "neutro"
  const v = String(classe ?? "")
  return v === "essencial" || v === "lazer" || v === "investimento" || v === "neutro" ? v : "essencial"
}

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

// ── Resumo Inteligente (finanças pessoais) ───────────────────────────────────

export interface LancParaResumo {
  tipo: string                       // receita | despesa
  valor: number
  classe?: string | null             // classe da categoria (essencial/lazer/...)
  categoriaNome?: string | null
}

export interface ResumoPessoal {
  receitas: number
  despesas: number
  sobra: number
  taxaPoupanca: number               // 0..1 (sobra / receitas)
  porClasse: Record<ClasseCategoria, number>
  topCategorias: { nome: string; valor: number }[]
}

/**
 * Agrega uma lista de lançamentos do mês em indicadores de finanças pessoais:
 * renda, gastos, sobra, taxa de poupança, divisão essencial/lazer/investimento
 * e as categorias que mais consumiram o orçamento. Função pura (testável).
 */
export function resumoPessoal(lancs: LancParaResumo[]): ResumoPessoal {
  const receitas = lancs.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0)
  const despesasArr = lancs.filter((l) => l.tipo === "despesa")
  const despesas = despesasArr.reduce((s, l) => s + l.valor, 0)

  const porClasse: Record<ClasseCategoria, number> = { essencial: 0, lazer: 0, investimento: 0, neutro: 0 }
  const porCategoria = new Map<string, number>()
  for (const l of despesasArr) {
    const c: ClasseCategoria =
      l.classe === "essencial" || l.classe === "lazer" || l.classe === "investimento" ? l.classe : "neutro"
    porClasse[c] += l.valor
    const nome = l.categoriaNome?.trim() || "Sem categoria"
    porCategoria.set(nome, (porCategoria.get(nome) ?? 0) + l.valor)
  }

  const topCategorias = [...porCategoria.entries()]
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6)

  const sobra = receitas - despesas
  const taxaPoupanca = receitas > 0 ? sobra / receitas : 0
  return { receitas, despesas, sobra, taxaPoupanca, porClasse, topCategorias }
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
