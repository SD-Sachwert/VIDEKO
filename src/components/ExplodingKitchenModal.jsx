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

const CARDS = [card1, card2, card3, card4, card5, card6, card7, card8]

const HOTSPOTS = [
  { n: '01', title: 'Arbeitsplatte & Materialien', x: 48, y: 51 },
  { n: '02', title: 'Kochfeld auf der Insel', x: 52, y: 61 },
  { n: '03', title: 'Spül- & Wasserzone', x: 50, y: 43 },
  { n: '04', title: 'Besteckauszug', x: 29, y: 73 },
  { n: '05', title: 'Topf- & Pfannenauszug', x: 72, y: 76 },
  { n: '06', title: 'Vorratsschrank & Innenleben', x: 16, y: 36 },
  { n: '07', title: 'Scharniere & Beschläge', x: 83, y: 34 },
  { n: '08', title: 'Beleuchtung & Atmosphäre', x: 67, y: 28 },
]

export default function ExplodingKitchenModal() {
  const [open, setOpen] = useState(true) // false = geschlossen, true = geöffnet/exploded
  const [modal, setModal] = useState(null) // hotspot index or null

  useEffect(() => {
    if (modal === null) return
    const onKey = (e) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal])

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
          <AnimatePresence mode="wait">
            <motion.img key={open ? 'open' : 'closed'} src={open ? mainOpen : mainClosed} alt="VIDEKO Küche" className="ekm-stage__img"
              initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />
          </AnimatePresence>
          {HOTSPOTS.map((h, i) => (
            <button key={h.n} type="button" className="ekm-hot" style={{ left: `${h.x}%`, top: `${h.y}%` }} onClick={() => setModal(i)} aria-label={h.title}>
              <span className="ekm-hot__dot" />
              <span className="ekm-hot__label">{h.n} · {h.title}</span>
            </button>
          ))}
          <span className="ekm-hint">Klicke auf die Punkte und entdecke, was in der Planung wirklich zählt.</span>
        </Reveal>
      </div>

      <AnimatePresence>
        {modal !== null && (
          <motion.div className="ekm-overlay" onClick={() => setModal(null)} role="dialog" aria-modal="true" aria-label={HOTSPOTS[modal].title}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <motion.div className="ekm-modal" onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.99 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <button type="button" className="ekm-modal__close" onClick={() => setModal(null)} aria-label="Schließen">×</button>
              <img src={CARDS[modal]} alt={HOTSPOTS[modal].title} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
