import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Gem, Layers, MessageSquare, Sparkles } from 'lucide-react'

import Reveal from './Reveal.jsx'
import MagneticButton from './MagneticButton.jsx'
import TextLink from './TextLink.jsx'

import heroImmersive from '../assets/images/showroom/showroom-hero-immersive.png'
import ctaWide from '../assets/images/showroom/showroom-cta-wide.png'
import j01 from '../assets/images/showroom/journey-01-ankommen.png'
import j02 from '../assets/images/showroom/journey-02-eintreten.png'
import j03 from '../assets/images/showroom/journey-03-wohlfuehlen.png'
import j04 from '../assets/images/showroom/journey-04-geniessen.png'
import j05 from '../assets/images/showroom/journey-05-begreifen.png'
import j06 from '../assets/images/showroom/journey-06-entdecken.png'
import j07 from '../assets/images/showroom/journey-07-verstehen.png'
import j08 from '../assets/images/showroom/journey-08-verlieben.png'

const JOURNEY = [
  { n: '01', title: 'Ankommen', image: j01, text: 'Willkommen in einer Welt, die Qualität von außen zeigt.' },
  { n: '02', title: 'Eintreten', image: j02, text: 'Ein erster Eindruck, der Vorfreude weckt.' },
  { n: '03', title: 'Wohlfühlen', image: j03, text: 'Unsere Lounge lädt ein zum Ankommen und Verweilen.' },
  { n: '04', title: 'Genießen', image: j04, text: 'An unserer Bar verschmelzen Design und Gastlichkeit.' },
  { n: '05', title: 'Begreifen', image: j05, text: 'Echte Materialien, spürbare Qualität, zeitlose Eleganz.' },
  { n: '06', title: 'Entdecken', image: j06, text: 'Küchenwelten, die Inspiration wecken und begeistern.' },
  { n: '07', title: 'Verstehen', image: j07, text: 'Persönliche Beratung auf Augenhöhe mit Experten.' },
  { n: '08', title: 'Verlieben', image: j08, text: 'Licht, Details und Stimmungen, die bleiben.' },
]

const BENEFITS = [
  { icon: Sparkles, title: ['Exklusive', 'Küchenwelten'], text: 'Design in Perfektion. Für deinen Anspruch.' },
  { icon: Layers, title: ['Hochwertige', 'Materialien'], text: 'Ausgewählt für Qualität und Wert.' },
  { icon: MessageSquare, title: ['Persönliche', 'Beratung'], text: 'Individuell, ehrlich und inspirierend.' },
  { icon: Gem, title: ['Atmosphäre,', 'die bleibt'], text: 'Erleben. Fühlen. Mit allen Sinnen.' },
]

export default function ShowroomJourneySection() {
  const portalRef = useRef(null)
  const railRef = useRef(null)
  const [active, setActive] = useState(0)
  const [engaged, setEngaged] = useState(false) // true once a station was picked

  const { scrollYProgress } = useScroll({
    target: portalRef,
    offset: ['start end', 'end start'],
  })
  const portalY = useTransform(scrollYProgress, [0, 1], ['-8%', '12%'])
  const portalScale = useTransform(scrollYProgress, [0, 1], [1.12, 1.0])

  function select(i) {
    setActive(i)
    setEngaged(true)
    const rail = railRef.current
    const card = rail?.children?.[i]
    if (card) {
      const left = card.offsetLeft - rail.offsetWidth / 2 + card.offsetWidth / 2
      rail.scrollTo({ left, behavior: 'smooth' })
    }
  }

  const progress = ((active + 1) / JOURNEY.length) * 100

  return (
    <section className="showroom" id="showrooms">
      {/* immersive portal hero */}
      <div className="showroom__portal" ref={portalRef}>
        <motion.img
          src={heroImmersive}
          alt=""
          className="showroom__portal-img"
          style={{ y: portalY, scale: portalScale }}
        />
        {engaged && (
          <motion.img
            key={`hero-${active}`}
            src={JOURNEY[active].image}
            alt=""
            className="showroom__portal-active"
            style={{ y: portalY, scale: portalScale }}
            aria-hidden="true"
          />
        )}
        <div className="showroom__portal-veil" aria-hidden="true" />
        <div className="container showroom__portal-copy">
          <Reveal>
            <span className="kicker kicker--gold">Dein Weg durch unseren Showroom</span>
            <h2 className="showroom__title">
              Eintauchen<br />
              statt nur<br />
              <span className="grad">anschauen.</span>
            </h2>
            <p className="showroom__lead">
              Erlebe unsere Küchenwelten mit allen Sinnen. Eine Reise durch
              Design, Materialität und Atmosphäre.
            </p>
            <div className="showroom__portal-actions">
              <MagneticButton as="a" href="/beratung">
                Jetzt erleben
              </MagneticButton>
            </div>
          </Reveal>
        </div>

        {engaged && (
          <div className="showroom__station" key={`station-${active}`}>
            <span className="showroom__station-n">{JOURNEY[active].n}</span>
            <span className="showroom__station-name">{JOURNEY[active].title}.</span>
          </div>
        )}
      </div>

      {/* journey rail */}
      <div className="container">
        <Reveal className="showroom__railhead">
          <h3 className="showroom__railtitle">
            Deine Reise durch<br />unser Studio
          </h3>
          <span className="showroom__progress" aria-hidden="true">
            <span className="showroom__progress-fill" style={{ width: `${progress}%` }} />
          </span>
          <span className="showroom__counter">
            <span className="showroom__counter-cur">{JOURNEY[active].n}</span>
            <span className="showroom__counter-sep">/</span>
            <span className="showroom__counter-total">08</span>
          </span>
        </Reveal>

        <div className="showroom__rail" ref={railRef}>
          {JOURNEY.map((j, i) => (
            <button
              type="button"
              key={j.n}
              className={`journeycard ${i === active ? 'journeycard--active' : ''}`}
              onClick={() => select(i)}
              aria-pressed={i === active}
            >
              <span className="journeycard__media">
                <span
                  className="journeycard__image"
                  style={{ backgroundImage: `url(${j.image})` }}
                  aria-hidden="true"
                />
                <span className="journeycard__scrim" aria-hidden="true" />
                <span className="journeycard__edge" aria-hidden="true" />
                <span className="journeycard__num">{j.n}</span>
              </span>
              <span className="journeycard__foot">
                <span className="journeycard__title">{j.title}.</span>
                <span className="journeycard__text">{j.text}</span>
                <span className="journeycard__arrow" aria-hidden="true">
                  <ArrowUpRight size={18} strokeWidth={1.8} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* info section */}
      <div className="container">
        <div className="showroom__info">
          <Reveal className="showroom__info-lead">
            <h3>
              Mehr als ein Showroom.<br />
              <span className="grad">Ein Erlebnis.</span>
            </h3>
            <p>
              Bei VIDEKO Küchen verbinden sich Architektur, Design und Emotion zu
              einem einzigartigen Ort. Lass dich inspirieren, berühren und
              von neuen Möglichkeiten begeistern.
            </p>
            <TextLink href="/ueber-uns">Mehr über uns</TextLink>
          </Reveal>
          <div className="showroom__benefits">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title.join(' ')} delay={i * 0.06} className="sbenefit">
                <span className="sbenefit__icon" aria-hidden="true">
                  <b.icon size={22} strokeWidth={1.4} />
                </span>
                <span className="sbenefit__title">
                  {b.title.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
                <span className="sbenefit__text">{b.text}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* bottom CTA */}
      <div className="container">
        <Reveal className="showroom__cta">
          <div className="showroom__cta-media">
            <img src={ctaWide} alt="" className="showroom__cta-img" />
            <div className="showroom__cta-veil" aria-hidden="true" />
          </div>
          <div className="showroom__cta-body">
            <h3>Dein Erlebnis beginnt hier.</h3>
            <p>
              Vereinbare deinen persönlichen Termin und erlebe Küchen auf
              einem neuen Niveau.
            </p>
            <MagneticButton as="a" href="/beratung">
              Termin vereinbaren
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
