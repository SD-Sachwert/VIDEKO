import { useRef, useState, useEffect } from 'react'
import { useLenis } from 'lenis/react'
import { ArrowRight, Layers, Boxes, Lightbulb, Ruler } from 'lucide-react'

import CTAButton from './CTAButton.jsx'
import assembled from '../assets/images/exploding-kitchen/assembled.png'
import overview from '../assets/images/exploding-kitchen/overview.png'

const CARDS = [
  { t: 'Materialien', icon: Layers, d: 'Echte Materialien. Perfekt aufeinander abgestimmt.', more: ['Hochwertige Oberflächen mit Charakter', 'Haptik und Optik, die zusammenpassen', 'Langlebig statt kurzlebig'], x: 52, y: 17 },
  { t: 'Stauraum', icon: Boxes, d: 'Intelligent organisiert. Für mehr Platz und Überblick.', more: ['Durchdachte Innenorganisation für den Alltag', 'Jeder Bereich sinnvoll genutzt', 'Funktion ohne Kompromiss beim Design'], x: 33, y: 49 },
  { t: 'Lichtkonzept', icon: Lightbulb, d: 'Atmosphäre trifft Funktion. Für jede Stimmung das richtige Licht.', more: ['Arbeits-, Stimmungs- und Akzentlicht', 'Sehen, wo es zählt', 'Wohnlich auf Knopfdruck'], x: 65, y: 39 },
  { t: 'Präzise Montage', icon: Ruler, d: 'Millimetergenaue Planung. Saubere Umsetzung. Langlebige Perfektion.', more: ['Aufmaß und Montage aus einer Hand', 'Saubere Übergänge und Fugen', 'Bis ins Detail abgestimmt'], x: 50, y: 79 },
]

const STEPS = [
  { n: '01', t: 'Schön', d: 'Ästhetik & Design' },
  { n: '02', t: 'Exploded', d: 'Was dahinter steckt' },
  { n: '03', t: 'Technik', d: 'Intelligenz & Innovation' },
  { n: '04', t: 'Perfektion', d: 'Montage & Service' },
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

export default function ExplodingKitchenScroll() {
  const sectionRef = useRef(null)
  const lenis = useLenis()
  const [isDesktop, setDesktop] = useState(true)
  const [reduce, setReduce] = useState(false)
  const [p, setP] = useState(0)
  const [phase, setPhase] = useState('before')
  const [manual, setManual] = useState(null) // manual card selection (hotspot/card click)
  const lastStep = useRef(0)

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
      const st = Math.min(3, Math.floor(prog * 4))
      if (st !== lastStep.current) { lastStep.current = st; setManual(null) }
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [animated])

  const step = Math.min(3, Math.floor(p * 4))
  const active = manual != null ? manual : step

  const goToPhase = (i) => {
    const el = sectionRef.current
    if (!el) return
    const absTop = el.getBoundingClientRect().top + window.scrollY
    const total = el.offsetHeight - window.innerHeight
    const target = absTop + (i * 0.25 + 0.06) * total
    setManual(null)
    if (lenis) lenis.scrollTo(target, { duration: 1.1 })
    else window.scrollTo({ top: target, behavior: 'smooth' })
  }

  // ---- static fallback (tablet/mobile or reduced motion) ----
  if (!animated) {
    return (
      <section className="section section--light ek-sec ek-sec--static">
        <div className="container ek-static">
          <Copy />
          <div className="ek-stage ek-stage--static"><span className="ek-glow" /><img className="ek-img" src={overview} alt="Eine VIDEKO Küche – Schicht für Schicht durchdacht" loading="lazy" /></div>
          <div className="ek-cards ek-cards--static">
            {CARDS.map((card) => (
              <div key={card.t} className="ek-card">
                <span className="ek-card__head"><span className="ek-card__ic"><card.icon size={16} strokeWidth={1.8} /></span><span className="ek-card__t">{card.t}</span></span>
                <span className="ek-card__d">{card.d}</span>
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

  const hotsOpacity = ramp(p, 0.24, 0.4, 0, 1)

  return (
    <section className="ek-sec" ref={sectionRef}>
      <div className="ek-sticky" style={pinStyle}>
        <div className="container ek-grid">
          <Copy />

          <div className="ek-stage">
            <span className="ek-glow" style={{ opacity: ramp(p, 0.12, 0.55, 0.3, 0.78) }} aria-hidden="true" />
            <span className="ek-floor" style={{ opacity: ramp(p, 0.2, 0.7, 0.16, 0.5) }} aria-hidden="true" />
            <img className="ek-img ek-img--assembled" src={assembled} alt="" aria-hidden="true" style={{ opacity: ramp(p, 0.10, 0.30, 1, 0), transform: `scale(${ramp(p, 0, 0.3, 1.0, 1.02)})` }} />
            <img className="ek-img ek-img--overview" src={overview} alt="Eine VIDEKO Küche – Schicht für Schicht durchdacht" style={{ opacity: ramp(p, 0.18, 0.40, 0, 1), transform: `scale(${ramp(p, 0.18, 1, 1.0, 1.07)}) translateY(${ramp(p, 0.2, 1, 0, -16)}px)` }} />
            <span className="ek-sweep" style={{ opacity: ramp(p, 0.18, 0.5, 0, 0.5) }} aria-hidden="true" />
            {CARDS.map((card, i) => (
              <button
                key={card.t}
                type="button"
                className={`ek-hot ${active === i ? 'is-active' : ''}`}
                style={{ left: `${card.x}%`, top: `${card.y}%`, opacity: hotsOpacity, transitionDelay: `${i * 0.05}s` }}
                onClick={() => setManual(i)}
                aria-label={`${card.t} hervorheben`}
              >
                <span className="ek-hot__dot" />
              </button>
            ))}
          </div>

          <div className="ek-info">
            {CARDS.map((card, i) => (
              <button key={card.t} type="button" className={`ek-card ${active === i ? 'is-active' : ''}`} onClick={() => setManual(i)} aria-expanded={active === i}>
                <span className="ek-card__head"><span className="ek-card__ic"><card.icon size={16} strokeWidth={1.8} /></span><span className="ek-card__t">{card.t}</span></span>
                <span className="ek-card__d">{card.d}</span>
                <span className="ek-card__more">
                  <span className="ek-card__more-in">
                    {card.more.map((m) => <span key={m} className="ek-card__li">{m}</span>)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="container ek-progress">
          <div className="ek-steps">
            <span className="ek-steps__line" aria-hidden="true"><span style={{ transform: `scaleX(${ramp(p, 0, 1, 0.05, 1)})` }} /></span>
            {STEPS.map((s, i) => (
              <button key={s.n} type="button" className={`ek-step ${step === i ? 'is-active' : ''} ${step > i ? 'is-done' : ''}`} onClick={() => goToPhase(i)}>
                <span className="ek-step__n">{s.n}</span>
                <span className="ek-step__b"><b>{s.t}</b><i>{s.d}</i></span>
              </button>
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
