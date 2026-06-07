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
import posterImg from '../assets/images/leistungen/svc-final.png'
import ctaImg from '../assets/images/leistungen/svc-cta-lounge.png'
import vnVideo from '../assets/images/leistungen/vorher-nachher.mp4'

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

const SPAR = [
  { icon: Ruler, title: 'Zollstock-Panik', text: 'Wir messen sauber auf.' },
  { icon: Cpu, title: 'Geräte-Wirrwarr', text: 'Wir sortieren, was wirklich Sinn ergibt.' },
  { icon: CalendarClock, title: 'Handwerker-Tetris', text: 'Wir koordinieren, damit du nicht 17 Leuten hinterherrennst.' },
  { icon: Wallet, title: 'Budget-Nebel', text: 'Wir sprechen früh über echte Rahmen.' },
  { icon: MessageSquare, title: 'Möbelhaus-Blabla', text: 'Ehrliche Beratung statt Verkaufs-Show.' },
]

const PROCESS = [
  { title: 'Kennenlernen', text: 'Wir hören zu und verstehen deinen Raum.' },
  { title: 'Ideen sortieren', text: 'Wir bringen Struktur in Wünsche, Budget und Möglichkeiten.' },
  { title: 'Planung sichtbar machen', text: 'Du siehst, was entsteht – bevor etwas bestellt wird.' },
  { title: 'Materialien greifbar machen', text: 'Oberflächen, Geräte, Licht und Details werden konkret.' },
  { title: 'Koordination übernehmen', text: 'Aufmaß, Lieferung, Montage und Abstimmungen laufen sauber.' },
  { title: 'Ergebnis genießen', text: 'Eine Küche, die nicht nur schön ist, sondern jeden Tag Sinn ergibt.' },
]

const CLASSIC = ['Standardlösung von der Stange', 'Viele Ansprechpartner', 'Wenig Verantwortung', 'Unklare Kosten', 'Hauptsache verkauft']
const VIDEKO = ['Maßgeschneiderte Lösung für dein Leben', 'Ein Team mit Verantwortung', 'Planung mit Zeit, Erfahrung und Gefühl', 'Transparente Abläufe', 'Eine Küche, die dich jeden Tag begeistert']

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
              Von der ersten Idee bis zur Montage: Planung, Materialien, Aufmaß,
              Lieferung und Service – ehrlich beraten, ohne Küchenchaos.
            </p>
            <div className="pagehero__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <a className="leist-hero__link" href="#leist-machine">Leistungen entdecken <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2 — VIDEO + TRANSFORMATION (light) */}
      <section className="section leist-transform" id="leist-transform">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__copy">
              <span className="kicker">Vom Chaos zum Plan</span>
              <h2 className="lintro__title">Aus Küchenchaos wird<br /><span className="grad">ein klarer Plan.</span></h2>
              <p className="lintro__text">
                Ideen, Maße, Budget, Geräte, Handwerker, Termine – Küchenplanung kann schnell
                unübersichtlich werden. Wir sortieren das Ganze und machen daraus einen Ablauf, der für dich Sinn ergibt.
              </p>
              <ul className="lstances">
                {CHAOS.map((c) => <li key={c}><Check size={16} strokeWidth={2.4} /> {c}</li>)}
              </ul>
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
            </Reveal>
            <Reveal className="lintro__media" delay={0.08}>
              <div className="svc-video__frame">
                <div className="svc-video__labels" aria-hidden="true">
                  <span>Vorher</span><span>Planung</span><span>Nachher</span>
                </div>
                <video className="svc-video__vid" autoPlay muted loop playsInline preload="none" poster={posterImg} aria-hidden="true">
                  <source src={vnVideo} type="video/mp4" />
                </video>
                <span className="lintro__rim" aria-hidden="true" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3 — WAS WIR ÜBERNEHMEN (light) */}
      <section className="section leist-machine" id="leist-machine">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Alles aus einer Hand"
            title={<>Was wir für dich <span className="grad">übernehmen.</span></>}
            lead="Du musst dich nicht durch Küchenplanung, Aufmaß, Geräte, Handwerker und Montage kämpfen. Genau dafür sind wir da."
          />
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
          <div className="section__cta">
            <CTAButton to="/beratung">Projekt starten</CTAButton>
          </div>
        </div>
      </section>

      {/* 4 — PROZESS (light) */}
      <section className="section section--light leist-ablauf2">
        <div className="container">
          <SectionHeader align="center" kicker="Der VIDEKO-Weg" title={<>Klarer Ablauf. <span className="grad">Stressfrei für dich.</span></>} />
          <ProcessTimeline steps={PROCESS} />
        </div>
      </section>

      {/* 5 — WAS DU DIR SPAREN KANNST (light) */}
      <section className="section leist-spar">
        <div className="container">
          <SectionHeader align="center" kicker="Entspannt" title={<>Was du dir <span className="grad">sparen kannst.</span></>} />
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

      {/* 6 — COMPARE (light) */}
      <section className="section leist-compare">
        <div className="container">
          <SectionHeader align="center" kicker="Der Unterschied" title={<>Klassisch geplant oder VIDEKO geplant? <span className="grad">Große Wirkung.</span></>} />
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

      {/* 7 — FINAL CTA (dark) */}
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
