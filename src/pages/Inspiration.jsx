import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Heart, Check } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import BeforeAfter from '../components/BeforeAfter.jsx'

import heroImg from '../assets/images/inspiration/01_hero_atmosphaerische_kueche.png'
import iModern from '../assets/images/inspiration/02_moderne_kueche.png'
import iWohnlich from '../assets/images/inspiration/03_wohnliche_kueche.png'
import iDunkel from '../assets/images/inspiration/04_dunkle_kueche.png'
import iHell from '../assets/images/inspiration/05_helle_kueche.png'
import iDetails from '../assets/images/inspiration/06_materialien_und_details.png'
import iInsel from '../assets/images/inspiration/07_kueche_mit_insel.png'
import iKlein from '../assets/images/inspiration/08_kleine_kueche_clever_geplant.png'
import iPremium from '../assets/images/inspiration/09_premium_architektur_kueche.png'
import iLuxus from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.png'

import mHolz from '../assets/images/materialien/cards/material-card-holz.png'
import mStein from '../assets/images/materialien/cards/material-card-naturstein.png'
import mKeramik from '../assets/images/materialien/cards/material-card-keramik.png'
import mGlas from '../assets/images/materialien/cards/material-card-glas.png'
import mMetall from '../assets/images/materialien/cards/material-card-metall.png'
import mFronten from '../assets/images/materialien/cards/material-card-lack-matt.png'
import mPlatten from '../assets/images/materialien/cards/material-card-quarzkomposit.png'

const STYLES = [
  { key: 'modern', label: 'Modern', img: iModern },
  { key: 'warm', label: 'Warm & wohnlich', img: iWohnlich },
  { key: 'dunkel', label: 'Dunkel & elegant', img: iDunkel },
  { key: 'hell', label: 'Hell & leicht', img: iHell },
  { key: 'natuerlich', label: 'Natürlich', img: iKlein },
  { key: 'luxus', label: 'Luxuriös', img: iPremium },
]

const STILWELTEN = [
  { title: 'Zeitlos modern', text: 'Klare Linien, ruhige Flächen, langlebig schön.', img: iModern },
  { title: 'Urban dunkel', text: 'Tiefe Töne, viel Charakter, starke Statements.', img: iDunkel },
  { title: 'Natürlich warm', text: 'Holz, weiche Töne und echte Geborgenheit.', img: iWohnlich },
  { title: 'Licht & elegant', text: 'Helligkeit, Leichtigkeit und feine Details.', img: iHell },
]

const MATERIALS = [
  { key: 'Holz', img: mHolz, text: 'Warm, lebendig, natürlich – bringt Ruhe in jeden Raum.' },
  { key: 'Stein', img: mStein, text: 'Charakterstark und zeitlos – jede Platte ein Unikat.' },
  { key: 'Keramik', img: mKeramik, text: 'Robust, hygienisch und edel – für den echten Alltag.' },
  { key: 'Glas', img: mGlas, text: 'Leicht, klar und modern – Licht und Tiefe zugleich.' },
  { key: 'Metall', img: mMetall, text: 'Präziser Akzent mit Industrie-Charakter.' },
  { key: 'Fronten', img: mFronten, text: 'Matt, fingerabdruckarm und elegant.' },
  { key: 'Arbeitsplatten', img: mPlatten, text: 'Strapazierfähig und schön – gemacht zum Arbeiten.' },
]

const MOOD = ['Licht & Atmosphäre', 'Farben & Kontraste', 'Proportion & Raum', 'Details, die bleiben']

const PROJECTS = [
  { title: 'Puristische Eleganz', text: 'Reduziert, klar, hochwertig.', img: iModern },
  { title: 'Stadtvilla mit Charakter', text: 'Dunkel, edel, selbstbewusst.', img: iDunkel },
  { title: 'Natürlich wohnen', text: 'Warm, offen, zum Wohlfühlen.', img: iWohnlich },
  { title: 'Raumlösung mit Licht', text: 'Hell, luftig, durchdacht.', img: iHell },
]

const TRUST = ['Persönliche Beratung', 'Individuelle Planung', 'Hochwertige Materialien', 'Perfekte Umsetzung']

export default function Inspiration() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  const [activeStyle, setActiveStyle] = useState('modern')
  const [activeMat, setActiveMat] = useState(0)
  const [favs, setFavs] = useState(() => new Set())
  const toggleFav = (i) => setFavs((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  const mat = MATERIALS[activeMat]

  return (
    <div className="leist-page insp-page">
      {/* HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Inspiration</span>
            <h1 className="pagehero__title">Inspiration für<br /><span className="grad">Küchen, die bleiben.</span></h1>
            <p className="pagehero__lead">
              Entdecke Ideen, Materialien und Raumkonzepte, die Design, Funktion und
              Wertigkeit auf besondere Weise verbinden.
            </p>
            <div className="pagehero__actions">
              <CTAButton href="#insp-stilwelten">Inspiration entdecken</CTAButton>
              <CTAButton to="/beratung" variant="dark">Küche planen</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STYLEFINDER (kompakt) */}
      <section className="section insp-style">
        <div className="container">
          <SectionHeader align="center" kicker="Dein Stil" title="Finde deinen Küchenstil." lead="Wähle, was dich anspricht – wir zeigen dir Ideen, die dazu passen." />
          <div className="stylerow">
            {STYLES.map((sObj) => (
              <button
                key={sObj.key}
                type="button"
                className={`stylepick ${activeStyle === sObj.key ? 'stylepick--active' : ''}`}
                onClick={() => setActiveStyle(sObj.key)}
              >
                <span className="stylepick__img" style={{ backgroundImage: `url(${sObj.img})` }} aria-hidden="true" />
                <span className="stylepick__label">{sObj.label}</span>
              </button>
            ))}
          </div>
          <div className="section__cta">
            <CTAButton to="/stylefinder">Stilfinder starten</CTAButton>
          </div>
        </div>
      </section>

      {/* STILWELTEN */}
      <section className="section insp-stilwelten" id="insp-stilwelten">
        <div className="container">
          <SectionHeader kicker="Stilwelten" title={<>Stilwelten, die <span className="grad">inspirieren.</span></>} lead={'Vier Richtungen, die zeigen, wie unterschiedlich „deine“ Küche aussehen kann.'} />
          <div className="stilwelt-grid">
            {STILWELTEN.map((c, i) => (
              <Reveal key={c.title} delay={(i % 2) * 0.06}>
                <article className="sfinspcard">
                  <span className="sfinspcard__img" style={{ backgroundImage: `url(${c.img})` }} aria-hidden="true" />
                  <span className="sfinspcard__scrim" aria-hidden="true" />
                  <span className="sfinspcard__body">
                    <span className="sfinspcard__name">{c.title}</span>
                    <span className="sfinspcard__text">{c.text}</span>
                    <span className="sfinspcard__foot"><span className="sfinspcard__arrow"><ArrowUpRight size={17} strokeWidth={1.8} /></span></span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MATERIAL-EXPLORER */}
      <section className="section insp-matex" id="materialien">
        <div className="container">
          <SectionHeader kicker="Material" title={<>Materialien erleben. <span className="grad">Qualität fühlen.</span></>} />
          <div className="matex">
            <Reveal className="matex__media">
              <div className="matex__frame"><img src={mat.img} alt={mat.key} /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
            <Reveal className="matex__panel" delay={0.06}>
              <div className="matex__tabs">
                {MATERIALS.map((m, i) => (
                  <button key={m.key} type="button" className={`chip chip--btn ${activeMat === i ? 'chip--active' : ''}`} onClick={() => setActiveMat(i)}>{m.key}</button>
                ))}
              </div>
              <p className="matex__text">{mat.text}</p>
              <div className="matex__swatches">
                {MATERIALS.map((m, i) => (
                  <button
                    key={m.key}
                    type="button"
                    aria-label={m.key}
                    className={`matex__swatch ${activeMat === i ? 'is-active' : ''}`}
                    style={{ backgroundImage: `url(${m.img})` }}
                    onClick={() => setActiveMat(i)}
                  />
                ))}
              </div>
              <CTAButton to="/studio">Material im Studio erleben</CTAButton>
            </Reveal>
          </div>
        </div>
      </section>

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
              <span className="mood__img mood__img--a" style={{ backgroundImage: `url(${iPremium})` }} />
              <span className="mood__img mood__img--b" style={{ backgroundImage: `url(${iDetails})` }} />
              <span className="mood__img mood__img--c" style={{ backgroundImage: `url(${iLuxus})` }} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="section section--dark insp-ba">
        <div className="container">
          <SectionHeader tone="light" align="center" kicker="Transformation" title={<>Aus dunkel und eng wird <span className="grad">licht und einladend.</span></>} lead="Eine Inspirations-Vorschau, wie viel in einem Raum stecken kann. Zieh am Regler." />
          <div className="insp-ba__wrap">
            <BeforeAfter before={iDunkel} after={iHell} beforeAlt="Vorher" afterAlt="Nachher" />
          </div>
        </div>
      </section>

      {/* IDEEN / FAVORITEN */}
      <section className="section insp-projects">
        <div className="container">
          <SectionHeader kicker="Ideen aus echten Projekten" title="Räume, die Lust auf mehr machen." lead="Merk dir, was dir gefällt – das nehmen wir mit ins Gespräch." />
          <div className="cardgrid cardgrid--4">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.title}>
                <article className="favcard">
                  <span className="favcard__img" style={{ backgroundImage: `url(${p.img})` }} aria-hidden="true" />
                  <span className="favcard__scrim" aria-hidden="true" />
                  <button
                    type="button"
                    className={`favcard__heart ${favs.has(i) ? 'is-on' : ''}`}
                    aria-label="Merken"
                    aria-pressed={favs.has(i)}
                    onClick={() => toggleFav(i)}
                  >
                    <Heart size={16} strokeWidth={2} fill={favs.has(i) ? 'currentColor' : 'none'} />
                  </button>
                  <span className="favcard__body">
                    <span className="favcard__title">{p.title}</span>
                    <span className="favcard__text">{p.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="leist-final insp-final">
        <div className="leist-final__media" aria-hidden="true">
          <img src={iLuxus} alt="" />
          <div className="leist-final__veil" />
        </div>
        <div className="container leist-final__inner">
          <div className="insp-final__row">
            <Reveal>
              <span className="kicker kicker--gold">Bereit?</span>
              <h2 className="leist-final__title">Aus Inspiration<br /><span className="grad">wird deine Küche.</span></h2>
              <p className="leist-final__text">Gemeinsam gestalten wir einen Ort, der genau zu dir und deinem Leben passt.</p>
              <div className="leist-final__actions">
                <CTAButton to="/beratung">Küchenberatung buchen</CTAButton>
                <CTAButton to="/stylefinder" variant="dark">Küche planen</CTAButton>
              </div>
            </Reveal>
            <Reveal className="insp-trustbox" delay={0.1}>
              {TRUST.map((t) => <span key={t}><Check size={15} strokeWidth={2.4} /> {t}</span>)}
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  )
}
