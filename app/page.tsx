import Navbar from "@/components/sections/Navbar"
import Hero from "@/components/sections/Hero"
import Marquee from "@/components/sections/Marquee"
import Services from "@/components/sections/Services"
import About from "@/components/sections/About"
import Results from "@/components/sections/Results"
import Contact from "@/components/sections/Contact"
import Footer from "@/components/sections/Footer"
import Mascot from "@/components/Mascot"

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Marquee />
      <Services />
      <About />
      <Results />
      <Contact />
      <Footer />
      <Mascot />
    </main>
  )
}
