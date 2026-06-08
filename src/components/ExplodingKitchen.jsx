import { useState } from 'react'
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

// representative progress value per clickable phase (drives the same ramps as the scroll version)
const PHASE_P = [0.05, 0.34, 0.62, 0.95]

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
  const [phase, setPhase] = useState(0)
  const [manual, setManual] = useState(null)

  const p = PHASE_P[phase]
  const step = phase
  const active = manual != null ? manual : phase
  const hotsOpacity = ramp(p, 0.24, 0.4, 0, 1)

  const goToPhase = (i) => { setPhase(i); setManual(null) }

  return (
    <section className="section section--light ek2">
      <div className="container ek-grid">
        <Copy />

        <div className="ek-stage">
          <span className="ek-glow" style={{ opacity: ramp(p, 0.12, 0.55, 0.3, 0.78) }} aria-hidden="true" />
          <span className="ek-floor" style={{ opacity: ramp(p, 0.2, 0.7, 0.16, 0.5) }} aria-hidden="true" />
          <img className="ek-img ek-img--assembled" src={assembled} alt="" aria-hidden="true" style={{ opacity: ramp(p, 0.10, 0.30, 1, 0), transform: `scale(${ramp(p, 0, 0.3, 1.0, 1.02)})` }} />
          <img className="ek-img ek-img--overview" src={overview} alt="Eine VIDEKO Küche – Schicht für Schicht durchdacht" style={{ opacity: ramp(p, 0.18, 0.40, 0, 1), transform: `scale(${ramp(p, 0.18, 1, 1.0, 1.07)}) translateY(${ramp(p, 0.2, 1, 0, -16)}px)` }} />
          <span className="ek-sweep" style={{ opacity: ramp(p, 0.18, 0.5, 0, 0.5) }} aria-hidden="true" />
          {CARDS.map((card, i) => (
            <button key={card.t} type="button" className={`ek-hot ${active === i ? 'is-active' : ''}`}
              style={{ left: `${card.x}%`, top: `${card.y}%`, opacity: hotsOpacity, pointerEvents: hotsOpacity > 0.5 ? 'auto' : 'none' }}
              onClick={() => setManual(i)} aria-label={`${card.t} hervorheben`}>
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
          <span className="ek-steps__line" aria-hidden="true"><span style={{ transform: `scaleX(${ramp(step, 0, 3, 0.08, 1)})` }} /></span>
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
    </section>
  )
}
