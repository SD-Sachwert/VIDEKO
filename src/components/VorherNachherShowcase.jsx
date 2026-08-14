import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wrench, Repeat, Sparkles, ArrowRight, ArrowLeftRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import { KiHinweis } from './legal/KiKennzeichnung.jsx'
import vorher1 from '../assets/images/vorher-nachher/vorher-1.webp'
import vorher2 from '../assets/images/vorher-nachher/vorher-2.webp'
import vorher3 from '../assets/images/vorher-nachher/vorher-3.webp'
import nachher1 from '../assets/images/vorher-nachher/nachher-1.webp'
import nachher2 from '../assets/images/vorher-nachher/nachher-2.webp'
import nachher3 from '../assets/images/vorher-nachher/nachher-3.webp'

const CARDS = [
  { v: vorher1, n: nachher1, pos: 'side' },
  { v: vorher2, n: nachher2, pos: 'center' },
  { v: vorher3, n: nachher3, pos: 'side' },
]

const BENEFITS = [
  { icon: Wrench, t: 'Umbau-Ideen' },
  { icon: Repeat, t: 'Vorher / Nachher' },
  { icon: Sparkles, t: 'Inspiration' },
]

function VncCard({ v, n, pos }) {
  const ref = useRef(null)
  const [split, setSplit] = useState(50)
  const [drag, setDrag] = useState(false)

  const setFromX = (clientX) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setSplit(Math.min(94, Math.max(6, ((clientX - r.left) / r.width) * 100)))
  }
  const onDown = (e) => { setDrag(true); setFromX(e.clientX); if (e.currentTarget.setPointerCapture && e.pointerId != null) try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ } }
  const onMove = (e) => { if (drag) setFromX(e.clientX) }
  const onUp = () => setDrag(false)

  return (
    <div className={`vnc-card vnc-card--${pos} ${drag ? 'is-drag' : ''}`} ref={ref} style={{ '--split': `${split}%` }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp}>
      <span className="vnc-card__after" style={{ backgroundImage: `url(${n})` }} aria-hidden="true" />
      <span className="vnc-card__before" style={{ backgroundImage: `url(${v})` }} aria-hidden="true" />
      <span className="vnc-card__lbl vnc-card__lbl--v">Vorher</span>
      <span className="vnc-card__lbl vnc-card__lbl--n">Nachher</span>
      <span className="vnc-card__handle" style={{ left: `var(--split)` }}>
        <span className="vnc-card__knob"><ArrowLeftRight size={13} strokeWidth={2.4} /></span>
      </span>
    </div>
  )
}

export default function VorherNachherShowcase() {
  return (
    <section className="section vnc-sec">
      <span className="vnc-sec__glow" aria-hidden="true" />
      <div className="container">
        <Reveal className="vnc__head">
          <span className="kicker kicker--gold">Vorher / Nachher</span>
          <h2 className="vnc__title">Aus alt wird <span className="grad">wow.</span></h2>
          <p className="vnc__sub">Zieh am Regler – und sieh, was in deinem Raum möglich wird.</p>
        </Reveal>

        <Reveal className="vnc__cards" delay={0.06}>
          {CARDS.map((cd, i) => <VncCard key={i} {...cd} />)}
        </Reveal>
        <KiHinweis className="vnc__ainote" text="Beispieldarstellungen – teils KI-generiert." />

        <div className="vnc__benefits">
          {BENEFITS.map((b) => (
            <span key={b.t} className="vnc__benefit"><b.icon size={15} strokeWidth={1.9} /> {b.t}</span>
          ))}
        </div>

        <Reveal className="vnc__cta" delay={0.1}>
          <Link to="/vorher-nachher" className="vnc__btn">Mehr Verwandlungen entdecken <ArrowRight size={16} strokeWidth={2.2} /></Link>
        </Reveal>
      </div>
    </section>
  )
}
