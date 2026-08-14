import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ProcessTimeline from '../components/ProcessTimeline.jsx'
import BeforeAfter from '../components/BeforeAfter.jsx'
import { KiBadge, KiHinweis } from '../components/legal/KiKennzeichnung.jsx'

import heroImg from '../assets/images/vorher-nachher/02_hero_dark_kitchen_banner.webp'
import introImg from '../assets/images/vorher-nachher/03_intro_helle_wohnkueche.webp'
import p1 from '../assets/images/vorher-nachher/04_projekt_01_kueche_wohnbereich.webp'
import p2 from '../assets/images/vorher-nachher/05_projekt_02_modernisierung_bestandskueche.webp'
import p3 from '../assets/images/vorher-nachher/06_projekt_03_raumkonzept_licht.webp'
import p4 from '../assets/images/vorher-nachher/07_projekt_04_komplettumbau.webp'
import p5 from '../assets/images/vorher-nachher/08_projekt_05_wohnkueche_deluxe.webp'
import trustImg from '../assets/images/vorher-nachher/11_beratung_kundenmoment.webp'
import vorher1 from '../assets/images/vorher-nachher/vorher-1.webp'
import nachher1 from '../assets/images/vorher-nachher/nachher-1.webp'
import vorher2 from '../assets/images/vorher-nachher/vorher-2.webp'
import nachher2 from '../assets/images/vorher-nachher/nachher-2.webp'
import vorher3 from '../assets/images/vorher-nachher/vorher-3.webp'
import nachher3 from '../assets/images/vorher-nachher/nachher-3.webp'

const PAIRS = [
  { before: vorher1, after: nachher1, cap: 'Verwandlung 01' },
  { before: vorher2, after: nachher2, cap: 'Verwandlung 02' },
  { before: vorher3, after: nachher3, cap: 'Verwandlung 03' },
]

const KEYPOINTS = ['Alltagsnahe Ausgangssituationen', 'Ehrliche Planung & Umsetzung', 'Sichtbare Veränderungen', 'Liebe zum Detail']

const PROJECTS = [
  { title: 'Küche + Wohnbereich', text: 'Offener Übergang von Küche zu Wohnraum.', status: 'In Planung', image: p1, cats: ['Küche', 'Wohnküche'] },
  { title: 'Modernisierung Bestandsküche', text: 'Aus alt mach neu – ohne Komplettabriss.', status: 'In Planung', image: p2, cats: ['Küche', 'Raumumbau'] },
  { title: 'Raumkonzept & Licht', text: 'Mehr Licht, bessere Wege, klare Linien.', status: 'Folgt bald', image: p3, cats: ['Raumumbau', 'Lichtkonzept'] },
  { title: 'Komplettumbau', text: 'Vom Rohbau-Gefühl zur fertigen Wohnküche.', status: 'In Planung', image: p4, cats: ['Komplettumbau', 'Raumumbau'] },
  { title: 'Wohnküche Deluxe', text: 'Wohnen und Kochen auf höchstem Niveau.', status: 'Folgt bald', image: p5, cats: ['Wohnküche', 'Küche'] },
]

const FILTERS = ['Alle', 'Küche', 'Wohnküche', 'Raumumbau', 'Lichtkonzept', 'Komplettumbau']

const PROCESS = [
  { title: 'Kennenlernen', text: 'Wir lernen dich und deinen Raum kennen.' },
  { title: 'Beratung', text: 'Ehrlich, persönlich, ohne Druck.' },
  { title: 'Planung in 3D / VR', text: 'Du siehst dein Ergebnis vorab.' },
  { title: 'Details & Materialien', text: 'Wir feilen, bis alles passt.' },
  { title: 'Koordination & Umbau', text: 'Wir steuern Gewerke und Montage.' },
  { title: 'Fertiges Ergebnis', text: 'Dein neuer Raum – zum Verlieben.' },
]

const TRUST = ['Persönliche Beratung', 'Transparente Abläufe', 'Individuelle Planung', 'Ergebnisse, die bleiben']

export default function VorherNachher() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  const [filter, setFilter] = useState('Alle')
  const shown = PROJECTS.filter((p) => filter === 'Alle' || p.cats.includes(filter))

  return (
    <div className="leist-page vn-page">
      {/* HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} aria-hidden="true" />
          <div className="pagehero__veil" aria-hidden="true" />
          <KiHinweis className="pagehero__ainote" variant="visualization" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Vorher / Nachher</span>
            <h1 className="pagehero__title">Deine Küche.<br /><span className="grad">Deine Verwandlung.</span></h1>
            <p className="pagehero__lead">
              Hier zeigen wir, was möglich ist: von der Ausgangssituation über die
              Planung bis zum fertigen Raum – vom ersten Entwurf bis zum letzten
              Handgriff.
            </p>
            <div className="pagehero__actions">
              <CTAButton to="/beratung">Projekt anfragen</CTAButton>
              <a className="leist-hero__link" href="#projekte">Beratung starten <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* INTRO */}
      <section className="section vn-intro">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__copy">
              <span className="kicker">Was dich hier erwartet</span>
              <h2 className="lintro__title">Ehrliche Planung<br /><span className="grad">statt leerer Versprechen.</span></h2>
              <p className="lintro__text">
                Hier zeigen wir, wie Umbauten, clevere Lösungen und sichtbare
                Veränderungen aussehen können. Die ersten VIDEKO-Projekte sind in
                vollem Gange – du kannst eins davon werden.
              </p>
              <ul className="lstances lstances--2col">
                {KEYPOINTS.map((k) => <li key={k}><Check size={16} strokeWidth={2.4} /> {k}</li>)}
              </ul>
            </Reveal>
            <Reveal className="lintro__media" delay={0.08}>
              <div className="lintro__frame"><img src={introImg} alt="Helle Wohnküche" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PROJEKTE + FILTER */}
      <section className="section vn-projects" id="projekte">
        <div className="container">
          <SectionHeader align="center" kicker="Projekte im Überblick" title={<>Spannende Verwandlungen – <span className="grad">bald hier.</span></>} />
          <div className="vn-filters">
            {FILTERS.map((f) => (
              <button key={f} type="button" className={`chip chip--btn ${filter === f ? 'chip--active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="lservice-grid vn-grid">
            {shown.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 0.06}>
                <article className="lscard vn-card">
                  <span className="lscard__img" style={{ backgroundImage: `url(${p.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className={`status-badge status-badge--${p.status === 'In Umsetzung' ? 'live' : p.status === 'In Planung' ? 'plan' : 'soon'}`}>{p.status}</span>
                  <span className="lscard__body">
                    <span className="lscard__title">{p.title}</span>
                    <span className="lscard__text">{p.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
          <KiHinweis
            className="vnc__ainote"
            variant="not-real-project"
            text="Beispielhafte KI-Visualisierung – kein reales Kundenprojekt. Die gezeigten Räume sind KI-generierte Konzeptbilder, keine dokumentierten Umbauten."
          />
        </div>
      </section>

      {/* VORHER / NACHHER SLIDER – Beispielpaare (teils KI), direkt nach den Projekten */}
      <section className="section vn-ba-sec">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Vorher / Nachher"
            title={<>Bedeutet: <span className="grad">mehr Lebensqualität.</span></>}
            lead="Es geht nicht nur um neue Fronten – sondern um Raumgefühl, Licht, Stauraum und bessere Abläufe. Zieh am Regler und sieh den Unterschied."
          />
          <div className="vn-ba-grid vn-ba-grid--3">
            {PAIRS.map((p, i) => (
              <Reveal key={p.cap} delay={(i % 3) * 0.06}>
                <div className="vn-ba-item">
                  <BeforeAfter before={p.before} after={p.after} beforeAlt="Vorher" afterAlt="Nachher" />
                  <span className="vn-ba-cap">{p.cap}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <KiHinweis className="vn-ba-note" variant="not-real-project" />
        </div>
      </section>

      {/* PROZESS (hell) */}
      <section className="section section--light vn-process">
        <div className="container">
          <SectionHeader align="center" kicker="Unser Prozess" title={<>So entsteht aus deinem Raum <span className="grad">dein Lieblingsort.</span></>} />
          <ProcessTimeline steps={PROCESS} />
        </div>
      </section>

      {/* VERTRAUEN */}
      <section className="section vn-trust">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__media">
              <div className="lintro__frame"><img src={trustImg} alt="Beratungsmoment (KI-generiertes Symbolbild)" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /><KiBadge /></div>
            </Reveal>
            <Reveal className="lintro__copy" delay={0.08}>
              <span className="kicker">Vielleicht bist du als Nächstes dabei</span>
              <h2 className="lintro__title">Dein Projekt könnte<br /><span className="grad">schon bald hier stehen.</span></h2>
              <p className="lintro__text">
                Die ersten echten VIDEKO-Projekte folgen – und neue Kund:innen können
                genau jetzt starten. Werd Teil davon.
              </p>
              <ul className="lstances lstances--2col">
                {TRUST.map((t) => <li key={t}><Check size={16} strokeWidth={2.4} /> {t}</li>)}
              </ul>
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
            </Reveal>
          </div>
        </div>
      </section>

    </div>
  )
}
