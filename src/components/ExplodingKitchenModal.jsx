import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import Reveal from './Reveal.jsx'
import mainClosed from '../assets/images/ek-modal/main-closed.png'
import mainOpen from '../assets/images/ek-modal/main-open.png'
import card1 from '../assets/images/ek-modal/card1.png'
import card2 from '../assets/images/ek-modal/card2.png'
import card3 from '../assets/images/ek-modal/card3.png'
import card4 from '../assets/images/ek-modal/card4.png'
import card5 from '../assets/images/ek-modal/card5.png'
import card6 from '../assets/images/ek-modal/card6.png'
import card7 from '../assets/images/ek-modal/card7.png'
import card8 from '../assets/images/ek-modal/card8.png'

const HOTSPOTS = [
  { n: '01', title: 'Arbeitsplatte & Materialien', x: 48, y: 51, card: card1 },
  { n: '02', title: 'Kochfeld auf der Insel', x: 52, y: 61, card: card2 },
  { n: '03', title: 'Spül- & Wasserzone', x: 50, y: 43, card: card3 },
  { n: '04', title: 'Besteckauszug', x: 29, y: 73, card: card4 },
  { n: '05', title: 'Topf- & Pfannenauszug', x: 72, y: 76, card: card5 },
  { n: '06', title: 'Vorratsschrank & Innenleben', x: 16, y: 36, card: card6 },
  { n: '07', title: 'Scharniere & Beschläge', x: 83, y: 34, card: card7 },
  { n: '08', title: 'Beleuchtung & Atmosphäre', x: 67, y: 28, card: card8 },
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
  // large side-card: opens on the side opposite the hotspot so it has room
  const panelLeft = h ? h.x >= 50 : false
  const wrapStyle = h ? (panelLeft ? { left: '3%' } : { right: '3%' }) : {}
  const arrowSide = panelLeft ? 'r' : 'l'

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
              <div className="ekm-popwrap" style={wrapStyle}>
                <motion.div key={active} className={`ekm-pop ekm-pop--${arrowSide}`} onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                  <button type="button" className="ekm-pop__close" onClick={() => setActive(null)} aria-label="Schließen">×</button>
                  <img className="ekm-pop__img" src={h.card} alt={h.title} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <span className="ekm-hint">Klicke auf die Punkte und entdecke, was in der Planung wirklich zählt.</span>
        </Reveal>

        <p className="ekm-mini">Was du siehst: eine Küche. Was wir sehen: <span className="grad">187 Entscheidungen.</span> Material, Licht, Stauraum, Technik und Montage greifen ineinander – jedes Detail hat seinen Grund. Für Küchen, die bleiben.</p>
      </div>
    </section>
  )
}
