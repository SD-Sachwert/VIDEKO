import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import scene from '../assets/images/kuechenfehler/scene.png'

const MISS = [
  'Fast. Der Raum lacht leise.',
  'Guter Klick, falscher Tatort.',
  'Diese Ecke ist unschuldig. Noch.',
  'Knapp daneben ist auch daneben geplant.',
  'Der Fehler ist woanders. Der kleine Mistkerl.',
  'Nicht schlecht. Nur leider komplett falsch.',
]
const TARGET = '/inspiration#kuechensuenden'

export default function KfgTeaser() {
  const [miss, setMiss] = useState(null)
  const [popup, setPopup] = useState(false)
  const idx = useRef(0)
  const tMiss = useRef(0)
  const tPop = useRef(0)

  const onField = (e) => {
    if (popup) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    setMiss({ x: Math.min(82, Math.max(18, x)), y: Math.min(80, Math.max(20, y)), text: MISS[idx.current % MISS.length] })
    idx.current += 1
    clearTimeout(tMiss.current)
    tMiss.current = setTimeout(() => setMiss(null), 2800)
    clearTimeout(tPop.current)
    tPop.current = setTimeout(() => { setMiss(null); setPopup(true) }, 3000)
  }

  return (
    <Reveal className="kfgteaser" delay={0.1}>
      <div className={`kfgteaser__media ${popup ? 'is-done' : ''}`} style={{ backgroundImage: `url(${scene})` }}
        onClick={onField} role="button" tabIndex={0} aria-label="Küche – tippe und finde die Fehler">
        {!popup && <>
          <span className="kfgteaser__dot" style={{ left: '24%', top: '44%' }} />
          <span className="kfgteaser__dot" style={{ left: '60%', top: '30%' }} />
          <span className="kfgteaser__dot" style={{ left: '72%', top: '52%' }} />
        </>}
        {miss && !popup && <span className="kft__miss" style={{ left: `${miss.x}%`, top: `${miss.y}%` }}>{miss.text}</span>}
        {popup && (
          <div className="kfgteaser__popup">
            <span className="kfgteaser__popup-t">Neugierig geworden?</span>
            <Link to={TARGET} className="kfgteaser__popup-btn">Zu den 9 Küchenfehlern <ArrowRight size={15} strokeWidth={2} /></Link>
          </div>
        )}
      </div>
      <div className="kfgteaser__body">
        <span className="kfgteaser__badge">Interaktiv · 9 Fehler versteckt</span>
        <span className="kfgteaser__title">Findest du die Küchenfehler?</span>
        <span className="kfgteaser__text">Klick dich durch die Küche und sieh, worauf es bei guter Planung wirklich ankommt. Nicht jeder „Fehler“ ist übrigens einer.</span>
        <Link to={TARGET} className="kfgteaser__cta">Küchenfehler entdecken <ArrowUpRight size={15} strokeWidth={2} /></Link>
      </div>
    </Reveal>
  )
}
