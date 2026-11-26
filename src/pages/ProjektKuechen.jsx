import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Minus, ArrowRight } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import Img from '../components/Img.jsx'
import { BRAND } from '../data/company.js'
import { PROJEKT_LEISTUNGEN, BAUTRAEGER, INVESTOREN } from '../data/projektkuechen.js'

import heroBautraeger from '../assets/images/leistungen/ls-coordination.webp'
import heroInvestoren from '../assets/images/leistungen/ls-consulting.webp'
import splitImg from '../assets/images/leistungen/ls-3d.webp'

/**
 * Gewerbliche Leistungsseiten für Bauträger und Immobilieninvestoren.
 *
 * Zwei Suchintentionen, eine Komponente: Bauträger planen Neubauten mit
 * mehreren Einheiten (Installationsplan, Bauablauf), Investoren denken in
 * Vermietbarkeit und Mieterwechsel (Bestand, Robustheit). Deshalb eigene
 * Texte je Seite, gemeinsamer Aufbau und gemeinsame, bestätigte
 * Leistungsliste. Die Seiten siezen, weil sie sich an Gewerbekunden richten.
 *
 * Leitplanke siehe src/data/projektkuechen.js: keine Projektgrößen, keine
 * Referenzen, keine Lieferzeiten, keine Partnerstatus-Behauptung.
 */
const VARIANTEN = {
  bautraeger: { daten: BAUTRAEGER, hero: heroBautraeger, gegen: INVESTOREN, gegenLabel: 'Küchen für Immobilieninvestoren' },
  investoren: { daten: INVESTOREN, hero: heroInvestoren, gegen: BAUTRAEGER, gegenLabel: 'Küchen für Bauträger' },
}

export default function ProjektKuechen({ variante }) {
  const { daten: d, hero, gegen, gegenLabel } = VARIANTEN[variante]
  const [offen, setOffen] = useState(0)
  const A = BRAND.assortment

  return (
    <div className="aaeh-page">
      <PageHero
        kicker={d.kicker}
        title={<>{d.title}<br /><span className="grad">{d.titleGrad}</span></>}
        lead={d.lead}
        image={hero}
        aiImage
      >
        <CTAButton to="/beratung">Projekt anfragen</CTAButton>
        <CTAButton href={`tel:${BRAND.phoneHref}`} variant="dark">{BRAND.phone}</CTAButton>
      </PageHero>

      {/* 1 — Leistungen (bestätigt) */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Was wir übernehmen"
            title={<>Planung und Montage <span className="grad">aus einer Hand.</span></>}
            lead="Das ist unser Leistungsumfang. Was darüber hinaus nötig ist, besprechen wir projektbezogen und sagen es nur zu, wenn wir es halten können."
          />
          <ul className="aaeh-probs" style={{ listStyle: 'none', padding: 0 }}>
            {PROJEKT_LEISTUNGEN.map((l, i) => (
              <Reveal key={l.title} as="li" className="aaeh-prob" delay={(i % 3) * 0.05}>
                <h3 className="aaeh-prob__title">{l.title}</h3>
                <p className="aaeh-prob__text">{l.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 2 — was vorab geklärt wird */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader kicker="Vor dem Angebot" title={d.klaerenTitle} lead={d.klaerenLead} />
          <ol className="aaeh-steps">
            {d.klaeren.map((k, i) => (
              <Reveal key={k.title} as="li" className="aaeh-step" delay={(i % 3) * 0.05}>
                <span className="aaeh-step__num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="aaeh-step__title">{k.title}</h3>
                  <p className="aaeh-step__text">{k.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 3 — Wissen + Marken (dunkler Abschnitt) */}
      <section className="section section--dark">
        <div className="container aaeh-split">
          <Reveal className="aaeh-split__copy">
            <span className="kicker kicker--gold">Aus der Praxis</span>
            <h2 className="aaeh-split__title">{d.wissenTitle}</h2>
            {d.wissen.map((p) => <p key={p.slice(0, 24)} className="aaeh-split__text">{p}</p>)}
            <p className="aaeh-split__text">
              Küchen führen wir von {A.kitchens.join(', ')}, Geräte von {A.appliances.join(', ')},
              Spülen und Armaturen von {A.sinksAndTaps.join(', ')}.
            </p>
            <div className="aaeh-split__links">
              <Link to={d.wissenLink.to} className="aaeh-link">{d.wissenLink.label} <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/marken" className="aaeh-link">Unsere Marken <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/kuechenmontage-wuerzburg" className="aaeh-link">Küchenmontage <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/arbeitsplatten" className="aaeh-link">Arbeitsplatten <ArrowRight size={15} strokeWidth={2} /></Link>
            </div>
          </Reveal>
          <Reveal className="aaeh-split__media">
            <Img src={splitImg} alt="" sizes="(max-width: 900px) 100vw, 560px" />
          </Reveal>
        </div>
      </section>

      {/* 4 — FAQ */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader kicker="Häufige Fragen" title={<>Was gewerbliche Kunden <span className="grad">zuerst fragen.</span></>} />
          <div className="aaeh-faq">
            {d.faqs.map((f, i) => (
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

      {/* 5 — CTA */}
      <section className="section section--light">
        <div className="container aaeh-final">
          <Reveal>
            <span className="kicker kicker--gold">Nächster Schritt</span>
            <h2 className="aaeh-final__title">Schicken Sie uns die Pläne.</h2>
            <p className="aaeh-final__text">
              Grundrisse, Installationsplan und ein grober Zeitrahmen reichen für das erste
              Gespräch. Danach sagen wir Ihnen, was wir übernehmen können und was nicht.
              Erreichbar unter {BRAND.phone} oder {BRAND.contactEmail}.
            </p>
            <div className="aaeh-final__btns">
              <CTAButton to="/beratung">Projekt anfragen</CTAButton>
              <CTAButton to={gegen.path} variant="dark">{gegenLabel}</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
