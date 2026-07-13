/**
 * tipos/sistema.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Constantes e configurações do sistema:
 *   - TIPOS_SISTEMA: tipos de empresa suportados, com módulos padrão
 *   - MODULOS_DISPONIVEIS: lista completa de módulos do sistema
 *
 * Como usar:
 *   import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/types/system"
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Tipos de sistema disponíveis para uma empresa.
 * Cada tipo define quais módulos são ativados automaticamente ao criar a empresa.
 */
export const TIPOS_SISTEMA = [
  {
    key:      "escola",
    label:    "Sistema Escolar",
    descricao: "Gestão de cursinhos, escolas e instituições de ensino",
    modulos:  ["alunos", "matriculas", "cursos", "aulas", "certificados", "salas", "baixas", "financeiro"],
  },
  {
    key:      "treinamento",
    label:    "Centro de Treinamento",
    descricao: "Academias, centros esportivos e treinamento físico",
    modulos:  ["alunos", "matriculas", "cursos", "aulas", "salas", "baixas", "financeiro"],
  },
  {
    key:      "consultoria",
    label:    "Consultoria / Cursos Online",
    descricao: "Consultorias, coaching e cursos online",
    modulos:  ["alunos", "matriculas", "cursos", "certificados", "baixas", "salas", "financeiro"],
  },
  {
    key:      "clinica",
    label:    "Clínica / Saúde",
    descricao: "Clínicas, consultórios e serviços de saúde",
    modulos:  ["alunos", "matriculas", "baixas", "salas", "certificados", "financeiro"],
  },
  {
    key:      "financeiro",
    label:    "Gestão Financeira",
    descricao: "Controle financeiro para pessoas físicas e jurídicas (CPF/CNPJ)",
    modulos:  ["financeiro"],
  },
  {
    key:      "barbeiro",
    label:    "Barbearia / Salão",
    descricao: "Agenda, clientes, serviços e equipe para barbearias e salões masculinos",
    modulos:  ["barbeiro", "barbeiro_agenda", "barbeiro_clientes", "barbeiro_servicos", "barbeiro_equipe", "financeiro"],
  },
  {
    key:      "personalizado",
    label:    "Personalizado",
    descricao: "Configure os módulos manualmente",
    modulos:  [],
  },
] as const

/**
 * Todos os módulos disponíveis no sistema.
 * Usado para renderizar o gerenciador de módulos por empresa.
 */
export const MODULOS_DISPONIVEIS = [
  { key: "alunos",       label: "Alunos",         grupo: "Acadêmico"  },
  { key: "matriculas",   label: "Matrículas",     grupo: "Acadêmico"  },
  { key: "cursos",       label: "Cursos",         grupo: "Acadêmico"  },
  { key: "aulas",        label: "Aulas",          grupo: "Conteúdo"   },
  { key: "salas",        label: "Salas de Aula",  grupo: "Conteúdo"   },
  { key: "financeiro",   label: "Financeiro",     grupo: "Financeiro" },
  { key: "baixas",       label: "Mensalidades",   grupo: "Financeiro" },
  { key: "certificados", label: "Certificados",   grupo: "Financeiro" },
  { key: "barbeiro",          label: "Painel da Barbearia", grupo: "Barbearia" },
  { key: "barbeiro_agenda",   label: "Agenda",              grupo: "Barbearia" },
  { key: "barbeiro_clientes", label: "Clientes",            grupo: "Barbearia" },
  { key: "barbeiro_servicos", label: "Serviços",            grupo: "Barbearia" },
  { key: "barbeiro_equipe",   label: "Equipe",              grupo: "Barbearia" },
] as const

// Tipo utilitário para as chaves de módulo
export type ChaveModulo = typeof MODULOS_DISPONIVEIS[number]["key"]

/**
 * Modelos de gestão do sistema Financeiro.
 * Uma empresa do tipo "financeiro" escolhe entre gestão empresarial (CNPJ/PJ)
 * ou pessoal (CPF/PF) — cada um com estrutura própria no módulo financeiro.
 */
export const GESTOES_FINANCEIRAS = [
  {
    key:       "PJ",
    label:     "Empresarial (CNPJ)",
    curto:     "CNPJ",
    icone:     "Building2",
    descricao: "Clientes, fornecedores, centros de custo e DRE — para empresas.",
  },
  {
    key:       "PF",
    label:     "Pessoal (CPF)",
    curto:     "CPF",
    icone:     "User",
    descricao: "Receitas, despesas e categorias do dia a dia — para pessoa física.",
  },
] as const

export type GestaoFinanceira = typeof GESTOES_FINANCEIRAS[number]["key"]

/** Nomes dos meses (índice 0 = Janeiro). */
export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const

/**
 * Categorias padrão semeadas ao criar uma empresa do tipo financeiro,
 * conforme o modelo de gestão (pessoal PF ou empresarial PJ).
 */
export const CATEGORIAS_PADRAO: Record<GestaoFinanceira, { receita: string[]; despesa: string[] }> = {
  PF: {
    receita: ["Salário", "Renda Extra", "Investimentos"],
    despesa: ["Moradia", "Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Outros"],
  },
  PJ: {
    receita: ["Vendas", "Prestação de Serviços", "Outras Receitas"],
    despesa: ["Folha de Pagamento", "Impostos e Taxas", "Fornecedores", "Aluguel", "Marketing", "Despesas Administrativas"],
  },
}

/**
 * Serviços padrão semeados ao criar uma empresa do tipo "barbeiro".
 * { nome, duracaoMin, preco }
 */
export const SERVICOS_PADRAO: { nome: string; duracaoMin: number; preco: number }[] = [
  { nome: "Corte",          duracaoMin: 30, preco: 40 },
  { nome: "Barba",          duracaoMin: 20, preco: 30 },
  { nome: "Corte + Barba",  duracaoMin: 45, preco: 60 },
  { nome: "Sobrancelha",    duracaoMin: 10, preco: 15 },
]
