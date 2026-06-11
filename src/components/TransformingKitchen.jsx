import { Link } from 'react-router-dom'
import { ArrowRight, Hammer, Repeat, Sparkles } from 'lucide-react'

import Reveal from './Reveal.jsx'
import video from '../assets/images/transforming-kitchen.mp4'

const BENEFITS = [
  { icon: Hammer, t: 'Echte Umbauten' },
  { icon: Repeat, t: 'Vorher / Nachher' },
  { icon: Sparkles, t: 'Inspiration' },
]

export default function TransformingKitchen() {
  return (
    <section className="section tk-sec">
      <span className="tk-sec__glow" aria-hidden="true" />
      <div className="container">
        <Reveal className="tk__head">
          <span className="kicker kicker--gold">Transforming Kitchen</span>
          <h2 className="tk__title">Aus Raum wird <span className="grad">Wirkung.</span></h2>
          <p className="tk__sub">Sieh in Bewegung, wie aus alt nicht einfach neu wird – sondern eine Küche, die besser passt, besser funktioniert und deutlich besser aussieht.</p>
        </Reveal>

        <Reveal className="tk__stage" delay={0.06}>
          <video className="tk__video" autoPlay muted loop playsInline preload="metadata">
            <source src={video} type="video/mp4" />
          </video>
          <span className="tk__frame" aria-hidden="true" />
        </Reveal>

        <div className="tk__benefits">
          {BENEFITS.map((b) => (
            <span key={b.t} className="tk__benefit"><b.icon size={15} strokeWidth={1.9} /> {b.t}</span>
          ))}
        </div>

        <Reveal className="tk__cta" delay={0.1}>
          <Link to="/vorher-nachher" className="tk__btn">Mehr Transformationen entdecken <ArrowRight size={16} strokeWidth={2.2} /></Link>
        </Reveal>
      </div>
    </section>
  )
}
