/**
 * server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servidor customizado que combina Next.js + Socket.io em uma única porta.
 *
 * Por que servidor customizado?
 *   O Next.js não suporta Socket.io nativamente. Precisamos interceptar o
 *   servidor HTTP do Next.js e anexar o Socket.io a ele.
 *
 * Como iniciar:
 *   npm run dev    (desenvolvimento)
 *   npm run start  (produção)
 *
 * Fluxo de autenticação WebSocket:
 *   1. Cliente se conecta ao Socket.io
 *   2. Middleware valida o JWT do NextAuth no cookie da requisição
 *   3. Conexões sem JWT válido são rejeitadas imediatamente
 *   4. socket.data.usuarioId e socket.data.empresaId ficam disponíveis
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server as ServidorSocketIO } from "socket.io"
import { getToken } from "next-auth/jwt"
import type { IncomingMessage } from "http"

const modoDev = process.env.NODE_ENV !== "production"
const porta   = parseInt(process.env.PORT ?? "3000", 10)
const app     = next({ dev: modoDev })
const handler = app.getRequestHandler()

// Registro de salas em memória (Fase 1 — migrar para banco na Fase 2)
// chave: id da sala | valor: conjunto de IDs de socket conectados
const salas = new Map<string, Set<string>>()

app.prepare().then(() => {
  // Cria o servidor HTTP que roda Next.js
  const servidorHttp = createServer((req, res) => {
    const urlParsed = parse(req.url!, true)
    handler(req, res, urlParsed)
  })

  // Anexa Socket.io ao mesmo servidor HTTP
  const io = new ServidorSocketIO(servidorHttp, {
    cors: {
      origin:  process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  // ── Middleware de autenticação Socket.io ──────────────────────────────────
  // Todo socket que tenta se conectar passa por aqui primeiro.
  // O JWT do NextAuth fica no cookie next-auth.session-token.
  io.use(async (socket, next) => {
    try {
      const req   = socket.request as IncomingMessage
      const token = await getToken({
        req:    req as Parameters<typeof getToken>[0]["req"],
        secret: process.env.NEXTAUTH_SECRET ?? "",
      })

      if (!token?.id) {
        // Rejeita a conexão se não houver JWT válido
        return next(new Error("Não autenticado"))
      }

      // Armazena dados do usuário no socket para uso nos eventos
      socket.data.usuarioId  = token.id
      socket.data.empresaId  = token.empresaId ?? null
      next()
    } catch {
      next(new Error("Erro ao validar autenticação"))
    }
  })

  // ── Eventos Socket.io (sinalização WebRTC) ────────────────────────────────
  io.on("connection", (socket) => {
    console.log(`[WebRTC] Conectado: ${socket.id} (usuário=${socket.data.usuarioId})`)

    // Entrar em uma sala de videoaula
    // Aceita { idSala, nomeUsuario } — envia membros existentes de volta ao novo participante
    socket.on("entrar-sala", ({ idSala, nomeUsuario }: { idSala: string; nomeUsuario: string }) => {
      socket.data.nomeUsuario = nomeUsuario

      // Coleta membros já presentes ANTES de adicionar o novo
      const membrosExistentes: { id: string; nome: string }[] = []
      const setExistente = salas.get(idSala)
      if (setExistente) {
        for (const sid of setExistente) {
          const s = io.sockets.sockets.get(sid)
          if (s) membrosExistentes.push({ id: sid, nome: s.data.nomeUsuario ?? "Participante" })
        }
      }

      socket.join(idSala)
      if (!salas.has(idSala)) salas.set(idSala, new Set())
      salas.get(idSala)!.add(socket.id)

      // Informa ao novo participante quem já está na sala
      socket.emit("membros-sala", membrosExistentes)

      // Notifica os já presentes sobre o novo — envia { id, nome }
      socket.to(idSala).emit("usuario-entrou", { id: socket.id, nome: nomeUsuario })

      console.log(
        `[WebRTC] ${socket.id} (${nomeUsuario}) entrou na sala ${idSala} — ${membrosExistentes.length} já presente(s)`
      )
    })

    // Enviar oferta WebRTC — sempre unicast (para: socketId destino)
    socket.on("oferta", ({ idSala, oferta, para }: { idSala: string; oferta: RTCSessionDescriptionInit; para: string }) => {
      io.to(para).emit("oferta", { oferta, de: socket.id })
    })

    // Enviar resposta WebRTC — sempre unicast
    socket.on("resposta", ({ idSala, resposta, para }: { idSala: string; resposta: RTCSessionDescriptionInit; para: string }) => {
      io.to(para).emit("resposta", { resposta, de: socket.id })
    })

    // Compartilhar candidato ICE — sempre unicast
    socket.on("candidato-ice", ({ idSala, candidato, para }: { idSala: string; candidato: RTCIceCandidateInit; para: string }) => {
      io.to(para).emit("candidato-ice", { candidato, de: socket.id })
    })

    // Sair de uma sala
    socket.on("sair-sala", (idSala: string) => {
      socket.leave(idSala)
      salas.get(idSala)?.delete(socket.id)
      socket.to(idSala).emit("usuario-saiu", socket.id)
    })

    // Desconexão: remove o socket de todas as salas
    socket.on("disconnect", () => {
      salas.forEach((membros, idSala) => {
        if (membros.has(socket.id)) {
          membros.delete(socket.id)
          socket.to(idSala).emit("usuario-saiu", socket.id)
        }
      })
      console.log(`[WebRTC] Desconectado: ${socket.id}`)
    })
  })

  // Inicia o servidor na porta configurada
  servidorHttp.listen(porta, () => {
    console.log(`> Servidor pronto em http://localhost:${porta}`)
    console.log(`> Socket.io (sinalização WebRTC) ativo`)
  })
})
