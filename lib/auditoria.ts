/**
 * lib/auditoria.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Trilha de auditoria — registra "quem fez o quê e quando" nas ações sensíveis.
 * Grava em SegurancaUsuario (usuarioId, acao, detalhes, ip). Nunca lança erro:
 * uma falha de log não deve quebrar a operação de negócio.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from "@/lib/db"

/** Extrai o IP de origem a partir dos headers da requisição. */
export function ipDaRequisicao(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip")
}

/** Registra uma ação na trilha de auditoria (best-effort). */
export async function registrarAuditoria(
  usuarioId: string | undefined | null,
  acao: string,
  detalhes?: string | null,
  ip?: string | null,
): Promise<void> {
  if (!usuarioId) return
  try {
    await db.segurancaUsuario.create({
      data: { usuarioId, acao, detalhes: detalhes ?? null, ip: ip ?? null },
    })
  } catch {
    /* auditoria é best-effort — não interrompe a operação */
  }
}
