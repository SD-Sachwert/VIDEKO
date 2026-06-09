import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, Lightbulb, Ruler, Clock, Gem, ShieldCheck, PencilRuler, Wrench, Layers, Cpu, Workflow, Sparkles, UserCheck } from 'lucide-react'

import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'
import beforeImg from '../assets/images/home-hero/before.png'
import afterImg from '../assets/images/home-hero/after.png'
import cardInsp from '../assets/images/home-hero/card-inspiration.png'
import cardStyle from '../assets/images/home-hero/card-stylefinder.png'
import cardBer from '../assets/images/home-hero/card-beratung.png'

const HOTSPOTS = [
  { icon: Layers, t: 'Materialkonzept', d: 'Oberflächen, die zum Alltag passen.' },
  { icon: Boxes, t: 'Stauraumplanung', d: 'Mehr Platz für das, was zählt.' },
  { icon: Lightbulb, t: 'Lichtkonzept', d: 'Stimmung schaffen, Funktion betonen.' },
  { icon: Cpu, t: 'Geräteintegration', d: 'Technik da, wo sie Sinn macht.' },
  { icon: Workflow, t: 'Ablaufplanung', d: 'Kein Halbmarathon beim Kochen.' },
  { icon: Ruler, t: 'Präzise Montage', d: 'Millimetergenau. Sauber. Verlässlich.' },
  { icon: Sparkles, t: 'Raumwirkung', d: 'Aus Raum wird Lieblingsplatz.' },
  { icon: UserCheck, t: 'Persönliche Planung', d: 'Keine Lösung von der Stange.' },
  { icon: Gem, t: 'Sitzplatzlösung', d: 'Wohnen, kochen, leben zusammen gedacht.' },
  { icon: PencilRuler, t: 'Wand- & Deckenkonzept', d: 'Licht, Linien, Flächen und Ruhe.' },
  { icon: Ruler, t: 'Maßarbeit', d: 'Millimetergenau statt „passt schon".' },
  { icon: Workflow, t: 'Gewerke-Koordination', d: 'Wir steuern, du entspannst.' },
  { icon: Sparkles, t: 'Design + Funktion', d: 'Schön reicht nicht – es muss laufen.' },
  { icon: Cpu, t: 'Elektroplanung', d: 'Strom da, wo du ihn brauchst.' },
  { icon: Wrench, t: 'Komplettumbau', d: 'Wenn nötig, denken wir den ganzen Raum.' },
  { icon: ShieldCheck, t: 'Nachbetreuung & Service', d: 'Erreichbar, auch nach der Montage.' },
]

const BAUSTEINE = [
  'Materialkonzept', 'Stauraumplanung', 'Lichtkonzept', 'Geräteintegration', 'Ablaufplanung',
  'Sitzplatzlösung', 'Raumwirkung', 'Wand- & Deckenkonzept', 'Maßarbeit', 'Präzise Montage',
  'Gewerke-Koordination', 'Persönliche Planung', 'Design + Funktion', 'Elektroplanung',
  'Wasser- & Anschlussplanung', 'Handwerkersteuerung', 'Komplettumbau', 'Betreuung von A bis Z',
]

const ENTRIES = [
  { n: '01', img: cardInsp, title: 'Inspiration finden', text: 'Entdecke Stile, Materialien und Ideen für die Küche, die zu dir passt.', cta: 'Jetzt entdecken', to: '/inspiration' },
  { n: '02', img: cardStyle, title: 'Stylefinder starten', text: 'In 2 Minuten zu deiner individuellen Küchenrichtung.', cta: 'Jetzt starten', to: '/stylefinder' },
  { n: '03', img: cardBer, title: 'Persönliche Beratung', text: 'Gemeinsam planen wir deine Traumküche – ehrlich und auf Augenhöhe.', cta: 'Termin sichern', to: '/beratung' },
]

const TRUST = [
  { icon: Gem, t: 'Premium Qualität', d: 'Ausgewählte Materialien & führende Marken.' },
  { icon: ShieldCheck, t: 'Persönlich & verlässlich', d: 'Ein Ansprechpartner. Ein Versprechen.' },
  { icon: PencilRuler, t: 'Individuell geplant', d: 'Maßgeschneiderte Lösungen für deinen Raum.' },
  { icon: Wrench, t: 'Meisterhaft umgesetzt', d: 'Präzise Montage durch erfahrene Profis.' },
]

export default function HeroExperience() {
  const baRef = useRef(null)
  const [split, setSplit] = useState(54)
  const [dragging, setDragging] = useState(false)

  const setFromClient = (clientX) => {
    const el = baRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((clientX - r.left) / r.width) * 100
    setSplit(Math.min(92, Math.max(8, x)))
  }
  const onDown = (e) => { setDragging(true); setFromClient(e.clientX); if (e.currentTarget.setPointerCapture && e.pointerId != null) try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* noop */ } }
  const onMovePtr = (e) => { if (dragging) setFromClient(e.clientX) }
  const onUp = () => setDragging(false)

  return (
    <section className="section section--light hx-sec">
      <div className="container hx-introwrap">
        <Reveal className="hx-intro">
          <span className="kicker">Dein Einstieg</span>
          <h1 className="hx-headline">Aus einem Raum wird nicht einfach eine Küche.<br /><span className="grad">Sondern dein neuer Lieblingsplatz.</span></h1>
          <p className="hx-sub">Von der ersten Idee über Planung, Material, Licht und Montage bis zur fertigen Küche.</p>
          <div className="hx-actions">
            <CTAButton to="/stylefinder">Stylefinder starten</CTAButton>
            <CTAButton to="/beratung" variant="dark">Beratung anfragen</CTAButton>
          </div>
          <span className="hx-micro"><Clock size={15} strokeWidth={1.8} /> Dauert kürzer als drei Stunden planlos Küchen googeln.</span>
        </Reveal>
      </div>

      <div className="container hx-bigwrap">
        <Reveal className="hx-visual" delay={0.1}>
          <div className={`hx-ba ${dragging ? 'is-dragging' : ''}`} ref={baRef} onPointerDown={onDown} onPointerMove={onMovePtr} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp} style={{ '--split': `${split}%` }}>
            <div className="hx-ba__after"><img src={afterImg} alt="Fertige VIDEKO Küche" loading="lazy" draggable={false} /></div>
            <div className="hx-ba__before"><img src={beforeImg} alt="Leerer Raum vor der Planung" loading="lazy" draggable={false} />
              <span className="hx-meas hx-meas--top">3,20 m</span>
              <span className="hx-meas hx-meas--left">2,80 m</span>
              <span className="hx-meas hx-meas--bottom">5,10 m</span>
            </div>
            <span className="hx-ba__line"><span className="hx-ba__knob"><ArrowRight size={13} strokeWidth={2.4} style={{ transform: 'rotate(180deg)' }} /><ArrowRight size={13} strokeWidth={2.4} /></span></span>
          </div>

          {HOTSPOTS.map((h, idx) => {
            const side = idx % 2
            const row = Math.floor(idx / 2)
            const y = 1 + row * 13.6
            const xj = (row % 3) * 1.7
            const rot = [-3, 2.4, -2, 3, -1.4, 2.6, -2.6, 1.6][row] || 0
            const style = { top: `${y}%`, [side ? 'right' : 'left']: `${0.5 + xj}%`, '--r': `${rot}deg` }
            return (
            <div key={h.t} className="hx-spot" style={style}>
              <span className="hx-spot__ic"><h.icon size={15} strokeWidth={1.8} /></span>
              <span className="hx-spot__b"><span className="hx-spot__t">{h.t}</span><span className="hx-spot__d">{h.d}</span></span>
            </div>
            )
          })}
        </Reveal>
      </div>

      <div className="container hx-entries">
        {ENTRIES.map((c, i) => (
          <Reveal key={c.n} delay={i * 0.08}>
            <Link to={c.to} className="hx-card">
              <span className="hx-card__media"><img src={c.img} alt="" loading="lazy" /><span className="hx-card__n">{c.n}</span></span>
              <span className="hx-card__body">
                <span className="hx-card__title">{c.title}</span>
                <span className="hx-card__text">{c.text}</span>
                <span className="hx-card__cta">{c.cta} <ArrowRight size={15} strokeWidth={2} /></span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="container hx-trust">
        {TRUST.map((t, i) => (
          <Reveal key={t.t} as="div" className="hx-trust__col" delay={i * 0.06}>
            <span className="hx-trust__ic"><t.icon size={20} strokeWidth={1.6} /></span>
            <span className="hx-trust__t">{t.t}</span>
            <span className="hx-trust__d">{t.d}</span>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
