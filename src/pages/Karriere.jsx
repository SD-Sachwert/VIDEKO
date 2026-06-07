import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Store, PencilRuler, Hammer, Ruler, Headset, MessageSquare, Megaphone,
  Sparkles, Rocket, Mail, ArrowUpRight, ArrowRight, MapPin, Upload, Check, Coffee,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ComparisonTable from '../components/ComparisonTable.jsx'

import heroImg from '../assets/images/karriere/01_hero_team_beratung.png'
import jVerkauf from '../assets/images/karriere/02_job_kuechenverkauf_beratung.png'
import jPlanung from '../assets/images/karriere/03_job_kuechenplanung_planungstisch.png'
import jMontage from '../assets/images/karriere/04_job_monteure_aufmass.png'
import jEmpfang from '../assets/images/karriere/05_job_empfang_service.png'
import jMarketing from '../assets/images/karriere/06_job_marketing_social_media.png'
import jReinigung from '../assets/images/karriere/07_job_reinigung_studioservice.png'
import imgProzess from '../assets/images/karriere/08_bewerbungsprozess_teammeeting.png'
import imgFormular from '../assets/images/karriere/09_bewerbung_interior_formular.png'
import imgCta from '../assets/images/karriere/10_cta_footer_premium_showroom.png'

const FILTERS = [
  { key: 'alle', label: 'Alle zeigen' },
  { key: 'verkaufen', label: 'Ich kann verkaufen' },
  { key: 'planen', label: 'Ich kann planen' },
  { key: 'anpacken', label: 'Ich kann anpacken' },
  { key: 'organisieren', label: 'Ich kann organisieren' },
  { key: 'social', label: 'Ich kann Social Media' },
  { key: 'offen', label: 'Ich weiß es noch nicht' },
]

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

const EGGS = [
  'Keine Sorge, wir haben Kaffee.',
  'Excel darfst du mögen. Musst du aber nicht heiraten.',
  'Rabattgeschrei? Nicht bei uns.',
  'Gerade Wände wären schön. Sind sie nie.',
  'Wenn du „passt schon" sagst, meinen wir hoffentlich nicht dasselbe.',
]

const TICKEN = [
  'Ehrlich statt Verkaufsdruck',
  'Mitdenken statt mitlaufen',
  'Kurze Wege statt Konzern-Pingpong',
  'Qualität vor Stückzahl',
  'Aufbauphase mit echtem Gestaltungsspielraum',
  'Ein Team, kein Zuständigkeits-Tetris',
]

const STEPS3 = [
  { n: '1', title: 'Kurz melden', text: 'Ein paar Zeilen reichen. Lebenslauf? Gern, muss aber nicht perfekt sein.' },
  { n: '2', title: 'Wir melden uns', text: 'Persönlich, ehrlich, kein Bot – wir schauen, ob die Chemie passt.' },
  { n: '3', title: 'Studio erleben', text: 'Komm vorbei, schau wie wir ticken. Passt? Dann legen wir los.' },
]

const BEREICHE = ROLES.map((r) => r.title).concat('Initiativbewerbung')

export default function Karriere() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])
  const [sent, setSent] = useState(false)
  const [cat, setCat] = useState('alle')

  const roles = cat === 'alle' ? ROLES : ROLES.filter((r) => r.cat === cat)

  return (
    <div className="leist-page karr-page">
      {/* 1 — HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
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
              <CTAButton href="#rollen">Rollen entdecken</CTAButton>
              <a className="leist-hero__link" href="#bewerbung">Ich hab keine Ahnung, aber Bock <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2 — WARUM ANDERS (kurzblock) */}
      <section className="section karr-intro">
        <div className="container">
          <SectionHeader align="center" kicker="Warum VIDEKO anders ist" title={<>Wir bauen kein Möbelhaus. <span className="grad">Wir bauen ein Team.</span></>} lead="Keine Rabattschlachten, kein Drücker-Vibe, kein Konzern-Dschungel. Sondern echte Arbeit, kurze Wege und Menschen, die ihren Job können." />
        </div>
      </section>

      {/* 3 — ROLLENWELT (interaktiv) */}
      <section className="section section--light karr-rollen" id="rollen">
        <div className="container">
          <SectionHeader kicker="Rollenwelt" title={<>Such dir, <span className="grad">was zu dir passt.</span></>} lead="Filtere nach dem, was du kannst – oder klick dich einfach durch." />
          <div className="karr-filters">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className={`karr-chip ${cat === f.key ? 'is-active' : ''}`} onClick={() => setCat(f.key)}>{f.label}</button>
            ))}
          </div>
          <div className="lservice-grid karr-jobgrid">
            <AnimatePresence mode="popLayout">
              {roles.map((j) => (
                <motion.a key={j.title} className="lscard jobcard" href="#bewerbung"
                  layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                  <span className="lscard__img" style={{ backgroundImage: `url(${j.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="jobcard__icon" aria-hidden="true"><j.icon size={18} strokeWidth={1.7} /></span>
                  <span className="lscard__body">
                    <span className="jobcard__meta"><MapPin size={12} strokeWidth={1.9} /> Würzburg</span>
                    <span className="lscard__title">{j.title}</span>
                    <span className="lscard__text">{j.text}</span>
                    <span className="jobcard__cta">Bewerben <ArrowUpRight size={15} strokeWidth={1.9} /></span>
                  </span>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
          <div className="karr-initiativ">
            <span>Nichts Passendes dabei? <strong>Auch „keine Ahnung, aber Bock" ist ein gültiger Startpunkt.</strong></span>
            <CTAButton href="#bewerbung">Initiativ bewerben</CTAButton>
          </div>
          <div className="karr-egg" aria-hidden="true">
            {EGGS.map((e) => <span key={e} className="karr-egg__item"><Coffee size={12} strokeWidth={1.9} /> {e}</span>)}
          </div>
        </div>
      </section>

      {/* 4 — SO TICKEN WIR */}
      <section className="section karr-ticken">
        <div className="container">
          <div className="karr-ticken__grid">
            <Reveal className="karr-ticken__copy">
              <span className="kicker">So ticken wir</span>
              <h2 className="lintro__title">Klartext statt <span className="grad">Küchen-Geschwafel.</span></h2>
              <ul className="lstances">
                {TICKEN.map((t) => <li key={t}><Check size={16} strokeWidth={2.4} /> {t}</li>)}
              </ul>
            </Reveal>
            <Reveal className="karr-quote" delay={0.08}>
              <p>„Wir planen nicht für den Prospekt.<br /><span className="grad">Wir planen für deinen Alltag.“</span></p>
              <span className="karr-quote__by">— das ganze VIDEKO-Team</span>
            </Reveal>
          </div>
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
                <li><MapPin size={17} strokeWidth={1.7} /> Würzburg, Hertzstraße 4</li>
                <li><Headset size={17} strokeWidth={1.7} /> <a href="tel:+491605545818">0160 5545818</a></li>
              </ul>
              <div className="kapply__pic"><img src={imgFormular} alt="" loading="lazy" /></div>
            </Reveal>

            <Reveal className="kapply__formwrap" delay={0.08}>
              <form className="contact__form" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
                <div className="contact__row">
                  <label className="field"><span>Name</span><input type="text" required placeholder="Dein Name" /></label>
                  <label className="field"><span>E-Mail</span><input type="email" required placeholder="name@beispiel.de" /></label>
                </div>
                <div className="contact__row">
                  <label className="field"><span>Telefon</span><input type="tel" placeholder="Optional" /></label>
                  <label className="field"><span>Bereich</span>
                    <select defaultValue="">
                      <option value="" disabled>Bitte wählen</option>
                      {BEREICHE.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </label>
                </div>
                <label className="field"><span>Nachricht</span><textarea rows={4} placeholder="Erzähl uns kurz, wer du bist – ein Satz reicht." /></label>
                <label className="sfupload">
                  <Upload size={18} strokeWidth={1.7} />
                  <span>Lebenslauf / Unterlagen hochladen <em>(optional)</em></span>
                  <input type="file" multiple hidden />
                </label>
                <button className="btn btn--primary btn--lg" type="submit">
                  <span className="btn__shimmer" aria-hidden="true" />
                  <span className="btn__label">Jetzt initiativ bewerben</span>
                </button>
                {sent && <p className="contact__ok" role="status">Danke! Deine Bewerbung ist da – wir melden uns persönlich. Kein Bot, kein Küchen-Orakel.<br /><em>(Demo-Formular – Versand wird später angebunden.)</em></p>}
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7 — ABSCHLUSS-CTA (dark) */}
      <section className="leist-final karr-final">
        <div className="leist-final__media" aria-hidden="true">
          <img src={imgCta} alt="" />
          <div className="leist-final__veil" />
        </div>
        <div className="container leist-final__inner">
          <Reveal>
            <span className="kicker kicker--gold">Werde Teil von VIDEKO</span>
            <h2 className="leist-final__title">Lust, etwas Besonderes<br /><span className="grad">mit aufzubauen?</span></h2>
            <p className="leist-final__text">Wir suchen keine Lebensläufe. Wir suchen Menschen. Vielleicht genau dich.</p>
            <div className="leist-final__actions">
              <CTAButton href="#bewerbung">Jetzt bewerben</CTAButton>
              <CTAButton to="/beratung" variant="dark">Beratung anfragen</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
