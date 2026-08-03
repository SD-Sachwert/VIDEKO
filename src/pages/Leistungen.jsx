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
import { KiHinweis } from '../components/legal/KiKennzeichnung.jsx'

import heroImg from '../assets/images/leistungen/ls-hero.png'
import featureImg from '../assets/images/leistungen/ls-feature.png'
import img3d from '../assets/images/leistungen/ls-3d.png'
import imgMat from '../assets/images/leistungen/ls-materials.png'
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
  { v: '0', l: 'Küchenbasar' },
  { v: '1', l: 'klarer Ablauf' },
  { v: '7', l: 'Schritte bis zur fertigen Küche' },
]

const BENEFITS = [
  { icon: Layers, title: 'Weniger Abstimmung', text: 'Wir sprechen mit allen, damit du es nicht musst.' },
  { icon: UserCheck, title: 'Ein fester Ansprechpartner', text: 'Du hast immer einen, der dein Projekt kennt.' },
  { icon: CalendarCheck, title: 'Klare Abläufe', text: 'Transparente Prozesse, verlässliche Termine.' },
  { icon: Coffee, title: 'Entspannter zur neuen Küche', text: 'Du hältst den Kopf frei – von Anfang an.' },
]

const PROCESS6 = [
  { n: '01', title: 'Beratung & Planung', text: 'Wir definieren Wünsche, Stil und Budget.' },
  { n: '02', title: 'Aufmaß & Technik', text: 'Wir prüfen Maße, Anschlüsse und Raumdetails.' },
  { n: '03', title: 'Koordination', text: 'Wir stimmen Liefertermine, Gewerke und Ablauf ab.' },
  { n: '04', title: 'Bestellung', text: 'Wir bestellen Küche und Komponenten in geprüfter Qualität.' },
  { n: '05', title: 'Montage', text: 'Unsere Profis montieren sauber, präzise und termingerecht.' },
  { n: '06', title: 'Feinschliff & Übergabe', text: 'Wir prüfen jedes Detail und übergeben deine Küche sauber.' },
  { n: '07', title: 'Nachbetreuung & Ansprechpartner', text: 'Küche fertig heißt bei uns nicht: Viel Glück, tschüss. Wir bleiben dein Ansprechpartner.' },
]

const KLAR = [
  { icon: Check, title: 'Status statt Rätselraten', text: 'Wir halten dich über Planung, Bestellung, Lieferung und Montage auf dem Laufenden.' },
  { icon: CalendarClock, title: 'Gewerke sauber koordiniert', text: 'Aufmaß, Anschlüsse, Lieferung und Montage greifen ineinander – ohne Chaos-Ballett im Hausflur.' },
  { icon: Ruler, title: 'Details vorab geklärt', text: 'Maße, Technik, Materialien und offene Punkte werden geprüft, bevor es teuer wird.' },
  { icon: LifeBuoy, title: 'Übergabe mit Feinschliff', text: 'Wir gehen deine Küche mit dir durch, erklären Details und kümmern uns um Restpunkte.' },
]

const FAHRPLAN = ['Beratung abgeschlossen', 'Planung abgestimmt', 'Technik geprüft', 'Bestellung freigegeben', 'Montage terminiert', 'Übergabe erledigt']

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
        <div className="pagehero__media">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} aria-hidden="true" />
          <div className="pagehero__veil" aria-hidden="true" />
          <KiHinweis className="pagehero__ainote" variant="visualization" />
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
          <Reveal className="vfeature">
            <video className="vfeature__vid" autoPlay muted loop playsInline preload="none" poster={featureImg} aria-hidden="true">
              <source src={vnVideo} type="video/mp4" />
            </video>
            <span className="vfeature__veil" aria-hidden="true" />
            <div className="vfeature__copy">
              <span className="kicker kicker--gold">Unser Anspruch</span>
              <h2 className="vfeature__title">Mehr als nur Planung –<br /><span className="grad">wir schaffen Klarheit.</span></h2>
              <p className="vfeature__text">Ideen, Maße, Budget, Geräte, Handwerker, Termine – wir sortieren das Ganze und machen daraus einen Ablauf, der für dich Sinn ergibt.</p>
              <ul className="vfeature__list">
                {FEATURE.map((c) => <li key={c}><Check size={15} strokeWidth={2.4} /> {c}</li>)}
              </ul>
              <CTAButton to="/ueber-uns">Mehr über uns</CTAButton>
            </div>
          </Reveal>
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
                  <span className="leistbau__ic"><b.icon size={20} strokeWidth={1.6} /></span>
                  <span className="leistbau__body">
                    <span className="leistbau__label">{b.title}</span>
                    <span className="leistbau__sub">{b.short}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="leistbau__stage">
              <AnimatePresence mode="wait">
                <motion.div key={activeL} className="leistbau__panel"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  <img src={BAUSTEINE[activeL].panel} alt={BAUSTEINE[activeL].title} draggable={false} />
                  <Link to="/beratung" className="leistbau__cta" aria-label={`${BAUSTEINE[activeL].title} – Beratung anfragen`}>Beratung anfragen</Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — VORTEILE / BENEFITS (erst emotionaler Nutzen) */}
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

      {/* 5 — PROZESS / TIMELINE (dann konkreter Ablauf) */}
      <section className="section section--light leist-timeline">
        <div className="container">
          <div className="ltl">
            <Reveal className="ltl__intro">
              <span className="kicker">So läuft's ab</span>
              <h2 className="lintro__title">Deine neue Küche. <span className="grad">Ein klarer Prozess.</span></h2>
              <p className="lintro__text">Strukturiert, transparent und persönlich begleitet – von der ersten Idee bis zur letzten Schraube.</p>
              <div className="ltl__hero">
                <img src={featureImg} alt="" loading="lazy" />
                <span className="ltl__overlay"><b>Dein Projekt im Blick</b><i>Wir koordinieren alle Gewerke und halten dich immer auf dem Laufenden.</i></span>
              </div>
            </Reveal>
            <ol className="ltl__list">
              {PROCESS6.map((b, i) => (
                <Reveal key={b.title} className="ltl__step" delay={(i % 7) * 0.05}>
                  <span className="ltl__n">{b.n}</span>
                  <span className="ltl__body"><span className="ltl__t">{b.title}</span><span className="ltl__d">{b.text}</span></span>
                </Reveal>
              ))}
            </ol>
            <div className="ltl__cards">
              <Reveal className="ltl__card"><img src={img3d} alt="" loading="lazy" /><span className="ltl__cardov"><b>Präzise Planung</b><i>für perfekte Ergebnisse.</i></span></Reveal>
              <Reveal className="ltl__card" delay={0.1}><img src={imgMat} alt="" loading="lazy" /><span className="ltl__cardov"><b>Qualität, die man sieht</b><i>und spürt.</i></span></Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — KLARER ABLAUF (hell) */}
      <section className="section leist-klar">
        <div className="container">
          <SectionHeader align="center" kicker="Verlässlich" title={<>Klarer Ablauf. <span className="grad">Stressfrei für dich.</span></>} lead="Du weißt immer, was erledigt ist, was als Nächstes kommt und wer sich kümmert. Kein Rätselraten, kein Hinterhertelefonieren." />
          <div className="klar">
            <div className="klar__cards">
              {KLAR.map((k, i) => (
                <Reveal key={k.title} className="klar__card" delay={(i % 2) * 0.06}>
                  <span className="klar__ic"><k.icon size={20} strokeWidth={1.6} /></span>
                  <span className="klar__t">{k.title}</span>
                  <span className="klar__d">{k.text}</span>
                </Reveal>
              ))}
            </div>
            <Reveal className="klar__plan" delay={0.05}>
              <span className="klar__plan-title">Dein Küchenfahrplan</span>
              <span className="klar__plan-sub">Schritt für Schritt abgehakt – damit du den Überblick behältst.</span>
              <ul className="klar__list">
                {FAHRPLAN.map((f, i) => (
                  <Reveal key={f} as="li" className="klar__item" delay={i * 0.1}>
                    <span className="klar__check"><Check size={13} strokeWidth={3} /></span> {f}
                  </Reveal>
                ))}
              </ul>
            </Reveal>
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

    </div>
  )
}
