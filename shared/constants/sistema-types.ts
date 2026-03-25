export const TIPOS_SISTEMA = [
  {
    key: "escola",
    label: "Sistema Escolar",
    emoji: "🏫",
    descricao: "Gestão de cursinhos, escolas e instituições de ensino",
    modulos: ["alunos", "matriculas", "cursos", "aulas", "certificados", "salas", "baixas"],
  },
  {
    key: "treinamento",
    label: "Centro de Treinamento",
    emoji: "🏋️",
    descricao: "Academias, centros esportivos e treinamento físico",
    modulos: ["alunos", "matriculas", "cursos", "aulas", "salas", "baixas"],
  },
  {
    key: "consultoria",
    label: "Consultoria / Cursos Online",
    emoji: "💼",
    descricao: "Consultorias, coaching e cursos online",
    modulos: ["alunos", "matriculas", "cursos", "certificados", "baixas", "salas"],
  },
  {
    key: "clinica",
    label: "Clínica / Saúde",
    emoji: "🏥",
    descricao: "Clínicas, consultórios e serviços de saúde",
    modulos: ["alunos", "matriculas", "baixas", "salas", "certificados"],
  },
  {
    key: "personalizado",
    label: "Personalizado",
    emoji: "⚙️",
    descricao: "Configure os módulos manualmente",
    modulos: [],
  },
]

export const MODULOS_DISPONIVEIS = [
  { key: "alunos",       label: "Alunos",        group: "Acadêmico"  },
  { key: "matriculas",   label: "Matrículas",     group: "Acadêmico"  },
  { key: "cursos",       label: "Cursos",         group: "Acadêmico"  },
  { key: "aulas",        label: "Aulas",          group: "Conteúdo"   },
  { key: "salas",        label: "Salas de Aula",  group: "Conteúdo"   },
  { key: "baixas",       label: "Financeiro",     group: "Financeiro" },
  { key: "certificados", label: "Certificados",   group: "Financeiro" },
]
