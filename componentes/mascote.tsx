/**
 * componentes/mascote.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Stacky — Mascote inteligente do StackSystems
 *
 * Três modos de operação (prop `modo`):
 *
 *   "landing"  (padrão)
 *     Exibe o robô flutuante no canto inferior direito.
 *     Ao clicar: rola suavemente até a seção #contato da landing page.
 *
 *   "login"
 *     Exibe o robô flutuante no canto inferior direito.
 *     Ao clicar: abre um painel de suporte com FAQ sobre acesso, login e
 *     recuperação de senha. Inclui atalhos rápidos.
 *
 *   "painel"
 *     Exibe o robô flutuante no canto inferior direito.
 *     Ao clicar: abre um chat de suporte com FAQ completo sobre todas as
 *     funcionalidades do sistema (alunos, cursos, matrículas, salas, etc.).
 *
 * Uso básico:
 *   import Mascote from "@/componentes/mascote"
 *
 *   // Landing page (modo padrão)
 *   <Mascote />
 *
 *   // Tela de login
 *   <Mascote modo="login" />
 *
 *   // Painel/dashboard
 *   <Mascote modo="painel" />
 *
 * O componente é "use client" e pode ser adicionado diretamente em
 * Server Components (Next.js App Router suporta isso nativamente).
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Send } from "lucide-react"
import { useRouter } from "next/navigation"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Modo de operação do Stacky */
export type ModoStacky = "landing" | "login" | "painel"

type Humor = "normal" | "happy" | "thinking" | "wink"

interface Mensagem {
  de:     "usuario" | "stacky"
  texto:  string
  atalhos?: Atalho[]
}

interface Atalho {
  rotulo: string
  acao:   string   // texto a ser enviado OU rota ("/login/esqueci-senha")
}

interface EntradaFaq {
  palavras: string[]
  resposta: string
  atalhos?: Atalho[]
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Engine — normalização e busca por palavras-chave
// ─────────────────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
}

function buscarResposta(pergunta: string, base: EntradaFaq[]): EntradaFaq {
  const q = norm(pergunta)
  const pontuada = base.map(e => ({
    e,
    pts: e.palavras.filter(p => q.includes(norm(p))).length,
  }))
  const melhor = pontuada.sort((a, b) => b.pts - a.pts)[0]
  if (!melhor || melhor.pts === 0) return RESPOSTA_PADRAO
  return melhor.e
}

const RESPOSTA_PADRAO: EntradaFaq = {
  palavras: [],
  resposta:
    "Não encontrei uma resposta exata. Tente palavras como: " +
    "\"login\", \"senha\", \"alunos\", \"matrícula\", \"curso\", " +
    "\"sala\", \"usuário\", \"certificado\" ou \"financeiro\".",
}

// ─────────────────────────────────────────────────────────────────────────────
// Base de conhecimento — Login
// ─────────────────────────────────────────────────────────────────────────────

const FAQ_LOGIN: EntradaFaq[] = [
  {
    palavras: ["login", "entrar", "acessar", "como entro", "como acesso", "como faco login"],
    resposta:
      "Para fazer login:\n\n" +
      "1. Digite seu **e-mail** cadastrado\n" +
      "2. Digite sua **senha**\n" +
      "3. Clique em **Entrar na Plataforma**\n\n" +
      "Se não sabe seu e-mail, consulte o administrador da sua empresa.",
    atalhos: [{ rotulo: "Esqueci minha senha", acao: "/login/esqueci-senha" }],
  },
  {
    palavras: [
      "esqueci", "recuperar senha", "redefinir", "trocar senha",
      "resetar", "nova senha", "senha errada", "senha incorreta",
    ],
    resposta:
      "Para recuperar sua senha:\n\n" +
      "1. Clique em **\"Esqueci minha senha\"** na tela de login\n" +
      "2. Informe seu **e-mail cadastrado**\n" +
      "3. Você receberá um e-mail com link para redefinir\n" +
      "4. Acesse o link e defina uma nova senha\n\n" +
      "O link expira em **1 hora**.",
    atalhos: [{ rotulo: "Recuperar senha agora", acao: "/login/esqueci-senha" }],
  },
  {
    palavras: [
      "nao tenho acesso", "primeiro acesso", "nao tenho conta",
      "como obter acesso", "cadastro", "novo usuario", "criar conta",
    ],
    resposta:
      "O acesso é feito por **convite do administrador** da sua empresa.\n\n" +
      "Se não tem conta:\n" +
      "• Contate o **administrador** da sua empresa\n" +
      "• Ele cadastra seu usuário e passa suas credenciais\n\n" +
      "Não é possível criar conta diretamente.",
  },
  {
    palavras: ["qual email", "nao sei email", "credenciais", "qual meu email", "email cadastrado"],
    resposta:
      "Seu **e-mail de acesso** foi cadastrado pelo administrador.\n\n" +
      "Dicas:\n" +
      "• Geralmente é seu e-mail corporativo/institucional\n" +
      "• O e-mail é único por plataforma\n\n" +
      "Não sabe qual é? Consulte o administrador da sua empresa.",
  },
  {
    palavras: [
      "erro", "nao funciona", "nao consigo entrar", "problema",
      "falha", "bloqueado", "inativo", "conta bloqueada",
    ],
    resposta:
      "Erros comuns:\n\n" +
      "**Usuário não encontrado** → verifique se o e-mail está correto\n\n" +
      "**Senha incorreta** → use a recuperação de senha\n\n" +
      "**Usuário inativo** → conta desativada — contate o administrador\n\n" +
      "**Campos faltando** → preencha e-mail e senha antes de enviar",
    atalhos: [{ rotulo: "Recuperar senha", acao: "/login/esqueci-senha" }],
  },
  {
    palavras: ["o que e", "stacksystems", "sistema", "plataforma", "para que serve", "o que faz"],
    resposta:
      "O **StackSystems** é uma plataforma de gestão desenvolvida pela **I3 Soluções**.\n\n" +
      "Principais módulos:\n" +
      "• 🎓 Gestão de alunos e matrículas\n" +
      "• 📚 Cursos, módulos e aulas\n" +
      "• 💰 Financeiro (cobranças e pagamentos)\n" +
      "• 🏆 Certificados\n" +
      "• 🎥 Salas de videoaula (WebRTC)\n\n" +
      "É multi-empresa: cada organização tem seus dados separados.",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Base de conhecimento — Painel
// ─────────────────────────────────────────────────────────────────────────────

const FAQ_PAINEL: EntradaFaq[] = [
  {
    palavras: ["painel", "dashboard", "inicio", "home", "resumo", "kpi", "grafico", "visao geral"],
    resposta:
      "O **Painel** (Dashboard) fica em `/painel`.\n\n" +
      "Exibe:\n" +
      "• Total de alunos, cursos, matrículas ativas e receita\n" +
      "• Acesso rápido aos módulos\n\n" +
      "Clique em **Painel** na barra lateral.",
  },
  {
    palavras: [
      "aluno", "alunos", "cadastrar aluno", "novo aluno",
      "adicionar aluno", "estudante", "editar aluno", "excluir aluno",
    ],
    resposta:
      "**Módulo Alunos** → `/painel/alunos`\n\n" +
      "• **Cadastrar:** botão **\"Novo Aluno\"** → nome, e-mail, CPF, telefone → Salvar\n" +
      "• **Editar:** ícone de lápis ao lado do aluno\n" +
      "• **Desativar:** ícone de lixeira (desativação lógica, dados preservados)\n\n" +
      "Alunos são únicos por e-mail dentro da empresa.",
  },
  {
    palavras: [
      "matricula", "matricular", "vincular aluno", "inscricao",
      "novo vinculo", "aluno curso", "status matricula",
    ],
    resposta:
      "**Módulo Matrículas** → `/painel/matriculas`\n\n" +
      "• **Criar:** botão **\"Nova Matrícula\"** → selecione aluno e curso → valor e data → Salvar\n" +
      "• **Status:** `ativa`, `concluída`, `cancelada`\n\n" +
      "Um aluno pode ter múltiplas matrículas em cursos diferentes.",
  },
  {
    palavras: [
      "curso", "cursos", "criar curso", "novo curso",
      "modulo curso", "aula", "conteudo", "estrutura curso", "capitulo",
    ],
    resposta:
      "**Módulo Cursos** → `/painel/cursos`\n\n" +
      "• **Criar:** botão **\"Novo Curso\"** → nome, descrição, carga horária\n" +
      "• **Estrutura:** Curso → Módulos → Aulas\n" +
      "• Tipos de aula: vídeo, online, texto ou PDF\n\n" +
      "Edite/exclua pelos botões na listagem.",
  },
  {
    palavras: [
      "financeiro", "baixa", "baixas", "pagamento", "mensalidade",
      "cobrar", "valor", "receita", "receber", "vencimento",
    ],
    resposta:
      "**Módulo Financeiro** → `/painel/baixas`\n\n" +
      "• Gerencia cobranças vinculadas a matrículas\n" +
      "• **Criar:** botão **\"Nova Baixa\"** → tipo, valor, vencimento\n" +
      "• **Status:** `pago`, `pendente`, `cancelado`\n" +
      "• Marque como pago informando a data de pagamento",
  },
  {
    palavras: [
      "certificado", "certificados", "diploma", "conclusao",
      "emitir certificado", "gerar certificado",
    ],
    resposta:
      "**Módulo Certificados** → `/painel/certificados`\n\n" +
      "1. A matrícula deve estar com status **\"concluída\"**\n" +
      "2. Botão **\"Emitir Certificado\"** → selecione aluno e curso\n" +
      "3. O certificado recebe um **código único** e data de emissão",
  },
  {
    palavras: [
      "sala", "salas", "videoaula", "video aula", "criar sala",
      "entrar sala", "codigo sala", "webrtc", "transmissao", "ao vivo", "participantes",
    ],
    resposta:
      "**Módulo Salas** → `/painel/salas`\n\n" +
      "• **Criar sala:** botão **\"Nova Sala\"** → nome e máx. de participantes\n" +
      "• **Código:** cada sala tem um código único — compartilhe para acesso\n" +
      "• **Entrar:** botão **\"Entrar na Sala\"** no card\n" +
      "• **Excluir:** apenas o criador ou admin pode excluir",
  },
  {
    palavras: [
      "usuario", "usuarios", "criar usuario", "novo usuario",
      "funcionario", "papel", "perfil", "admin", "tecnico", "professor", "docente",
    ],
    resposta:
      "**Módulo Usuários** → `/painel/usuarios`\n\n" +
      "• **Criar:** botão **\"Novo Usuário\"** → nome, e-mail, senha, papel\n\n" +
      "**Papéis:**\n" +
      "• **A (Admin):** acesso total à empresa\n" +
      "• **T (Técnico):** acesso conforme permissões\n" +
      "• **F (Docente):** acesso restrito\n\n" +
      "Desativar: ícone de lixeira (não apaga dados).",
  },
  {
    palavras: [
      "grupo", "grupos", "setor", "setores", "departamento",
      "equipe", "permissao grupo", "vincular usuario",
    ],
    resposta:
      "**Grupos** (`/painel/grupos`) e **Setores** (`/painel/setores`):\n\n" +
      "• **Setor:** departamento da empresa (ex: Pedagógico)\n" +
      "• **Grupo:** define quais módulos um conjunto de usuários acessa\n" +
      "• Grupo com **isAdmin=true** = acesso completo\n\n" +
      "Vincule usuários ao criar/editar o usuário.",
  },
  {
    palavras: [
      "permissao", "permissoes", "acesso modulo", "autorizar", "restringir",
      "bloquear", "liberar modulo", "pode ler", "pode criar",
    ],
    resposta:
      "**Permissões** por módulo:\n\n" +
      "• `podeLer` — visualizar\n" +
      "• `podeCriar` — criar novos registros\n" +
      "• `podeEditar` — editar existentes\n" +
      "• `podeDeletar` — excluir\n\n" +
      "Prioridade: **permissão individual > permissão do grupo**\n" +
      "SuperAdmin e papel **A** têm acesso total automático.",
  },
  {
    palavras: [
      "configuracao", "configurar", "tipo sistema", "modulos ativos",
      "personalizar", "logomarca", "cor", "identidade visual",
    ],
    resposta:
      "**Configurações** → `/painel/configuracoes`\n\n" +
      "• Tipo de sistema (cursinho, escola, treinamento...)\n" +
      "• Ativar/desativar módulos da empresa\n" +
      "• Logo, cor primária e nome do sistema\n\n" +
      "Acesso: apenas **Admin (A)** e **superAdmin**.",
  },
  {
    palavras: [
      "empresa", "empresas", "tenant", "plataforma", "todas empresas",
      "cadastrar empresa", "super admin",
    ],
    resposta:
      "**Módulo Empresas** → `/painel/empresas` (apenas **superAdmin**)\n\n" +
      "• Cadastrar novas empresas clientes\n" +
      "• Ativar módulos por empresa\n" +
      "• Configurar identidade visual de cada tenant\n" +
      "• Ver usuários de todas as empresas",
  },
  {
    palavras: ["seguranca", "auditoria", "log", "historico", "quem acessou", "rastreamento"],
    resposta:
      "**Módulo Segurança** → `/painel/seguranca`\n\n" +
      "Registra todas as ações:\n" +
      "• Login/logout com data, hora e IP\n" +
      "• Criação e edição de registros\n\n" +
      "Apenas **superAdmin** vê o log completo. Registros são imutáveis.",
  },
  {
    palavras: [
      "alterar senha", "mudar senha", "trocar senha painel",
      "nova senha painel", "senha perfil", "minha senha",
    ],
    resposta:
      "Para alterar sua senha no painel:\n" +
      "1. Acesse **Configurações** no menu lateral\n" +
      "2. Vá em **Meu Perfil**\n" +
      "3. Informe a senha atual e a nova senha\n" +
      "4. Clique em **Salvar**\n\n" +
      "Esqueceu a senha? Faça logout e use **\"Esqueci minha senha\"** no login.",
  },
  {
    palavras: ["onde", "caminho", "encontrar", "navegar", "menu", "fica", "localizar", "mapa"],
    resposta:
      "**Mapa do sistema:**\n\n" +
      "• `/painel` — Dashboard\n" +
      "• `/painel/alunos` — Alunos\n" +
      "• `/painel/matriculas` — Matrículas\n" +
      "• `/painel/cursos` — Cursos\n" +
      "• `/painel/baixas` — Financeiro\n" +
      "• `/painel/certificados` — Certificados\n" +
      "• `/painel/salas` — Salas de Videoaula\n" +
      "• `/painel/usuarios` — Usuários\n" +
      "• `/painel/configuracoes` — Configurações\n\n" +
      "Use a **barra lateral** para navegar.",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Bolhas de hover por modo
// ─────────────────────────────────────────────────────────────────────────────

const BOLHAS: Record<ModoStacky, { texto: string; sub: string }[]> = {
  landing: [
    { texto: "Posso te ajudar? 👋",      sub: "Clique para falar conosco" },
    { texto: "Precisando de um sistema?", sub: "Somos especialistas"       },
    { texto: "Olá! Tudo bem? 😊",         sub: "Vamos conversar"            },
  ],
  login: [
    { texto: "Olá! Sou o Stacky 🤖",  sub: "Clique para tirar dúvidas" },
    { texto: "Precisa de ajuda? 💬",   sub: "Estou aqui para ajudar"    },
    { texto: "Como posso ajudar? 😊",  sub: "Clique para conversar"     },
  ],
  painel: [
    { texto: "Oi! Sou o Stacky 🤖",   sub: "Clique para tirar dúvidas"       },
    { texto: "Ficou em dúvida? 💬",    sub: "Pergunte-me qualquer coisa"      },
    { texto: "Posso ajudar? 😊",       sub: "Sobre qualquer funcionalidade"   },
  ],
}

// Atalhos rápidos exibidos no início do chat
const ATALHOS_INICIAIS: Record<"login" | "painel", string[]> = {
  login: [
    "Como fazer login?",
    "Esqueci minha senha",
    "Não tenho acesso",
    "O que é o StackSystems?",
  ],
  painel: [
    "Como cadastrar alunos?",
    "Como criar uma matrícula?",
    "Como criar uma sala de aula?",
    "Mapa do sistema",
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitário: renderiza **negrito** em texto simples → React nodes
// ─────────────────────────────────────────────────────────────────────────────

function renderTexto(texto: string): React.ReactNode {
  const linhas = texto.split("\n")
  return linhas.map((linha, i) => {
    const partes = linha.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i}>
        {partes.map((parte, j) =>
          j % 2 === 1
            ? <strong key={j}>{parte}</strong>
            : <span key={j}>{parte}</span>
        )}
        {i < linhas.length - 1 && <br />}
      </span>
    )
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Mensagem de boas-vindas por modo
// ─────────────────────────────────────────────────────────────────────────────

const BOAS_VINDAS: Record<"login" | "painel", string> = {
  login:
    "Olá! Sou o **Stacky**, assistente do StackSystems. 👋\n\n" +
    "Posso te ajudar com dúvidas sobre **login**, **recuperação de senha** e **acesso à plataforma**.\n\n" +
    "Selecione uma opção abaixo ou digite sua pergunta:",
  painel:
    "Olá! Sou o **Stacky**, assistente do StackSystems. 🤖\n\n" +
    "Posso responder dúvidas sobre qualquer funcionalidade do sistema.\n\n" +
    "Selecione uma opção abaixo ou digite sua pergunta:",
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Modo de operação do Stacky. Padrão: "landing" */
  modo?: ModoStacky
}

export default function Mascote({ modo = "landing" }: Props) {
  const router = useRouter()

  // ── Estado do robô ────────────────────────────────────────────────────────
  const containerRef                = useRef<HTMLDivElement>(null)
  const chatBottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)
  const [mouse,    setMouse]        = useState({ x: 0, y: 0 })
  const [hovered,  setHovered]      = useState(false)
  const [blink,    setBlink]        = useState(false)
  const [humor,    setHumor]        = useState<Humor>("normal")
  const [msgIdx,   setMsgIdx]       = useState(0)
  const [visible,  setVisible]      = useState(false)

  // ── Estado do chat ────────────────────────────────────────────────────────
  const [aberto,    setAberto]   = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input,     setInput]    = useState("")
  const [pensando,  setPensando] = useState(false)

  // ── Inicialização ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  // ── Mouse tracking (pupila) ───────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  // ── Piscar aleatório ──────────────────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const agendar = () => {
      t = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 110)
        agendar()
      }, 2200 + Math.random() * 3500)
    }
    agendar()
    return () => clearTimeout(t)
  }, [])

  // ── Ciclo de humores e bolhas ─────────────────────────────────────────────
  useEffect(() => {
    const humores: Humor[] = ["normal", "happy", "thinking", "wink", "normal", "normal"]
    let i = 0
    const t = setInterval(() => {
      i = (i + 1) % humores.length
      setHumor(humores[i])
      setMsgIdx(prev => (prev + 1) % BOLHAS[modo].length)
    }, 7000)
    return () => clearInterval(t)
  }, [modo])

  // ── Scroll automático no chat ─────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens, pensando])

  // ── Boas-vindas ao abrir ──────────────────────────────────────────────────
  useEffect(() => {
    if (aberto && mensagens.length === 0 && modo !== "landing") {
      const base = modo === "login" ? FAQ_LOGIN : FAQ_PAINEL
      setMensagens([{
        de:     "stacky",
        texto:  BOAS_VINDAS[modo],
        atalhos: ATALHOS_INICIAIS[modo].map(rotulo => ({
          rotulo,
          acao: rotulo,
        })),
      }])
      void base // suprime warning de unused
    }
  }, [aberto, modo, mensagens.length])

  // ── Cálculo do offset da pupila ───────────────────────────────────────────
  const getPupila = useCallback(
    (eyeLocalX: number, eyeLocalY: number) => {
      const el = containerRef.current
      if (!el) return { x: 0, y: 0 }
      const rect = el.getBoundingClientRect()
      const cx   = rect.left + eyeLocalX
      const cy   = rect.top  + eyeLocalY
      const dx   = mouse.x - cx
      const dy   = mouse.y - cy
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const max  = 4.5
      return {
        x: (dx / dist) * Math.min(dist * 0.12, max),
        y: (dy / dist) * Math.min(dist * 0.12, max),
      }
    },
    [mouse]
  )

  const lPupila = getPupila(22, 26)
  const rPupila = getPupila(50, 26)
  const springCfg = { type: "spring" as const, stiffness: 380, damping: 22, mass: 0.4 }

  // ── Boca por humor ────────────────────────────────────────────────────────
  const Boca = () => {
    if (humor === "happy")
      return <div className="w-8 h-2 border-b-2 border-white/70 rounded-b-full mx-auto mt-1" />
    if (humor === "thinking")
      return <div className="w-5 h-1.5 bg-white/50 rounded-full mx-auto mt-1.5 ml-6" />
    if (humor === "wink")
      return <div className="w-6 h-1.5 border-b-2 border-white/70 rounded-b-full mx-auto mt-1 ml-4" />
    return <div className="w-7 h-[3px] bg-white/40 rounded-full mx-auto mt-2" />
  }

  // ── Click handler ─────────────────────────────────────────────────────────
  function handleClick() {
    if (modo === "landing") {
      document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })
    } else {
      setAberto(v => !v)
    }
  }

  // ── Enviar mensagem do usuário ────────────────────────────────────────────
  function enviar(texto: string) {
    if (!texto.trim() || pensando) return

    const base = modo === "login" ? FAQ_LOGIN : FAQ_PAINEL

    // Verifica se é uma rota de navegação
    if (texto.startsWith("/")) {
      router.push(texto)
      return
    }

    const msgUsuario: Mensagem = { de: "usuario", texto }
    setMensagens(prev => [...prev, msgUsuario])
    setInput("")
    setPensando(true)

    // Simula tempo de "pensamento" do Stacky
    setTimeout(() => {
      const entrada = buscarResposta(texto, base)
      const msgStacky: Mensagem = {
        de:     "stacky",
        texto:  entrada.resposta,
        atalhos: entrada.atalhos,
      }
      setMensagens(prev => [...prev, msgStacky])
      setPensando(false)
    }, 600 + Math.random() * 400)
  }

  function handleAtalho(atalho: Atalho) {
    if (atalho.acao.startsWith("/")) {
      router.push(atalho.acao)
    } else {
      enviar(atalho.rotulo)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-8 right-8 z-50 select-none"
        >
          {/* ── Painel de chat ──────────────────────────────────────────── */}
          <AnimatePresence>
            {aberto && modo !== "landing" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 16 }}
                transition={{ type: "spring", stiffness: 340, damping: 26 }}
                className="absolute bottom-[calc(100%+12px)] right-0 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/70 border border-slate-100 flex flex-col overflow-hidden"
                style={{ maxHeight: "460px" }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white text-xs font-serif">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm leading-none">Stacky</p>
                    <p className="text-orange-100 text-[10px] mt-0.5">
                      {modo === "login" ? "Suporte ao acesso" : "Assistente do sistema"}
                    </p>
                  </div>
                  <button
                    onClick={() => setAberto(false)}
                    className="text-white/70 hover:text-white transition-colors p-0.5"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Mensagens */}
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0">
                  {mensagens.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-1.5 ${msg.de === "usuario" ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          msg.de === "usuario"
                            ? "bg-orange-500 text-white rounded-br-sm"
                            : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-sm"
                        }`}
                      >
                        {renderTexto(msg.texto)}
                      </div>

                      {/* Atalhos de resposta */}
                      {msg.atalhos && msg.atalhos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                          {msg.atalhos.map((a, ai) => (
                            <button
                              key={ai}
                              onClick={() => handleAtalho(a)}
                              className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors"
                            >
                              {a.rotulo}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Indicador "pensando" */}
                  {pensando && (
                    <div className="flex items-start">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1 items-center">
                        {[0, 0.2, 0.4].map((d, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-slate-400"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-2.5 border-t border-slate-100 flex gap-2 shrink-0">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") enviar(input) }}
                    placeholder="Digite sua dúvida..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition-all"
                  />
                  <button
                    onClick={() => enviar(input)}
                    disabled={!input.trim() || pensando}
                    className="w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all shrink-0"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Robô flutuante ──────────────────────────────────────────── */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Bolha de fala (hover) */}
            <AnimatePresence>
              {hovered && !aberto && (
                <motion.div
                  key={msgIdx}
                  initial={{ opacity: 0, scale: 0.75, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, y: 10 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="absolute bottom-full mb-4 right-0 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-slate-200/80 border border-slate-100 whitespace-nowrap pointer-events-none"
                >
                  <p className="text-sm font-bold text-slate-800">{BOLHAS[modo][msgIdx].texto}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{BOLHAS[modo][msgIdx].sub}</p>
                  <div className="absolute -bottom-[7px] right-6 w-3.5 h-3.5 bg-white border-b border-r border-slate-100 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Robô */}
            <motion.div
              ref={containerRef}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="cursor-pointer relative"
              onHoverStart={() => setHovered(true)}
              onHoverEnd={() => setHovered(false)}
              onClick={handleClick}
            >
              {/* Sombra */}
              <motion.div
                animate={{ scaleX: [1, 0.85, 1], opacity: [0.25, 0.15, 0.25] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-400/30 rounded-full blur-sm pointer-events-none"
              />

              {/* Antena */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                <motion.div
                  animate={{ boxShadow: ["0 0 6px #fb923c", "0 0 16px #f97316", "0 0 6px #fb923c"] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-orange-400"
                />
                <div className="w-[3px] h-4 bg-gradient-to-b from-orange-400 to-orange-600/60 rounded-full" />
              </div>

              {/* Cabeça */}
              <div className="relative w-[72px] h-[62px]">
                {/* Parafusos laterais */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-5 bg-gradient-to-b from-orange-500 to-orange-700 rounded-sm shadow-inner" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-5 bg-gradient-to-b from-orange-500 to-orange-700 rounded-sm shadow-inner" />

                {/* Corpo da cabeça */}
                <div className="w-full h-full bg-gradient-to-b from-orange-400 to-orange-600 rounded-[20px] relative overflow-hidden shadow-xl shadow-orange-300/60">
                  {/* Brilho */}
                  <div className="absolute top-1 left-2 right-12 h-3 bg-white/20 rounded-full blur-sm" />

                  {/* Visor */}
                  <div className="absolute inset-x-3 top-3.5 bottom-3.5 bg-slate-950 rounded-[12px] overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(255,255,255,0.02)_3px,rgba(255,255,255,0.02)_4px)] pointer-events-none" />

                    {/* Olhos */}
                    <div className="absolute inset-0 flex items-center justify-center gap-[10px]">
                      {/* Olho esquerdo */}
                      <div className="w-[18px] h-[18px] bg-white rounded-full relative overflow-hidden flex items-center justify-center shadow-sm">
                        <motion.div
                          className="absolute top-0 left-0 right-0 bg-orange-500 origin-top z-20 pointer-events-none"
                          animate={{ height: blink ? "100%" : "0%" }}
                          transition={{ duration: 0.06 }}
                        />
                        <motion.div
                          className="w-3 h-3 bg-slate-900 rounded-full absolute"
                          animate={{ x: lPupila.x, y: lPupila.y }}
                          transition={springCfg}
                        >
                          <div className="w-1 h-1 bg-white/90 rounded-full absolute top-0.5 right-0.5" />
                        </motion.div>
                      </div>

                      {/* Olho direito (pisca ou fecha no wink) */}
                      <div className="w-[18px] h-[18px] bg-white rounded-full relative overflow-hidden flex items-center justify-center shadow-sm">
                        <motion.div
                          className="absolute top-0 left-0 right-0 bg-orange-500 origin-top z-20 pointer-events-none"
                          animate={{ height: blink || humor === "wink" ? "100%" : "0%" }}
                          transition={{ duration: 0.06 }}
                        />
                        <motion.div
                          className="w-3 h-3 bg-slate-900 rounded-full absolute"
                          animate={{ x: rPupila.x, y: rPupila.y }}
                          transition={springCfg}
                        >
                          <div className="w-1 h-1 bg-white/90 rounded-full absolute top-0.5 right-0.5" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Boca */}
                    <div className="absolute bottom-2 left-0 right-0">
                      <Boca />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pescoço */}
              <div className="w-8 h-2.5 bg-orange-600/80 rounded-b-md mx-auto" />

              {/* Torso */}
              <div className="w-[56px] h-[28px] bg-gradient-to-b from-orange-500 to-orange-700 rounded-xl mx-auto relative overflow-hidden shadow-lg shadow-orange-300/30">
                <div className="absolute top-2 left-0 right-0 flex justify-center gap-2">
                  {[
                    { delay: 0, initial: 0.5 },
                    { delay: 0.4, initial: 1 },
                    { delay: 0.8, initial: 0.5 },
                  ].map(({ delay, initial }, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [initial, 1 - initial + 0.5, initial] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay }}
                      className="w-2 h-2 rounded-full bg-white/60"
                    />
                  ))}
                </div>
              </div>

              {/* Badge "S" */}
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-1 -right-2 w-6 h-6 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center shadow-md"
              >
                <span className="text-[10px] font-black text-orange-500 font-serif">S</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
