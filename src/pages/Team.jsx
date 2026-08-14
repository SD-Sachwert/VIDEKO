import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CardGrid from '../components/CardGrid.jsx'
import TeamCard from '../components/TeamCard.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'

import heroImg from '../assets/images/showroom/journey-07-verstehen.webp'

const TEAM = [
  { role: 'Beratung' },
  { role: 'Planung' },
  { role: 'Aufmaß' },
  { role: 'Projektkoordination' },
  { role: 'Montage' },
  { role: 'Service' },
]

const WORK = ['Ehrlich', 'Direkt', 'Sorgfältig', 'Verbindlich']

export default function Team() {
  return (
    <>
      <PageHero
        kicker="Team"
        title={<>Menschen, die Küchen <span className="grad">ernst nehmen.</span></>}
        lead="Bei VIDEKO zählt nicht nur Design. Es zählt, wer zuhört, plant, nachfragt und Verantwortung übernimmt."
        image={heroImg}
        aiImage
        aiVariant="symbolic"
      />

      <section className="section section--light">
        <div className="container">
          <SectionHeader kicker="Unsere Rollen" title="Ein Team für dein Projekt." />
          <CardGrid cols={3}>
            {TEAM.map((t, i) => (
              <Reveal key={t.role} delay={(i % 3) * 0.06}>
                <TeamCard name="Platzhalter" role={t.role} />
              </Reveal>
            ))}
          </CardGrid>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <SectionHeader tone="light" kicker="Arbeitsweise" title="So arbeiten wir." />
          <div className="chips chips--center">
            {WORK.map((w) => (
              <span className="chip chip--gold" key={w}>{w}</span>
            ))}
          </div>
          <div className="section__cta">
            <CTAButton to="/beratung">Lernen wir uns kennen</CTAButton>
          </div>
        </div>
      </section>
    </>
  )
}
