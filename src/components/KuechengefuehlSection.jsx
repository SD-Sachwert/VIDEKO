import { Check, Heart, ShoppingBag, Cloud } from 'lucide-react'

import Reveal from './Reveal.jsx'
import KitchenFeelingCard from './KitchenFeelingCard.jsx'
import alltag1 from '../assets/images/kuechengefuehl/alltag1.png'
import alltag2 from '../assets/images/kuechengefuehl/alltag2.png'
import alltag3 from '../assets/images/kuechengefuehl/alltag3.png'
import alltag4 from '../assets/images/kuechengefuehl/alltag4.png'

const USP = [
  'Individuelle Beratung', 'Planung mit Feingefühl', 'Realistische Planung',
  'Premium Materialien', 'Alles aus einer Hand',
]

const ALLTAG = [
  { img: alltag1, t: 'Hausaufgaben hier, Pasta dort.', icon: Heart, pos: '50% 45%' },
  { img: alltag2, t: 'Einkauf rein, Chaos raus.', icon: ShoppingBag, pos: '45% 42%' },
  { img: alltag3, t: 'Teamwork mit Mehlwolke.', icon: Cloud, pos: '45% 32%' },
  { img: alltag4, t: 'Gute Aussicht auf Frühstück.', icon: Heart, pos: '50% 40%' },
]

/** Wiederverwendbares "Wähle dein Küchengefühl"-Modul (Studio + Inspiration). */
export default function KuechengefuehlSection() {
  return (
    <section className="section studio-intro">
      <div className="container">
        <div className="lintro lintro--feeling">
          <Reveal className="lintro__copy">
            <span className="lintro__divider" aria-hidden="true" />
            <span className="kicker">Mehr als ein Küchenstudio</span>
            <h2 className="lintro__title">Wir verkaufen nicht einfach Küchen.<br /><span className="grad">Wir planen dein Zuhause mit dir.</span></h2>
            <p className="lintro__text">
              Bei uns geht&apos;s nicht um schnelle Abschlüsse, sondern um den Raum, in
              dem du jeden Tag lebst. In Ruhe, ehrlich und mit echtem Anspruch.
            </p>
            <ul className="lstances lstances--2col">
              {USP.map((u) => <li key={u}><Check size={16} strokeWidth={2.4} /> {u}</li>)}
            </ul>

            <span className="alltag__head">So fühlt sich Alltag an.</span>
            <div className="alltag">
              {ALLTAG.map((a) => (
                <span key={a.t} className="alltag__card">
                  <span className="alltag__img" style={{ backgroundImage: `url(${a.img})`, backgroundPosition: a.pos }} aria-hidden="true" />
                  <span className="alltag__cap">
                    <span className="alltag__t">{a.t}</span>
                    <span className="alltag__ic"><a.icon size={12} strokeWidth={2} /></span>
                  </span>
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal className="lintro__feel" delay={0.08}>
            <KitchenFeelingCard />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
