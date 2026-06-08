import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import Reveal from './Reveal.jsx'
import mainClosed from '../assets/images/ek-modal/main-closed.png'
import mainOpen from '../assets/images/ek-modal/main-open.png'

const HOTSPOTS = [
  { n: '01', title: 'Arbeitsplatte & Materialien', category: 'Material', x: 48, y: 51, description: 'Edle Optik trifft Alltagstauglichkeit – in Keramik, Quarz oder Naturstein, pflegeleicht und robust.', bullets: ['Robuste Oberflächen', 'Saubere Kanten & Übergänge', 'Materialauswahl passend zum Stil'] },
  { n: '02', title: 'Kochfeld auf der Insel', category: 'Kochen', x: 52, y: 61, description: 'Zentral auf der Insel platziert für kurze Wege und freie Bewegung – modernes Induktionskochfeld, bündig integriert.', bullets: ['Zentrale Kochzone', 'Bündig integriert', 'Kurze Wege beim Kochen'] },
  { n: '03', title: 'Spül- & Wasserzone', category: 'Wasser', x: 50, y: 43, description: 'Die Spüle sitzt bewusst an der Rückwand – ruhig integriert, logisch geplant und alltagstauglich.', bullets: ['Spüle bewusst an der Rückwand', 'Armatur passend zum Material', 'Stauraum unter der Spüle'] },
  { n: '04', title: 'Besteckauszug', category: 'Ordnung', x: 29, y: 73, description: 'Sauber gegliedert, leise laufend und im Alltag einfach Gold wert. Ordnung in jeder Schublade.', bullets: ['Durchdachte Unterteilung', 'Leiser Lauf', 'Schneller Zugriff im Alltag'] },
  { n: '05', title: 'Topf- & Pfannenauszug', category: 'Stauraum', x: 72, y: 76, description: 'Große Auszüge schaffen Platz für Töpfe, Pfannen und schweres Kochgeschirr – griffbereit, ohne Bücken.', bullets: ['Tiefe Auszüge', 'Flexible Trennsysteme', 'Starke Vollauszüge'] },
  { n: '06', title: 'Vorratsschrank & Innenleben', category: 'Hochschrank', x: 16, y: 36, description: 'Mehr Übersicht, weniger Suchen. Auszüge holen Vorräte und Geräte nach vorne.', bullets: ['Vorräte auf einen Blick', 'Höhe clever genutzt', 'Geräte elegant versteckt'] },
  { n: '07', title: 'Scharniere & Beschläge', category: 'Technik', x: 83, y: 34, description: 'Die wahre Qualität steckt im Detail: hochwertige Scharniere, stabile Auszüge, gedämpfte Beschläge.', bullets: ['Stabile Scharniere', 'Gedämpfte Beschläge', 'Leise Auszugssysteme'] },
  { n: '08', title: 'Beleuchtung & Atmosphäre', category: 'Licht', x: 67, y: 28, description: 'Gutes Licht macht mehr als hell: indirekte Beleuchtung, Arbeitslicht und stimmungsvolle Akzente.', bullets: ['Indirekte Beleuchtung', 'Arbeitslicht, wo es zählt', 'Warme Akzente für Atmosphäre'] },
]

export default function ExplodingKitchenModal() {
  const [open, setOpen] = useState(true) // false = geschlossen, true = geöffnet
  const [active, setActive] = useState(null) // hotspot index or null

  useEffect(() => {
    if (active === null) return
    const onKey = (e) => { if (e.key === 'Escape') setActive(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const h = active !== null ? HOTSPOTS[active] : null
  const sideR = h ? h.x < 50 : true // open toward image center
  const below = h ? h.y < 50 : true
  const popStyle = h
    ? {
        ...(sideR ? { left: `${h.x + 2.5}%` } : { right: `${100 - h.x + 2.5}%` }),
        ...(below ? { top: `${h.y}%` } : { bottom: `${100 - h.y}%` }),
      }
    : {}
  const popCls = h ? `ekm-pop--${sideR ? 'r' : 'l'} ekm-pop--${below ? 'b' : 'a'}` : ''

  return (
    <section className="section section--light ekm" id="exploding-kitchen-modal">
      <div className="container">
        <Reveal className="ekm-head">
          <span className="kicker">VIDEKO Exploding Kitchen</span>
          <h2 className="ekm-title">Außen schön. <span className="grad">Innen ziemlich clever.</span></h2>
          <p className="ekm-text">Eine gute Küche erkennt man nicht nur an der Front. Erst wenn Auszüge, Beschläge, Stauraum, Licht und Material zusammenspielen, wird aus einer schönen Küche ein Raum, der jeden Tag funktioniert.</p>
          <div className="ekm-toggle" role="tablist" aria-label="Ansicht wählen">
            <button type="button" role="tab" aria-selected={!open} className={`ekm-toggle__btn ${!open ? 'is-active' : ''}`} onClick={() => setOpen(false)}>Geschlossen</button>
            <button type="button" role="tab" aria-selected={open} className={`ekm-toggle__btn ${open ? 'is-active' : ''}`} onClick={() => setOpen(true)}>Geöffnet</button>
          </div>
        </Reveal>

        <Reveal className="ekm-stage" delay={0.1}>
          <div className="ekm-stagebg" onClick={() => setActive(null)} aria-hidden="true">
            <AnimatePresence mode="wait">
              <motion.img key={open ? 'open' : 'closed'} src={open ? mainOpen : mainClosed} alt="VIDEKO Küche" className="ekm-stage__img"
                initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
            </AnimatePresence>
          </div>

          {HOTSPOTS.map((hs, i) => (
            <button key={hs.n} type="button" className={`ekm-hot ${active === i ? 'is-active' : ''}`} style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
              onClick={(e) => { e.stopPropagation(); setActive(active === i ? null : i) }} aria-label={hs.title} aria-expanded={active === i}>
              <span className="ekm-hot__dot" />
              <span className="ekm-hot__label">{hs.n} · {hs.title}</span>
            </button>
          ))}

          <AnimatePresence>
            {h && (
              <motion.div key={active} className={`ekm-pop ${popCls}`} style={popStyle} onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
                <button type="button" className="ekm-pop__close" onClick={() => setActive(null)} aria-label="Schließen">×</button>
                <span className="ekm-pop__cat">{h.n} · {h.category}</span>
                <h3 className="ekm-pop__title">{h.title}</h3>
                <p className="ekm-pop__text">{h.description}</p>
                <ul className="ekm-pop__list">
                  {h.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <span className="ekm-hint">Klicke auf die Punkte und entdecke, was in der Planung wirklich zählt.</span>
        </Reveal>

        <p className="ekm-mini">Was du siehst: eine Küche. Was wir sehen: <span className="grad">187 Entscheidungen.</span> Material, Licht, Stauraum, Technik und Montage greifen ineinander – jedes Detail hat seinen Grund. Für Küchen, die bleiben.</p>
      </div>
    </section>
  )
}
