import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Minus, ArrowRight } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import { BRAND } from '../data/company.js'
import { MARKEN, MARKEN_GRUPPEN, MARKEN_FAQS } from '../data/marken.js'

import hero from '../assets/images/showroom/showroom-hero-immersive.webp'

/**
 * /marken — Übersicht über das bestätigte Sortiment.
 * Keine Logos (Nutzungsrechte offen), kein Partnerstatus. Marken mit eigener
 * Seite sind verlinkt, die übrigen stehen mit einem ehrlichen Absatz hier.
 */
export default function Marken() {
  const [offen, setOffen] = useState(0)

  return (
    <div className="aaeh-page">
      <PageHero
        kicker="Unsere Marken"
        title={<>Zwölf Marken.<br /><span className="grad">Eine Planung, die zu dir passt.</span></>}
        lead="Küchen, Elektrogeräte, Spülen und Armaturen, die wir führen. Welche davon in deine Küche gehört, entscheiden Raum, Alltag und Budget, nicht der Name auf dem Prospekt."
        image={hero}
        aiImage
      >
        <CTAButton to="/beratung">Beratung anfragen</CTAButton>
        <CTAButton href={`tel:${BRAND.phoneHref}`} variant="dark">{BRAND.phone}</CTAButton>
      </PageHero>

      {MARKEN_GRUPPEN.map((g) => (
        <section key={g.key} className="section section--light">
          <div className="container">
            <SectionHeader kicker={g.title} title={g.title} lead={g.lead} />
            <ul className="aaeh-probs" style={{ listStyle: 'none', padding: 0 }}>
              {MARKEN.filter((m) => m.gruppe === g.key).map((m, i) => (
                <Reveal key={m.slug} as="li" className="aaeh-prob" delay={(i % 3) * 0.05}>
                  <h3 className="aaeh-prob__title">{m.name}</h3>
                  <p className="aaeh-prob__text">{m.kurz}</p>
                  {m.eigeneSeite && (
                    <Link to={`/marken/${m.slug}`} className="aaeh-link">
                      Mehr zu {m.name} <ArrowRight size={15} strokeWidth={2} />
                    </Link>
                  )}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <section className="section section--dark">
        <div className="container aaeh-split">
          <Reveal className="aaeh-split__copy">
            <span className="kicker kicker--gold">Ausstellung</span>
            <h2 className="aaeh-split__title">Ab {BRAND.plannedOpeningLabel} in der Hertzstraße 4.</h2>
            <p className="aaeh-split__text">
              Unsere Ausstellung in Würzburg soll am {BRAND.plannedOpeningLabel} öffnen. Bis dahin
              beraten wir nach Terminvereinbarung und zeigen Planungen, Muster und Materialien
              im Gespräch.
            </p>
            <div className="aaeh-split__links">
              <Link to="/studio" className="aaeh-link">Zum Studio <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/planung" className="aaeh-link">Küchenplanung <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/kuechen-fuer-bautraeger" className="aaeh-link">Für Bauträger <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/kuechen-fuer-immobilieninvestoren" className="aaeh-link">Für Investoren <ArrowRight size={15} strokeWidth={2} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--light">
        <div className="container">
          <SectionHeader kicker="Häufige Fragen" title={<>Was oft gefragt wird, <span className="grad">kurz beantwortet.</span></>} />
          <div className="aaeh-faq">
            {MARKEN_FAQS.map((f, i) => (
              <Reveal key={f.q} as="div" className={`jacc ${offen === i ? 'is-open' : ''}`} delay={(i % 2) * 0.05}>
                <button type="button" className="jacc__q" onClick={() => setOffen(offen === i ? -1 : i)} aria-expanded={offen === i}>
                  <span>{f.q}</span>
                  <span className="jacc__icon">{offen === i ? <Minus size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}</span>
                </button>
                <div className="jacc__a"><div className="jacc__a-in"><p>{f.a}</p></div></div>
              </Reveal>
            ))}
          </div>
          <p className="aaeh-prob__text" style={{ marginTop: '1.5rem' }}>
            Markennamen sind Marken der jeweiligen Hersteller. Angaben zu den Herstellern stammen von deren Websites.
          </p>
        </div>
      </section>

      <section className="section section--light">
        <div className="container aaeh-final">
          <Reveal>
            <span className="kicker kicker--gold">Nächster Schritt</span>
            <h2 className="aaeh-final__title">Erst der Raum, dann die Marke.</h2>
            <p className="aaeh-final__text">
              Bring Grundriss oder ein paar Handyfotos mit. Wir planen, und danach sprechen wir
              über Fronten, Geräte und Spüle. Erreichbar unter {BRAND.phone} oder {BRAND.contactEmail}.
            </p>
            <div className="aaeh-final__btns">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/planung" variant="dark">So planen wir</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
