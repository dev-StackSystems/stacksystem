/**
 * app/painel/catalogo-modulos/catalogo-cliente.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente cliente para o catálogo de módulos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client"

import { useState } from "react"
import {
  Plus, Pencil, Trash2, Building2, ToggleLeft, ToggleRight,
  ExternalLink, Layout, Globe, Monitor,
} from "lucide-react"

type Modulo = {
  id:           string
  chave:        string
  rotulo:       string
  href:         string
  icone:        string
  descricao:    string | null
  tipo:         string
  ativo:        boolean
  criadoEm:     string
  atualizadoEm: string
}

type Empresa = { id: string; nome: string }

type AtribuicaoModalState = {
  moduloId:   string
  moduloNome: string
  empresas:   Empresa[]
  atribuidas: string[] // ids das empresas que já têm o módulo
}

interface Props {
  modulosIniciais: Modulo[]
  empresas:        Empresa[]
}

const TIPOS = [
  { valor: "iframe",   rotulo: "Iframe",   icone: Monitor,     desc: "Carregado em iframe dentro do painel" },
  { valor: "interno",  rotulo: "Interno",  icone: Layout,      desc: "Rota Next.js dentro do /painel"       },
  { valor: "externo",  rotulo: "Externo",  icone: Globe,       desc: "Abre em nova aba (link externo)"      },
]

export default function CatalogoModulosCliente({ modulosIniciais, empresas }: Props) {
  const [modulos, setModulos]           = useState<Modulo[]>(modulosIniciais)
  const [modalAberto, setModalAberto]   = useState(false)
  const [editando, setEditando]         = useState<Modulo | null>(null)
  const [salvando, setSalvando]         = useState(false)
  const [atribuicao, setAtribuicao]     = useState<AtribuicaoModalState | null>(null)
  const [atribuindo, setAtribuindo]     = useState(false)

  const [form, setForm] = useState({
    chave: "", rotulo: "", href: "", icone: "📦", descricao: "", tipo: "iframe",
  })
  const [erro, setErro] = useState("")

  function abrirCriar() {
    setEditando(null)
    setForm({ chave: "", rotulo: "", href: "", icone: "📦", descricao: "", tipo: "iframe" })
    setErro("")
    setModalAberto(true)
  }

  function abrirEditar(m: Modulo) {
    setEditando(m)
    setForm({ chave: m.chave, rotulo: m.rotulo, href: m.href, icone: m.icone, descricao: m.descricao || "", tipo: m.tipo })
    setErro("")
    setModalAberto(true)
  }

  async function salvar() {
    if (!form.rotulo.trim() || !form.href.trim()) {
      setErro("Nome e caminho são obrigatórios")
      return
    }
    if (!editando && !form.chave.trim()) {
      setErro("Chave é obrigatória")
      return
    }
    setSalvando(true)
    setErro("")
    try {
      if (editando) {
        const res = await fetch(`/api/admin/modulos/${editando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setErro(data.erro || "Erro ao salvar"); return }
        setModulos(prev => prev.map(m => m.id === editando.id ? data : m))
      } else {
        const res = await fetch("/api/admin/modulos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setErro(data.erro || "Erro ao criar"); return }
        setModulos(prev => [data, ...prev])
      }
      setModalAberto(false)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este módulo? As empresas que o usam perderão acesso.")) return
    const res = await fetch(`/api/admin/modulos/${id}`, { method: "DELETE" })
    if (res.ok) setModulos(prev => prev.filter(m => m.id !== id))
  }

  async function toggleAtivo(m: Modulo) {
    const res = await fetch(`/api/admin/modulos/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !m.ativo }),
    })
    if (res.ok) setModulos(prev => prev.map(x => x.id === m.id ? { ...x, ativo: !m.ativo } : x))
  }

  async function abrirAtribuicao(m: Modulo) {
    setAtribuicao({ moduloId: m.id, moduloNome: m.rotulo, empresas, atribuidas: [] })
    // Busca empresas que já têm o módulo
    const res = await fetch(`/api/admin/modulos/${m.id}`)
    // Reutiliza a rota de empresas para buscar atribuições
    const emp = await fetch(`/api/empresas`)
    void emp // silencia warning — vamos buscar via empresa
    // Busca atribuições para cada empresa
    const resAll = await fetch(`/api/admin/modulos/${m.id}/empresas`).catch(() => null)
    if (resAll?.ok) {
      const ids: string[] = await resAll.json()
      setAtribuicao(prev => prev ? { ...prev, atribuidas: ids } : prev)
    }
  }

  async function toggleAtribuicao(moduloId: string, empresaId: string, jaTemAcesso: boolean) {
    setAtribuindo(true)
    const method = jaTemAcesso ? "DELETE" : "POST"
    await fetch(`/api/empresas/${empresaId}/modulos-custom`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogoId: moduloId }),
    })
    setAtribuicao(prev => {
      if (!prev) return prev
      const atribuidas = jaTemAcesso
        ? prev.atribuidas.filter(id => id !== empresaId)
        : [...prev.atribuidas, empresaId]
      return { ...prev, atribuidas }
    })
    setAtribuindo(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">Catálogo de Módulos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crie módulos e sistemas. Atribua-os às empresas para aparecerem na sidebar delas.
          </p>
        </div>
        <button
          onClick={abrirCriar}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Módulo
        </button>
      </div>

      {/* Lista de módulos */}
      {modulos.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="font-semibold text-slate-700 mb-1">Nenhum módulo criado</p>
          <p className="text-sm text-slate-500 mb-6">
            Crie o primeiro módulo para começar a expandir o sistema.
          </p>
          <button onClick={abrirCriar} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Criar primeiro módulo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {modulos.map(m => (
            <div key={m.id} className={`bg-white border rounded-2xl p-5 flex items-start gap-4 transition-opacity ${!m.ativo ? "opacity-50" : ""}`}>
              {/* Ícone */}
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl flex-shrink-0">
                {m.icone}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{m.rotulo}</span>
                  <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{m.chave}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    m.ativo
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-slate-50 text-slate-400 border border-slate-100"
                  }`}>
                    {m.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 flex items-center gap-1">
                    {m.tipo === "iframe"   && <Monitor size={10} />}
                    {m.tipo === "interno"  && <Layout size={10} />}
                    {m.tipo === "externo"  && <Globe size={10} />}
                    {m.tipo}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <ExternalLink size={11} className="text-slate-300" />
                  <code className="text-xs text-slate-500 truncate">{m.href}</code>
                </div>
                {m.descricao && (
                  <p className="text-xs text-slate-500 mt-1">{m.descricao}</p>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => abrirAtribuicaoSimples(m)}
                  title="Atribuir a empresas"
                  className="p-2 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <Building2 size={16} />
                </button>
                <button
                  onClick={() => toggleAtivo(m)}
                  title={m.ativo ? "Desativar" : "Ativar"}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {m.ativo ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => abrirEditar(m)}
                  title="Editar"
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => excluir(m.id)}
                  title="Excluir"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal criar/editar ─────────────────────────────────────────── */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editando ? "Editar módulo" : "Novo módulo"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {editando
                  ? "Altere as configurações do módulo."
                  : "Defina o nome, caminho e tipo do módulo que vai aparecer no painel das empresas."}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Ícone + chave */}
              <div className="flex gap-3">
                <div className="w-20 flex-shrink-0">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Ícone
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-center text-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    value={form.icone}
                    onChange={e => setForm(f => ({ ...f, icone: e.target.value }))}
                    placeholder="📦"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Chave única <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400 font-mono"
                    value={form.chave}
                    onChange={e => setForm(f => ({ ...f, chave: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    placeholder="ex: barbeiro, petshop"
                    disabled={!!editando}
                  />
                  {editando && <p className="text-xs text-slate-400 mt-1">A chave não pode ser alterada.</p>}
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nome exibido na sidebar <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  value={form.rotulo}
                  onChange={e => setForm(f => ({ ...f, rotulo: e.target.value }))}
                  placeholder="ex: BarberPro, PetShop Manager"
                />
              </div>

              {/* Caminho */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Caminho / URL <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  value={form.href}
                  onChange={e => setForm(f => ({ ...f, href: e.target.value }))}
                  placeholder="ex: /painel/modulos/barbeiro ou https://..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  Rota interna (começa com /) ou URL externa (https://)
                </p>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Tipo de abertura
                </label>
                <div className="flex gap-2">
                  {TIPOS.map(t => (
                    <button
                      key={t.valor}
                      onClick={() => setForm(f => ({ ...f, tipo: t.valor }))}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        form.tipo === t.valor
                          ? "border-orange-400 bg-orange-50 text-orange-600"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <t.icone size={16} />
                      {t.rotulo}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {TIPOS.find(t => t.valor === form.tipo)?.desc}
                </p>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Descrição <span className="text-slate-300">(opcional)</span>
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Breve descrição para o catálogo"
                />
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {erro}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar módulo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal atribuição a empresas ────────────────────────────────── */}
      {atribuicao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                Atribuir "{atribuicao.moduloNome}"
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Marque as empresas que devem ter acesso a este módulo na sidebar.
              </p>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              {atribuicao.empresas.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">Nenhuma empresa cadastrada.</p>
              ) : (
                <div className="space-y-2">
                  {atribuicao.empresas.map(emp => {
                    const temAcesso = atribuicao.atribuidas.includes(emp.id)
                    return (
                      <label key={emp.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={temAcesso}
                          disabled={atribuindo}
                          onChange={() => toggleAtribuicao(atribuicao.moduloId, emp.id, temAcesso)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{emp.nome}</span>
                        {temAcesso && (
                          <span className="ml-auto text-xs text-emerald-600 font-semibold">Com acesso</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAtribuicao(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Versão simplificada que não depende de endpoint separado
  function abrirAtribuicaoSimples(m: Modulo) {
    // Busca atribuições via API de empresas
    fetch(`/api/admin/modulos/${m.id}/empresas`)
      .then(r => r.ok ? r.json() : [])
      .then((ids: string[]) => {
        setAtribuicao({ moduloId: m.id, moduloNome: m.rotulo, empresas, atribuidas: ids })
      })
      .catch(() => {
        setAtribuicao({ moduloId: m.id, moduloNome: m.rotulo, empresas, atribuidas: [] })
      })
  }
}
