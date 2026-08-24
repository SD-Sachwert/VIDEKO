import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CardGrid from '../components/CardGrid.jsx'
import MaterialCard from '../components/MaterialCard.jsx'
import ComparisonTable from '../components/ComparisonTable.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import TextLink from '../components/TextLink.jsx'
import { BRAND } from '../data/company.js'
import { ARBEITSPLATTEN_FAQS } from '../data/leistungsseiten.js'

import heroImg from '../assets/images/inspiration/06_materialien_und_details.webp'
import cNaturstein from '../assets/images/materialien/cards/material-card-naturstein.webp'
import cKeramik from '../assets/images/materialien/cards/material-card-keramik.webp'
import cHolz from '../assets/images/materialien/cards/material-card-holz.webp'
import cQuarz from '../assets/images/materialien/cards/material-card-quarzkomposit.webp'

/**
 * Leistungsseite „Arbeitsplatten".
 *
 * Abgrenzung zum Journalbeitrag /journal/welche-arbeitsplatte-passt-zu-mir:
 * Der Artikel ist der ausführliche Lesetext zur Materialentscheidung. Diese
 * Seite ist die Leistungsseite — sie beantwortet, was VIDEKO dabei übernimmt
 * (Beratung, Material, Kante, Ausschnitte, Aufmaß über den Fachpartner) und
 * verlinkt für den langen Text auf den Artikel. Deshalb sind die Materialtexte
 * hier bewusst neu und kürzer gefasst statt aus dem Artikel übernommen.
 *
 * INHALTLICHE LEITPLANKE: Die Materialauswahl entspricht den im Projekt
 * geführten Materialien (MaterialsSection.jsx). Aufmaß und Fertigung von
 * Naturstein und Keramik laufen laut /alles-aus-einer-hand über den jeweiligen
 * Fachpartner — das steht hier genauso. Keine Preise, keine Stärkenangaben,
 * keine Herstellernamen.
 */

const MATERIALIEN = [
  {
    name: 'Naturstein',
    image: cNaturstein,
    descriptors: ['Unikat.', 'Kraftvoll.', 'Je nach Sorte empfindlich gegen Säuren.'],
  },
  {
    name: 'Keramik',
    image: cKeramik,
    descriptors: ['Hitzebeständig.', 'Kratzfest.', 'Pflegeleicht.'],
  },
  {
    name: 'Massivholz',
    image: cHolz,
    descriptors: ['Warm.', 'Lebendig.', 'Braucht regelmäßige Pflege.'],
  },
  {
    name: 'Quarzkomposit',
    image: cQuarz,
    descriptors: ['Gleichmäßig.', 'Beständig.', 'Pflegeleicht im Alltag.'],
  },
]

const FALSCH = {
  title: 'Nur nach Optik entschieden',
  items: [
    'Das Muster überzeugt im Laden, nicht in deiner Küche',
    'Pflegeaufwand fällt erst nach dem Einzug auf',
    'Kante und Ausschnitte werden zu spät geklärt',
    'Die Platte passt nicht zur Nutzung, sondern zum Foto',
    'Der Preis überrascht, weil die Fläche größer ist als gedacht',
  ],
}

const RICHTIG = {
  title: 'Vom Alltag her gedacht',
  items: [
    'Erst die Frage, wie du kochst, putzt und lebst',
    'Material und Pflegeaufwand werden ehrlich benannt',
    'Kante, Ausschnitte und Anschlüsse gehören in die Planung',
    'Oberflächen werden im Studio im echten Licht angesehen',
    'Das Aufmaß macht der Fachpartner, koordiniert über VIDEKO',
  ],
}

const ABLAUF = [
  {
    step: '01',
    title: 'Material festlegen',
    text: 'Wir gehen durch, wie deine Küche genutzt wird – und welche Oberfläche das aushält. Erst danach wird ausgesucht.',
  },
  {
    step: '02',
    title: 'Kante & Ausschnitte',
    text: 'Kantenausführung, Spülen- und Kochfeldausschnitt sowie Steckdosen werden zusammen mit der Küchenplanung festgelegt.',
  },
  {
    step: '03',
    title: 'Aufmaß beim Fachpartner',
    text: 'Naturstein und Keramik werden vor Ort aufgemessen – vom Naturstein- oder Keramikpartner, mit dem wir zusammenarbeiten.',
  },
  {
    step: '04',
    title: 'Einbau & Abnahme',
    text: 'Die Platte wird passend zur montierten Küche eingebaut und gemeinsam mit dir abgenommen.',
  },
]

export default function Arbeitsplatten() {
  const [offen, setOffen] = useState(0)

  return (
    <div className="aaeh-page">
      <PageHero
        kicker="Arbeitsplatten"
        title={<>Hier landet alles. <span className="grad">Auch das Rotweinglas.</span></>}
        lead="Die Arbeitsplatte ist die Fläche, die deine Küche jeden Tag aushalten muss. Welches Material das kann, hängt weniger vom Katalog ab als davon, wie du kochst."
        image={heroImg}
        aiImage
      >
        <CTAButton to="/beratung">Beratung anfragen</CTAButton>
        <CTAButton to="/journal/welche-arbeitsplatte-passt-zu-mir" variant="dark">Den langen Ratgeber lesen</CTAButton>
      </PageHero>

      {/* 1 — Materialien (dunkler Abschnitt: die Slabs stehen als
          Ausstellungsstuecke frei, ihre Beschriftung ist cremefarben) */}
      <section className="section section--dark">
        <div className="container">
          <SectionHeader
            tone="light"
            kicker="Die Auswahl"
            title={<>Vier Oberflächen, <span className="grad">vier Alltage.</span></>}
            lead="Es gibt nicht die eine richtige Arbeitsplatte. Es gibt die, die zu deiner Nutzung passt – und die, mit der du dich jeden Tag ärgerst."
          />
          <CardGrid cols={4}>
            {MATERIALIEN.map((m) => (
              <Reveal key={m.name}>
                <MaterialCard name={m.name} image={m.image} descriptors={m.descriptors} />
              </Reveal>
            ))}
          </CardGrid>
          <Reveal as="p" className="aaeh-split__text">
            Dazu kommen Compact- und Schichtstoffplatten. Sie werden oft unterschätzt,
            sind im Alltag pflegeleicht und passen häufig besser zum Budget, ohne dass
            die Küche billig wirkt. Welche Rolle sie in deiner Planung spielen können,
            klären wir im Gespräch – ausführlich nachlesen kannst du das im Beitrag{' '}
            <TextLink href="/journal/welche-arbeitsplatte-passt-zu-mir" tone="light">
              Welche Arbeitsplatte passt zu mir?
            </TextLink>
          </Reveal>
        </div>
      </section>

      {/* 2 — Vergleich */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Der Unterschied"
            title={<>Materialauswahl ist <span className="grad">keine Geschmacksfrage allein.</span></>}
            lead="Zwei Wege zur selben Entscheidung – mit sehr unterschiedlichem Ergebnis nach zwei Jahren Nutzung."
          />
          <ComparisonTable left={FALSCH} right={RICHTIG} />
        </div>
      </section>

      {/* 3 — Ablauf */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Was wir übernehmen"
            title={<>Von der Auswahl bis <span className="grad">zur fertig eingebauten Platte.</span></>}
            lead="Material, Kante und Ausschnitte gehören in die Küchenplanung – nicht in ein separates Projekt, das du selbst koordinierst."
          />
          <ol className="aaeh-steps">
            {ABLAUF.map((s, i) => (
              <Reveal key={s.step} as="li" className="aaeh-step" delay={(i % 3) * 0.05}>
                <span className="aaeh-step__num">{s.step}</span>
                <div>
                  <h3 className="aaeh-step__title">{s.title}</h3>
                  <p className="aaeh-step__text">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          {/* Heller Abschnitt, deshalb TextLink (Tonwert ink) statt aaeh-link,
              das mit --gold-bright fuer dunkle Flaechen gedacht ist. */}
          <Reveal className="aaeh-split__links">
            <TextLink href="/planung">So läuft die Planung</TextLink>
            <TextLink href="/kuechen-nach-mass">Küchen nach Maß</TextLink>
            <TextLink href="/alles-aus-einer-hand">Alles aus einer Hand</TextLink>
          </Reveal>
        </div>
      </section>

      {/* 4 — lokal */}
      <section className="section section--dark">
        <div className="container">
          <SectionHeader
            tone="light"
            kicker="Muster ansehen"
            title={<>Oberflächen entscheidet man <span className="grad">nicht am Bildschirm.</span></>}
            lead={`Wie eine Platte wirkt, zeigt sich erst im Licht und neben der Front. Im Studio in der ${BRAND.studio.street} in ${BRAND.studio.postalCode} ${BRAND.studio.city} legen wir die Muster nebeneinander – so lange, bis die Entscheidung sich richtig anfühlt.`}
          />
          <Reveal className="aaeh-cta-center">
            <CTAButton to="/studio">Studio in Würzburg ansehen</CTAButton>
          </Reveal>
        </div>
      </section>

      {/* 5 — FAQ */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Häufige Fragen"
            title={<>Was zur Arbeitsplatte <span className="grad">immer gefragt wird.</span></>}
          />
          <div className="aaeh-faq">
            {ARBEITSPLATTEN_FAQS.map((f, i) => (
              <Reveal key={f.q} as="div" className={`jacc ${offen === i ? 'is-open' : ''}`} delay={(i % 2) * 0.05}>
                <button type="button" className="jacc__q" onClick={() => setOffen(offen === i ? -1 : i)} aria-expanded={offen === i}>
                  <span>{f.q}</span>
                  <span className="jacc__icon">{offen === i ? <Minus size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}</span>
                </button>
                <div className="jacc__a"><div className="jacc__a-in"><p>{f.a}</p></div></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — CTA */}
      <section className="section section--light">
        <div className="container aaeh-final">
          <Reveal>
            <span className="kicker kicker--gold">Nächster Schritt</span>
            <h2 className="aaeh-final__title">Sag uns, wie du kochst.</h2>
            <p className="aaeh-final__text">
              Daraus ergibt sich die Arbeitsplatte fast von selbst. Den Rest – Kante,
              Ausschnitte, Aufmaß, Einbau – übernehmen wir.
            </p>
            <div className="aaeh-final__btns">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/inspiration" variant="dark">Materialien ansehen</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
