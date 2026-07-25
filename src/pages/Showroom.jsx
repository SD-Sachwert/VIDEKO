import { MapPin, Mail } from 'lucide-react'

import ShowroomJourneySection from '../components/ShowroomJourneySection.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'

const AREA = ['Würzburg', 'Tauberbischofsheim', 'Kitzingen', 'Main-Tauber', 'Schweinfurt']

export default function Showroom() {
  return (
    <>
      <ShowroomJourneySection />

      <section className="section section--light standort">
        <div className="container">
          <SectionHeader
            kicker="Standort"
            title="Studio Würzburg."
            lead="Erlebe VIDEKO dort, wo Planung, Material und Architektur zusammenkommen."
          />
          <div className="standort__grid">
            <Reveal className="standort__info">
              <ul className="standort__list">
                <li>
                  <MapPin size={18} strokeWidth={1.7} />
                  <span><strong>VIDEKO Küchen</strong><br />Hertzstraße 4<br />97076 Würzburg</span>
                </li>
                <li>
                  <Mail size={18} strokeWidth={1.7} />
                  <a href="mailto:info@videko-kuechen.de">info@videko-kuechen.de</a>
                </li>
              </ul>
              <div className="standort__area">
                <span className="standort__area-label">Einzugsgebiet</span>
                <div className="standort__chips">
                  {AREA.map((a) => (
                    <span className="chip" key={a}>{a}</span>
                  ))}
                </div>
              </div>
              <CTAButton to="/beratung">Showroom-Termin vereinbaren</CTAButton>
            </Reveal>
            <Reveal className="standort__map" delay={0.08}>
              <div className="standort__map-ph" aria-hidden="true">
                <MapPin size={30} strokeWidth={1.4} />
                <span>Karte / Map-Platzhalter</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
