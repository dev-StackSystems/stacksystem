/**
 * lib/landings.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Configuração de conteúdo das landing pages por vertical.
 *
 * A landing corporativa da StackSystems fica em `/` (config `stacksystems`).
 * Cada sistema/produto tem sua própria landing acessível por slug:
 *   /barbeiro   → config `barbeiro`
 *   /escolar    → config `escolar`
 *   /financeiro → config `financeiro`
 *
 * Todas mantêm a identidade laranja da StackSystems — o que muda é o conteúdo
 * (marca, chamada, métricas do mockup e cards de serviços/recursos).
 *
 * Ícones são referenciados por NOME (string) — ver components/landing/icones.ts —
 * para que o config seja serializável ao cruzar a fronteira Server→Client.
 * As seções (navbar, hero, services) leem um `LandingConfig` via prop; sem prop,
 * usam o default `stacksystems` (retrocompatível com `/`).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface PillLanding {
  icon:  string // nome do ícone (ver components/landing/icones.ts)
  label: string
}

export interface MetricLanding {
  label: string
  val:   string
  up:    boolean
}

export interface ServicoLanding {
  icon:      string // nome do ícone
  iconColor: string // ex: "text-blue-600"
  iconBg:    string // ex: "bg-blue-50"
  hover:     string // ex: "hover:border-blue-300 hover:shadow-blue-100"
  title:     string
  desc:      string
}

export interface LandingConfig {
  slug:      string
  marcaNome:   string        // ex: "Stack" (parte 1)
  marcaDestaque: string      // ex: "Systems" (parte 2 colorida)
  marcaSufixo:   string      // subtítulo pequeno no logo

  badge:     string
  headline:  { pre: string; destaque: string; pos: string }
  sub:       string
  pills:     PillLanding[]
  ctaPrimario: string

  dashboardTitulo:    string // título do mockup no hero
  dashboardSubtitulo: string // rótulo pequeno acima do título
  metrics:  MetricLanding[]

  servicosBadge:    string
  servicosTitulo:   string // parte normal
  servicosDestaque: string // parte com gradiente
  servicosSub:      string
  servicos: ServicoLanding[]
}

// ── StackSystems (landing corporativa — default de `/`) ──────────────────────

const stacksystems: LandingConfig = {
  slug: "stacksystems",
  marcaNome: "Stack",
  marcaDestaque: "Systems",
  marcaSufixo: "Sistemas & Soluções",

  badge: "Sistemas para Empresas",
  headline: { pre: "Sistemas que", destaque: "transformam", pos: "sua empresa." },
  sub: "Desenvolvemos sistemas e soluções sob medida para otimizar a gestão, automatizar processos e impulsionar os resultados do seu negócio. Do planejamento à entrega.",
  pills: [
    { icon: "Zap",    label: "Entrega Ágil" },
    { icon: "Target", label: "100% Personalizado" },
    { icon: "Users",  label: "Atendimento Direto" },
  ],
  ctaPrimario: "Solicitar Proposta",

  dashboardTitulo: "Março 2025",
  dashboardSubtitulo: "Dashboard — Visão Geral",
  metrics: [
    { label: "Receita Mensal", val: "R$ 48.200", up: true  },
    { label: "Despesas",       val: "R$ 18.600", up: false },
    { label: "Lucro Líquido",  val: "R$ 29.600", up: true  },
    { label: "Crescimento",    val: "+34%",       up: true  },
  ],

  servicosBadge: "Nossas Soluções",
  servicosTitulo: "Tecnologia feita para",
  servicosDestaque: "o seu negócio",
  servicosSub: "Desenvolvemos sistemas personalizados para empresas de todos os portes e segmentos — do varejo à indústria, do MEI à multinacional.",
  servicos: [
    { icon: "LayoutGrid", iconColor: "text-blue-600",    iconBg: "bg-blue-50",    hover: "hover:border-blue-300 hover:shadow-blue-100",       title: "Sistemas de Gestão (ERP)",   desc: "Sistemas integrados que centralizam estoque, financeiro, vendas e RH em um único lugar, dando visibilidade total ao seu negócio." },
    { icon: "CreditCard", iconColor: "text-emerald-600", iconBg: "bg-emerald-50", hover: "hover:border-emerald-300 hover:shadow-emerald-100", title: "Controle Financeiro",        desc: "Módulos de fluxo de caixa, contas a pagar/receber, DRE automatizado e relatórios gerenciais em tempo real." },
    { icon: "RefreshCw",  iconColor: "text-orange-600",  iconBg: "bg-orange-50",  hover: "hover:border-orange-300 hover:shadow-orange-100",   title: "Automação de Processos",     desc: "Eliminamos tarefas manuais e retrabalho integrando seus sistemas com automações que economizam horas por semana." },
    { icon: "BarChart2",  iconColor: "text-purple-600",  iconBg: "bg-purple-50",  hover: "hover:border-purple-300 hover:shadow-purple-100",   title: "Dashboards & Analytics",     desc: "Painéis inteligentes com KPIs, gráficos interativos e alertas automáticos para decisões baseadas em dados." },
    { icon: "Handshake",  iconColor: "text-rose-600",    iconBg: "bg-rose-50",    hover: "hover:border-rose-300 hover:shadow-rose-100",       title: "CRM & Relacionamento",       desc: "Gerencie toda a jornada do cliente, do primeiro contato ao pós-venda, com rastreamento completo de oportunidades." },
    { icon: "Link2",      iconColor: "text-teal-600",    iconBg: "bg-teal-50",    hover: "hover:border-teal-300 hover:shadow-teal-100",       title: "Integrações & APIs",         desc: "Conectamos sistemas legados, plataformas de e-commerce, ERPs e ferramentas externas via APIs robustas." },
  ],
}

// ── Barbearia ────────────────────────────────────────────────────────────────

const barbeiro: LandingConfig = {
  slug: "barbeiro",
  marcaNome: "Barber",
  marcaDestaque: "Pro",
  marcaSufixo: "Gestão para Barbearias",

  badge: "Sistema para Barbearias",
  headline: { pre: "A gestão completa", destaque: "da sua barbearia", pos: "num só lugar." },
  sub: "Agenda online, comandas, controle de caixa e fidelização de clientes. Menos fila na recepção, mais tempo cuidando do corte — e do seu faturamento.",
  pills: [
    { icon: "CalendarClock", label: "Agenda Online" },
    { icon: "Scissors",      label: "Comandas Rápidas" },
    { icon: "Star",          label: "Fidelidade" },
  ],
  ctaPrimario: "Quero na Minha Barbearia",

  dashboardTitulo: "Hoje — 18 agendamentos",
  dashboardSubtitulo: "Painel da Barbearia",
  metrics: [
    { label: "Faturamento Dia", val: "R$ 1.240", up: true  },
    { label: "Atendimentos",    val: "18",        up: true  },
    { label: "Ticket Médio",    val: "R$ 69",     up: true  },
    { label: "Faltas",          val: "2",         up: false },
  ],

  servicosBadge: "Recursos",
  servicosTitulo: "Tudo que sua barbearia",
  servicosDestaque: "precisa no dia a dia",
  servicosSub: "Do agendamento ao fechamento do caixa — uma ferramenta pensada para a rotina de barbearias e barbeiros autônomos.",
  servicos: [
    { icon: "CalendarClock", iconColor: "text-orange-600",  iconBg: "bg-orange-50",  hover: "hover:border-orange-300 hover:shadow-orange-100",   title: "Agenda & Agendamento Online", desc: "Clientes marcam pelo link, você organiza a cadeira de cada barbeiro e reduz faltas com lembretes automáticos." },
    { icon: "Scissors",      iconColor: "text-slate-700",   iconBg: "bg-slate-100",  hover: "hover:border-slate-300 hover:shadow-slate-100",     title: "Comandas & Serviços",         desc: "Registre serviços e produtos na comanda, calcule a comissão do barbeiro e feche em segundos." },
    { icon: "Wallet",        iconColor: "text-emerald-600", iconBg: "bg-emerald-50", hover: "hover:border-emerald-300 hover:shadow-emerald-100", title: "Caixa & Financeiro",          desc: "Controle entradas e saídas, formas de pagamento e comissões com fechamento de caixa diário." },
    { icon: "Star",          iconColor: "text-amber-600",   iconBg: "bg-amber-50",   hover: "hover:border-amber-300 hover:shadow-amber-100",     title: "Fidelidade & Clientes",       desc: "Histórico de cortes, preferências e programa de fidelidade para o cliente voltar sempre." },
    { icon: "BarChart2",     iconColor: "text-purple-600",  iconBg: "bg-purple-50",  hover: "hover:border-purple-300 hover:shadow-purple-100",   title: "Relatórios",                  desc: "Veja faturamento, serviços mais vendidos e desempenho de cada barbeiro em painéis claros." },
    { icon: "Users",         iconColor: "text-blue-600",    iconBg: "bg-blue-50",    hover: "hover:border-blue-300 hover:shadow-blue-100",       title: "Multi-barbeiro",              desc: "Cadastre a equipe, defina horários e comissões e acompanhe a agenda de todos em um só painel." },
  ],
}

// ── Escolar / Cursinho ───────────────────────────────────────────────────────

const escolar: LandingConfig = {
  slug: "escolar",
  marcaNome: "Edu",
  marcaDestaque: "Stack",
  marcaSufixo: "Gestão Escolar",

  badge: "Sistema para Cursinhos e Escolas",
  headline: { pre: "O sistema completo", destaque: "do seu cursinho", pos: "e da sua escola." },
  sub: "Alunos, matrículas, cursos, aulas ao vivo e financeiro em uma plataforma só. Do primeiro contato à emissão do certificado, sua instituição no controle.",
  pills: [
    { icon: "GraduationCap", label: "Matrículas" },
    { icon: "Video",         label: "Aulas ao Vivo" },
    { icon: "Award",         label: "Certificados" },
  ],
  ctaPrimario: "Conhecer o Sistema",

  dashboardTitulo: "Turma 2025 — Visão Geral",
  dashboardSubtitulo: "Painel Acadêmico",
  metrics: [
    { label: "Alunos Ativos",   val: "486",       up: true  },
    { label: "Matrículas/Mês",  val: "72",        up: true  },
    { label: "Mensalidades",    val: "R$ 68.400", up: true  },
    { label: "Inadimplência",   val: "4,2%",      up: false },
  ],

  servicosBadge: "Recursos",
  servicosTitulo: "Tudo para gerir sua",
  servicosDestaque: "instituição de ensino",
  servicosSub: "Uma plataforma pensada para cursinhos pré-vestibular, escolas e centros de treinamento — do acadêmico ao financeiro.",
  servicos: [
    { icon: "GraduationCap", iconColor: "text-blue-600",    iconBg: "bg-blue-50",    hover: "hover:border-blue-300 hover:shadow-blue-100",       title: "Alunos & Matrículas",   desc: "Cadastro completo de alunos, matrículas por curso, status e histórico acadêmico centralizados." },
    { icon: "BookOpen",      iconColor: "text-indigo-600",  iconBg: "bg-indigo-50",  hover: "hover:border-indigo-300 hover:shadow-indigo-100",   title: "Cursos & Aulas",        desc: "Monte cursos em módulos e aulas (vídeo, PDF, texto) e acompanhe o andamento de cada aluno." },
    { icon: "Video",         iconColor: "text-rose-600",    iconBg: "bg-rose-50",    hover: "hover:border-rose-300 hover:shadow-rose-100",       title: "Salas ao Vivo (WebRTC)", desc: "Aulas virtuais com vídeo em tempo real e chat, direto no navegador, sem instalar nada." },
    { icon: "CreditCard",    iconColor: "text-emerald-600", iconBg: "bg-emerald-50", hover: "hover:border-emerald-300 hover:shadow-emerald-100", title: "Financeiro & Mensalidades", desc: "Controle de mensalidades, baixas e inadimplência com relatórios e visão de fluxo de caixa." },
    { icon: "Award",         iconColor: "text-amber-600",   iconBg: "bg-amber-50",   hover: "hover:border-amber-300 hover:shadow-amber-100",     title: "Certificados",          desc: "Emita certificados automaticamente ao concluir o curso, com código de validação único." },
    { icon: "BarChart2",     iconColor: "text-purple-600",  iconBg: "bg-purple-50",  hover: "hover:border-purple-300 hover:shadow-purple-100",   title: "Painéis & Permissões",  desc: "Controle de acesso por grupo e setor, com painéis e KPIs para coordenação e secretaria." },
  ],
}

// ── Financeiro ───────────────────────────────────────────────────────────────

const financeiro: LandingConfig = {
  slug: "financeiro",
  marcaNome: "Fin",
  marcaDestaque: "Stack",
  marcaSufixo: "Gestão Financeira",

  badge: "Sistema de Gestão Financeira",
  headline: { pre: "Controle financeiro", destaque: "profissional", pos: "para PF e PJ." },
  sub: "Lançamentos de receita e despesa vinculados a CPF ou CNPJ, contas, plano de contas, fluxo de caixa, conciliação bancária e relatórios. Sua gestão sob controle.",
  pills: [
    { icon: "Wallet",   label: "Fluxo de Caixa" },
    { icon: "Receipt",  label: "Contas a Pagar/Receber" },
    { icon: "Landmark", label: "Conciliação" },
  ],
  ctaPrimario: "Começar Agora",

  dashboardTitulo: "Fluxo de Caixa — Março",
  dashboardSubtitulo: "Painel Financeiro",
  metrics: [
    { label: "Saldo Atual",  val: "R$ 92.180", up: true  },
    { label: "Receitas Mês", val: "R$ 54.300", up: true  },
    { label: "Despesas Mês", val: "R$ 31.720", up: false },
    { label: "A Receber",    val: "R$ 18.600", up: true  },
  ],

  servicosBadge: "Recursos",
  servicosTitulo: "Gestão financeira",
  servicosDestaque: "completa e profissional",
  servicosSub: "Do lançamento à conciliação bancária — organize as finanças de pessoas físicas e jurídicas com precisão e relatórios que fazem sentido.",
  servicos: [
    { icon: "Receipt",    iconColor: "text-emerald-600", iconBg: "bg-emerald-50", hover: "hover:border-emerald-300 hover:shadow-emerald-100", title: "Lançamentos PF & PJ",     desc: "Receitas e despesas vinculadas a um contato por CPF ou CNPJ, com status, vencimento e pagamento." },
    { icon: "Wallet",     iconColor: "text-blue-600",    iconBg: "bg-blue-50",    hover: "hover:border-blue-300 hover:shadow-blue-100",       title: "Contas & Fluxo de Caixa", desc: "Múltiplas contas (caixa, banco, carteira), saldo consolidado e visão diária do fluxo de caixa." },
    { icon: "PieChart",   iconColor: "text-purple-600",  iconBg: "bg-purple-50",  hover: "hover:border-purple-300 hover:shadow-purple-100",   title: "Plano de Contas",         desc: "Categorias de receita e despesa e centros de custo para classificar cada movimento com precisão." },
    { icon: "RefreshCw",  iconColor: "text-orange-600",  iconBg: "bg-orange-50",  hover: "hover:border-orange-300 hover:shadow-orange-100",   title: "Recorrência & Parcelas",  desc: "Lançamentos recorrentes e parcelamento automático — a plataforma gera as parcelas por você." },
    { icon: "Landmark",   iconColor: "text-teal-600",    iconBg: "bg-teal-50",    hover: "hover:border-teal-300 hover:shadow-teal-100",       title: "Conciliação Bancária",    desc: "Importe o extrato em OFX/CSV e concilie com seus lançamentos por valor, data e identificador." },
    { icon: "FileText",   iconColor: "text-rose-600",    iconBg: "bg-rose-50",    hover: "hover:border-rose-300 hover:shadow-rose-100",       title: "Relatórios & Exportação", desc: "Fluxo de caixa por período, DRE simplificado e exportação em CSV para sua contabilidade." },
  ],
}

// ── Registro ─────────────────────────────────────────────────────────────────

export const LANDINGS: Record<string, LandingConfig> = {
  stacksystems,
  barbeiro,
  escolar,
  financeiro,
}

/** Slugs das verticais (exclui a landing corporativa `/`). */
export const SLUGS_VERTICAIS = ["barbeiro", "escolar", "financeiro"] as const

/** Retorna a config de uma vertical pelo slug, ou undefined se não existir. */
export function getLandingConfig(slug: string): LandingConfig | undefined {
  return LANDINGS[slug]
}
