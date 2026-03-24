"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const MODULOS = [
  { key: "alunos",       label: "Alunos",        desc: "Gestão de alunos e cadastros" },
  { key: "matriculas",   label: "Matrículas",     desc: "Controle de matrículas e status" },
  { key: "cursos",       label: "Cursos",         desc: "Catálogo de cursos da empresa" },
  { key: "aulas",        label: "Aulas",          desc: "Conteúdo e aulas dos cursos" },
  { key: "salas",        label: "Salas de Aula",  desc: "Videoconferências WebRTC" },
  { key: "baixas",       label: "Financeiro",     desc: "Controle de pagamentos e baixas" },
  { key: "certificados", label: "Certificados",   desc: "Emissão de certificados" },
]

interface Props {
  empresaId: string
  modulosAtivos: string[]
}

export function EmpresaModulosManager({ empresaId, modulosAtivos }: Props) {
  const router = useRouter()
  const [ativos, setAtivos] = useState<string[]>(modulosAtivos)
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<string | null>(null)

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {MODULOS.map((modulo) => {
        const isAtivo = ativos.includes(modulo.key)
        const isLoading = saving && savedKey === modulo.key

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
              <p className="text-xs text-slate-400 mt-0.5 truncate">{modulo.desc}</p>
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
                  className={`flex items-center w-10 h-5.5 rounded-full transition-colors duration-200 px-0.5 ${
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
  )
}
