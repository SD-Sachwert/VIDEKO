import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Minus, ArrowRight, MapPin } from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import Img from '../components/Img.jsx'
import TextLink from '../components/TextLink.jsx'
import { BRAND } from '../data/company.js'
import { MONTAGE_FAQS } from '../data/leistungsseiten.js'

import heroImg from '../assets/images/leistungen/ls-install.webp'
import aufmassImg from '../assets/images/leistungen/ls-3d.webp'

/**
 * Lokale Leistungsseite „Küchenmontage Würzburg".
 *
 * Eigene Suchintention: Jemand sucht die Ausführung vor Ort, nicht den
 * Planungsprozess. /planung beschreibt den Weg von der Idee bis zur Abnahme,
 * diese Seite den Teil, der bei dir in der Wohnung passiert.
 *
 * INHALTLICHE LEITPLANKE: Die Küchenmontage führt VIDEKO laut /planung
 * („Fachgerecht durch unser eigenes Team") selbst aus; angrenzende Gewerke
 * laufen laut /alles-aus-einer-hand über Fachpartner. Beides steht hier
 * unterschieden. Das Einzugsgebiet entspricht der Liste, die schon auf der
 * Standortseite geführt wurde. Keine Preise, keine Dauerzusagen, keine
 * Garantieversprechen.
 */

const UMFANG = [
  {
    step: '01',
    title: 'Aufmaß',
    text: 'Millimetergenaues Laseraufmaß vor Ort. Wände, Höhen, Anschlüsse und Schrägen werden aufgenommen, bevor irgendetwas bestellt wird.',
  },
  {
    step: '02',
    title: 'Terminplan',
    text: 'Die Reihenfolge steht fest, bevor der erste Handwerker kommt. Du weißt, wann was passiert – statt einer vagen Zusage.',
  },
  {
    step: '03',
    title: 'Anlieferung',
    text: 'Küche, Geräte und Arbeitsplatte kommen abgestimmt an, damit am Montagetag nichts fehlt und nichts im Weg steht.',
  },
  {
    step: '04',
    title: 'Aufbau',
    text: 'Korpusse, Fronten, Sockel und Blenden werden sauber ausgerichtet montiert. Das eigene Team, keine wechselnden Subunternehmer.',
  },
  {
    step: '05',
    title: 'Anschluss',
    text: 'Geräte, Spüle und Technik werden angeschlossen und geprüft. Elektro-, Boden- oder Trockenbauarbeiten koordinieren wir mit den passenden Fachpartnern.',
  },
  {
    step: '06',
    title: 'Endabnahme',
    text: 'Gemeinsame Durchsicht: Wir gehen die Küche mit dir durch, erklären Details und halten offene Punkte schriftlich fest.',
  },
]

/* Einzugsgebiet – dieselbe Liste, die auf der bisherigen Standortseite stand. */
const REGION = ['Würzburg', 'Kitzingen', 'Schweinfurt', 'Tauberbischofsheim', 'Main-Tauber']

export default function KuechenmontageWuerzburg() {
  const [offen, setOffen] = useState(0)

  return (
    <div className="aaeh-page">
      <PageHero
        kicker="Küchenmontage Würzburg"
        title={<>Der Tag, an dem sich zeigt, <span className="grad">wie gut geplant wurde.</span></>}
        lead="Eine Küche wird nicht beim Aufbau gut, sondern beim Aufmaß. Wir messen millimetergenau, terminieren verbindlich und montieren mit dem eigenen Team – in Würzburg und der Region."
        image={heroImg}
        aiImage
      >
        <CTAButton to="/beratung">Termin anfragen</CTAButton>
        <CTAButton to="/planung" variant="dark">Ablauf der Planung</CTAButton>
      </PageHero>

      {/* 1 — Ablauf */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Der Ablauf"
            title={<>Von der Messlatte <span className="grad">bis zur Abnahme.</span></>}
            lead="Sechs Schritte, bei denen jederzeit klar ist, wer was macht und wann."
          />
          <ol className="aaeh-steps">
            {UMFANG.map((s, i) => (
              <Reveal key={s.step} as="li" className="aaeh-step" delay={(i % 3) * 0.05}>
                <span className="aaeh-step__num">{s.step}</span>
                <div>
                  <h3 className="aaeh-step__title">{s.title}</h3>
                  <p className="aaeh-step__text">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 2 — warum das Aufmaß entscheidet (dunkler Abschnitt: aaeh-split) */}
      <section className="section section--dark">
        <div className="container aaeh-split">
          <Reveal className="aaeh-split__copy">
            <span className="kicker kicker--gold">Das Aufmaß</span>
            <h2 className="aaeh-split__title">Wände sind selten gerade. <span className="grad">Pläne schon.</span></h2>
            <p className="aaeh-split__text">
              Zwischen Bauzeichnung und Wirklichkeit liegen erfahrungsgemäß ein paar
              Zentimeter. Vorwände, Rohre, schiefe Ecken und Steckdosen an der falschen
              Stelle fallen genau dann auf, wenn die Küche schon geliefert ist – falls
              vorher niemand nachgemessen hat.
            </p>
            <p className="aaeh-split__text">
              Deshalb steht das Laseraufmaß bei uns vor der Bestellung, nicht danach. Was
              hier auffällt, kostet in der Planung wenig. Am Montagetag kostet es deutlich
              mehr. Wie der ganze Weg dorthin aussieht, steht unter{' '}
              <TextLink href="/planung" tone="light">Küchenplanung</TextLink>.
            </p>
            <div className="aaeh-split__links">
              <Link to="/kuechen-nach-mass" className="aaeh-link">Küchen nach Maß <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/arbeitsplatten" className="aaeh-link">Arbeitsplatten <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/alles-aus-einer-hand" className="aaeh-link">Umbau mit allen Gewerken <ArrowRight size={15} strokeWidth={2} /></Link>
            </div>
          </Reveal>
          <Reveal className="aaeh-split__media">
            <Img src={aufmassImg} alt="" sizes="(max-width: 900px) 100vw, 560px" />
          </Reveal>
        </div>
      </section>

      {/* 3 — Einzugsgebiet */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Wo wir montieren"
            title={<>Würzburg <span className="grad">und die Region drumherum.</span></>}
            lead={`Unser Studio steht in der ${BRAND.studio.street} in ${BRAND.studio.postalCode} ${BRAND.studio.city}. Montiert wird in der Stadt und im Umland – ob dein Ort dazugehört, sagen wir dir im Erstgespräch verbindlich.`}
          />
          <Reveal as="ul" className="aaeh-probs aaeh-probs--kompakt">
            {REGION.map((ort) => (
              <li key={ort} className="aaeh-prob">
                <h3 className="aaeh-prob__title"><MapPin size={16} strokeWidth={1.8} aria-hidden="true" /> {ort}</h3>
              </li>
            ))}
          </Reveal>
          <Reveal className="aaeh-cta-center">
            <CTAButton to="/studio">Studio in Würzburg ansehen</CTAButton>
          </Reveal>
        </div>
      </section>

      {/* 4 — FAQ */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Häufige Fragen"
            title={<>Was vor dem Montagetag <span className="grad">gefragt wird.</span></>}
          />
          <div className="aaeh-faq">
            {MONTAGE_FAQS.map((f, i) => (
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
            <h2 className="aaeh-final__title">Erzähl uns von deinem Raum.</h2>
            <p className="aaeh-final__text">
              Nach dem Aufmaß weißt du, was in deiner Küche wirklich möglich ist – und in
              welchem Zeitrahmen. Unverbindlich und ohne Verkaufstheater.
            </p>
            <div className="aaeh-final__btns">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/leistungen" variant="dark">Alle Leistungen ansehen</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
