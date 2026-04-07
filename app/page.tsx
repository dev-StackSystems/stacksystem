import Navbar from "@/componentes/landing/landing-navbar"
import Hero from "@/componentes/landing/landing-hero"
import Marquee from "@/componentes/landing/landing-marquee"
import Services from "@/componentes/landing/landing-services"
import Migration from "@/componentes/landing/landing-migration"
import About from "@/componentes/landing/landing-about"
import Results from "@/componentes/landing/landing-results"
import Contact from "@/componentes/landing/landing-contact"
import Footer from "@/componentes/landing/landing-footer"
import Mascot from "@/componentes/mascote"

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Marquee />
      <Services />
      <Migration />
      <About />
      <Results />
      <Contact />
      <Footer />
      <Mascot />
    </main>
  )
}
