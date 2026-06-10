import { Link } from 'react-router-dom'
import { Wrench, Repeat, Sparkles, ArrowRight } from 'lucide-react'

import Reveal from './Reveal.jsx'
import vorher1 from '../assets/images/vorher-nachher/vorher-1.jpg'
import vorher2 from '../assets/images/vorher-nachher/vorher-2.png'
import vorher3 from '../assets/images/vorher-nachher/vorher-3.png'
import nachher1 from '../assets/images/vorher-nachher/nachher-1.jpg'
import nachher2 from '../assets/images/vorher-nachher/nachher-2.png'
import nachher3 from '../assets/images/vorher-nachher/nachher-3.png'

const CARDS = [
  { v: vorher1, n: nachher1, pos: 'side' },
  { v: vorher2, n: nachher2, pos: 'center' },
  { v: vorher3, n: nachher3, pos: 'side' },
]

const BENEFITS = [
  { icon: Wrench, t: 'Echte Umbauten' },
  { icon: Repeat, t: 'Vorher / Nachher' },
  { icon: Sparkles, t: 'Inspiration' },
]

export default function VorherNachherShowcase() {
  return (
    <section className="section vnc-sec">
      <span className="vnc-sec__glow" aria-hidden="true" />
      <div className="container">
        <Reveal className="vnc__head">
          <span className="kicker kicker--gold">Vorher / Nachher</span>
          <h2 className="vnc__title">Aus alt wird <span className="grad">wow.</span></h2>
          <p className="vnc__sub">Echte Küchen. Echte Verwandlungen. Zieh am Regler – und sieh, was möglich wird.</p>
        </Reveal>

        <Reveal className="vnc__cards" delay={0.06}>
          {CARDS.map((cd, i) => (
            <div key={i} className={`vnc-card vnc-card--${cd.pos}`}>
              <span className="vnc-card__after" style={{ backgroundImage: `url(${cd.n})` }} aria-hidden="true" />
              <span className="vnc-card__before" style={{ backgroundImage: `url(${cd.v})` }} aria-hidden="true" />
              <span className="vnc-card__edge" aria-hidden="true" />
              <span className="vnc-card__lbl vnc-card__lbl--v">Vorher</span>
              <span className="vnc-card__lbl vnc-card__lbl--n">Nachher</span>
            </div>
          ))}
        </Reveal>

        <div className="vnc__benefits">
          {BENEFITS.map((b) => (
            <span key={b.t} className="vnc__benefit"><b.icon size={15} strokeWidth={1.9} /> {b.t}</span>
          ))}
        </div>

        <Reveal className="vnc__cta" delay={0.1}>
          <Link to="/vorher-nachher" className="vnc__btn">Mehr Verwandlungen entdecken <ArrowRight size={16} strokeWidth={2.2} /></Link>
        </Reveal>
      </div>
    </section>
  )
}
