/**
 * componentes/tabelas/tabela-usuarios.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tabela de usuários internos do sistema com busca, edição e toggle de status.
 *
 * Funcionalidades:
 *   - Busca por nome, e-mail ou empresa
 *   - Editar usuário (abre modal form-usuario.tsx)
 *   - Ativar/desativar usuário (toggle)
 *   - Desativar permanentemente (soft delete — define ativo=false)
 *
 * O componente notifica o servidor via API REST e atualiza a tela com
 * router.refresh() (revalida os dados sem recarregar a página inteira).
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { FormularioUsuario } from "@/componentes/formularios/form-usuario"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, Search } from "lucide-react"
import { useToast } from "@/componentes/layout/provedor-toast"

// ── Tipos ──────────────────────────────────────────────────────────────────

interface Usuario {
  id:          string
  nome:        string
  email:       string
  papel:       string
  departamento?: string | null
  telefone?:   string | null
  ativo:       boolean
  criadoEm:   Date | string
  empresaId?:  string | null
  setorId?:    string | null
  grupoId?:    string | null
  empresa?:    { nome: string } | null
  setor?:      { nome: string } | null
  grupo?:      { nome: string } | null
}

interface Empresa {
  id:          string
  nome:        string
  tipoSistema?: string | null
  cor?:        string | null
}

interface Props {
  usuarios:       Usuario[]
  isAdmin:        boolean
  podeGerenciar?: boolean
  isAdminSistema?: boolean
  empresas?:      Empresa[]
  setores?:       { id: string; nome: string; empresaId: string }[]
  grupos?:        { id: string; nome: string; empresaId: string }[]
}

// ── Configuração de exibição por papel ────────────────────────────────────

const CONFIG_PAPEL: Record<string, { rotulo: string; classe: string }> = {
  A: { rotulo: "Administrador", classe: "bg-purple-50 text-purple-600 border border-purple-200"   },
  T: { rotulo: "Técnico",       classe: "bg-blue-50 text-blue-600 border border-blue-200"          },
  I: { rotulo: "Interno",       classe: "bg-slate-50 text-slate-600 border border-slate-200"       },
  E: { rotulo: "Externo",       classe: "bg-amber-50 text-amber-600 border border-amber-200"       },
  F: { rotulo: "Corpo Docente", classe: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
}

// ── Componente ─────────────────────────────────────────────────────────────

export function TabelaUsuarios({
  usuarios,
  isAdmin,
  podeGerenciar,
  isAdminSistema = false,
  empresas = [],
  setores = [],
  grupos = [],
}: Props) {
  const podeEditar = podeGerenciar ?? isAdmin
  const router = useRouter()
  const { toast } = useToast()

  // ID do usuário com operação em andamento (exibe spinner)
  const [carregandoId, setCarregandoId] = useState<string | null>(null)

  // Texto de busca
  const [busca, setBusca] = useState("")

  /** Alterna o status ativo/inativo de um usuário */
  const alternarAtivo = async (usuario: Usuario) => {
    setCarregandoId(usuario.id)
    const resposta = await fetch(`/api/usuarios/${usuario.id}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ...usuario, ativo: !usuario.ativo }),
    })
    setCarregandoId(null)

    if (resposta.ok) {
      toast(usuario.ativo ? "Usuário desativado." : "Usuário ativado.", "info")
      router.refresh()
    } else {
      toast("Erro ao alterar status.", "erro")
    }
  }

  /** Desativa um usuário permanentemente (soft delete) */
  const desativarUsuario = async (id: string) => {
    if (!confirm("Desativar este usuário permanentemente?")) return
    setCarregandoId(id)
    const resposta = await fetch(`/api/usuarios/${id}`, { method: "DELETE" })
    setCarregandoId(null)

    if (resposta.ok) {
      toast("Usuário desativado.")
      router.refresh()
    } else {
      toast("Erro ao desativar usuário.", "erro")
    }
  }

  // Filtra usuários pela busca
  const usuariosFiltrados = usuarios.filter(u => {
    const termo = busca.toLowerCase()
    return (
      !termo ||
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo) ||
      (u.departamento ?? "").toLowerCase().includes(termo) ||
      (u.empresa?.nome ?? "").toLowerCase().includes(termo)
    )
  })

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Campo de busca */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, empresa..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
      </div>

      {/* Estado vazio */}
      {usuariosFiltrados.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-400 text-sm">
            {busca
              ? "Nenhum usuário encontrado para esta busca."
              : "Nenhum usuário cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Perfil</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Departamento</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Empresa</th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                {podeEditar && (
                  <th className="text-right px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuariosFiltrados.map(usuario => {
                const configPapel = CONFIG_PAPEL[usuario.papel] ?? {
                  rotulo: usuario.papel,
                  classe: "bg-slate-50 text-slate-500 border border-slate-200",
                }
                const carregando = carregandoId === usuario.id

                return (
                  <tr key={usuario.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Nome + email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{usuario.nome}</div>
                          <div className="text-xs text-slate-400">{usuario.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Papel */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${configPapel.classe}`}>
                        {configPapel.rotulo}
                      </span>
                    </td>

                    {/* Departamento */}
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-500">{usuario.departamento ?? "—"}</span>
                    </td>

                    {/* Empresa + setor + grupo */}
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <div className="text-slate-500">{usuario.empresa?.nome ?? "—"}</div>
                      {(usuario.setor || usuario.grupo) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {usuario.setor && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              {usuario.setor.nome}
                            </span>
                          )}
                          {usuario.grupo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-500">
                              {usuario.grupo.nome}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status ativo/inativo */}
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        usuario.ativo
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}>
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    {/* Ações */}
                    {podeEditar && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {carregando ? (
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                          ) : (
                            <>
                              {/* Botão editar */}
                              <FormularioUsuario
                                modo="editar"
                                usuario={usuario}
                                empresas={empresas}
                                setores={setores}
                                grupos={grupos}
                                isAdminSistema={isAdminSistema}
                                gatilho={
                                  <button
                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Editar"
                                  >
                                    <Pencil size={15} />
                                  </button>
                                }
                              />

                              {/* Toggle ativo/inativo */}
                              <button
                                onClick={() => alternarAtivo(usuario)}
                                className={`p-1.5 rounded-lg transition-all ${
                                  usuario.ativo
                                    ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                    : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                                }`}
                                title={usuario.ativo ? "Desativar" : "Ativar"}
                              >
                                {usuario.ativo
                                  ? <ToggleRight size={15} />
                                  : <ToggleLeft  size={15} />}
                              </button>

                              {/* Desativar permanentemente */}
                              <button
                                onClick={() => desativarUsuario(usuario.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Desativar permanentemente"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rodapé com contagem */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400">
          {usuariosFiltrados.length} de {usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
