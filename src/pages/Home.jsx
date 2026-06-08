import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, Check, PenTool, Telescope, Heart, Gem, LifeBuoy,
} from 'lucide-react'

import Hero from '../components/Hero.jsx'
import Reveal from '../components/Reveal.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CTAButton from '../components/CTAButton.jsx'
import ExplodingKitchen from '../components/ExplodingKitchen.jsx'
import ExplodingKitchenScroll from '../components/ExplodingKitchenScroll.jsx'
import ExplodingKitchenModal from '../components/ExplodingKitchenModal.jsx'
import HeroExperience from '../components/HeroExperience.jsx'
import verwandleVideo from '../assets/images/home/verwandle-raum.mp4'

import wayInsp from '../assets/images/inspiration/01_hero_atmosphaerische_kueche.png'
import waySf from '../assets/images/kuechenwelten/stilfinderhero-kitchen-wide.jpg'
import wayBer from '../assets/images/beratung/cta-light-portal.png'
import sfResult from '../assets/images/kuechenwelten/stilfinderresult-modern-warm.jpg'
import sfCard1 from '../assets/images/kuechenwelten/stilfindercard-modern-warm.jpg'
import sfCard2 from '../assets/images/kuechenwelten/stilfindercard-zeitlos-elegant.jpg'
import sfCard3 from '../assets/images/kuechenwelten/stilfindercard-natuerlich-luxurioes.jpg'
import gKuechen from '../assets/images/inspiration/02_moderne_kueche.png'
import gMat from '../assets/images/inspiration/06_materialien_und_details.png'
import gBer from '../assets/images/ueber-uns/02_why_videko_beratungsszene.png'
import gTech from '../assets/images/inspiration/09_premium_architektur_kueche.png'
import gBesicht from '../assets/images/studio/bilder/01_hero_studio_showroom.png'
import pc1 from '../assets/images/leistungen/ls-consulting.png'
import pc2 from '../assets/images/leistungen/ls-3d.png'
import pc3 from '../assets/images/leistungen/ls-materials.png'
import pc4 from '../assets/images/leistungen/ls-coordination.png'
import pc5 from '../assets/images/leistungen/ls-install.png'
import pc6 from '../assets/images/leistungen/ls-aftercare.png'
import tm1 from '../assets/images/ueber-uns/06_team_beratung_und_planung.png'
import tm2 from '../assets/images/ueber-uns/07_team_marketing_und_social_media.png'
import tm3 from '../assets/images/ueber-uns/08_team_montage_und_handwerk.png'
import tm4 from '../assets/images/ueber-uns/09_team_organisation_und_partner.png'
import j1 from '../assets/images/inspiration/09_premium_architektur_kueche.png'
import j2 from '../assets/images/inspiration/06_materialien_und_details.png'
import j3 from '../assets/images/inspiration/10_favoriten_wohnkueche_luxus.png'
import j4 from '../assets/images/inspiration/03_wohnliche_kueche.png'
import finalImg from '../assets/images/studio/bilder/10_final_cta_studio_banner.png'

const WAYS = [
  { n: '01', title: 'Inspiration finden', text: 'Entdecke Stile, Materialien und Ideen für die Küche, die zu dir passt.', cta: 'Jetzt entdecken', to: '/inspiration', img: wayInsp },
  { n: '02', title: 'Stylefinder starten', text: 'In 2 Minuten zu deiner individuellen Küchenrichtung – ohne Geschmackstest mit Gewinner.', cta: 'Jetzt starten', to: '/stylefinder', img: waySf, light: true },
  { n: '03', title: 'Persönliche Beratung', text: 'Gemeinsam planen wir deine Traumküche – ehrlich und auf Augenhöhe.', cta: 'Termin sichern', to: '/beratung', img: wayBer },
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
  { v: '+87%', l: 'mehr Stauraum' },
  { v: '+3', l: 'Lösungen' },
  { v: '100%', l: 'zufriedene Kunden', sub: 'Basierend auf Kundenprojekten' },
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
  { title: 'Beratung & Planung', role: 'Dein erster Kontakt', img: tm1 },
  { title: 'Marketing & Social', role: 'Macht VIDEKO sichtbar', img: tm2 },
  { title: 'Montage & Handwerk', role: 'Bringt Pläne in den Raum', img: tm3 },
  { title: 'Organisation', role: 'Hält alle Fäden zusammen', img: tm4 },
]

const TEAM_BENEFITS = ['Erfahren & engagiert', 'Kreativ & individuell', 'Verlässlich & transparent', 'Qualität mit Leidenschaft']

const JOURNAL = [
  { tag: 'Trends', title: 'Die 7 Küchentrends, die bleiben', img: j1, to: '/journal/7-kuechenfehler-die-du-spaeter-jeden-tag-bereust' },
  { tag: 'Materialien', title: 'Naturstein in der Küche – zeitlos schön', img: j2, to: '/journal/welche-arbeitsplatte-passt-zu-mir' },
  { tag: 'Projekt', title: 'Urban Luxury in Würzburg', img: j3, to: '/journal/fronten-farben-materialien' },
  { tag: 'Licht', title: 'Beleuchtung in der Küche: So geht Atmosphäre', img: j4, to: '/journal/licht-in-der-kueche' },
]

export default function Home() {
  const [whyActive, setWhyActive] = useState(null)
  return (
    <div className="leist-page home-page">
      <Hero />

      {/* 0 — HERO EXPERIENCE (Before/After + Einstiegskarten + Trust) */}
      <HeroExperience />

      {/* 1 — DREI WEGE */}
      <section className="section section--light lp-ways-sec">
        <div className="container">
          <div className="lp-ways-head">
            <Reveal>
              <span className="kicker">Dein Einstieg</span>
              <h2 className="lp-h2">Dein Weg zur Küche, <span className="grad">die zu dir passt.</span></h2>
              <p className="lp-lead">Drei Wege. Ein Ziel: deine perfekte Küche.</p>
            </Reveal>
          </div>
          <div className="lp-ways">
            {WAYS.map((c, i) => (
              <Reveal key={c.n} delay={i * 0.1}>
                <Link to={c.to} className={`lpway ${c.light ? 'lpway--light' : ''}`}>
                  <span className="lpway__img" style={{ backgroundImage: `url(${c.img})` }} aria-hidden="true" />
                  <span className="lpway__scrim" aria-hidden="true" />
                  <span className="lpway__body">
                    <span className="lpway__n">{c.n}</span>
                    <span className="lpway__title">{c.title}</span>
                    <span className="lpway__text">{c.text}</span>
                    <span className="lpway__cta">{c.cta} <ArrowRight size={15} strokeWidth={2} /></span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 2 — EXPLODING KITCHEN — 3 Varianten zum Vergleich */}
      <div className="ekv-label"><span>Variante 1 · Scroll-Story</span></div>
      <ExplodingKitchenScroll />
      <div className="ekv-label"><span>Variante 2 · Klick-gesteuert (Aufbau wie 1)</span></div>
      <ExplodingKitchen />
      <div className="ekv-label"><span>Variante 3 · Toggle &amp; Modal</span></div>
      <ExplodingKitchenModal />

      {/* 3 — WARUM VIDEKO + STYLEFINDER */}
      <section className="section section--light lp-why-sec">
        <div className="container">
          <div className="lp-why-head">
            <Reveal><span className="kicker">Warum VIDEKO</span><h2 className="lp-h2">Warum VIDEKO <span className="grad">anders plant.</span></h2></Reveal>
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

          <div className="lp-sf">
            <Reveal className="lp-sf__copy">
              <span className="kicker">Stylefinder</span>
              <h3 className="lp-h2">Dein Stil. Deine Küche. <span className="grad">In nur 2 Minuten.</span></h3>
              <p className="lp-lead">Beantworte ein paar Fragen und entdecke deine persönliche Küchenrichtung – verständlich und ohne Verkaufsdruck.</p>
              <CTAButton to="/stylefinder">Stylefinder starten</CTAButton>
            </Reveal>
            <Reveal className="lp-sf__visual" delay={0.12}>
              <div className="lp-tablet">
                <div className="lp-tablet__screen">
                  <span className="lp-tablet__q">Welcher Stil begeistert dich?</span>
                  <span className="lp-tablet__grid" style={{ backgroundImage: `url(${sfResult})` }} aria-hidden="true" />
                </div>
              </div>
              <span className="lp-sf__fly lp-sf__fly--1" style={{ backgroundImage: `url(${sfCard1})` }} aria-hidden="true" />
              <span className="lp-sf__fly lp-sf__fly--2" style={{ backgroundImage: `url(${sfCard2})` }} aria-hidden="true" />
              <span className="lp-sf__fly lp-sf__fly--3" style={{ backgroundImage: `url(${sfCard3})` }} aria-hidden="true" />
              <span className="lp-sf__result">
                <span className="lp-sf__result-k">Dein Ergebnis</span>
                <span className="lp-sf__result-t">Modern Luxury</span>
                <span className="lp-sf__result-m">92% Match</span>
              </span>
            </Reveal>
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
              <span className="lpgal__img" style={{ backgroundImage: `url(${g.img})` }} aria-hidden="true" />
              <span className="lpgal__scrim" aria-hidden="true" />
              <span className="lpgal__body"><span className="lpgal__title">{g.title}</span><span className="lpgal__sub">{g.sub}</span></span>
            </Reveal>
          ))}
        </div>
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
            <video src={verwandleVideo} autoPlay muted loop playsInline preload="metadata" aria-label="Küchen-Transformation von VIDEKO" />
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

      {/* 6 — PROZESS */}
      <section className="section section--light lp-process-sec">
        <div className="container">
          <div className="lp-process-head">
            <Reveal><span className="kicker">Unser Prozess</span><h2 className="lp-h2">Unser Weg zu <span className="grad">deiner Traumküche.</span></h2><p className="lp-lead">Klar, strukturiert, persönlich.</p></Reveal>
          </div>
          <div className="lp-process">
            {PROCESS.map((p, i) => (
              <Reveal key={p.n} className="lpproc" delay={i * 0.07}>
                <span className="lpproc__node"><img src={p.img} alt="" loading="lazy" /></span>
                <span className="lpproc__n">{p.n}</span>
                <span className="lpproc__title">{p.title}</span>
                <span className="lpproc__text">{p.text}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — TEAM */}
      <section className="section section--light lp-team-sec">
        <div className="container">
          <div className="lp-team-head">
            <Reveal><span className="kicker">Das Team</span><h2 className="lp-h2">Menschen, die <span className="grad">Küchen lieben.</span></h2></Reveal>
          </div>
          <div className="lp-team">
            {TEAM.map((t, i) => (
              <Reveal key={t.title} className="lpteam" delay={i * 0.07}>
                <span className="lpteam__img" style={{ backgroundImage: `url(${t.img})` }} aria-hidden="true" />
                <span className="lpteam__scrim" aria-hidden="true" />
                <span className="lpteam__body"><span className="lpteam__title">{t.title}</span><span className="lpteam__role">{t.role}</span></span>
              </Reveal>
            ))}
          </div>
          <div className="lp-team-benefits">
            {TEAM_BENEFITS.map((b, i) => (
              <Reveal key={b} as="span" className="lp-team-benefit" delay={i * 0.05}><Check size={15} strokeWidth={2.4} /> {b}</Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — JOURNAL */}
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
              <Reveal key={a.title} delay={(i % 4) * 0.06}>
                <Link to={a.to} className="lpjcard">
                  <span className="lpjcard__img" style={{ backgroundImage: `url(${a.img})` }} aria-hidden="true" />
                  <span className="lpjcard__body">
                    <span className="lpjcard__tag">{a.tag}</span>
                    <span className="lpjcard__title">{a.title}</span>
                    <span className="lpjcard__cta">Jetzt lesen <ArrowUpRight size={15} strokeWidth={2} /></span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 9 — FINALER CTA (dunkel) */}
      <section className="leist-final home-final">
        <div className="leist-final__media" aria-hidden="true">
          <img src={finalImg} alt="" />
          <div className="leist-final__veil" />
        </div>
        <div className="container leist-final__inner">
          <Reveal>
            <span className="kicker kicker--gold">Bereit?</span>
            <h2 className="leist-final__title">Deine Küche. Dein Zuhause. <span className="grad">Dein Leben.</span></h2>
            <p className="leist-final__text">Vereinbare deinen persönlichen Beratungstermin und erlebe, wie aus Ideen eine Küche wird, die wirklich zu dir passt.</p>
            <div className="leist-final__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/studio" variant="dark">Studio besuchen</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
