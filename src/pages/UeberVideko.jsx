import { Handshake, Gem, Clock, Scale } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ComparisonTable from '../components/ComparisonTable.jsx'
import CardGrid from '../components/CardGrid.jsx'
import FeatureCard from '../components/FeatureCard.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'

import heroImg from '../assets/images/shared/hero-videko-final-16x9.png'

const VALUES = [
  { icon: Handshake, title: 'Persönlich & unabhängig', text: 'Feste Ansprechpartner statt anonymer Abwicklung.' },
  { icon: Gem, title: 'Exklusive Qualität', text: 'Ausgewählte Materialien und präzise Verarbeitung.' },
  { icon: Clock, title: 'Termintreu & zuverlässig', text: 'Klare Abläufe, verlässliche Termine.' },
  { icon: Scale, title: 'Transparent & fair', text: 'Ehrliche Preise ohne Rabattgeschrei.' },
]

export default function UeberVideko() {
  return (
    <>
      <PageHero
        kicker="Über VIDEKO"
        title={<>Nicht normal. <span className="grad">Mit Absicht.</span></>}
        lead="Wir bauen kein Möbelhaus. Wir planen Küchen für Menschen, die das Besondere wertschätzen."
        image={heroImg}
        aiImage
      />

      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Der Unterschied"
            title="Möbelhaus-Vibe vs. VIDEKO."
            lead="Zwei Welten – und der Grund, warum sich Anspruch lohnt."
          />
          <ComparisonTable
            left={{
              title: 'Möbelhaus-Vibe',
              items: ['Rabattgeschrei', 'Verkaufsdruck', 'Standardlösung', 'Anonyme Abwicklung', 'Prospektküche'],
            }}
            right={{
              title: 'VIDEKO',
              items: ['Ehrliche Planung', 'Beratung auf Augenhöhe', 'Individuelles Raumkonzept', 'Feste Ansprechpartner', 'Küche für Ihr echtes Leben'],
            }}
          />
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <SectionHeader tone="light" kicker="Werte" title="Worauf Sie sich verlassen können." />
          <CardGrid cols={4}>
            {VALUES.map((v) => (
              <Reveal key={v.title}>
                <FeatureCard icon={v.icon} title={v.title} text={v.text} />
              </Reveal>
            ))}
          </CardGrid>
          <div className="section__cta">
            <CTAButton to="/beratung">Den Unterschied erleben</CTAButton>
          </div>
        </div>
      </section>
    </>
  )
}
