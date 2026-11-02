import { Clock } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import TextLink from '../components/TextLink.jsx'
import StylefinderFlow from '../components/stylefinder/StylefinderFlow.jsx'

import heroPoster from '../assets/images/stylefinder-assets/01_hero_dark_premium_kitchen.webp'

export default function Stylefinder() {
  return (
    <>
      <PageHero
        kicker="VIDEKO Stylefinder"
        title={<>Welche Küche passt zu mir?<br /><span className="grad">Finde deinen Küchenstil.</span></>}
        lead="Mach den kostenlosen Küchenstil-Test: In acht Schritten vergleichst du Stil, Materialien, Farben, Alltag und Budget. Du bekommst eine erste Orientierung für deine Küchenplanung – ohne Registrierung."
        image={heroPoster}
        aiImage
      >
        <CTAButton href="#sf-start">Stylefinder starten</CTAButton>
        <span className="pagehero__note"><Clock size={15} strokeWidth={1.9} /> Dauer: ca. 2–4 Minuten · Es geht um deinen Stil, nicht unseren.</span>
      </PageHero>

      <section className="section section--light" id="sf-start">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="So funktioniert's"
            title={<>Deine 8 Schritte zur <span className="grad">passenden Küche.</span></>}
            lead="Kurz klicken, ehrlich antworten, Ergebnis bekommen. Kein Küchenverhör – am Ende bekommst du sofort eine erste Einschätzung."
          />
          <StylefinderFlow />
        </div>
      </section>


      {/* Redaktionelle Hilfe: Auch ohne den interaktiven Test sollen Besucher
          nachvollziehen können, welche Entscheidungen wirklich zählen. */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Mehr als ein Stiltest"
            title={<>Welche Küche passt <span className="grad">zu deinem Alltag?</span></>}
            lead="Eine schöne Front ist nur der Anfang. Diese drei Fragen helfen dir, das Testergebnis einzuordnen."
          />
          <div className="aaeh-probs">
            <Reveal className="aaeh-prob">
              <h3 className="aaeh-prob__title">Wie nutzt du deine Küche?</h3>
              <p className="aaeh-prob__text">
                Kochst du täglich, oft mit mehreren Personen oder eher gelegentlich?
                Arbeitswege, Stauraum und Geräte sollten zu deinen Gewohnheiten passen.
                Eine große Insel ist zum Beispiel nur sinnvoll, wenn im Raum genug Platz
                für gute Laufwege bleibt.
              </p>
            </Reveal>
            <Reveal className="aaeh-prob">
              <h3 className="aaeh-prob__title">Welche Materialien passen wirklich?</h3>
              <p className="aaeh-prob__text">
                Helle, dunkle, matte oder strukturierte Fronten wirken je nach Licht und
                Umgebung unterschiedlich. Berücksichtige neben der Optik auch Pflege,
                Arbeitsfläche und Beanspruchung im Alltag.
              </p>
            </Reveal>
            <Reveal className="aaeh-prob">
              <h3 className="aaeh-prob__title">Was erlaubt dein Raum und dein Budget?</h3>
              <p className="aaeh-prob__text">
                Maße, Anschlüsse und Budget setzen den Rahmen. Der Stylefinder liefert
                Ideen und Prioritäten, aber weder einen verbindlichen Preis noch ein
                professionelles Aufmaß. Beides klären wir in der persönlichen Planung.
              </p>
            </Reveal>
          </div>
          <Reveal as="p" className="aaeh-note">
            Du möchtest aus deiner Stilrichtung eine passende Einbauküche machen?
            Lies weiter über <TextLink href="/kuechen-nach-mass">Küchen nach Maß</TextLink>,
            vergleiche <TextLink href="/arbeitsplatten">Arbeitsplatten und Materialien</TextLink>
            oder informiere dich über die <TextLink href="/planung">Küchenplanung in Würzburg</TextLink>.
          </Reveal>
        </div>
      </section>

      {/* DUNKLER ABSCHLUSS */}
      <section className="section section--dark sf-final">
        <div className="container">
          <SectionHeader
            tone="light"
            align="center"
            kicker="Bereit?"
            title={<>Genug eingeschätzt? <span className="grad">Jetzt machen wir daraus einen echten Plan.</span></>}
            lead="Kein Druck, kein Verkaufstheater – nur ehrliche Planung auf Augenhöhe."
          />
          <div className="sf-final__actions">
            <CTAButton to="/beratung">Beratung anfragen</CTAButton>
            <CTAButton to="/studio" variant="dark">Studio erleben</CTAButton>
          </div>
        </div>
      </section>
    </>
  )
}
