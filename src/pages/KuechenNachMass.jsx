import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Minus, ArrowRight, Ruler, LayoutGrid, Archive, Cpu, Lightbulb, Layers,
} from 'lucide-react'

import PageHero from '../components/PageHero.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import Reveal from '../components/Reveal.jsx'
import Img from '../components/Img.jsx'
import TextLink from '../components/TextLink.jsx'
import { BRAND } from '../data/company.js'
import { NACH_MASS_FAQS } from '../data/leistungsseiten.js'

import heroImg from '../assets/images/inspiration/07_kueche_mit_insel.webp'
import raumImg from '../assets/images/inspiration/08_kleine_kueche_clever_geplant.webp'

/**
 * Landingpage „Küchen nach Maß".
 *
 * Bündelt bewusst drei eng verwandte Suchintentionen — Küche nach Maß,
 * Einbauküche, Designküche — auf EINER Seite, statt drei fast gleiche Seiten
 * anzulegen, die sich gegenseitig Konkurrenz machen würden. Der Abschnitt
 * „Drei Begriffe" erklärt deshalb, was die Wörter unterscheidet.
 *
 * INHALTLICHE LEITPLANKE: Alle Aussagen stammen aus bereits belegtem
 * Projektinhalt (Planungsablauf und Laseraufmaß aus /planung, Materialien aus
 * /inspiration, Arbeitsplatten aus /arbeitsplatten, Standort aus company.js).
 * Keine Preise, keine Fertigungstiefe, keine Quadratmeterzahlen.
 */

const RAUM = [
  {
    icon: LayoutGrid,
    title: 'Grundriss',
    text: 'Wo Kochen, Spüle und Vorrat liegen, entscheidet über jeden Handgriff. Das legen wir fest, bevor über Fronten gesprochen wird.',
  },
  {
    icon: Ruler,
    title: 'Maße & Höhen',
    text: 'Arbeitshöhe, Schrankhöhen und Abstände richten sich nach den Menschen, die darin kochen – nicht nach einem Standardraster.',
  },
  {
    icon: Archive,
    title: 'Stauraum',
    text: 'Auszüge, Innenaufteilung und Nischen werden dort geplant, wo die Dinge tatsächlich gebraucht werden.',
  },
  {
    icon: Cpu,
    title: 'Geräte',
    text: 'Backofen, Kochfeld, Dunstabzug und Kühlung gehören in die Planung, nicht als Nachtrag in die Restlücke.',
  },
  {
    icon: Lightbulb,
    title: 'Licht',
    text: 'Arbeitslicht, indirektes Licht und Lichtfarbe werden mitgeplant, solange die Leitungswege noch offen sind.',
  },
  {
    icon: Layers,
    title: 'Materialien',
    text: 'Fronten, Arbeitsplatte und Griffe wirken erst im Zusammenspiel. Deshalb entscheiden wir sie zusammen, nicht nacheinander.',
  },
]

const BEGRIFFE = [
  {
    titel: 'Einbauküche',
    text: 'Beschreibt die Bauform: Die Küche ist fest mit dem Raum verbunden, statt frei zu stehen. Schränke, Geräte und Arbeitsplatte bilden eine durchgehende Einheit.',
  },
  {
    titel: 'Küche nach Maß',
    text: 'Beschreibt die Passgenauigkeit: Wandverläufe, Höhen, Anschlüsse und Nischen bestimmen die Planung – nicht umgekehrt.',
  },
  {
    titel: 'Designküche',
    text: 'Beschreibt den Anspruch an die Gestaltung: Materialien, Proportionen, Fugenbild und Licht ergeben zusammen eine ruhige, hochwertige Wirkung.',
  },
]

export default function KuechenNachMass() {
  const [offen, setOffen] = useState(0)

  return (
    <div className="aaeh-page">
      <PageHero
        kicker="Küchen nach Maß"
        title={<>Dein Raum hat Maße. <span className="grad">Deine Küche auch.</span></>}
        lead="Wände sind selten gerade, Anschlüsse selten dort, wo man sie bräuchte. Wir planen deine Einbauküche für den Raum, den du wirklich hast – und für den Alltag, den du darin führst."
        image={heroImg}
        aiImage
      >
        <CTAButton to="/beratung">Beratung anfragen</CTAButton>
        <CTAButton to="/stylefinder" variant="dark">Erst den Stil finden</CTAButton>
      </PageHero>

      {/* 1 — drei Begriffe, eine Sache */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Erst mal sortiert"
            title={<>Einbauküche, nach Maß, Designküche – <span className="grad">wo ist der Unterschied?</span></>}
            lead="Die drei Wörter meinen nicht dasselbe, werden aber ständig durcheinandergeworfen. Kurz erklärt, damit du weißt, worüber wir sprechen."
          />
          <div className="aaeh-probs">
            {BEGRIFFE.map((b, i) => (
              <Reveal key={b.titel} className="aaeh-prob" delay={(i % 3) * 0.05}>
                <h3 className="aaeh-prob__title">{b.titel}</h3>
                <p className="aaeh-prob__text">{b.text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal as="p" className="aaeh-note">
            Bei VIDEKO fällt das zusammen: Wir planen fest eingebaute Küchen, die an
            den vorhandenen Raum angepasst sind und gestalterisch zusammenpassen.
            Ein Katalograster kommt dabei nicht zum Einsatz.
          </Reveal>
        </div>
      </section>

      {/* 2 — was am Raum entschieden wird (dunkler Abschnitt: aaeh-card) */}
      <section className="section section--dark">
        <div className="container">
          <SectionHeader
            align="center"
            tone="light"
            kicker="Sechs Entscheidungen"
            title={<>Eine Küche nach Maß entsteht <span className="grad">nicht an der Front.</span></>}
            lead="Sie entsteht an diesen sechs Punkten. Sind die geklärt, wird die Auswahl der Oberflächen zum angenehmen Teil."
          />
          <div className="aaeh-grid">
            {RAUM.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} className="aaeh-card" delay={(i % 3) * 0.05}>
                <span className="aaeh-card__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.4} /></span>
                <h3 className="aaeh-card__title">{title}</h3>
                <p className="aaeh-card__text">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — lokal */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Geplant in Würzburg"
            title={<>Maße nimmt man <span className="grad">nicht am Telefon.</span></>}
            lead={`Unser Studio in der ${BRAND.studio.street} in ${BRAND.studio.postalCode} ${BRAND.studio.city} ist der Ort, an dem Planung greifbar wird: Fronten nebeneinanderlegen, Oberflächen im Licht ansehen, den Grundriss in 3D durchgehen.`}
          />
          <Reveal className="aaeh-cta-center">
            <CTAButton to="/studio">Studio in Würzburg ansehen</CTAButton>
          </Reveal>
        </div>
      </section>

      {/* 4 — kleine Räume + Verweise (dunkler Abschnitt: aaeh-split) */}
      <section className="section section--dark">
        <div className="container aaeh-split">
          <Reveal className="aaeh-split__copy">
            <span className="kicker kicker--gold">Gerade bei wenig Platz</span>
            <h2 className="aaeh-split__title">Je enger der Raum, <span className="grad">desto mehr zählt das Maß.</span></h2>
            <p className="aaeh-split__text">
              In einer großen Küche verzeiht ein ungenutzter Zentimeter. In einer kleinen
              entscheidet er darüber, ob der Auszug noch am Kühlschrank vorbeikommt.
              Schiefe Wände, Vorwände und ungünstig sitzende Anschlüsse fallen hier
              sofort auf – deshalb messen wir millimetergenau per Laser, bevor bestellt wird.
            </p>
            <p className="aaeh-split__text">
              Wie der Weg von der ersten Idee bis zur Abnahme aussieht, steht ausführlich
              auf der Seite zur <TextLink href="/planung">Küchenplanung</TextLink>.
            </p>
            <div className="aaeh-split__links">
              <Link to="/arbeitsplatten" className="aaeh-link">Arbeitsplatte wählen <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/inspiration" className="aaeh-link">Materialien &amp; Stile ansehen <ArrowRight size={15} strokeWidth={2} /></Link>
              <Link to="/kuechenmontage-wuerzburg" className="aaeh-link">Aufmaß &amp; Montage <ArrowRight size={15} strokeWidth={2} /></Link>
            </div>
          </Reveal>
          <Reveal className="aaeh-split__media">
            <Img src={raumImg} alt="" sizes="(max-width: 900px) 100vw, 560px" />
          </Reveal>
        </div>
      </section>

      {/* 5 — FAQ */}
      <section className="section section--light">
        <div className="container">
          <SectionHeader
            kicker="Häufige Fragen"
            title={<>Was vor der Planung <span className="grad">meistens gefragt wird.</span></>}
          />
          <div className="aaeh-faq">
            {NACH_MASS_FAQS.map((f, i) => (
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

      {/* 6 — CTA */}
      <section className="section section--light">
        <div className="container aaeh-final">
          <Reveal>
            <span className="kicker kicker--gold">Nächster Schritt</span>
            <h2 className="aaeh-final__title">Erzähl uns von deinem Raum.</h2>
            <p className="aaeh-final__text">
              Ein Grundriss, ein paar Fotos und die Frage, was dich an deiner jetzigen
              Küche stört – mehr braucht es für den Anfang nicht.
            </p>
            <div className="aaeh-final__btns">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/vorher-nachher" variant="dark">Verwandlungen ansehen</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
