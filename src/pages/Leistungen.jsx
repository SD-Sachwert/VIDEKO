import { useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Check, X, ArrowRight, MapPin, Mail, Phone,
  PencilRuler, Ruler, Layers, Lightbulb, Truck, Cpu, CalendarClock, LifeBuoy, UserCheck, CalendarCheck, Coffee,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

import heroImg from '../assets/images/leistungen/ls-hero.png'
import featureImg from '../assets/images/leistungen/ls-feature.png'
import vnVideo from '../assets/images/leistungen/vorher-nachher.mp4'
import p01 from '../assets/images/leistungen/baustein/panel-01.png'
import p02 from '../assets/images/leistungen/baustein/panel-02.png'
import p03 from '../assets/images/leistungen/baustein/panel-03.png'
import p04 from '../assets/images/leistungen/baustein/panel-04.png'
import p05 from '../assets/images/leistungen/baustein/panel-05.png'
import p06 from '../assets/images/leistungen/baustein/panel-06.png'
import p07 from '../assets/images/leistungen/baustein/panel-07.png'
import p08 from '../assets/images/leistungen/baustein/panel-08.png'

const FEATURE = ['Individuelle Beratung', 'Kreative Konzepte', 'Präzise Planung', 'Reibungslose Umsetzung', 'Verlässlicher Service']

const BAUSTEINE = [
  { n: '01', title: 'Beratung & Planung', icon: PencilRuler, short: 'Wir hören zu und planen mit dir.', panel: p01 },
  { n: '02', title: 'Aufmaß & 3D-Planung', icon: Ruler, short: 'Millimetergenau, in 3D sichtbar.', panel: p02 },
  { n: '03', title: 'Materialien & Auswahl', icon: Layers, short: 'Oberflächen, die im Alltag bestehen.', panel: p03 },
  { n: '04', title: 'Lichtplanung & Ambiente', icon: Lightbulb, short: 'Licht für Stimmung und Funktion.', panel: p04 },
  { n: '05', title: 'Lieferung & Montage', icon: Truck, short: 'Termintreu geliefert und montiert.', panel: p05 },
  { n: '06', title: 'Geräte & Technik', icon: Cpu, short: 'Technik, die zu deinem Alltag passt.', panel: p06 },
  { n: '07', title: 'Koordination & Gewerke', icon: CalendarClock, short: 'Ein Plan, alle Gewerke gesteuert.', panel: p07 },
  { n: '08', title: 'Nachbetreuung & Service', icon: LifeBuoy, short: 'Auch nach dem Einbau für dich da.', panel: p08 },
]

const STATS = [
  { v: '98%', l: 'zufriedene Kunden' },
  { v: '12+', l: 'Jahre Erfahrung' },
  { v: '500+', l: 'Küchen realisiert' },
]

const BENEFITS = [
  { icon: Layers, title: 'Weniger Abstimmung', text: 'Wir sprechen mit allen, damit du es nicht musst.' },
  { icon: UserCheck, title: 'Ein fester Ansprechpartner', text: 'Du hast immer einen, der dein Projekt kennt.' },
  { icon: CalendarCheck, title: 'Klare Abläufe', text: 'Transparente Prozesse, verlässliche Termine.', dark: true },
  { icon: Coffee, title: 'Entspannter zur neuen Küche', text: 'Du hältst den Kopf frei – von Anfang an.' },
]

const CLASSIC = ['Viele Ansprechpartner', 'Unklare Zuständigkeiten', 'Schwer vergleichbare Angebote', 'Wenig echte Visualisierung', 'Material ohne Raumgefühl', 'Kosten ändern sich spät', 'Planung & Montage nicht verzahnt', 'Du koordinierst vieles selbst', 'Am Ende sieht es anders aus als gedacht']
const VIDEKO = ['Ein klarer Ansprechpartner', 'Ehrliche Beratung statt Verkaufsdruck', 'Perfekte Planung & 3D-Visualisierung', 'Transparente Preise & feste Abläufe', 'Material, Licht & Raumwirkung zusammen gedacht', 'Planung passend zu Alltag & Budget', 'Aufmaß, Lieferung & Montage aus einem Prozess', 'Du weißt vorher, was du bekommst', 'Keine Küchenlotterie, sondern Klarheit']

export default function Leistungen() {
  const heroRef = useRef(null)
  const [activeL, setActiveL] = useState(0)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  return (
    <div className="leist-page">
      {/* 1 — HERO (dark) */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Unsere Leistungen</span>
            <h1 className="pagehero__title">Du willst eine Küche.<br /><span className="grad">Wir kümmern uns um den Rest.</span></h1>
            <p className="pagehero__lead">
              Von der ersten Idee bis zur fertigen Küche: Beratung, Planung, Materialien,
              Aufmaß, Lieferung, Montage und Service – sauber geführt, ehrlich beraten, ohne Küchenchaos.
            </p>
            <div className="pagehero__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <a className="leist-hero__link" href="#leist-services">Leistungen entdecken <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2 — INTRO FEATURE (hell) + Video */}
      <section className="section leist-transform">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__copy">
              <span className="kicker">Unser Anspruch</span>
              <h2 className="lintro__title">Mehr als nur Planung –<br /><span className="grad">wir schaffen Klarheit.</span></h2>
              <p className="lintro__text">Ideen, Maße, Budget, Geräte, Handwerker, Termine – wir sortieren das Ganze und machen daraus einen Ablauf, der für dich Sinn ergibt.</p>
              <ul className="lstances">
                {FEATURE.map((c) => <li key={c}><Check size={16} strokeWidth={2.4} /> {c}</li>)}
              </ul>
              <CTAButton to="/ueber-uns">Mehr über uns</CTAButton>
            </Reveal>
            <Reveal className="lintro__media" delay={0.08}>
              <div className="svc-video__frame">
                <div className="svc-video__labels" aria-hidden="true"><span>Vorher</span><span>Planung</span><span>Nachher</span></div>
                <video className="svc-video__vid" autoPlay muted loop playsInline preload="none" poster={featureImg} aria-hidden="true">
                  <source src={vnVideo} type="video/mp4" />
                </video>
                <span className="lintro__rim" aria-hidden="true" />
              </div>
              <div className="svc-microusp">
                <span>Persönliche Planung</span><span>3D-Visualisierung</span><span>Festpreis & Termin</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3 — 8-LEISTUNGS-BAUSTEIN (interaktiv) */}
      <section className="section leist-bau" id="leist-services">
        <div className="container">
          <SectionHeader align="center" kicker="Unser Prozess" title={<>Alles aus einer Hand. <span className="grad">Schritt für Schritt.</span></>} lead="Klick dich durch unsere acht Leistungen – immer eine im Fokus." />
          <div className="leistbau">
            <div className="leistbau__nav">
              {BAUSTEINE.map((b, i) => (
                <button key={b.title} type="button" className={`leistbau__item ${activeL === i ? 'is-active' : ''}`} onClick={() => setActiveL(i)}>
                  <span className="leistbau__n">{b.n}</span>
                  <span className="leistbau__ic"><b.icon size={17} strokeWidth={1.7} /></span>
                  <span className="leistbau__label">{b.title}</span>
                </button>
              ))}
            </div>
            <div className="leistbau__stage">
              <AnimatePresence mode="wait">
                <motion.div key={activeL} className="leistbau__panel"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  <Link to="/beratung" aria-label={`${BAUSTEINE[activeL].title} – Beratung anfragen`}><img src={BAUSTEINE[activeL].panel} alt={BAUSTEINE[activeL].title} /></Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — PROZESS / TIMELINE */}
      <section className="section section--light leist-timeline">
        <div className="container">
          <div className="ltl">
            <Reveal className="ltl__intro">
              <span className="kicker">Dein Weg zur Küche</span>
              <h2 className="lintro__title">Deine neue Küche. <span className="grad">Ein klarer Prozess.</span></h2>
              <p className="lintro__text">Acht Schritte, ein Team, ein Ergebnis – du weißt jederzeit, woran wir gerade arbeiten.</p>
              <div className="ltl__img"><img src={featureImg} alt="" loading="lazy" /></div>
            </Reveal>
            <ol className="ltl__list">
              {BAUSTEINE.map((b, i) => (
                <Reveal key={b.title} className="ltl__step" delay={(i % 4) * 0.05}>
                  <span className="ltl__n">{b.n}</span>
                  <span className="ltl__body"><span className="ltl__t">{b.title}</span><span className="ltl__d">{b.short}</span></span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 5 — VORTEILE / BENEFITS */}
      <section className="section leist-benefits">
        <div className="container">
          <div className="lbf">
            <Reveal className="lbf__left">
              <span className="kicker">Das bringt dir VIDEKO</span>
              <h2 className="lintro__title">Weniger Chaos. <span className="grad">Mehr Zeit für das, was zählt.</span></h2>
              <p className="lintro__text">Wir nehmen dir die Arbeit ab – damit du dich auf das Ergebnis freust, nicht auf den Stress.</p>
              <div className="lbf__stats">
                {STATS.map((s) => <span key={s.l} className="lbf__stat"><b>{s.v}</b><i>{s.l}</i></span>)}
              </div>
            </Reveal>
            <div className="lbf__cards">
              {BENEFITS.map((b, i) => (
                <Reveal key={b.title} className={`lbf__card ${b.dark ? 'is-dark' : ''}`} delay={(i % 2) * 0.06}>
                  <span className="lbf__cic"><b.icon size={20} strokeWidth={1.6} /></span>
                  <span className="lbf__ctitle">{b.title}</span>
                  <span className="lbf__ctext">{b.text}</span>
                </Reveal>
              ))}
            </div>
            <Reveal className="lbf__media" delay={0.1}><span className="lbf__img" style={{ backgroundImage: `url(${heroImg})` }} aria-hidden="true" /></Reveal>
          </div>
        </div>
      </section>

      {/* 7 — COMPARE (hell) */}
      <section className="section leist-compare">
        <div className="container">
          <SectionHeader align="center" kicker="Der Unterschied" title={<>Klassisch geplant oder <span className="grad">VIDEKO geplant?</span></>} lead="Der Unterschied liegt nicht nur im Ergebnis. Sondern in jedem Schritt davor." />
          <div className="svc-compare">
            <Reveal className="svc-comp svc-comp--bad">
              <span className="svc-comp__head">Klassisch</span>
              <ul>{CLASSIC.map((c) => <li key={c}><X size={15} strokeWidth={2.6} /> {c}</li>)}</ul>
            </Reveal>
            <span className="svc-compare__vs" aria-hidden="true">vs.</span>
            <Reveal className="svc-comp svc-comp--good" delay={0.08}>
              <span className="svc-comp__head">VIDEKO</span>
              <ul>{VIDEKO.map((c) => <li key={c}><Check size={15} strokeWidth={2.6} /> {c}</li>)}</ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 8 — FINAL CTA (dunkel) + Kontakt */}
      <section className="leist-final leist-final--svc">
        <div className="leist-final__media" aria-hidden="true">
          <img src={heroImg} alt="" />
          <div className="leist-final__veil" />
        </div>
        <div className="container leist-final__inner">
          <Reveal>
            <span className="kicker kicker--gold">Bereit?</span>
            <h2 className="leist-final__title">Deine Küche. Unser Versprechen.<br /><span className="grad">Wir machen es einfach.</span></h2>
            <p className="leist-final__text">Unverbindlich, persönlich und auf Augenhöhe.</p>
            <div className="leist-final__actions">
              <CTAButton to="/beratung">Termin vereinbaren</CTAButton>
              <CTAButton to="/studio" variant="dark">Studio erleben</CTAButton>
            </div>
            <div className="svc-contact">
              <span><MapPin size={14} strokeWidth={1.9} /> Hertzstraße 4, 97076 Würzburg</span>
              <a href="mailto:info@videko-kuechen.de"><Mail size={14} strokeWidth={1.9} /> info@videko-kuechen.de</a>
              <a href="tel:+4901605545818"><Phone size={14} strokeWidth={1.9} /> 0160 5545818</a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
