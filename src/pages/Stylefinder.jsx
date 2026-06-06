import { Clock } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import StylefinderFlow from '../components/stylefinder/StylefinderFlow.jsx'

import heroPoster from '../assets/images/kuechenwelten/stilfinderhero-kitchen-wide.jpg'

export default function Stylefinder() {
  return (
    <>
      <PageHero
        kicker="VIDEKO Stylefinder"
        title={<>Dein Stil. Deine Küche.<br /><span className="grad">Deine erste Einschätzung.</span></>}
        lead="Finde in wenigen Minuten heraus, welcher Küchenstil zu dir passt – und was daraus realistisch entstehen kann. Kein Möbelhaus-Blabla: Wir raten nicht ins Blaue, wir planen lieber sauber."
        image={heroPoster}
      >
        <CTAButton href="#sf-start">Stylefinder starten</CTAButton>
        <span className="pagehero__note"><Clock size={15} strokeWidth={1.9} /> Dauer: ca. 2–4 Minuten · Es geht um deinen Stil, nicht unseren.</span>
      </PageHero>

      <section className="section section--light" id="sf-start">
        <div className="container container--narrow">
          <SectionHeader
            align="center"
            kicker="So funktioniert's"
            title={<>Deine 8 Schritte zur <span className="grad">passenden Küche.</span></>}
            lead="Kurz klicken, ehrlich antworten, Ergebnis bekommen. Kein Küchenverhör – am Ende bekommst du sofort eine erste Einschätzung."
          />
          <StylefinderFlow />
        </div>
      </section>
    </>
  )
}
