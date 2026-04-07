/**
 * componentes/formularios/form-usuario.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal de formulário para criar ou editar um usuário interno do sistema.
 *
 * Modos:
 *   - "criar"  → POST /api/usuarios
 *   - "editar" → PUT  /api/usuarios/[id]
 *
 * Props:
 *   modo          — "criar" ou "editar"
 *   usuario       — dados do usuário (modo editar)
 *   gatilho       — elemento React que abre o modal ao ser clicado
 *   empresas      — lista de empresas para o superAdmin escolher
 *   setores       — lista de setores da empresa selecionada
 *   grupos        — lista de grupos da empresa selecionada
 *   isAdminSistema — se true, exibe campo de seleção de empresa
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"

// Tipo de modo do formulário
type Modo = "criar" | "editar"

// Dados do usuário para o modo de edição
interface DadosUsuario {
  id:          string
  nome:        string
  email:       string
  papel:       string
  departamento?: string | null
  telefone?:   string | null
  empresaId?:  string | null
  setorId?:    string | null
  grupoId?:    string | null
}

interface Empresa {
  id:          string
  nome:        string
  tipoSistema?: string | null
  cor?:        string | null
}

interface Props {
  modo:          Modo
  usuario?:      DadosUsuario
  gatilho:       React.ReactNode  // Elemento que ao ser clicado abre o modal
  empresas?:     Empresa[]
  setores?:      { id: string; nome: string; empresaId: string }[]
  grupos?:       { id: string; nome: string; empresaId: string }[]
  isAdminSistema?: boolean
}

// ── Estilos reutilizáveis ─────────────────────────────────────────────────

const classeLabel  = "block text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1"
const classeInput  = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
const classeSelect = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-400 transition-all"

// Papéis disponíveis por tipo de usuário
const PAPEIS_ADMIN = [
  { valor: "A", rotulo: "Administrador do Sistema" },
  { valor: "T", rotulo: "Técnico"                  },
  { valor: "F", rotulo: "Corpo Docente"             },
]
const PAPEIS_EMPRESA = [
  { valor: "T", rotulo: "Técnico"      },
  { valor: "F", rotulo: "Corpo Docente" },
]

// ── Componente ─────────────────────────────────────────────────────────────

export function FormularioUsuario({
  modo,
  usuario,
  gatilho,
  empresas = [],
  setores = [],
  grupos = [],
  isAdminSistema = false,
}: Props) {
  const router   = useRouter()
  const [aberto, setAberto]    = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]        = useState("")

  // Estado do formulário
  const [form, setForm] = useState({
    nome:        "",
    email:       "",
    senha:       "",
    papel:       "",
    departamento: "",
    telefone:    "",
    empresaId:   "",
    setorId:     "",
    grupoId:     "",
  })

  // Preenche o formulário ao abrir em modo de edição
  useEffect(() => {
    if (usuario && modo === "editar") {
      setForm({
        nome:         usuario.nome,
        email:        usuario.email,
        senha:        "",
        papel:        usuario.papel,
        departamento: usuario.departamento ?? "",
        telefone:     usuario.telefone    ?? "",
        empresaId:    usuario.empresaId   ?? "",
        setorId:      usuario.setorId     ?? "",
        grupoId:      usuario.grupoId     ?? "",
      })
    } else {
      // Limpa o formulário ao abrir em modo de criação
      setForm({ nome: "", email: "", senha: "", papel: "", departamento: "", telefone: "", empresaId: "", setorId: "", grupoId: "" })
    }
    setErro("")
  }, [aberto, usuario, modo])

  /** Submete o formulário via API */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")

    // Validações básicas no cliente
    if (!form.nome || !form.email || !form.papel) {
      setErro("Nome, e-mail e perfil são obrigatórios.")
      return
    }
    if (modo === "criar" && !form.senha) {
      setErro("Senha é obrigatória para novo usuário.")
      return
    }
    if (isAdminSistema && form.papel !== "A" && !form.empresaId) {
      setErro("Selecione a empresa para este usuário.")
      return
    }

    setSalvando(true)
    try {
      const url    = modo === "criar" ? "/api/usuarios" : `/api/usuarios/${usuario!.id}`
      const metodo = modo === "criar" ? "POST" : "PUT"

      const corpo: Record<string, string | null> = {
        nome:         form.nome,
        email:        form.email,
        papel:        form.papel,
        departamento: form.departamento,
        telefone:     form.telefone,
        empresaId:    form.empresaId || null,
        setorId:      form.setorId   || null,
        grupoId:      form.grupoId   || null,
      }
      // Só envia senha se foi preenchida (em edição, manter em branco = não alterar)
      if (form.senha) corpo.senha = form.senha

      const resposta = await fetch(url, {
        method:  metodo,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(corpo),
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        setErro(dados.erro ?? "Erro ao salvar usuário.")
        return
      }

      setAberto(false)
      router.refresh() // Revalida os dados na página
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  // Empresa selecionada no formulário (para mostrar o badge de tipo)
  const empresaSelecionada  = empresas.find(e => e.id === form.empresaId)
  // Setores e grupos filtrados pela empresa selecionada
  const setoresFiltrados    = setores.filter(s => s.empresaId === form.empresaId)
  const gruposFiltrados     = grupos.filter(g => g.empresaId === form.empresaId)
  const empresaObrigatoria  = form.papel !== "A"

  return (
    <>
      {/* Gatilho (botão ou outro elemento) que abre o modal */}
      <div onClick={() => setAberto(true)}>{gatilho}</div>

      {/* Modal */}
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay escurecido */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setAberto(false)}
          />

          {/* Conteúdo do modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-serif text-base font-bold text-slate-900">
                {modo === "criar" ? "Novo Usuário" : "Editar Usuário"}
              </h2>
              <button
                onClick={() => setAberto(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} autoComplete="off" className="px-5 py-4 flex flex-col gap-3">

              {/* Nome e E-mail */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={classeLabel}>Nome completo <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    autoComplete="off"
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className={classeInput}
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label className={classeLabel}>E-mail <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    autoComplete="off"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={classeInput}
                    placeholder="joao@empresa.com"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className={classeLabel}>
                  {modo === "criar"
                    ? <><span>Senha</span> <span className="text-red-400">*</span></>
                    : "Nova senha (deixe em branco para manter)"}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  className={classeInput}
                  placeholder={modo === "criar" ? "Mínimo 8 caracteres" : "Deixe em branco para manter"}
                />
              </div>

              {/* Papel + Empresa */}
              <div className={`grid gap-3 ${isAdminSistema ? "grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <label className={classeLabel}>Perfil <span className="text-red-400">*</span></label>
                  <select
                    value={form.papel}
                    onChange={e => setForm(f => ({ ...f, papel: e.target.value }))}
                    className={`${classeSelect} ${!form.papel ? "border-amber-300 bg-amber-50/50" : ""}`}
                  >
                    <option value="">— Selecionar perfil —</option>
                    {(isAdminSistema ? PAPEIS_ADMIN : PAPEIS_EMPRESA).map(p => (
                      <option key={p.valor} value={p.valor}>{p.rotulo}</option>
                    ))}
                  </select>
                </div>

                {/* Campo empresa — só para superAdmin */}
                {isAdminSistema && (
                  <div>
                    <label className={classeLabel}>
                      Empresa {empresaObrigatoria && <span className="text-red-400">*</span>}
                    </label>
                    {empresas.length === 0 ? (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Cadastre uma empresa antes de criar usuários.
                      </p>
                    ) : (
                      <select
                        value={form.empresaId}
                        onChange={e => setForm(f => ({ ...f, empresaId: e.target.value, setorId: "", grupoId: "" }))}
                        className={`${classeSelect} ${empresaObrigatoria && !form.empresaId ? "border-amber-300 bg-amber-50/50" : ""}`}
                      >
                        <option value="">— Selecionar empresa —</option>
                        {empresas.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.nome}</option>
                        ))}
                      </select>
                    )}
                    {/* Badge com tipo de sistema da empresa selecionada */}
                    {empresaSelecionada?.tipoSistema && (
                      <span
                        className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${empresaSelecionada.cor ?? "#f97316"}20`,
                          color:            empresaSelecionada.cor ?? "#f97316",
                          border:          `1px solid ${empresaSelecionada.cor ?? "#f97316"}40`,
                        }}
                      >
                        {empresaSelecionada.tipoSistema}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Departamento + Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={classeLabel}>Departamento</label>
                  <input
                    type="text"
                    value={form.departamento}
                    onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                    className={classeInput}
                    placeholder="Ex: Coordenação"
                  />
                </div>
                <div>
                  <label className={classeLabel}>Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                    className={classeInput}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Setor + Grupo — opcionais, aparecem após selecionar empresa */}
              {form.empresaId && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-2">
                    Vínculo organizacional{" "}
                    <span className="normal-case font-normal text-slate-300">(opcional)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={classeLabel}>Setor</label>
                      <select
                        value={form.setorId}
                        onChange={e => setForm(f => ({ ...f, setorId: e.target.value }))}
                        className={classeSelect}
                      >
                        <option value="">— Nenhum —</option>
                        {setoresFiltrados.map(s => (
                          <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={classeLabel}>Grupo</label>
                      <select
                        value={form.grupoId}
                        onChange={e => setForm(f => ({ ...f, grupoId: e.target.value }))}
                        className={classeSelect}
                      >
                        <option value="">— Nenhum —</option>
                        {gruposFiltrados.map(g => (
                          <option key={g.id} value={g.id}>{g.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem de erro */}
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
                  {erro}
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white font-bold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                >
                  {salvando && <Loader2 size={14} className="animate-spin" />}
                  {modo === "criar" ? "Criar Usuário" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
