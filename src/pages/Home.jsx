import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, Check, PenTool, Telescope, Heart, Gem, LifeBuoy,
  ChefHat, Zap, Layers, PaintRoller, Ruler, Lightbulb, Wrench,
} from 'lucide-react'

import Hero from '../components/Hero.jsx'
import Reveal from '../components/Reveal.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import TextLink from '../components/TextLink.jsx'
import CTAButton from '../components/CTAButton.jsx'
import KfgTeaser from '../components/KfgTeaser.jsx'
import { KiHinweis } from '../components/legal/KiKennzeichnung.jsx'
import ExplodingKitchenModal from '../components/ExplodingKitchenModal.jsx'
import HeroExperience from '../components/HeroExperience.jsx'
import LazyVideo from '../components/LazyVideo.jsx'
import LazyBg from '../components/LazyBg.jsx'
import StylefinderHero from '../components/StylefinderHero.jsx'
import ProcessSection from '../components/ProcessSection.jsx'
import { journalArticles } from '../data/journal.js'
import verwandleVideo from '../assets/images/home/verwandle-raum.mp4'
import gameScene from '../assets/images/kuechenfehler/scene.webp'

import wayInsp from '../assets/images/home/way-organic-1.webp'
import waySf from '../assets/images/home/way-organic-2.webp'
import wayBer from '../assets/images/home/way-organic-3.webp'
import sfResult from '../assets/images/kuechenwelten/stilfinderresult-modern-warm.webp'
import sfCard1 from '../assets/images/kuechenwelten/stilfindercard-modern-warm.webp'
import sfCard2 from '../assets/images/kuechenwelten/stilfindercard-zeitlos-elegant.webp'
import sfCard3 from '../assets/images/kuechenwelten/stilfindercard-natuerlich-luxurioes.webp'
import gKuechen from '../assets/images/inspiration/02_moderne_kueche.webp'
import gMat from '../assets/images/inspiration/06_materialien_und_details.webp'
import gBer from '../assets/images/ueber-uns/02_why_videko_beratungsszene.webp'
import gTech from '../assets/images/inspiration/09_premium_architektur_kueche.webp'
import gBesicht from '../assets/images/studio/bilder/01_hero_studio_showroom.webp'
import pc1 from '../assets/images/leistungen/ls-consulting.webp'
import pc2 from '../assets/images/leistungen/ls-3d.webp'
import pc3 from '../assets/images/leistungen/ls-materials.webp'
import pc4 from '../assets/images/leistungen/ls-coordination.webp'
import pc5 from '../assets/images/leistungen/ls-install.webp'
import pc6 from '../assets/images/leistungen/ls-aftercare.webp'
import tm1 from '../assets/images/ueber-uns/06_team_beratung_und_planung.webp'
import tm2 from '../assets/images/ueber-uns/07_team_marketing_und_social_media.webp'
import tm3 from '../assets/images/ueber-uns/08_team_montage_und_handwerk.webp'
import tm4 from '../assets/images/ueber-uns/09_team_organisation_und_partner.webp'
import finalImg from '../assets/images/studio/bilder/10_final_cta_studio_banner.webp'

const WAYS = [
  { n: '01', title: 'Inspiration finden', text: 'Entdecke Stile, Materialien und Ideen für die Küche, die zu dir passt.', cta: 'Jetzt entdecken', to: '/inspiration', img: wayInsp },
  { n: '02', title: 'Stylefinder starten', text: 'In 2 Minuten zu deiner individuellen Küchenrichtung – ohne Geschmackstest mit Gewinner.', cta: 'Jetzt starten', to: '/stylefinder', img: waySf, light: true },
  { n: '03', title: 'Persönliche Beratung', text: 'Gemeinsam planen wir deine Küche – ehrlich und auf Augenhöhe.', cta: 'Termin sichern', to: '/beratung', img: wayBer },
]


const WHY = [
  { icon: PenTool, title: 'Design mit Haltung', text: 'Klare Linien, warme Materialien – kein Effekt um des Effekts willen.' },
  { icon: Telescope, title: 'Technik mit Weitblick', text: 'Lösungen, die auch in zehn Jahren noch Sinn ergeben.' },
  { icon: Heart, title: 'Persönlich & ehrlich', text: 'Echte Beratung auf Augenhöhe statt Verkaufsshow.', highlight: true },
  { icon: Gem, title: 'Qualität ohne Kompromisse', text: 'Materialien und Verarbeitung, die man täglich spürt.' },
  { icon: LifeBuoy, title: 'Service, der bleibt', text: 'Auch nach dem Aufbau ein verlässlicher Ansprechpartner.' },
]

const GALLERY = [
  { title: 'Küchenwelten', sub: 'Ausstellung & Erleben', img: gKuechen },
  { title: 'Materialien', sub: 'Sehen & Spüren', img: gMat },
  { title: 'Persönliche Beratung', sub: 'Augenhöhe & Ehrlichkeit', img: gBer, big: true },
  { title: 'Technik erleben', sub: 'Detail & Qualität', img: gTech },
  { title: 'Besichtigung', sub: 'Studio in Würzburg', img: gBesicht },
]

const STATS = [
  { v: 'Maßgeplant', l: 'Für deinen Grundriss – nicht von der Stange' },
  { v: 'Durchdacht', l: 'Klar geplant, sauber umgesetzt' },
  { v: 'Persönlich', l: 'Von der ersten Idee bis zur fertigen Küche' },
]

const PROCESS = [
  { n: '01', title: 'Kennenlernen', text: 'Wir lernen dich und deine Wünsche kennen.', img: pc1 },
  { n: '02', title: 'Planung', text: 'Kreativ, technisch und durchdacht.', img: pc2 },
  { n: '03', title: 'Detaillierung', text: 'Jedes Detail wird perfekt abgestimmt.', img: pc3 },
  { n: '04', title: 'Bemusterung', text: 'Materialien erleben und entscheiden.', img: pc4 },
  { n: '05', title: 'Umsetzung', text: 'Präzise Fertigung und Montage.', img: pc5 },
  { n: '06', title: 'Betreuung', text: 'Für dich da – auch danach.', img: pc6 },
]

const TEAM = [
  { title: 'Beratung & Planung', role: 'Dein erster Kontakt', story: 'Die Menschen, die zuhören, bevor sie planen.', img: tm1 },
  { title: 'Marketing & Social', role: 'Macht VIDEKO sichtbar', story: 'Macht sichtbar, was andere nur behaupten.', img: tm2 },
  { title: 'Montage & Handwerk', role: 'Bringt Pläne in den Raum', story: 'Sorgt dafür, dass aus Planung Realität wird.', img: tm3 },
  { title: 'Organisation', role: 'Hält alle Fäden zusammen', story: 'Hält die Fäden zusammen, damit du nicht jonglieren musst.', img: tm4 },
]

const TEAM_BENEFITS = ['Erfahren & engagiert', 'Kreativ & individuell', 'Verlässlich & transparent', 'Qualität mit Leidenschaft']

// Kurzuebersicht der Gewerke, die bei einem Komplettumbau zusammenkommen.
// Details und die korrekte Einordnung (VIDEKO plant und koordiniert, ausgefuehrt
// wird mit Fachpartnern) stehen auf /alles-aus-einer-hand.
const RAUM_GEWERKE = [
  { icon: ChefHat, label: 'Küche' },
  { icon: Zap, label: 'Elektro' },
  { icon: Layers, label: 'Boden' },
  { icon: PaintRoller, label: 'Wand' },
  { icon: Ruler, label: 'Spanndecke' },
  { icon: Lightbulb, label: 'Licht' },
  { icon: Wrench, label: 'Montage' },
]

// Die Kacheln ziehen Titel, Kategorie und Bild direkt aus journal.js. Vorher
// standen hier eigene Ueberschriften, die nicht zum verlinkten Artikel passten.
const JOURNAL_SLUGS = [
  '7-kuechenfehler-die-du-spaeter-jeden-tag-bereust',
  'welche-arbeitsplatte-passt-zu-mir',
  'fronten-farben-materialien',
  'licht-in-der-kueche',
]
const JOURNAL = JOURNAL_SLUGS
  .map((slug) => journalArticles.find((a) => a.slug === slug))
  .filter(Boolean)

export default function Home() {
  const [whyActive, setWhyActive] = useState(null)
  return (
    <div className="leist-page home-page">
      <Hero />

      {/* 0 — EINSTIEG: Womit möchtest du starten? (interaktive 3 Felder, primärer Einstieg) */}
      <StylefinderHero />

      {/* 1 — SLIDER / RAUMUMBAU (Before/After + Post-its) */}
      <HeroExperience />

      {/* 2 — EXPLODING KITCHEN */}
      <ExplodingKitchenModal />

      {/* 3 — WARUM VIDEKO + STYLEFINDER */}
      <section className="section section--light lp-why-sec">
        <div className="container">
          <div className="lp-why-head">
            <Reveal>
              <span className="kicker">Warum VIDEKO</span>
              <h2 className="lp-h2">Warum VIDEKO <span className="grad">anders plant.</span></h2>
              {/* Bis SEO-Phase 2 stand auf der Startseite nirgends im fließenden Text,
                  was VIDEKO ist und wo. Der Satz sagt beides einmal — und führt zu den
                  zwei Seiten, die das Thema vertiefen. */}
              <p className="lp-lead">
                VIDEKO ist ein Küchenstudio in Würzburg. Wir planen Küchen für den
                Grundriss, der tatsächlich da ist – von der ersten Idee über die{' '}
                <TextLink href="/planung">Küchenplanung</TextLink> bis zur Montage, und auf
                Wunsch für den ganzen Raum. Sehen und anfassen kann man das in unserem{' '}
                <TextLink href="/studio">Studio in der Hertzstraße</TextLink>.
              </p>
            </Reveal>
          </div>
          <div className="lp-why">
            {WHY.map((b, i) => (
              <Reveal key={b.title} as="button" type="button" className={`lpwhy ${whyActive === i ? 'lpwhy--hl' : ''}`} delay={i * 0.06} onClick={() => setWhyActive(whyActive === i ? null : i)}>
                <span className="lpwhy__ic"><b.icon size={22} strokeWidth={1.6} /></span>
                <span className="lpwhy__title">{b.title}</span>
                <span className="lpwhy__text">{b.text}</span>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* 4 — STUDIO GALERIE */}
      <section className="section section--light lp-studio-sec">
        <div className="container lp-studio-head">
          <Reveal>
            <span className="kicker">Studio Würzburg</span>
            <h2 className="lp-h2">Erlebe unser Studio <span className="grad">in Würzburg.</span></h2>
            <p className="lp-lead">Tausend Bilder ersetzen kein echtes Raumgefühl. Komm vorbei und lass dich inspirieren.</p>
            <CTAButton to="/studio">Studio virtuell erleben</CTAButton>
          </Reveal>
        </div>
        <div className="lp-gallery">
          {GALLERY.map((g, i) => (
            <Reveal key={g.title} className={`lpgal ${g.big ? 'lpgal--big' : ''}`} delay={(i % 5) * 0.05}>
              <LazyBg className="lpgal__img" image={g.img} aria-hidden="true" />
              <span className="lpgal__scrim" aria-hidden="true" />
              <span className="lpgal__body"><span className="lpgal__title">{g.title}</span><span className="lpgal__sub">{g.sub}</span></span>
            </Reveal>
          ))}
        </div>
        <div className="container"><KiHinweis className="vnc__ainote" variant="section-notice" text="Impressionen – KI-generierte Symbolbilder. Auch die abgebildeten Personen sind KI-generiert; das Studio in Würzburg befindet sich noch im Aufbau." /></div>
      </section>

      {/* 5 — TRANSFORMATION */}
      <section className="section section--light lp-transform-sec">
        <div className="container">
          <Reveal className="lp-transform__head">
            <span className="kicker">Vorher / Nachher</span>
            <h2 className="lp-h2">Verwandle deinen Raum <span className="grad">in etwas Besonderes.</span></h2>
            <p className="lp-lead">Mit durchdachtem Design und sauberer Planung wird aus einem Raum zum Ankommen mehr.</p>
          </Reveal>
          <Reveal className="lp-transform__video" delay={0.1}>
            <LazyVideo src={verwandleVideo} aria-label="Küchen-Transformation von VIDEKO" />
          </Reveal>
          <div className="lp-transform__stats2">
            {STATS.map((s, i) => (
              <Reveal key={s.l} className="lpstat2" delay={i * 0.08}>
                <span className="lpstat2__v grad">{s.v}</span>
                <span className="lpstat2__l">{s.l}{s.sub ? <i>{s.sub}</i> : null}</span>
              </Reveal>
            ))}
          </div>
          <Reveal className="lp-transform__more">
            <Link to="/vorher-nachher" className="lp-link">Mehr Transformationen <ArrowRight size={15} strokeWidth={2} /></Link>
          </Reveal>
        </div>
      </section>

      {/* 6 — PROZESS (neue Wellen-Sektion) */}
      <ProcessSection />

      {/* 8 — ALLES AUS EINER HAND */}
      <section className="section raum-sec">
        <div className="container">
          <SectionHeader
            align="center"
            kicker="Komplettumbau"
            title={<>Nicht nur Küche. <span className="grad">Der ganze Raum.</span></>}
            lead="Elektro, Boden, Wand, Decke und Licht hängen an jeder neuen Küche mit dran. Wir planen sie zusammen und koordinieren die Fachpartner, die sie umsetzen."
          />
          <Reveal className="raum-sec__grid">
            {RAUM_GEWERKE.map(({ icon: Icon, label }) => (
              <span className="raum-chip" key={label}>
                <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
                {label}
              </span>
            ))}
          </Reveal>
          <Reveal className="raum-sec__cta">
            <CTAButton to="/alles-aus-einer-hand">Alles aus einer Hand</CTAButton>
            <CTAButton to="/leistungen" variant="dark">Unsere Leistungen</CTAButton>
          </Reveal>
        </div>
      </section>

      {/* 9 — JOURNAL */}
      <section className="section section--light lp-journal-sec">
        <div className="container lp-journal-head">
          <Reveal>
            <span className="kicker">Journal</span>
            <h2 className="lp-h2">Inspiration & Wissen <span className="grad">für deine Küche.</span></h2>
            <p className="lp-lead">Entdecke Tipps, Trends und spannende Projekte in unserem Journal.</p>
            <CTAButton to="/journal" variant="dark">Zum Journal</CTAButton>
          </Reveal>
        </div>
        <div className="container">
          <div className="lp-journal">
            {JOURNAL.map((a, i) => (
              <Reveal key={a.slug} delay={(i % 4) * 0.06}>
                <Link to={`/journal/${a.slug}`} className="lpjcard">
                  <LazyBg className="lpjcard__img" image={a.image} aria-hidden="true" />
                  <span className="lpjcard__body">
                    <span className="lpjcard__tag">{a.category}</span>
                    <span className="lpjcard__title">{a.title}</span>
                    <span className="lpjcard__cta">Jetzt lesen <ArrowUpRight size={15} strokeWidth={2} /></span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
          <KfgTeaser />
        </div>
      </section>

    </div>
  )
}
