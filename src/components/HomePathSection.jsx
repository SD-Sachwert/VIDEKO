import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Award, MapPin, User, ArrowRight, Gem, Hammer, Layers, Phone } from 'lucide-react'

import Reveal from './Reveal.jsx'

import bgMarble from '../assets/images/home/bg-marble-warm.webp'
import goldOrbit from '../assets/images/home/gold-orbit-lines.webp'
import heroArch from '../assets/images/shared/hero-kitchen-arch.webp'
// NOTE: placeholder card crops — replace later with clean card-*.jpg
import cardStylefinder from '../assets/images/home/feature-stylefinder.webp'
import cardShowroom from '../assets/images/home/feature-showroom.webp'
import cardConsulting from '../assets/images/home/feature-consulting.webp'
import emblem from '../assets/brand/logo-main-v2-288.webp'

const CARDS = [
  {
    num: '01',
    icon: Award,
    title: ['Entdecke', 'deinen', 'Küchenstil.'],
    text: 'Von puristisch bis extravagant – finde den Stil, der dich definiert.',
    cta: 'Stilfinder starten',
    href: '/stylefinder',
    image: cardStylefinder,
  },
  {
    num: '02',
    icon: MapPin,
    title: ['Erlebe', 'unsere', 'Showrooms.'],
    text: 'Besuche unseren exklusiven Standort und tauche in die Welt von VIDEKO ein.',
    cta: 'Standorte ansehen',
    href: '/showroom',
    image: cardShowroom,
  },
  {
    num: '03',
    icon: User,
    title: ['Persönliche', 'Beratung.'],
    text: 'Maßgeschneidert. Unverbindlich. Auf höchstem Niveau.',
    cta: 'Termin vereinbaren',
    href: '/beratung',
    image: cardConsulting,
  },
]

const BENEFITS = [
  { icon: Gem, title: 'Design mit Seele', text: 'Ästhetik, die berührt und bleibt.' },
  { icon: Hammer, title: 'Handwerk auf höchstem Niveau', text: 'Präzision, Erfahrung und Leidenschaft.' },
  { icon: Layers, title: 'Materialien für Generationen', text: 'Ausgewählt für Qualität, Beständigkeit und Wert.' },
  { icon: Phone, title: 'Beratung auf Augenhöhe', text: 'Individuell, ehrlich und inspirierend.' },
]

export default function HomePathSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const archY = useTransform(scrollYProgress, [0, 1], ['-5%', '8%'])
  const archScale = useTransform(scrollYProgress, [0, 1], [1.06, 1])

  return (
    <section className="luxury" id="feature" ref={ref}>
      <div
        className="luxury__bg"
        style={{ backgroundImage: `url(${bgMarble})` }}
        aria-hidden="true"
      />
      <div
        className="luxury__orbit"
        style={{ backgroundImage: `url(${goldOrbit})` }}
        aria-hidden="true"
      />

      <div className="container luxury__inner">
        {/* hero text + arch image */}
        <div className="luxury__top">
          <Reveal className="luxury__copy">
            <span className="kicker">Küchen für Menschen mit Anspruch</span>
            <h2 className="luxury__title">
              Küchen.<br />
              Die Kunst<br />
              <span className="grad">des Lebens.</span>
            </h2>
            <p className="luxury__lead">
              Exklusive Küchenarchitektur, die Design, Funktion und Emotion in
              vollendeter Harmonie vereint.
            </p>
          </Reveal>

          <Reveal className="luxury__hero" delay={0.1}>
            <div className="luxury__arch">
              <motion.img
                src={heroArch}
                alt="VIDEKO Luxusküche mit Bogenarchitektur"
                className="luxury__arch-img"
                style={{ y: archY, scale: archScale }}
                fetchPriority="high"
              />
              <span className="luxury__arch-rim" aria-hidden="true" />
              <span className="luxury__arch-fade" aria-hidden="true" />
            </div>
          </Reveal>
        </div>

        {/* three magazine cards */}
        <div className="luxury__cards">
          {CARDS.map((c, i) => (
            <Reveal key={c.num} delay={i * 0.08} className="luxury__cell">
              <article className="luxcard">
                <div
                  className="luxcard__image"
                  style={{ backgroundImage: `url(${c.image})` }}
                  aria-hidden="true"
                />
                <div className="luxcard__scrim" aria-hidden="true" />
                <div className="luxcard__edge" aria-hidden="true" />
                <div className="luxcard__content">
                  <div className="luxcard__top">
                    <span className="luxcard__num">{c.num}</span>
                    <span className="luxcard__icon" aria-hidden="true">
                      <c.icon size={20} strokeWidth={1.5} />
                    </span>
                  </div>
                  <div className="luxcard__body">
                    <h3 className="luxcard__title">
                      {c.title.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </h3>
                    <p className="luxcard__text">{c.text}</p>
                    <a className="luxcard__btn" href={c.href}>
                      <span>{c.cta}</span>
                      <ArrowRight size={17} strokeWidth={2} />
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* benefit strip */}
        <Reveal className="luxury__benefits">
          {BENEFITS.map((b) => (
            <div className="luxbenefit" key={b.title}>
              <span className="luxbenefit__icon" aria-hidden="true">
                <b.icon size={22} strokeWidth={1.4} />
              </span>
              <span className="luxbenefit__title">{b.title}</span>
              <span className="luxbenefit__text">{b.text}</span>
            </div>
          ))}
        </Reveal>

        {/* emblem */}
        <Reveal className="luxury__emblem">
          <span className="luxury__emblem-badge">
            <img src={emblem} alt="VIDEKO" />
          </span>
        </Reveal>
      </div>
    </section>
  )
}
