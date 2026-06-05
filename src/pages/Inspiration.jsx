import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

import heroImg from '../assets/images/inspiration/01_hero_atmosphaerische_kueche.png'
import iModern from '../assets/images/inspiration/02_moderne_kueche.png'
import iWohnlich from '../assets/images/inspiration/03_wohnliche_kueche.png'
import iDunkel from '../assets/images/inspiration/04_dunkle_kueche.png'
import iHell from '../assets/images/inspiration/05_helle_kueche.png'
import iMaterial from '../assets/images/inspiration/06_materialien_und_details.png'
import iInsel from '../assets/images/inspiration/07_kueche_mit_insel.png'
import iKlein from '../assets/images/inspiration/08_kleine_kueche_clever_geplant.png'
import iPremium from '../assets/images/inspiration/09_premium_architektur_kueche.png'
import iLuxus from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.png'

const STILE = [
  { title: 'Moderne Küchen', text: 'Klar, reduziert, zeitlos.', image: iModern },
  { title: 'Warme Wohnküchen', text: 'Holz, Geborgenheit, Atmosphäre.', image: iWohnlich },
  { title: 'Dunkle Küchen', text: 'Tiefe Töne, starker Charakter.', image: iDunkel },
  { title: 'Helle Küchen', text: 'Licht, Leichtigkeit, Ruhe.', image: iHell },
  { title: 'Materialien & Details', text: 'Wo Qualität fühlbar wird.', image: iMaterial },
  { title: 'Küchen mit Insel', text: 'Der Mittelpunkt deines Raums.', image: iInsel },
  { title: 'Kleine Küchen groß gedacht', text: 'Jeder Zentimeter sinnvoll.', image: iKlein },
  { title: 'Premium & Architektur', text: 'Statement-Küchen mit Haltung.', image: iPremium },
]

const STYLES = [
  { label: 'Puristisch', image: iModern },
  { label: 'Natürlich', image: iHell },
  { label: 'Dunkel & elegant', image: iDunkel },
  { label: 'Familienfreundlich', image: iWohnlich },
  { label: 'Urban / Industrial', image: iPremium },
  { label: 'Landhaus modern', image: iKlein },
  { label: 'Luxus / Architektur', image: iInsel },
]

const MATERIALS = ['Naturstein', 'Holz', 'Keramik', 'Glas', 'Metall', 'Mattlack']

const MOOD = [
  { title: 'Ruhig & reduziert', text: 'Weniger ist mehr – aber richtig gut gemacht.', image: iModern },
  { title: 'Warm & wohnlich', text: 'Eine Küche, in der man bleiben will.', image: iWohnlich },
  { title: 'Dramatisch & dunkel', text: 'Klare Kante, viel Charakter.', image: iDunkel },
  { title: 'Hell & leicht', text: 'Licht, Luft und Leichtigkeit.', image: iHell },
]

const FAVORITES = [
  { image: heroImg, cats: ['Licht'] },
  { image: iModern, cats: ['Details'] },
  { image: iWohnlich, cats: ['Wohnküche'] },
  { image: iInsel, cats: ['Insel'] },
  { image: iPremium, cats: ['Material'] },
  { image: iLuxus, cats: ['Wohnküche'] },
]
const FAV_FILTERS = ['Alle', 'Insel', 'Material', 'Licht', 'Wohnküche', 'Details']

const POSSIBLE = [
  { title: 'Raumideen', text: 'Wie aus Wänden ein Lieblingsort wird.', image: iDunkel },
  { title: 'Lichtkonzepte', text: 'Warum Licht oft alles entscheidet.', image: iInsel },
  { title: 'Clevere Lösungen', text: 'Stauraum & Abläufe, die den Alltag tragen.', image: iKlein },
]

const ARTICLES = [
  { title: '5 Dinge, die jede gute Küchenplanung braucht', image: iModern },
  { title: 'Warum Lichtplanung oft wichtiger ist als die Frontfarbe', image: iDunkel },
  { title: 'Kücheninsel: schön – aber nicht immer sinnvoll', image: iInsel },
  { title: 'Stauraum clever planen: So geht’s richtig', image: iKlein },
  { title: 'Welche Arbeitsplatte passt zu welchem Alltag?', image: iMaterial },
  { title: 'Grifflos, Griffleiste oder Griff? Was ist besser?', image: iHell },
]

export default function Inspiration() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])
  const [fav, setFav] = useState('Alle')
  const favShown = FAVORITES.filter((f) => fav === 'Alle' || f.cats.includes(fav))

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
              Entdecke Stilrichtungen, Materialien, Raumideen und Details, die aus
              einer Küche mehr machen als einen Ort zum Kochen.
            </p>
            <div className="pagehero__actions">
              <CTAButton href="#stile">Inspiration entdecken</CTAButton>
              <a className="leist-hero__link" href="/beratung">Beratung anfragen <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STILE, DIE INSPIRIEREN */}
      <section className="section insp-stile" id="stile">
        <div className="container">
          <SectionHeader align="center" kicker="Kuratiert" title={<>Stile, die <span className="grad">inspirieren.</span></>} lead="Acht Richtungen, die zeigen, was eine Küche alles sein kann." />
          <div className="insp-grid">
            {STILE.map((s, i) => (
              <Reveal key={s.title} delay={(i % 4) * 0.05}>
                <article className="lscard">
                  <span className="lscard__img" style={{ backgroundImage: `url(${s.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="lscard__body">
                    <span className="lscard__title">{s.title}</span>
                    <span className="lscard__text">{s.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINDE DEINEN KÜCHENSTIL */}
      <section className="section insp-styles">
        <div className="container">
          <SectionHeader align="center" kicker="Dein Stil" title="Finde deinen Küchenstil." />
          <div className="stylechips">
            {STYLES.map((s) => (
              <Reveal key={s.label} className="stylechip">
                <span className="stylechip__img" style={{ backgroundImage: `url(${s.image})` }} aria-hidden="true" />
                <span className="stylechip__label">{s.label}</span>
              </Reveal>
            ))}
          </div>
          <div className="section__cta">
            <CTAButton to="/stylefinder">Stylefinder starten</CTAButton>
          </div>
        </div>
      </section>

      {/* HOCHWERTIG BIS INS DETAIL */}
      <section className="section insp-material">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__media">
              <div className="lintro__frame"><img src={iMaterial} alt="Materialien & Details" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
            <Reveal className="lintro__copy" delay={0.08}>
              <span className="kicker">Material</span>
              <h2 className="lintro__title">Hochwertig<br /><span className="grad">bis ins Detail.</span></h2>
              <p className="lintro__text">
                Material entscheidet, wie sich deine Küche anfühlt – jeden Tag.
                Deshalb kombinieren wir Oberflächen ehrlich und mit Gefühl.
              </p>
              <div className="lchips">
                {MATERIALS.map((m) => <span className="lchip" key={m}>{m}</span>)}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* RAUMGEFÜHL, DAS BLEIBT */}
      <section className="section insp-mood">
        <div className="container">
          <SectionHeader align="center" kicker="Raumgefühl" title={<>Raumgefühl, <span className="grad">das bleibt.</span></>} />
          <div className="karr-grid4">
            {MOOD.map((m, i) => (
              <Reveal key={m.title} delay={(i % 4) * 0.06}>
                <article className="lscard karr-whycard">
                  <span className="lscard__img" style={{ backgroundImage: `url(${m.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="lscard__body">
                    <span className="lscard__title">{m.title}</span>
                    <span className="lscard__text">{m.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* UNSERE FAVORITEN */}
      <section className="section insp-fav">
        <div className="container">
          <SectionHeader align="center" kicker="Galerie" title={<>Unsere <span className="grad">Favoriten.</span></>} />
          <div className="vn-filters">
            {FAV_FILTERS.map((f) => (
              <button key={f} type="button" className={`chip chip--btn ${fav === f ? 'chip--active' : ''}`} onClick={() => setFav(f)}>{f}</button>
            ))}
          </div>
          <div className="insp-gallery">
            {favShown.map((f, i) => (
              <Reveal key={i} delay={(i % 3) * 0.05} className="galcard">
                <span className="galcard__img" style={{ backgroundImage: `url(${f.image})` }} aria-hidden="true" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SIEH, WAS MÖGLICH IST */}
      <section className="section insp-possible">
        <div className="container">
          <SectionHeader kicker="Mehr als Bilder" title={<>Sieh, was <span className="grad">möglich ist.</span></>} lead="Echte Räume, echte Verwandlungen – schon bald in unserer Vorher/Nachher-Welt." />
          <div className="lservice-grid">
            {POSSIBLE.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 0.06}>
                <article className="lscard">
                  <span className="lscard__img" style={{ backgroundImage: `url(${p.image})` }} aria-hidden="true" />
                  <span className="lscard__scrim" aria-hidden="true" />
                  <span className="lscard__body">
                    <span className="lscard__title">{p.title}</span>
                    <span className="lscard__text">{p.text}</span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="section__cta">
            <CTAButton to="/vorher-nachher">Vorher / Nachher ansehen</CTAButton>
          </div>
        </div>
      </section>

      {/* TIPPS, IDEEN & EXPERTENWISSEN */}
      <section className="section insp-journal">
        <div className="container">
          <SectionHeader align="center" kicker="Journal" title={<>Tipps, Ideen & <span className="grad">Expertenwissen.</span></>} lead="Unser Küchen-Ratgeber – die ersten Beiträge sind in Arbeit." />
          <div className="artgrid">
            {ARTICLES.map((a, i) => (
              <Reveal key={a.title} delay={(i % 3) * 0.05}>
                <article className="artcard">
                  <span className="artcard__img" style={{ backgroundImage: `url(${a.image})` }} aria-hidden="true" />
                  <span className="artcard__body">
                    <span className="artcard__tag">Demnächst</span>
                    <span className="artcard__title">{a.title}</span>
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
          <Reveal>
            <span className="kicker kicker--gold">Bereit?</span>
            <h2 className="leist-final__title">Genug Inspiration gesammelt?<br /><span className="grad">Jetzt wird daraus deine Küche.</span></h2>
            <p className="leist-final__text">
              Bring Ideen, Bilder oder einfach nur ein Gefühl mit. Wir übersetzen
              daraus eine Küche, die zu deinem Raum, Alltag und Budget passt.
            </p>
            <div className="leist-final__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/stylefinder" variant="dark">Stylefinder starten</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
