import { Link } from 'react-router-dom'
import { ArrowRight, PenTool, Telescope, Heart, Gem, LifeBuoy } from 'lucide-react'

import Hero from '../components/Hero.jsx'
import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'

import way1 from '../assets/images/home/way-1.png'
import way2 from '../assets/images/home/way-2.png'
import way3 from '../assets/images/home/way-3.png'
import g1 from '../assets/images/home/studio-g1.png'
import g2 from '../assets/images/home/studio-g2.png'
import g3 from '../assets/images/home/studio-g3.png'
import g4 from '../assets/images/home/studio-g4.png'
import g5 from '../assets/images/home/studio-g5.png'
import baImg from '../assets/images/home/transform-before-after.png'
import sfVisual from '../assets/images/home/sf-visual.png'
import procStrip from '../assets/images/home/process-strip.png'
import tm1 from '../assets/images/home/team-1.png'
import tm2 from '../assets/images/home/team-2.png'
import tm3 from '../assets/images/home/team-3.png'
import tm4 from '../assets/images/home/team-4.png'
import jr1 from '../assets/images/home/journal-1.png'
import jr2 from '../assets/images/home/journal-2.png'
import jr3 from '../assets/images/home/journal-3.png'
import jr4 from '../assets/images/home/journal-4.png'
import finalImg from '../assets/images/studio/bilder/10_final_cta_studio_banner.png'

const WAYS = [
  { img: way1, to: '/inspiration' },
  { img: way2, to: '/stylefinder' },
  { img: way3, to: '/beratung' },
]

const TECH = [
  { title: 'Arbeitsplatte', text: 'Premium-Materialien, exakt für deinen Alltag.' },
  { title: 'Unterkonstruktion', text: 'Verdeckte Tragstruktur für volle Stabilität.' },
  { title: 'Intelligente Technik', text: 'Vernetzt und durchdacht – wo sie Sinn ergibt.' },
  { title: 'Maßgefertigte Schubladen', text: 'Jeder Zentimeter sinnvoll genutzt.' },
  { title: 'Soft-Close System', text: 'Leise schließen statt knallen. Jeden Tag.' },
  { title: 'Beleuchtungskonzept', text: 'Arbeits-, Stimmungs- und Akzentlicht im Zusammenspiel.' },
]

const WHY = [
  { icon: PenTool, title: 'Design mit Haltung', text: 'Klare Linien, warme Materialien – kein Effekt um des Effekts willen.' },
  { icon: Telescope, title: 'Technik mit Weitblick', text: 'Lösungen, die auch in zehn Jahren noch Sinn ergeben.' },
  { icon: Heart, title: 'Persönlich & ehrlich', text: 'Echte Beratung auf Augenhöhe statt Verkaufsshow.', highlight: true },
  { icon: Gem, title: 'Qualität ohne Kompromisse', text: 'Materialien und Verarbeitung, die man täglich spürt.' },
  { icon: LifeBuoy, title: 'Service, der bleibt', text: 'Auch nach dem Aufbau ein verlässlicher Ansprechpartner.' },
]

const GALLERY = [g1, g2, g3, g4, g5]

const STATS = [
  { v: '+87%', l: 'mehr Stauraum' },
  { v: '+3', l: 'Lösungen' },
  { v: '100%', l: 'zufriedene Kunden', sub: 'Basierend auf Kundenprojekten' },
]

const TEAM = [tm1, tm2, tm3, tm4]
const TEAM_BENEFITS = ['Erfahren & engagiert', 'Kreativ & individuell', 'Verlässlich & transparent', 'Qualität mit Leidenschaft']

const JOURNAL = [
  { img: jr1, to: '/journal/7-kuechenfehler-die-du-spaeter-jeden-tag-bereust' },
  { img: jr2, to: '/journal/welche-arbeitsplatte-passt-zu-mir' },
  { img: jr3, to: '/journal/fronten-farben-materialien' },
  { img: jr4, to: '/journal/licht-in-der-kueche' },
]

export default function Home() {
  return (
    <div className="leist-page home-page">
      <Hero />

      {/* 1 — DREI WEGE */}
      <section className="section section--light lp2-sec">
        <div className="container lp2-row lp2-row--3">
          <Reveal className="lp2-head">
            <span className="kicker">Dein Einstieg</span>
            <h2 className="lp-h2">Dein Weg zur Küche, <span className="grad">die zu dir passt.</span></h2>
            <p className="lp-lead">Drei Wege. Ein Ziel: deine perfekte Küche.</p>
            <Link to="/beratung" className="lp-link">Jetzt starten <ArrowRight size={15} strokeWidth={2} /></Link>
          </Reveal>
          <div className="lp2-tiles lp2-tiles--ways">
            {WAYS.map((c, i) => (
              <Reveal key={i} delay={i * 0.1}><Link to={c.to} className="lp2-tile"><img src={c.img} alt="" loading="lazy" /></Link></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 2 — TECHNIK */}
      <section className="section section--light lp2-tech-sec">
        <div className="container lp2-tech">
          <Reveal className="lp2-tech__left">
            <span className="kicker">Unter der Oberfläche</span>
            <h2 className="lp-h2">Technik, die man nicht sieht. <span className="grad">Qualität, die man spürt.</span></h2>
            <p className="lp-lead">Wir planen Küchen bis ins kleinste Detail. Durchdacht, langlebig, perfekt aufeinander abgestimmt – Qualität, die man spürt, statt sieht.</p>
            <Link to="/leistungen" className="lp-link">Mehr über unsere Qualität <ArrowRight size={15} strokeWidth={2} /></Link>
          </Reveal>
          <div className="lp2-tech__callouts">
            {TECH.map((t, i) => (
              <Reveal key={t.title} as="div" className="lp-callout" delay={i * 0.06}>
                <span className="lp-callout__dot" aria-hidden="true" />
                <span className="lp-callout__title">{t.title}</span>
                <span className="lp-callout__text">{t.text}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — WARUM VIDEKO + STYLEFINDER */}
      <section className="section section--light lp2-why-sec">
        <div className="container">
          <Reveal className="lp2-head lp2-head--block">
            <span className="kicker">Warum VIDEKO</span>
            <h2 className="lp-h2">Warum VIDEKO <span className="grad">anders plant.</span></h2>
          </Reveal>
          <div className="lp-why">
            {WHY.map((b, i) => (
              <Reveal key={b.title} className={`lpwhy ${b.highlight ? 'lpwhy--hl' : ''}`} delay={i * 0.06}>
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
              <img src={sfVisual} alt="VIDEKO Stylefinder – dein Ergebnis: Modern Luxury" loading="lazy" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4 — STUDIO GALERIE */}
      <section className="section section--light lp2-sec">
        <div className="container lp2-row lp2-row--5">
          <Reveal className="lp2-head">
            <span className="kicker">Studio Würzburg</span>
            <h2 className="lp-h2">Erlebe unser Studio <span className="grad">in Würzburg.</span></h2>
            <p className="lp-lead">Tausend Bilder ersetzen kein echtes Raumgefühl. Komm vorbei und lass dich inspirieren.</p>
            <CTAButton to="/studio">Studio virtuell erleben</CTAButton>
          </Reveal>
          <div className="lp2-tiles lp2-tiles--gallery">
            {GALLERY.map((img, i) => (
              <Reveal key={i} delay={(i % 5) * 0.05}><Link to="/studio" className="lp2-tile"><img src={img} alt="" loading="lazy" /></Link></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — TRANSFORMATION */}
      <section className="section section--light lp2-transform-sec">
        <div className="container lp2-transform">
          <Reveal className="lp2-transform__copy">
            <span className="kicker">Vorher / Nachher</span>
            <h2 className="lp-h2">Verwandle deinen Raum <span className="grad">in etwas Besonderes.</span></h2>
            <p className="lp-lead">Mit durchdachtem Design und sauberer Planung wird aus einem Raum zum Ankommen mehr.</p>
            <Link to="/vorher-nachher" className="lp-link">Mehr Transformationen <ArrowRight size={15} strokeWidth={2} /></Link>
          </Reveal>
          <Reveal className="lp2-transform__ba" delay={0.1}><img src={baImg} alt="Vorher / Nachher einer VIDEKO Küche" loading="lazy" /></Reveal>
          <div className="lp2-transform__stats">
            {STATS.map((s, i) => (
              <Reveal key={s.l} className="lpstat" delay={i * 0.08}>
                <span className="lpstat__v grad">{s.v}</span>
                <span className="lpstat__l">{s.l}</span>
                {s.sub && <span className="lpstat__sub">{s.sub}</span>}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — PROZESS */}
      <section className="section section--light lp2-process-sec">
        <div className="container">
          <Reveal className="lp2-head lp2-head--block">
            <span className="kicker">Unser Prozess</span>
            <h2 className="lp-h2">Unser Weg zu <span className="grad">deiner Traumküche.</span></h2>
            <p className="lp-lead">Klar, strukturiert, persönlich.</p>
          </Reveal>
          <Reveal className="lp2-process__strip" delay={0.08}><img src={procStrip} alt="Der VIDEKO Prozess in sechs Schritten" loading="lazy" /></Reveal>
        </div>
      </section>

      {/* 7 — TEAM */}
      <section className="section section--light lp2-sec">
        <div className="container lp2-row lp2-row--4">
          <Reveal className="lp2-head">
            <span className="kicker">Das Team</span>
            <h2 className="lp-h2">Menschen, die <span className="grad">Küchen lieben.</span></h2>
            <p className="lp-lead">Hinter jeder Küche steht ein ganzes Team, das mitdenkt.</p>
            <Link to="/ueber-uns" className="lp-link">Mehr über uns <ArrowRight size={15} strokeWidth={2} /></Link>
          </Reveal>
          <div className="lp2-tiles lp2-tiles--team">
            {TEAM.map((img, i) => (
              <Reveal key={i} delay={i * 0.07}><Link to="/ueber-uns" className="lp2-tile"><img src={img} alt="" loading="lazy" /></Link></Reveal>
            ))}
          </div>
        </div>
        <div className="container lp-team-benefits">
          {TEAM_BENEFITS.map((b, i) => (
            <Reveal key={b} as="span" className="lp-team-benefit" delay={i * 0.05}><span className="lp-team-benefit__dot" /> {b}</Reveal>
          ))}
        </div>
      </section>

      {/* 8 — JOURNAL */}
      <section className="section section--light lp2-sec">
        <div className="container lp2-row lp2-row--4">
          <Reveal className="lp2-head">
            <span className="kicker">Journal</span>
            <h2 className="lp-h2">Inspiration & Wissen <span className="grad">für deine Küche.</span></h2>
            <p className="lp-lead">Entdecke Tipps, Trends und spannende Projekte in unserem Journal.</p>
            <CTAButton to="/journal" variant="dark">Zum Journal</CTAButton>
          </Reveal>
          <div className="lp2-tiles lp2-tiles--journal">
            {JOURNAL.map((a, i) => (
              <Reveal key={i} delay={(i % 4) * 0.06}><Link to={a.to} className="lp2-tile"><img src={a.img} alt="" loading="lazy" /></Link></Reveal>
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
