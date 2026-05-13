import Navbar from "@/components/landing/landing-navbar"
import Hero from "@/components/landing/landing-hero"
import Marquee from "@/components/landing/landing-marquee"
import Services from "@/components/landing/landing-services"
import Migration from "@/components/landing/landing-migration"
import About from "@/components/landing/landing-about"
import Results from "@/components/landing/landing-results"
import Contact from "@/components/landing/landing-contact"
import Footer from "@/components/landing/landing-footer"
import Mascot from "@/components/mascote"

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
