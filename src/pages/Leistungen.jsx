import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Check, X, ArrowRight, MapPin, Mail, Phone, ShieldCheck, Layers, Gem, Clock } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ProcessTimeline from '../components/ProcessTimeline.jsx'
import BeforeAfter from '../components/BeforeAfter.jsx'

import heroImg from '../assets/images/leistungen/ls-hero.png'
import featureImg from '../assets/images/leistungen/ls-feature.png'
import beforeImg from '../assets/images/leistungen/ls-before.png'
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

const SERVICES = [
  { title: 'Beratung & Planung', text: 'Wir hören zu, bevor wir planen – ehrlich und auf Augenhöhe.', image: imgConsulting },
  { title: 'Aufmaß & 3D-Planung', text: 'Millimetergenau gemessen, in 3D sichtbar gemacht.', image: img3d },
  { title: 'Materialien & Geräte', text: 'Oberflächen und Technik, die im Alltag bestehen.', image: imgMaterials },
  { title: 'Lichtplanung & Ambiente', text: 'Stimmung, Akzente und Funktion im richtigen Licht.', image: featureImg },
  { title: 'Lieferung & Montage', text: 'Termintreu geliefert und sauber aufgebaut.', image: imgInstall },
  { title: 'Gewerke & Umbau', text: 'Maler, Elektrik, Boden – wir steuern den ganzen Raum.', image: imgRenovation },
  { title: 'Koordination', text: 'Ein Ansprechpartner hält alle Fäden zusammen.', image: imgCoordination },
  { title: 'Nachbetreuung & Service', text: 'Auch nach dem Einbau noch für dich da.', image: imgAftercare },
]

const PROCESS = [
  { title: 'Kennenlernen', text: 'Wir verstehen deinen Raum, deinen Alltag und deine Wünsche.' },
  { title: 'Idee & Konzept', text: 'Aus Wünschen wird eine klare Richtung.' },
  { title: 'Planung & Visualisierung', text: 'Du siehst deine Küche in 3D, bevor etwas bestellt wird.' },
  { title: 'Angebot & Feinplanung', text: 'Transparent, ehrlich und bis ins Detail durchdacht.' },
  { title: 'Lieferung & Montage', text: 'Sauber koordiniert und termintreu umgesetzt.' },
  { title: 'Übergabe & Service', text: 'Gemeinsame Abnahme – und Begleitung danach.' },
]

const BA_POINTS = ['Ein Ansprechpartner von Anfang bis Ende', 'Keine bösen Überraschungen', 'Erfahrenes Team & eingespielte Partner', 'Qualität, die bleibt']

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
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3 — SERVICES (hell) */}
      <section className="section leist-services2" id="leist-services">
        <div className="container">
          <SectionHeader align="center" kicker="Leistungen" title={<>Unsere Leistungen. <span className="grad">Dein Vorteil.</span></>} lead="Alles, was du für eine richtig gute Küche brauchst – aus einer Hand." />
          <div className="svc-cards">
            {SERVICES.map((sv, i) => (
              <Reveal key={sv.title} delay={(i % 4) * 0.05}>
                <article className="svc-card">
                  <span className="svc-card__img" style={{ backgroundImage: `url(${sv.image})` }} aria-hidden="true" />
                  <span className="svc-card__body">
                    <span className="svc-card__title">{sv.title}</span>
                    <span className="svc-card__text">{sv.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="section__cta"><CTAButton to="/beratung">Projekt starten</CTAButton></div>
        </div>
      </section>

      {/* 4 — PROZESS (hell) */}
      <section className="section section--light leist-ablauf2">
        <div className="container">
          <SectionHeader align="center" kicker="Ablauf" title={<>Dein Weg zur Traumküche. <span className="grad">In 6 klaren Schritten.</span></>} />
          <ProcessTimeline steps={PROCESS} />
        </div>
      </section>

      {/* 5 — VORHER / NACHHER + ERKLÄRUNG (hell) */}
      <section className="section leist-baexp">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__media">
              <div className="svc-ba__frame">
                <BeforeAfter before={beforeImg} after={featureImg} beforeAlt="Vorher" afterAlt="Nachher" />
              </div>
            </Reveal>
            <Reveal className="lintro__copy" delay={0.08}>
              <span className="kicker">Struktur statt Stress</span>
              <h2 className="lintro__title">Wir bringen Struktur in das,<br /><span className="grad">was kompliziert wirkt.</span></h2>
              <ul className="lstances">
                {BA_POINTS.map((c) => <li key={c}><Check size={16} strokeWidth={2.4} /> {c}</li>)}
              </ul>
              <p className="lintro__text">Mehr Zeit für die wichtigen Dinge – den Rest übernehmen wir.</p>
              <CTAButton to="/vorher-nachher">Vorher / Nachher ansehen</CTAButton>
            </Reveal>
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
