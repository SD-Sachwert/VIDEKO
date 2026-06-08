import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Boxes, Layers, Lightbulb, Cpu, Ruler } from 'lucide-react'

import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'
import stageRoom from '../assets/images/ek-showcase/stage-room.png'
import stageExploded from '../assets/images/ek-showcase/stage-exploded.png'
import stageDetails from '../assets/images/ek-showcase/stage-details.png'
import dStauraum from '../assets/images/ek-showcase/d-stauraum.png'
import dMaterialien from '../assets/images/ek-showcase/d-materialien.png'
import dArbeitsplatte from '../assets/images/ek-showcase/d-arbeitsplatte.png'
import dLicht from '../assets/images/ek-showcase/d-licht.png'
import dGeraete from '../assets/images/ek-showcase/d-geraete.png'
import dMontage from '../assets/images/ek-showcase/d-montage.png'

const VIEWS = [
  { id: 'gesamt', label: 'Gesamtansicht', img: stageRoom },
  { id: 'exploded', label: 'Exploded', img: stageExploded },
  { id: 'details', label: 'Details', img: stageDetails },
]

const THEMES = [
  { id: 'stauraum', icon: Boxes, n: '01', title: 'Stauraum', x: 41, y: 66,
    text: 'Intelligenter Stauraum, der begeistert – hochwertig, durchdacht und bis ins Detail perfekt organisiert.',
    bullets: ['Vollauszug mit Dämpfung', 'Hochwertige Innenorganisation', 'Mehr Überblick im Alltag'], imgs: [dStauraum, dMaterialien] },
  { id: 'materialien', icon: Layers, n: '02', title: 'Materialien', x: 50, y: 46,
    text: 'Oberflächen, Kanten und Haptik entscheiden, ob eine Küche nur gut aussieht – oder sich jeden Tag gut anfühlt.',
    bullets: ['Starke Materialwirkung', 'Feine Kanten und Übergänge', 'Abgestimmt auf Raum und Licht'], imgs: [dMaterialien, dArbeitsplatte] },
  { id: 'licht', icon: Lightbulb, n: '03', title: 'Lichtkonzept', x: 52, y: 14,
    text: 'Licht führt den Blick, schafft Atmosphäre und macht aus Funktion ein Erlebnis.',
    bullets: ['Arbeitslicht dort, wo es gebraucht wird', 'Indirektes Licht für Atmosphäre', 'Stimmige Inszenierung von Material und Raum'], imgs: [dLicht, dArbeitsplatte] },
  { id: 'geraete', icon: Cpu, n: '04', title: 'Geräte & Integration', x: 56, y: 30,
    text: 'Technik soll nicht schreien. Sie soll funktionieren, sich einfügen und den Alltag leichter machen.',
    bullets: ['Geräte bündig integriert', 'Kurze Wege in der Nutzung', 'Klares Design ohne Technik-Chaos'], imgs: [dGeraete, dArbeitsplatte] },
  { id: 'montage', icon: Ruler, n: '05', title: 'Montage & Präzision', x: 55, y: 84,
    text: 'Der schönste Entwurf bringt nichts, wenn am Ende Spaltmaße, Anschlüsse und Details nicht sitzen.',
    bullets: ['Saubere Konstruktion', 'Präzise Ausrichtung', 'Langlebige Umsetzung'], imgs: [dMontage, dMaterialien] },
]

export default function ExplodingKitchen() {
  const [view, setView] = useState('exploded')
  const [active, setActive] = useState(0)
  const theme = THEMES[active]
  const stageImg = VIEWS.find((v) => v.id === view).img

  return (
    <section className="section section--light eks" id="exploding-kitchen">
      <div className="container eks-shell">
        <Reveal className="eks-copy">
          <span className="kicker">Technik, die man nicht nur sieht</span>
          <h2 className="eks-headline">Exploding <span className="grad">Kitchen</span> Showcase</h2>
          <p className="eks-body">Erlebe perfekte Handwerkskunst bis ins Detail. Interaktiv. Transparent. Für höchste Ansprüche.</p>
          <p className="eks-accent">Für Küchen, die bleiben.</p>
          <div className="eks-toggle" role="tablist" aria-label="Ansicht wählen">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" role="tab" aria-selected={view === v.id} className={`eks-toggle__btn ${view === v.id ? 'is-active' : ''}`} onClick={() => setView(v.id)}>{v.label}</button>
            ))}
          </div>
        </Reveal>

        <div className="eks-stage">
          <AnimatePresence mode="wait">
            <motion.img key={view} src={stageImg} alt="VIDEKO Küche im Detail" className="eks-stage__img"
              initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.01 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
          </AnimatePresence>
          {THEMES.map((t, i) => (
            <button key={t.id} type="button" className={`eks-hot ${active === i ? 'is-active' : ''} ${view === 'gesamt' ? 'is-dim' : ''}`}
              style={{ left: `${t.x}%`, top: `${t.y}%` }} onClick={() => setActive(i)} aria-label={t.title}>
              <span className="eks-hot__n">{t.n}</span>
              <span className="eks-hot__label">{t.title}</span>
            </button>
          ))}
          <span className="eks-hint">Klick auf die Punkte und entdecke, was in der Planung wirklich zählt.</span>
        </div>

        <div className="eks-panel">
          <AnimatePresence mode="wait">
            <motion.div key={theme.id} className="eks-panel__card"
              initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <span className="eks-panel__ic"><theme.icon size={20} strokeWidth={1.7} /></span>
              <span className="eks-panel__eyebrow">Aktiver Bereich</span>
              <h3 className="eks-panel__title">{theme.title}</h3>
              <p className="eks-panel__text">{theme.text}</p>
              <ul className="eks-panel__list">
                {theme.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
              <div className="eks-panel__thumbs">
                {theme.imgs.map((src, k) => <span key={k} className="eks-thumb" style={{ backgroundImage: `url(${src})` }} aria-hidden="true" />)}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="eks-nav">
            {THEMES.map((t, i) => (
              <button key={t.id} type="button" className={`eks-nav__item ${active === i ? 'is-active' : ''}`} onClick={() => setActive(i)}>
                <t.icon size={16} strokeWidth={1.8} /> <span>{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container eks-ctabar">
        <div className="eks-ctabar__text">
          <b>Persönlich. Unverbindlich. Auf Augenhöhe.</b>
          <span>Wir nehmen uns Zeit für deine Wünsche.</span>
        </div>
        <CTAButton to="/beratung">Beratung anfragen <ArrowRight size={16} strokeWidth={2} /></CTAButton>
      </div>
    </section>
  )
}
