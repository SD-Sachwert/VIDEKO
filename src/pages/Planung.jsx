import { Ruler, ClipboardList, Hammer, BadgeCheck } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import ExplodingKitchenSection from '../components/ExplodingKitchenSection.jsx'
import SimulatorSection from '../components/SimulatorSection.jsx'
import BudgetCompassSection from '../components/BudgetCompassSection.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ProcessTimeline from '../components/ProcessTimeline.jsx'
import CardGrid from '../components/CardGrid.jsx'
import FeatureCard from '../components/FeatureCard.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import TextLink from '../components/TextLink.jsx'
import { BRAND } from '../data/company.js'

import heroImg from '../assets/images/shared/hero-kitchen-arch.webp'

const PROCESS = [
  { title: 'Erstgespräch', text: 'Kennenlernen, Wünsche, erste Richtung.' },
  { title: 'Bedarf verstehen', text: 'Wie du lebst, kochst und wohnst.' },
  { title: 'Stil & Budget', text: 'Ästhetik und Rahmen klar definieren.' },
  { title: 'Planung', text: 'Detaillierte 3D-Planung deiner Küche.' },
  { title: 'Aufmaß', text: 'Millimetergenaues Laseraufmaß vor Ort.' },
  { title: 'Bestellung', text: 'Verbindlich, transparent, terminiert.' },
  { title: 'Montage', text: 'Fachgerecht durch unser eigenes Team.' },
  { title: 'Abnahme', text: 'Gemeinsame Endabnahme – ohne Mängel.' },
]

const SERVICE = [
  { icon: Ruler, title: 'Laseraufmaß', text: 'Millimetergenau für eine passgenaue Küche.' },
  { icon: ClipboardList, title: 'Projektkoordination', text: 'Ein fester Ansprechpartner für alles.' },
  { icon: Hammer, title: 'Hochwertige Montage', text: 'Sauber, präzise und termintreu.' },
  { icon: BadgeCheck, title: 'Endabnahme', text: 'Erst zufrieden, dann fertig.' },
]

export default function Planung() {
  return (
    <>
      <PageHero
        kicker="Planung"
        title={<>Planung, die jeden Tag <span className="grad">Sinn ergibt.</span></>}
        lead="Von der durchdachten Konstruktion über typische Planungsfehler bis zum transparenten Budget – so entsteht eine Küche, die wirklich passt."
        image={heroImg}
        aiImage
      />

      <ExplodingKitchenSection />
      <SimulatorSection />
      <BudgetCompassSection />

      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Prozess"
            title="In 8 Schritten zur fertigen Küche."
            lead="Ein klarer, ehrlicher Ablauf – du weißt immer, woran du bist."
          />
          <ProcessTimeline steps={PROCESS} />
        </div>
      </section>

      {/* Wo geplant wird. Bis SEO-Phase 2 stand auf dieser Seite kein einziger
          Ortsbezug und kein Link zum Studio — obwohl genau dort geplant wird
          und die Suche nach „Küchenplanung Würzburg“ hier landen soll. */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Wo geplant wird"
            title={<>Am Plan sitzen wir <span className="grad">gemeinsam.</span></>}
            lead="Planung passiert nicht per Mail, sondern am Tisch – und später mit dem Laser in deiner Küche."
          />
          <Reveal as="p" className="aaeh-note">
            Die Planungsgespräche führen wir in unserem Studio in der {BRAND.studio.street},{' '}
            {BRAND.studio.postalCode} {BRAND.studio.city}. Dort liegen Fronten, Arbeitsplatten und
            Griffe nebeneinander, statt nur als Bild auf dem Bildschirm zu erscheinen – und der
            3D-Entwurf lässt sich direkt daneben durchgehen. Das Aufmaß nehmen wir anschließend
            bei dir vor Ort. Ein Blick ins{' '}
            <TextLink href="/studio">Küchenstudio in Würzburg</TextLink>, die Materialfrage unter{' '}
            <TextLink href="/arbeitsplatten">Arbeitsplatten</TextLink> – und wenn mit der Küche auch
            Boden, Wand oder Licht dran sind, steht das unter{' '}
            <TextLink href="/alles-aus-einer-hand">Alles aus einer Hand</TextLink>.
          </Reveal>
        </div>
      </section>

      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Umsetzung & Service"
            title="Präzision bis zur Abnahme."
          />
          <CardGrid cols={4}>
            {SERVICE.map((s) => (
              <Reveal key={s.title}>
                <FeatureCard icon={s.icon} title={s.title} text={s.text} />
              </Reveal>
            ))}
          </CardGrid>
          <div className="section__cta">
            <CTAButton to="/beratung">Planungsgespräch buchen</CTAButton>
          </div>
        </div>
      </section>
    </>
  )
}
