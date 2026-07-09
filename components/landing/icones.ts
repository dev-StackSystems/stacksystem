/**
 * components/landing/icones.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Mapa nome→componente dos ícones usados nas landing pages.
 *
 * Os configs em lib/landings.ts referenciam ícones por NOME (string) para que
 * o objeto seja serializável ao cruzar a fronteira Server → Client Component.
 * As seções client resolvem o nome para o componente via `iconeLanding()`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { LucideIcon } from "lucide-react"
import {
  Zap, Target, Users, LayoutGrid, CreditCard, RefreshCw, BarChart2, Handshake, Link2,
  Scissors, CalendarClock, Star, Wallet, GraduationCap, BookOpen, Video, Award,
  Receipt, PieChart, Landmark, FileText, Circle,
} from "lucide-react"

export const ICONES_LANDING: Record<string, LucideIcon> = {
  Zap, Target, Users, LayoutGrid, CreditCard, RefreshCw, BarChart2, Handshake, Link2,
  Scissors, CalendarClock, Star, Wallet, GraduationCap, BookOpen, Video, Award,
  Receipt, PieChart, Landmark, FileText,
}

/** Resolve o nome de um ícone para o componente Lucide (fallback: Circle). */
export function iconeLanding(nome: string): LucideIcon {
  return ICONES_LANDING[nome] ?? Circle
}
