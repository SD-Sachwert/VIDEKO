import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Store, PencilRuler, Hammer, Ruler, Headset, MessageSquare, Megaphone,
  Sparkles, Rocket, Mail, ArrowUpRight, ArrowRight, MapPin, Upload,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ComparisonTable from '../components/ComparisonTable.jsx'
import ProcessTimeline from '../components/ProcessTimeline.jsx'

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

const JOBS = [
  { title: 'Küchenverkäufer', icon: Store, image: jVerkauf, text: 'Du liebst Menschen und gute Küchen? Dann passt das.' },
  { title: 'Küchenplaner', icon: PencilRuler, image: jPlanung, text: 'Aus Ideen wird ein Plan, der wirklich sitzt.' },
  { title: 'Monteure', icon: Hammer, image: jMontage, text: 'Du baust auf, was wir planen – sauber und mit Stolz.' },
  { title: 'Aufmaß / Projektkoordination', icon: Ruler, image: jMontage, text: 'Millimeter, Termine, Überblick – genau dein Ding.' },
  { title: 'Empfang / Sachbearbeitung', icon: Headset, image: jEmpfang, text: 'Erste Stimme, gute Laune, alles im Griff.' },
  { title: 'Reklamationsservice', icon: MessageSquare, image: jEmpfang, text: 'Du löst Probleme, bevor sie welche werden.' },
  { title: 'Marketing / Social Media', icon: Megaphone, image: jMarketing, text: 'Du machst VIDEKO sichtbar – und richtig gut.' },
  { title: 'Reinigung / Studio-Service', icon: Sparkles, image: jReinigung, text: 'Du hältst das Studio jeden Tag in Top-Form.' },
  { title: 'Quereinsteiger', icon: Rocket, image: jReinigung, text: 'Kein klassischer Lebenslauf? Zeig uns, was du draufhast.' },
  { title: 'Initiativbewerbung', icon: Mail, image: jVerkauf, text: 'Deine Rolle ist nicht dabei? Schreib uns trotzdem.' },
]

const WHY = [
  { title: 'Kein Möbelhaus-Zirkus', text: 'Keine Rabattschlachten, kein Drücker-Vibe. Echte Arbeit.', image: imgProzess },
  { title: 'Studio statt Masse', text: 'Qualität vor Stückzahl. Hier zählt jedes Projekt.', image: imgFormular },
  { title: 'Aufbau statt Stillstand', text: 'Wir wachsen – und du wächst mit. Viel Raum für dich.', image: imgCta },
  { title: 'Gute Arbeit darf gut aussehen', text: 'Premium-Umfeld, das zu deinem Anspruch passt.', image: imgProzess },
]

const PROCESS = [
  { title: 'Melden', text: 'Kurze Nachricht reicht – ganz unkompliziert.' },
  { title: 'Kennenlernen', text: 'Wir quatschen, ob die Chemie stimmt.' },
  { title: 'Studio erleben', text: 'Komm vorbei und schau, wie wir ticken.' },
  { title: 'Start planen', text: 'Passt? Dann legen wir gemeinsam los.' },
]

const BEREICHE = JOBS.map((j) => j.title)

export default function Karriere() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])
  const [sent, setSent] = useState(false)

  return (
    <div className="leist-page karr-page">
      {/* HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Karriere</span>
            <h1 className="pagehero__title">Menschen, die Küchen<br /><span className="grad">anders denken.</span></h1>
            <p className="pagehero__lead">
              Wir bauen kein Möbelhaus. Wir bauen ein Studio, in dem Design,
              Handwerk und Persönlichkeit zusammenkommen – jeden Tag.
            </p>
            <div className="pagehero__actions">
              <CTAButton href="#rollen">Offene Rollen ansehen</CTAButton>
              <a className="leist-hero__link" href="#bewerbung">Initiativ bewerben <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* OFFENE ROLLEN */}
      <section className="section karr-roles" id="rollen">
        <div className="container">
          <SectionHeader
            kicker="Offene Rollen"
            title={<>Werde Teil von <span className="grad">VIDEKO.</span></>}
            lead="Standort Würzburg. Such dir deinen Bereich – oder bewirb dich einfach initiativ."
          />
          <div className="lservice-grid karr-jobgrid">
            {JOBS.map((j, i) => (
              <Reveal key={j.title} delay={(i % 3) * 0.06}>
                <a className="lscard jobcard" href="#bewerbung">
                  <span className="lscard__img" style={{ backgroundImage: `url(${j.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="jobcard__icon" aria-hidden="true"><j.icon size={18} strokeWidth={1.7} /></span>
                  <span className="lscard__body">
                    <span className="jobcard__meta"><MapPin size={12} strokeWidth={1.9} /> Würzburg</span>
                    <span className="lscard__title">{j.title}</span>
                    <span className="lscard__text">{j.text}</span>
                    <span className="jobcard__cta">Mehr erfahren <ArrowUpRight size={15} strokeWidth={1.9} /></span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WARUM VIDEKO (dark) */}
      <section className="section section--dark karr-why">
        <div className="container">
          <SectionHeader tone="light" kicker="Warum VIDEKO" title={<>Arbeiten, das mehr ist <span className="grad">als ein Job.</span></>} />
          <div className="karr-grid4">
            {WHY.map((wcard, i) => (
              <Reveal key={wcard.title} delay={(i % 4) * 0.06}>
                <article className="lscard karr-whycard">
                  <span className="lscard__img" style={{ backgroundImage: `url(${wcard.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="lscard__body">
                    <span className="lscard__title">{wcard.title}</span>
                    <span className="lscard__text">{wcard.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BEWERBUNGSPROZESS */}
      <section className="section karr-prozess">
        <div className="container">
          <SectionHeader align="center" kicker="So läuft's" title={<>Einfach. Persönlich. <span className="grad">Schnell.</span></>} />
          <ProcessTimeline steps={PROCESS} />
          <Reveal className="karr-prozess__media">
            <div className="lintro__frame"><img src={imgProzess} alt="VIDEKO Team im Studio" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
          </Reveal>
        </div>
      </section>

      {/* PASST ZU UNS */}
      <section className="section karr-fit">
        <div className="container">
          <SectionHeader align="center" kicker="Ehrlich gesagt" title="Passt das zwischen uns?" />
          <ComparisonTable
            left={{ title: 'Du passt zu VIDEKO, wenn …', items: ['du Bock auf echte Qualität hast', 'du gern im Team anpackst', 'du ehrlich mit Menschen umgehst', 'du mitdenkst statt nur abarbeitest', 'du Lust hast, was aufzubauen'] }}
            right={{ title: 'Eher nicht, wenn …', items: ['du nur Dienst nach Vorschrift willst', 'dir Qualität egal ist', 'du Verkaufsdruck cool findest', 'du dich vor Neuem drückst', 'Teamwork nicht dein Ding ist'] }}
          />
        </div>
      </section>

      {/* BEWERBUNGSBEREICH */}
      <section className="section karr-apply" id="bewerbung">
        <div className="container">
          <div className="kapply">
            <Reveal className="kapply__copy">
              <span className="kicker">Komm ins Team</span>
              <h2 className="lintro__title">Keine perfekte<br /><span className="grad">Bewerbung nötig.</span></h2>
              <p className="lintro__text">
                Schick uns einfach, wer du bist und was du suchst. Lebenslauf ohne
                Lücken? Brauchen wir nicht. Persönlichkeit? Umso mehr.
              </p>
              <ul className="kapply__contact">
                <li><Mail size={17} strokeWidth={1.7} /> <a href="mailto:info@videko-kuechen.de">info@videko-kuechen.de</a></li>
                <li><MapPin size={17} strokeWidth={1.7} /> Würzburg</li>
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
                <label className="field"><span>Nachricht</span><textarea rows={4} placeholder="Erzähl uns kurz, wer du bist …" /></label>
                <label className="sfupload">
                  <Upload size={18} strokeWidth={1.7} />
                  <span>Lebenslauf / Unterlagen hochladen <em>(optional)</em></span>
                  <input type="file" multiple hidden />
                </label>
                {/* TODO: Versand anbinden (z. B. Formspree / Resend / eigenes API) */}
                <button className="btn btn--primary btn--lg" type="submit">
                  <span className="btn__shimmer" aria-hidden="true" />
                  <span className="btn__label">Jetzt initiativ bewerben</span>
                </button>
                {sent && <p className="contact__ok" role="status">Danke! Deine Bewerbung ist da – wir melden uns persönlich.<br /><em>(Demo-Formular – Versand wird später angebunden.)</em></p>}
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ABSCHLUSS-CTA (dark, image) */}
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
