"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { TIPOS_SISTEMA, MODULOS_DISPONIVEIS } from "@/tipos/sistema"

interface Props {
  empresaId: string
  modulosAtivos: string[]
  tipoSistema?: string | null
}

export function EmpresaModulosManager({ empresaId, modulosAtivos, tipoSistema }: Props) {
  const router = useRouter()
  const [ativos, setAtivos] = useState<string[]>(modulosAtivos)
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [aplicando, setAplicando] = useState(false)

  const tipoAtual = TIPOS_SISTEMA.find((t) => t.key === tipoSistema)

  const handleToggle = async (key: string) => {
    const novoAtivos = ativos.includes(key)
      ? ativos.filter((k) => k !== key)
      : [...ativos, key]

    setAtivos(novoAtivos)
    setSaving(true)
    setSavedKey(key)

    try {
      await fetch(`/api/empresas/${empresaId}/modulos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulos: novoAtivos }),
      })
      router.refresh()
    } finally {
      setSaving(false)
      setSavedKey(null)
    }
  }

  const handleAplicarTipo = async () => {
    if (!tipoAtual || tipoAtual.key === "personalizado") return
    setAplicando(true)
    try {
      const res = await fetch(`/api/empresas/${empresaId}/modulos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aplicarTipo: true }),
      })
      if (res.ok) {
        // Atualizar estado local com os módulos do tipo
        setAtivos([...tipoAtual.modulos])
        router.refresh()
      }
    } finally {
      setAplicando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho: Tipo de sistema + botão */}
      {tipoAtual && (
        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-500 shrink-0">Tipo de sistema:</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                tipoAtual.key === "personalizado"
                  ? "bg-slate-100 text-slate-600 border-slate-200"
                  : "bg-orange-50 text-orange-600 border-orange-200"
              }`}
            >
              {tipoAtual.emoji} {tipoAtual.label}
            </span>
          </div>
          {tipoAtual.key !== "personalizado" && (
            <button
              onClick={handleAplicarTipo}
              disabled={aplicando || saving}
              className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
            >
              {aplicando ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Aplicar módulos do tipo
            </button>
          )}
        </div>
      )}

      {!tipoAtual && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <span className="text-xs text-slate-400">
            Nenhum tipo de sistema definido. Configure na aba de dados da empresa.
          </span>
        </div>
      )}

      {/* Grid de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODULOS_DISPONIVEIS.map((modulo) => {
          const isAtivo = ativos.includes(modulo.key)
          const isLoading = saving && savedKey === modulo.key

          const DESC_MAP: Record<string, string> = {
            alunos:       "Gestão de alunos e cadastros",
            matriculas:   "Controle de matrículas e status",
            cursos:       "Catálogo de cursos da empresa",
            aulas:        "Conteúdo e aulas dos cursos",
            salas:        "Videoconferências WebRTC",
            baixas:       "Controle de pagamentos e baixas",
            certificados: "Emissão de certificados",
          }

          return (
            <div
              key={modulo.key}
              className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                isAtivo
                  ? "border-orange-200 bg-orange-50/50"
                  : "border-slate-100 bg-white"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{modulo.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {DESC_MAP[modulo.key] ?? ""}
                  <span className="ml-1.5 text-[10px] text-slate-300 font-medium uppercase tracking-wide">
                    {modulo.grupo}
                  </span>
                </p>
              </div>

              <button
                onClick={() => handleToggle(modulo.key)}
                disabled={saving}
                className="shrink-0 relative"
                aria-label={isAtivo ? `Desabilitar ${modulo.label}` : `Habilitar ${modulo.label}`}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin text-orange-400" />
                ) : (
                  <span
                    className={`flex items-center rounded-full transition-colors duration-200 px-0.5 ${
                      isAtivo ? "bg-orange-500" : "bg-slate-200"
                    }`}
                    style={{ height: "22px", width: "40px" }}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        isAtivo ? "translate-x-[18px]" : "translate-x-0"
                      }`}
                    />
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
