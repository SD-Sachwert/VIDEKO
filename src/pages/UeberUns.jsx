import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Handshake, Heart, Gem, Lightbulb, Smile, Wrench, ArrowRight, MapPin, Plus,
  ShieldCheck, Zap, Ruler, UserCheck, BadgeCheck, Ban, Layers, MessageSquare,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CardGrid from '../components/CardGrid.jsx'
import FeatureCard from '../components/FeatureCard.jsx'

import heroDark from '../assets/images/leistungen/ls-feature.png'
import whyImg from '../assets/images/ueber-uns/02_why_videko_beratungsszene.png'
import fVitali from '../assets/images/ueber-uns/05_founder_vitali_placeholder.png'
import fDennis from '../assets/images/ueber-uns/05_founder_dennis_placeholder.png'
import fHeiko from '../assets/images/ueber-uns/05_founder_heiko_placeholder.png'
import tBeratung from '../assets/images/ueber-uns/team-neu/t1.png'
import tMarketing from '../assets/images/ueber-uns/team-neu/t2.png'
import tMontage from '../assets/images/ueber-uns/team-neu/t3.png'
import tSach from '../assets/images/ueber-uns/team-neu/t4.png'
import tPartner from '../assets/images/ueber-uns/team-neu/t5.png'
import tService from '../assets/images/ueber-uns/team-neu/t6.png'
import momentImg from '../assets/images/ueber-uns/10_persoenlicher_kundenmoment.png'
import karteImg from '../assets/images/ueber-uns/karte.png'

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Hertzstra%C3%9Fe%204%2C%2097076%20W%C3%BCrzburg'

const VALUES = [
  { icon: Handshake, title: 'Ehrlich', text: 'Klartext statt Verkaufsmasche. Wir sagen dir auch, was du nicht brauchst.' },
  { icon: Heart, title: 'Persönlich', text: 'Feste Ansprechpartner, die dich und dein Projekt wirklich kennen.' },
  { icon: Gem, title: 'Hochwertig', text: 'Gute Materialien, saubere Verarbeitung. Kein Pfusch, kein Billig-Look.' },
  { icon: Lightbulb, title: 'Durchdacht', text: 'Wir planen mit Kopf – damit deine Küche jeden Tag Sinn ergibt.' },
  { icon: Smile, title: 'Locker', text: 'Hochwertig heißt bei uns nicht steif. Du darfst dich wohlfühlen.' },
  { icon: Wrench, title: 'Alles aus einer Hand', text: 'Auf Wunsch denken wir den ganzen Raum mit und steuern die Gewerke.' },
]

const FOUNDERS = [
  { name: 'Vitali', role: 'Gründer · Vertrieb & Kundenbetreuung', image: fVitali, text: 'Der, der zuhört, bevor er plant. Bei Vitali bist du Mensch, nicht Auftragsnummer.', tags: ['Vertrieb', 'Kontakt', 'Angebote'] },
  { name: 'Dennis', role: 'Gründer · Beratung & Marketing', image: fDennis, text: 'Denkt Küche und Marke zusammen. Holt das Beste aus Raum, Konzept und Auftritt.', tags: ['Beratung', 'Marketing', 'Konzept'] },
  { name: 'Heiko', role: 'Gründer · Technik & Umsetzung', image: fHeiko, text: 'Macht aus Plänen Realität. Aufmaß, Technik, Montage – bei Heiko sitzt jeder Millimeter.', tags: ['Technik', 'Aufmaß', 'Umsetzung'] },
]

const TEAM = [
  { title: 'Beratung & Planung', text: 'Die Menschen, die deine Küche mit dir denken.', image: tBeratung, pos: 'center 26%' },
  { title: 'Marketing & Social Media', text: 'Sorgen dafür, dass man VIDEKO sieht – und versteht.', image: tMarketing, pos: 'center 28%' },
  { title: 'Montage & Handwerk', text: 'Bauen auf, was geplant wurde. Sauber und termintreu.', image: tMontage, pos: 'center 30%' },
  { title: 'Sachbearbeitung & Organisation', text: 'Halten im Hintergrund alle Fäden zusammen.', image: tSach, pos: 'center 28%' },
  { title: 'Partner & Gewerke', text: 'Verlässliche Profis für alles rund um deinen Raum.', image: tPartner, pos: 'center 28%' },
  { title: 'Service & Nachbetreuung', text: 'Bleibt erreichbar, wenn andere schon abgewunken hätten.', image: tService, pos: 'center 26%' },
]

const RULES = [
  { icon: ShieldCheck, title: 'Ehrlich statt Verkaufsdruck', text: 'Wir beraten dich, statt dir was anzudrehen.' },
  { icon: Zap, title: 'Direkt statt kompliziert', text: 'Kurze Wege, klare Worte, schnelle Antworten.' },
  { icon: Ruler, title: 'Sauber geplant', text: 'Erst denken, dann bauen. Bis ins Detail.' },
  { icon: UserCheck, title: 'Persönlich begleitet', text: 'Ein Ansprechpartner – von Anfang bis Ende.' },
  { icon: BadgeCheck, title: 'Zuverlässig umgesetzt', text: 'Was wir zusagen, halten wir auch.' },
  { icon: Ban, title: 'Kein Rabatt-Theater', text: 'Ehrliche Preise statt Schein-Aktionen.' },
  { icon: Layers, title: 'Keine Küche von der Stange', text: 'Maßgeschneidert auf dich, nicht auf den Katalog.' },
  { icon: MessageSquare, title: 'Wir sagen auch mal Nein', text: 'Wenn etwas keinen Sinn ergibt, sagen wir es.' },
]

const REGION = ['Würzburg', 'Tauberbischofsheim', 'Kitzingen', 'Main-Tauber', 'Schweinfurt']

export default function UeberUns() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  return (
    <div className="leist-page about-page">
      {/* HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroDark} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Über uns</span>
            <h1 className="pagehero__title">Wir sind VIDEKO.<br /><span className="grad">Persönlich. Ehrlich. Hochwertig.</span></h1>
            <p className="pagehero__lead">
              Hinter VIDEKO stecken echte Menschen mit einer klaren Haltung: Küche
              kann man auch ohne Rabattgeschrei und Verkaufsdruck machen. Besser sogar.
            </p>
            <div className="pagehero__actions">
              <a className="leist-hero__link" href="#koepfe">Unser Team kennenlernen <ArrowRight size={16} strokeWidth={1.9} /></a>
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WARUM VIDEKO */}
      <section className="section about-why">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__copy">
              <span className="kicker">Warum es VIDEKO gibt</span>
              <h2 className="lintro__title">Weil Küche kaufen<br /><span className="grad">auch Spaß machen darf.</span></h2>
              <p className="lintro__text">
                Wir hatten keine Lust mehr auf Rabattschlachten, Verkaufsdruck und
                anonyme Abfertigung. Also machen wir's anders: ehrliche Beratung,
                saubere Planung und ein Erlebnis, das sich richtig anfühlt – vom
                ersten Hallo bis zur fertigen Küche.
              </p>
              <CTAButton to="/beratung">Lern uns kennen</CTAButton>
            </Reveal>
            <Reveal className="lintro__media" delay={0.08}>
              <div className="lintro__frame"><img src={whyImg} alt="Persönliche Beratung bei VIDEKO" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WOFÜR WIR STEHEN */}
      <section className="section about-values">
        <div className="container">
          <SectionHeader align="center" kicker="Wofür wir stehen" title="Sechs Dinge, auf die du dich verlassen kannst." />
          <CardGrid cols={3}>
            {VALUES.map((v) => (
              <Reveal key={v.title}><FeatureCard icon={v.icon} title={v.title} text={v.text} /></Reveal>
            ))}
          </CardGrid>
        </div>
      </section>

      {/* KÖPFE HINTER VIDEKO */}
      <section className="section about-founders" id="koepfe">
        <div className="container">
          <SectionHeader align="center" kicker="Die Köpfe hinter VIDEKO" title="Drei Gründer, eine Haltung." lead="Echte Menschen, echte Gesichter – kein Stockfoto-Lächeln, sondern die, mit denen du wirklich planst." />
          <div className="founder-grid">
            {FOUNDERS.map((f, i) => (
              <Reveal key={f.name} delay={i * 0.08}>
                <article className="founder">
                  <div className="founder__photo"><img src={f.image} alt={f.name} loading="lazy" /></div>
                  <div className="founder__body">
                    <span className="founder__name">{f.name}</span>
                    <span className="founder__role">{f.role}</span>
                    <p className="founder__text">{f.text}</p>
                    <div className="lchips">{f.tags.map((t) => <span className="lchip" key={t}>{t}</span>)}</div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM — Bento */}
      <section className="section about-team">
        <div className="container">
          <SectionHeader align="center" kicker="Das Team hinter VIDEKO" title="Mehr als nur drei Gründer." lead="Hinter jeder Küche steht ein ganzes Team, das mitdenkt." />
          <div className="teamflip">
            {TEAM.map((t, i) => (
              <Reveal key={t.title} as="div" className="tflip" delay={(i % 3) * 0.06} tabIndex={0} role="button" aria-label={`${t.title} – Details`}>
                <div className="tflip__inner">
                  <div className="tflip__front">
                    <span className="tflip__img" style={{ backgroundImage: `url(${t.image})`, backgroundPosition: t.pos }} aria-hidden="true" />
                    <span className="tflip__scrim" aria-hidden="true" />
                    <span className="tflip__title">{t.title}</span>
                    <span className="tflip__hint" aria-hidden="true"><Plus size={15} strokeWidth={2.4} /></span>
                  </div>
                  <div className="tflip__back">
                    <span className="tflip__bt">{t.title}</span>
                    <span className="tflip__bx">{t.text}</span>
                    <span className="tflip__cue">Teil des VIDEKO-Teams</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SO ARBEITEN WIR — Spielregeln (hell) */}
      <section className="section section--light about-principles">
        <div className="container">
          <SectionHeader align="center" kicker="So arbeiten wir" title={<>Unsere Spielregeln. <span className="grad">Ganz einfach.</span></>} lead="Kein Kleingedrucktes, kein Verkaufstheater – einfach, wie wir mit dir arbeiten." />
          <div className="about-rules">
            {RULES.map((r, i) => (
              <Reveal key={r.title} className="rule-card" delay={(i % 4) * 0.05}>
                <span className="rule-card__n">{String(i + 1).padStart(2, '0')}</span>
                <span className="rule-card__ic"><r.icon size={20} strokeWidth={1.6} /></span>
                <span className="rule-card__title">{r.title}</span>
                <span className="rule-card__text">{r.text}</span>
              </Reveal>
            ))}
          </div>
          <Reveal className="about-rules__quote">
            <p>„Wir planen nicht für den Prospekt.<br /><span className="grad">Wir planen für deinen Alltag.“</span></p>
          </Reveal>
        </div>
      </section>

      {/* WAS DU MERKEN SOLLST */}
      <section className="section about-moment">
        <div className="container">
          <div className="lintro">
            <Reveal className="lintro__media">
              <div className="lintro__frame"><img src={momentImg} alt="Persönlicher Moment mit Kund:innen" loading="lazy" /><span className="lintro__rim" aria-hidden="true" /></div>
            </Reveal>
            <Reveal className="lintro__copy" delay={0.08}>
              <span className="kicker">Was du bei uns merken sollst</span>
              <h2 className="lintro__title">Du merkst sofort,<br /><span className="grad">dass wir's ernst meinen.</span></h2>
              <p className="lintro__text">
                Dass wir zuhören. Dass wir mitdenken. Dass wir uns Zeit nehmen und
                hochwertig arbeiten – ohne dabei steif oder abgehoben zu wirken.
                Einfach normal. Einfach gut.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* REGION / WÜRZBURG */}
      <section className="section about-region">
        <div className="container">
          <div className="standort__grid">
            <Reveal className="standort__info">
              <span className="kicker">Aus Würzburg, für die Region</span>
              <h2 className="lintro__title">Mittendrin statt<br /><span className="grad">nur dabei.</span></h2>
              <p className="lintro__text">Wir sitzen in Würzburg und planen Küchen für die Menschen aus der Region – nah dran, gut erreichbar und persönlich betreut. Bei uns landest du nicht in einer Warteschleife, sondern bei einem festen Ansprechpartner, der dein Projekt kennt.</p>
              <p className="lintro__text">Ob aus Würzburg, dem Umland oder ein bisschen weiter weg: Wir nehmen uns Zeit, kommen vorbei, wenn es Sinn ergibt, und bleiben auch nach der Montage erreichbar. Kein anonymer Küchen-Konzern, kein Callcenter – sondern echte Menschen mit Namen, Gesicht und Verantwortung.</p>
            </Reveal>
            <Reveal className="standort__map" delay={0.08}>
              <div className="mapcard mapcard--clean">
                <img src={karteImg} alt="Standort VIDEKO in Würzburg" loading="lazy" />
                <span className="mapcard__pin" aria-hidden="true"><MapPin size={20} strokeWidth={2} /></span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ABSCHLUSS-CTA */}
      <section className="section section--dark leist-final2">
        <div className="container">
          <Reveal className="lfinal">
            <h2 className="lfinal__title">Genug von uns.<br /><span className="grad">Jetzt bist du dran.</span></h2>
            <p className="lfinal__text">Lass uns deine Küche planen – ehrlich, persönlich und auf Augenhöhe.</p>
            <div className="lfinal__actions">
              <CTAButton to="/beratung">Beratung anfragen</CTAButton>
              <CTAButton to="/studio" variant="dark">Studio entdecken</CTAButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
