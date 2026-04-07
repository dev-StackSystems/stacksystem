/**
 * app/painel/layout.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Layout raiz do painel administrativo.
 * Aplicado a TODAS as páginas dentro de /painel/*.
 *
 * Responsabilidades:
 *   1. Verificar autenticação (redireciona para /login se não logado)
 *   2. Verificar se o usuário tem empresa vinculada (exibe alerta se não)
 *   3. Verificar se a empresa tem tipo de sistema configurado
 *   4. Carregar os módulos ativos para a barra lateral
 *   5. Renderizar: BarraLateral + BarraTopo + conteúdo da página
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { resolverModulos } from "@/servidor/autenticacao/sessao"
import { db } from "@/servidor/banco/cliente"
import { BarraLateral } from "@/componentes/layout/barra-lateral"
import { BarraTopo } from "@/componentes/layout/barra-topo"
import { ProvedorSessao } from "@/componentes/layout/provedor-sessao"
import { AlertTriangle } from "lucide-react"

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  // Verifica autenticação
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao) redirect("/login")

  const { superAdmin } = sessao.user

  // superAdmin não precisa de empresa — tem acesso irrestrito
  if (!superAdmin && !sessao.user.empresaId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 max-w-md text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <h1 className="font-serif text-xl font-bold text-slate-900 mb-2">
            Conta sem empresa vinculada
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Sua conta não está vinculada a nenhuma empresa. Entre em contato com o
            administrador para configurar o acesso.
          </p>
        </div>
      </div>
    )
  }

  // Carrega módulos ativos + dados da empresa em paralelo
  const [modulosAtivos, empresa] = await Promise.all([
    resolverModulos(sessao.user),
    sessao.user.empresaId
      ? db.empresa.findUnique({
          where:  { id: sessao.user.empresaId },
          select: { cor: true, logo: true, nome: true, nomeSistema: true, tipoSistema: true },
        })
      : null,
  ])

  // Empresa sem tipo configurado: bloqueia acesso de usuários não-superAdmin
  if (!superAdmin && empresa && !empresa.tipoSistema) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-10 max-w-md text-center">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-orange-500" />
          </div>
          <h1 className="font-serif text-xl font-bold text-slate-900 mb-2">
            Sistema não configurado
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            A empresa <span className="font-semibold text-slate-700">{empresa.nome}</span> ainda
            não tem um tipo de sistema definido. Aguarde a configuração pelo administrador.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProvedorSessao sessao={sessao}>
      <div className="min-h-screen flex bg-slate-50 font-sans">
        {/* Barra lateral de navegação */}
        <BarraLateral
          papel={sessao.user.papel}
          superAdmin={superAdmin}
          grupoIsAdmin={sessao.user.grupoIsAdmin}
          modulos={modulosAtivos}
          marca={empresa ?? null}
        />

        {/* Conteúdo principal */}
        <div className="flex-1 flex flex-col min-w-0">
          <BarraTopo />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </ProvedorSessao>
  )
}
