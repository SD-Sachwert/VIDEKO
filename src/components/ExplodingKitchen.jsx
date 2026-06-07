import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

import Reveal from './Reveal.jsx'
import SectionHeader from './SectionHeader.jsx'
import CTAButton from './CTAButton.jsx'

import finishedImg from '../assets/images/inspiration/02_moderne_kueche.png'
import xkFull from '../assets/images/home/exploded/exploded-full-fallback-16x9.png'
import xkLight from '../assets/images/home/exploded/detail-light-16x9.png'
import xkApp from '../assets/images/home/exploded/detail-appliances-16x9.png'
import xkWork from '../assets/images/home/exploded/detail-worktop-16x9.png'
import xkDraw from '../assets/images/home/exploded/detail-drawers-16x9.png'
import xkMat from '../assets/images/home/exploded/detail-materials-16x9.png'
import xkMont from '../assets/images/home/exploded/detail-montage-16x9.png'

const DETAILS = [
  { label: 'Licht', img: xkLight, text: 'Licht, das nicht blendet, sondern wirkt – Stimmung, Akzente und Funktion an der richtigen Stelle.' },
  { label: 'Geräte', img: xkApp, text: 'Geräte, die zu deinem Alltag passen – nahtlos integriert statt nachträglich reingequetscht.' },
  { label: 'Arbeitsplatte', img: xkWork, text: 'Materialien, die schön sind und im Alltag bestehen – Höhe und Fuge millimetergenau.' },
  { label: 'Auszüge', img: xkDraw, text: 'Stauraum, der wirklich genutzt wird – durchdacht bis in die letzte Ecke.' },
  { label: 'Materialien', img: xkMat, text: 'Oberflächen, die nicht nur gut aussehen, sondern bleiben – auch nach Jahren.' },
  { label: 'Montage', img: xkMont, text: 'Montage, die am Ende den Unterschied macht – sauber, termintreu, passgenau.' },
]

const POINTS = [
  'Licht, das nicht blendet, sondern wirkt.',
  'Stauraum, der wirklich genutzt wird.',
  'Geräte, die zum Alltag passen.',
  'Materialien, die nicht nur gut aussehen.',
  'Montage, die am Ende den Unterschied macht.',
]

export default function ExplodingKitchen() {
  const [active, setActive] = useState(null) // null = Gesamtansicht
  const rightImg = active === null ? xkFull : DETAILS[active].img
  const rightTitle = active === null ? '187 Bauteile. 1000 Entscheidungen. 0 Zufall.' : DETAILS[active].label
  const rightText = active === null
    ? 'Korpus, Fronten, Licht, Geräte, Auszüge, Fugen, Höhen, Materialien, Anschlüsse, Laufwege und Montagepunkte – wir sehen nicht nur eine Küche, sondern das System dahinter.'
    : DETAILS[active].text

  return (
    <section className="section section--dark home-exploded">
      <div className="container">
        <SectionHeader
          tone="light"
          align="center"
          kicker="Das System hinter deiner Küche"
          title={<>Eine Küche. Oder 187 Entscheidungen, <span className="grad">die perfekt sitzen müssen.</span></>}
          lead="Was für dich am Ende selbstverständlich aussieht, ist bei uns millimetergenau geplant: Licht, Geräte, Stauraum, Materialien, Technik, Montage – und jedes kleine Detail dazwischen."
        />

        <div className="xk">
          <Reveal className="xk__side">
            <span className="xk__label">Was du siehst</span>
            <div className="xk__frame"><img src={finishedImg} alt="Fertige VIDEKO-Küche" loading="lazy" /></div>
            <h3 className="xk__h">Eine fertige Traumküche.</h3>
            <p className="xk__t">Ruhig, schön, aufgeräumt. Alles wirkt selbstverständlich – genau so soll es am Ende aussehen.</p>
          </Reveal>

          <span className="xk__switch" aria-hidden="true">Perspektivwechsel</span>

          <Reveal className="xk__side xk__side--explode" delay={0.1}>
            <span className="xk__label xk__label--gold">Was wir sehen</span>
            <div className="xk__frame xk__frame--explode">
              <AnimatePresence mode="wait">
                <motion.img key={active ?? 'full'} src={rightImg} alt="" aria-hidden="true"
                  initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
              </AnimatePresence>
              <span className="xk__glow" aria-hidden="true" />
            </div>
            <div className="xk__markers">
              <button type="button" className={`xk__marker ${active === null ? 'is-active' : ''}`} onClick={() => setActive(null)}>Gesamtansicht</button>
              {DETAILS.map((d, i) => (
                <button key={d.label} type="button" className={`xk__marker ${active === i ? 'is-active' : ''}`} onClick={() => setActive(i)}>{d.label}</button>
              ))}
            </div>
            <h3 className="xk__h">{rightTitle}</h3>
            <p className="xk__t">{rightText}</p>
          </Reveal>
        </div>

        <Reveal className="xk__why">
          <h3 className="xk__why-title">Warum das wichtig ist?</h3>
          <p className="xk__why-text">
            Weil eine Küche nicht an einem schönen Bild scheitert – sondern an den Details, die du später jeden Tag merkst:
            falsche Höhen, schlechte Laufwege, verschenkter Stauraum, unpraktische Geräte, schwaches Licht oder eine Montage,
            die nicht sauber sitzt. Genau deshalb planen wir nicht einfach Möbel. Wir planen Abläufe.
          </p>
          <ul className="xk__points">
            {POINTS.map((p) => <li key={p}><Check size={15} strokeWidth={2.4} /> {p}</li>)}
          </ul>
          <CTAButton to="/beratung">Küche durchdenken lassen</CTAButton>
        </Reveal>
      </div>
    </section>
  )
}
