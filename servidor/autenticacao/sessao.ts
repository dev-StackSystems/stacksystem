/**
 * servidor/autenticacao/sessao.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Funções auxiliares de autenticação e permissão para uso nas rotas de API
 * e nas páginas do servidor (Server Components).
 *
 * Funções disponíveis:
 *   getUsuarioAtual()      — retorna o usuário da sessão atual (ou null)
 *   exigirPapel([...])     — verifica se o usuário tem um dos papéis permitidos
 *   exigirSuperAdmin()     — exige que seja o superAdmin (desenvolvedor/i3)
 *   resolverModulos()      — calcula quais módulos o usuário pode acessar
 *   resolverPermissao()    — calcula permissões CRUD para um módulo específico
 *
 * Hierarquia de acesso (igual ao i3 SCMWeb):
 *   superAdmin  → acesso total, cross-empresa
 *   papel A     → admin da empresa, acesso total aos módulos da empresa
 *   grupoIsAdmin → mesmo que papel A
 *   papel T/F   → empresa ∩ grupo ∩ setor (interseção dos módulos)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getServerSession } from "next-auth"
import { opcoesAuth } from "@/servidor/autenticacao/config"
import { db } from "@/servidor/banco/cliente"
import { PapelUsuario } from "@prisma/client"
import { NextResponse } from "next/server"

// ---------------------------------------------------------------------------
// Tipo que representa o usuário dentro da sessão
// ---------------------------------------------------------------------------
type UsuarioSessao = {
  id:           string
  papel:        string
  superAdmin:   boolean
  empresaId:    string | null
  grupoId:      string | null
  setorId:      string | null
  grupoIsAdmin: boolean
}

// ---------------------------------------------------------------------------
// Tipo que representa um módulo customizado vindo do catálogo
// ---------------------------------------------------------------------------
export type ModuloCustom = {
  id:     string
  chave:  string
  rotulo: string
  href:   string
  icone:  string
  tipo:   string
}

// ---------------------------------------------------------------------------
// Tipo de retorno das permissões granulares
// ---------------------------------------------------------------------------
export type Permissao = {
  podeLer:     boolean
  podeCriar:   boolean
  podeEditar:  boolean
  podeDeletar: boolean
}

// Constantes reutilizáveis
const PERMISSAO_TOTAL: Permissao   = { podeLer: true,  podeCriar: true,  podeEditar: true,  podeDeletar: true  }
const PERMISSAO_NENHUMA: Permissao = { podeLer: false, podeCriar: false, podeEditar: false, podeDeletar: false }

// ---------------------------------------------------------------------------
// getUsuarioAtual
// ---------------------------------------------------------------------------

/**
 * Retorna o objeto `user` da sessão atual, ou `null` se não autenticado.
 * Use em Server Components e rotas de API.
 */
export async function getUsuarioAtual() {
  const sessao = await getServerSession(opcoesAuth)
  return sessao?.user ?? null
}

// ---------------------------------------------------------------------------
// exigirPapel
// ---------------------------------------------------------------------------

type SuccessAuth = { usuario: NonNullable<Awaited<ReturnType<typeof getUsuarioAtual>>> }

/**
 * Verifica se o usuário está autenticado E tem um dos papéis permitidos.
 * superAdmin sempre passa, independente do papel.
 *
 * @param papeisPermitidos  Array de papéis aceitos (ex: [PapelUsuario.A, PapelUsuario.T])
 * @returns { usuario } em caso de sucesso, ou NextResponse com erro 401/403
 *
 * Exemplo:
 *   const auth = await exigirPapel([PapelUsuario.A])
 *   if (auth instanceof NextResponse) return auth
 *   const { usuario } = auth
 */
export async function exigirPapel(
  papeisPermitidos: PapelUsuario[]
): Promise<SuccessAuth | NextResponse> {
  const usuario = await getUsuarioAtual()

  if (!usuario) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  // superAdmin passa por qualquer checagem de papel
  if (usuario.superAdmin) return { usuario }

  if (!papeisPermitidos.includes(usuario.papel as PapelUsuario)) {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 })
  }

  return { usuario }
}

// ---------------------------------------------------------------------------
// exigirSuperAdmin
// ---------------------------------------------------------------------------

/**
 * Exige que o usuário seja o superAdmin (desenvolvedor/i3).
 * Usado em operações cross-empresa (ex: gerenciar todas as empresas).
 */
export async function exigirSuperAdmin(): Promise<SuccessAuth | NextResponse> {
  const usuario = await getUsuarioAtual()
  if (!usuario)             return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  if (!usuario.superAdmin)  return NextResponse.json({ erro: "Acesso negado"   }, { status: 403 })
  return { usuario }
}

// ---------------------------------------------------------------------------
// resolverModulos
// ---------------------------------------------------------------------------

export type ResultadoModulos = {
  chaves:  string[]        // chaves dos módulos builtin (alunos, cursos, etc.)
  custom:  ModuloCustom[]  // módulos customizados do catálogo
}

/**
 * Calcula os módulos que o usuário pode acessar.
 *
 * Retorna chaves vazias para superAdmin (sidebar mostra tudo sem filtro).
 * Para admin da empresa (papel A ou grupoIsAdmin): todos os módulos ativos da empresa.
 * Para T/F: interseção de empresa ∩ grupo ∩ setor (módulos builtin).
 * Módulos customizados são sempre visíveis para admins da empresa.
 */
export async function resolverModulos(usuario: UsuarioSessao): Promise<ResultadoModulos> {
  // superAdmin: sem filtro — sidebar mostra tudo
  if (usuario.superAdmin) return { chaves: [], custom: [] }
  if (!usuario.empresaId) return { chaves: [], custom: [] }

  // Busca módulos builtin e customizados da empresa em paralelo
  const [modulosDaEmpresa, modulosCustom] = await Promise.all([
    db.moduloDaEmpresa
      .findMany({ where: { empresaId: usuario.empresaId, ativo: true }, select: { modulo: true } })
      .then(r => r.map(m => m.modulo)),
    db.moduloCustomDaEmpresa.findMany({
      where:   { empresaId: usuario.empresaId, ativo: true },
      select:  { catalogo: { select: { id: true, chave: true, rotulo: true, href: true, icone: true, tipo: true } } },
    }).then(r => r.map(m => m.catalogo)),
  ])

  // Admin da empresa ou grupo admin vê todos os módulos
  if (usuario.papel === PapelUsuario.A || usuario.grupoIsAdmin) {
    return { chaves: modulosDaEmpresa, custom: modulosCustom }
  }

  // Técnico/Docente: busca módulos do grupo e setor em paralelo
  const [modulosDoGrupo, modulosDoSetor] = await Promise.all([
    usuario.grupoId
      ? db.grupoModulo
          .findMany({ where: { grupoId: usuario.grupoId }, select: { modulo: true } })
          .then(r => r.map(m => m.modulo))
      : null,
    usuario.setorId
      ? db.setorModulo
          .findMany({ where: { setorId: usuario.setorId }, select: { modulo: true } })
          .then(r => r.map(m => m.modulo))
      : null,
  ])

  // Aplica interseção builtin: empresa ∩ grupo ∩ setor
  let chaves = modulosDaEmpresa
  if (modulosDoGrupo !== null) chaves = chaves.filter(m => modulosDoGrupo.includes(m))
  if (modulosDoSetor !== null) chaves = chaves.filter(m => modulosDoSetor.includes(m))

  // Módulos custom: visíveis apenas para admins (T/F não veem por padrão)
  return { chaves, custom: [] }
}

// ---------------------------------------------------------------------------
// resolverPermissao
// ---------------------------------------------------------------------------

/**
 * Resolve as permissões granulares (ler/criar/editar/deletar) do usuário
 * em um módulo específico. Equivalente ao `user_seguranca` do i3 SCMWeb.
 *
 * Hierarquia:
 *   superAdmin / papel A / grupoIsAdmin → PERMISSAO_TOTAL
 *   T/F → consulta PermissaoUsuario (usuário individual > grupo)
 *
 * @param usuario  Dados do usuário da sessão
 * @param modulo   Nome do módulo (ex: "alunos", "cursos", "salas")
 */
export async function resolverPermissao(
  usuario: UsuarioSessao,
  modulo: string
): Promise<Permissao> {
  // Hierarquia de acesso completo
  if (usuario.superAdmin)                                   return PERMISSAO_TOTAL
  if (usuario.papel === PapelUsuario.A || usuario.grupoIsAdmin) return PERMISSAO_TOTAL
  if (!usuario.empresaId)                                   return PERMISSAO_NENHUMA

  // Busca permissões: individual (usuarioId) ou do grupo (grupoId)
  const permissoes = await db.permissaoUsuario.findMany({
    where: {
      empresaId: usuario.empresaId,
      modulo,
      OR: [
        ...(usuario.id      ? [{ usuarioId: usuario.id      }] : []),
        ...(usuario.grupoId ? [{ grupoId:   usuario.grupoId }] : []),
      ],
    },
  })

  if (permissoes.length === 0) return PERMISSAO_NENHUMA

  // Permissão individual tem prioridade sobre permissão do grupo
  const permissao = permissoes.find(p => p.usuarioId === usuario.id) ?? permissoes[0]

  return {
    podeLer:      permissao.podeLer,
    podeCriar:    permissao.podeCriar,
    podeEditar:   permissao.podeEditar,
    podeDeletar:  permissao.podeDeletar,
  }
}
