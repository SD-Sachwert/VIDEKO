import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Check } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import TextLink from '../components/TextLink.jsx'
import TransformingKitchen from '../components/TransformingKitchen.jsx'
import MaterialsLab from '../components/MaterialsLab.jsx'
import KuechenfehlerGame from '../components/KuechenfehlerGame.jsx'
import RaumideenSection from '../components/RaumideenSection.jsx'
import KuechengefuehlSection from '../components/KuechengefuehlSection.jsx'
import StylefinderStyles from '../components/StylefinderStyles.jsx'
import LazyBg from '../components/LazyBg.jsx'
import { KiHinweis } from '../components/legal/KiKennzeichnung.jsx'
import { imageMeta } from '../data/image-meta.js'

import heroImg from '../assets/images/inspiration/insp-hero-dark.webp'
import iDetails from '../assets/images/inspiration/06_materialien_und_details.webp'
import iPremium from '../assets/images/inspiration/09_premium_architektur_kueche.webp'
import iLuxus from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.webp'

const MOOD = ['Licht & Atmosphäre', 'Farben & Kontraste', 'Proportion & Raum', 'Details, die bleiben']

const STEPS4 = [
  { n: '1', title: 'Stylefinder starten', text: 'Beantworte ein paar Fragen und finde deinen Stil. Schnell & unverbindlich.' },
  { n: '2', title: 'Erste Einschätzung', text: 'Wir prüfen deine Angaben und geben dir eine erste, ehrliche Einschätzung.' },
  { n: '3', title: 'Grundriss & Fotos hochladen', text: 'Lade Grundriss, Maße und Fotos hoch – je mehr Infos, desto besser.' },
  { n: '4', title: 'Angebot & Beratung', text: 'Du bekommst dein persönliches Angebot und Beratung auf Augenhöhe.' },
]

export default function Inspiration() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  return (
    <div className="leist-page insp-page">
      {/* HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media">
          {/* LCP-Element der Seite. Der Parallax braucht ein motion.img, deshalb
              kein <Img> — Prioritaet und Abmessungen aber genauso setzen. */}
          <motion.img
            src={heroImg}
            alt=""
            className="pagehero__img"
            style={{ y: imgY, scale: imgScale }}
            aria-hidden="true"
            width={imageMeta(heroImg)?.w}
            height={imageMeta(heroImg)?.h}
            srcSet={imageMeta(heroImg)?.srcSet}
            sizes="100vw"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
          <div className="pagehero__veil" aria-hidden="true" />
          <KiHinweis className="pagehero__ainote" variant="visualization" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Inspiration</span>
            <h1 className="pagehero__title">Inspiration,<br /><span className="grad">die bleibt.</span></h1>
            <p className="pagehero__lead">
              Echte Küchen. Echte Materialien. Echte Ideen für dein Zuhause –
              so individuell wie dein Leben. Keine Möbel. Sondern Lieblingsorte.
            </p>
            <div className="pagehero__actions">
              <CTAButton to="/stylefinder">VIDEKO Stylefinder starten</CTAButton>
              <CTAButton href="#materialien" variant="dark">Inspiration entdecken</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* KÜCHENGEFÜHL-MODUL */}
      <KuechengefuehlSection />

      {/* VIDEKO STYLEFINDER — Premium-Style-Coverflow */}
      <StylefinderStyles />

      {/* RAUMIDEEN — interaktive Sektion */}
      <RaumideenSection />

      {/* MOODBOARD */}
      <section className="section insp-mood">
        <div className="container">
          <div className="mood">
            <Reveal className="mood__copy">
              <span className="kicker">Raumgefühl</span>
              <h2 className="lintro__title">Mehr als Design.<br /><span className="grad">Ein Gefühl.</span></h2>
              <p className="lintro__text">Inspiration ist nicht nur ein schönes Bild. Es ist das Zusammenspiel aus Licht, Material, Proportion und den kleinen Details, die bleiben.</p>
              <ul className="mood__labels">
                {MOOD.map((m) => <li key={m}><Check size={15} strokeWidth={2.4} /> {m}</li>)}
              </ul>
            </Reveal>
            <Reveal className="mood__collage" delay={0.08}>
              <LazyBg className="mood__img mood__img--a" image={iPremium} />
              <LazyBg className="mood__img mood__img--b" image={iDetails} />
              <LazyBg className="mood__img mood__img--c" image={iLuxus} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* TRANSFORMING KITCHEN — Video-Sektion */}
      <TransformingKitchen />

      {/* SO EINFACH GEHT'S (hell) */}
      <section className="section insp-steps">
        <div className="container">
          <SectionHeader align="center" kicker="So einfach geht's" title={<>In 4 Schritten zu <span className="grad">deiner neuen Küche.</span></>} lead="Klar, persönlich und transparent – damit aus deiner Idee ein Raum wird, der bleibt." />
          <div className="istep-grid">
            {STEPS4.map((s, i) => (
              <Reveal key={s.n} delay={(i % 4) * 0.06}>
                <div className="istep">
                  <span className="istep__n">{s.n}</span>
                  <span className="istep__title">{s.title}</span>
                  <span className="istep__text">{s.text}</span>
                </div>
              </Reveal>
            ))}
          </div>
          {/* /experience hat keine eigene Suchintention und steht deshalb seit
              SEO-Phase 2 bewusst außerhalb der Suchmaschinen-Architektur. Finden
              soll man sie trotzdem — und Inspiration ist genau der Kontext. */}
          <p className="aaeh-note aaeh-note--center">
            Wenn du lieber schaust als liest: Die{' '}
            <TextLink href="/experience">VIDEKO Experience</TextLink> führt durch dieselben
            Themen als Bildstrecke. Und wie daraus eine geplante Küche wird, steht unter{' '}
            <TextLink href="/planung">Küchenplanung</TextLink>.
          </p>
        </div>
      </section>

      {/* MATERIALS LAB — Material-/Oberflächen-Erlebnis */}
      <MaterialsLab />

      {/* FINDE DIE 9 KÜCHENSÜNDEN — interaktives Spiel als unterer Abschluss */}
      <KuechenfehlerGame />

    </div>
  )
}
