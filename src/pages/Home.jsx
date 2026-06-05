import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import Hero from '../components/Hero.jsx'
import Reveal from '../components/Reveal.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'

import studioImg from '../assets/images/studio/bilder/01_hero_studio_showroom.png'
import leistImg from '../assets/images/leistungen/04_intro_helle_kueche.png'
import inspImg from '../assets/images/inspiration/01_hero_atmosphaerische_kueche.png'
import vnImg from '../assets/images/vorher-nachher/10_after_neue_kueche.png'
import matImg from '../assets/images/materialien/materials-hero-bg-16x9.png'
import karriereImg from '../assets/images/karriere/01_hero_team_beratung.png'
import finalImg from '../assets/images/studio/bilder/10_final_cta_studio_banner.png'

const TEASERS = [
  { kicker: 'Studio', title: 'Eintauchen statt nur anschauen.', text: 'Erlebe unser Studio in Würzburg und spüre Materialien, Licht, Raumgefühl und Planung live.', cta: 'Studio erleben', to: '/studio', image: studioImg },
  { kicker: 'Leistungen', title: 'Planung, die jeden Tag Sinn ergibt.', text: 'Von der ersten Idee bis zur fertigen Küche denken wir deinen Raum sauber durch – funktional, ehrlich und ohne Küchenchaos.', cta: 'Mehr über Planung', to: '/leistungen', image: leistImg },
  { kicker: 'Inspiration', title: 'Ideen, die bleiben.', text: 'Entdecke Küchenstile, Materialien, Raumideen und Details, die aus einer Küche dein Zuhause machen.', cta: 'Inspiration entdecken', to: '/inspiration', image: inspImg },
  { kicker: 'Vorher / Nachher', title: 'Echte Projekte. Echte Verwandlungen.', text: 'Sieh, was aus Räumen werden kann, wenn Planung, Material und Handwerk zusammenpassen.', cta: 'Projekte ansehen', to: '/vorher-nachher', image: vnImg },
  { kicker: 'Materialien', title: 'Materialien, die man fühlen will.', text: 'Naturstein, Holz, Keramik, Metall, Glas und Oberflächen, die nicht nur gut aussehen, sondern auch im Alltag bestehen.', cta: 'Materialien entdecken', to: '/materialien', image: matImg },
  { kicker: 'Karriere', title: 'Gestalte mit uns die Zukunft.', text: 'Du hast Lust auf Küchen, Design, Beratung oder Handwerk ohne Möbelhaus-Zirkus? Dann schau rein.', cta: 'Mehr erfahren', to: '/karriere', image: karriereImg },
]

export default function Home() {
  return (
    <div className="leist-page home-page">
      <Hero />

      {/* MARKENSTATEMENT – hell, edel */}
      <section className="section home-statement">
        <div className="container">
          <Reveal>
            <span className="kicker kicker--gold">Nicht lauter. Besser.</span>
            <h2 className="home-statement__title">
              Kein Möbelhaus.<br /><span className="grad">Keine Küche von der Stange.</span>
            </h2>
            <p className="home-statement__text">
              VIDEKO steht für Küchen, die bleiben: durchdacht geplant, ehrlich
              beraten und sauber umgesetzt. Für Menschen, die ihr Zuhause ernst nehmen.
            </p>
            <div className="home-statement__trust">
              <span>Design</span>
              <span>Handwerk</span>
              <span>Leidenschaft</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TEASER ZU DEN UNTERSEITEN */}
      <section className="section home-teasers">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Entdecke VIDEKO"
            title={<>Deine Küche. Dein Zuhause. <span className="grad">Dein Ding.</span></>}
            lead="Alles, was du brauchst, um deine Küche zu erleben, zu planen und Wirklichkeit werden zu lassen."
          />
          <div className="home-teasergrid">
            {TEASERS.map((t, i) => (
              <Reveal key={t.to} delay={(i % 3) * 0.06}>
                <Link className="lscard hometeaser" to={t.to}>
                  <span className="lscard__img" style={{ backgroundImage: `url(${t.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="lscard__body">
                    <span className="lscard__kicker">{t.kicker}</span>
                    <span className="lscard__title">{t.title}</span>
                    <span className="lscard__text">{t.text}</span>
                    <span className="hometeaser__cta">{t.cta} <ArrowUpRight size={16} strokeWidth={1.9} /></span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINALER CTA */}
      <section className="leist-final home-final">
        <div className="leist-final__media" aria-hidden="true">
          <img src={finalImg} alt="" />
          <div className="leist-final__veil" />
        </div>
        <div className="container leist-final__inner">
          <Reveal>
            <span className="kicker kicker--gold">Bereit?</span>
            <h2 className="leist-final__title">
              Bereit für ein<br /><span className="grad">besonderes Küchenerlebnis?</span>
            </h2>
            <p className="leist-final__text">
              Vereinbare deinen persönlichen Beratungstermin und erlebe, wie aus Ideen
              eine Küche wird, die wirklich zu dir passt.
            </p>
            <div className="leist-final__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/studio" variant="dark">Studio entdecken</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
