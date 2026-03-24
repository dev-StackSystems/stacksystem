"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Copy, Check, Wifi, WifiOff } from "lucide-react"

interface Props {
  salaId: string
  salaCodigo: string
  nome: string
  userName: string
}

interface RemoteVideo {
  peerId: string
  stream: MediaStream
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
]

export function VideoRoom({ salaId, salaCodigo, nome, userName }: Props) {
  const router = useRouter()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())

  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [connected, setConnected] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  // Assign stream to video element when ref or stream changes
  const assignRemoteRef = useCallback((peerId: string, el: HTMLVideoElement | null) => {
    if (!el) return
    remoteVideoRefs.current.set(peerId, el)
    const stream = remoteStreams.get(peerId)
    if (stream && el.srcObject !== stream) {
      el.srcObject = stream
    }
  }, [remoteStreams])

  const createPeerConnection = useCallback(
    (peerId: string, sock: Socket, stream: MediaStream): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sock.emit("ice-candidate", {
            roomId: salaId,
            candidate: e.candidate,
            to: peerId,
          })
        }
      }

      pc.ontrack = (e) => {
        const incoming = e.streams[0]
        setRemoteStreams((prev) => {
          const next = new Map(prev)
          next.set(peerId, incoming)
          return next
        })
        // Assign immediately if ref already exists
        const videoEl = remoteVideoRefs.current.get(peerId)
        if (videoEl && videoEl.srcObject !== incoming) {
          videoEl.srcObject = incoming
        }
      }

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected" ||
          pc.connectionState === "closed"
        ) {
          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.delete(peerId)
            return next
          })
          setParticipants((prev) =>
            prev.filter((p) => !p.startsWith(peerId.slice(0, 8)))
          )
          peersRef.current.delete(peerId)
        }
      }

      return pc
    },
    [salaId]
  )

  useEffect(() => {
    let sock: Socket
    let stream: MediaStream
    let mounted = true

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        sock = io({ path: "/socket.io" })
        socketRef.current = sock

        sock.on("connect", () => {
          if (!mounted) return
          setConnected(true)
          sock.emit("join-room", salaId)
          setParticipants(["Você"])
        })

        sock.on("disconnect", () => {
          if (!mounted) return
          setConnected(false)
        })

        // Novo usuário entrou → eu crio a oferta para ele
        sock.on("user-joined", async (peerId: string) => {
          if (!mounted) return
          const pc = createPeerConnection(peerId, sock, stream)
          peersRef.current.set(peerId, pc)

          try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            sock.emit("offer", { roomId: salaId, offer, to: peerId })
          } catch (err) {
            console.error("[WebRTC] Erro ao criar offer:", err)
          }

          setParticipants((prev) =>
            prev.includes(peerId.slice(0, 8)) ? prev : [...prev, peerId.slice(0, 8)]
          )
        })

        // Recebi uma oferta → crio resposta
        sock.on(
          "offer",
          async ({ offer, from }: { offer: RTCSessionDescriptionInit; from: string }) => {
            if (!mounted) return
            const pc = createPeerConnection(from, sock, stream)
            peersRef.current.set(from, pc)

            try {
              await pc.setRemoteDescription(new RTCSessionDescription(offer))
              const answer = await pc.createAnswer()
              await pc.setLocalDescription(answer)
              sock.emit("answer", { roomId: salaId, answer, to: from })
            } catch (err) {
              console.error("[WebRTC] Erro ao processar offer:", err)
            }

            setParticipants((prev) =>
              prev.includes(from.slice(0, 8)) ? prev : [...prev, from.slice(0, 8)]
            )
          }
        )

        // Recebi uma resposta à minha oferta
        sock.on(
          "answer",
          async ({ answer, from }: { answer: RTCSessionDescriptionInit; from: string }) => {
            if (!mounted) return
            const pc = peersRef.current.get(from)
            if (pc && pc.signalingState !== "stable") {
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer))
              } catch (err) {
                console.error("[WebRTC] Erro ao processar answer:", err)
              }
            }
          }
        )

        // ICE candidates
        sock.on(
          "ice-candidate",
          ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
            if (!mounted) return
            const pc = peersRef.current.get(from)
            if (pc && pc.remoteDescription) {
              pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) =>
                console.error("[WebRTC] Erro ao adicionar ICE candidate:", err)
              )
            }
          }
        )

        // Usuário saiu
        sock.on("user-left", (peerId: string) => {
          if (!mounted) return
          const pc = peersRef.current.get(peerId)
          if (pc) {
            pc.close()
            peersRef.current.delete(peerId)
          }
          setRemoteStreams((prev) => {
            const next = new Map(prev)
            next.delete(peerId)
            return next
          })
          setParticipants((prev) =>
            prev.filter((p) => !p.startsWith(peerId.slice(0, 8)))
          )
        })
      } catch (err) {
        console.error("[VideoRoom] Erro ao inicializar:", err)
        if (mounted) {
          setError(
            "Não foi possível acessar câmera/microfone. Verifique as permissões do navegador."
          )
        }
      }
    }

    init()

    return () => {
      mounted = false
      stream?.getTracks().forEach((t) => t.stop())
      if (sock) {
        sock.emit("leave-room", salaId)
        sock.disconnect()
      }
      peersRef.current.forEach((pc) => pc.close())
      peersRef.current.clear()
    }
  }, [salaId, createPeerConnection])

  // Sync remote stream to video element when remoteStreams map changes
  useEffect(() => {
    remoteStreams.forEach((stream, peerId) => {
      const el = remoteVideoRefs.current.get(peerId)
      if (el && el.srcObject !== stream) {
        el.srcObject = stream
      }
    })
  }, [remoteStreams])

  function toggleMic() {
    if (!localStream) return
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled
    })
    setMicOn((prev) => !prev)
  }

  function toggleCam() {
    if (!localStream) return
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled
    })
    setCamOn((prev) => !prev)
  }

  function handleLeave() {
    localStream?.getTracks().forEach((t) => t.stop())
    if (socketRef.current) {
      socketRef.current.emit("leave-room", salaId)
      socketRef.current.disconnect()
    }
    peersRef.current.forEach((pc) => pc.close())
    peersRef.current.clear()
    router.back()
  }

  async function handleCopyCodigo() {
    try {
      await navigator.clipboard.writeText(salaCodigo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const remoteEntries = Array.from(remoteStreams.entries())

  // ─── Estado de erro ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <VideoOff size={24} className="text-red-400" />
          </div>
          <h2 className="font-serif text-lg font-bold text-white mb-2">Erro de Acesso</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // ─── Layout principal ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header da sala */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Video size={15} className="text-orange-400" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-white text-sm leading-none">{nome}</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Sala de vídeo ao vivo</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status de conexão */}
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi size={13} className="text-emerald-400" />
            ) : (
              <WifiOff size={13} className="text-slate-500" />
            )}
            <span className={`text-[10px] font-semibold ${connected ? "text-emerald-400" : "text-slate-500"}`}>
              {connected ? "Conectado" : "Conectando…"}
            </span>
          </div>

          {/* Código da sala */}
          <button
            onClick={handleCopyCodigo}
            className="hidden sm:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg px-3 py-1.5 transition-colors group"
            title="Copiar código para compartilhar"
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase">Código</span>
            <span className="text-xs text-slate-300 font-mono">{salaCodigo.slice(0, 8)}…</span>
            {copied ? (
              <Check size={11} className="text-emerald-400" />
            ) : (
              <Copy size={11} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
            )}
          </button>

          {/* Participantes */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5">
            <Users size={13} className="text-slate-400" />
            <span className="text-xs text-slate-300 font-semibold">{participants.length}</span>
          </div>
        </div>
      </header>

      {/* Área de vídeos */}
      <main className="flex-1 p-4 pb-28 overflow-auto">
        {remoteEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mb-4">
              <Users size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-500 font-semibold text-sm">Aguardando outros participantes…</p>
            <p className="text-slate-600 text-xs mt-1.5">
              Compartilhe o código da sala para convidar alguém.
            </p>
            <button
              onClick={handleCopyCodigo}
              className="mt-4 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Copiado!" : "Copiar código da sala"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {remoteEntries.map(([peerId]) => (
              <div key={peerId} className="relative aspect-video">
                <video
                  ref={(el) => assignRemoteRef(peerId, el)}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover rounded-2xl bg-slate-800"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
                  <span className="text-white text-[10px] font-semibold">{peerId.slice(0, 8)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Vídeo local (picture-in-picture) */}
      <div className="fixed bottom-24 right-6 z-30 w-44 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!camOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <VideoOff size={20} className="text-slate-500" />
          </div>
        )}
        <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <span className="text-white text-[9px] font-semibold">Você</span>
        </div>
      </div>

      {/* Barra de controles */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-white/10 px-6 py-4 flex items-center justify-center gap-4 z-20">
        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
            micOn
              ? "bg-slate-800 border-white/10 text-white hover:bg-slate-700"
              : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
          }`}
          title={micOn ? "Mutar microfone" : "Ativar microfone"}
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        {/* Cam toggle */}
        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
            camOn
              ? "bg-slate-800 border-white/10 text-white hover:bg-slate-700"
              : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"
          }`}
          title={camOn ? "Desligar câmera" : "Ligar câmera"}
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        {/* Encerrar */}
        <button
          onClick={handleLeave}
          className="h-12 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full flex items-center gap-2 transition-all shadow-lg shadow-red-500/25"
          title="Encerrar chamada"
        >
          <PhoneOff size={18} />
          <span className="text-sm hidden sm:inline">Encerrar</span>
        </button>

        {/* Participantes (mobile) */}
        <div className="flex items-center gap-1.5 bg-slate-800 border border-white/10 rounded-full px-3 py-2 sm:hidden">
          <Users size={14} className="text-slate-400" />
          <span className="text-xs text-slate-300 font-semibold">{participants.length}</span>
        </div>

        {/* Label participantes (desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 ml-4">
          <Users size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500">
            {participants.length} {participants.length === 1 ? "participante" : "participantes"}
          </span>
        </div>
      </footer>
    </div>
  )
}
