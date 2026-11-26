import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Plus, Minus, ArrowRight } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import { BRAND } from '../data/company.js'
import { MARKEN, markeBySlug } from '../data/marken.js'

import heroKueche from '../assets/images/leistungen/ls-3d.webp'
import heroGeraet from '../assets/images/leistungen/ls-feature.webp'
import heroSpuele from '../assets/images/leistungen/ls-consulting.webp'

const HERO = { kitchens: heroKueche, appliances: heroGeraet, sinksAndTaps: heroSpuele }

/**
 * /marken/:slug — eine Seite je Marke mit eigener Seite (marken.js).
 * Bilder sind eigene KI-Visualisierungen, keine Herstellerbilder (Rechte offen).
 */
export default function Marke() {
  const { slug } = useParams()
  const m = markeBySlug(slug)
  const [offen, setOffen] = useState(0)
  if (!m) return <Navigate to="/marken" replace />

  const nachbarn = MARKEN.filter((x) => x.gruppe === m.gruppe && x.slug !== m.slug)

  return (
    <div className="aaeh-page">
      <PageHero
        kicker="Marken bei VIDEKO"
        title={<>{m.hero}<br /><span className="grad">{m.heroGrad}</span></>}
        lead={m.lead}
        image={HERO[m.gruppe]}
        aiImage
      >
        <CTAButton to="/beratung">Beratung anfragen</CTAButton>
        <CTAButton href={`tel:${BRAND.phoneHref}`} variant="dark">{BRAND.phone}</CTAButton>
      </PageHero>

      <section className="section section--light">
        <div className="container">
          <SectionHeader kicker={m.name} title={<>Wie wir {m.name} <span className="grad">einsetzen.</span></>} />
          <ol className="aaeh-steps">
            {m.abschnitte.map((a, i) => (
              <Reveal key={a.title} as="li" className="aaeh-step" delay={(i % 3) * 0.05}>
                <span className="aaeh-step__num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="aaeh-step__title">{a.title}</h3>
                  <p className="aaeh-step__text">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container aaeh-split">
          <Reveal className="aaeh-split__copy">
            <span className="kicker kicker--gold">Aus einer Hand</span>
            <h2 className="aaeh-split__title">Die Marke ist die halbe Küche.</h2>
            <p className="aaeh-split__text">
              Die andere Hälfte sind Planung, Aufmaß und Montage. Die übernehmen wir selbst:
              3D-Planung, millimetergenaues Aufmaß vor Ort und Montage durch unser eigenes Team.
              Arbeitsplatten fertigt unser Naturstein- oder Keramikpartner.
            </p>
            <p className="aaeh-split__text">
              Unsere Ausstellung in der Hertzstraße 4 soll am {BRAND.plannedOpeningLabel} öffnen.
              Bis dahin beraten wir nach Terminvereinbarung.
            </p>
            <div className="aaeh-split__links">
              {m.weiter && <Link to={m.weiter.to} className="aaeh-link">{m.weiter.label} <ArrowRight size={15} strokeWidth={2} /></Link>}
              <Link to="/marken" className="aaeh-link">Alle Marken <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/planung" className="aaeh-link">Küchenplanung <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/kuechenmontage-wuerzburg" className="aaeh-link">Küchenmontage <ArrowRight size={15} strokeWidth={2} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--light">
        <div className="container">
          <SectionHeader kicker="Häufige Fragen" title={<>{m.name}: <span className="grad">kurz beantwortet.</span></>} />
          <div className="aaeh-faq">
            {m.faqs.map((f, i) => (
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
            {m.name} ist eine Marke des jeweiligen Herstellers. Herstellerangaben laut{' '}
            {m.quellen.map((q, i) => <a key={q} href={q} rel="noopener" target="_blank">{i ? ', ' : ''}{new URL(q).hostname.replace(/^www\./, '')}</a>)}.
            Die Bilder auf dieser Seite sind KI-Visualisierungen, keine Herstellerfotos.
          </p>
        </div>
      </section>

      {nachbarn.length > 0 && (
        <section className="section section--light">
          <div className="container">
            <SectionHeader kicker="Im Vergleich" title="Weitere Marken in diesem Bereich" />
            <ul className="aaeh-probs" style={{ listStyle: 'none', padding: 0 }}>
              {nachbarn.map((n) => (
                <li key={n.slug} className="aaeh-prob">
                  <h3 className="aaeh-prob__title">{n.name}</h3>
                  <p className="aaeh-prob__text">{n.kurz}</p>
                  <Link to={n.eigeneSeite ? `/marken/${n.slug}` : '/marken'} className="aaeh-link">
                    {n.eigeneSeite ? `Mehr zu ${n.name}` : 'Zur Markenübersicht'} <ArrowRight size={15} strokeWidth={2} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section section--light">
        <div className="container aaeh-final">
          <Reveal>
            <span className="kicker kicker--gold">Nächster Schritt</span>
            <h2 className="aaeh-final__title">{m.name} planen lassen.</h2>
            <p className="aaeh-final__text">
              Erzähl uns, wie du kochst und wie der Raum aussieht. Wir planen, ob und wie {m.name} dazu
              passt, und sagen es dir auch, wenn eine andere Lösung besser ist.
              Erreichbar unter {BRAND.phone} oder {BRAND.contactEmail}.
            </p>
            <div className="aaeh-final__btns">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/marken" variant="dark">Alle Marken</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
