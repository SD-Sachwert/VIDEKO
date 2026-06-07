import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  PencilRuler, Layers, Cpu, Lightbulb, Box, Ruler, CalendarClock, Truck, Wrench, LifeBuoy,
  Wallet, MessageSquare, ArrowRight, Check, X,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ProcessTimeline from '../components/ProcessTimeline.jsx'

import heroImg from '../assets/images/leistungen/svc-hero.png'
import chaosImg from '../assets/images/leistungen/svc-chaos-plan.png'
import imgPlanung from '../assets/images/leistungen/svc-planung.png'
import imgMaterial from '../assets/images/leistungen/svc-material.png'
import imgAufmass from '../assets/images/leistungen/svc-aufmass.png'
import imgMontage from '../assets/images/leistungen/svc-montage.png'
import img3d from '../assets/images/leistungen/svc-3d.png'
import imgBeratung from '../assets/images/leistungen/svc-beratung.png'
import ctaImg from '../assets/images/leistungen/svc-cta-lounge.png'

const ICONSTRIP = [
  { icon: PencilRuler, label: 'Planung' },
  { icon: Layers, label: 'Material' },
  { icon: Ruler, label: 'Aufmaß' },
  { icon: Wrench, label: 'Montage' },
  { icon: LifeBuoy, label: 'Service' },
]

const CHAOS = ['Raum verstehen', 'Ideen sortieren', 'Budget realistisch einordnen', 'Umsetzung sauber führen']

const MODULES = [
  { icon: PencilRuler, title: 'Küchenplanung', text: 'Maßgeschneidert auf dich und deinen Alltag.' },
  { icon: Layers, title: 'Materialauswahl', text: 'Oberflächen, die bleiben – nicht nur im Prospekt.' },
  { icon: Cpu, title: 'Geräteberatung', text: 'Technik, die passt – nicht das teuerste Cockpit.' },
  { icon: Lightbulb, title: 'Lichtkonzept', text: 'Stimmung, Akzente und Funktion im richtigen Licht.' },
  { icon: Box, title: '3D-Planung', text: 'Du siehst deine Küche, bevor sie gebaut wird.' },
  { icon: Ruler, title: 'Aufmaß', text: 'Millimetergenau per Laser. Damit nichts hakt.' },
  { icon: CalendarClock, title: 'Koordination', text: 'Termine und Gewerke – wir halten das zusammen.' },
  { icon: Truck, title: 'Lieferung', text: 'Sauber geplant, pünktlich, ohne Drama.' },
  { icon: Wrench, title: 'Montage', text: 'Termintreu aufgebaut – ohne Chaos bei dir.' },
  { icon: LifeBuoy, title: 'Service', text: 'Auch nach dem Einbau noch für dich da.' },
]

const STORIES = [
  { title: 'Wir planen nicht nur Schränke. Wir planen deinen Alltag.', text: 'Wo stehst du morgens? Wo landet der Einkauf? Wer kocht, wer steht im Weg? Genau da beginnt gute Küchenplanung.', image: imgPlanung },
  { title: 'Materialien, die nicht nur gut aussehen.', text: 'Schön ist Pflicht. Alltagstauglich ist wichtiger. Wir zeigen dir, was bleibt – und was nur im Prospekt glänzt.', image: imgMaterial },
  { title: 'Aufmaß, Koordination, Montage – ohne Handwerker-Tetris.', text: 'Du brauchst keinen Masterplan für Gewerke, Termine und Maße. Den bringen wir mit.', image: imgAufmass },
  { title: 'Sichtbar planen statt raten.', text: 'Erste Konzepte, 3D-Visualisierung und echte Kostentransparenz – du weißt, worauf du dich freust.', image: img3d },
  { title: 'Lieferung & Montage aus einer Hand.', text: 'Ein Team, ein Ansprechpartner, volle Verantwortung – bis die letzte Schraube sitzt.', image: imgMontage },
  { title: 'Service, wenn andere schon weg sind.', text: 'Auch nach dem Einbau lassen wir dich nicht mit Fragezeichen und Schranktüren allein.', image: imgBeratung },
]

const SPAR = [
  { icon: Ruler, title: 'Zollstock-Panik', text: 'Wir messen. Nicht du.' },
  { icon: Cpu, title: 'Geräte-Wirrwarr', text: 'Wir finden, was wirklich passt.' },
  { icon: CalendarClock, title: 'Handwerker-Tetris', text: 'Wir koordinieren. Du lehnst dich zurück.' },
  { icon: Wallet, title: 'Budget-Nebel', text: 'Klare Preise. Keine Überraschungen.' },
  { icon: MessageSquare, title: 'Möbelhaus-Blabla', text: 'Ehrliche Beratung statt leerer Versprechen.' },
]

const PROCESS = [
  { title: 'Wir hören zu', text: 'Deine Wünsche, dein Raum, dein Alltag – wir verstehen erst, bevor wir planen.' },
  { title: 'Wir sortieren das Chaos', text: 'Ideen, Anforderungen, Budget – wir schaffen Klarheit.' },
  { title: 'Wir planen sichtbar', text: 'Erste Konzepte, 3D-Visualisierung und echte Kostentransparenz.' },
  { title: 'Wir machen es greifbar', text: 'Materialien, Details und Licht – alles zum Anfassen.' },
  { title: 'Wir koordinieren sauber', text: 'Aufmaß, Lieferung, Montage – alles perfekt abgestimmt.' },
  { title: 'Deine Küche ergibt Sinn', text: 'Durchdacht, schön und bereit für dein echtes Leben.' },
]

const CLASSIC = ['Standardlösungen von der Stange', 'Viele Ansprechpartner, wenig Verantwortung', 'Planung aus Katalogen, wenig Alltag', 'Unklare Kosten, böse Überraschungen', 'Koordination? Viel Glück.']
const VIDEKO = ['Maßgeschneiderte Lösung für dein Leben', 'Ein Team, ein Ansprechpartner, volle Verantwortung', 'Planung mit Zeit, Ruhe und echter Expertise', 'Transparente Preise, ehrlich von Anfang an', 'Eine Küche, die dich jeden Tag begeistert']

export default function Leistungen() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  return (
    <div className="leist-page">
      {/* 1 — HERO */}
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
              Von der ersten Idee bis zur letzten Schraube: VIDEKO übernimmt Planung, Materialien,
              Aufmaß, Koordination, Lieferung, Montage und Service. Sauber geführt. Ehrlich beraten. Ohne Küchenchaos.
            </p>
            <div className="pagehero__actions">
              <CTAButton to="/beratung">Projekt starten</CTAButton>
              <a className="leist-hero__link" href="#leist-machine">Leistungen entdecken <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
            <div className="svc-iconstrip">
              {ICONSTRIP.map((s, i) => (
                <div className="svc-iconstrip__item" key={s.label} style={{ '--d': `${i * 0.08}s` }}>
                  <span className="svc-iconstrip__ic"><s.icon size={18} strokeWidth={1.7} /></span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2 — TRANSFORMATION */}
      <section className="section leist-transform">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__copy">
              <span className="kicker">Vom Chaos zum Plan</span>
              <h2 className="lintro__title">Aus Küchenchaos wird<br /><span className="grad">ein klarer Plan.</span></h2>
              <ul className="lstances">
                {CHAOS.map((c) => <li key={c}><Check size={16} strokeWidth={2.4} /> {c}</li>)}
              </ul>
              <CTAButton to="/beratung">Projekt starten</CTAButton>
            </Reveal>
            <Reveal className="lintro__media" delay={0.08}>
              <div className="lintro__frame svc-split">
                <img src={chaosImg} alt="Aus Küchenchaos wird ein klarer Plan" loading="lazy" />
                <span className="svc-split__tag svc-split__tag--l">Vorher</span>
                <span className="svc-split__tag svc-split__tag--r">Nachher</span>
                <span className="lintro__rim" aria-hidden="true" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3 — LEISTUNGSMASCHINE */}
      <section className="section section--dark leist-machine" id="leist-machine">
        <div className="container">
          <SectionHeader tone="light" align="center" kicker="Alles aus einer Hand" title={<>Was wir für dich <span className="grad">übernehmen.</span></>} lead="Zehn Schritte, ein Team. Beim Scrollen siehst du, wie sich der ganze Ablauf zusammensetzt." />
          <div className="svc-machine">
            {MODULES.map((m, i) => (
              <Reveal key={m.title} delay={(i % 5) * 0.05}>
                <div className="svc-mod">
                  <span className="svc-mod__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="svc-mod__ic"><m.icon size={22} strokeWidth={1.6} /></span>
                  <span className="svc-mod__title">{m.title}</span>
                  <span className="svc-mod__text">{m.text}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — STORY CARDS */}
      <section className="section leist-stories">
        <div className="container">
          <SectionHeader kicker="Im Detail" title={<>Was das konkret <span className="grad">für dich heißt.</span></>} />
          <div className="lservice-grid">
            {STORIES.map((s, i) => (
              <Reveal key={s.title} delay={(i % 3) * 0.06}>
                <article className="lscard lscard--tall">
                  <span className="lscard__img" style={{ backgroundImage: `url(${s.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="lscard__body">
                    <span className="lscard__title">{s.title}</span>
                    <span className="lscard__text">{s.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — WAS DU DIR SPAREN KANNST */}
      <section className="section section--dark leist-spar">
        <div className="container">
          <SectionHeader tone="light" align="center" kicker="Entspannt" title={<>Was du dir <span className="grad">sparen kannst.</span></>} />
          <div className="svc-spar">
            {SPAR.map((s, i) => (
              <Reveal key={s.title} delay={(i % 5) * 0.05}>
                <div className="svc-spar__card">
                  <span className="svc-spar__ic"><s.icon size={20} strokeWidth={1.6} /></span>
                  <span className="svc-spar__title">{s.title}</span>
                  <span className="svc-spar__text">{s.text}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — TIMELINE */}
      <section className="section section--dark leist-ablauf2">
        <div className="container">
          <SectionHeader tone="light" align="center" kicker="Der VIDEKO-Weg" title={<>Klarer Ablauf. <span className="grad">Stressfrei für dich.</span></>} />
          <ProcessTimeline steps={PROCESS} />
        </div>
      </section>

      {/* 7 — COMPARE */}
      <section className="section leist-compare">
        <div className="container">
          <SectionHeader align="center" kicker="Der Unterschied" title={<>Klassisch <span className="grad">vs. VIDEKO.</span></>} />
          <div className="svc-compare">
            <Reveal className="svc-comp svc-comp--bad">
              <span className="svc-comp__head">Klassisch</span>
              <ul>{CLASSIC.map((c) => <li key={c}><X size={15} strokeWidth={2.6} /> {c}</li>)}</ul>
            </Reveal>
            <span className="svc-compare__vs" aria-hidden="true">VS</span>
            <Reveal className="svc-comp svc-comp--good" delay={0.08}>
              <span className="svc-comp__head">VIDEKO</span>
              <ul>{VIDEKO.map((c) => <li key={c}><Check size={15} strokeWidth={2.6} /> {c}</li>)}</ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 8 — FINAL CTA */}
      <section className="leist-final leist-final--svc">
        <div className="leist-final__media" aria-hidden="true">
          <img src={ctaImg} alt="" />
          <div className="leist-final__veil" />
        </div>
        <div className="container leist-final__inner">
          <Reveal>
            <span className="kicker kicker--gold">Bereit?</span>
            <h2 className="leist-final__title">Lass uns aus deinem Küchenchaos<br /><span className="grad">einen Plan machen.</span></h2>
            <p className="leist-final__text">Unverbindlich. Persönlich. Auf Augenhöhe.</p>
            <div className="leist-final__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/studio" variant="dark">Studio erleben</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
