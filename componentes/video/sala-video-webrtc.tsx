/**
 * componentes/video/sala-video-webrtc.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Sala de vídeo WebRTC com sinalização via HTTP polling.
 *
 * Fluxo:
 *   1. Lobby      — escolhe criar ou entrar em sala
 *   2. Aguardando — caller aguarda callee; callee aguarda caller enviar offer
 *   3. Conectado  — chamada ativa com controles de mídia
 *   4. Encerrado  — chamada finalizada
 *
 * Notas de implementação:
 *   - Os elementos <video> são SEMPRE renderizados no DOM para que os refs
 *     nunca sejam nulos quando os streams chegam (race condition fix).
 *   - O stream remoto é salvo em remoteStreamRef e aplicado via useEffect.
 *   - O compartilhamento de tela usa replaceTrack() sem renegociação.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Copy, Check, Wifi, WifiOff, Clock,
  Monitor, MonitorOff,
} from "lucide-react"

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  salaId:     string
  salaCodigo: string
  nomeSala:   string
  userName:   string
  ehDono:     boolean  // true = entra direto como caller, sem lobby
}

// ── Tipos internos ─────────────────────────────────────────────────────────

type Estado = "lobby" | "aguardando" | "conectado" | "encerrado"
type Papel  = "caller" | "callee"

// ── Configuração ICE ───────────────────────────────────────────────────────

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302"    },
    { urls: "stun:stun1.l.google.com:19302"   },
    { urls: "stun:stun.cloudflare.com:3478"   },
  ],
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════

export function VideoRoom({ salaId, salaCodigo, nomeSala, userName, ehDono }: Props) {
  const router = useRouter()

  // ── Refs de media/webrtc ────────────────────────────────────────────────
  const localVideoRef   = useRef<HTMLVideoElement>(null)
  const remoteVideoRef  = useRef<HTMLVideoElement>(null)
  const pcRef           = useRef<RTCPeerConnection | null>(null)
  const localStreamRef  = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)

  // ── Refs de controle ────────────────────────────────────────────────────
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const knownIceRef  = useRef({ caller: 0, callee: 0 })
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([])
  const papelRef     = useRef<Papel | null>(null)
  const codigoRef    = useRef("")

  // ── State ────────────────────────────────────────────────────────────────
  const [estado,      setEstado]      = useState<Estado>("lobby")
  const [papel,       setPapel]       = useState<Papel | null>(null)
  const [codigoInput, setCodigoInput] = useState("")
  const [nomeRemoto,  setNomeRemoto]  = useState("")
  const [micLigado,   setMicLigado]   = useState(true)
  const [camLigada,   setCamLigada]   = useState(true)
  const [telaLigada,  setTelaLigada]  = useState(false)
  const [copiado,     setCopiado]     = useState(false)
  const [tempo,       setTempo]       = useState(0)
  const [statusIce,   setStatusIce]   = useState<"conectando" | "conectado" | "desconectado">("conectando")
  const [erro,        setErro]        = useState("")
  const [ocupado,     setOcupado]     = useState(false)

  // ── Sincroniza srcObject sempre que o estado muda ────────────────────────
  // Os <video> são sempre montados, mas o estado pode ter feito scroll na DOM.
  // Este efeito garante que o srcObject é reaplicado após qualquer re-render.
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      const src = screenStreamRef.current ?? localStreamRef.current
      if (localVideoRef.current.srcObject !== src) {
        localVideoRef.current.srcObject = src
      }
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current
      }
    }
  })

  // ── Auto-start na montagem ───────────────────────────────────────────────
  // Dono da sala: inicia direto como caller (sem passar pelo lobby).
  // Convidado com ?join=CODE: pré-preenche o código no lobby.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinParam = params.get("join")

    if (joinParam) {
      // Convidado com link — pré-preenche código, usuário clica Entrar
      setCodigoInput(joinParam.toUpperCase())
    } else if (ehDono) {
      // Dono da sala — inicia direto como caller
      criarSala()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cleanup ao desmontar ─────────────────────────────────────────────────
  useEffect(() => {
    return () => { pararTudo(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ════════════════════════════════════════════════════════════════════════
  // API helper
  // ════════════════════════════════════════════════════════════════════════

  async function api(action: string, room: string, body?: object) {
    const url  = `/api/salas/signal?action=${action}&room=${encodeURIComponent(room)}`
    const opts: RequestInit = body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : { method: "GET" }
    const res = await fetch(url, opts)
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`API ${action} falhou (${res.status}): ${text}`)
    }
    return res.json()
  }

  // ════════════════════════════════════════════════════════════════════════
  // INICIAR CHAMADA
  // ════════════════════════════════════════════════════════════════════════

  async function iniciarChamada(meuPapel: Papel, codigo: string) {
    setErro("")
    setOcupado(true)

    // 1. Captura mídia local
    let stream: MediaStream
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("mediaDevices indisponível", "SecurityError")
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch (e1: unknown) {
        const de = e1 as DOMException
        if (de.name === "NotFoundError" || de.name === "DevicesNotFoundError") {
          // Tenta só áudio se câmera não encontrada
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        } else {
          throw e1
        }
      }
    } catch (err: unknown) {
      const e = err as DOMException
      const msgs: Record<string, string> = {
        NotAllowedError:     "Permissão negada. Permita câmera/microfone nas configurações do navegador.",
        PermissionDeniedError: "Permissão negada. Permita câmera/microfone nas configurações do navegador.",
        NotFoundError:       "Câmera/microfone não encontrado.",
        DevicesNotFoundError:"Câmera/microfone não encontrado.",
        NotReadableError:    "Câmera/microfone em uso por outro app (Zoom, Teams…).",
        TrackStartError:     "Câmera/microfone em uso por outro app (Zoom, Teams…).",
        SecurityError:       "Bloqueado por política de segurança. Acesse via HTTPS.",
      }
      setErro(msgs[e.name] ?? `Erro ao acessar mídia: ${e.message || e.name}`)
      setOcupado(false)
      return
    }

    localStreamRef.current = stream

    // 2. Cria PeerConnection
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc

    stream.getTracks().forEach(t => pc.addTrack(t, stream))

    // 3. Recebe stream remoto — salva no ref ANTES de mudar estado
    pc.ontrack = (e) => {
      remoteStreamRef.current = e.streams[0]
      setEstado("conectado")
      timerRef.current = setInterval(() => setTempo(s => s + 1), 1000)
    }

    // 4. Envia ICE candidates para o servidor
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        try {
          await api("ice", codigo, { role: meuPapel, candidate: e.candidate.toJSON() })
        } catch { /* ignora erros de ICE */ }
      }
    }

    // 5. Monitora estado ICE
    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState
      if (s === "connected" || s === "completed")           setStatusIce("conectado")
      else if (s === "disconnected" || s === "failed")      setStatusIce("desconectado")
    }

    // 6. Guarda papel e código em refs (disponíveis dentro de closures assíncronas)
    papelRef.current  = meuPapel
    codigoRef.current = codigo
    setPapel(meuPapel)

    // 7. Executa fluxo caller ou callee
    if (meuPapel === "caller") {
      await fluxoCaller(pc, codigo)
    } else {
      await fluxoCallee(pc, codigo)
    }

    setOcupado(false)

    // 8. Inicia polling a cada 1500ms
    pollRef.current = setInterval(() => executarPoll(pc, codigo, meuPapel), 1500)
  }

  // ── Caller: cria e envia offer ───────────────────────────────────────────
  async function fluxoCaller(pc: RTCPeerConnection, codigo: string) {
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await api("set", codigo, { offer: { type: offer.type, sdp: offer.sdp }, caller_name: userName })
    setEstado("aguardando")
  }

  // ── Callee: lê offer e envia answer ─────────────────────────────────────
  async function fluxoCallee(pc: RTCPeerConnection, codigo: string) {
    let data: Awaited<ReturnType<typeof api>>
    try {
      data = await api("get", codigo)
    } catch (e: unknown) {
      setErro((e as Error).message)
      pararTudo(false)
      return
    }

    if (!data.offer) {
      setErro("Sala não encontrada ou sem chamada ativa. Peça ao criador para aguardar.")
      pararTudo(false)
      return
    }

    if (data.nomeCaller) setNomeRemoto(data.nomeCaller)

    await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
    await drenarIcePendentes(pc)

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await api("set", codigo, { answer: { type: answer.type, sdp: answer.sdp }, callee_name: userName })
    setEstado("aguardando")
  }

  // ── Drena fila de ICE candidates que chegaram antes do remoteDescription ─
  async function drenarIcePendentes(pc: RTCPeerConnection) {
    const fila = pendingIceRef.current.splice(0)
    for (const c of fila) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch { /* ignora */ }
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // POLLING DE SINALIZAÇÃO
  // ════════════════════════════════════════════════════════════════════════

  async function executarPoll(pc: RTCPeerConnection, codigo: string, meuPapel: Papel) {
    if (!pc || pc.signalingState === "closed") return
    let data: Awaited<ReturnType<typeof api>>
    try {
      data = await api("get", codigo)
    } catch { return }

    // Caller recebe answer do callee
    if (meuPapel === "caller" && data.answer && pc.signalingState === "have-local-offer") {
      if (data.nomeCallee) setNomeRemoto(data.nomeCallee)
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
      await drenarIcePendentes(pc)
    }

    // Processa ICE candidates do peer remoto
    const chave = meuPapel === "caller" ? "ice_callee" : "ice_caller"
    const candidatos: RTCIceCandidateInit[] = data[chave] || []
    const conhecido = meuPapel === "caller" ? knownIceRef.current.callee : knownIceRef.current.caller

    for (let i = conhecido; i < candidatos.length; i++) {
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidatos[i])) } catch { /* ignora */ }
      } else {
        pendingIceRef.current.push(candidatos[i])
      }
    }

    if (meuPapel === "caller") knownIceRef.current.callee = candidatos.length
    else                       knownIceRef.current.caller = candidatos.length
  }

  // ════════════════════════════════════════════════════════════════════════
  // AÇÕES DO USUÁRIO
  // ════════════════════════════════════════════════════════════════════════

  async function criarSala() {
    setErro("")
    try {
      await api("reset", salaCodigo)
    } catch (e: unknown) {
      setErro((e as Error).message)
      return
    }
    await iniciarChamada("caller", salaCodigo)
  }

  async function entrarSala() {
    const codigo = codigoInput.trim().toUpperCase()
    if (!codigo) { setErro("Digite o código da sala."); return }
    await iniciarChamada("callee", codigo)
  }

  async function encerrar() {
    const eraCaller = papelRef.current === "caller"
    const codigo    = codigoRef.current
    pararTudo(false)
    if (eraCaller && codigo) {
      try { await api("reset", codigo) } catch { /* ignora */ }
    }
    setEstado("encerrado")
  }

  // ── Limpeza completa ─────────────────────────────────────────────────────
  function pararTudo(resetar: boolean) {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    pcRef.current?.close()
    pcRef.current = null
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current  = null
    remoteStreamRef.current = null
    knownIceRef.current  = { caller: 0, callee: 0 }
    pendingIceRef.current = []
    setTelaLigada(false)
    if (resetar && papelRef.current === "caller" && codigoRef.current) {
      api("reset", codigoRef.current).catch(() => {})
    }
  }

  // ── Controles de mídia ───────────────────────────────────────────────────
  function alternarMic() {
    if (!localStreamRef.current) return
    const novo = !micLigado
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = novo })
    setMicLigado(novo)
  }

  function alternarCam() {
    if (!localStreamRef.current) return
    const novo = !camLigada
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = novo })
    setCamLigada(novo)
  }

  function voltarParaCam() {
    const camTrack = localStreamRef.current?.getVideoTracks()[0] ?? null
    const sender   = pcRef.current?.getSenders().find(s => s.track?.kind === "video") ?? null
    if (sender && camTrack) sender.replaceTrack(camTrack).catch(() => {})
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    setTelaLigada(false)
  }

  async function alternarTela() {
    if (telaLigada) { voltarParaCam(); return }
    try {
      const tela = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      screenStreamRef.current = tela
      const trackTela = tela.getVideoTracks()[0]
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video") ?? null
      if (sender) await sender.replaceTrack(trackTela)
      trackTela.onended = () => voltarParaCam()
      setTelaLigada(true)
    } catch (e: unknown) {
      if ((e as DOMException).name !== "NotAllowedError") {
        setErro("Não foi possível compartilhar a tela.")
      }
    }
  }

  // ── Copiar ───────────────────────────────────────────────────────────────
  const codigoVisivel = papel === "caller" ? salaCodigo : codigoRef.current || codigoInput

  function copiarCodigo() {
    navigator.clipboard.writeText(codigoVisivel).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function copiarLink() {
    const link = `${window.location.origin}/painel/salas/${salaId}?join=${codigoVisivel}`
    navigator.clipboard.writeText(link).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const formatarTempo = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // Os <video> são SEMPRE renderizados para que os refs nunca sejam nulos.
  // O estado controla o que fica visível em cima dos vídeos.
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">

      {/* ─── Camada de vídeo — sempre presente no DOM ─────────────────── */}
      <div className={estado === "conectado" ? "block" : "hidden"}>
        {/* Vídeo remoto — tela cheia */}
        <div className="fixed inset-0 bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {nomeRemoto && (
            <div className="absolute bottom-24 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className="text-white text-xs font-semibold">{nomeRemoto}</span>
            </div>
          )}
        </div>

        {/* Vídeo local — PiP */}
        <div className="fixed bottom-24 right-4 z-30 w-36 aspect-video rounded-xl overflow-hidden border-2 border-orange-500 shadow-2xl shadow-orange-500/20 bg-slate-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!camLigada && !telaLigada && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <VideoOff size={18} className="text-slate-500" />
            </div>
          )}
          <div className="absolute bottom-1 left-1.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
            {telaLigada && <Monitor size={9} className="text-orange-400" />}
            <span className="text-white text-[9px] font-semibold">{telaLigada ? "Tela" : "Você"}</span>
          </div>
        </div>
      </div>

      {/* Vídeo local visível no estado "aguardando" (sem ser PiP) */}
      {estado === "aguardando" && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[70%] z-0 w-48 aspect-video rounded-2xl overflow-hidden border-2 border-orange-500/40 shadow-xl bg-slate-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <span className="text-white text-[9px] font-semibold">Você</span>
          </div>
        </div>
      )}

      {/* ─── Overlay: LOBBY ──────────────────────────────────────────────── */}
      {estado === "lobby" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Cabeçalho */}
              <div className="bg-slate-800/60 border-b border-slate-800 px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Video size={16} className="text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Sala de Vídeo</p>
                  <h1 className="font-serif font-bold text-white text-sm leading-tight truncate">{nomeSala}</h1>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {erro && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-red-400 text-xs leading-relaxed">{erro}</p>
                  </div>
                )}

                {/* Criar sala */}
                <div>
                  <p className="text-slate-400 text-xs mb-3 font-medium">Iniciar como criador</p>
                  <button
                    onClick={criarSala}
                    disabled={ocupado}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    <Video size={16} />
                    {ocupado ? "Iniciando…" : "Iniciar chamada"}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-slate-600 text-xs font-medium">ou entre em uma existente</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {/* Entrar em sala */}
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-medium">Entrar com código</p>
                  <input
                    type="text"
                    value={codigoInput}
                    onChange={e => setCodigoInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && !ocupado && entrarSala()}
                    placeholder="Ex: ABC123"
                    maxLength={6}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-slate-600 outline-none transition-colors text-center tracking-widest uppercase"
                  />
                  <button
                    onClick={entrarSala}
                    disabled={ocupado}
                    className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-all border border-slate-600"
                  >
                    {ocupado ? "Conectando…" : "Entrar na sala"}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-slate-700 text-[10px] mt-4">
              Código desta sala: <span className="font-mono text-slate-600">{salaCodigo}</span>
            </p>
          </div>
        </div>
      )}

      {/* ─── Overlay: AGUARDANDO ─────────────────────────────────────────── */}
      {estado === "aguardando" && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
          {/* espaço para o vídeo local posicionado acima */}
          <div className="h-32" />

          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-orange-400 text-xs font-semibold">
                {papel === "caller" ? "Aguardando participante…" : "Conectando…"}
              </span>
            </div>

            {/* Código em destaque (só para o caller) */}
            {papel === "caller" && (
              <div className="text-center mb-5">
                <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wider">Código da sala</p>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl py-4 px-6">
                  <span className="font-mono font-black text-4xl text-white tracking-[0.25em]">{salaCodigo}</span>
                </div>
                <p className="text-slate-600 text-xs mt-2">Compartilhe este código com os participantes</p>
              </div>
            )}

            {/* Botões de compartilhar (só para o caller) */}
            {papel === "caller" && (
              <div className="flex gap-2 mb-5">
                <button
                  onClick={copiarCodigo}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-all"
                >
                  {copiado ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copiado ? "Copiado!" : "Copiar código"}
                </button>
                <button
                  onClick={copiarLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-all"
                >
                  <Copy size={13} />
                  Copiar link
                </button>
              </div>
            )}

            <button
              onClick={encerrar}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl text-sm transition-all"
            >
              <PhoneOff size={15} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ─── Overlay: CONECTADO — header + controles ──────────────────────── */}
      {estado === "conectado" && (
        <>
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Video size={14} className="text-orange-400" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-white text-sm leading-none">{nomeSala}</h1>
                {nomeRemoto && <p className="text-[10px] text-slate-400 mt-0.5">{nomeRemoto}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-[10px] font-bold">AO VIVO</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-1">
                <Clock size={11} className="text-slate-400" />
                <span className="text-white text-[10px] font-mono font-semibold">{formatarTempo(tempo)}</span>
              </div>
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-1">
                {statusIce === "conectado"
                  ? <Wifi size={11} className="text-emerald-400" />
                  : statusIce === "desconectado"
                  ? <WifiOff size={11} className="text-red-400" />
                  : <Wifi size={11} className="text-yellow-400 animate-pulse" />}
                <span className={`text-[10px] font-semibold ${
                  statusIce === "conectado" ? "text-emerald-400"
                  : statusIce === "desconectado" ? "text-red-400"
                  : "text-yellow-400"}`}>
                  {statusIce === "conectado" ? "Conectado" : statusIce === "desconectado" ? "Desconectado" : "Conectando"}
                </span>
              </div>
            </div>
          </header>

          {/* Barra de controles */}
          <footer className="fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur border-t border-white/10 px-6 py-4 flex items-center justify-center gap-3">
            {/* Mic */}
            <button
              onClick={alternarMic}
              title={micLigado ? "Mutar microfone" : "Ativar microfone"}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                micLigado
                  ? "bg-slate-800 border-white/10 text-white hover:bg-slate-700"
                  : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
              }`}
            >
              {micLigado ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            {/* Câmera */}
            <button
              onClick={alternarCam}
              title={camLigada ? "Desligar câmera" : "Ligar câmera"}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                camLigada
                  ? "bg-slate-800 border-white/10 text-white hover:bg-slate-700"
                  : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
              }`}
            >
              {camLigada ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            {/* Compartilhar tela */}
            <button
              onClick={alternarTela}
              title={telaLigada ? "Parar compartilhamento" : "Compartilhar tela"}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                telaLigada
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30"
                  : "bg-slate-800 border-white/10 text-white hover:bg-slate-700"
              }`}
            >
              {telaLigada ? <MonitorOff size={18} /> : <Monitor size={18} />}
            </button>

            {/* Encerrar */}
            <button
              onClick={encerrar}
              title="Encerrar chamada"
              className="h-12 px-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-full flex items-center gap-2 transition-all shadow-lg shadow-red-500/25"
            >
              <PhoneOff size={18} />
              <span className="text-sm hidden sm:inline">Encerrar</span>
            </button>

            {/* Copiar código */}
            <button
              onClick={copiarCodigo}
              title="Copiar código da sala"
              className="w-12 h-12 rounded-full flex items-center justify-center border bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 transition-all"
            >
              {copiado ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </footer>
        </>
      )}

      {/* ─── Overlay: ENCERRADO ───────────────────────────────────────────── */}
      {estado === "encerrado" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
              <PhoneOff size={22} className="text-slate-400" />
            </div>
            <h2 className="font-serif font-bold text-white text-lg mb-1">Chamada encerrada</h2>
            {tempo > 0 && (
              <p className="text-slate-500 text-sm mb-4">
                Duração: <span className="font-mono text-slate-400">{formatarTempo(tempo)}</span>
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEstado("lobby"); setTempo(0); setNomeRemoto(""); setPapel(null); setErro("") }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-all"
              >
                Nova chamada
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 rounded-xl text-sm transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
