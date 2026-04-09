/**
 * componentes/video/sala-video-webrtc.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Sala de vídeo WebRTC — baseado na mesma lógica do webtrc.php que funciona.
 *
 * Dois estados:
 *   lobby  — formulário para criar (caller) ou entrar (callee)
 *   sala   — chamada ativa com vídeo local (canto) + remoto (tela cheia)
 *
 * O caller (dono da sala) pula o lobby automaticamente se ehDono=true.
 * O callee valida que o offer existe antes de iniciar, como no PHP.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useEffect, useRef, useState } from "react"

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  salaId:     string
  salaCodigo: string
  nomeSala:   string
  userName:   string
  ehDono:     boolean
}

// ── ICE ───────────────────────────────────────────────────────────────────

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302"  },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
}

// ═════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═════════════════════════════════════════════════════════════════════════

export function VideoRoom({ salaId, salaCodigo, nomeSala, userName, ehDono }: Props) {

  // ── Refs (variáveis globais do PHP) ──────────────────────────────────
  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef          = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pollTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const roomCodeRef    = useRef("")
  const myRoleRef      = useRef<"caller" | "callee" | "">("")
  const knownIceCaller = useRef(0)
  const knownIceCallee = useRef(0)

  // ── State ─────────────────────────────────────────────────────────────
  const [tela,        setTela]        = useState<"lobby" | "sala" | "encerrado">("lobby")
  const [codigoInput, setCodigoInput] = useState("")
  const [nomeRemoto,  setNomeRemoto]  = useState("")
  const [micOn,       setMicOn]       = useState(true)
  const [camOn,       setCamOn]       = useState(true)
  const [remotoConectado, setRemotoConectado] = useState(false)
  const [statusTexto, setStatusTexto] = useState("Aguardando outro participante...")
  const [timerTexto,  setTimerTexto]  = useState("00:00")
  const [erroLobby,   setErroLobby]   = useState("")
  const [erroSala,    setErroSala]    = useState("")
  const [ocupado,     setOcupado]     = useState(false)
  const [copiado,     setCopado]      = useState(false)

  // ── API helper (igual ao PHP) ─────────────────────────────────────────
  async function api(action: string, room: string, body?: object) {
    const url  = `/api/salas/signal?action=${action}&room=${encodeURIComponent(room)}`
    const opts: RequestInit = body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : { method: "GET" }
    const res = await fetch(url, opts)
    if (!res.ok) throw new Error(`Signal API ${action} falhou (${res.status})`)
    return res.json()
  }

  // ── startTimer ────────────────────────────────────────────────────────
  function startTimer() {
    let segundos = 0
    timerRef.current = setInterval(() => {
      segundos++
      const m = String(Math.floor(segundos / 60)).padStart(2, "0")
      const s = String(segundos % 60).padStart(2, "0")
      setTimerTexto(`${m}:${s}`)
    }, 1000)
  }

  // ── CRIAR SALA (caller) — igual ao createRoom() do PHP ───────────────
  async function criarSala() {
    setErroLobby("")
    setOcupado(true)
    const codigo = salaCodigo          // código da sala vem do banco
    roomCodeRef.current = codigo
    myRoleRef.current   = "caller"
    try {
      await api("reset", codigo)
    } catch (e: unknown) {
      setErroLobby((e as Error).message)
      setOcupado(false)
      return
    }
    await startCall()
    setOcupado(false)
  }

  // ── ENTRAR NA SALA (callee) — igual ao joinRoom() do PHP ─────────────
  async function entrarSala() {
    setErroLobby("")
    const codigo = codigoInput.trim().toUpperCase()
    if (!codigo) { setErroLobby("Digite o código da sala."); return }

    setOcupado(true)

    // Valida que o offer existe ANTES de capturar mídia (igual ao PHP)
    let data: Record<string, unknown>
    try {
      data = await api("get", codigo)
    } catch (e: unknown) {
      setErroLobby((e as Error).message)
      setOcupado(false)
      return
    }

    if (!data.offer) {
      setErroLobby("Sala não encontrada ou sem chamada ativa. Peça ao criador para aguardar.")
      setOcupado(false)
      return
    }

    roomCodeRef.current = codigo
    myRoleRef.current   = "callee"
    await startCall()
    setOcupado(false)
  }

  // ── START CALL — igual ao startCall() do PHP ─────────────────────────
  async function startCall() {
    // Mostra a sala imediatamente (como PHP faz: esconde lobby, mostra room)
    setTela("sala")
    setRemotoConectado(false)
    setStatusTexto("Conectando...")
    knownIceCaller.current = 0
    knownIceCallee.current = 0

    // Captura mídia local
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
    } catch (err: unknown) {
      const e = err as DOMException
      const msg =
        e.name === "NotAllowedError" || e.name === "PermissionDeniedError"
          ? "Permissão negada. Permita câmera/microfone no navegador."
          : e.name === "NotFoundError"
          ? "Câmera/microfone não encontrado."
          : e.name === "NotReadableError"
          ? "Câmera/microfone em uso por outro app."
          : `Erro ao acessar mídia: ${e.message}`
      setErroSala(msg)
      setTela("lobby")
      return
    }

    // Cria RTCPeerConnection
    const pc = new RTCPeerConnection(ICE_CONFIG)
    pcRef.current = pc

    // Adiciona tracks locais
    localStreamRef.current!.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!))

    // Recebe stream remoto — igual ao PHP: mostra vídeo direto no ontrack
    pc.ontrack = (e) => {
      if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = e.streams[0]
      }
      setRemotoConectado(true)
      setStatusTexto("Conectado")
      startTimer()
    }

    // Envia ICE candidates
    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        try {
          await api("ice", roomCodeRef.current, {
            role:      myRoleRef.current,
            candidate: e.candidate.toJSON(),
          })
        } catch { /* ignora */ }
      }
    }

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState
      if (s === "connected" || s === "completed")    setStatusTexto("Conectado")
      if (s === "disconnected" || s === "failed")    setStatusTexto("Desconectado")
    }

    // Executa fluxo conforme papel
    if (myRoleRef.current === "caller") {
      await doCaller(pc)
    } else {
      await doCallee(pc)
    }

    // Inicia polling a 1500ms (igual ao PHP)
    pollTimerRef.current = setInterval(() => pollSignaling(pc), 1500)
  }

  // ── doCaller — igual ao PHP ───────────────────────────────────────────
  async function doCaller(pc: RTCPeerConnection) {
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await api("set", roomCodeRef.current, {
      offer:       { type: offer.type, sdp: offer.sdp },
      caller_name: userName,
    })
    setStatusTexto("Aguardando outro participante...")
  }

  // ── doCallee — igual ao PHP ───────────────────────────────────────────
  async function doCallee(pc: RTCPeerConnection) {
    const data = await api("get", roomCodeRef.current)
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
    if (data.caller_name) setNomeRemoto(data.caller_name as string)

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await api("set", roomCodeRef.current, {
      answer:      { type: answer.type, sdp: answer.sdp },
      callee_name: userName,
    })
    setStatusTexto("Conectando...")
  }

  // ── pollSignaling — igual ao PHP ─────────────────────────────────────
  async function pollSignaling(pc: RTCPeerConnection) {
    if (!pc || pc.signalingState === "closed") return
    try {
      const data = await api("get", roomCodeRef.current)

      // Caller recebe answer
      if (myRoleRef.current === "caller" && data.answer && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        if (data.callee_name) setNomeRemoto(data.callee_name as string)
      }

      // ICE candidates do peer remoto
      const chave = myRoleRef.current === "caller" ? "ice_callee" : "ice_caller"
      const candidatos: RTCIceCandidateInit[] = (data[chave] as RTCIceCandidateInit[]) || []
      const conhecido = myRoleRef.current === "caller" ? knownIceCallee.current : knownIceCaller.current

      for (let i = conhecido; i < candidatos.length; i++) {
        if (pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidatos[i])) } catch { /* ignora */ }
        }
      }

      if (myRoleRef.current === "caller") knownIceCallee.current = candidatos.length
      else                                knownIceCaller.current = candidatos.length

    } catch { /* ignora erros de polling */ }
  }

  // ── hangUp — igual ao PHP ─────────────────────────────────────────────
  async function hangUp() {
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null }
    if (timerRef.current)     { clearInterval(timerRef.current);     timerRef.current     = null }
    pcRef.current?.close(); pcRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop()); localStreamRef.current = null
    if (myRoleRef.current === "caller" && roomCodeRef.current) {
      try { await api("reset", roomCodeRef.current) } catch { /* ignora */ }
    }
    setTela("lobby")
    setRemotoConectado(false)
    setTimerTexto("00:00")
    setNomeRemoto("")
    setMicOn(true)
    setCamOn(true)
  }

  // ── Controles de mídia ────────────────────────────────────────────────
  function toggleMic() {
    if (!localStreamRef.current) return
    const novo = !micOn
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = novo })
    setMicOn(novo)
  }

  function toggleCam() {
    if (!localStreamRef.current) return
    const novo = !camOn
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = novo })
    if (localVideoRef.current) localVideoRef.current.style.opacity = novo ? "1" : "0"
    setCamOn(novo)
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(roomCodeRef.current || salaCodigo).catch(() => {})
    setCopado(true)
    setTimeout(() => setCopado(false), 2000)
  }

  // ── Auto-start na montagem ────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const joinParam = params.get("join")

    if (joinParam) {
      setCodigoInput(joinParam.toUpperCase())
    } else if (ehDono) {
      criarSala()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cleanup ao desmontar ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      if (timerRef.current)     clearInterval(timerRef.current)
      pcRef.current?.close()
      localStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif" }} className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0] flex flex-col">

      {/* ──────────────── LOBBY ──────────────── */}
      {tela === "lobby" && (
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-10 w-full max-w-md">

            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-[#FF6B00] rounded-xl flex items-center justify-center shrink-0">
                <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                </svg>
              </div>
              <div>
                <div className="text-lg font-extrabold">{nomeSala}</div>
                <div className="text-[11px] text-[#555] uppercase tracking-wider">Videochamada P2P</div>
              </div>
            </div>

            {/* Iniciar sala (caller) */}
            {ehDono && (
              <>
                <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider mb-2">Iniciar como criador</p>
                <button
                  onClick={criarSala}
                  disabled={ocupado}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:opacity-85 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm mb-4 transition-opacity"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                  </svg>
                  {ocupado ? "Iniciando…" : "Iniciar chamada"}
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[#222]" />
                  <span className="text-[#555] text-xs">ou entre em uma existente</span>
                  <div className="flex-1 h-px bg-[#222]" />
                </div>
              </>
            )}

            {/* Entrar em sala (callee) */}
            <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider mb-2">Entrar com código</p>
            <input
              type="text"
              value={codigoInput}
              onChange={e => setCodigoInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && !ocupado && entrarSala()}
              placeholder="Código da sala (ex: ABC123)"
              maxLength={10}
              className="w-full bg-[#1E1E1E] border border-[#222] focus:border-[#FF6B00] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none transition-colors mb-3 text-center tracking-widest uppercase font-mono"
            />
            <button
              onClick={entrarSala}
              disabled={ocupado}
              className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#333] hover:border-[#555] text-white font-bold py-3.5 rounded-xl text-sm mb-2 transition-colors disabled:opacity-50"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              </svg>
              {ocupado ? "Verificando…" : "Entrar na sala"}
            </button>

            {erroLobby && (
              <p className="text-red-400 text-xs text-center mt-3">{erroLobby}</p>
            )}
            {erroSala && (
              <p className="text-red-400 text-xs text-center mt-3">{erroSala}</p>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── SALA ──────────────── */}
      {tela === "sala" && (
        <div className="flex-1 flex flex-col">

          {/* Header */}
          <div className="h-14 bg-[#141414] border-b border-[#222] flex items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-red-900/30 border border-red-700/40 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[11px] font-bold text-red-400">AO VIVO</span>
              </div>
              <span className="font-bold text-sm">{nomeSala}</span>
              <span className="font-mono text-xs text-[#FF6B00] bg-[#FF6B0015] border border-[#FF6B0030] px-2 py-0.5 rounded-md">
                {roomCodeRef.current}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <span
                className={`w-2 h-2 rounded-full ${
                  statusTexto === "Conectado" ? "bg-green-400" :
                  statusTexto === "Desconectado" ? "bg-red-400" :
                  "bg-yellow-400 animate-pulse"
                }`}
              />
              <span className="text-[#999]">{statusTexto}</span>
              {remotoConectado && (
                <span className="font-bold tabular-nums text-[#F0F0F0] ml-2">{timerTexto}</span>
              )}
            </div>
          </div>

          {/* Área de vídeo */}
          <div className="flex-1 bg-[#0A0A0A] relative overflow-hidden">
            {/* Vídeo remoto — ocupa tudo */}
            <div className="absolute inset-0">
              {!remotoConectado && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-20 h-20 bg-[#333] rounded-full flex items-center justify-center text-3xl font-extrabold text-[#555]">?</div>
                  <p className="text-[#555] text-sm">Aguardando outro participante…</p>
                </div>
              )}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${remotoConectado ? "block" : "hidden"}`}
              />
              {remotoConectado && nomeRemoto && (
                <div className="absolute bottom-24 left-4 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-white text-xs font-semibold">{nomeRemoto}</span>
                </div>
              )}
            </div>

            {/* Self preview — canto inferior direito (igual ao PHP #selfPreview) */}
            <div className="absolute bottom-20 right-4 w-40 h-24 rounded-xl overflow-hidden border-2 border-[#FF6B00] bg-[#111] shadow-2xl z-10">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute bottom-1.5 left-2.5 bg-black/60 rounded-full px-2 py-0.5">
                <span className="text-white text-[10px] font-semibold">Você</span>
              </div>
            </div>
          </div>

          {/* Controles — igual ao PHP .controls */}
          <div className="h-20 bg-[#141414] border-t border-[#222] flex items-center justify-center gap-3">

            {/* Mic */}
            <button
              onClick={toggleMic}
              title={micOn ? "Mutar" : "Ativar mic"}
              className={`w-13 h-13 w-[52px] h-[52px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                micOn ? "bg-[#1E1E1E] border-[#333] text-white hover:bg-[#2A2A2A]"
                      : "bg-[#2A1111] border-[#5A2020] text-red-400"
              }`}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {micOn
                  ? <><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8"/></>
                  : <><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8"/><line x1="1" y1="1" x2="23" y2="23"/></>
                }
              </svg>
              <span className="text-[9px] font-semibold text-[#555]">{micOn ? "Mic" : "Mudo"}</span>
            </button>

            {/* Câmera */}
            <button
              onClick={toggleCam}
              title={camOn ? "Desligar câmera" : "Ligar câmera"}
              className={`w-[52px] h-[52px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                camOn ? "bg-[#1E1E1E] border-[#333] text-white hover:bg-[#2A2A2A]"
                      : "bg-[#2A1111] border-[#5A2020] text-red-400"
              }`}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
              <span className="text-[9px] font-semibold text-[#555]">{camOn ? "Câmera" : "Cam Off"}</span>
            </button>

            {/* Encerrar */}
            <button
              onClick={hangUp}
              className="w-[52px] h-[52px] bg-red-600 rounded-xl flex flex-col items-center justify-center gap-1 hover:opacity-85 transition-opacity"
            >
              <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.19 19.79 19.79 0 01.36 10.55 2 2 0 012 8.38V5.5a2 2 0 011.72-2 12.84 12.84 0 002.81-.7 2 2 0 012.11.45l1.27 1.27a16 16 0 012.6 3.41M1 1l22 22" strokeLinecap="round"/>
              </svg>
              <span className="text-[9px] font-semibold text-white">Encerrar</span>
            </button>

            {/* Copiar código */}
            <button
              onClick={copiarCodigo}
              title="Copiar código"
              className="w-[52px] h-[52px] bg-[#1E1E1E] border border-[#333] rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-[#2A2A2A] transition-all"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              <span className="text-[9px] font-semibold text-[#555]">{copiado ? "Copiado!" : "Código"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
