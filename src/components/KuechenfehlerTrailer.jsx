import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import scene from '../assets/images/kuechenfehler/scene.webp'

const MISS = [
  'Fast. Der Raum lacht leise.',
  'Guter Klick, falscher Tatort.',
  'Noch kein Treffer. Aber der Ehrgeiz stimmt.',
  'Diese Ecke ist unschuldig. Noch.',
  'Knapp daneben ist auch daneben geplant.',
  'Hier versteckt sich nichts – außer vielleicht Staub unter der Sockelleiste.',
  'Der Fehler ist woanders. Der kleine Mistkerl.',
  'Nicht schlecht. Nur leider komplett falsch.',
]

export default function KuechenfehlerTrailer() {
  const [miss, setMiss] = useState(null)
  const [popup, setPopup] = useState(false)
  const idx = useRef(0)
  const missTimer = useRef(0)
  const popTimer = useRef(0)

  const onField = (e) => {
    if (popup) return // weiterklicken geht nicht – im Trailer ist Schluss
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    const text = MISS[idx.current % MISS.length]
    idx.current += 1
    setMiss({ x: Math.min(84, Math.max(16, x)), y: Math.min(82, Math.max(18, y)), text })
    clearTimeout(missTimer.current)
    missTimer.current = setTimeout(() => setMiss(null), 2600)
    // nach der Niete: hier geht's nicht weiter -> Fenster zum echten Spiel
    clearTimeout(popTimer.current)
    popTimer.current = setTimeout(() => { setMiss(null); setPopup(true) }, 1400)
  }

  return (
    <section className="section section--light kft-sec">
      <div className="container kft">
        <Reveal className="kft__copy">
          <span className="kicker">Augen auf</span>
          <h2 className="kft__title">Findest du die <span className="grad">Küchenfehler?</span></h2>
          <p className="kft__lead">Klick dich durch die Küche und schau, was im Alltag später nervt. Die typischen 9 Küchenfehler – und welche gar keine sind – findest du auf der Inspirationsseite.</p>
          <Link to="/inspiration#kuechensuenden" className="kft__cta">Zu den 9 Küchenfehlern <ArrowRight size={16} strokeWidth={2} /></Link>
        </Reveal>

        <Reveal className="kft__fieldwrap" delay={0.08}>
          <div className={`kft__field ${popup ? 'is-done' : ''}`} onClick={onField} role="button" tabIndex={0} aria-label="Trailer – tippe in die Küche">
            <img src={scene} alt="Küche – kleiner Vorgeschmack auf das Fehlersuche-Spiel" draggable={false} />
            {!popup && <span className="kft__badge"><Search size={14} strokeWidth={2} /> Tippen zum Suchen</span>}
            {miss && !popup && <span className="kft__miss" style={{ left: `${miss.x}%`, top: `${miss.y}%` }}>{miss.text}</span>}
            {popup && (
              <div className="kft__popup">
                <span className="kft__popup-t">Neugierig geworden?</span>
                <span className="kft__popup-d">Die typischen 9 Küchenfehler – und welche gar keine sind – findest du auf der Inspirationsseite.</span>
                <Link to="/inspiration#kuechensuenden" className="kft__popup-btn">Zu den 9 Küchenfehlern <ArrowRight size={15} strokeWidth={2} /></Link>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
