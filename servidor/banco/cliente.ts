/**
 * servidor/banco/cliente.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Singleton do cliente Prisma com adaptador Neon (PostgreSQL serverless).
 *
 * Por que singleton?
 *   O Next.js em modo desenvolvimento recarrega módulos a cada alteração,
 *   o que criaria múltiplas conexões ao banco. Armazenamos a instância em
 *   `globalThis` para reutilizá-la entre recargas.
 *
 * Uso:
 *   import { db } from "@/servidor/banco/cliente"
 *   const alunos = await db.aluno.findMany()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { Pool, neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Necessário para o driver Neon funcionar fora do Edge (Node.js local/servidor)
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

// Tipagem do globalThis para armazenar o singleton
const globalParaPrisma = globalThis as unknown as { prisma: PrismaClient }

/**
 * Cria uma nova instância do Prisma com o adaptador Neon.
 * Só deve ser chamada uma vez — use o export `db` abaixo.
 */
function criarCliente() {
  const urlConexao = process.env.DATABASE_URL!
  const pool = new Pool({ connectionString: urlConexao })
  const adaptador = new PrismaNeon(pool)
  return new PrismaClient({
    adapter: adaptador,
    // Em desenvolvimento, loga todas as queries SQL para facilitar debug
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })
}

// Exporta o cliente: reutiliza o existente em dev, cria novo em produção
export const db = globalParaPrisma.prisma ?? criarCliente()

// Persiste o cliente no globalThis apenas em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = db
}
