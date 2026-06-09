import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import useCarouselNav from '../hooks/useCarouselNav.js'
import p1 from '../assets/images/karriere/philosophie/VIDEKO_Karte_01_freigestellt.png'
import p2 from '../assets/images/karriere/philosophie/VIDEKO_Karte_02_freigestellt.png'
import p3 from '../assets/images/karriere/philosophie/VIDEKO_Karte_03_freigestellt.png'
import p4 from '../assets/images/karriere/philosophie/VIDEKO_Karte_04_freigestellt.png'
import p5 from '../assets/images/karriere/philosophie/VIDEKO_Karte_05_freigestellt.png'
import p6 from '../assets/images/karriere/philosophie/VIDEKO_Karte_06_freigestellt.png'

const CARDS = [
  { img: p1, t: 'Keine Rabatt-Show', ar: 922 / 1229 },
  { img: p2, t: 'Kurze Wege statt Konzernsprech', ar: 942 / 1292 },
  { img: p3, t: 'Mitdenken erwünscht', ar: 1025 / 1334 },
  { img: p4, t: 'Humor inklusive', ar: 920 / 1219 },
  { img: p5, t: 'Premium statt Masse', ar: 942 / 1246 },
  { img: p6, t: 'Mitschwimmen? Nicht unser Stil.', ar: 909 / 1221 },
]

export default function KarriereTopShowcase() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = () => setActive((v) => (v + 1) % CARDS.length)
  const prev = () => setActive((v) => (v - 1 + CARDS.length) % CARDS.length)
  const nav = useCarouselNav(next, prev)
  const rel = (i) => { let d = i - active; const n = CARDS.length; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d }

  useEffect(() => {
    if (paused) return
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((v) => (v + 1) % CARDS.length), 4500)
    return () => clearInterval(id)
  }, [paused, active])

  return (
    <section className="section section--light karr-topshow">
      <div className="container karr-topshow__grid">
        <Reveal className="karr-topshow__intro">
          <span className="kicker">Warum gute Leute</span>
          <h2 className="lintro__title">Arbeiten ohne <span className="grad">Möbelhaus-Zirkus.</span></h2>
          <p className="lintro__text">Bei VIDEKO arbeiten Menschen, die mehr wollen als Rabattschlachten und Ellenbogen. Dafür gibt's gute Gründe.</p>
          <span className="karr-topshow__cue">Echte Haltung. Kein Konzernsprech.</span>
        </Reveal>

        <div className="kts" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="kts__stage" ref={nav.ref} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ touchAction: 'pan-y' }}>
            {CARDS.map((c, i) => {
              const d = rel(i)
              const isActive = d === 0
              const show = Math.abs(d) <= 2
              const style = {
                transform: `translate(-50%, -50%) translateX(${d * 45}%) scale(${isActive ? 1 : Math.abs(d) === 1 ? 0.84 : 0.6}) rotateY(${d * -11}deg)`,
                opacity: show ? (isActive ? 1 : Math.abs(d) === 1 ? 0.85 : 0.45) : 0,
                zIndex: isActive ? 20 : 10 - Math.abs(d),
                pointerEvents: show ? 'auto' : 'none',
                aspectRatio: c.ar,
              }
              return (
                <button key={c.t} type="button" className={`kts__card ${isActive ? 'is-active' : ''}`} style={style}
                  onClick={() => setActive(i)} aria-label={c.t} tabIndex={show ? 0 : -1}>
                  <img src={c.img} alt={c.t} loading="lazy" />
                </button>
              )
            })}
          </div>

          <div className="kts__nav">
            <button type="button" className="kts__arrow" onClick={prev} aria-label="Vorherige Karte"><ChevronLeft size={20} strokeWidth={2} /></button>
            <div className="kts__dots">
              {CARDS.map((c, i) => (
                <button key={c.t} type="button" className={`kts__dot ${active === i ? 'is-active' : ''}`} onClick={() => setActive(i)} aria-label={c.t} />
              ))}
            </div>
            <button type="button" className="kts__arrow" onClick={next} aria-label="Nächste Karte"><ChevronRight size={20} strokeWidth={2} /></button>
          </div>
        </div>
      </div>
    </section>
  )
}
