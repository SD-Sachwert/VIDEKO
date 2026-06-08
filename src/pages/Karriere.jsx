import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Store, PencilRuler, Hammer, Ruler, Headset, MessageSquare, Megaphone,
  Sparkles, Rocket, Mail, ArrowRight, MapPin, Upload, Check,
  Gem, Smile, ShieldCheck, Zap, Coffee, Heart,
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
import jc01 from '../assets/images/karriere/karten/01_beratung_verkauf.png'
import jc02 from '../assets/images/karriere/karten/02_planung_technik.png'
import jc03 from '../assets/images/karriere/karten/03_montage_handwerk.png'
import jc04 from '../assets/images/karriere/karten/04_empfang_organisation.png'
import jc05 from '../assets/images/karriere/karten/05_marketing_social_media.png'
import jc06 from '../assets/images/karriere/karten/06_quereinsteiger.png'

const STAGE = [
  { n: '01', name: 'Beratung & Verkauf', img: jc01 },
  { n: '02', name: 'Planung & Technik', img: jc02 },
  { n: '03', name: 'Montage & Handwerk', img: jc03 },
  { n: '04', name: 'Empfang & Organisation', img: jc04 },
  { n: '05', name: 'Marketing & Social Media', img: jc05 },
  { n: '06', name: 'Quereinsteiger', img: jc06 },
]
import imgProzess from '../assets/images/karriere/08_bewerbungsprozess_teammeeting.png'
import imgFormular from '../assets/images/karriere/09_bewerbung_interior_formular.png'
import imgCta from '../assets/images/karriere/10_cta_footer_premium_showroom.png'

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
  const [activeJob, setActiveJob] = useState(0)
  const stageRef = useRef(null)
  const { scrollYProgress: jobProg } = useScroll({ target: stageRef, offset: ['start start', 'end end'] })

  // scroll-driven role switching (desktop only)
  useEffect(() => {
    return jobProg.on('change', (v) => {
      if (window.innerWidth < 900) return
      setActiveJob(Math.min(STAGE.length - 1, Math.max(0, Math.floor(v * STAGE.length))))
    })
  }, [jobProg])

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

      {/* 2 — WARUM VIDEKO (hell, 4 Karten) */}
      <section className="section karr-why2">
        <div className="container">
          <div className="karr-why2__grid">
            <Reveal className="karr-why2__copy">
              <span className="kicker">Warum VIDEKO</span>
              <h2 className="lintro__title">Wir bauen kein Möbelhaus. <span className="grad">Wir bauen ein Team.</span></h2>
              <p className="lintro__text">Keine Rabattschlachten, kein Drücker-Vibe, kein Konzern-Dschungel. Sondern echte Arbeit, kurze Wege und Menschen, die ihren Job können.</p>
            </Reveal>
            <div className="karr-why2__cards">
              {WHY4.map((wc, i) => (
                <Reveal key={wc.title} className="karr-whycard2" delay={(i % 2) * 0.06}>
                  <span className="karr-whycard2__ic"><wc.icon size={20} strokeWidth={1.6} /></span>
                  <span className="karr-whycard2__title">{wc.title}</span>
                  <span className="karr-whycard2__text">{wc.text}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

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
        </div>
      </section>

      {/* 3 — JOB-STAGE (scroll-driven, große Karte) */}
      <section className="karr-jobstage-scroll" id="rollen" ref={stageRef}>
        <div className="karr-jobstage-sticky">
          <div className="container">
            <div className="jobstage">
              <div className="jobstage__intro">
                <span className="kicker">Karriere bei VIDEKO</span>
                <h2 className="lintro__title">Finde deinen Platz. <span className="grad">Nicht irgendeinen.</span></h2>
                <p className="lintro__text">Bei VIDEKO zählt nicht, dass du schon alles kannst – sondern dass du mitdenkst, anpackst und Lust auf etwas Besonderes hast.</p>
                <p className="jobstage__wink">Auch „keine Ahnung, aber Bock" ist ein ziemlich guter Start.</p>
                <div className="jobstage__nav">
                  {STAGE.map((r, i) => (
                    <button key={r.name} type="button" className={`jobstage__navitem ${activeJob === i ? 'is-active' : ''}`} onClick={() => setActiveJob(i)}>
                      <span className="jobstage__navn">{r.n}</span>
                      <span className="jobstage__navlabel">{r.name}</span>
                    </button>
                  ))}
                </div>
                <span className="jobstage__hint" aria-hidden="true">Scroll dich durch die Rollen ↓</span>
              </div>
              <div className="jobstage__stage">
                <AnimatePresence mode="wait">
                  <motion.a key={activeJob} href="#bewerbung" className="jobstage__card" aria-label={`${STAGE[activeJob].name} – jetzt initiativ bewerben`}
                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
                    <img src={STAGE[activeJob].img} alt={STAGE[activeJob].name} />
                  </motion.a>
                </AnimatePresence>
              </div>
            </div>
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
            <p className="jobstage__cta-text">Dann bewirb dich trotzdem. Wir sortieren gemeinsam, ob und wo es passt. Kein Bewerbungstheater, kein Lebenslauf-Bingo.</p>
            <CTAButton href="#bewerbung">Initiativ bewerben</CTAButton>
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
