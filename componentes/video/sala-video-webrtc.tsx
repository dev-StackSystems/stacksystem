"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react"

interface Props {
  salaId: string
  salaCodigo: string
  nomeSala: string
  userName: string
}

type CallState = "lobby" | "waiting" | "connected" | "ended"

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
}

export function VideoRoom({ salaId, salaCodigo, nomeSala, userName }: Props) {
  const router = useRouter()

  // ── Refs ────────────────────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const knownIceRef = useRef({ caller: 0, callee: 0 })
  // Fila de ICE candidates recebidos antes do remoteDescription estar pronto
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([])

  // ── State ────────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState<CallState>("lobby")
  const [role, setRole] = useState<"caller" | "callee" | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [activeCode, setActiveCode] = useState("")
  const [remoteName, setRemoteName] = useState("")
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [copied, setCopied] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [status, setStatus] = useState("Aguardando...")
  const [iceState, setIceState] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [error, setError] = useState("")

  // ── API helper ───────────────────────────────────────────────────────────
  async function api(action: string, room: string, body?: object) {
    const url = `/api/salas/signal?action=${action}&room=${encodeURIComponent(room)}`
    const opts: RequestInit = body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { method: "GET" }
    const res = await fetch(url, opts)
    return res.json()
  }

  // ── startCall ────────────────────────────────────────────────────────────
  async function startCall(myRole: "caller" | "callee", code: string) {
    setError("")
    setRole(myRole)
    setActiveCode(code)

    // Captura mídia
    let stream: MediaStream
    try {
      // Verifica se o contexto é seguro (HTTPS ou localhost)
      if (!navigator.mediaDevices) {
        setError(
          "Acesso à câmera/microfone bloqueado. " +
          "O sistema precisa ser acessado via HTTPS ou localhost."
        )
        setCallState("lobby")
        return
      }

      // Tenta câmera + microfone
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch (videoErr: unknown) {
        const e = videoErr as DOMException
        // Se falhou apenas a câmera, tenta só o microfone
        if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          } catch {
            throw videoErr
          }
        } else {
          throw videoErr
        }
      }

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (err: unknown) {
      const e = err as DOMException
      let msg: string

      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        msg =
          "Permissão negada pelo navegador. Clique no ícone de cadeado/câmera na barra de endereço, " +
          "permita acesso à câmera e microfone e recarregue a página."
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        msg =
          "Câmera ou microfone não encontrado. Verifique se os dispositivos estão conectados."
      } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
        msg =
          "Câmera ou microfone está sendo usado por outro aplicativo. " +
          "Feche outros programas (Zoom, Teams, etc.) e tente novamente."
      } else if (e.name === "OverconstrainedError") {
        msg = "Configuração de câmera não suportada pelo dispositivo. Tente outro navegador."
      } else if (e.name === "SecurityError") {
        msg =
          "Bloqueado por política de segurança. A página precisa ser acessada via HTTPS."
      } else if (e.name === "AbortError") {
        msg = "Acesso interrompido pelo sistema. Tente novamente."
      } else {
        msg = `Erro ao acessar câmera/microfone: ${e.message || e.name || "desconhecido"}`
      }

      setError(msg)
      setCallState("lobby")
      return
    }

    // Cria RTCPeerConnection
    const pc = new RTCPeerConnection(ICE_CONFIG)
    pcRef.current = pc

    stream.getTracks().forEach((track) => pc.addTrack(track, stream))

    // Recebe stream remoto
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0]
      }
      setCallState("connected")
      setStatus("Conectado")
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    }

    // Envia ICE candidates
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await api("ice", code, { role: myRole, candidate: e.candidate.toJSON() })
      }
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      if (state === "connected" || state === "completed") setIceState("connected")
      else if (state === "disconnected" || state === "failed") setIceState("disconnected")
    }

    if (myRole === "caller") {
      await doCaller(pc, code)
    } else {
      await doCallee(pc, code)
    }

    // Inicia polling a cada 1500ms
    pollTimerRef.current = setInterval(() => pollSignaling(pc, code, myRole), 1500)
  }

  // ── Caller: cria offer ───────────────────────────────────────────────────
  async function doCaller(pc: RTCPeerConnection, code: string) {
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await api("set", code, {
      offer: { type: offer.type, sdp: offer.sdp },
      caller_name: userName,
    })
    setCallState("waiting")
    setStatus("Aguardando outro participante...")
  }

  // ── Drena fila de ICE candidates pendentes ───────────────────────────────
  async function drainPendingIce(pc: RTCPeerConnection) {
    const pending = pendingIceRef.current.splice(0)
    for (const c of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c))
      } catch {
        // ignora candidato inválido
      }
    }
  }

  // ── Callee: lê offer, cria answer ────────────────────────────────────────
  async function doCallee(pc: RTCPeerConnection, code: string) {
    const data = await api("get", code)
    if (!data.offer) {
      setError("Sala não encontrada ou sem oferta ativa. Peça ao criador para aguardar.")
      stopAll(false)
      return
    }
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
    if (data.caller_name) setRemoteName(data.caller_name)
    // Drena candidatos que chegaram antes do remoteDescription
    await drainPendingIce(pc)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await api("set", code, {
      answer: { type: answer.type, sdp: answer.sdp },
      callee_name: userName,
    })
    setCallState("waiting")
    setStatus("Conectando...")
  }

  // ── Polling de sinalização ───────────────────────────────────────────────
  async function pollSignaling(
    pc: RTCPeerConnection,
    code: string,
    myRole: "caller" | "callee"
  ) {
    if (!pc || pc.signalingState === "closed") return
    try {
      const data = await api("get", code)

      // Caller: recebe answer quando callee responder
      if (myRole === "caller" && data.answer && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        if (data.callee_name) setRemoteName(data.callee_name)
        setStatus("Conectando...")
        // Drena candidatos que chegaram antes do remoteDescription
        await drainPendingIce(pc)
      }

      // Processa ICE candidates do peer remoto
      const remoteKey = myRole === "caller" ? "ice_callee" : "ice_caller"
      const remoteCandidates: RTCIceCandidateInit[] = data[remoteKey] || []
      const known =
        myRole === "caller" ? knownIceRef.current.callee : knownIceRef.current.caller

      for (let i = known; i < remoteCandidates.length; i++) {
        const candidate = remoteCandidates[i]
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch {
            // ignora candidato inválido
          }
        } else {
          // Enfileira para quando o remoteDescription estiver pronto
          pendingIceRef.current.push(candidate)
        }
      }

      if (myRole === "caller") knownIceRef.current.callee = remoteCandidates.length
      else knownIceRef.current.caller = remoteCandidates.length
    } catch {
      // ignora erros transitórios de polling
    }
  }

  // ── Criar sala (como caller) ─────────────────────────────────────────────
  async function createRoom() {
    setError("")
    await api("reset", salaCodigo)
    await startCall("caller", salaCodigo)
  }

  // ── Entrar em sala (como callee) ─────────────────────────────────────────
  async function joinRoom() {
    const code = joinCode.trim().toUpperCase()
    if (!code) {
      setError("Digite o código da sala.")
      return
    }
    await startCall("callee", code)
  }

  // ── Limpeza interna ──────────────────────────────────────────────────────
  function stopAll(doReset: boolean) {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (doReset && activeCode && role === "caller") {
      api("reset", activeCode).catch(() => {})
    }
    knownIceRef.current = { caller: 0, callee: 0 }
    pendingIceRef.current = []
  }

  async function hangUp() {
    const wasRole = role
    const wasCode = activeCode
    stopAll(false)
    if (wasRole === "caller" && wasCode) {
      await api("reset", wasCode)
    }
    setCallState("ended")
    setElapsed(0)
  }

  // ── Controles de mídia ───────────────────────────────────────────────────
  function toggleMic() {
    if (!localStreamRef.current) return
    const newVal = !micOn
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = newVal
    })
    setMicOn(newVal)
  }

  function toggleCam() {
    if (!localStreamRef.current) return
    const newVal = !camOn
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = newVal
    })
    setCamOn(newVal)
  }

  // ── Copy helpers ─────────────────────────────────────────────────────────
  function getActiveCode() {
    return role === "caller" ? salaCodigo : activeCode
  }

  function copyCode() {
    navigator.clipboard.writeText(getActiveCode()).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    const link = `${window.location.origin}/painel/salas/${salaId}?join=${getActiveCode()}`
    navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  // ── Cleanup ao desmontar ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAll(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-join via ?join=CODE ──────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinParam = params.get("join")
    if (joinParam) setJoinCode(joinParam.toUpperCase())
  }, [])

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  // ── LOBBY ────────────────────────────────────────────────────────────────
  if (callState === "lobby") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-800/60 border-b border-slate-800 px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                <Video size={16} className="text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Sala de Vídeo
                </p>
                <h1 className="font-serif font-bold text-white text-sm leading-tight truncate">
                  {nomeSala}
                </h1>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Erro */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-400 text-xs leading-relaxed">{error}</p>
                </div>
              )}

              {/* Criar sala */}
              <div>
                <p className="text-slate-400 text-xs mb-3 font-medium">Iniciar como criador</p>
                <button
                  onClick={createRoom}
                  className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  <Video size={16} />
                  Iniciar chamada
                </button>
              </div>

              {/* Divider */}
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
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                  placeholder="Ex: ABC123"
                  maxLength={6}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-slate-600 outline-none transition-colors text-center tracking-widest uppercase"
                />
                <button
                  onClick={joinRoom}
                  className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-bold py-3 rounded-xl text-sm transition-all border border-slate-600 hover:border-slate-500"
                >
                  Entrar na sala
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-slate-700 text-[10px] mt-4">
            Código da sala: <span className="font-mono text-slate-600">{salaCodigo}</span>
          </p>
        </div>
      </div>
    )
  }

  // ── WAITING (caller aguardando) ───────────────────────────────────────────
  if (callState === "waiting") {
    const displayCode = role === "caller" ? salaCodigo : activeCode
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 gap-6">
        {/* Vídeo local pequeno */}
        <div className="relative w-48 aspect-video rounded-2xl overflow-hidden border-2 border-orange-500/40 shadow-xl bg-slate-900">
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

        {/* Card de aguardo */}
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {/* Status */}
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-orange-400 text-xs font-semibold">{status}</span>
          </div>

          {/* Código em destaque */}
          <div className="text-center mb-5">
            <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wider">
              Código da sala
            </p>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl py-4 px-6">
              <span className="font-mono font-black text-4xl text-white tracking-[0.25em]">
                {displayCode}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-2">
              Compartilhe este código com os participantes
            </p>
          </div>

          {/* Botões de compartilhamento */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={copyCode}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-all"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Copiado!" : "Copiar código"}
            </button>
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-all"
            >
              <Copy size={13} />
              Copiar link
            </button>
          </div>

          {/* Encerrar */}
          <button
            onClick={hangUp}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl text-sm transition-all"
          >
            <PhoneOff size={15} />
            Encerrar
          </button>
        </div>
      </div>
    )
  }

  // ── CONNECTED ─────────────────────────────────────────────────────────────
  if (callState === "connected") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Video size={14} className="text-orange-400" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-white text-sm leading-none">{nomeSala}</h1>
              {remoteName && (
                <p className="text-[10px] text-slate-400 mt-0.5">{remoteName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Badge AO VIVO */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-[10px] font-bold">AO VIVO</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-1">
              <Clock size={11} className="text-slate-400" />
              <span className="text-white text-[10px] font-mono font-semibold">
                {formatTime(elapsed)}
              </span>
            </div>

            {/* ICE state */}
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur border border-white/10 rounded-full px-2.5 py-1">
              {iceState === "connected" ? (
                <Wifi size={11} className="text-emerald-400" />
              ) : iceState === "disconnected" ? (
                <WifiOff size={11} className="text-red-400" />
              ) : (
                <Wifi size={11} className="text-yellow-400 animate-pulse" />
              )}
              <span
                className={`text-[10px] font-semibold ${
                  iceState === "connected"
                    ? "text-emerald-400"
                    : iceState === "disconnected"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {iceState === "connected"
                  ? "Conectado"
                  : iceState === "disconnected"
                  ? "Desconectado"
                  : "Conectando"}
              </span>
            </div>
          </div>
        </header>

        {/* Vídeo remoto — ocupa tudo */}
        <div className="flex-1 relative bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Label remoto */}
          {remoteName && (
            <div className="absolute bottom-24 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className="text-white text-xs font-semibold">{remoteName}</span>
            </div>
          )}
        </div>

        {/* Vídeo local — picture-in-picture */}
        <div className="absolute bottom-24 right-4 z-30 w-36 aspect-video rounded-xl overflow-hidden border-2 border-orange-500 shadow-2xl shadow-orange-500/20 bg-slate-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <VideoOff size={18} className="text-slate-500" />
            </div>
          )}
          <div className="absolute bottom-1 left-1.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <span className="text-white text-[9px] font-semibold">Você</span>
          </div>
        </div>

        {/* Barra de controles */}
        <footer className="absolute bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur border-t border-white/10 px-6 py-4 flex items-center justify-center gap-3">
          {/* Mic */}
          <button
            onClick={toggleMic}
            title={micOn ? "Mutar microfone" : "Ativar microfone"}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
              micOn
                ? "bg-slate-800 border-white/10 text-white hover:bg-slate-700"
                : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
            }`}
          >
            {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Cam */}
          <button
            onClick={toggleCam}
            title={camOn ? "Desligar câmera" : "Ligar câmera"}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
              camOn
                ? "bg-slate-800 border-white/10 text-white hover:bg-slate-700"
                : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
            }`}
          >
            {camOn ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          {/* Encerrar */}
          <button
            onClick={hangUp}
            title="Encerrar chamada"
            className="h-12 px-6 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-full flex items-center gap-2 transition-all shadow-lg shadow-red-500/25"
          >
            <PhoneOff size={18} />
            <span className="text-sm hidden sm:inline">Encerrar</span>
          </button>

          {/* Copiar código */}
          <button
            onClick={copyCode}
            title="Copiar código da sala"
            className="w-12 h-12 rounded-full flex items-center justify-center border bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 transition-all"
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
        </footer>
      </div>
    )
  }

  // ── ENDED ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
          <PhoneOff size={22} className="text-slate-400" />
        </div>
        <h2 className="font-serif font-bold text-white text-lg mb-1">Chamada encerrada</h2>
        {elapsed > 0 && (
          <p className="text-slate-500 text-sm mb-4">
            Duração: <span className="font-mono text-slate-400">{formatTime(elapsed)}</span>
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setCallState("lobby")}
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
  )
}
