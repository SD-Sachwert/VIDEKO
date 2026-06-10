import { Check } from 'lucide-react'

import Reveal from './Reveal.jsx'
import KitchenFeelingCard from './KitchenFeelingCard.jsx'

const USP = [
  'Individuelle Beratung', 'Planung mit Feingefühl', 'Realistische Planung',
  'Premium Materialien', 'Alles aus einer Hand',
]

/** Wiederverwendbares "Wähle dein Küchengefühl"-Modul (Studio + Inspiration). */
export default function KuechengefuehlSection() {
  return (
    <section className="section studio-intro">
      <div className="container">
        <div className="lintro lintro--feeling">
          <Reveal className="lintro__copy">
            <span className="kicker">Mehr als ein Küchenstudio</span>
            <h2 className="lintro__title">Wir verkaufen nicht einfach Küchen.<br /><span className="grad">Wir planen dein Zuhause mit dir.</span></h2>
            <p className="lintro__text">
              Bei uns geht&apos;s nicht um schnelle Abschlüsse, sondern um den Raum, in
              dem du jeden Tag lebst. In Ruhe, ehrlich und mit echtem Anspruch.
            </p>
            <ul className="lstances lstances--2col">
              {USP.map((u) => <li key={u}><Check size={16} strokeWidth={2.4} /> {u}</li>)}
            </ul>
          </Reveal>
          <Reveal className="lintro__feel" delay={0.08}>
            <KitchenFeelingCard />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
