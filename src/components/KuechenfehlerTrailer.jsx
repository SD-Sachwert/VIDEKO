import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import scene from '../assets/images/kuechenfehler/scene.png'

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
  const idx = useRef(0)
  const timer = useRef(0)

  const onField = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    const text = MISS[idx.current % MISS.length]
    idx.current += 1
    setMiss({ x: Math.min(84, Math.max(16, x)), y: Math.min(82, Math.max(18, y)), text })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMiss(null), 2600)
  }

  return (
    <section className="section section--light kft-sec">
      <div className="container kft">
        <Reveal className="kft__copy">
          <span className="kicker">Mini-Spiel</span>
          <h2 className="kft__title">Findest du die <span className="grad">Küchenfehler?</span></h2>
          <p className="kft__lead">Klick ruhig mal in die Küche – hier ist nur der Trailer. Das echte Spiel mit allen 9 Fehlern wartet auf der Inspirationsseite.</p>
          <Link to="/inspiration#kuechensuenden" className="kft__cta">Küchenfehler-Spiel starten <ArrowRight size={16} strokeWidth={2} /></Link>
        </Reveal>

        <Reveal className="kft__fieldwrap" delay={0.08}>
          <button type="button" className="kft__field" onClick={onField} aria-label="Trailer – tippe in die Küche">
            <img src={scene} alt="Küche – kleiner Vorgeschmack auf das Fehlersuche-Spiel" draggable={false} />
            <span className="kft__badge"><Search size={14} strokeWidth={2} /> Tippen zum Suchen</span>
            {miss && <span className="kft__miss" style={{ left: `${miss.x}%`, top: `${miss.y}%` }}>{miss.text}</span>}
          </button>
        </Reveal>
      </div>
    </section>
  )
}
