import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server as SocketIOServer } from "socket.io"

const dev = process.env.NODE_ENV !== "production"
const port = parseInt(process.env.PORT ?? "3000", 10)
const app = next({ dev })
const handle = app.getRequestHandler()

// In-memory room registry — substituir por tabela DB na Fase 2
const rooms = new Map<string, Set<string>>()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log(`[WebRTC] Conectado: ${socket.id}`)

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId)
      if (!rooms.has(roomId)) rooms.set(roomId, new Set())
      rooms.get(roomId)!.add(socket.id)
      socket.to(roomId).emit("user-joined", socket.id)
      console.log(`[WebRTC] ${socket.id} entrou na sala ${roomId}`)
    })

    socket.on("offer", ({ roomId, offer, to }: { roomId: string; offer: RTCSessionDescriptionInit; to?: string }) => {
      if (to) {
        io.to(to).emit("offer", { offer, from: socket.id })
      } else {
        socket.to(roomId).emit("offer", { offer, from: socket.id })
      }
    })

    socket.on("answer", ({ roomId, answer, to }: { roomId: string; answer: RTCSessionDescriptionInit; to?: string }) => {
      if (to) {
        io.to(to).emit("answer", { answer, from: socket.id })
      } else {
        socket.to(roomId).emit("answer", { answer, from: socket.id })
      }
    })

    socket.on("ice-candidate", ({ roomId, candidate, to }: { roomId: string; candidate: RTCIceCandidateInit; to?: string }) => {
      if (to) {
        io.to(to).emit("ice-candidate", { candidate, from: socket.id })
      } else {
        socket.to(roomId).emit("ice-candidate", { candidate, from: socket.id })
      }
    })

    socket.on("leave-room", (roomId: string) => {
      socket.leave(roomId)
      rooms.get(roomId)?.delete(socket.id)
      socket.to(roomId).emit("user-left", socket.id)
    })

    socket.on("disconnect", () => {
      rooms.forEach((members, roomId) => {
        if (members.has(socket.id)) {
          members.delete(socket.id)
          socket.to(roomId).emit("user-left", socket.id)
        }
      })
      console.log(`[WebRTC] Desconectado: ${socket.id}`)
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Servidor pronto em http://localhost:${port}`)
    console.log(`> Socket.io (WebRTC signaling) ativo`)
  })
})
