import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowUpRight, Heart, Check, Compass, Lightbulb, Archive, Layers, Cpu, PanelsTopLeft,
  Boxes, ChefHat, Utensils, Sofa, Briefcase, WashingMachine, Upload, MessageSquare, ArrowRight,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import VorherNachherShowcase from '../components/VorherNachherShowcase.jsx'
import MaterialsLab from '../components/MaterialsLab.jsx'
import KuechenfehlerGame from '../components/KuechenfehlerGame.jsx'
import RaumideenSection from '../components/RaumideenSection.jsx'
import KuechengefuehlSection from '../components/KuechengefuehlSection.jsx'
import StylefinderStyles from '../components/StylefinderStyles.jsx'

import heroImg from '../assets/images/inspiration/insp-hero-dark.png'
import explodeImg from '../assets/images/inspiration/insp-exploding-light.png'
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
  { key: 'Naturstein', img: mStein, text: 'Jede Platte ein Unikat. Naturstein bringt Tiefe, Charakter und eine ehrliche Oberfläche in deine Küche.' },
  { key: 'Keramik', img: mKeramik, text: 'Robust, pflegeleicht und stark in der Wirkung. Perfekt, wenn Alltag und Optik beide gewinnen sollen.' },
  { key: 'Holz', img: mHolz, text: 'Warm, lebendig und natürlich. Holz bringt Ruhe in den Raum und macht moderne Küchen wohnlicher.' },
  { key: 'Metall', img: mMetall, text: 'Kühl, präzise und markant. Metall setzt Akzente und bringt einen modernen, architektonischen Charakter.' },
  { key: 'Glas', img: mGlas, text: 'Leicht, klar und elegant. Glas sorgt für Reflexion, Tiefe und eine ruhige, hochwertige Wirkung.' },
  { key: 'Fronten', img: mFronten, text: 'Fronten bestimmen den ersten Eindruck deiner Küche. Matt, strukturiert oder glatt – hier entsteht der Charakter.' },
  { key: 'Arbeitsplatten', img: mPlatten, text: 'Die Arbeitsplatte muss gut aussehen und im Alltag liefern. Wir zeigen dir, was wirklich zu deinem Leben passt.' },
]

const MOOD = ['Licht & Atmosphäre', 'Farben & Kontraste', 'Proportion & Raum', 'Details, die bleiben']

const PROJECTS = [
  { title: 'Puristische Eleganz', text: 'Reduziert, klar, hochwertig.', img: iModern },
  { title: 'Stadtvilla mit Charakter', text: 'Dunkel, edel, selbstbewusst.', img: iDunkel },
  { title: 'Natürlich wohnen', text: 'Warm, offen, zum Wohlfühlen.', img: iWohnlich },
  { title: 'Raumlösung mit Licht', text: 'Hell, luftig, durchdacht.', img: iHell },
]

const EXPLODE = [
  { n: '01', icon: Lightbulb, title: 'Beleuchtung', text: 'Stimmung, Akzente und Funktion in perfektem Licht.' },
  { n: '02', icon: Archive, title: 'Stauraum', text: 'Durchdacht bis ins Detail – für Ordnung und Komfort.' },
  { n: '03', icon: Layers, title: 'Arbeitsplatte', text: 'Materialien, die Schönheit und Alltag verbinden.' },
  { n: '04', icon: Cpu, title: 'Technik', text: 'Intelligente Geräte, nahtlos integriert.' },
  { n: '05', icon: PanelsTopLeft, title: 'Fronten', text: 'Design mit Charakter – Farbe, Struktur, Material.' },
  { n: '06', icon: Boxes, title: 'Innenleben', text: 'Qualität, die man sieht – langlebig und wertbeständig.' },
]

const ROOMS = [
  { key: 'Kochen', icon: ChefHat, title: 'Kochen mit Stil.', text: 'Funktion trifft Emotion – Küchen, die mehr können und schöner sind.', img: iInsel },
  { key: 'Essen', icon: Utensils, title: 'Essen & zusammenkommen.', text: 'Übergänge, die Küche und Tisch zu einem Ort verbinden.', img: iWohnlich },
  { key: 'Wohnen', icon: Sofa, title: 'Offen wohnen.', text: 'Küche und Wohnraum als eine ruhige, warme Einheit.', img: iHell },
  { key: 'Homeoffice', icon: Briefcase, title: 'Arbeiten zuhause.', text: 'Clevere Nischen, die sich nahtlos in den Raum fügen.', img: iModern },
  { key: 'Hauswirtschaft', icon: WashingMachine, title: 'Ordnung dahinter.', text: 'Stauraum und Technik, die den Alltag leise tragen.', img: iKlein },
]

const CONVERT = [
  { tag: 'Schnell & einfach', icon: Compass, title: 'VIDEKO Stylefinder', text: 'Starte deine erste Einschätzung in nur 2 Minuten.', points: ['Sofort eine grobe Preisspanne', 'Passende Stilwelt entdecken', 'Unverbindlich & anonym'], cta: 'Stylefinder starten', to: '/stylefinder' },
  { tag: 'Genau & individuell', icon: Upload, title: 'Unterlagen hochladen', text: 'Teile Grundriss, Fotos und Ideen für ein präzises Angebot.', points: ['Grundriss, Fotos, Skizzen', 'PDF, JPG, PNG', 'Wir melden uns mit Plan'], cta: 'Unterlagen hochladen', to: '/stylefinder' },
  { tag: 'Persönlich & beratend', icon: MessageSquare, title: 'Persönlich beraten lassen', text: 'Buche ein unverbindliches Gespräch mit unseren Küchenexperten.', points: ['Individuelle Beratung', 'Konkrete Empfehlungen', 'Zeitlich flexibel'], cta: 'Termin buchen', to: '/beratung' },
]

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

  const [activeStyle, setActiveStyle] = useState('modern')
  const [activeMat, setActiveMat] = useState(0)
  const [activeRoom, setActiveRoom] = useState(0)
  const room = ROOMS[activeRoom]
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
              <span className="mood__img mood__img--a" style={{ backgroundImage: `url(${iPremium})` }} />
              <span className="mood__img mood__img--b" style={{ backgroundImage: `url(${iDetails})` }} />
              <span className="mood__img mood__img--c" style={{ backgroundImage: `url(${iLuxus})` }} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* VORHER / NACHHER — Showcase-Galerie (3 Karten) */}
      <VorherNachherShowcase />

      {/* SO EINFACH GEHT'S (hell) */}
      <section className="section insp-steps">
        <div className="container">
          <SectionHeader align="center" kicker="So einfach geht's" title={<>In 4 Schritten zu <span className="grad">deiner Traumküche.</span></>} lead="Klar, persönlich und transparent – damit aus deiner Idee ein Raum wird, der bleibt." />
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
        </div>
      </section>

      {/* MATERIALS LAB — Material-/Oberflächen-Erlebnis */}
      <MaterialsLab />

      {/* FINDE DIE 9 KÜCHENSÜNDEN — interaktives Spiel als unterer Abschluss */}
      <KuechenfehlerGame />

      {/* FINALER CTA / DUNKLER ABSCHLUSS — 3 Wege */}
      <section className="section section--dark insp-convert">
        <div className="container">
          <SectionHeader tone="light" align="center" kicker="Drei Wege" title={<>Ideen sind der Anfang. <span className="grad">Deine Küche ist das Ziel.</span></>} lead="Wähle den Weg, der zu dir passt – schnell & einfach oder persönlich & individuell." />
          <div className="convert-grid">
            {CONVERT.map((c, i) => (
              <Reveal key={c.title} delay={(i % 3) * 0.07}>
                <div className="convcard">
                  <span className="convcard__tag">{c.tag}</span>
                  <span className="convcard__ic"><c.icon size={22} strokeWidth={1.6} /></span>
                  <span className="convcard__title">{c.title}</span>
                  <span className="convcard__text">{c.text}</span>
                  <ul className="convcard__points">
                    {c.points.map((p) => <li key={p}><Check size={13} strokeWidth={2.6} /> {p}</li>)}
                  </ul>
                  <CTAButton to={c.to}>{c.cta}</CTAButton>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="convert-note">Kein Druck. Keine Verpflichtung. Nur ehrliche Ideen für deine Küche.</p>
        </div>
      </section>
    </div>
  )
}
