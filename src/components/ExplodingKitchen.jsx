import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import CTAButton from './CTAButton.jsx'
import overview from '../assets/images/exploding-kitchen/overview.png'
import assembled from '../assets/images/exploding-kitchen/assembled.png'
import lBase from '../assets/images/exploding-kitchen/l-base.png'
import lTechnical from '../assets/images/exploding-kitchen/l-technical.png'
import lStorage from '../assets/images/exploding-kitchen/l-storage.png'
import lShell from '../assets/images/exploding-kitchen/l-shell.png'
import lFrame from '../assets/images/exploding-kitchen/l-frame.png'
import lCountertop from '../assets/images/exploding-kitchen/l-countertop.png'
import streaks from '../assets/images/exploding-kitchen/streaks.png'
import shadow from '../assets/images/exploding-kitchen/shadow.png'

const CARDS = [
  { t: 'Materialien', d: 'Echte Materialien. Perfekt aufeinander abgestimmt.' },
  { t: 'Stauraum', d: 'Intelligent organisiert. Für mehr Platz und Überblick.' },
  { t: 'Lichtkonzept', d: 'Atmosphäre trifft Funktion. Für jede Stimmung das richtige Licht.' },
  { t: 'Präzise Montage', d: 'Millimetergenaue Planung. Saubere Umsetzung. Langlebige Perfektion.' },
]

const STEPS = [
  { n: '01', t: 'Schön', d: 'Ästhetik & Design' },
  { n: '02', t: 'Exploded', d: 'Was dahinter steckt' },
  { n: '03', t: 'Technik', d: 'Intelligenz & Innovation' },
  { n: '04', t: 'Perfektion', d: 'Montage & Service' },
]

function Copy() {
  return (
    <div className="ek-copy">
      <span className="kicker">Technik, die man nicht sieht</span>
      <h2 className="ek-headline">Was du siehst: eine Küche.<br />Was wir sehen: <span className="grad">187 Entscheidungen.</span></h2>
      <p className="ek-sub">Material, Licht, Stauraum, Ergonomie, Technik und Montage – bei uns greift alles ineinander.</p>
      <p className="ek-note">Jede Ebene ist durchdacht. Jedes Detail hat seinen Grund. Für Küchen, die bleiben.</p>
    </div>
  )
}

export default function ExplodingKitchen() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const [isDesktop, setDesktop] = useState(true)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const m = window.matchMedia('(min-width: 1024px)')
    const f = () => setDesktop(m.matches)
    f()
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const yCountertop = useTransform(scrollYProgress, [0.12, 0.66], [0, -150])
  const yFrame = useTransform(scrollYProgress, [0.12, 0.66], [0, -72])
  const yStorage = useTransform(scrollYProgress, [0.12, 0.66], [0, 96])
  const yTechnical = useTransform(scrollYProgress, [0.12, 0.66], [0, 172])
  const yBase = useTransform(scrollYProgress, [0.12, 0.66], [0, 242])
  const assembledOp = useTransform(scrollYProgress, [0.08, 0.2], [1, 0])
  const layersOp = useTransform(scrollYProgress, [0.12, 0.24], [0, 1])
  const streaksX = useTransform(scrollYProgress, [0, 1], ['-4%', '12%'])
  const streaksOp = useTransform(scrollYProgress, [0.1, 0.5], [0.15, 0.5])
  const shadowOp = useTransform(scrollYProgress, [0.2, 0.7], [0.3, 0.72])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setStep(v < 0.25 ? 0 : v < 0.5 ? 1 : v < 0.78 ? 2 : 3)
  })

  // static fallback for tablet/mobile and reduced motion
  if (!isDesktop || reduce) {
    return (
      <section className="section section--light ek-sec ek-sec--static">
        <div className="container ek-static">
          <Copy />
          <img className="ek-static__img" src={overview} alt="Eine VIDEKO Küche – Schicht für Schicht durchdacht" loading="lazy" />
          <div className="ek-cards ek-cards--static">
            {CARDS.map((c) => (
              <div key={c.t} className="ek-card">
                <span className="ek-card__t">{c.t}</span>
                <span className="ek-card__d">{c.d}</span>
              </div>
            ))}
          </div>
          <div className="ek-cta">
            <CTAButton to="/beratung">Beratung anfragen</CTAButton>
            <span className="ek-trust">Persönlich. Unverbindlich. Auf Augenhöhe.</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="ek-sec" ref={ref}>
      <div className="ek-sticky">
        <div className="container ek-grid">
          <Copy />

          <div className="ek-stage">
            <motion.img className="ek-shadow" src={shadow} alt="" style={{ opacity: shadowOp }} />
            <motion.img className="ek-assembled" src={assembled} alt="Luxuriöse VIDEKO Küche" style={{ opacity: assembledOp }} />
            <motion.img className="ek-layer" src={lBase} alt="" style={{ y: yBase, opacity: layersOp }} />
            <motion.img className="ek-layer" src={lTechnical} alt="" style={{ y: yTechnical, opacity: layersOp }} />
            <motion.img className="ek-layer" src={lStorage} alt="" style={{ y: yStorage, opacity: layersOp }} />
            <motion.img className="ek-layer" src={lShell} alt="" style={{ opacity: layersOp }} />
            <motion.img className="ek-layer" src={lFrame} alt="" style={{ y: yFrame, opacity: layersOp }} />
            <motion.img className="ek-layer" src={lCountertop} alt="" style={{ y: yCountertop, opacity: layersOp }} />
            <motion.img className="ek-streaks" src={streaks} alt="" style={{ opacity: streaksOp, x: streaksX }} />
          </div>

          <div className="ek-info">
            {CARDS.map((c, i) => (
              <div key={c.t} className={`ek-card ${step === i ? 'is-active' : ''}`}>
                <span className="ek-card__t">{c.t}</span>
                <span className="ek-card__d">{c.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="container ek-progress">
          <div className="ek-steps">
            {STEPS.map((s, i) => (
              <div key={s.n} className={`ek-step ${step === i ? 'is-active' : ''}`}>
                <span className="ek-step__n">{s.n}</span>
                <span className="ek-step__b"><b>{s.t}</b><i>{s.d}</i></span>
              </div>
            ))}
          </div>
          <div className="ek-cta">
            <CTAButton to="/beratung">Beratung anfragen <ArrowRight size={16} strokeWidth={2} /></CTAButton>
            <span className="ek-trust">Persönlich. Unverbindlich. Auf Augenhöhe.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
