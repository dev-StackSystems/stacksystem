"use client"
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"

type Mood = "normal" | "happy" | "thinking" | "wink"

const MESSAGES = [
  { text: "Posso te ajudar? 👋", sub: "Clique para falar conosco" },
  { text: "Precisando de um sistema?", sub: "Somos especialistas" },
  { text: "Olá! Tudo bem? 😊", sub: "Vamos conversar" },
]

export default function Mascot() {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [mouse,  setMouse]   = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [blink,  setBlink]   = useState(false)
  const [mood,   setMood]    = useState<Mood>("normal")
  const [msgIdx, setMsgIdx]  = useState(0)
  const [visible, setVisible] = useState(false)

  /* Show mascot after a moment */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  /* Mouse tracking */
  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  /* Random blink */
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const scheduleBlink = () => {
      t = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 110)
        scheduleBlink()
      }, 2200 + Math.random() * 3500)
    }
    scheduleBlink()
    return () => clearTimeout(t)
  }, [])

  /* Cycle moods & messages */
  useEffect(() => {
    const moods: Mood[] = ["normal", "happy", "thinking", "wink", "normal", "normal"]
    let i = 0
    const t = setInterval(() => {
      i = (i + 1) % moods.length
      setMood(moods[i])
      setMsgIdx(prev => (prev + 1) % MESSAGES.length)
    }, 7000)
    return () => clearInterval(t)
  }, [])

  /* Pupil offset — reads container bounding rect on every render */
  const getPupil = (eyeLocalX: number, eyeLocalY: number) => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect  = el.getBoundingClientRect()
    const eyeCX = rect.left  + eyeLocalX
    const eyeCY = rect.top   + eyeLocalY
    const dx    = mouse.x - eyeCX
    const dy    = mouse.y - eyeCY
    const dist  = Math.sqrt(dx * dx + dy * dy) || 1
    const max   = 4.5
    return {
      x: (dx / dist) * Math.min(dist * 0.12, max),
      y: (dy / dist) * Math.min(dist * 0.12, max),
    }
  }

  /* Eye centers relative to container top-left (approx) */
  const lPupil = getPupil(22, 26)
  const rPupil = getPupil(50, 26)

  const springCfg = { type: "spring" as const, stiffness: 380, damping: 22, mass: 0.4 }

  const MouthShape = () => {
    if (mood === "happy")
      return <div className="w-8 h-2 border-b-2 border-white/70 rounded-b-full mx-auto mt-1" />
    if (mood === "thinking")
      return <div className="w-5 h-1.5 bg-white/50 rounded-full mx-auto mt-1.5 ml-6" />
    if (mood === "wink")
      return <div className="w-6 h-1.5 border-b-2 border-white/70 rounded-b-full mx-auto mt-1 ml-4" />
    return <div className="w-7 h-[3px] bg-white/40 rounded-full mx-auto mt-2" />
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-8 right-8 z-50 select-none"
        >
          {/* Floating wrapper */}
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            {/* Speech bubble */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  key={msgIdx}
                  initial={{ opacity: 0, scale: 0.75, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, y: 10 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="absolute bottom-full mb-4 right-0 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-slate-200/80 border border-slate-100 whitespace-nowrap pointer-events-none"
                >
                  <p className="text-sm font-bold text-slate-800">{MESSAGES[msgIdx].text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{MESSAGES[msgIdx].sub}</p>
                  {/* Tail */}
                  <div className="absolute -bottom-[7px] right-6 w-3.5 h-3.5 bg-white border-b border-r border-slate-100 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* === Robot === */}
            <motion.div
              ref={containerRef}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="cursor-pointer relative"
              onHoverStart={() => setHovered(true)}
              onHoverEnd={() => setHovered(false)}
              onClick={() =>
                document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {/* Shadow under robot */}
              <motion.div
                animate={{ scaleX: [1, 0.85, 1], opacity: [0.25, 0.15, 0.25] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-400/30 rounded-full blur-sm pointer-events-none"
              />

              {/* Antenna */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                <motion.div
                  animate={{ boxShadow: ["0 0 6px #fb923c", "0 0 16px #f97316", "0 0 6px #fb923c"] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-orange-400"
                />
                <div className="w-[3px] h-4 bg-gradient-to-b from-orange-400 to-orange-600/60 rounded-full" />
              </div>

              {/* Head */}
              <div className="relative w-[72px] h-[62px]">
                {/* Ear-bolts */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-5 bg-gradient-to-b from-orange-500 to-orange-700 rounded-sm shadow-inner" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-5 bg-gradient-to-b from-orange-500 to-orange-700 rounded-sm shadow-inner" />

                {/* Head body */}
                <div className="w-full h-full bg-gradient-to-b from-orange-400 to-orange-600 rounded-[20px] relative overflow-hidden shadow-xl shadow-orange-300/60">
                  {/* Shine */}
                  <div className="absolute top-1 left-2 right-12 h-3 bg-white/20 rounded-full blur-sm" />

                  {/* Visor */}
                  <div className="absolute inset-x-3 top-3.5 bottom-3.5 bg-slate-950 rounded-[12px] overflow-hidden shadow-inner">
                    {/* Scanline shimmer */}
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(255,255,255,0.02)_3px,rgba(255,255,255,0.02)_4px)] pointer-events-none" />

                    {/* Eyes row */}
                    <div className="absolute inset-0 flex items-center justify-center gap-[10px]">

                      {/* Left eye */}
                      <div className="w-[18px] h-[18px] bg-white rounded-full relative overflow-hidden flex items-center justify-center shadow-sm">
                        {/* Eyelid */}
                        <motion.div
                          className="absolute top-0 left-0 right-0 bg-orange-500 origin-top z-20 pointer-events-none"
                          animate={{ height: blink ? "100%" : "0%" }}
                          transition={{ duration: 0.06 }}
                        />
                        {/* Pupil */}
                        <motion.div
                          className="w-3 h-3 bg-slate-900 rounded-full absolute"
                          animate={{ x: lPupil.x, y: lPupil.y }}
                          transition={springCfg}
                        >
                          {/* Pupil shine */}
                          <div className="w-1 h-1 bg-white/90 rounded-full absolute top-0.5 right-0.5" />
                        </motion.div>
                      </div>

                      {/* Wink right eye OR normal */}
                      <div className="w-[18px] h-[18px] bg-white rounded-full relative overflow-hidden flex items-center justify-center shadow-sm">
                        <motion.div
                          className="absolute top-0 left-0 right-0 bg-orange-500 origin-top z-20 pointer-events-none"
                          animate={{ height: blink || mood === "wink" ? "100%" : "0%" }}
                          transition={{ duration: 0.06 }}
                        />
                        <motion.div
                          className="w-3 h-3 bg-slate-900 rounded-full absolute"
                          animate={{ x: rPupil.x, y: rPupil.y }}
                          transition={springCfg}
                        >
                          <div className="w-1 h-1 bg-white/90 rounded-full absolute top-0.5 right-0.5" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Mouth area */}
                    <div className="absolute bottom-2 left-0 right-0">
                      <MouthShape />
                    </div>
                  </div>
                </div>
              </div>

              {/* Neck */}
              <div className="w-8 h-2.5 bg-orange-600/80 rounded-b-md mx-auto" />

              {/* Torso */}
              <div className="w-[56px] h-[28px] bg-gradient-to-b from-orange-500 to-orange-700 rounded-xl mx-auto relative overflow-hidden shadow-lg shadow-orange-300/30">
                {/* Chest detail */}
                <div className="absolute top-2 left-0 right-0 flex justify-center gap-2">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-white/60"
                  />
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 rounded-full bg-white/60"
                  />
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
                    className="w-2 h-2 rounded-full bg-white/60"
                  />
                </div>
              </div>

              {/* "S" badge */}
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-1 -right-2 w-6 h-6 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center shadow-md"
              >
                <span className="text-[10px] font-black text-orange-500 font-serif">S</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
