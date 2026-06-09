import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
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
  { img: m01, n: '01', t: 'Naturstein', d: 'Tief, markant, luxuriös.' },
  { img: m02, n: '02', t: 'Holz', d: 'Warm, ruhig, charakterstark.' },
  { img: m03, n: '03', t: 'Travertin', d: 'Sanfte Natürlichkeit.' },
  { img: m04, n: '04', t: 'Metall', d: 'Gebürstetes Messing mit Wirkung.' },
  { img: m05, n: '05', t: 'Glas', d: 'Rauchig, elegant, reflektierend.' },
  { img: m06, n: '06', t: 'Lack', d: 'Ruhig, clean, samtig matt.' },
  { img: m07, n: '07', t: 'Betonoptik', d: 'Modern, reduziert, architektonisch.' },
  { img: m08, n: '08', t: 'Marmor', d: 'Helle Eleganz mit feiner Aderung.' },
  { img: m09, n: '09', t: 'Struktur', d: 'Gerillt, haptisch, besonders.' },
  { img: m10, n: '10', t: 'Bronze', d: 'Warmes Metall, edler Akzent.' },
]

export default function MaterialsLab() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = MATS.length

  const next = () => setActive((v) => (v + 1) % n)
  const prev = () => setActive((v) => (v - 1 + n) % n)
  const rel = (i) => { let d = i - active; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d }

  useEffect(() => {
    if (paused) return
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((v) => (v + 1) % n), 4000)
    return () => clearInterval(id)
  }, [paused, active, n])

  return (
    <section className="section section--dark matlab">
      <div className="container matlab__grid">
        <Reveal className="matlab__intro">
          <span className="kicker">Materials Lab</span>
          <h2 className="matlab__title">Fühlen. Sehen.<br /><span className="grad">Verstehen.</span></h2>
          <p className="matlab__lead">Echte Materialien. Echte Oberflächen. Außergewöhnliche Strukturen und Qualitäten in einer neuen Dimension.</p>
          <span className="matlab__active">
            <span className="matlab__active-n">{MATS[active].n}</span>
            <span className="matlab__active-b"><span className="matlab__active-t">{MATS[active].t}</span><span className="matlab__active-d">{MATS[active].d}</span></span>
          </span>
          <a className="matlab__cta" href="#materialien">Materialien entdecken <ArrowRight size={16} strokeWidth={2} /></a>
        </Reveal>

        <div className="matlab__stagewrap" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="matlab__stage">
            {MATS.map((m, i) => {
              const d = rel(i)
              const isActive = d === 0
              const show = Math.abs(d) <= 2
              const style = {
                transform: `translate(-50%, -50%) translateX(${d * 54}%) scale(${isActive ? 1 : Math.abs(d) === 1 ? 0.82 : 0.66}) rotateY(${d * -14}deg)`,
                opacity: show ? (isActive ? 1 : Math.abs(d) === 1 ? 0.6 : 0.28) : 0,
                zIndex: isActive ? 20 : 10 - Math.abs(d),
                pointerEvents: show ? 'auto' : 'none',
              }
              return (
                <button key={m.t} type="button" className={`matcard3d ${isActive ? 'is-active' : ''}`} style={style} onClick={() => setActive(i)} aria-label={m.t} tabIndex={show ? 0 : -1}>
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
                <button key={m.t} type="button" className={`matlab__dot ${active === i ? 'is-active' : ''}`} onClick={() => setActive(i)} aria-label={m.t} />
              ))}
            </div>
            <button type="button" className="matlab__arrow" onClick={next} aria-label="Nächstes Material"><ChevronRight size={20} strokeWidth={2} /></button>
          </div>
        </div>
      </div>
    </section>
  )
}
