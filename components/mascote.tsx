/**
 * componentes/mascote.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Stacky — Mascote inteligente do StackSystems
 *
 * Comportamentos de idle:
 *   20s sem interação → acena (👋 ao lado direito, bolha automática)
 *   45s sem interação → dorme (olhos fecham + Zzz da cabeça)
 *   Mouse/clique durante sono → susto + acorda
 *
 * Controles de visibilidade:
 *   Hover → botão × para esconder
 *   Escondido → bolinha laranja pulsando para chamar de volta
 *
 * Modos: "landing" | "login" | "painel"
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence, type Transition } from "motion/react"
import { X, Send } from "lucide-react"
import { useRouter } from "next/navigation"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ModoStacky = "landing" | "login" | "painel"
type Humor = "normal" | "happy" | "thinking" | "wink"

interface Mensagem {
  de:      "usuario" | "stacky"
  texto:   string
  atalhos?: Atalho[]
}
interface Atalho { rotulo: string; acao: string }
interface EntradaFaq { palavras: string[]; resposta: string; atalhos?: Atalho[] }

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Engine
// ─────────────────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ")
}

function buscarResposta(pergunta: string, base: EntradaFaq[]): EntradaFaq {
  const q = norm(pergunta)
  const pontuada = base.map(e => ({ e, pts: e.palavras.filter(p => q.includes(norm(p))).length }))
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
// FAQ — Login
// ─────────────────────────────────────────────────────────────────────────────

const FAQ_LOGIN: EntradaFaq[] = [
  {
    palavras: ["login", "entrar", "acessar", "como entro", "como acesso"],
    resposta:
      "Para fazer login:\n\n" +
      "1. Digite seu **e-mail** cadastrado\n" +
      "2. Digite sua **senha**\n" +
      "3. Clique em **Entrar na Plataforma**\n\n" +
      "Se não sabe seu e-mail, consulte o administrador da sua empresa.",
    atalhos: [{ rotulo: "Esqueci minha senha", acao: "/login/esqueci-senha" }],
  },
  {
    palavras: ["esqueci", "recuperar senha", "redefinir", "trocar senha", "resetar", "nova senha", "senha errada"],
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
    palavras: ["nao tenho acesso", "primeiro acesso", "nao tenho conta", "como obter acesso", "novo usuario"],
    resposta:
      "O acesso é feito por **convite do administrador** da sua empresa.\n\n" +
      "Se não tem conta:\n" +
      "• Contate o **administrador** da sua empresa\n" +
      "• Ele cadastra seu usuário e passa suas credenciais\n\n" +
      "Não é possível criar conta diretamente.",
  },
  {
    palavras: ["qual email", "nao sei email", "credenciais", "email cadastrado"],
    resposta:
      "Seu **e-mail de acesso** foi cadastrado pelo administrador.\n\n" +
      "Dicas:\n" +
      "• Geralmente é seu e-mail corporativo/institucional\n" +
      "• O e-mail é único por plataforma\n\n" +
      "Não sabe qual é? Consulte o administrador da sua empresa.",
  },
  {
    palavras: ["erro", "nao funciona", "nao consigo entrar", "problema", "falha", "bloqueado", "inativo"],
    resposta:
      "Erros comuns:\n\n" +
      "**Usuário não encontrado** → verifique se o e-mail está correto\n\n" +
      "**Senha incorreta** → use a recuperação de senha\n\n" +
      "**Usuário inativo** → conta desativada — contate o administrador\n\n" +
      "**Campos faltando** → preencha e-mail e senha antes de enviar",
    atalhos: [{ rotulo: "Recuperar senha", acao: "/login/esqueci-senha" }],
  },
  {
    palavras: ["o que e", "stacksystems", "sistema", "plataforma", "para que serve"],
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
// FAQ — Painel
// ─────────────────────────────────────────────────────────────────────────────

const FAQ_PAINEL: EntradaFaq[] = [
  {
    palavras: ["painel", "dashboard", "inicio", "home", "resumo", "kpi", "grafico"],
    resposta:
      "O **Painel** (Dashboard) fica em `/painel`.\n\n" +
      "Exibe:\n" +
      "• Total de alunos, cursos, matrículas ativas e receita\n" +
      "• Acesso rápido aos módulos\n\n" +
      "Clique em **Painel** na barra lateral.",
  },
  {
    palavras: ["aluno", "alunos", "cadastrar aluno", "novo aluno", "estudante", "editar aluno"],
    resposta:
      "**Módulo Alunos** → `/painel/alunos`\n\n" +
      "• **Cadastrar:** botão **\"Novo Aluno\"** → nome, e-mail, CPF, telefone → Salvar\n" +
      "• **Editar:** ícone de lápis ao lado do aluno\n" +
      "• **Desativar:** ícone de lixeira (desativação lógica, dados preservados)\n\n" +
      "Alunos são únicos por e-mail dentro da empresa.",
  },
  {
    palavras: ["matricula", "matricular", "vincular aluno", "inscricao", "aluno curso"],
    resposta:
      "**Módulo Matrículas** → `/painel/matriculas`\n\n" +
      "• **Criar:** botão **\"Nova Matrícula\"** → selecione aluno e curso → valor e data → Salvar\n" +
      "• **Status:** `ativa`, `concluída`, `cancelada`\n\n" +
      "Um aluno pode ter múltiplas matrículas em cursos diferentes.",
  },
  {
    palavras: ["curso", "cursos", "criar curso", "novo curso", "aula", "conteudo", "estrutura curso"],
    resposta:
      "**Módulo Cursos** → `/painel/cursos`\n\n" +
      "• **Criar:** botão **\"Novo Curso\"** → nome, descrição, carga horária\n" +
      "• **Módulos:** dentro do curso, adicione módulos/capítulos\n" +
      "• **Aulas:** dentro de cada módulo, adicione aulas com vídeo/texto\n\n" +
      "Cursos são vinculados às matrículas dos alunos.",
  },
  {
    palavras: ["financeiro", "pagamento", "baixa", "cobranca", "receber", "mensalidade", "valor"],
    resposta:
      "**Módulo Financeiro** → `/painel/baixas`\n\n" +
      "• Registre **pagamentos** de matrículas\n" +
      "• **Status:** pendente, pago, cancelado\n" +
      "• Filtre por período, aluno ou status\n\n" +
      "Cada baixa está vinculada a uma matrícula.",
  },
  {
    palavras: ["certificado", "certificados", "emitir certificado", "diploma", "conclusao"],
    resposta:
      "**Módulo Certificados** → `/painel/certificados`\n\n" +
      "• Emita certificados para alunos com matrícula **concluída**\n" +
      "• O certificado é gerado automaticamente com dados do aluno e curso\n" +
      "• Disponível para download em PDF\n\n" +
      "Acesse pelo botão **\"Emitir Certificado\"** na tela do aluno.",
  },
  {
    palavras: ["sala", "salas", "videoaula", "video", "chamada", "webrtc", "reuniao", "aula online"],
    resposta:
      "**Módulo Salas** → `/painel/salas`\n\n" +
      "• **Criar sala:** botão **\"Nova Sala\"** → nome\n" +
      "• **Entrar:** clique em **\"Entrar na Sala\"** — você será o anfitrião\n" +
      "• **Convidar:** copie o código e envie para o participante\n" +
      "• O participante acessa pelo link com o código\n\n" +
      "Comunicação P2P via WebRTC (sem servidor intermediário).",
  },
  {
    palavras: ["usuario", "usuarios", "cadastrar usuario", "novo usuario", "papel", "permissao", "admin"],
    resposta:
      "**Módulo Usuários** → `/painel/usuarios`\n\n" +
      "Papéis disponíveis:\n" +
      "• **A** (Admin) — acesso total\n" +
      "• **T** (Técnico) — gestão operacional\n" +
      "• **I** (Instrutor) — acesso às aulas\n" +
      "• **E/F** (Externo/Familiar) — acesso restrito via link\n\n" +
      "Apenas administradores podem criar usuários.",
  },
  {
    palavras: ["configuracao", "configuracoes", "empresa", "conta", "dados empresa"],
    resposta:
      "**Configurações** → `/painel/configuracoes`\n\n" +
      "• Nome e dados da empresa\n" +
      "• Logo e identidade visual\n" +
      "• Módulos ativos\n\n" +
      "Acesso restrito ao **Administrador**.",
  },
  {
    palavras: ["onde", "caminho", "encontrar", "navegar", "menu", "fica", "mapa"],
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
// Conteúdo das bolhas
// ─────────────────────────────────────────────────────────────────────────────

const BOLHAS: Record<ModoStacky, { texto: string; sub: string }[]> = {
  landing: [
    { texto: "Posso te ajudar? 👋",      sub: "Clique para falar conosco" },
    { texto: "Precisando de um sistema?", sub: "Somos especialistas"       },
    { texto: "Olá! Tudo bem? 😊",         sub: "Vamos conversar"           },
  ],
  login: [
    { texto: "Olá! Sou o Stacky 🤖",  sub: "Clique para tirar dúvidas" },
    { texto: "Precisa de ajuda? 💬",   sub: "Estou aqui para ajudar"    },
    { texto: "Como posso ajudar? 😊",  sub: "Clique para conversar"     },
  ],
  painel: [
    { texto: "Oi! Sou o Stacky 🤖",   sub: "Clique para tirar dúvidas"     },
    { texto: "Ficou em dúvida? 💬",    sub: "Pergunte-me qualquer coisa"    },
    { texto: "Posso ajudar? 😊",       sub: "Sobre qualquer funcionalidade" },
  ],
}

const ATALHOS_INICIAIS: Record<"login" | "painel", string[]> = {
  login:  ["Como fazer login?", "Esqueci minha senha", "Não tenho acesso", "O que é o StackSystems?"],
  painel: ["Como cadastrar alunos?", "Como criar uma matrícula?", "Como criar uma sala de aula?", "Mapa do sistema"],
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderTexto(texto: string): React.ReactNode {
  return texto.split("\n").map((linha, i, arr) => {
    const partes = linha.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i}>
        {partes.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : <span key={j}>{p}</span>)}
        {i < arr.length - 1 && <br />}
      </span>
    )
  })
}

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

// Springs reutilizados
const SPRING_POPUP: Transition = { type: "spring", stiffness: 340, damping: 26 }
const SPRING_FAST:  Transition = { type: "spring", stiffness: 420, damping: 28 }
const SPRING_PUPIL: Transition = { type: "spring", stiffness: 380, damping: 22, mass: 0.4 }

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

interface Props { modo?: ModoStacky }

export default function Mascote({ modo = "landing" }: Props) {
  const router = useRouter()

  // ── Refs ──────────────────────────────────────────────────────────────────
  const containerRef  = useRef<HTMLDivElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const inputRef      = useRef<HTMLInputElement>(null)
  const idleT1Ref     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleT2Ref     = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Refs para event listeners sem stale closure
  const dormindoRef   = useRef(false)
  const escondidoRef  = useRef(false)
  const abertoRef     = useRef(false)

  // ── Estado visual ─────────────────────────────────────────────────────────
  const [mouse,    setMouse]   = useState({ x: 0, y: 0 })
  const [hovered,  setHovered] = useState(false)
  const [blink,    setBlink]   = useState(false)
  const [humor,    setHumor]   = useState<Humor>("normal")
  const [msgIdx,   setMsgIdx]  = useState(0)
  const [visible,  setVisible] = useState(false)

  // ── Estado de comportamento ───────────────────────────────────────────────
  const [dormindo,  setDormindo]  = useState(false)
  const [assustado, setAssustado] = useState(false)
  const [acenando,  setAcenando]  = useState(false)
  const [escondido, setEscondido] = useState(false)

  // ── Estado do chat ────────────────────────────────────────────────────────
  const [aberto,    setAberto]    = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input,     setInput]     = useState("")
  const [pensando,  setPensando]  = useState(false)

  // Mantém refs sincronizados
  useEffect(() => { dormindoRef.current  = dormindo  }, [dormindo])
  useEffect(() => { escondidoRef.current = escondido }, [escondido])
  useEffect(() => { abertoRef.current    = aberto    }, [aberto])

  // ── Inicialização ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 900)
    return () => clearTimeout(t)
  }, [])

  // ── Reset idle ────────────────────────────────────────────────────────────
  const resetIdle = useCallback(() => {
    if (escondidoRef.current) return

    // Acorda com susto se estava dormindo
    if (dormindoRef.current) {
      dormindoRef.current = false
      setDormindo(false)
      setAssustado(true)
      setTimeout(() => setAssustado(false), 1000)
    }

    setAcenando(false)
    if (idleT1Ref.current) clearTimeout(idleT1Ref.current)
    if (idleT2Ref.current) clearTimeout(idleT2Ref.current)

    // Acena em 20s
    idleT1Ref.current = setTimeout(() => {
      if (abertoRef.current || escondidoRef.current) return
      setAcenando(true)

      // Dorme 25s depois do aceno (45s total)
      idleT2Ref.current = setTimeout(() => {
        if (abertoRef.current || escondidoRef.current) return
        setAcenando(false)
        dormindoRef.current = true
        setDormindo(true)
      }, 25_000)
    }, 20_000)
  }, [])

  // ── Mouse + idle ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY })
      resetIdle()
    }
    const onClick = () => resetIdle()
    window.addEventListener("mousemove", onMove)
    window.addEventListener("click",     onClick)
    resetIdle()
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("click",     onClick)
      if (idleT1Ref.current) clearTimeout(idleT1Ref.current)
      if (idleT2Ref.current) clearTimeout(idleT2Ref.current)
    }
  }, [resetIdle])

  // ── Piscar (não pisca dormindo) ───────────────────────────────────────────
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const agendar = () => {
      t = setTimeout(() => {
        if (!dormindoRef.current) {
          setBlink(true)
          setTimeout(() => setBlink(false), 100)
        }
        agendar()
      }, 2500 + Math.random() * 3000)
    }
    agendar()
    return () => clearTimeout(t)
  }, [])

  // ── Ciclo de humores ──────────────────────────────────────────────────────
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
        de:    "stacky",
        texto: BOAS_VINDAS[modo],
        atalhos: ATALHOS_INICIAIS[modo].map(r => ({ rotulo: r, acao: r })),
      }])
      void base
    }
  }, [aberto, modo, mensagens.length])

  // ── Pupila (para enquanto dorme) ──────────────────────────────────────────
  const getPupila = useCallback(
    (ex: number, ey: number) => {
      if (dormindo) return { x: 0, y: 1 }
      const el = containerRef.current
      if (!el) return { x: 0, y: 0 }
      const rect = el.getBoundingClientRect()
      const dx = mouse.x - (rect.left + ex)
      const dy = mouse.y - (rect.top  + ey)
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const max = 4.5
      return {
        x: (dx / dist) * Math.min(dist * 0.12, max),
        y: (dy / dist) * Math.min(dist * 0.12, max),
      }
    },
    [mouse, dormindo]
  )

  const lPupila = getPupila(22, 26)
  const rPupila = getPupila(50, 26)

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleClick() {
    if (dormindo) { resetIdle(); return }
    if (modo === "landing") {
      document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })
    } else {
      setAberto(v => !v)
    }
  }

  function esconder(e: React.MouseEvent) {
    e.stopPropagation()
    setEscondido(true)
    setAberto(false)
    setDormindo(false)
    setAcenando(false)
    dormindoRef.current = false
    if (idleT1Ref.current) clearTimeout(idleT1Ref.current)
    if (idleT2Ref.current) clearTimeout(idleT2Ref.current)
  }

  function chamarStacky() {
    setEscondido(false)
    setDormindo(false)
    setAssustado(false)
    dormindoRef.current = false
    setHumor("happy")
    // Vibra feliz por 2s, depois volta ao normal
    setTimeout(() => { setHumor("normal"); resetIdle() }, 2000)
  }

  function enviar(texto: string) {
    if (!texto.trim() || pensando) return
    if (texto.startsWith("/")) { router.push(texto); return }
    const base = modo === "login" ? FAQ_LOGIN : FAQ_PAINEL
    setMensagens(prev => [...prev, { de: "usuario", texto }])
    setInput("")
    setPensando(true)
    setTimeout(() => {
      const entrada = buscarResposta(texto, base)
      setMensagens(prev => [...prev, { de: "stacky", texto: entrada.resposta, atalhos: entrada.atalhos }])
      setPensando(false)
    }, 500 + Math.random() * 400)
  }

  function handleAtalho(a: Atalho) {
    if (a.acao.startsWith("/")) router.push(a.acao)
    else enviar(a.rotulo)
  }

  // ── Boca (calculada, não component inline) ────────────────────────────────
  const bocaJsx = dormindo ? (
    // Linha reta — dormindo
    <div className="w-6 h-[2px] bg-white/25 rounded-full mx-auto mt-2.5" />
  ) : assustado ? (
    // "O" aberta — susto
    <div className="w-5 h-4 border-2 border-white/55 rounded-full mx-auto mt-0.5" />
  ) : acenando || humor === "happy" ? (
    // Sorriso
    <div className="w-8 h-2 border-b-[2.5px] border-white/75 rounded-b-full mx-auto mt-1" />
  ) : humor === "thinking" ? (
    // Lateral — pensativo
    <div className="w-5 h-[2px] bg-white/50 rounded-full mx-auto mt-1.5 ml-6" />
  ) : humor === "wink" ? (
    // Meio sorriso
    <div className="w-6 h-1.5 border-b-2 border-white/65 rounded-b-full mx-auto mt-1 ml-4" />
  ) : (
    // Normal
    <div className="w-7 h-[2px] bg-white/40 rounded-full mx-auto mt-2" />
  )

  // ── Animação do corpo flutuante ───────────────────────────────────────────
  // Mantém float normal sempre — efeitos especiais ficam nos elementos filhos
  const floatY: Transition = dormindo
    ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
    : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Botão recall (quando escondido) ───────────────────────────── */}
      <AnimatePresence>
        {escondido && (
          <motion.button
            key="recall"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={SPRING_POPUP}
            onClick={chamarStacky}
            className="fixed bottom-8 right-8 z-50 group"
            title="Chamar o Stacky"
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="w-13 h-13 w-[52px] h-[52px] bg-orange-500 rounded-full shadow-xl shadow-orange-400/40 flex items-center justify-center relative"
            >
              {/* Anel pulsante */}
              <motion.div
                animate={{ scale: [1, 1.7], opacity: [0.45, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-orange-400"
              />
              <span className="text-[22px] relative z-10 leading-none">🤖</span>
            </motion.div>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2.5 bg-white rounded-2xl px-3.5 py-2.5 shadow-xl border border-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-xs font-bold text-slate-700">Chamar o Stacky</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Clique para me trazer de volta</p>
              <div className="absolute -bottom-[7px] right-5 w-3.5 h-3.5 bg-white border-b border-r border-slate-100 rotate-45" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mascote principal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && !escondido && (
          <motion.div
            key="mascote"
            initial={{ opacity: 0, scale: 0.2, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.2, y: 30 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="fixed bottom-8 right-8 z-50 select-none"
          >
            {/* ── Painel de chat ─────────────────────────────────────── */}
            <AnimatePresence>
              {aberto && modo !== "landing" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, scale: 0.88, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: 18 }}
                  transition={SPRING_POPUP}
                  className="absolute bottom-[calc(100%+14px)] right-0 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-100 flex flex-col overflow-hidden"
                  style={{ maxHeight: "460px" }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/stacky-pose.svg" alt="Stacky" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm leading-none">Stacky</p>
                      <p className="text-orange-100 text-[10px] mt-0.5">
                        {modo === "login" ? "Suporte ao acesso" : "Assistente do sistema"}
                      </p>
                    </div>
                    <button
                      onClick={() => setAberto(false)}
                      className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0">
                    {mensagens.map((msg, i) => (
                      <div key={i} className={`flex flex-col gap-1.5 ${msg.de === "usuario" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          msg.de === "usuario"
                            ? "bg-orange-500 text-white rounded-br-sm"
                            : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-sm"
                        }`}>
                          {renderTexto(msg.texto)}
                        </div>
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
                    {pensando && (
                      <div className="flex items-start">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1 items-center">
                          {[0, 0.18, 0.36].map((d, i) => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-slate-400"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.55, repeat: Infinity, delay: d }}
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
                      className="w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Robô + elementos flutuantes ─────────────────────────── */}
            <motion.div
              animate={{ y: dormindo ? [0, -4, 0] : [0, -8, 0] }}
              transition={floatY}
              className="relative"
            >

              {/* ──────────────────────────────────────────────────────── */}
              {/* Bolha de fala — hover normal ou aceno automático        */}
              {/* ──────────────────────────────────────────────────────── */}
              <AnimatePresence>
                {/* Acenando: bolha aparece automaticamente, sem hover */}
                {acenando && !aberto && (
                  <motion.div
                    key="bolha-aceno"
                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 8 }}
                    transition={SPRING_FAST}
                    className="absolute bottom-full mb-4 right-0 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-slate-200/80 border border-slate-100 whitespace-nowrap pointer-events-none"
                  >
                    <p className="text-sm font-bold text-slate-800">Ei! Ainda aqui! 👋</p>
                    <p className="text-xs text-slate-400 mt-0.5">Clique se precisar de ajuda</p>
                    <div className="absolute -bottom-[7px] right-6 w-3.5 h-3.5 bg-white border-b border-r border-slate-100 rotate-45" />
                  </motion.div>
                )}

                {/* Dormindo: bolha ao hover */}
                {hovered && dormindo && !aberto && (
                  <motion.div
                    key="bolha-sono"
                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 8 }}
                    transition={SPRING_FAST}
                    className="absolute bottom-full mb-4 right-0 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-slate-200/80 border border-slate-100 whitespace-nowrap pointer-events-none"
                  >
                    <p className="text-sm font-bold text-slate-800">Zzzz... 😴</p>
                    <p className="text-xs text-slate-400 mt-0.5">Clique para me acordar</p>
                    <div className="absolute -bottom-[7px] right-6 w-3.5 h-3.5 bg-white border-b border-r border-slate-100 rotate-45" />
                  </motion.div>
                )}

                {/* Normal: bolha ao hover */}
                {hovered && !acenando && !dormindo && !assustado && !aberto && (
                  <motion.div
                    key={`bolha-${msgIdx}`}
                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: 8 }}
                    transition={SPRING_FAST}
                    className="absolute bottom-full mb-4 right-0 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-slate-200/80 border border-slate-100 whitespace-nowrap pointer-events-none"
                  >
                    <p className="text-sm font-bold text-slate-800">{BOLHAS[modo][msgIdx].texto}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{BOLHAS[modo][msgIdx].sub}</p>
                    <div className="absolute -bottom-[7px] right-6 w-3.5 h-3.5 bg-white border-b border-r border-slate-100 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ──────────────────────────────────────────────────────── */}
              {/* Zzz — saem da cabeça do robô (lado direito, acima)      */}
              {/* ──────────────────────────────────────────────────────── */}
              <AnimatePresence>
                {dormindo && (
                  <motion.div
                    key="zzz-wrapper"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute pointer-events-none"
                    style={{ top: 4, right: -4 }}
                  >
                    {[
                      { letter: "z", size: 10, delay: 0,    tx: 8,  ty: -22 },
                      { letter: "z", size: 13, delay: 0.75, tx: 16, ty: -40 },
                      { letter: "Z", size: 17, delay: 1.5,  tx: 24, ty: -62 },
                    ].map(({ letter, size, delay, tx, ty }, i) => (
                      <motion.span
                        key={i}
                        className="absolute font-black text-orange-300 select-none"
                        style={{ fontSize: size, top: 0, right: 0 }}
                        animate={{
                          opacity: [0, 0, 1, 1, 0],
                          x:       [0, tx * 0.3, tx * 0.7, tx],
                          y:       [0, ty * 0.3, ty * 0.7, ty],
                          scale:   [0.6, 0.8, 1, 1.1, 0.9],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeOut" }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ──────────────────────────────────────────────────────── */}
              {/* Emoji de susto — sobe e some                            */}
              {/* ──────────────────────────────────────────────────────── */}
              <AnimatePresence>
                {assustado && (
                  <motion.div
                    key="susto"
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [0, -16, -28, -40], scale: [0.5, 1.3, 1.1, 0.8] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.85, ease: "easeOut" }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl pointer-events-none z-30"
                  >
                    😱
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ──────────────────────────────────────────────────────── */}
              {/* Botão × para esconder — aparece no hover                */}
              {/* ──────────────────────────────────────────────────────── */}
              <AnimatePresence>
                {hovered && (
                  <motion.button
                    key="btn-esconder"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={SPRING_FAST}
                    onClick={esconder}
                    title="Esconder o Stacky"
                    className="absolute -top-2 -left-2 z-30 w-5 h-5 bg-slate-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-md transition-colors"
                  >
                    <X size={10} className="text-white" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ──────────────────────────────────────────────────────── */}
              {/* O Robô                                                  */}
              {/* ──────────────────────────────────────────────────────── */}
              <motion.div
                ref={containerRef}
                whileHover={{ scale: dormindo ? 1.02 : 1.08 }}
                whileTap={{ scale: 0.92 }}
                animate={
                  assustado
                    ? { rotate: [0, -5, 5, -3, 2, 0] }
                    : dormindo
                    ? { rotate: -4 }
                    : { rotate: 0 }
                }
                transition={
                  assustado
                    ? { duration: 0.5, ease: "easeInOut" }
                    : { duration: 0.6, ease: "easeInOut" }
                }
                className="cursor-pointer relative z-10"
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                onClick={handleClick}
              >
                {/* Sombra projetada */}
                <motion.div
                  animate={
                    dormindo
                      ? { scaleX: [0.85, 0.75, 0.85], opacity: [0.12, 0.08, 0.12] }
                      : assustado
                      ? { scaleX: [1.2, 0.7, 1], opacity: [0.35, 0.1, 0.2] }
                      : { scaleX: [1, 0.82, 1], opacity: [0.22, 0.12, 0.22] }
                  }
                  transition={{
                    duration: dormindo ? 5.5 : assustado ? 0.5 : 3.4,
                    repeat: assustado ? 0 : Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-2.5 bg-slate-900/20 rounded-full blur-[3px] pointer-events-none"
                />

                {/* Antena */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ zIndex: 12 }}>
                  <motion.div
                    animate={
                      assustado
                        ? { boxShadow: ["0 0 8px #f87171", "0 0 28px #ef4444", "0 0 8px #fb923c"], backgroundColor: ["#f87171", "#ef4444", "#fb923c"] }
                        : dormindo
                        ? { boxShadow: ["0 0 3px #fdba74", "0 0 7px #fb923c", "0 0 3px #fdba74"] }
                        : acenando
                        ? { boxShadow: ["0 0 8px #fb923c", "0 0 22px #f97316", "0 0 8px #fb923c"] }
                        : { boxShadow: ["0 0 5px #fb923c", "0 0 14px #f97316", "0 0 5px #fb923c"] }
                    }
                    transition={{
                      duration: assustado ? 0.25 : dormindo ? 3 : acenando ? 1 : 1.8,
                      repeat: Infinity,
                    }}
                    className="w-3 h-3 rounded-full bg-orange-400"
                  />
                  <div className="w-[3px] h-4 bg-gradient-to-b from-orange-400 to-orange-600/50 rounded-full" />
                </div>

                {/* Cabeça */}
                <div className="relative w-[72px] h-[62px]">
                  {/* Orelhas/parafusos laterais */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-5 bg-gradient-to-b from-orange-400 to-orange-700 rounded-sm shadow-inner" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-5 bg-gradient-to-b from-orange-400 to-orange-700 rounded-sm shadow-inner" />

                  {/* Corpo da cabeça */}
                  <motion.div
                    animate={
                      dormindo
                        ? { background: ["linear-gradient(to bottom, #c2540a, #923b06)"] }
                        : assustado
                        ? { background: ["linear-gradient(to bottom, #fb923c, #ea580c)", "linear-gradient(to bottom, #fca5a5, #ef4444)", "linear-gradient(to bottom, #fb923c, #ea580c)"] }
                        : { background: ["linear-gradient(to bottom, #fb923c, #ea580c)"] }
                    }
                    transition={{ duration: assustado ? 0.4 : 0.6, repeat: assustado ? 2 : 0 }}
                    className="w-full h-full rounded-[20px] relative overflow-hidden shadow-xl shadow-orange-400/50"
                  >
                    {/* Brilho */}
                    <div className="absolute top-1.5 left-2 right-10 h-2.5 bg-white/20 rounded-full blur-sm" />

                    {/* Visor */}
                    <div className="absolute inset-x-3 top-3.5 bottom-3.5 bg-slate-950 rounded-[12px] overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(255,255,255,0.02)_3px,rgba(255,255,255,0.02)_4px)] pointer-events-none" />

                      {/* Olhos */}
                      <div className="absolute inset-0 flex items-center justify-center gap-[10px]">
                        {/* Olho esquerdo */}
                        <div className="w-[18px] h-[18px] bg-white rounded-full relative overflow-hidden flex items-center justify-center shadow-sm">
                          <motion.div
                            className="absolute top-0 left-0 right-0 bg-orange-500 origin-top z-20 pointer-events-none"
                            animate={{ height: (blink || dormindo) ? "100%" : "0%" }}
                            transition={{ duration: dormindo ? 0.4 : 0.07, ease: "easeInOut" }}
                          />
                          <motion.div
                            className="w-3 h-3 bg-slate-900 rounded-full absolute"
                            animate={{ x: lPupila.x, y: lPupila.y }}
                            transition={SPRING_PUPIL}
                          >
                            <div className="w-[5px] h-[5px] bg-white/90 rounded-full absolute top-0.5 right-0.5" />
                          </motion.div>
                        </div>

                        {/* Olho direito */}
                        <div className="w-[18px] h-[18px] bg-white rounded-full relative overflow-hidden flex items-center justify-center shadow-sm">
                          <motion.div
                            className="absolute top-0 left-0 right-0 bg-orange-500 origin-top z-20 pointer-events-none"
                            animate={{ height: (blink || humor === "wink" || dormindo) ? "100%" : "0%" }}
                            transition={{ duration: dormindo ? 0.4 : 0.07, ease: "easeInOut" }}
                          />
                          <motion.div
                            className="w-3 h-3 bg-slate-900 rounded-full absolute"
                            animate={{ x: rPupila.x, y: rPupila.y }}
                            transition={SPRING_PUPIL}
                          >
                            <div className="w-[5px] h-[5px] bg-white/90 rounded-full absolute top-0.5 right-0.5" />
                          </motion.div>
                        </div>
                      </div>

                      {/* Boca */}
                      <div className="absolute bottom-2 left-0 right-0">
                        {bocaJsx}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Pescoço */}
                <div className="w-8 h-2.5 bg-orange-700/70 rounded-b-md mx-auto" />

                {/* Torso */}
                <motion.div
                  animate={
                    dormindo
                      ? { background: "linear-gradient(to bottom, #9a3d08, #6b2605)" }
                      : { background: "linear-gradient(to bottom, #f97316, #c2410c)" }
                  }
                  transition={{ duration: 0.8 }}
                  className="w-[56px] h-[28px] rounded-xl mx-auto relative overflow-hidden shadow-lg shadow-orange-400/25"
                >
                  <div className="absolute top-2 left-0 right-0 flex justify-center gap-2">
                    {[0, 0.35, 0.7].map((delay, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: dormindo ? [0.08, 0.18, 0.08] : [0.45, 1, 0.45] }}
                        transition={{ duration: dormindo ? 3.5 : 1.1, repeat: Infinity, delay }}
                        className="w-2 h-2 rounded-full bg-white/70"
                      />
                    ))}
                  </div>
                </motion.div>

                {/* Badge */}
                <motion.div
                  animate={dormindo ? { rotate: 0 } : { rotate: [0, 6, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-1 -right-2 w-6 h-6 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center shadow-md overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/favicon.ico" alt="S" className="w-4 h-4 object-contain" />
                </motion.div>
              </motion.div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* Mão acenando — DEPOIS do robô no DOM (fica por cima)    */}
              {/* Posicionada ao nível do torso, à direita do robô        */}
              {/* ──────────────────────────────────────────────────────── */}
              <AnimatePresence>
                {acenando && (
                  <motion.div
                    key="mao"
                    initial={{ opacity: 0, scale: 0, x: -6 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0, x: -6 }}
                    transition={SPRING_FAST}
                    className="absolute z-20 pointer-events-none"
                    style={{ right: -30, top: 72 }}
                  >
                    <motion.span
                      animate={{ rotate: [-18, 22, -18] }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatType: "mirror",
                      }}
                      style={{
                        display: "inline-block",
                        fontSize: 24,
                        transformOrigin: "50% 100%",
                        lineHeight: 1,
                      }}
                    >
                      👋
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
