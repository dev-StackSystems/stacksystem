/**
 * app/painel/loading.tsx
 * Fallback de carregamento (App Router) exibido ao navegar entre as telas do
 * painel enquanto o Server Component busca os dados. Cobre todas as rotas de
 * /painel/* que não têm um loading.tsx próprio.
 */
import { SkeletonCabecalho, SkeletonKpis, SkeletonTabela } from "@/components/ui/skeleton"

export default function CarregandoPainel() {
  return (
    <div>
      <SkeletonCabecalho />
      <SkeletonKpis />
      <SkeletonTabela />
    </div>
  )
}
