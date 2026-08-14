import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChefHat, Zap, Layers, PaintRoller, Lightbulb, Ruler, Wrench, CalendarCheck,
  Plus, Minus, ArrowRight,
} from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Img from '../components/Img.jsx'
import Seo from '../components/Seo.jsx'
import { ROUTE_META } from '../data/routes-meta.js'
import {
  organizationLd, webSiteLd, webPageLd, breadcrumbLd, faqLd,
} from '../data/site.js'

import heroImg from '../assets/images/inspiration/09_premium_architektur_kueche.webp'
import raumImg from '../assets/images/inspiration/03_wohnliche_kueche.webp'

/**
 * Landingpage „Alles aus einer Hand".
 *
 * WICHTIGE INHALTLICHE LEITPLANKE: VIDEKO plant und koordiniert. Elektro,
 * Boden, Trockenbau und Spanndecke werden über VIDEKO organisiert und mit
 * passenden Fachpartnern umgesetzt. Auf dieser Seite steht deshalb nirgends,
 * dass VIDEKO alle Gewerke mit eigenen Mitarbeitern ausführt.
 */

const LEISTUNGEN = [
  {
    icon: ChefHat,
    title: 'Küchenplanung',
    text: 'Grundriss, Stauraum, Arbeitswege und Geräte – geplant für deinen Alltag, nicht für den Katalog.',
  },
  {
    icon: Zap,
    title: 'Elektro & Elektroplanung',
    text: 'Steckdosen, Anschlüsse und Leitungswege werden früh mitgedacht und über passende Elektrofachbetriebe umgesetzt.',
  },
  {
    icon: Layers,
    title: 'Boden',
    text: 'Aufbauhöhen, Übergänge und Belastbarkeit stimmen wir mit der Küchenplanung ab – Ausführung über Fachpartner.',
  },
  {
    icon: PaintRoller,
    title: 'Wände & Trockenbau',
    text: 'Vorwandinstallationen, Nischen und Ausgleichsarbeiten, damit die Küche später sauber an die Wand kommt.',
  },
  {
    icon: Ruler,
    title: 'Spanndecken',
    text: 'Eine ruhige Deckenfläche, in der Leuchten, Lüftung und Technik verschwinden – abgestimmt mit dem Lichtplan.',
  },
  {
    icon: Lightbulb,
    title: 'Beleuchtung',
    text: 'Arbeitslicht, indirektes Licht und Lichtfarbe gehören in die Planung, nicht ans Ende der Baustelle.',
  },
  {
    icon: Layers,
    title: 'Arbeitsplatten',
    text: 'Material, Kante und Ausschnitte inklusive Aufmaß beim Naturstein- oder Keramikpartner.',
  },
  {
    icon: Wrench,
    title: 'Montage',
    text: 'Aufbau, Anschluss und Abnahme der Küche – mit festen Terminen statt vager Zusagen.',
  },
  {
    icon: CalendarCheck,
    title: 'Koordination der Gewerke',
    text: 'Reihenfolge, Termine und Schnittstellen laufen über VIDEKO zusammen. Du hast einen Ansprechpartner statt sechs.',
  },
]

const ABLAUF = [
  {
    step: '01',
    title: 'Aufnahme',
    text: 'Wir schauen uns den Raum an: Maße, Anschlüsse, Bestand, Wünsche. Daraus entsteht die Liste dessen, was wirklich gemacht werden muss.',
  },
  {
    step: '02',
    title: 'Gesamtplanung',
    text: 'Küche, Elektro, Boden, Wand, Decke und Licht werden zusammen geplant – nicht nacheinander improvisiert.',
  },
  {
    step: '03',
    title: 'Fachpartner & Angebote',
    text: 'Für jedes Gewerk holen wir die passenden Fachbetriebe dazu und bündeln die Angebote für dich.',
  },
  {
    step: '04',
    title: 'Terminplan',
    text: 'Die Reihenfolge steht fest, bevor der erste Handwerker kommt. Du weißt, wann was passiert.',
  },
  {
    step: '05',
    title: 'Umsetzung',
    text: 'Während der Bauphase koordiniert VIDEKO die Termine und Schnittstellen zwischen den Gewerken.',
  },
  {
    step: '06',
    title: 'Abnahme',
    text: 'Gemeinsame Durchsicht, offene Punkte werden festgehalten und nachgezogen.',
  },
]

const FAQS = [
  {
    q: 'Führt VIDEKO alle Arbeiten selbst aus?',
    a: 'Nein. VIDEKO plant deine Küche und koordiniert das Projekt. Gewerke wie Elektro, Boden, Trockenbau oder Spanndecke werden über VIDEKO organisiert und von passenden Fachpartnern ausgeführt. Du hast trotzdem nur einen Ansprechpartner.',
  },
  {
    q: 'Was bringt mir das gegenüber einzelnen Aufträgen?',
    a: 'Die Gewerke werden aufeinander abgestimmt geplant: Aufbauhöhen, Anschlüsse, Leitungswege und Licht passen zusammen, weil sie gemeinsam betrachtet wurden. Und du musst die Termine nicht selbst zwischen mehreren Betrieben sortieren.',
  },
  {
    q: 'Kann ich einzelne Gewerke selbst beauftragen?',
    a: 'Ja. Wenn du deinen eigenen Elektriker oder Bodenleger hast, binden wir ihn in die Planung und den Terminplan ein. Du entscheidest, wie viel über VIDEKO läuft.',
  },
  {
    q: 'Wie lange dauert so ein Umbau?',
    a: 'Das hängt vom Umfang und von den Lieferzeiten der Küche ab. Eine belastbare Aussage bekommst du erst nach der Aufnahme vor Ort – vorher wäre jede Zahl geraten.',
  },
  {
    q: 'Was kostet das?',
    a: 'Der Preis ergibt sich aus den tatsächlich benötigten Gewerken und dem Umfang der Küche. Nach dem Aufmaß bekommst du eine Aufstellung, in der du siehst, welcher Posten wofür steht.',
  },
]

export default function AllesAusEinerHand() {
  const [offen, setOffen] = useState(0)
  const meta = ROUTE_META.get('/alles-aus-einer-hand')

  return (
    <div className="aaeh-page">
      <Seo
        title={meta.title}
        description={meta.description}
        canonicalPath="/alles-aus-einer-hand"
        jsonLd={[
          organizationLd(),
          webSiteLd(),
          webPageLd({ path: '/alles-aus-einer-hand', title: meta.title, description: meta.description }),
          breadcrumbLd([
            { name: 'Start', path: '/' },
            { name: 'Alles aus einer Hand', path: '/alles-aus-einer-hand' },
          ]),
          // Die Fragen stehen unten sichtbar auf der Seite – Voraussetzung
          // dafuer, dass FAQPage ausgezeichnet werden darf.
          faqLd(FAQS),
        ]}
      />

      {/* 1 — HERO */}
      <PageHero
        kicker="Komplettumbau"
        title={<>Nicht nur Küche. <span className="grad">Der ganze Raum.</span></>}
        lead="Küche, Elektro, Boden, Wand, Decke und Licht greifen ineinander. Wir planen sie zusammen und koordinieren die Fachpartner, die sie umsetzen."
        image={heroImg}
        aiImage
      >
        <CTAButton to="/beratung">Beratung anfragen</CTAButton>
        <CTAButton to="/vorher-nachher" variant="dark">Verwandlungen ansehen</CTAButton>
      </PageHero>

      {/* 2 — DAS PROBLEM */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Warum das nötig ist"
            title={<>Eine neue Küche ist selten <span className="grad">nur eine neue Küche.</span></>}
            lead="Sobald die alte raus ist, wird sichtbar, was sonst noch dranhängt. Und genau da fangen die Probleme an."
          />
          <div className="aaeh-probs">
            {[
              ['Die Steckdose sitzt falsch', 'Der neue Grundriss braucht Anschlüsse an anderer Stelle – auffallen tut das meist am Montagetag.'],
              ['Der Boden endet unter der alten Küche', 'Wer den Belag erst nach der Küche legt, hat Kanten, Höhenunterschiede und Sockel, die nicht passen.'],
              ['Die Wand ist nicht gerade', 'Ausgleich, Vorwand oder Trockenbau kosten Zeit, die im Terminplan niemand eingeplant hat.'],
              ['Das Licht kommt zuletzt', 'Wenn die Decke schon zu ist, bleibt vom Lichtkonzept oft nur die eine Lampe in der Mitte.'],
              ['Jeder verweist auf den anderen', 'Fünf Betriebe, fünf Terminkalender, und die Koordination bleibt an dir hängen.'],
            ].map(([titel, text], i) => (
              <Reveal key={titel} className="aaeh-prob" delay={(i % 3) * 0.05}>
                <h3 className="aaeh-prob__title">{titel}</h3>
                <p className="aaeh-prob__text">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — LEISTUNGSRASTER */}
      <section className="section">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Der Umfang"
            title={<>Was zusammen geplant wird, <span className="grad">passt am Ende zusammen.</span></>}
            lead="Diese Bereiche denken wir von Anfang an gemeinsam. Ausgeführt werden sie von VIDEKO und den jeweils passenden Fachpartnern."
          />
          <div className="aaeh-grid">
            {LEISTUNGEN.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} className="aaeh-card" delay={(i % 3) * 0.05}>
                <span className="aaeh-card__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.4} /></span>
                <h3 className="aaeh-card__title">{title}</h3>
                <p className="aaeh-card__text">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — ABLAUF */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Der Ablauf"
            title={<>Von der Aufnahme bis zur <span className="grad">Abnahme.</span></>}
            lead="Sechs Schritte, in denen klar ist, wer was macht und wann."
          />
          <ol className="aaeh-steps">
            {ABLAUF.map((s, i) => (
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

      {/* 5 — EIN ANSPRECHPARTNER */}
      <section className="section">
        <div className="container aaeh-split">
          <Reveal className="aaeh-split__copy">
            <span className="kicker kicker--gold">Ein Ansprechpartner</span>
            <h2 className="aaeh-split__title">Du rufst einmal an. <span className="grad">Nicht sechsmal.</span></h2>
            <p className="aaeh-split__text">
              Die Abstimmung zwischen den Gewerken ist der Teil, der Projekte teuer und
              nervig macht. Genau den nehmen wir dir ab: Wir halten die Reihenfolge
              zusammen, klären Schnittstellen vorab und melden uns, bevor du fragen musst.
            </p>
            <p className="aaeh-split__text">
              Ausgeführt wird von Fachbetrieben, die ihr Handwerk können. Organisiert,
              geplant und terminiert wird über VIDEKO.
            </p>
            <div className="aaeh-split__links">
              <Link to="/leistungen" className="aaeh-link">Alle Leistungen im Detail <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/planung" className="aaeh-link">So läuft die Planung <ArrowRight size={15} strokeWidth={2} /></Link>
            </div>
          </Reveal>
          <Reveal className="aaeh-split__media">
            <Img src={raumImg} alt="" sizes="(max-width: 900px) 100vw, 560px" />
          </Reveal>
        </div>
      </section>

      {/* 6 — VERWEIS VORHER / NACHHER */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Ergebnisse"
            title={<>Wie das aussieht, wenn alles <span className="grad">zusammenpasst.</span></>}
            lead="In den Vorher-/Nachher-Vergleichen siehst du, was sich verändert, wenn Raum, Licht und Küche gemeinsam geplant werden."
          />
          <Reveal className="aaeh-cta-center">
            <CTAButton to="/vorher-nachher">Vorher / Nachher ansehen</CTAButton>
          </Reveal>
        </div>
      </section>

      {/* 7 — FAQ */}
      <section className="section">
        <div className="container">
          <SectionHeader
            kicker="Häufige Fragen"
            title={<>Was Kundinnen und Kunden <span className="grad">zuerst fragen.</span></>}
          />
          <div className="aaeh-faq">
            {FAQS.map((f, i) => (
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

      {/* 8 — CTA */}
      <section className="section section--light">
        <div className="container aaeh-final">
          <Reveal>
            <span className="kicker kicker--gold">Nächster Schritt</span>
            <h2 className="aaeh-final__title">Erzähl uns von deinem Raum.</h2>
            <p className="aaeh-final__text">
              Nach der Aufnahme vor Ort weißt du, welche Gewerke dein Projekt wirklich
              braucht – und was das bedeutet. Unverbindlich und ohne Verkaufstheater.
            </p>
            <div className="aaeh-final__btns">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/stylefinder" variant="dark">Erst den Stil finden</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
