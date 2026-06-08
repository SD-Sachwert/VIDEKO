import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, Lightbulb, Ruler, Clock, Gem, ShieldCheck, PencilRuler, Wrench } from 'lucide-react'

import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'
import beforeImg from '../assets/images/home-hero/before.png'
import afterImg from '../assets/images/home-hero/after.png'
import cardInsp from '../assets/images/home-hero/card-inspiration.png'
import cardStyle from '../assets/images/home-hero/card-stylefinder.png'
import cardBer from '../assets/images/home-hero/card-beratung.png'

const HOTSPOTS = [
  { icon: Boxes, t: 'Stauraum', d: 'Intelligent geplant. Mehr Platz für das, was zählt.', cls: 'hx-spot--a' },
  { icon: Lightbulb, t: 'Lichtkonzept', d: 'Stimmung schaffen. Funktion betonen. Atmosphäre formen.', cls: 'hx-spot--b' },
  { icon: Ruler, t: 'Präzise Montage', d: 'Millimetergenau. Sauber. Verlässlich.', cls: 'hx-spot--c' },
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

  const onMove = (e) => {
    const el = baRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    setSplit(Math.min(88, Math.max(12, x)))
  }

  return (
    <section className="section section--light hx-sec">
      <div className="container hx-hero">
        <Reveal className="hx-copy">
          <span className="kicker">Dein Einstieg</span>
          <h1 className="hx-headline">Aus einem Raum wird nicht einfach eine Küche.<br /><span className="grad">Sondern dein neuer Lieblingsplatz.</span></h1>
          <p className="hx-sub">Von der ersten Idee über Planung, Material, Licht und Montage bis zur fertigen Küche.</p>
          <div className="hx-actions">
            <CTAButton to="/stylefinder">Stylefinder starten</CTAButton>
            <CTAButton to="/beratung" variant="dark">Beratung anfragen</CTAButton>
          </div>
          <span className="hx-micro"><Clock size={15} strokeWidth={1.8} /> Dauert kürzer als drei Stunden planlos Küchen googeln.</span>
        </Reveal>

        <Reveal className="hx-visual" delay={0.12}>
          <div className="hx-ba" ref={baRef} onMouseMove={onMove} style={{ '--split': `${split}%` }}>
            <div className="hx-ba__after"><img src={afterImg} alt="Fertige VIDEKO Küche" loading="lazy" /></div>
            <div className="hx-ba__before"><img src={beforeImg} alt="Leerer Raum vor der Planung" loading="lazy" />
              <span className="hx-meas hx-meas--top">3,20 m</span>
              <span className="hx-meas hx-meas--left">2,80 m</span>
              <span className="hx-meas hx-meas--bottom">5,10 m</span>
            </div>
            <span className="hx-ba__line"><span className="hx-ba__knob"><ArrowRight size={13} strokeWidth={2.4} style={{ transform: 'rotate(180deg)' }} /><ArrowRight size={13} strokeWidth={2.4} /></span></span>
            <span className="hx-ba__tag hx-ba__tag--l">Vorher</span>
            <span className="hx-ba__tag hx-ba__tag--r">Nachher</span>
          </div>

          {HOTSPOTS.map((h) => (
            <div key={h.t} className={`hx-spot ${h.cls}`}>
              <span className="hx-spot__ic"><h.icon size={16} strokeWidth={1.8} /></span>
              <span className="hx-spot__b"><span className="hx-spot__t">{h.t}</span><span className="hx-spot__d">{h.d}</span></span>
            </div>
          ))}
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
