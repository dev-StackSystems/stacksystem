/**
 * tipos/sistema.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Constantes e configurações do sistema:
 *   - TIPOS_SISTEMA: tipos de empresa suportados, com módulos padrão
 *   - MODULOS_DISPONIVEIS: lista completa de módulos do sistema
 *
 * Como usar:
 *   import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/tipos/sistema"
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
    emoji:    "🏫",
    descricao: "Gestão de cursinhos, escolas e instituições de ensino",
    modulos:  ["alunos", "matriculas", "cursos", "aulas", "certificados", "salas", "baixas"],
  },
  {
    key:      "treinamento",
    label:    "Centro de Treinamento",
    emoji:    "🏋️",
    descricao: "Academias, centros esportivos e treinamento físico",
    modulos:  ["alunos", "matriculas", "cursos", "aulas", "salas", "baixas"],
  },
  {
    key:      "consultoria",
    label:    "Consultoria / Cursos Online",
    emoji:    "💼",
    descricao: "Consultorias, coaching e cursos online",
    modulos:  ["alunos", "matriculas", "cursos", "certificados", "baixas", "salas"],
  },
  {
    key:      "clinica",
    label:    "Clínica / Saúde",
    emoji:    "🏥",
    descricao: "Clínicas, consultórios e serviços de saúde",
    modulos:  ["alunos", "matriculas", "baixas", "salas", "certificados"],
  },
  {
    key:      "personalizado",
    label:    "Personalizado",
    emoji:    "⚙️",
    descricao: "Configure os módulos manualmente",
    modulos:  [],
  },
] as const

/**
 * Todos os módulos disponíveis no sistema.
 * Usado para renderizar o gerenciador de módulos por empresa.
 */
export const MODULOS_DISPONIVEIS = [
  { key: "alunos",       label: "Alunos",        grupo: "Acadêmico"  },
  { key: "matriculas",   label: "Matrículas",     grupo: "Acadêmico"  },
  { key: "cursos",       label: "Cursos",         grupo: "Acadêmico"  },
  { key: "aulas",        label: "Aulas",          grupo: "Conteúdo"   },
  { key: "salas",        label: "Salas de Aula",  grupo: "Conteúdo"   },
  { key: "baixas",       label: "Financeiro",     grupo: "Financeiro" },
  { key: "certificados", label: "Certificados",   grupo: "Financeiro" },
] as const

// Tipo utilitário para as chaves de módulo
export type ChaveModulo = typeof MODULOS_DISPONIVEIS[number]["key"]
