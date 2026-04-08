/**
 * app/painel/usuarios/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Página de gerenciamento de usuários internos do sistema.
 *
 * Acesso:
 *   - superAdmin: vê e gerencia todos os usuários da plataforma
 *   - papel A / grupoIsAdmin: vê e gerencia usuários da própria empresa
 *   - papel T: vê usuários da empresa (sem gerenciar)
 *   - papel F: sem acesso (redireciona para o painel)
 *
 * Dados carregados:
 *   - Lista de usuários (filtrada por empresa)
 *   - Lista de empresas (para o superAdmin poder criar usuários em qualquer empresa)
 *   - Lista de setores e grupos (para vínculo organizacional)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { db } from "@/servidor/banco/cliente"
import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { redirect } from "next/navigation"
import { PapelUsuario } from "@prisma/client"
import { TabelaUsuarios } from "@/componentes/tabelas/tabela-usuarios"
import { FormularioUsuario } from "@/componentes/formularios/form-usuario"
import { UserPlus } from "lucide-react"

// Campos selecionados ao buscar usuários
const CAMPOS_USUARIO = {
  id:          true,
  nome:        true,
  email:       true,
  papel:       true,
  departamento: true,
  telefone:    true,
  ativo:       true,
  criadoEm:   true,
  empresaId:   true,
  setorId:     true,
  grupoId:     true,
  empresa: { select: { nome: true } },
  setor:   { select: { nome: true } },
  grupo:   { select: { nome: true } },
}

export default async function PaginaUsuarios() {
  const sessao = await getServerSession(opcoesAuth)
  if (!sessao) redirect("/login")

  // Apenas Admin e Técnico acessam a gestão de usuários
  const papeisComAcesso = [PapelUsuario.A, PapelUsuario.T]
  if (!sessao.user.superAdmin && !sessao.user.grupoIsAdmin &&
      !papeisComAcesso.includes(sessao.user.papel as PapelUsuario)) {
    redirect("/painel")
  }

  const { superAdmin } = sessao.user
  const isAdminEmpresa = sessao.user.papel === PapelUsuario.A || sessao.user.grupoIsAdmin
  const podeGerenciar  = superAdmin || isAdminEmpresa

  // Filtros de escopo — superAdmin não tem restrição de empresa
  const filtroUsuario = superAdmin ? {} : { empresaId: sessao.user.empresaId ?? "" }
  const filtroEmpresa = superAdmin
    ? { ativa: true }
    : { id: sessao.user.empresaId ?? "", ativa: true }
  const filtroEscopo  = superAdmin ? {} : { empresaId: sessao.user.empresaId ?? undefined }

  // Carrega todos os dados em paralelo
  const [usuarios, empresas, setores, grupos] = await Promise.all([
    db.usuario.findMany({
      where:   filtroUsuario,
      select:  CAMPOS_USUARIO,
      orderBy: { criadoEm: "desc" },
    }),
    db.empresa.findMany({
      where:   filtroEmpresa,
      select:  { id: true, nome: true, tipoSistema: true, cor: true },
      orderBy: { nome: "asc" },
    }),
    db.setor.findMany({
      where:   { ativo: true, ...filtroEscopo },
      select:  { id: true, nome: true, empresaId: true },
      orderBy: { nome: "asc" },
    }),
    db.grupo.findMany({
      where:   { ativo: true, ...filtroEscopo },
      select:  { id: true, nome: true, empresaId: true },
      orderBy: { nome: "asc" },
    }),
  ])

  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {superAdmin
              ? "Todos os usuários da plataforma"
              : "Usuários da sua empresa"}
          </p>
        </div>

        {/* Botão de criar novo usuário — só para quem pode gerenciar */}
        {podeGerenciar && (
          <FormularioUsuario
            modo="criar"
            empresas={empresas}
            setores={setores}
            grupos={grupos}
            isAdminSistema={superAdmin}
            gatilho={
              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-orange-200">
                <UserPlus size={16} />
                Novo Usuário
              </button>
            }
          />
        )}
      </div>

      {/* Tabela de usuários */}
      <TabelaUsuarios
        usuarios={usuarios}
        isAdmin={superAdmin || isAdminEmpresa}
        podeGerenciar={podeGerenciar}
        empresas={empresas}
        setores={setores}
        grupos={grupos}
        isAdminSistema={superAdmin}
      />
    </div>
  )
}
