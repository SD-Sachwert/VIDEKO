import { useRef, useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

import CTAButton from './CTAButton.jsx'
import assembled from '../assets/images/exploding-kitchen/assembled.png'
import overview from '../assets/images/exploding-kitchen/overview.png'

const CARDS = [
  { t: 'Materialien', d: 'Echte Materialien. Perfekt aufeinander abgestimmt.' },
  { t: 'Stauraum', d: 'Intelligent organisiert. Für mehr Platz und Überblick.' },
  { t: 'Lichtkonzept', d: 'Atmosphäre trifft Funktion. Für jede Stimmung das richtige Licht.' },
  { t: 'Präzise Montage', d: 'Millimetergenaue Planung. Saubere Umsetzung. Langlebige Perfektion.' },
]

const STEPS = [
  { n: '01', t: 'Schön', d: 'Ästhetik & Design' },
  { n: '02', t: 'Exploded', d: 'Was dahinter steckt' },
  { n: '03', t: 'Technik', d: 'Intelligenz & Innovation' },
  { n: '04', t: 'Perfektion', d: 'Montage & Service' },
]

// hotspots positioned over the exploded overview render
const HOTSPOTS = [
  { x: 50, y: 20 },
  { x: 34, y: 50 },
  { x: 63, y: 63 },
  { x: 50, y: 82 },
]

const ramp = (p, a, b, from, to) => {
  if (p <= a) return from
  if (p >= b) return to
  return from + (to - from) * ((p - a) / (b - a))
}

function Copy() {
  return (
    <div className="ek-copy">
      <span className="kicker">Technik, die man nicht sieht</span>
      <h2 className="ek-headline">Was du siehst: eine Küche.<br />Was wir sehen: <span className="grad">187 Entscheidungen.</span></h2>
      <p className="ek-sub">Material, Licht, Stauraum, Ergonomie, Technik und Montage – bei uns greift alles ineinander.</p>
      <p className="ek-note">Jede Ebene ist durchdacht. Jedes Detail hat seinen Grund. Für Küchen, die bleiben.</p>
    </div>
  )
}

export default function ExplodingKitchen() {
  const sectionRef = useRef(null)
  const [isDesktop, setDesktop] = useState(true)
  const [reduce, setReduce] = useState(false)
  const [p, setP] = useState(0)
  const [phase, setPhase] = useState('before') // before | pinned | after (fixed-based pin; sticky breaks under Lenis)

  useEffect(() => {
    const md = window.matchMedia('(min-width: 1024px)')
    const mr = window.matchMedia('(prefers-reduced-motion: reduce)')
    const f = () => { setDesktop(md.matches); setReduce(mr.matches) }
    f()
    md.addEventListener('change', f)
    mr.addEventListener('change', f)
    return () => { md.removeEventListener('change', f); mr.removeEventListener('change', f) }
  }, [])

  const animated = isDesktop && !reduce

  useEffect(() => {
    if (!animated) return
    let raf = 0
    const update = () => {
      const el = sectionRef.current
      if (!el) return
      const vh = window.innerHeight
      const r = el.getBoundingClientRect()
      const total = el.offsetHeight - vh
      const prog = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0
      setP(prog)
      setPhase(r.top > 0 ? 'before' : r.bottom < vh ? 'after' : 'pinned')
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [animated])

  const step = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3

  // ---- static fallback (tablet/mobile or reduced motion) ----
  if (!animated) {
    return (
      <section className="section section--light ek-sec ek-sec--static">
        <div className="container ek-static">
          <Copy />
          <div className="ek-stage ek-stage--static"><img className="ek-img" src={overview} alt="Eine VIDEKO Küche – Schicht für Schicht durchdacht" loading="lazy" /></div>
          <div className="ek-cards ek-cards--static">
            {CARDS.map((c) => (
              <div key={c.t} className="ek-card">
                <span className="ek-card__t">{c.t}</span>
                <span className="ek-card__d">{c.d}</span>
              </div>
            ))}
          </div>
          <div className="ek-cta">
            <CTAButton to="/beratung">Beratung anfragen</CTAButton>
            <span className="ek-trust">Persönlich. Unverbindlich. Auf Augenhöhe.</span>
          </div>
        </div>
      </section>
    )
  }

  const pinStyle = phase === 'pinned'
    ? { position: 'fixed', top: 0, left: 0 }
    : phase === 'after'
      ? { position: 'absolute', bottom: 0, left: 0 }
      : { position: 'absolute', top: 0, left: 0 }

  const hotsOpacity = ramp(p, 0.42, 0.6, 0, 1)

  return (
    <section className="ek-sec" ref={sectionRef}>
      <div className="ek-sticky" style={pinStyle}>
        <div className="container ek-grid">
          <Copy />

          <div className="ek-stage" aria-hidden="true">
            <span className="ek-glow" style={{ opacity: ramp(p, 0.15, 0.6, 0.25, 0.7) }} />
            <img className="ek-img ek-img--assembled" src={assembled} alt="" style={{ opacity: ramp(p, 0.10, 0.30, 1, 0) }} />
            <img className="ek-img ek-img--overview" src={overview} alt="" style={{ opacity: ramp(p, 0.18, 0.40, 0, 1), transform: `scale(${ramp(p, 0.18, 1, 1.0, 1.06)}) translateY(${ramp(p, 0.2, 1, 0, -14)}px)` }} />
            {HOTSPOTS.map((h, i) => (
              <span key={i} className="ek-hot" style={{ left: `${h.x}%`, top: `${h.y}%`, opacity: hotsOpacity, transitionDelay: `${i * 0.05}s` }} />
            ))}
          </div>

          <div className="ek-info">
            {CARDS.map((c, i) => (
              <div key={c.t} className={`ek-card ${step === i ? 'is-active' : ''}`}>
                <span className="ek-card__t">{c.t}</span>
                <span className="ek-card__d">{c.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="container ek-progress">
          <div className="ek-steps">
            <span className="ek-steps__line" aria-hidden="true"><span style={{ transform: `scaleX(${ramp(p, 0, 1, 0.04, 1)})` }} /></span>
            {STEPS.map((s, i) => (
              <div key={s.n} className={`ek-step ${step === i ? 'is-active' : ''} ${step > i ? 'is-done' : ''}`}>
                <span className="ek-step__n">{s.n}</span>
                <span className="ek-step__b"><b>{s.t}</b><i>{s.d}</i></span>
              </div>
            ))}
          </div>
          <div className="ek-cta">
            <CTAButton to="/beratung">Beratung anfragen <ArrowRight size={16} strokeWidth={2} /></CTAButton>
            <span className="ek-trust">Persönlich. Unverbindlich. Auf Augenhöhe.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
