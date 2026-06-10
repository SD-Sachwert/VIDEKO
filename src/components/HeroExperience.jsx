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
  { icon: Boxes, t: 'Stauraumplanung', d: 'Stauraum ist wie WLAN – fehlt erst auf, wenn’s nervt.' },
  { icon: Lightbulb, t: 'Lichtkonzept', d: 'Kein Funzel-Drama über der Spüle.' },
  { icon: Cpu, t: 'Geräteintegration', d: 'Technik da, wo sie Sinn macht.' },
  { icon: Workflow, t: 'Ablaufplanung', d: 'Kein Halbmarathon beim Kochen.' },
  { icon: Ruler, t: 'Präzise Montage', d: 'Millimetergenau. Sauber. Verlässlich.' },
  { icon: Sparkles, t: 'Raumwirkung', d: 'Aus Raum wird Lieblingsplatz.' },
  { icon: UserCheck, t: 'Persönliche Planung', d: 'Keine Lösung von der Stange.' },
  { icon: Gem, t: 'Sitzplatzlösung', d: 'Wohnen, kochen, leben – zusammen gedacht.' },
  { icon: PencilRuler, t: 'Wand- & Deckenkonzept', d: 'Licht, Linien, Flächen und Ruhe.' },
  { icon: Ruler, t: 'Maßarbeit', d: 'Millimetergenau statt „passt schon".' },
  { icon: Workflow, t: 'Gewerke-Koordination', d: 'Wir steuern, du entspannst.' },
  { icon: Sparkles, t: 'Design + Funktion', d: 'Schön reicht nicht – es muss laufen.' },
  { icon: Cpu, t: 'Elektroplanung', d: 'Strom da, wo du ihn brauchst.' },
  { icon: Wrench, t: 'Komplettumbau', d: 'Wenn nötig, denken wir den ganzen Raum.' },
  { icon: ShieldCheck, t: 'Nachbetreuung', d: 'Erreichbar, auch nach der Montage.' },
  { icon: Layers, t: 'Raumkonzept', d: 'Wir denken den Raum, nicht nur Schränke.' },
  { icon: Gem, t: 'Materialwahl', d: 'Anfassen erlaubt – Bildschirm lecken nicht.' },
  { icon: Wrench, t: 'Anschlussplanung', d: 'Wasser & Strom dort, wo’s später passt.' },
  { icon: PencilRuler, t: 'Raumöffnung', d: 'Wand im Weg? Reden wir drüber.' },
  { icon: Workflow, t: 'Handwerkersteuerung', d: 'Wir jonglieren die Gewerke, nicht du.' },
  { icon: ShieldCheck, t: 'Betreuung von A–Z', d: 'Von erster Idee bis letzter Schraube.' },
  { icon: Lightbulb, t: 'Lichtplanung', d: 'Arbeitslicht, das wirklich arbeitet.' },
  { icon: Ruler, t: 'Ergonomie', d: 'Arbeitshöhe, die deinem Rücken gefällt.' },
  { icon: Wrench, t: 'Wasserplanung', d: 'Wasser & Abfluss sauber gedacht.' },
  { icon: Lightbulb, t: 'Akzentbeleuchtung', d: 'Licht, das auch Stimmung kann.' },
  { icon: Layers, t: 'Rückwand & Spritzschutz', d: 'Rückwand, die was aushält.' },
  { icon: Boxes, t: 'Ecknutzung', d: 'Jede Ecke arbeitet mit.' },
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
  { icon: Layers, t: 'Alles aus einer Hand', d: 'Planung, Koordination und Umsetzung zusammen gedacht.' },
  { icon: Sparkles, t: 'Mehr als nur Küche', d: 'Raum, Licht, Anschlüsse und Gewerke im Blick.' },
  { icon: Lightbulb, t: 'Vorher klar. Nachher wow.', d: 'Du siehst, was möglich ist, bevor etwas gebaut wird.' },
  { icon: Workflow, t: 'Weniger Chaos', d: 'Wir steuern den Ablauf, du musst nicht jonglieren.' },
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
          <span className="kicker">Der ganze Raum</span>
          <h1 className="hx-headline">Aus einem Raum wird nicht einfach eine Küche.<br /><span className="grad">Sondern dein neuer Lieblingsplatz.</span></h1>
          <p className="hx-sub">Von der ersten Idee über Planung, Material, Licht und Montage bis zur fertigen Küche.</p>
        </Reveal>
      </div>

      <div className="container hx-bigwrap">
        <Reveal className="hx-visual" delay={0.1}>
          <div className={`hx-ba ${dragging ? 'is-dragging' : ''}`} ref={baRef} onPointerDown={onDown} onPointerMove={onMovePtr} onPointerUp={onUp} onPointerLeave={onUp} onPointerCancel={onUp} style={{ '--split': `${split}%` }}>
            <div className="hx-ba__after"><img src={afterImg} alt="Fertige VIDEKO Küche" loading="lazy" draggable={false} /></div>
            <div className="hx-ba__before"><img src={beforeImg} alt="Leerer Raum vor der Planung" loading="lazy" draggable={false} /></div>
            <span className="hx-ba__line"><span className="hx-ba__knob"><ArrowRight size={13} strokeWidth={2.4} style={{ transform: 'rotate(180deg)' }} /><ArrowRight size={13} strokeWidth={2.4} /></span></span>
          </div>

          {HOTSPOTS.map((h, idx) => {
            let style
            if (idx < 14) {
              const side = idx % 2
              const row = Math.floor(idx / 2) // 0..6 je Seite
              const y = 1.5 + row * 14.5
              const rot = [-3, 2.4, -2, 3, -1.4, 2.6, -2.2][row] || 0
              // Spalten deutlich weiter nach außen (über den Bildrand hinaus) -> mehr Luft
              style = { top: `${y}%`, [side ? 'right' : 'left']: `${-12.5 + (row % 2) * 1.5}%`, '--r': `${rot}deg` }
            } else {
              const k = idx - 14 // 0..13 → 7 oben + 7 unten; Außenränder voll ausnutzen
              const onTop = k < 7
              const cols = [3, 17, 31, 45, 57, 69, 82]
              const left = cols[k % 7]
              const rot = [-2.4, 2, -1.6, 2.6, -2, 1.6, -1.8][k % 7]
              // obere & untere Reihe ~10% weiter nach außen gezogen
              const yoff = (k % 2) ? -16 : -12
              style = { [onTop ? 'top' : 'bottom']: `${yoff}%`, left: `${left}%`, '--r': `${rot}deg` }
            }
            return (
            <div key={h.t} className="hx-spot" style={style}>
              <span className="hx-spot__ic"><h.icon size={15} strokeWidth={1.8} /></span>
              <span className="hx-spot__b"><span className="hx-spot__t">{h.t}</span><span className="hx-spot__d">{h.d}</span></span>
            </div>
            )
          })}
        </Reveal>
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
