/**
 * app/painel/modulos/barbeiro/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Protótipo do sistema de barbearia (BarberPro).
 * Carregado via iframe de /modulos/barbeiro/index.html (public/).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export default function ModuloBarbeiro() {
  return (
    // Compensa o p-6 / p-8 do layout pai para o iframe ocupar toda a área
    <div style={{ margin: "-1.5rem", height: "calc(100vh - 56px)" }}>
      <iframe
        src="/modulos/barbeiro/index.html"
        className="w-full h-full border-0"
        title="BarberPro — Sistema de Barbearia"
      />
    </div>
  )
}
