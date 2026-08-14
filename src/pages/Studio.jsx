import { useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import LazyVideo from '../components/LazyVideo.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { KiBadge, KiHinweis } from '../components/legal/KiKennzeichnung.jsx'

import heroImg from '../assets/images/studio/bilder/01_hero_studio_showroom.webp'
import introImg from '../assets/images/studio/bilder/02_intro_showroom_hell.webp'
import cAnkommen from '../assets/images/studio/bilder/03_studio_card_ankommen_lounge.webp'
import cWelten from '../assets/images/studio/bilder/04_studio_card_kuechenwelten_entdecken.webp'
import cMaterial from '../assets/images/studio/bilder/05_studio_card_materialien_fuehlen.webp'
import cPlanung from '../assets/images/studio/bilder/06_studio_card_planung_erleben.webp'
import cBeratung from '../assets/images/studio/bilder/07_studio_card_beratung_vertiefen.webp'
import splitImg from '../assets/images/studio/bilder/08_split_section_showroom_gross.webp'
import teamImg from '../assets/images/studio/bilder/09_team_beratung_auf_augenhoehe.webp'
import ctaImg from '../assets/images/studio/bilder/10_final_cta_studio_banner.webp'
import umbauVideo from '../assets/images/studio/bilder/Umbau.mp4'

const HERO_BADGES = ['Persönliche Beratung', 'Hochwertige Materialien', 'Planung auf höchstem Niveau']

const INTRO_USP = [
  'Individuelle Beratung', 'Planung mit Feingefühl', 'Realistische Planung',
  'Premium Materialien', 'Alles aus einer Hand',
]

const JOURNEY = [
  { title: 'Ankommen', text: 'Erstmal ankommen, durchatmen, wohlfühlen. Kein Druck, kein Geschwätz.', img: cAnkommen },
  { title: 'Raumgefühl spüren', text: 'Echte Küchenwelten zum Durchgehen – Proportion und Atmosphäre live.', img: introImg },
  { title: 'Materialien anfassen', text: 'Oberflächen fühlen, Qualität spüren. Bilder lügen, Material nicht.', img: cMaterial },
  { title: 'Licht erleben', text: 'Wie Licht deine Küche verändert – morgens, abends, beim Kochen.', img: cWelten },
  { title: 'Planung sehen', text: 'Deine Küche in 3D – realistisch, bevor irgendwas gebaut wird.', img: cPlanung },
  { title: 'Beratung vertiefen', text: 'In Ruhe Fragen klären, ehrlich und auf Augenhöhe.', img: cBeratung },
  { title: 'Entscheidung treffen', text: 'Kein Druck. Du entscheidest in deinem Tempo – mit einem klaren Plan.', img: splitImg },
]

const STANCE = ['Diskret & respektvoll', 'Ehrlich & transparent', 'Erfahren & spezialisiert']
const TEAM_USP = ['Ehrlich & transparent', 'Persönlich & nah', 'Kompetent & erfahren']

const FINAL_HL = ['Individuelle Beratung', 'Premium Materialien', 'Planung auf höchstem Niveau']

export default function Studio() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])
  const [active, setActive] = useState(0)

  return (
    <div className="leist-page studio-page">
      {/* HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} aria-hidden="true" />
          <div className="pagehero__veil" aria-hidden="true" />
          <KiHinweis className="pagehero__ainote" variant="visualization" />
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

      {/* VIDEO SHOWCASE – Studio im Aufbau */}
      <section className="section studio-video-sec">
        <div className="container">
          <Reveal className="vfeature">
            <LazyVideo className="vfeature__vid" src={umbauVideo} poster={introImg} aria-hidden="true" />
            <span className="vfeature__veil" aria-hidden="true" />
            <div className="vfeature__copy">
              <span className="kicker kicker--gold">Studio im Aufbau</span>
              <h2 className="vfeature__title">Hier entsteht<br /><span className="grad">etwas Besonderes.</span></h2>
              <p className="vfeature__text">Schau uns beim Aufbau über die Schulter – Schritt für Schritt entsteht dein neues Lieblings-Küchenstudio in Würzburg.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* DEIN STUDIO ERLEBNIS — interaktive Journey */}
      <section className="section studio-exp" id="erlebnis">
        <div className="container">
          <SectionHeader align="center" kicker="Dein Studio-Erlebnis" title={<>Erlebe, wie deine Küche entsteht.<br /><span className="grad">Schritt für Schritt. Mit Gefühl.</span></>} lead="Klick dich durch deinen Besuch – vom Ankommen bis zur Entscheidung." />
          <div className="sjourney">
            <div className="sjourney__steps">
              {JOURNEY.map((s, i) => (
                <button key={s.title} type="button" className={`sjstep ${active === i ? 'is-active' : ''}`} onClick={() => setActive(i)} onMouseEnter={() => setActive(i)}>
                  <span className="sjstep__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="sjstep__body">
                    <span className="sjstep__title">{s.title}</span>
                    <span className="sjstep__text">{s.text}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="sjourney__stage">
              <AnimatePresence mode="wait">
                <motion.div key={active} className="sjourney__card" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                  <span className="sjourney__img" style={{ backgroundImage: `url(${JOURNEY[active].img})` }} aria-hidden="true" />
                  <span className="sjourney__scrim" aria-hidden="true" />
                  <span className="sjourney__cap">
                    <span className="sjourney__capn">{String(active + 1).padStart(2, '0')}</span>
                    <span className="sjourney__captitle">{JOURNEY[active].title}</span>
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <KiHinweis
            className="vnc__ainote"
            variant="section-notice"
            text="Die gezeigten Studio-Szenen sind KI-generierte Visualisierungen. Das Studio in Würzburg befindet sich noch im Aufbau."
          />
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
              <div className="lintro__frame"><img src={splitImg} alt="Visualisierung eines VIDEKO Showrooms (KI-generiert)" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /><KiBadge variant="visualization" title="KI-generierte Visualisierung" /></div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* TEAM / AUGENHÖHE */}
      <section className="section studio-team">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__media">
              <div className="lintro__frame"><img src={teamImg} alt="Beratungssituation (KI-generiertes Symbolbild)" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /><KiBadge /></div>
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

    </div>
  )
}
