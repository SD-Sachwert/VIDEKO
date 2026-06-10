import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Sparkles, Heart, BadgeCheck } from 'lucide-react'

import Reveal from './Reveal.jsx'
import modern from '../assets/images/stylefinder-styles/modern.png'
import warm from '../assets/images/stylefinder-styles/warm.png'
import dunkel from '../assets/images/stylefinder-styles/dunkel.png'
import hell from '../assets/images/stylefinder-styles/hell.png'
import natuerlich from '../assets/images/stylefinder-styles/natuerlich.png'
import luxurioes from '../assets/images/stylefinder-styles/luxurioes.png'

const STYLES = [
  { img: modern, t: 'Modern', d: 'Klar. Reduziert. Zeitgemäß.' },
  { img: warm, t: 'Warm & wohnlich', d: 'Einladend. Harmonisch. Geborgen.' },
  { img: dunkel, t: 'Dunkel & elegant', d: 'Zeitlos. Markant. Ausdrucksstark.' },
  { img: hell, t: 'Hell & leicht', d: 'Frisch. Offen. Leicht.' },
  { img: natuerlich, t: 'Natürlich', d: 'Echt. Nachhaltig. Ausgewogen.' },
  { img: luxurioes, t: 'Luxuriös', d: 'Exklusiv. Hochwertig. Außergewöhnlich.' },
]

const TRUST = [
  { icon: Heart, t: 'Persönlich empfohlen' },
  { icon: Sparkles, t: 'Inspiriert von echten Projekten' },
  { icon: BadgeCheck, t: 'Kostenlos & unverbindlich' },
]

export default function StylefinderHero() {
  const [active, setActive] = useState(2) // Standard: Dunkel & elegant

  return (
    <section className="section sfx-sec">
      <span className="sfx-sec__glow" aria-hidden="true" />
      <div className="container">
        <Reveal className="sfx__head">
          <span className="kicker kicker--gold">VIDEKO Stylefinder</span>
          <h2 className="sfx__title">Finde deinen <span className="grad">Küchenstil.</span></h2>
          <p className="sfx__sub">Wir raten nicht. Wir treffen. Wähle, was dich anspricht – wir zeigen dir Ideen, die dazu passen.</p>
        </Reveal>

        <Reveal className="sfx__stage" delay={0.08}>
          {STYLES.map((s, i) => {
            const d = i - active
            const ad = Math.abs(d)
            const scale = ad === 0 ? 1 : ad === 1 ? 0.84 : ad === 2 ? 0.7 : 0.6
            const style = {
              transform: `translate(-50%, -50%) translateX(${d * 48}%) scale(${scale}) rotateY(${d * -11}deg)`,
              opacity: ad === 0 ? 1 : ad <= 2 ? 0.92 : 0.72,
              zIndex: 20 - ad,
              filter: ad === 0 ? 'none' : ad === 1 ? 'brightness(0.92)' : 'brightness(0.82)',
            }
            const isActive = d === 0
            return (
              <button key={s.t} type="button" className={`sfxcard ${isActive ? 'is-active' : ''}`} style={style}
                onClick={() => setActive(i)} aria-label={s.t} aria-pressed={isActive}>
                <img src={s.img} alt={s.t} loading="lazy" draggable={false} />
                <span className="sfxcard__scrim" aria-hidden="true" />
                {isActive && <span className="sfxcard__diamond" aria-hidden="true" />}
                <span className="sfxcard__body">
                  <span className="sfxcard__t">{s.t}</span>
                  <span className="sfxcard__d">{s.d}</span>
                </span>
                {!isActive && <span className="sfxcard__arrow" aria-hidden="true"><ArrowUpRight size={15} strokeWidth={2.2} /></span>}
                {isActive && <span className="sfxcard__bar" aria-hidden="true" />}
              </button>
            )
          })}
        </Reveal>

        <Reveal className="sfx__cta" delay={0.12}>
          <Link to="/stylefinder" className="sfx__btn">Stylefinder starten <ArrowRight size={17} strokeWidth={2.2} /></Link>
        </Reveal>

        <div className="sfx__trust">
          {TRUST.map((t, i) => (
            <Reveal key={t.t} as="span" className="sfx__trustitem" delay={0.05 * i}>
              <t.icon size={15} strokeWidth={1.9} /> {t.t}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
