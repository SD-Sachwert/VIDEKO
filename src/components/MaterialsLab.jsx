import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import useCarouselNav from '../hooks/useCarouselNav.js'
import m01 from '../assets/images/inspiration/materials-lab/m01.png'
import m02 from '../assets/images/inspiration/materials-lab/m02.png'
import m03 from '../assets/images/inspiration/materials-lab/m03.png'
import m04 from '../assets/images/inspiration/materials-lab/m04.png'
import m05 from '../assets/images/inspiration/materials-lab/m05.png'
import m06 from '../assets/images/inspiration/materials-lab/m06.png'
import m07 from '../assets/images/inspiration/materials-lab/m07.png'
import m08 from '../assets/images/inspiration/materials-lab/m08.png'
import m09 from '../assets/images/inspiration/materials-lab/m09.png'
import m10 from '../assets/images/inspiration/materials-lab/m10.png'

const MATS = [
  { img: m01, n: '01', t: 'Naturstein', d: 'Tief, markant, luxuriös.', wirkung: 'Tief, markant und unverwechselbar – jede Platte ein Unikat.', einsatz: 'Stark als Arbeitsplatte oder Rückwand, wenn ein Material den Ton angeben darf.', note: 'Schön und robust. Säure mag er trotzdem nicht – reden wir vorher drüber.' },
  { img: m02, n: '02', t: 'Holz', d: 'Warm, ruhig, charakterstark.', wirkung: 'Warm, natürlich und wohnlich. Bringt sofort Ruhe in den Raum.', einsatz: 'Ideal für Fronten und Wohnküchen, in denen es weniger nach Möbel und mehr nach Zuhause aussehen soll.', note: 'Holz lebt. Kleine Spuren gehören dazu – das ist Charakter, kein Mangel.' },
  { img: m03, n: '03', t: 'Travertin', d: 'Sanfte Natürlichkeit.', wirkung: 'Sanft, hell und natürlich strukturiert. Edel, ohne laut zu sein.', einsatz: 'Schön für ruhige, helle Küchen mit mediterraner Note.', note: 'Offenporig und charmant. Eine gute Versiegelung erspart später Ärger.' },
  { img: m04, n: '04', t: 'Metall', d: 'Gebürstetes Messing mit Wirkung.', wirkung: 'Gebürstetes Messing setzt warme, edle Akzente mit Tiefe.', einsatz: 'Perfekt für Details: Griffe, Armaturen, Nischen – dosiert eingesetzt.', note: 'Als Akzent ein Highlight. Großflächig schnell zu viel des Guten.' },
  { img: m05, n: '05', t: 'Glas', d: 'Rauchig, elegant, reflektierend.', wirkung: 'Rauchig, elegant und reflektierend. Bringt Leichtigkeit und Tiefe.', einsatz: 'Stark für Rückwände und Vitrinen, wenn der Raum offen wirken soll.', note: 'Sieht edel aus. Fingerabdrücke findet es leider auch spannend.' },
  { img: m06, n: '06', t: 'Lack', d: 'Ruhig, clean, samtig matt.', wirkung: 'Ruhig, clean und samtig matt. Reduziert und modern.', einsatz: 'Ideal für klare, ruhige Fronten ohne Maserung oder Unruhe.', note: 'Matt ist nicht gleich matt. Die richtige Oberfläche bleibt entspannt im Alltag.' },
  { img: m07, n: '07', t: 'Betonoptik', d: 'Modern, reduziert, architektonisch.', wirkung: 'Modern, reduziert und architektonisch. Cooler, urbaner Charakter.', einsatz: 'Passt zu klaren Konzepten, in denen Materialien zurückhaltend bleiben sollen.', note: 'Wirkt kühl – mit warmem Holz oder Licht wird daraus echte Wohnlichkeit.' },
  { img: m08, n: '08', t: 'Marmor', d: 'Helle Eleganz mit feiner Aderung.', wirkung: 'Elegant, hell und ruhig. Lässt den Raum leicht wirken, ohne langweilig zu sein.', einsatz: 'Stark als Statement-Platte oder Rückwand für hochwertige, helle Küchen.', note: 'Schön ist gut. Pflegeleicht ist besser. Am besten beides.' },
  { img: m09, n: '09', t: 'Struktur', d: 'Gerillt, haptisch, besonders.', wirkung: 'Gerillt, haptisch und besonders. Bringt Spannung über die Oberfläche.', einsatz: 'Spannend für Fronten oder Inseln, die man sehen und fühlen soll.', note: 'Struktur ist ein Erlebnis – aber auch ein kleiner Staubfänger. Ehrlich gesagt.' },
  { img: m10, n: '10', t: 'Bronze', d: 'Warmes Metall, edler Akzent.', wirkung: 'Warmes Metall mit edlem, tiefem Schimmer.', einsatz: 'Hochwertige Akzente für Griffe, Rahmen und feine Details.', note: 'Ein Hauch Bronze wirkt teuer. Zu viel davon wirkt nur teuer gewollt.' },
]

const SECTION_LEAD = 'Oberflächen entscheiden, wie eine Küche im Alltag wirkt – bei Licht, Pflege, Haptik und Stimmung. Kurz: schön darf sein. Nervig lieber nicht.'

export default function MaterialsLab() {
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState(null) // Infobox erst nach Klick auf ein Material
  const [paused, setPaused] = useState(false)
  const n = MATS.length

  const pick = (i) => { setActive(i); setSelected(i) }
  const next = () => pick((active + 1) % n)
  const prev = () => pick((active - 1 + n) % n)
  const nav = useCarouselNav(next, prev)
  const rel = (i) => { let d = i - active; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d }

  useEffect(() => {
    if (paused || selected != null) return
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((v) => (v + 1) % n), 4000)
    return () => clearInterval(id)
  }, [paused, selected, active, n])

  return (
    <section className="section section--light matlab">
      <div className="container matlab__grid">
        <Reveal className="matlab__intro">
          <span className="matlab__divider" aria-hidden="true" />
          <span className="kicker">Materials Lab</span>
          <h2 className="matlab__title">Fühlen. Sehen.<br /><span className="grad">Verstehen.</span></h2>
          <p className="matlab__lead">Echte Materialien. Echte Oberflächen. Außergewöhnliche Strukturen und<br />Qualitäten in einer neuen Dimension.</p>
          <div className="matinfo-wrap">
            <AnimatePresence mode="wait" initial={false}>
              {selected != null ? (
                <motion.div className="matinfo" key={MATS[selected].t}
                  initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}>
                  <span className="matinfo__head"><span className="matinfo__n">{MATS[selected].n}</span><span className="matinfo__t">{MATS[selected].t}</span></span>
                  <p className="matinfo__row"><span>Wirkung</span>{MATS[selected].wirkung}</p>
                  <p className="matinfo__row"><span>Einsatz</span>{MATS[selected].einsatz}</p>
                  <p className="matinfo__note"><b>VIDEKO-Notiz:</b> {MATS[selected].note}</p>
                </motion.div>
              ) : (
                <motion.p className="matinfo-hint" key="hint"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  Tippe auf ein Material im Karussell, um Wirkung, Einsatz und unsere ehrliche Notiz dazu zu sehen.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <div className="matlab__stagewrap" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="matlab__stage" ref={nav.ref} onTouchStart={nav.onTouchStart} onTouchEnd={nav.onTouchEnd} style={{ touchAction: 'pan-y' }}>
            {MATS.map((m, i) => {
              const d = rel(i)
              const isActive = d === 0
              const show = Math.abs(d) <= 2
              const style = {
                transform: `translate(-50%, -50%) translateX(${d * 60}%) scale(${isActive ? 1 : Math.abs(d) === 1 ? 0.72 : 0.54}) rotateY(${d * -14}deg)`,
                opacity: show ? (isActive ? 1 : Math.abs(d) === 1 ? 0.72 : 0.42) : 0,
                filter: isActive ? 'none' : Math.abs(d) === 1 ? 'blur(1px)' : 'blur(2.2px)',
                zIndex: isActive ? 20 : 10 - Math.abs(d),
                pointerEvents: show ? 'auto' : 'none',
              }
              return (
                <button key={m.t} type="button" className={`matcard3d ${isActive ? 'is-active' : ''}`} style={style} onClick={() => { setActive(i); setSelected(selected === i ? null : i) }} aria-label={m.t} tabIndex={show ? 0 : -1}>
                  <img src={m.img} alt={m.t} loading="lazy" />
                  <span className="matcard3d__cap"><b>{m.t}</b><span>{m.d}</span></span>
                </button>
              )
            })}
          </div>
          <div className="matlab__nav">
            <button type="button" className="matlab__arrow" onClick={prev} aria-label="Vorheriges Material"><ChevronLeft size={20} strokeWidth={2} /></button>
            <div className="matlab__dots">
              {MATS.map((m, i) => (
                <button key={m.t} type="button" className={`matlab__dot ${active === i ? 'is-active' : ''}`} onClick={() => pick(i)} aria-label={m.t} />
              ))}
            </div>
            <button type="button" className="matlab__arrow" onClick={next} aria-label="Nächstes Material"><ChevronRight size={20} strokeWidth={2} /></button>
          </div>
        </div>

        <Reveal className="matlab__outro">
          <h3 className="matlab__outro-title">Material fühlt man, bevor man es versteht.</h3>
          <p className="matlab__outro-text">{SECTION_LEAD}</p>
        </Reveal>
      </div>
    </section>
  )
}
