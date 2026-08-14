import { useRef, useState } from 'react'
import { Users, MessageSquare, Box, Layers, Workflow, Home, ArrowLeftRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import s1 from '../assets/images/process2/s1.webp'
import s2 from '../assets/images/process2/s2.webp'
import s3 from '../assets/images/process2/s3.webp'
import s4 from '../assets/images/process2/s4.webp'
import s5 from '../assets/images/process2/s5.webp'
import vorher from '../assets/images/process2/vorher.webp'
import nachher from '../assets/images/process2/nachher.webp'

const STEPS = [
  { n: '01', icon: Users, t: 'Kennenlernen', d: 'Wir lernen dich und deinen Raum kennen.', img: s1 },
  { n: '02', icon: MessageSquare, t: 'Beratung', d: 'Ehrlich, persönlich, ohne Druck.', img: s2 },
  { n: '03', icon: Box, t: 'Planung in 3D / VR', d: 'Du siehst dein Ergebnis vorab.', img: s3 },
  { n: '04', icon: Layers, t: 'Details & Materialien', d: 'Wir feilen, bis alles passt.', img: s4 },
  { n: '05', icon: Workflow, t: 'Koordination & Umbau', d: 'Wir steuern Gewerke und Montage.', img: s5 },
  { n: '06', icon: Home, t: 'Fertiges Ergebnis', d: 'Dein neuer Raum – zum Verlieben.', ba: true },
]

function BeforeAfterMini() {
  const ref = useRef(null)
  const [split, setSplit] = useState(50)
  const [drag, setDrag] = useState(false)
  const move = (clientX) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setSplit(Math.min(94, Math.max(6, ((clientX - r.left) / r.width) * 100)))
  }
  return (
    <span
      className={`proc2ba ${drag ? 'is-drag' : ''}`}
      ref={ref}
      style={{ '--split': `${split}%` }}
      aria-label="Vorher / Nachher – Regler ziehen"
      onPointerDown={(e) => { e.preventDefault(); setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX) }}
      onPointerMove={(e) => { if (drag) move(e.clientX) }}
      onPointerUp={(e) => { setDrag(false); try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* noop */ } }}
      onPointerCancel={() => setDrag(false)}
    >
      <span className="proc2ba__after" style={{ backgroundImage: `url(${nachher})` }} aria-hidden="true" />
      <span className="proc2ba__before" style={{ backgroundImage: `url(${vorher})` }} aria-hidden="true" />
      <span className="proc2ba__line"><span className="proc2ba__handle"><ArrowLeftRight size={13} strokeWidth={2.4} /></span></span>
    </span>
  )
}

export default function ProcessSection() {
  return (
    <section className="section section--light proc2">
      <div className="container">
        <Reveal className="proc2__head">
          <span className="kicker">Unser Prozess</span>
          <h2 className="proc2__title">So entsteht aus deinem Raum<br /><span className="grad">dein Lieblingsort.</span></h2>
        </Reveal>

        <div className="proc2__flow">
          <svg className="proc2__wave" viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 40,170 C 140,90 240,90 340,150 S 540,210 640,140 S 840,70 940,130 S 1100,180 1160,110" fill="none" stroke="url(#pg)" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="rgba(184,149,79,0)" />
                <stop offset="0.12" stopColor="rgba(184,149,79,0.7)" />
                <stop offset="0.88" stopColor="rgba(184,149,79,0.7)" />
                <stop offset="1" stopColor="rgba(184,149,79,0)" />
              </linearGradient>
            </defs>
          </svg>

          <div className="proc2__grid">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} className={`proc2card ${i % 2 === 0 ? 'is-up' : 'is-down'}`} delay={i * 0.07}>
                <span className="proc2card__node" aria-hidden="true" />
                <span className="proc2card__top">
                  <span className="proc2card__ic"><s.icon size={23} strokeWidth={1.7} /></span>
                  <span className="proc2card__n">{s.n}</span>
                </span>
                <span className="proc2card__t">{s.t}</span>
                <span className="proc2card__d">{s.d}</span>
                {s.ba ? (
                  <BeforeAfterMini />
                ) : (
                  <span className="proc2card__media" style={{ backgroundImage: `url(${s.img})` }} aria-hidden="true" />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
