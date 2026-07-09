/**
 * components/ui/skeleton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Placeholders de carregamento (skeletons) reutilizáveis.
 * Usados nos arquivos loading.tsx (fallback de navegação do App Router).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />
}

/** Cabeçalho de página: título + subtítulo + botão. */
export function SkeletonCabecalho() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>
  )
}

/** Linha de cartões de KPI. */
export function SkeletonKpis({ qtd = 4 }: { qtd?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: qtd }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  )
}

/** Tabela: barra de busca + linhas. */
export function SkeletonTabela({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
        <div className="ml-auto flex gap-1.5">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/5 hidden md:block" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Grade de cartões (ex: contas, salas). */
export function SkeletonCards({ qtd = 6 }: { qtd?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: qtd }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-8 w-1/2" />
        </div>
      ))}
    </div>
  )
}
