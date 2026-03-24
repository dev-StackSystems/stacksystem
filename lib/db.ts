import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Necessário para o driver Neon funcionar fora do Edge (Node.js local)
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient() {
  const connectionString = process.env.DATABASE_URL!
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
