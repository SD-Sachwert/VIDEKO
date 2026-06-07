import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import Hero from '../components/Hero.jsx'
import ExplodingKitchen from '../components/ExplodingKitchen.jsx'
import Reveal from '../components/Reveal.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'

import styleCardImg from '../assets/images/kuechenwelten/stilfinderhero-kitchen-wide.jpg'
import studioImg from '../assets/images/studio/bilder/01_hero_studio_showroom.png'
import beratungCardImg from '../assets/images/beratung/cta-light-portal.png'
import leistImg from '../assets/images/leistungen/04_intro_helle_kueche.png'
import inspImg from '../assets/images/inspiration/01_hero_atmosphaerische_kueche.png'
import jrnlImg from '../assets/images/inspiration/06_materialien_und_details.png'
import vnImg from '../assets/images/vorher-nachher/10_after_neue_kueche.png'
import karriereImg from '../assets/images/karriere/01_hero_team_beratung.png'
import ueberImg from '../assets/images/ueber-uns/02_why_videko_beratungsszene.png'
import finalImg from '../assets/images/studio/bilder/10_final_cta_studio_banner.png'

// three organic entry cards
const ENTRIES = [
  { shape: 'a', kicker: 'Stylefinder', title: 'Finde deinen Küchenstil.', text: 'In wenigen Schritten zu der Richtung, die wirklich zu dir passt.', cta: 'Stilfinder starten', to: '/stylefinder', image: styleCardImg },
  { shape: 'b', kicker: 'Studio', title: 'Erlebe unser Studio.', text: 'Materialien, Licht und Raumgefühl live in Würzburg – kein Möbelhaus.', cta: 'Studio entdecken', to: '/studio', image: studioImg },
  { shape: 'c', kicker: 'Beratung', title: 'Persönliche Beratung.', text: 'Ehrlich, individuell und auf Augenhöhe – dein Projekt, dein Tempo.', cta: 'Beratung anfragen', to: '/beratung', image: beratungCardImg },
]

const TEASERS = [
  { kicker: 'Leistungen', title: 'Planung, die jeden Tag Sinn ergibt.', text: 'Von der ersten Idee bis zur fertigen Küche – sauber durchdacht.', cta: 'Mehr über Planung', to: '/leistungen', image: leistImg },
  { kicker: 'Inspiration', title: 'Ideen & Materialien, die bleiben.', text: 'Küchenstile, Oberflächen und Raumideen, die dein Zuhause prägen.', cta: 'Inspiration entdecken', to: '/inspiration', image: inspImg },
  { kicker: 'Journal', title: 'Wissen, das weiterhilft.', text: 'Tipps, Ideen und Expertenwissen rund um deine Küche.', cta: 'Zum Journal', to: '/journal', image: jrnlImg },
  { kicker: 'Vorher / Nachher', title: 'Echte Verwandlungen.', text: 'Sieh, was aus Räumen werden kann, wenn alles zusammenpasst.', cta: 'Projekte ansehen', to: '/vorher-nachher', image: vnImg },
  { kicker: 'Karriere', title: 'Gestalte mit uns die Zukunft.', text: 'Lust auf Küchen, Design und Handwerk ohne Möbelhaus-Zirkus?', cta: 'Mehr erfahren', to: '/karriere', image: karriereImg },
  { kicker: 'Über uns', title: 'Die Menschen hinter VIDEKO.', text: 'Persönlich, ehrlich und mit echtem Anspruch an gute Küchen.', cta: 'Lern uns kennen', to: '/ueber-uns', image: ueberImg },
]

export default function Home() {
  return (
    <div className="leist-page home-page">
      <Hero />

      {/* DREI EINSTIEGE – organische Premium-Cards */}
      <section className="section home-entries">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Dein Einstieg"
            title={<>Wo möchtest du <span className="grad">beginnen?</span></>}
            lead="Drei Wege in deine VIDEKO-Küche – finde deinen Stil, erlebe unser Studio oder sprich direkt mit uns."
          />
          <div className="orbcards">
            {ENTRIES.map((c, i) => (
              <Reveal key={c.to} delay={i * 0.08}>
                <Link className={`orbcard orbcard--${c.shape}`} to={c.to}>
                  <span className="orbcard__img" style={{ backgroundImage: `url(${c.image})` }} aria-hidden="true" />
                  <span className="orbcard__body">
                    <span className="orbcard__kicker">{c.kicker}</span>
                    <span className="orbcard__title">{c.title}</span>
                    <span className="orbcard__text">{c.text}</span>
                    <span className="orbcard__cta">{c.cta} <ArrowUpRight size={16} strokeWidth={1.9} /></span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
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

      {/* EXPLODING KITCHEN */}
      <ExplodingKitchen />

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
