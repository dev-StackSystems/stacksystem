import Navbar from "@/frontend/landing/landing-navbar"
import Hero from "@/frontend/landing/landing-hero"
import Marquee from "@/frontend/landing/landing-marquee"
import Services from "@/frontend/landing/landing-services"
import Migration from "@/frontend/landing/landing-migration"
import About from "@/frontend/landing/landing-about"
import Results from "@/frontend/landing/landing-results"
import Contact from "@/frontend/landing/landing-contact"
import Footer from "@/frontend/landing/landing-footer"
import Mascot from "@/frontend/mascot"

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
