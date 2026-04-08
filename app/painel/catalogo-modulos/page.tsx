/**
 * app/painel/catalogo-modulos/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Gerenciamento do catálogo de módulos (superAdmin).
 *
 * Permite:
 *   - Criar novos módulos (nome, caminho, ícone, tipo)
 *   - Ativar/desativar módulos existentes
 *   - Excluir módulos
 *   - Atribuir módulos a empresas
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"
import CatalogoModulosCliente from "./catalogo-cliente"

export default async function CatalogoModulosPage() {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao?.user.superAdmin) redirect("/painel")

  const [modulosRaw, empresas] = await Promise.all([
    db.moduloCatalogo.findMany({ orderBy: { criadoEm: "desc" } }),
    db.empresa.findMany({
      where:   { ativa: true },
      select:  { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ])

  // Serializa datas para string (evita erro de hidratação)
  const modulos = modulosRaw.map(m => ({ ...m, criadoEm: m.criadoEm.toISOString(), atualizadoEm: m.atualizadoEm.toISOString() }))

  return <CatalogoModulosCliente modulosIniciais={modulos} empresas={empresas} />
}
