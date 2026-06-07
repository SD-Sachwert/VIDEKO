import { useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Check, X, ArrowRight, MapPin, Mail, Phone, ShieldCheck, Layers, Gem, Clock } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

import heroImg from '../assets/images/leistungen/ls-hero.png'
import featureImg from '../assets/images/leistungen/ls-feature.png'
import imgConsulting from '../assets/images/leistungen/ls-consulting.png'
import img3d from '../assets/images/leistungen/ls-3d.png'
import imgMaterials from '../assets/images/leistungen/ls-materials.png'
import imgInstall from '../assets/images/leistungen/ls-install.png'
import imgRenovation from '../assets/images/leistungen/ls-renovation.png'
import imgCoordination from '../assets/images/leistungen/ls-coordination.png'
import imgAftercare from '../assets/images/leistungen/ls-aftercare.png'
import vnVideo from '../assets/images/leistungen/vorher-nachher.mp4'

const USPS = [
  { icon: ShieldCheck, t: 'Persönlich & ehrlich' },
  { icon: Layers, t: 'Alles aus einer Hand' },
  { icon: Gem, t: 'Premium Materialien' },
  { icon: Clock, t: 'Termintreu & verlässlich' },
]
const FEATURE = ['Individuelle Beratung', 'Kreative Konzepte', 'Präzise Planung', 'Reibungslose Umsetzung', 'Verlässlicher Service']

const SERVICES8 = [
  { n: '01', title: 'Beratung & Planung', text: 'Wir hören zu, bevor wir planen – ehrlich, persönlich und auf Augenhöhe.', benefits: ['Beratung auf Augenhöhe', 'Klares Konzept', 'Ein fester Ansprechpartner'], gallery: [imgConsulting, featureImg, img3d] },
  { n: '02', title: 'Aufmaß & 3D-Planung', text: 'Millimetergenau gemessen und in 3D sichtbar gemacht – bevor etwas bestellt wird.', benefits: ['Laser-Aufmaß', '3D-Visualisierung', 'Planungssicherheit'], gallery: [img3d, imgConsulting, featureImg] },
  { n: '03', title: 'Materialien & Auswahl', text: 'Oberflächen, die nicht nur gut aussehen, sondern im Alltag bestehen.', benefits: ['Echte Muster zum Fühlen', 'Alltagstauglich', 'Premium-Oberflächen'], gallery: [imgMaterials, featureImg, imgConsulting] },
  { n: '04', title: 'Lichtplanung & Ambiente', text: 'Stimmung, Akzente und Funktion – im richtigen Licht wird aus Küche ein Raum.', benefits: ['Stimmungslicht', 'Gezielte Akzente', 'Funktionslicht'], gallery: [featureImg, heroImg, imgMaterials] },
  { n: '05', title: 'Lieferung & Montage', text: 'Termintreu geliefert und sauber durch unser eigenes Team aufgebaut.', benefits: ['Termintreu', 'Saubere Montage', 'Eigenes Team'], gallery: [imgInstall, imgRenovation, featureImg] },
  { n: '06', title: 'Geräte & Technik', text: 'Intelligente Geräte, nahtlos integriert – Technik, die den Alltag leichter macht.', benefits: ['Top-Marken', 'Smart integriert', 'Effizient & leise'], gallery: [imgInstall, img3d, imgMaterials] },
  { n: '07', title: 'Koordination & Gewerke', text: 'Maler, Elektrik, Boden, Trockenbau – wir steuern alle Gewerke für dich.', benefits: ['Alle Gewerke aus einer Hand', 'Ein klarer Plan', 'Kein Handwerker-Tetris'], gallery: [imgCoordination, imgRenovation, img3d] },
  { n: '08', title: 'Nachbetreuung & Service', text: 'Auch nach dem Einbau lassen wir dich nicht allein – versprochen.', benefits: ['Gemeinsame Abnahme', 'Schnell erreichbar', 'Langfristig für dich da'], gallery: [imgAftercare, imgConsulting, featureImg] },
]

const EMO = [
  { title: 'Kein Planungschaos', image: imgCoordination },
  { title: 'Keine Handwerker-Jonglage', image: imgRenovation },
  { title: 'Keine Materialsuche', image: imgMaterials },
  { title: 'Nur Vorfreude', image: imgAftercare },
]

const CLASSIC = ['Viele Ansprechpartner', 'Risiko von Fehlplanungen', 'Undurchsichtige Kosten', 'Unsicherheit bis zum Schluss']
const VIDEKO = ['Ein Ansprechpartner', 'Perfekte Planung & 3D-Visualisierung', 'Koordination aller Gewerke', 'Transparente Preise & feste Abläufe', 'Deine Küche. Genauso wie du sie willst.']

export default function Leistungen() {
  const heroRef = useRef(null)
  const [activeSvc, setActiveSvc] = useState(0)
  const [activeThumb, setActiveThumb] = useState(0)
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
          <div className="svc-hero__usps">
            {USPS.map((u, i) => (
              <Reveal key={u.t} delay={0.1 + i * 0.07} className="svc-uspcard">
                <span className="svc-uspcard__ic"><u.icon size={18} strokeWidth={1.7} /></span>
                <span className="svc-uspcard__t">{u.t}</span>
              </Reveal>
            ))}
          </div>
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

      {/* 3 — INTERAKTIVE LEISTUNGSSEKTION (hell) */}
      <section className="section leist-svc8" id="leist-services">
        <div className="container">
          <SectionHeader align="center" kicker="Unsere Leistungen" title={<>Von der ersten Idee bis zur fertigen Küche. <span className="grad">Alles aus einer Hand.</span></>} lead="Klick dich durch unsere Leistungen – und sieh, was hinter jedem Schritt steckt." />
          <div className="svc8">
            <div className="svc8__list">
              {SERVICES8.map((s, i) => (
                <button key={s.title} type="button" className={`svc8__card ${activeSvc === i ? 'is-active' : ''}`} onClick={() => { setActiveSvc(i); setActiveThumb(0) }}>
                  <span className="svc8__n">{s.n}</span>
                  <span className="svc8__ctitle">{s.title}</span>
                  <ArrowRight className="svc8__arrow" size={16} strokeWidth={1.9} />
                </button>
              ))}
            </div>
            <div className="svc8__detail">
              <AnimatePresence mode="wait">
                <motion.div key={activeSvc} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="svc8__hero">
                    <AnimatePresence mode="wait">
                      <motion.span key={activeThumb} className="svc8__heroimg" style={{ backgroundImage: `url(${SERVICES8[activeSvc].gallery[activeThumb]})` }} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
                    </AnimatePresence>
                    <span className="svc8__badge">{SERVICES8[activeSvc].n}</span>
                  </div>
                  <div className="svc8__thumbs">
                    {SERVICES8[activeSvc].gallery.map((g, k) => (
                      <button key={k} type="button" className={`svc8__thumb ${activeThumb === k ? 'is-active' : ''}`} style={{ backgroundImage: `url(${g})` }} onClick={() => setActiveThumb(k)} aria-label={`Bild ${k + 1}`} />
                    ))}
                  </div>
                  <h3 className="svc8__title">{SERVICES8[activeSvc].title}</h3>
                  <p className="svc8__text">{SERVICES8[activeSvc].text}</p>
                  <ul className="svc8__benefits">{SERVICES8[activeSvc].benefits.map((b) => <li key={b}><Check size={15} strokeWidth={2.4} /> {b}</li>)}</ul>
                  <CTAButton to="/beratung">Beratung anfragen</CTAButton>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — EMOTIONAL (dunkles Band, wie Referenz) */}
      <section className="section section--dark leist-emo">
        <div className="container">
          <SectionHeader tone="light" align="center" kicker="Entspannt" title={<>Weniger Chaos. <span className="grad">Mehr Zeit für das, was zählt.</span></>} />
          <div className="lservice-grid lservice-grid--4">
            {EMO.map((e, i) => (
              <Reveal key={e.title} delay={(i % 4) * 0.06}>
                <article className="lscard lscard--emo">
                  <span className="lscard__img" style={{ backgroundImage: `url(${e.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="lscard__body"><span className="lscard__title">{e.title}</span></span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — COMPARE (hell) */}
      <section className="section leist-compare">
        <div className="container">
          <SectionHeader align="center" kicker="Der Unterschied" title={<>Klassisch geplant oder <span className="grad">VIDEKO geplant?</span></>} />
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
