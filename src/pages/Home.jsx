import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import Hero from '../components/Hero.jsx'
import HomePathSection from '../components/HomePathSection.jsx'
import BrandStatement from '../components/BrandStatement.jsx'
import TeaserSection from '../components/TeaserSection.jsx'
import FooterExperienceSection from '../components/FooterExperienceSection.jsx'
import Reveal from '../components/Reveal.jsx'

import matImg from '../assets/images/materialien/materials-hero-bg-16x9.png'
import planImg from '../assets/images/shared/hero-kitchen-arch.jpg'
import showImg from '../assets/images/showroom/showroom-hero-immersive.png'
import teamImg from '../assets/images/showroom/journey-07-verstehen.png'
import careerImg from '../assets/images/showroom/journey-03-wohlfuehlen.png'

export default function Home() {
  return (
    <>
      <Hero />
      <HomePathSection />
      <BrandStatement />

      <TeaserSection
        kicker="Materialien"
        title="Materialien, die man fühlen will."
        text="Naturstein, Metall, Bronze, Keramik, Holz und Glas – ausgewählt, präzise verarbeitet und sinnlich erlebbar."
        image={matImg}
        to="/materialien"
        ctaLabel="Materialwelt entdecken"
      />

      <TeaserSection
        kicker="Planung"
        title="Planung, die jeden Tag Sinn ergibt."
        text="Vom Exploding-Kitchen-Detail über die 7 häufigsten Planungsfehler bis zum transparenten Budget-Kompass."
        image={planImg}
        to="/planung"
        ctaLabel="Planung ansehen"
        reverse
        tone="dark"
      />

      <TeaserSection
        kicker="Showroom"
        title="Eintauchen statt nur anschauen."
        text="Erleben Sie unsere Küchenwelten mit allen Sinnen – eine Reise durch Design, Materialität und Atmosphäre in Würzburg."
        image={showImg}
        to="/showroom"
        ctaLabel="Showroom erleben"
      />

      {/* small team / career teaser */}
      <section className="duo">
        <div className="container">
          <Reveal className="duo__grid">
            <Link className="duocard" to="/team">
              <span className="duocard__img" style={{ backgroundImage: `url(${teamImg})` }} aria-hidden="true" />
              <span className="duocard__scrim" aria-hidden="true" />
              <span className="duocard__body">
                <span className="duocard__kicker">Team</span>
                <span className="duocard__title">Menschen, die Küchen ernst nehmen.</span>
                <span className="duocard__link">Team kennenlernen <ArrowUpRight size={16} strokeWidth={1.8} /></span>
              </span>
            </Link>
            <Link className="duocard" to="/karriere">
              <span className="duocard__img" style={{ backgroundImage: `url(${careerImg})` }} aria-hidden="true" />
              <span className="duocard__scrim" aria-hidden="true" />
              <span className="duocard__body">
                <span className="duocard__kicker">Karriere</span>
                <span className="duocard__title">Arbeiten, wo Küche nicht normal ist.</span>
                <span className="duocard__link">Offene Stellen <ArrowUpRight size={16} strokeWidth={1.8} /></span>
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      <FooterExperienceSection />
    </>
  )
}
