/**
 * app/painel/app/[id]/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Rota genérica de acesso a módulos do catálogo.
 *
 * O parâmetro [id] é o UUID opaco do ModuloCatalogo no banco — nunca expõe
 * o nome ou caminho real do módulo na URL.
 *
 * Validações:
 *   - Sessão ativa obrigatória
 *   - Módulo deve pertencer à empresa do usuário (ou superAdmin)
 *   - Módulo deve estar ativo
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getServerSession } from "next-auth"
import { redirect }         from "next/navigation"
import { opcoesAuth }       from "@/servidor/autenticacao/config"
import { db }               from "@/servidor/banco/cliente"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AppModuloPage({ params }: Props) {
  const { id }  = await params
  const sessao  = await getServerSession(opcoesAuth)
  if (!sessao) redirect("/login")

  const { superAdmin, empresaId } = sessao.user

  let modulo: { href: string; rotulo: string } | null = null

  if (superAdmin) {
    // SuperAdmin pode visualizar qualquer módulo do catálogo
    modulo = await db.moduloCatalogo.findUnique({
      where:  { id },
      select: { href: true, rotulo: true },
    })
  } else if (empresaId) {
    // Usuário comum: módulo deve estar vinculado e ativo na empresa dele
    const vinculo = await db.moduloCustomDaEmpresa.findFirst({
      where:  { catalogoId: id, empresaId, ativo: true },
      select: { catalogo: { select: { href: true, rotulo: true } } },
    })
    modulo = vinculo?.catalogo ?? null
  }

  // Módulo não encontrado ou não autorizado → volta ao painel
  if (!modulo) redirect("/painel")

  return (
    <div style={{ margin: "-1.5rem", height: "calc(100vh - 56px)" }}>
      <iframe
        src={modulo.href}
        className="w-full h-full border-0"
        title={modulo.rotulo}
      />
    </div>
  )
}
