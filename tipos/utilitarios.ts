/**
 * tipos/utilitarios.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Funções utilitárias usadas em componentes React.
 *
 * cn() — combina classes Tailwind CSS de forma segura (clsx + tailwind-merge).
 *         Evita conflitos de classes como "px-2 px-4" (mantém o último).
 *
 * Uso:
 *   import { cn } from "@/tipos/utilitarios"
 *   <div className={cn("px-4 py-2", condicao && "bg-red-500")} />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS condicionais e resolve conflitos Tailwind.
 * @param entradas  Classes CSS ou expressões condicionais
 * @returns String de classes CSS final
 */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas))
}
