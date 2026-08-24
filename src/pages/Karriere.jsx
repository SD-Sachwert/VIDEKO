import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Store, PencilRuler, Hammer, Ruler, Headset, MessageSquare, Megaphone,
  Sparkles, Rocket, Mail, ArrowRight, MapPin, Upload, Check,
  Gem, Smile, ShieldCheck, Zap, Coffee, Heart, ChevronLeft, ChevronRight,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import useCarouselNav from '../hooks/useCarouselNav.js'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import TextLink from '../components/TextLink.jsx'
import KarriereTopShowcase from '../components/KarriereTopShowcase.jsx'
import ComparisonTable from '../components/ComparisonTable.jsx'
import { KiHinweis } from '../components/legal/KiKennzeichnung.jsx'

import heroImg from '../assets/images/karriere/01_hero_team_beratung.webp'
import jVerkauf from '../assets/images/karriere/02_job_kuechenverkauf_beratung.webp'
import jPlanung from '../assets/images/karriere/03_job_kuechenplanung_planungstisch.webp'
import jMontage from '../assets/images/karriere/04_job_monteure_aufmass.webp'
import jEmpfang from '../assets/images/karriere/05_job_empfang_service.webp'
import jMarketing from '../assets/images/karriere/06_job_marketing_social_media.webp'
import jReinigung from '../assets/images/karriere/07_job_reinigung_studioservice.webp'
import jc01 from '../assets/images/karriere/karten/01_beratung_verkauf.webp'
import jc02 from '../assets/images/karriere/karten/02_planung_technik.webp'
import jc03 from '../assets/images/karriere/karten/03_montage_handwerk.webp'
import jc04 from '../assets/images/karriere/karten/04_empfang_organisation.webp'
import jc05 from '../assets/images/karriere/karten/05_marketing_social_media.webp'
import jc06 from '../assets/images/karriere/karten/06_quereinsteiger.webp'
import jc07 from '../assets/images/karriere/karten/07_reinigung_studio_service.webp'
import jc08 from '../assets/images/karriere/karten/08_reklamation_service.webp'

const DECK = [
  { n: '01', name: 'Beratung & Verkauf', img: jc01, panel: { about: 'Kund:innen beraten & begeistern.', tasks: 'Gespräche führen, Lösungen finden, Angebote erstellen.', req: 'Kommunikationsstärke, Empathie und ein gutes Gespür für Menschen.', get: 'Wertschätzung, Entwicklung und ein Team, das zusammenhält.' } },
  { n: '02', name: 'Planung & Technik', img: jc02, panel: { about: 'Planung, Präzision und das gute Gefühl, wenn alles passt.', tasks: 'Küchen planen, Details abstimmen, technische Lösungen mitdenken.', req: 'Struktur, Genauigkeit und Freude an sauberer Planung.', get: 'Verantwortung, Entwicklung und spannende Projekte.' } },
  { n: '03', name: 'Montage & Handwerk', img: jc03, panel: { about: 'Saubere Umsetzung und echtes Handwerk.', tasks: 'Küchen montieren, Details sauber umsetzen, Lösungen vor Ort finden.', req: 'Handwerkliches Geschick, Zuverlässigkeit und Lust auf gute Arbeit.', get: 'Wertschätzung, ein starkes Team und sichtbare Ergebnisse.' } },
  { n: '04', name: 'Empfang & Organisation', img: jc04, panel: { about: 'Ordnung, Übersicht und ein professioneller erster Eindruck.', tasks: 'Termine koordinieren, Anfragen betreuen, intern den Überblick behalten.', req: 'Organisationstalent, Freundlichkeit und ein ruhiges Auftreten.', get: 'Verantwortung, Vertrauen und einen wichtigen Platz im Ablauf.' } },
  { n: '05', name: 'Marketing & Social Media', img: jc05, panel: { about: 'Sichtbarkeit, Marke und gutes Storytelling.', tasks: 'Inhalte planen, Content erstellen, Ideen sichtbar machen.', req: 'Kreativität, Stilgefühl und Lust auf hochwertige Kommunikation.', get: 'Freiraum, Entwicklung und eine Marke mit Charakter.' } },
  { n: '06', name: 'Quereinstieg', img: jc06, panel: { about: 'Potenzial statt Schubladendenken.', tasks: 'Je nach Stärken mitarbeiten, lernen, Verantwortung übernehmen und dich entwickeln.', req: 'Motivation, Verlässlichkeit und Lust, etwas zu bewegen.', get: 'Echte Chancen, ehrliches Feedback und Entwicklung im Team.' } },
  { n: '07', name: 'Reinigung & Studio-Service', img: jc07, panel: { about: 'Ein Studio, das jeden Tag zum Reinkommen einlädt.', tasks: 'Studio pflegen, für Ordnung sorgen und den perfekten ersten Eindruck sichern.', req: 'Sorgfalt, Verlässlichkeit und ein Auge fürs Detail.', get: 'Wertschätzung, ein nettes Team und planbare Zeiten.' } },
  { n: '08', name: 'Reklamation & Service', img: jc08, panel: { about: 'Aus Problemen wieder Vertrauen machen.', tasks: 'Anliegen aufnehmen, Lösungen finden und Kund:innen souverän begleiten.', req: 'Ruhe, Klarheit und ein gutes Gespür für Menschen.', get: 'Verantwortung, Entwicklung und ein Team, das hinter dir steht.' } },
]

const VALUES = [
  { icon: Heart, title: 'Menschen im Mittelpunkt', text: 'Ehrlich, wertschätzend und auf Augenhöhe – im Team und mit unseren Kund:innen.' },
  { icon: Gem, title: 'Qualität, die bleibt', text: 'Wir gestalten Wohnräume, die begeistern – bis ins kleinste Detail.' },
  { icon: Rocket, title: 'Entwicklung, die Sinn macht', text: 'Wachsen. Verantwortung übernehmen. Dinge bewegen – bei VIDEKO.' },
]

const STATS_DECK = [
  { v: '100%', l: 'Leidenschaft für Küchen' },
  { v: '0', l: 'Möbelhaus-Vibes' },
  { v: '1', l: 'eingespieltes Team' },
  { v: '∞', l: 'Tassen Kaffee' },
  { v: '∞', l: 'Möglichkeiten' },
]
import imgProzess from '../assets/images/karriere/08_bewerbungsprozess_teammeeting.webp'
import imgFormular from '../assets/images/karriere/09_bewerbung_interior_formular.webp'
import imgCta from '../assets/images/karriere/10_cta_footer_premium_showroom.webp'

const ROLES = [
  { title: 'Beratung & Verkauf', cat: 'verkaufen', icon: Store, image: jVerkauf, text: 'Für Menschen, die zuhören können, bevor sie verkaufen.' },
  { title: 'Planung & Technik', cat: 'planen', icon: PencilRuler, image: jPlanung, text: 'Für alle, die bei 3 mm Versatz nervös werden. Gut so.' },
  { title: 'Aufmaß & Koordination', cat: 'planen', icon: Ruler, image: jMontage, text: 'Millimeter, Termine, Überblick – genau dein Spielfeld.' },
  { title: 'Montage & Handwerk', cat: 'anpacken', icon: Hammer, image: jMontage, text: 'Für Leute, die wissen: Gerade ist nicht ungefähr gerade.' },
  { title: 'Reinigung & Studio-Service', cat: 'anpacken', icon: Sparkles, image: jReinigung, text: 'Du hältst das Studio jeden Tag in Top-Form.' },
  { title: 'Empfang & Sachbearbeitung', cat: 'organisieren', icon: Headset, image: jEmpfang, text: 'Für alle, die Chaos sehen und innerlich schon eine Tabelle öffnen.' },
  { title: 'Reklamation & Service', cat: 'organisieren', icon: MessageSquare, image: jEmpfang, text: 'Du löst Probleme, bevor sie welche werden.' },
  { title: 'Marketing & Social Media', cat: 'social', icon: Megaphone, image: jMarketing, text: 'Mehr als ein Vorher-Nachher-Bild mit Filter.' },
  { title: 'Quereinsteiger', cat: 'offen', icon: Rocket, image: jReinigung, text: 'Noch keine Küchen-Erfahrung? Hauptsache Kopf an.' },
]



const STEPS3 = [
  { n: '1', title: 'Kurz melden', text: 'Ein paar Zeilen reichen. Lebenslauf? Gern, muss aber nicht perfekt sein.' },
  { n: '2', title: 'Wir melden uns', text: 'Persönlich, ehrlich, kein Bot – wir schauen, ob die Chemie passt.' },
  { n: '3', title: 'Studio erleben', text: 'Komm vorbei, schau wie wir ticken. Passt? Dann legen wir los.' },
]

const HEROCARDS = [
  { icon: ShieldCheck, t: 'Echte Verantwortung' },
  { icon: Zap, t: 'Kurze Wege' },
  { icon: Gem, t: 'Premium statt Preisschlacht' },
]

const WHY4 = [
  { icon: Gem, title: 'Premium statt Masse', text: 'Qualität vor Stückzahl – jedes Projekt zählt.' },
  { icon: Rocket, title: 'Mitgestalten statt Mitschwimmen', text: 'Aufbauphase mit echtem Gestaltungsspielraum.' },
  { icon: MessageSquare, title: 'Klartext statt Konzernsprech', text: 'Kurze Wege, ehrliche Worte, schnelle Entscheidungen.' },
  { icon: Smile, title: 'Humor inklusive', text: 'Hochwertig heißt nicht steif. Wir nehmen die Arbeit ernst – uns nicht zu sehr.' },
]

const FLOW3 = [
  { n: '01', title: 'Beratung', text: 'Wir hören zu, bevor wir planen – ehrlich und auf Augenhöhe.', img: jVerkauf },
  { n: '02', title: 'Planung', text: 'Aus Wünschen wird ein klarer Plan, in 3D sichtbar.', img: jPlanung },
  { n: '03', title: 'Umsetzung', text: 'Sauber montiert, termintreu, bis die letzte Schraube sitzt.', img: jMontage },
]

const BEREICHE = ROLES.map((r) => r.title).concat('Initiativbewerbung')

export default function Karriere() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)
  const [activeJob, setActiveJob] = useState(0)
  const [paused, setPaused] = useState(false)

  const handleApply = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    if (fd.get('website')) return // Honeypot
    const fileInput = e.target.querySelector('input[type="file"]')
    const dateien = fileInput ? [...fileInput.files].map((x) => x.name) : []
    setSending(true); setError(false)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'karriere',
          name: fd.get('name'), email: fd.get('email'), telefon: fd.get('telefon'),
          bereich: fd.get('bereich'), nachricht: fd.get('nachricht'), dateien,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) { setSent(true); e.target.reset() } else setError(true)
    } catch { setError(true) }
    setSending(false)
  }

  const deckNext = () => setActiveJob((v) => (v + 1) % DECK.length)
  const deckPrev = () => setActiveJob((v) => (v - 1 + DECK.length) % DECK.length)
  const deckGo = (i) => setActiveJob(i)
  const deckNav = useCarouselNav(deckNext, deckPrev)

  // autoplay — pauses on hover; respects reduced-motion
  useEffect(() => {
    if (paused) return
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActiveJob((v) => (v + 1) % DECK.length), 4500)
    return () => clearInterval(id)
  }, [paused])

  const deckRel = (i) => { let d = i - activeJob; const n = DECK.length; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d }

  return (
    <div className="leist-page karr-page">
      {/* 1 — HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} aria-hidden="true" />
          <div className="pagehero__veil" aria-hidden="true" />
          <KiHinweis className="pagehero__ainote" variant="symbolic" text="KI-generiertes Symbolbild – keine realen Mitarbeitenden" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Karriere bei VIDEKO</span>
            <h1 className="pagehero__title">Bock auf Küchen.<br /><span className="grad">Aber ohne Möbelhaus-Zirkus.</span></h1>
            <p className="pagehero__lead">
              Du musst kein Küchenroboter sein. Du musst mitdenken, anpacken und Lust auf gute Arbeit haben.
              Den Rest kriegen wir gemeinsam hin.
            </p>
            <div className="pagehero__actions">
              <CTAButton href="#rollen">Offene Stellen ansehen</CTAButton>
              <a className="leist-hero__link" href="#bewerbung">Einfach Hallo sagen <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
          </Reveal>
          <div className="karr-herocards">
            {HEROCARDS.map((h, i) => (
              <Reveal key={h.t} delay={0.15 + i * 0.08} className="karr-herocard">
                <span className="karr-herocard__ic"><h.icon size={17} strokeWidth={1.7} /></span>
                <span>{h.t}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 2 — WARUM GUTE LEUTE (Philosophie-Coverflow) */}
      <KarriereTopShowcase />

      {/* 2b — SO LÄUFT'S BEI UNS WIRKLICH (hell, 3 Schritte) */}
      <section className="section section--light karr-flow">
        <div className="container">
          <SectionHeader align="center" kicker="So läuft's bei uns wirklich" title={<>Beratung. Planung. <span className="grad">Umsetzung.</span></>} lead="Ehrlich, bodenständig und hochwertig – vom ersten Gespräch bis zur fertigen Küche." />
          <div className="karr-flowrow">
            {FLOW3.map((s, i) => (
              <Reveal key={s.title} className="karr-flowcard" delay={(i % 3) * 0.08}>
                <span className="karr-flowcard__img" style={{ backgroundImage: `url(${s.img})` }} aria-hidden="true" />
                <span className="karr-flowcard__scrim" aria-hidden="true" />
                <span className="karr-flowcard__n">{s.n}</span>
                <span className="karr-flowcard__body">
                  <span className="karr-flowcard__title">{s.title}</span>
                  <span className="karr-flowcard__text">{s.text}</span>
                </span>
              </Reveal>
            ))}
          </div>
          <KiHinweis
            className="vnc__ainote"
            variant="section-notice"
            text="Alle abgebildeten Personen sind KI-generierte Symbolbilder – keine realen Mitarbeitenden oder Kund:innen."
          />
        </div>
      </section>

      {/* 3 — KARRIERE-DECK (Intro oben, Bühne darunter) */}
      <section className="section section--light karr-deck-sec" id="rollen">
        <div className="container">
          <Reveal className="karr-deck2__intro">
            <span className="kicker">Karriere bei VIDEKO</span>
            <h2 className="lintro__title">Finde deinen Platz. <span className="grad">Nicht irgendeinen.</span></h2>
            <p className="lintro__text">Bei VIDEKO suchen wir Menschen, die mitdenken, anpacken und Lust haben, gemeinsam etwas Besonderes zu schaffen.</p>
            <p className="karr-deck__wink">Auch „keine Ahnung, aber Bock" ist ein ziemlich guter Start.</p>
            <div className="karr-deck2__values">
              {VALUES.map((v) => (
                <div key={v.title} className="karr-value2">
                  <span className="karr-value2__ic"><v.icon size={18} strokeWidth={1.7} /></span>
                  <span className="karr-value2__t">{v.title}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="cdeck2" ref={deckNav.ref} onTouchStart={deckNav.onTouchStart} onTouchEnd={deckNav.onTouchEnd} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="cdeck2__stage" style={{ touchAction: 'pan-y' }}>
            {DECK.map((r, i) => {
              const d = deckRel(i)
              const isActive = d === 0
              const show = Math.abs(d) <= 2
              const off = d === 0 ? 0 : d > 0 ? 540 + (d - 1) * 230 : -540 + (d + 1) * 230
              const style = {
                transform: `translate(-50%, -50%) translateX(${off}px) scale(${isActive ? 1 : Math.abs(d) === 1 ? 0.8 : 0.62})`,
                opacity: show ? (isActive ? 1 : Math.abs(d) === 1 ? 0.9 : 0.5) : 0,
                zIndex: isActive ? 20 : 10 - Math.abs(d),
                pointerEvents: show ? 'auto' : 'none',
              }
              return (
                <div key={r.name} className={`cdeck2__card ${isActive ? 'is-active' : ''}`} style={style} aria-hidden={!show}>
                  {isActive ? (
                    <>
                      <div className="cdeck2__photo"><img src={r.img} alt={r.name} loading="lazy" /></div>
                      <div className="cdeck2__detail">
                        <span className="cdeck2__n">{r.n}</span>
                        <h3 className="cdeck2__title">{r.name}</h3>
                        <ul className="cdeck2__list">
                          <li><span>Worum es geht</span>{r.panel.about}</li>
                          <li><span>Was du ungefähr machst</span>{r.panel.tasks}</li>
                          <li><span>Was du mitbringen solltest</span>{r.panel.req}</li>
                          <li><span>Was du bei uns bekommst</span>{r.panel.get}</li>
                        </ul>
                        <CTAButton href="#bewerbung">Jetzt initiativ bewerben</CTAButton>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="cdeck2__preview" onClick={() => deckGo(i)} tabIndex={show ? 0 : -1} aria-label={`Zu ${r.name} wechseln`}>
                      <img src={r.img} alt={r.name} loading="lazy" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="cdeck__nav">
            <button type="button" className="cdeck__arrow" onClick={deckPrev} aria-label="Vorherige Rolle"><ChevronLeft size={20} strokeWidth={2} /></button>
            <div className="cdeck__dots">
              {DECK.map((r, i) => (
                <button key={r.name} type="button" className={`cdeck__dot ${activeJob === i ? 'is-active' : ''}`} onClick={() => deckGo(i)} aria-label={`Rolle ${r.n}`} />
              ))}
            </div>
            <button type="button" className="cdeck__arrow" onClick={deckNext} aria-label="Nächste Rolle"><ChevronRight size={20} strokeWidth={2} /></button>
            <span className="cdeck__hint">Automatisch wechselnde Rollen</span>
          </div>
        </div>

        <div className="container">
          <KiHinweis
            className="vnc__ainote"
            variant="section-notice"
            text="Die abgebildeten Personen in den Rollenkarten sind KI-generierte Symbolbilder – keine realen Mitarbeitenden."
          />
        </div>

        <div className="container karr-deckstats">
          <span className="karr-deckstats__label">VIDEKO in Zahlen</span>
          <div className="karr-deckstats__row">
            {STATS_DECK.map((s) => (
              <div key={s.l} className="karr-deckstat"><span className="karr-deckstat__v">{s.v}</span><span className="karr-deckstat__l">{s.l}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* 3b — JOB-STAGE CTA + Microcopy */}
      <section className="section karr-jobcta">
        <div className="container">
          <div className="karr-microline">
            <span><Coffee size={15} strokeWidth={1.8} /> Keine Sorge, wir haben Kaffee.</span>
            <span><Smile size={15} strokeWidth={1.8} /> Wir nehmen uns selbst nicht zu ernst – unsere Arbeit schon.</span>
            <span><Heart size={15} strokeWidth={1.8} /> Wir lieben Küchen. Und gute Laune im Team.</span>
          </div>
          <div className="jobstage__cta">
            <h3 className="jobstage__cta-title">Nicht sicher, wo du reinpasst?</h3>
            <p className="jobstage__cta-text">Dann bewirb dich trotzdem. Ob Vollzeit, Teilzeit, Minijob oder Quereinstieg – erzähl uns einfach, was du kannst und worauf du Lust hast. Den Rest finden wir gemeinsam heraus. Wir finden schon was für dich. Kein Bewerbungstheater, kein Lebenslauf-Bingo.</p>
            <CTAButton href="#bewerbung">Initiativ bewerben</CTAButton>
          </div>
          {/* Karriere war bis SEO-Phase 2 eine Sackgasse: viel Inhalt, aber kein
              einziger Link zurück in die Seite. Wer sich hier bewirbt, will in
              aller Regel genau diese zwei Dinge wissen. */}
          <p className="aaeh-note aaeh-note--center">
            Wer wir sind und wofür wir stehen, steht unter{' '}
            <TextLink href="/ueber-uns">Über uns</TextLink>. Wo gearbeitet wird, zeigt unser{' '}
            <TextLink href="/studio">Küchenstudio in Würzburg</TextLink>.
          </p>
        </div>
      </section>

      {/* 5 — PASST DU ZU UNS */}
      <section className="section section--light karr-fit">
        <div className="container">
          <SectionHeader align="center" kicker="Ehrlich gesagt" title={<>Passt das <span className="grad">zwischen uns?</span></>} />
          <ComparisonTable
            left={{ title: 'Du passt zu VIDEKO, wenn …', items: ['du Bock auf echte Qualität hast', 'du gern im Team anpackst', 'du ehrlich mit Menschen umgehst', 'du mitdenkst statt nur abarbeitest', 'du Lust hast, was aufzubauen'] }}
            right={{ title: 'Eher nicht, wenn …', items: ['du nur Dienst nach Vorschrift willst', 'dir Qualität egal ist', 'du Verkaufsdruck cool findest', 'du dich vor Neuem drückst', 'Teamwork nicht dein Ding ist'] }}
          />
        </div>
      </section>

      {/* 6 — BEWERBUNG IN 3 MINUTEN */}
      <section className="section karr-apply" id="bewerbung">
        <div className="container">
          <SectionHeader align="center" kicker="Bewerbung in 3 Minuten" title={<>Keine perfekte Bewerbung <span className="grad">nötig.</span></>} lead="Schick uns einfach, wer du bist und was du suchst. Wir urteilen nicht über Lücken im Lebenslauf." />
          <div className="karr-steps">
            {STEPS3.map((s) => (
              <Reveal key={s.n} className="karr-step">
                <span className="karr-step__n">{s.n}</span>
                <span className="karr-step__title">{s.title}</span>
                <span className="karr-step__text">{s.text}</span>
              </Reveal>
            ))}
          </div>
          <div className="kapply">
            <Reveal className="kapply__copy">
              <span className="kicker">Komm ins Team</span>
              <h2 className="lintro__title">Sag einfach <span className="grad">Hallo.</span></h2>
              <p className="lintro__text">Ein Satz reicht. Roman geht auch. Persönlichkeit zählt bei uns mehr als ein makelloser Lebenslauf.</p>
              <ul className="kapply__contact">
                <li><Mail size={17} strokeWidth={1.7} /> <a href="mailto:info@videko-kuechen.de">info@videko-kuechen.de</a></li>
                <li><MapPin size={17} strokeWidth={1.7} /> Hertzstraße 4, 97076 Würzburg <a className="kapply__route" href="https://www.google.com/maps/search/?api=1&query=Hertzstra%C3%9Fe%204%2C%2097076%20W%C3%BCrzburg" target="_blank" rel="noopener noreferrer">Route öffnen</a></li>
                <li><Headset size={17} strokeWidth={1.7} /> <a href="tel:+491605545818">0160 5545818</a></li>
              </ul>
              <div className="kapply__pic"><img src={imgFormular} alt="" loading="lazy" /></div>
            </Reveal>

            <Reveal className="kapply__formwrap" delay={0.08}>
              <form className="contact__form" onSubmit={handleApply}>
                <div className="contact__row">
                  <label className="field"><span>Name</span><input type="text" name="name" required placeholder="Dein Name" /></label>
                  <label className="field"><span>E-Mail</span><input type="email" name="email" required placeholder="name@beispiel.de" /></label>
                </div>
                <div className="contact__row">
                  <label className="field"><span>Telefon</span><input type="tel" name="telefon" required placeholder="0160 1234567" /></label>
                  <label className="field"><span>Wunschbereich</span>
                    <select name="bereich" defaultValue="">
                      <option value="" disabled>Bitte wählen</option>
                      {BEREICHE.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                </div>
                <label className="field"><span>Nachricht</span><textarea name="nachricht" rows={4} placeholder="Erzähl uns kurz, wer du bist – ein Satz reicht." /></label>
                <label className="sfupload">
                  <Upload size={18} strokeWidth={1.7} />
                  <span>Lebenslauf / Unterlagen hochladen</span>
                  <input type="file" multiple hidden />
                </label>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
                <button className="btn btn--primary btn--lg" type="submit" disabled={sending}>
                  <span className="btn__shimmer" aria-hidden="true" />
                  <span className="btn__label">{sending ? 'Wird gesendet …' : 'Jetzt initiativ bewerben'}</span>
                </button>
                {sent && <p className="contact__ok" role="status">Danke! Deine Bewerbung ist da – wir melden uns persönlich. Kein Bot, kein Küchen-Orakel. 🙌</p>}
                {error && <p className="contact__err" role="alert">Hoppla, das hat nicht geklappt. Versuch's bitte nochmal – oder schreib direkt an info@videko-kuechen.de.</p>}
              </form>
            </Reveal>
          </div>
        </div>
      </section>

    </div>
  )
}
