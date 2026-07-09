import { LandingVertical } from "@/components/landing/landing-vertical"
import { LANDINGS } from "@/lib/landings"

// Landing corporativa da StackSystems (rota raiz "/")
export default function Home() {
  return <LandingVertical config={LANDINGS.stacksystems} />
}
