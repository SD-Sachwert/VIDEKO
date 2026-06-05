import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Award, PencilRuler, Leaf, Sparkles } from 'lucide-react'

import Reveal from './Reveal.jsx'
import MagneticButton from './MagneticButton.jsx'
import PlayButton from './PlayButton.jsx'
import TextLink from './TextLink.jsx'

import heroBg from '../assets/images/materialien/materials-hero-bg-16x9.png'
import cNaturstein from '../assets/images/materialien/cards/material-card-naturstein.png'
import cMetall from '../assets/images/materialien/cards/material-card-metall.png'
import cBronze from '../assets/images/materialien/cards/material-card-bronze.png'
import cKeramik from '../assets/images/materialien/cards/material-card-keramik.png'
import cHolz from '../assets/images/materialien/cards/material-card-holz.png'
import cGlas from '../assets/images/materialien/cards/material-card-glas.png'
import cQuarz from '../assets/images/materialien/cards/material-card-quarzkomposit.png'
import cLack from '../assets/images/materialien/cards/material-card-lack-matt.png'

const MATERIALS = [
  { name: 'Naturstein', image: cNaturstein, tags: ['Einzigartig.', 'Kraftvoll.', 'Echt.'], line: 'Gewachsen über Jahrtausende – jede Platte ein Unikat mit eigener Maserung.' },
  { name: 'Metall', image: cMetall, tags: ['Kühl.', 'Präzise.', 'Zeitlos.'], line: 'Klare Kanten, kühle Präzision – Oberflächen mit zeitloser Strenge.' },
  { name: 'Bronze', image: cBronze, tags: ['Warm.', 'Exklusiv.', 'Ausdrucksstark.'], line: 'Warmer Schimmer mit Charakter – ein Material, das Akzente setzt.' },
  { name: 'Keramik', image: cKeramik, tags: ['Vielseitig.', 'Widerstandsfähig.', 'Elegant.'], line: 'Robust und fein zugleich – widerstandsfähig gegen jeden Alltag.' },
  { name: 'Holz', image: cHolz, tags: ['Natürlich.', 'Lebendig.', 'Wohnlich.'], line: 'Lebendige Maserung, warme Haptik – Natur, die man täglich spürt.' },
  { name: 'Glas', image: cGlas, tags: ['Leicht.', 'Transparent.', 'Modern.'], line: 'Licht und Leichtigkeit – transparente Eleganz für moderne Räume.' },
  { name: 'Quarzkomposit', image: cQuarz, tags: ['Pflegeleicht.', 'Beständig.', 'Harmonisch.'], line: 'Pflegeleicht und beständig – harmonische Flächen ohne Kompromiss.' },
  { name: 'Lack Matt', image: cLack, tags: ['Ruhig.', 'Pur.', 'Samtig.'], line: 'Samtig-matte Ruhe – pure, fingerabdruckfreie Eleganz.' },
]

const BENEFITS = [
  { icon: Award, title: ['Ausgewählte', 'Qualität'], text: 'Nur Materialien, die unseren Standards in Design, Funktion und Langlebigkeit genügen.' },
  { icon: PencilRuler, title: ['Präzise', 'Verarbeitung'], text: 'Modernste Technologien und echtes Handwerk für perfekte Oberflächen und Details.' },
  { icon: Leaf, title: ['Nachhaltig &', 'Verantwortungsvoll'], text: 'Ressourcenschonend ausgewählt, langlebig und gemacht für die Zukunft.' },
  { icon: Sparkles, title: ['Sinnlich &', 'Erlebbar'], text: 'Materialien, die man nicht nur sieht, sondern spürt – jeden Tag aufs Neue.' },
]

function MatCard({ m, index, active, onSelect }) {
  const ref = useRef(null)
  function move(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--rx', `${(0.5 - (e.clientY - r.top) / r.height) * 8}deg`)
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 9}deg`)
  }
  function reset() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }
  return (
    <button
      ref={ref}
      type="button"
      className={`matcard ${active ? 'matcard--active' : ''}`}
      onMouseMove={move}
      onMouseLeave={reset}
      onClick={() => onSelect(index)}
      aria-pressed={active}
      aria-label={m.name}
    >
      <span className="matcard__img" style={{ backgroundImage: `url(${m.image})` }} aria-hidden="true" />
      <span className="matcard__scrim" aria-hidden="true" />
      <span className="matcard__glow" aria-hidden="true" />
      <span className="matcard__body">
        <span className="matcard__name">{m.name}</span>
        <span className="matcard__tags">
          {m.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </span>
      </span>
      <span className="matcard__plus" aria-hidden="true">
        <Plus size={16} strokeWidth={2} />
      </span>
    </button>
  )
}

export default function MaterialsSection({ embedded = false }) {
  const [active, setActive] = useState(0)
  const railRef = useRef(null)
  const heroRef = useRef(null)
  const current = MATERIALS[active]

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start end', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['-6%', '8%'])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1.08, 1])

  function scrollRail(dir) {
    railRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }
  function select(i) {
    setActive(i)
    const card = railRef.current?.children?.[i]
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <section className="mat" id="materialien">
      <div className="mat__bg" aria-hidden="true" />

      {/* hero (skipped when embedded under a PageHero) */}
      {!embedded && (
      <div className="container mat-hero" ref={heroRef}>
        <Reveal className="mat-hero__copy">
          <span className="kicker">Materialien</span>
          <h2 className="mat-hero__title">
            Materialien,<br />die <span className="grad">inspirieren.</span>
          </h2>
          <p className="mat-hero__copytext">
            Echte Materialien. Perfekt verarbeitet. Für Küchen, die bleiben und
            begeistern.
          </p>
          <div className="mat-hero__actions">
            <MagneticButton as="a" href="#materialien">Materialien entdecken</MagneticButton>
            <PlayButton label="Materialien erleben" href="#beratung" light={false} />
          </div>
        </Reveal>

        <Reveal className="mat-hero__media" delay={0.1}>
          <div className="mat-hero__frame">
            <motion.img
              src={heroBg}
              alt="VIDEKO Materialwelt"
              className="mat-hero__img"
              style={{ y: heroY, scale: heroScale }}
            />
            <span className="mat-hero__rim" aria-hidden="true" />
          </div>
        </Reveal>
      </div>
      )}

      {/* interactive material cards */}
      <div className="container mat-cards">
        <div className="matcards__head">
          <div className="matcards__active-info" key={current.name}>
            <span className="kicker">Oberflächen · {String(active + 1).padStart(2, '0')} / 08</span>
            <h3 className="matcards__active-name">{current.name}</h3>
            <p className="matcards__active-line">{current.line}</p>
          </div>
          <div className="matcards__nav">
            <button className="matcards__navbtn" onClick={() => scrollRail(-1)} aria-label="Zurück">
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button className="matcards__navbtn" onClick={() => scrollRail(1)} aria-label="Weiter">
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="matcards__rail" ref={railRef}>
          {MATERIALS.map((m, i) => (
            <MatCard key={m.name} m={m} index={i} active={i === active} onSelect={select} />
          ))}
        </div>
      </div>

      {/* benefits */}
      <div className="container mat-benefits">
        <Reveal className="mat-benefits__lead">
          <h3>Warum unsere<br />Materialien besonders sind.</h3>
          <p>
            Mit höchstem Anspruch ausgewählt, verarbeitet und kombiniert – für ein
            Ergebnis, das Sie sehen, fühlen und jeden Tag erleben.
          </p>
          <TextLink href="#beratung">Mehr erfahren</TextLink>
        </Reveal>
        <div className="mat-benefits__grid">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title.join(' ')} delay={i * 0.06} className="mbenefit">
              <span className="mbenefit__icon" aria-hidden="true">
                <b.icon size={22} strokeWidth={1.4} />
              </span>
              <span className="mbenefit__title">
                {b.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
              <span className="mbenefit__text">{b.text}</span>
            </Reveal>
          ))}
        </div>
      </div>

      {/* bottom CTA box */}
      <div className="container">
        <Reveal className="mat-cta">
          <span className="mat-cta__thumb" aria-hidden="true">
            <img src={heroBg} alt="" />
          </span>
          <div className="mat-cta__body">
            <h3>Erleben Sie Materialien<br />in perfekter Harmonie.</h3>
            <p>
              Besuchen Sie einen unserer Showrooms und entdecken Sie die Vielfalt
              und Qualität unserer Materialien hautnah.
            </p>
          </div>
          <div className="mat-cta__actions">
            <MagneticButton as="a" href="#showrooms">Standorte ansehen</MagneticButton>
            <TextLink href="#beratung">Persönliche Beratung buchen</TextLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
