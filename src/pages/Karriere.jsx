import { Building2, Workflow, Sparkles, MessageSquare, Lightbulb, ShieldCheck } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CardGrid from '../components/CardGrid.jsx'
import FeatureCard from '../components/FeatureCard.jsx'
import CareerRoleCard from '../components/CareerRoleCard.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'

import heroImg from '../assets/images/showroom/showroom-hero-immersive.png'

const ROLES = [
  'Küchenverkäufer', 'Küchenplaner', 'Monteure', 'Aufmaß / Projektkoordination',
  'Empfang / Sachbearbeitung', 'Reklamationsservice', 'Marketing / Social Media',
  'Reinigung / Studio-Service', 'Quereinsteiger', 'Initiativbewerbung',
]

const BENEFITS = [
  { icon: Building2, title: 'Modernes Studio', text: 'Arbeiten in einer Premium-Umgebung.' },
  { icon: Workflow, title: 'Klare Abläufe', text: 'Strukturiert statt Chaos.' },
  { icon: Sparkles, title: 'Hochwertige Projekte', text: 'Küchen, auf die man stolz ist.' },
  { icon: MessageSquare, title: 'Ehrliche Kommunikation', text: 'Auf Augenhöhe, ohne Spielchen.' },
  { icon: Lightbulb, title: 'Raum für Ideen', text: 'Mitgestalten ausdrücklich erwünscht.' },
  { icon: ShieldCheck, title: 'Kein Möbelhaus-Gebrüll', text: 'Anspruch statt Rabattschlacht.' },
]

export default function Karriere() {
  return (
    <>
      <PageHero
        kicker="Karriere"
        title={<>Arbeiten, wo Küche <span className="grad">nicht normal ist.</span></>}
        lead="Wir bauen kein Möbelhaus. Wir bauen ein Studio für Menschen mit Anspruch – und suchen Menschen, die genau darauf Lust haben."
        image={heroImg}
      />

      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Offene Bereiche"
            title="Werden Sie Teil von VIDEKO."
            lead="Standort: Würzburg. Wir freuen uns auch über Initiativbewerbungen."
          />
          <div className="rolegrid">
            {ROLES.map((r) => (
              <Reveal key={r}>
                <CareerRoleCard title={r} to="/beratung" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <SectionHeader tone="light" kicker="Benefits" title="Warum VIDEKO." />
          <CardGrid cols={3}>
            {BENEFITS.map((b) => (
              <Reveal key={b.title}>
                <FeatureCard icon={b.icon} title={b.title} text={b.text} />
              </Reveal>
            ))}
          </CardGrid>
          <div className="section__cta section__cta--row">
            <CTAButton to="/beratung">Initiativ bewerben</CTAButton>
            <CTAButton to="/beratung" variant="dark">Bewerbung senden</CTAButton>
          </div>
        </div>
      </section>
    </>
  )
}
