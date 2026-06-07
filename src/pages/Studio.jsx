import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import ProcessTimeline from '../components/ProcessTimeline.jsx'

import heroImg from '../assets/images/studio/bilder/01_hero_studio_showroom.png'
import introImg from '../assets/images/studio/bilder/02_intro_showroom_hell.png'
import cAnkommen from '../assets/images/studio/bilder/03_studio_card_ankommen_lounge.png'
import cWelten from '../assets/images/studio/bilder/04_studio_card_kuechenwelten_entdecken.png'
import cMaterial from '../assets/images/studio/bilder/05_studio_card_materialien_fuehlen.png'
import cPlanung from '../assets/images/studio/bilder/06_studio_card_planung_erleben.png'
import cBeratung from '../assets/images/studio/bilder/07_studio_card_beratung_vertiefen.png'
import splitImg from '../assets/images/studio/bilder/08_split_section_showroom_gross.png'
import teamImg from '../assets/images/studio/bilder/09_team_beratung_auf_augenhoehe.png'
import ctaImg from '../assets/images/studio/bilder/10_final_cta_studio_banner.png'
import umbauVideo from '../assets/images/studio/bilder/Umbau.mp4'

const HERO_BADGES = ['Persönliche Beratung', 'Hochwertige Materialien', 'Planung auf höchstem Niveau']

const INTRO_USP = [
  'Individuelle Beratung', 'Planung mit Feingefühl', 'Realistische Planung',
  'Premium Materialien', 'Alles aus einer Hand',
]

const CARDS = [
  { n: '01', title: 'Ankommen', text: 'Erstmal ankommen, durchatmen, wohlfühlen. Kein Druck, kein Geschwätz.', image: cAnkommen },
  { n: '02', title: 'Küchenwelten entdecken', text: 'Stöbern, vergleichen, inspirieren lassen – in echten Küchenwelten.', image: cWelten },
  { n: '03', title: 'Materialien fühlen', text: 'Oberflächen anfassen, Qualität spüren. Bilder lügen, Material nicht.', image: cMaterial },
  { n: '04', title: 'Planung erleben', text: 'Deine Küche in 3D – realistisch, bevor irgendwas gebaut wird.', image: cPlanung },
  { n: '05', title: 'Beratung vertiefen', text: 'In Ruhe Fragen klären, ehrlich und auf Augenhöhe.', image: cBeratung },
  { n: '06', title: 'Angebot & Feinplanung', text: 'Transparent, fair und bis ins Detail durchdacht.', image: cPlanung },
]

const STANCE = ['Diskret & respektvoll', 'Ehrlich & transparent', 'Erfahren & spezialisiert']
const TEAM_USP = ['Ehrlich & transparent', 'Persönlich & nah', 'Kompetent & erfahren']

const PROCESS = [
  { title: 'Erstgespräch', text: 'Wir lernen dich und dein Projekt kennen.' },
  { title: 'Idee & Konzept', text: 'Aus Wünschen wird eine klare Richtung.' },
  { title: 'Planung & Visualisierung', text: 'Du siehst deine Küche in 3D.' },
  { title: 'Angebot & Abstimmung', text: 'Transparent, fair und ohne Kleingedrucktes.' },
  { title: 'Umsetzung & Betreuung', text: 'Wir bleiben dran – bis alles sitzt.' },
]

const FINAL_HL = ['Individuelle Beratung', 'Premium Materialien', 'Planung auf höchstem Niveau']

export default function Studio() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  return (
    <div className="leist-page studio-page">
      {/* HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Studio Würzburg</span>
            <h1 className="pagehero__title">Küchen erleben.<br /><span className="grad">Nicht nur ansehen.</span></h1>
            <p className="pagehero__lead">
              Unser Studio in Würzburg ist mehr als ein Ausstellungsraum. Hier werden
              Materialien, Planung und Atmosphäre spürbar – persönlich und auf
              höchstem Niveau.
            </p>
            <div className="pagehero__actions">
              <CTAButton to="/beratung">Termin vereinbaren</CTAButton>
              <a className="leist-hero__link" href="#erlebnis">Studio entdecken <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
            <div className="hero-badges">
              {HERO_BADGES.map((b) => <span className="hero-badge" key={b}><Check size={13} strokeWidth={2.4} /> {b}</span>)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* MEHR ALS EIN KÜCHENSTUDIO */}
      <section className="section studio-intro">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__media">
              <div className="lintro__frame"><img src={introImg} alt="Helles VIDEKO Studio" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
            <Reveal className="lintro__copy" delay={0.08}>
              <span className="kicker">Mehr als ein Küchenstudio</span>
              <h2 className="lintro__title">Wir verkaufen nicht einfach Küchen.<br /><span className="grad">Wir planen dein Zuhause mit dir.</span></h2>
              <p className="lintro__text">
                Bei uns geht's nicht um schnelle Abschlüsse, sondern um den Raum, in
                dem du jeden Tag lebst. In Ruhe, ehrlich und mit echtem Anspruch.
              </p>
              <ul className="lstances lstances--2col">
                {INTRO_USP.map((u) => <li key={u}><Check size={16} strokeWidth={2.4} /> {u}</li>)}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* VIDEO SHOWCASE – Studio im Aufbau */}
      <section className="studio-video">
        <div className="studio-video__media" aria-hidden="true">
          <video
            className="studio-video__vid"
            autoPlay
            muted
            loop
            playsInline
            poster={introImg}
          >
            <source src={umbauVideo} type="video/mp4" />
          </video>
          <div className="studio-video__veil" />
        </div>
        <div className="container studio-video__inner">
          <Reveal>
            <span className="kicker kicker--gold">Studio im Aufbau</span>
            <h2 className="studio-video__title">Hier entsteht<br /><span className="grad">etwas Besonderes.</span></h2>
            <p className="studio-video__text">
              Schau uns beim Aufbau über die Schulter – Schritt für Schritt entsteht
              dein neues Lieblings-Küchenstudio in Würzburg.
            </p>
          </Reveal>
        </div>
      </section>

      {/* DEIN STUDIO ERLEBNIS */}
      <section className="section studio-exp" id="erlebnis">
        <div className="container">
          <SectionHeader align="center" kicker="Dein Studio-Erlebnis" title={<>Erlebe, wie deine Küche entsteht.<br /><span className="grad">Schritt für Schritt. Mit Gefühl.</span></>} />
          <div className="studio-grid">
            {CARDS.map((cd, i) => (
              <Reveal key={cd.n} delay={(i % 3) * 0.06}>
                <article className="lscard studio-card">
                  <span className="lscard__img" style={{ backgroundImage: `url(${cd.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="snum">{cd.n}</span>
                  <span className="lscard__body">
                    <span className="lscard__title">{cd.title}</span>
                    <span className="lscard__text">{cd.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* KEIN VERKAUFSRAUM */}
      <section className="section studio-stance">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__copy">
              <span className="kicker">Unsere Haltung</span>
              <h2 className="lintro__title">Kein Verkaufsraum.<br /><span className="grad">Ein Raum für Entscheidungen.</span></h2>
              <p className="lintro__text">
                Wir nehmen uns Zeit, hören zu und beraten ehrlich – ohne
                Möbelhaus-Druck. Du entscheidest in deinem Tempo, nicht in unserem.
              </p>
              <ul className="lstances">
                {STANCE.map((u) => <li key={u}><Check size={16} strokeWidth={2.4} /> {u}</li>)}
              </ul>
            </Reveal>
            <Reveal className="lintro__media" delay={0.08}>
              <div className="lintro__frame"><img src={splitImg} alt="VIDEKO Showroom" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PROZESS (hell) */}
      <section className="section section--light studio-process">
        <div className="container">
          <SectionHeader align="center" kicker="So läuft's" title={<>Klarer Ablauf. <span className="grad">Stressfrei für dich.</span></>} />
          <ProcessTimeline steps={PROCESS} />
        </div>
      </section>

      {/* TEAM / AUGENHÖHE */}
      <section className="section studio-team">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__media">
              <div className="lintro__frame"><img src={teamImg} alt="Beratung auf Augenhöhe" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
            <Reveal className="lintro__copy" delay={0.08}>
              <span className="kicker">Beratung auf Augenhöhe</span>
              <h2 className="lintro__title">Ehrlich. Persönlich.<br /><span className="grad">Auf Augenhöhe.</span></h2>
              <p className="lintro__text">
                So beraten wir: ohne Fachchinesisch, ohne Show. Dafür mit echtem
                Interesse an dir und deinem Projekt.
              </p>
              <ul className="lstances">
                {TEAM_USP.map((u) => <li key={u}><Check size={16} strokeWidth={2.4} /> {u}</li>)}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="leist-final studio-final">
        <div className="leist-final__media" aria-hidden="true">
          <img src={ctaImg} alt="" />
          <div className="leist-final__veil" />
        </div>
        <div className="container leist-final__inner">
          <Reveal>
            <span className="kicker kicker--gold">Dein Studio in Würzburg</span>
            <h2 className="leist-final__title">Deine Küche. Dein Zuhause.<br /><span className="grad">Wir machen es möglich.</span></h2>
            <p className="leist-final__text">Komm vorbei, fühl die Materialien und erlebe Planung, wie sie sein sollte.</p>
            <div className="leist-final__actions">
              <CTAButton to="/beratung">Termin vereinbaren</CTAButton>
              <CTAButton href="#erlebnis" variant="dark">Studio entdecken</CTAButton>
            </div>
            <div className="hero-badges hero-badges--final">
              {FINAL_HL.map((b) => <span className="hero-badge" key={b}><Check size={13} strokeWidth={2.4} /> {b}</span>)}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
