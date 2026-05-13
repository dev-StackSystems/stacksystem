/**
 * componentes/video/sala-video-webrtc.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Sala de vídeo WebRTC via Socket.io — topologia mesh P2P.
 *
 * Fluxo de conexão:
 *   1. Captura mídia local (câmera + microfone)
 *   2. Conecta ao Socket.io (mesma origem, autenticação via cookie NextAuth)
 *   3. Emite "entrar-sala" → servidor responde "membros-sala" (quem já está)
 *   4. Cria RTCPeerConnection + offer para cada membro existente
 *   5. Novos participantes que chegam disparam "usuario-entrou" → mesma lógica
 *   6. Quem recebe offer cria answer; ICE candidates trafegam via socket
 *   7. Conexão P2P estabelecida, vídeo aparece no grid
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  salaId:     string
  salaCodigo: string
  nomeSala:   string
  userName:   string
}

// ── ICE config: STUN público + TURN OpenRelay ────────────────────────────

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302"  },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username:   "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
}

// ── VideoTile ─────────────────────────────────────────────────────────────
// Componente independente com ref própria para evitar re-renders do grid.

interface VideoTileProps {
  stream:  MediaStream | null
  nome:    string
  muted?:  boolean
  local?:  boolean
  grande?: boolean
}

function VideoTile({ stream, nome, muted = false, local = false, grande = false }: VideoTileProps) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream ?? null
  }, [stream])

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#161616] border border-[#252525] ${
        grande ? "aspect-video" : "aspect-video"
      }`}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${local ? "scale-x-[-1]" : ""} ${
          !stream ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Avatar quando sem stream */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#2A2A2A] flex items-center justify-center">
            <span className="text-2xl font-bold text-[#555]">
              {nome?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        </div>
      )}

      {/* Etiqueta de nome */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-0.5">
        <span className="text-white text-xs font-semibold">
          {local ? `${nome} (você)` : nome}
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

interface ParticipanteInfo {
  nome:   string
  stream: MediaStream | null
}

export function VideoRoom({ salaId, salaCodigo, nomeSala, userName }: Props) {

  // ── Refs estáveis ─────────────────────────────────────────────────────
  const localStreamRef = useRef<MediaStream | null>(null)
  const socketRef      = useRef<Socket | null>(null)
  const pcsRef         = useRef(new Map<string, RTCPeerConnection>())
  const pendingIceRef  = useRef(new Map<string, RTCIceCandidateInit[]>())
  const peerNamesRef   = useRef(new Map<string, string>())

  // ── State ─────────────────────────────────────────────────────────────
  const [localStream,    setLocalStream]    = useState<MediaStream | null>(null)
  const [participantes,  setParticipantes]  = useState(new Map<string, ParticipanteInfo>())
  const [micOn,          setMicOn]          = useState(true)
  const [camOn,          setCamOn]          = useState(true)
  const [copiado,        setCopiado]        = useState(false)
  const [erro,           setErro]           = useState("")
  const [carregando,     setCarregando]     = useState(true)
  const [logs,           setLogs]           = useState<string[]>([])
  const [mostrarDebug,   setMostrarDebug]   = useState(false)

  // ── Log ───────────────────────────────────────────────────────────────
  const log = useCallback((msg: string) => {
    const ts = new Date().toTimeString().slice(0, 8)
    setLogs(prev => [`[${ts}] ${msg}`, ...prev].slice(0, 80))
    console.log(`[WebRTC] ${msg}`)
  }, [])

  // ── Helpers de participantes ───────────────────────────────────────────
  const atualizarParticipante = useCallback((id: string, data: Partial<ParticipanteInfo>) => {
    setParticipantes(prev => {
      const next = new Map(prev)
      const atual = next.get(id) ?? { nome: peerNamesRef.current.get(id) ?? "Participante", stream: null }
      next.set(id, { ...atual, ...data })
      return next
    })
  }, [])

  const removerParticipante = useCallback((id: string) => {
    pcsRef.current.get(id)?.close()
    pcsRef.current.delete(id)
    pendingIceRef.current.delete(id)
    peerNamesRef.current.delete(id)
    setParticipantes(prev => { const next = new Map(prev); next.delete(id); return next })
  }, [])

  // ── Cria RTCPeerConnection para um peer ───────────────────────────────
  const criarPC = useCallback((peerId: string) => {
    // Fecha conexão anterior se existir
    pcsRef.current.get(peerId)?.close()

    const pc = new RTCPeerConnection(ICE_CONFIG)
    pcsRef.current.set(peerId, pc)

    // Adiciona tracks locais à nova conexão
    localStreamRef.current?.getTracks().forEach(t => {
      pc.addTrack(t, localStreamRef.current!)
    })

    // Envia ICE candidates via socket
    pc.onicecandidate = (ev) => {
      if (ev.candidate && socketRef.current?.connected) {
        socketRef.current.emit("candidato-ice", {
          idSala:    salaId,
          candidato: ev.candidate.toJSON(),
          para:      peerId,
        })
      }
    }

    // Recebe stream remoto → atualiza grid
    pc.ontrack = (ev) => {
      const peerNome = peerNamesRef.current.get(peerId) ?? "Participante"
      log(`Track recebido de ${peerNome}`)
      atualizarParticipante(peerId, { stream: ev.streams[0] ?? null })
    }

    // Monitora estado da conexão
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      const nome  = peerNamesRef.current.get(peerId) ?? peerId
      log(`${nome}: ${state}`)
      if (state === "failed") {
        log(`Conexão com ${nome} falhou — removendo`)
        removerParticipante(peerId)
      }
    }

    return pc
  }, [salaId, log, atualizarParticipante, removerParticipante])

  // ── Processa ICE candidates enfileirados (chegaram antes do remoteDesc) ─
  const processarPendingIce = useCallback(async (peerId: string) => {
    const pending = pendingIceRef.current.get(peerId)
    if (!pending?.length) return
    const pc = pcsRef.current.get(peerId)
    if (!pc?.remoteDescription) return

    for (const c of pending) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch { /* ignora */ }
    }
    pendingIceRef.current.delete(peerId)
    log(`${pending.length} ICE pendente(s) processado(s) para ${peerNamesRef.current.get(peerId) ?? peerId}`)
  }, [log])

  // ── Encerrar chamada ──────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    socketRef.current?.emit("sair-sala", salaId)
    socketRef.current?.disconnect()
    socketRef.current = null

    pcsRef.current.forEach(pc => pc.close())
    pcsRef.current.clear()
    pendingIceRef.current.clear()
    peerNamesRef.current.clear()

    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null

    setLocalStream(null)
    setParticipantes(new Map())
    log("Chamada encerrada")

    window.history.back()
  }, [salaId, log])

  // ── Controles de mídia ────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return
    const novo = !micOn
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = novo })
    setMicOn(novo)
  }, [micOn])

  const toggleCam = useCallback(() => {
    if (!localStreamRef.current) return
    const novo = !camOn
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = novo })
    setCamOn(novo)
  }, [camOn])

  const copiarLink = useCallback(() => {
    const url = `${window.location.origin}/painel/salas/${salaId}`
    navigator.clipboard.writeText(url).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }, [salaId])

  // ── Efeito principal: mídia + socket ──────────────────────────────────
  useEffect(() => {
    let mounted = true

    const init = async () => {
      // 1. Captura mídia local
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch (err) {
        if (!mounted) return
        const e = err as DOMException
        setErro(
          e.name === "NotAllowedError" || e.name === "PermissionDeniedError"
            ? "Permissão negada. Permita câmera e microfone no navegador e recarregue."
            : e.name === "NotFoundError"
            ? "Câmera ou microfone não encontrado neste dispositivo."
            : e.name === "NotReadableError"
            ? "Câmera ou microfone já está em uso por outro aplicativo."
            : `Erro ao acessar mídia: ${(err as Error).message}`
        )
        setCarregando(false)
        return
      }

      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
      localStreamRef.current = stream
      setLocalStream(stream)
      log("Mídia local capturada")

      // 2. Conecta ao Socket.io (mesma origem — cookie NextAuth enviado automaticamente)
      const socket = io({ transports: ["websocket", "polling"] })
      socketRef.current = socket

      socket.on("connect", () => {
        if (!mounted) return
        log(`Socket conectado: ${socket.id}`)
        socket.emit("entrar-sala", { idSala: salaId, nomeUsuario: userName })
        setCarregando(false)
      })

      socket.on("connect_error", (err) => {
        if (!mounted) return
        log(`Erro socket: ${err.message}`)
        setErro("Não foi possível conectar ao servidor de sinalização. Verifique sua conexão.")
        setCarregando(false)
      })

      // ── Membros que já estavam na sala quando entrei ──────────────────
      // Para cada um: crio PC e envio offer (eu sou o iniciador dessas conexões)
      socket.on("membros-sala", async (membros: { id: string; nome: string }[]) => {
        if (!mounted) return
        log(`${membros.length} membro(s) já na sala`)

        for (const m of membros) {
          peerNamesRef.current.set(m.id, m.nome)
          atualizarParticipante(m.id, { nome: m.nome, stream: null })

          const pc = criarPC(m.id)
          try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socket.emit("oferta", {
              idSala: salaId,
              oferta: { type: offer.type, sdp: offer.sdp },
              para:   m.id,
            })
            log(`Offer → ${m.nome}`)
          } catch (e) {
            log(`Erro criando offer para ${m.nome}: ${e}`)
          }
        }
      })

      // ── Novo participante chegou ──────────────────────────────────────
      // Mesmo fluxo: crio PC e envio offer para ele
      socket.on("usuario-entrou", async ({ id, nome }: { id: string; nome: string }) => {
        if (!mounted) return
        log(`Novo participante: ${nome}`)
        peerNamesRef.current.set(id, nome)
        atualizarParticipante(id, { nome, stream: null })

        const pc = criarPC(id)
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socket.emit("oferta", {
            idSala: salaId,
            oferta: { type: offer.type, sdp: offer.sdp },
            para:   id,
          })
          log(`Offer → ${nome}`)
        } catch (e) {
          log(`Erro criando offer para ${nome}: ${e}`)
        }
      })

      // ── Recebi offer de outro participante ────────────────────────────
      // Crio PC, defino remote description, crio answer, envio de volta
      socket.on("oferta", async ({ oferta, de }: { oferta: RTCSessionDescriptionInit; de: string }) => {
        if (!mounted) return
        const nome = peerNamesRef.current.get(de) ?? "Participante"
        log(`Offer recebido de ${nome}`)

        // Garante que o peer está registrado
        if (!peerNamesRef.current.has(de)) {
          peerNamesRef.current.set(de, nome)
          atualizarParticipante(de, { nome, stream: null })
        }

        const pc = criarPC(de)
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(oferta))
          await processarPendingIce(de)

          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.emit("resposta", {
            idSala:  salaId,
            resposta: { type: answer.type, sdp: answer.sdp },
            para:    de,
          })
          log(`Answer → ${nome}`)
        } catch (e) {
          log(`Erro processando offer de ${nome}: ${e}`)
        }
      })

      // ── Recebi answer para meu offer ──────────────────────────────────
      socket.on("resposta", async ({ resposta, de }: { resposta: RTCSessionDescriptionInit; de: string }) => {
        if (!mounted) return
        const pc = pcsRef.current.get(de)
        if (!pc) return
        const nome = peerNamesRef.current.get(de) ?? de
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(resposta))
          log(`Answer de ${nome} processado`)
          await processarPendingIce(de)
        } catch (e) {
          log(`Erro processando answer de ${nome}: ${e}`)
        }
      })

      // ── ICE candidate de outro participante ───────────────────────────
      socket.on("candidato-ice", async ({ candidato, de }: { candidato: RTCIceCandidateInit; de: string }) => {
        if (!mounted) return
        const pc = pcsRef.current.get(de)
        if (!pc) return

        if (pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidato)) } catch { /* ignora */ }
        } else {
          // Enfileira — processa quando remote description chegar
          const fila = pendingIceRef.current.get(de) ?? []
          pendingIceRef.current.set(de, [...fila, candidato])
        }
      })

      // ── Participante saiu ─────────────────────────────────────────────
      socket.on("usuario-saiu", (id: string) => {
        if (!mounted) return
        const nome = peerNamesRef.current.get(id) ?? id
        log(`${nome} saiu da sala`)
        removerParticipante(id)
      })
    }

    init()

    return () => {
      mounted = false
      socketRef.current?.emit("sair-sala", salaId)
      socketRef.current?.disconnect()
      pcsRef.current.forEach(pc => pc.close())
      pcsRef.current.clear()
      localStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId, userName])

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  // ── Loading ───────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#999] text-sm">Iniciando câmera e microfone…</p>
          <p className="text-[#444] text-xs mt-1">Aguarde a solicitação de permissão do navegador</p>
        </div>
      </div>
    )
  }

  // ── Erro de mídia / conexão ───────────────────────────────────────────
  if (erro) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="bg-[#141414] border border-red-900/40 rounded-2xl p-8 max-w-md text-center">
          <div className="w-14 h-14 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Não foi possível iniciar</h2>
          <p className="text-[#999] text-sm mb-6">{erro}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-[#1E1E1E] border border-[#333] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#2A2A2A] transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // ── Grid de vídeos ────────────────────────────────────────────────────
  const numTiles   = 1 + participantes.size
  const gridClass  = numTiles <= 1 ? "grid-cols-1 max-w-2xl mx-auto w-full"
                   : numTiles === 2 ? "grid-cols-1 sm:grid-cols-2"
                   : numTiles <= 4  ? "grid-cols-2"
                   : "grid-cols-2 lg:grid-cols-3"

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ──────── Header ──────── */}
      <div className="h-14 bg-[#141414] border-b border-[#222] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-900/30 border border-red-700/40 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-bold text-red-400">AO VIVO</span>
          </div>
          <span className="font-bold text-sm">{nomeSala}</span>
          <span className="font-mono text-xs text-[#FF6B00] bg-[#FF6B0015] border border-[#FF6B0030] px-2 py-0.5 rounded-md hidden sm:inline">
            {salaCodigo}
          </span>
          <span className="text-[#555] text-xs">
            {participantes.size === 0
              ? "Aguardando outros participantes…"
              : `${numTiles} na sala`}
          </span>
        </div>
        <button
          onClick={() => setMostrarDebug(d => !d)}
          className="text-[10px] text-[#444] hover:text-[#888] transition-colors"
          title="Diagnóstico"
        >
          {mostrarDebug ? "▲ log" : "▼ log"}
        </button>
      </div>

      {/* ──────── Painel de debug ──────── */}
      {mostrarDebug && (
        <div className="bg-[#0D0D0D] border-b border-[#1A1A1A] px-4 py-2 h-28 overflow-y-auto shrink-0">
          {logs.length === 0
            ? <p className="text-[#333] text-[10px] font-mono">Aguardando eventos...</p>
            : logs.map((l, i) => (
                <p key={i} className="text-[#4A9] text-[10px] font-mono leading-relaxed">{l}</p>
              ))
          }
        </div>
      )}

      {/* ──────── Grid de vídeos ──────── */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className={`grid ${gridClass} gap-3`}>

          {/* Vídeo local */}
          <VideoTile
            stream={localStream}
            nome={userName}
            muted
            local
          />

          {/* Vídeos remotos */}
          {Array.from(participantes.entries()).map(([id, info]) => (
            <VideoTile
              key={id}
              stream={info.stream}
              nome={info.nome}
            />
          ))}
        </div>

        {/* Dica quando sozinho */}
        {participantes.size === 0 && (
          <div className="mt-6 text-center">
            <p className="text-[#333] text-xs">
              Compartilhe o link para convidar outros participantes
            </p>
          </div>
        )}
      </div>

      {/* ──────── Controles ──────── */}
      <div className="h-20 bg-[#141414] border-t border-[#222] flex items-center justify-center gap-3 shrink-0">

        {/* Microfone */}
        <button
          onClick={toggleMic}
          title={micOn ? "Mutar microfone" : "Ativar microfone"}
          className={`w-[52px] h-[52px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
            micOn
              ? "bg-[#1E1E1E] border-[#333] text-white hover:bg-[#2A2A2A]"
              : "bg-[#2A1111] border-[#5A2020] text-red-400"
          }`}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {micOn ? (
              <>
                <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/>
                <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8"/>
              </>
            ) : (
              <>
                <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/>
                <path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </>
            )}
          </svg>
          <span className="text-[9px] font-semibold text-[#555]">{micOn ? "Mic" : "Mudo"}</span>
        </button>

        {/* Câmera */}
        <button
          onClick={toggleCam}
          title={camOn ? "Desligar câmera" : "Ligar câmera"}
          className={`w-[52px] h-[52px] rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
            camOn
              ? "bg-[#1E1E1E] border-[#333] text-white hover:bg-[#2A2A2A]"
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
          title="Encerrar chamada"
          className="w-[52px] h-[52px] bg-red-600 rounded-xl flex flex-col items-center justify-center gap-1 hover:opacity-85 transition-opacity"
        >
          <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.43 9.19 19.79 19.79 0 01.36 10.55 2 2 0 012 8.38V5.5a2 2 0 011.72-2 12.84 12.84 0 002.81-.7 2 2 0 012.11.45l1.27 1.27a16 16 0 012.6 3.41M1 1l22 22"
            />
          </svg>
          <span className="text-[9px] font-semibold text-white">Encerrar</span>
        </button>

        {/* Convidar (copiar link) */}
        <button
          onClick={copiarLink}
          title="Copiar link de convite"
          className="w-[52px] h-[52px] bg-[#1E1E1E] border border-[#333] rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-[#2A2A2A] transition-all"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {copiado ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5"/>
            ) : (
              <>
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </>
            )}
          </svg>
          <span className="text-[9px] font-semibold text-[#555]">
            {copiado ? "Copiado!" : "Convidar"}
          </span>
        </button>
      </div>
    </div>
  )
}
