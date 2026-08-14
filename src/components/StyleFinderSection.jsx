import { useState } from 'react'
import { Check, ArrowRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import MagneticButton from './MagneticButton.jsx'

// Final renderings (replace the earlier placeholder crops)
import bgTexture from '../assets/images/kuechenwelten/stilfinderbg-dark-texture.webp'
import heroScene from '../assets/images/kuechenwelten/stilfinderhero-kitchen-wide.webp'
import cardZeitlos from '../assets/images/kuechenwelten/stilfindercard-zeitlos-elegant.webp'
import cardModern from '../assets/images/kuechenwelten/stilfindercard-modern-warm.webp'
import cardDunkel from '../assets/images/kuechenwelten/stilfindercard-dunkel-dramatisch.webp'
import cardNatur from '../assets/images/kuechenwelten/stilfindercard-natuerlich-luxurioes.webp'
import cardIndustrial from '../assets/images/kuechenwelten/stilfindercard-industrial-premium.webp'
import resultZeitlos from '../assets/images/kuechenwelten/stilfinderresult-zeitlos-elegant.webp'
import resultModern from '../assets/images/kuechenwelten/stilfinderresult-modern-warm.webp'
import resultDunkel from '../assets/images/kuechenwelten/stilfinderresult-dunkel-dramatisch.webp'
import resultNatur from '../assets/images/kuechenwelten/stilfinderresult-natuerlich-luxurioes.webp'
import resultIndustrial from '../assets/images/kuechenwelten/stilfinderresult-industrial-premium.webp'

const STYLES = [
  {
    key: 'zeitlos',
    name: 'Zeitlos Elegant',
    tag: 'Klassik. Edle Materialien. Für immer schön.',
    image: cardZeitlos,
    result: resultZeitlos,
    text: 'Ruhige Linien, edle Oberflächen und eine Eleganz, die niemals aus der Mode kommt.',
    traits: ['Warme Naturtöne', 'Hochwertige Hölzer', 'Klare, ruhige Linien', 'Zeitlose Eleganz'],
  },
  {
    key: 'modern-warm',
    name: 'Modern Warm',
    tag: 'Klare Linien. Warme Töne. Zum Wohlfühlen.',
    image: cardModern,
    result: resultModern,
    text: 'Ein Stil aus Wärme und Klarheit, der Architektur und Geborgenheit vereint.',
    traits: ['Warme Materialien & Farben', 'Moderne Formsprache', 'Architektonische Klarheit', 'Individuell geplant'],
  },
  {
    key: 'dunkel',
    name: 'Dunkel & Dramatisch',
    tag: 'Ausdrucksstark. Tief. Für echte Statements.',
    image: cardDunkel,
    result: resultDunkel,
    text: 'Tiefe Töne, starke Kontraste und Materialien, die ein klares Statement setzen.',
    traits: ['Tiefe Anthrazit-Töne', 'Starke Kontraste', 'Dramatische Lichtführung', 'Statement-Oberflächen'],
  },
  {
    key: 'natuerlich',
    name: 'Natürlich Luxuriös',
    tag: 'Echtes Holz. Naturstein. Feine Qualität.',
    image: cardNatur,
    result: resultNatur,
    text: 'Natürliche Materialien, fein verarbeitet – Luxus, der sich erden lässt.',
    traits: ['Echtes Holz & Naturstein', 'Organische Texturen', 'Feine Handwerksqualität', 'Warmes, weiches Licht'],
  },
  {
    key: 'industrial',
    name: 'Industrial Premium',
    tag: 'Urban. Roh. Reduziert. Mit Charakter.',
    image: cardIndustrial,
    result: resultIndustrial,
    text: 'Rohe Materialität, reduziert und urban – Premium mit Ecken und Kanten.',
    traits: ['Metall & Beton', 'Reduzierte Formen', 'Urbaner Charakter', 'Markante Details'],
  },
]

export default function StyleFinderSection({ embedded = false }) {
  const [active, setActive] = useState(1)
  const current = STYLES[active]

  return (
    <section className="stylefinder" id="stilfinder">
      <div
        className="stylefinder__texture"
        style={{ backgroundImage: `url(${bgTexture})` }}
        aria-hidden="true"
      />
      <div className="stylefinder__bg" aria-hidden="true">
        <img src={heroScene} alt="" className="stylefinder__bg-img" />
        <div className="stylefinder__bg-veil" />
      </div>

      <div className="container stylefinder__inner">
        {!embedded && (
          <Reveal as="header" className="stylefinder__head">
            <span className="kicker kicker--gold">Stilfinder</span>
            <h2 className="stylefinder__title">
              Welcher<br />
              <span className="grad">Küchenstil</span><br />
              bist du?
            </h2>
            <p className="stylefinder__lead">
              Finde in wenigen Schritten den Stil, der zu deinem Leben, deinem
              Zuhause und deinem Anspruch passt.
            </p>
          </Reveal>
        )}

        {/* style cards */}
        <Reveal className="stylefinder__cards" delay={0.05}>
          {STYLES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`stylecard ${i === active ? 'stylecard--active' : ''}`}
              onClick={() => setActive(i)}
              aria-pressed={i === active}
            >
              <span
                className="stylecard__image"
                style={{ backgroundImage: `url(${s.image})` }}
                aria-hidden="true"
              />
              <span className="stylecard__scrim" aria-hidden="true" />
              <span className="stylecard__glow" aria-hidden="true" />
              <span className="stylecard__body">
                <span className="stylecard__num">{`0${i + 1}`}</span>
                <span className="stylecard__name">{s.name}</span>
                <span className="stylecard__tag">{s.tag}</span>
              </span>
              {i === active && (
                <span className="stylecard__check" aria-hidden="true">
                  <Check size={16} strokeWidth={2.4} />
                </span>
              )}
            </button>
          ))}
        </Reveal>

        {/* result */}
        <Reveal className="styleresult" delay={0.1}>
          <div className="styleresult__media">
            <img
              key={current.key}
              src={current.result}
              alt={`Stil: ${current.name}`}
              className="styleresult__img"
            />
            <span className="styleresult__edge" aria-hidden="true" />
          </div>
          <div className="styleresult__body">
            <span className="styleresult__label">Dein Stil</span>
            <h3 className="styleresult__name">{current.name}</h3>
            <p className="styleresult__text">{current.text}</p>
            <ul className="styleresult__traits">
              {current.traits.map((t) => (
                <li key={t}>
                  <Check size={15} strokeWidth={2.2} />
                  {t}
                </li>
              ))}
            </ul>
            <div className="styleresult__actions">
              <MagneticButton as="a" href="#beratung">
                Diesen Stil planen lassen
              </MagneticButton>
              <a className="styleresult__skip" href="#stilfinder">
                Anderen Stil wählen <ArrowRight size={15} strokeWidth={1.9} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
