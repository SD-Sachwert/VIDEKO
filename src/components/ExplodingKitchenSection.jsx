import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import MagneticButton from './MagneticButton.jsx'

import fallback from '../assets/images/planung/exploding/exploded-full-fallback-16x9.png'
import dLight from '../assets/images/planung/exploding/detail-light-16x9.png'
import dAppliances from '../assets/images/planung/exploding/detail-appliances-16x9.png'
import dWorktop from '../assets/images/planung/exploding/detail-worktop-16x9.png'
import dMaterials from '../assets/images/planung/exploding/detail-materials-16x9.png'
import dDrawers from '../assets/images/planung/exploding/detail-drawers-16x9.png'
import dMontage from '../assets/images/planung/exploding/detail-montage-16x9.png'

const POINTS = [
  { n: '01', title: 'Licht & Atmosphäre', text: 'Integrierte Lichtkonzepte für Stimmung und Funktion.', image: dLight },
  { n: '02', title: 'Premium Geräte', text: 'Nahtlos integrierte Technik – unsichtbar, bis du sie brauchst.', image: dAppliances },
  { n: '03', title: 'Arbeitsplatte', text: 'Edle Materialien. Perfekt verarbeitet. Zeitlos schön.', image: dWorktop },
  { n: '04', title: 'Korpus & Struktur', text: 'Stabile Basis. Hochwertig verarbeitet für maximale Langlebigkeit.', image: null },
  { n: '05', title: 'Fronten & Design', text: 'Ausdruck deiner Persönlichkeit. In Material, Farbe und Haptik.', image: dMaterials },
  { n: '06', title: 'Stauraum & Komfort', text: 'Intelligente Lösungen für Ordnung, Ergonomie und maximalen Komfort.', image: dDrawers },
  { n: '07', title: 'Maß & Präzision', text: 'Jedes Detail millimetergenau geplant und umgesetzt.', image: null },
  { n: '08', title: 'Montage & Perfektion', text: 'Fachgerecht montiert für ein Ergebnis, das bleibt.', image: dMontage },
]

const USPS = [
  { title: 'Individuell geplant', text: 'Maßgeschneidert auf deine Räume und Bedürfnisse.' },
  { title: 'Hochwertige Materialien', text: 'Ausgewählt für Qualität, Beständigkeit und Wert.' },
  { title: 'Technik mit Bedacht', text: 'Innovativ, zuverlässig und elegant integriert.' },
  { title: 'Handwerk auf höchstem Niveau', text: 'Mit Präzision gefertigt und detailverliebt umgesetzt.' },
]

export default function ExplodingKitchenSection() {
  const ref = useRef(null)
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-6%', '8%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.08, 1])

  const current = POINTS[active]

  return (
    <section className="exploding" id="exploding" ref={ref}>
      <div className="exploding__stage">
        {/* background plate (fallback hero — clean layered look) */}
        <motion.img
          src={fallback}
          alt="VIDEKO Exploding Kitchen — zerlegte Küche im Architekturraum"
          className="exploding__bg"
          style={{ y: bgY, scale: bgScale }}
        />
        <div className="exploding__veil" aria-hidden="true" />
        <div className="exploding__glow" aria-hidden="true" />

        <div className="container exploding__grid">
          {/* left copy */}
          <Reveal className="exploding__copy">
            <span className="kicker kicker--gold">Küchen. Durchdacht bis ins Detail.</span>
            <h2 className="exploding__title">
              Exploding<br />
              <span className="grad">Kitchen.</span>
            </h2>
            <p className="exploding__text">
              Jede VIDEKO Küche ist ein Meisterwerk präziser Planung, edler
              Materialien und intelligenter Technik. Entdecke, was im
              Verborgenen Perfektion schafft.
            </p>
            <MagneticButton as="a" href="/beratung">
              Entdecke die Details
            </MagneticButton>
          </Reveal>

          {/* floating detail preview */}
          <div className={`exploding__preview ${current.image ? 'is-on' : ''}`}>
            {current.image && (
              <div className="exploding__preview-card">
                <img key={current.n} src={current.image} alt={current.title} />
                <div className="exploding__preview-meta">
                  <span className="exploding__preview-num">{current.n}</span>
                  <span className="exploding__preview-title">{current.title}</span>
                </div>
              </div>
            )}
          </div>

          {/* right numbered points */}
          <Reveal className="exploding__points" delay={0.1}>
            <span className="exploding__rail" aria-hidden="true" />
            {POINTS.map((p, i) => (
              <button
                key={p.n}
                type="button"
                className={`epoint ${i === active ? 'epoint--active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-pressed={i === active}
              >
                <span className="epoint__line" aria-hidden="true" />
                <span className="epoint__num">{p.n}</span>
                <span className="epoint__body">
                  <span className="epoint__title">{p.title}</span>
                  <span className="epoint__text">{p.text}</span>
                </span>
              </button>
            ))}
          </Reveal>
        </div>
      </div>

      {/* USP bar */}
      <div className="container">
        <Reveal className="exusp">
          <div className="exusp__lead">
            <h3>Perfektion ist<br />kein Zufall.</h3>
            <p>
              Sondern das Ergebnis aus Erfahrung, Leidenschaft und kompromisslosem
              Anspruch.
            </p>
          </div>
          <div className="exusp__grid">
            {USPS.map((u) => (
              <div className="exusp__item" key={u.title}>
                <span className="exusp__dot" aria-hidden="true" />
                <span className="exusp__title">{u.title}</span>
                <span className="exusp__text">{u.text}</span>
              </div>
            ))}
          </div>
          <a className="exusp__cta" href="/beratung">
            <span>Entdecke deine Traumküche</span>
            <ArrowRight size={18} strokeWidth={2} />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
