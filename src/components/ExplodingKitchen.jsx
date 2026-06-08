import { useRef, useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'

import CTAButton from './CTAButton.jsx'
import overview from '../assets/images/exploding-kitchen/overview.png'
import assembled from '../assets/images/exploding-kitchen/assembled.png'
import lBase from '../assets/images/exploding-kitchen/l-base.png'
import lTechnical from '../assets/images/exploding-kitchen/l-technical.png'
import lStorage from '../assets/images/exploding-kitchen/l-storage.png'
import lShell from '../assets/images/exploding-kitchen/l-shell.png'
import lFrame from '../assets/images/exploding-kitchen/l-frame.png'
import lCountertop from '../assets/images/exploding-kitchen/l-countertop.png'
import streaks from '../assets/images/exploding-kitchen/streaks.png'
import shadow from '../assets/images/exploding-kitchen/shadow.png'

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

// piecewise-linear ramp
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
  const [phase, setPhase] = useState('before') // before | pinned | after — fixed-based pin (sticky breaks under Lenis/overflow-clip)

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
          <img className="ek-static__img" src={overview} alt="Eine VIDEKO Küche – Schicht für Schicht durchdacht" loading="lazy" />
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

  const tf = (x, y) => ({ transform: `translate3d(${x}px, ${y}px, 0)` })
  const pinStyle = phase === 'pinned'
    ? { position: 'fixed', top: 0, left: 0 }
    : phase === 'after'
      ? { position: 'absolute', bottom: 0, left: 0 }
      : { position: 'absolute', top: 0, left: 0 }

  return (
    <section className="ek-sec" ref={sectionRef}>
      <div className="ek-sticky" style={pinStyle}>
        <div className="container ek-grid">
          <Copy />

          <div className="ek-stage" aria-hidden="true">
            <img className="ek-streaks" src={streaks} alt="" style={{ opacity: ramp(p, 0.1, 0.6, 0.12, 0.4), transform: `translateX(${ramp(p, 0, 1, -4, 12)}%)` }} />
            <img className="ek-shadow" src={shadow} alt="" style={{ opacity: ramp(p, 0.2, 0.7, 0.25, 0.66) }} />
            <img className="ek-l-base" src={lBase} alt="" style={tf(ramp(p, 0.35, 0.70, 0, 10), ramp(p, 0.35, 0.70, 0, 220))} />
            <img className="ek-l-tech" src={lTechnical} alt="" style={tf(ramp(p, 0.30, 0.65, 0, 25), ramp(p, 0.30, 0.65, 0, 150))} />
            <img className="ek-l-storage" src={lStorage} alt="" style={tf(ramp(p, 0.25, 0.58, 0, -35), ramp(p, 0.25, 0.58, 0, 90))} />
            <img className="ek-l-shell" src={lShell} alt="" style={tf(0, ramp(p, 0.22, 0.52, 0, 0))} />
            <img className="ek-l-frame" src={lFrame} alt="" style={tf(0, ramp(p, 0.18, 0.48, 0, -90))} />
            <img className="ek-l-countertop" src={lCountertop} alt="" style={tf(ramp(p, 0.15, 0.45, 0, -20), ramp(p, 0.15, 0.45, 0, -160))} />
            <img className="ek-assembled" src={assembled} alt="Luxuriöse VIDEKO Küche" style={{ opacity: ramp(p, 0.10, 0.20, 1, 0) }} />
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
