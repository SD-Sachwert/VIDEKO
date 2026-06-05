import { Clock, Check, Sparkles, Palette, Wallet, MessageSquare, ArrowUpRight, BadgeCheck, Lightbulb, Gem, ShieldCheck, Home as HomeIcon, ChefHat, SlidersHorizontal, Users, Heart, Sofa, KeyRound, Building2 } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import CTAButton from '../components/CTAButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import CardGrid from '../components/CardGrid.jsx'
import FeatureCard from '../components/FeatureCard.jsx'
import StylefinderWizard from '../components/StylefinderWizard.jsx'

import heroPoster from '../assets/images/kuechenwelten/stilfinderhero-kitchen-wide.jpg'
import imgFamily from '../assets/images/kuechenwelten/stilfinderresult-modern-warm.jpg'
import imgOpen from '../assets/images/shared/hero-kitchen-arch.jpg'
import imgSmall from '../assets/images/kuechenwelten/stilfindercard-zeitlos-elegant.jpg'
import imgPremium from '../assets/images/shared/hero-videko-final-16x9.png'
import imgWarm from '../assets/images/kuechenwelten/stilfinderresult-natuerlich-luxurioes.jpg'
import imgPuristic from '../assets/images/kuechenwelten/stilfindercard-modern-warm.jpg'
import faqKitchen from '../assets/images/kuechenwelten/stilfinderhero-kitchen-wide.jpg'

const STEPS5 = [
  { n: '01', label: 'Raum', icon: HomeIcon },
  { n: '02', label: 'Alltag', icon: ChefHat },
  { n: '03', label: 'Stil', icon: Sparkles },
  { n: '04', label: 'Prioritäten', icon: SlidersHorizontal },
  { n: '05', label: 'Budget', icon: Wallet },
]

const WHY = [
  { icon: Palette, title: 'Stil erkennen', text: 'Finde heraus, welche Designsprache wirklich zu dir passt.' },
  { icon: Wallet, title: 'Budget einordnen', text: 'Bekomm ein realistisches Gefühl für deinen Rahmen.' },
  { icon: MessageSquare, title: 'Beratung vorbereiten', text: 'Geh ins Gespräch mit klaren Vorstellungen.' },
]
const WHY_TRUST = ['Ehrliche Orientierung', 'Schneller Einstieg', 'Bessere Planungsgespräche']

const INSPIRATION = [
  { name: 'Moderne Familienküche', text: 'Robust, offen und für den Alltag gemacht.', budget: 'ab 18.000 €', image: imgFamily },
  { name: 'Offene Wohnküche', text: 'Küche und Wohnraum als eine Einheit.', budget: 'ab 22.000 €', image: imgOpen },
  { name: 'Kleine Küche groß gedacht', text: 'Clevere Lösungen für jeden Zentimeter.', budget: 'ab 10.000 €', image: imgSmall },
  { name: 'Premiumküche mit Insel', text: 'Statement-Architektur mit Materialtiefe.', budget: 'ab 35.000 €', image: imgPremium },
  { name: 'Warme Wohnküche', text: 'Holz, weiche Töne, echte Geborgenheit.', budget: 'ab 20.000 €', image: imgWarm },
  { name: 'Puristisch grifflos', text: 'Reduziert, klar und zeitlos elegant.', budget: 'ab 16.000 €', image: imgPuristic },
]
const INSP_TRUST = [
  { icon: Sparkles, t: 'Echte Orientierung' },
  { icon: Gem, t: 'Individuell geplant' },
  { icon: Wallet, t: 'Transparente Budgets' },
  { icon: MessageSquare, t: 'Beratung auf Augenhöhe' },
]

const LIFE = [
  { icon: Users, title: 'Für Familien', text: 'Robust, praktisch und mit Platz für alle, die mitkochen.' },
  { icon: Heart, title: 'Für Paare', text: 'Stilvoll, kompakt und gemacht für gemeinsame Abende.' },
  { icon: HomeIcon, title: 'Für kleine Wohnungen', text: 'Clevere Lösungen, die jeden Zentimeter nutzen.' },
  { icon: ChefHat, title: 'Für Hobbyköche', text: 'Profi-Ergonomie, beste Geräte und echte Arbeitsfläche.' },
  { icon: Sofa, title: 'Für offene Wohnküchen', text: 'Küche und Wohnraum, die zu einer Einheit verschmelzen.' },
  { icon: KeyRound, title: 'Für Vermieter & Mietobjekte', text: 'Langlebig, wertstabil und wirtschaftlich geplant.' },
  { icon: Building2, title: 'Für Premium-Neubauten', text: 'Architektonisch integriert, kompromisslos in Qualität.' },
]

const WHY_NOT_PLAN = [
  { icon: MessageSquare, title: 'Persönliche Beratung', text: 'Der echte Feinschliff passiert im Gespräch.' },
  { icon: Lightbulb, title: 'Kreative Planung', text: 'Dein Raum bekommt eine individuelle Lösung.' },
  { icon: BadgeCheck, title: 'Aufmaß vor Ort', text: 'Millimetergenau statt geschätzt.' },
  { icon: ShieldCheck, title: 'Verbindliche Qualität', text: 'Geprüft, sauber, termintreu umgesetzt.' },
]
const FAQ = [
  { q: 'Ist der Stylefinder kostenlos?', a: 'Ja, vollständig kostenlos und unverbindlich – ohne Registrierung.' },
  { q: 'Muss ich danach einen Termin buchen?', a: 'Nein. Du entscheidest, ob und wann du ins Gespräch gehen möchtest.' },
  { q: 'Wie genau ist die Budgetspanne?', a: 'Sie ist eine ehrliche Orientierung. Den finalen Preis bestimmt deine konkrete Planung.' },
  { q: 'Kann ich das Ergebnis speichern?', a: 'Du kannst dir dein Küchenprofil bequem per E-Mail zusenden lassen.' },
  { q: 'Kann ich einen Grundriss hochladen?', a: 'Ja, im Ergebnis-Formular kannst du Grundriss, Fotos oder Skizzen anhängen.' },
  { q: 'Funktioniert das auch für kleine Küchen?', a: 'Absolut. Gerade kleine Räume profitieren von durchdachter Planung.' },
]

export default function Stylefinder() {
  return (
    <div className="sfpage">
      {/* HERO */}
      <section className="sfhero">
        <div className="sfhero__media" aria-hidden="true">
          <img className="sfhero__video" src={heroPoster} alt="" />
          <div className="sfhero__veil" />
        </div>
        <div className="container sfhero__inner">
          <Reveal className="sfhero__copy">
            <span className="kicker kicker--gold">Küchen für Menschen mit Anspruch</span>
            <h1 className="sfhero__title">Welche Küche passt <span className="grad">wirklich</span> zu dir?</h1>
            <p className="sfhero__lead">
              Unser Stylefinder führt dich in wenigen Schritten zu deiner
              persönlichen Küchen-Richtung – ehrlich, unverbindlich und ganz ohne
              Verkaufsdruck.
            </p>
            <div className="sfhero__pills">
              <span className="sfpill"><Clock size={14} strokeWidth={1.9} /> ca. 2 Minuten</span>
              <span className="sfpill"><Check size={14} strokeWidth={2.2} /> unverbindlich</span>
              <span className="sfpill"><Sparkles size={14} strokeWidth={1.9} /> keine Registrierung</span>
            </div>
            <div className="sfhero__actions">
              <CTAButton href="#sf-wizard">Stylefinder starten</CTAButton>
              <CTAButton to="/beratung" variant="dark">Direkt Beratung buchen</CTAButton>
            </div>
          </Reveal>
          <Reveal className="sfhero__shot" delay={0.1}>
            <div className="sfhero__frame">
              <img src={heroPoster} alt="VIDEKO Premiumküche" />
              <span className="sfhero__rim" aria-hidden="true" />
            </div>
          </Reveal>
        </div>

        <div className="container sfhero__steps">
          <span className="sfhero__steps-title">Dein Stylefinder in 5 Schritten</span>
          <div className="sfministep">
            {STEPS5.map((s) => (
              <div className="sfmini" key={s.n}>
                <span className="sfmini__icon"><s.icon size={18} strokeWidth={1.6} /></span>
                <span className="sfmini__n">{s.n}</span>
                <span className="sfmini__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WARUM */}
      <section className="sfwhy">
        <div className="container sfwhy__inner">
          <Reveal className="sfwhy__lead">
            <span className="kicker">Warum der Stylefinder</span>
            <h2 className="sfwhy__title">Klarheit, bevor<br />du planst.</h2>
            <p>Drei gute Gründe, warum sich die zwei Minuten lohnen – für dich und für ein besseres Beratungsgespräch.</p>
          </Reveal>
          <div className="sfwhy__cards">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.06} className="sfwhycard">
                <span className="sfwhycard__icon"><w.icon size={22} strokeWidth={1.5} /></span>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="container sfwhy__trust">
          {WHY_TRUST.map((t) => (
            <span key={t} className="sfwhy__trust-item"><Check size={15} strokeWidth={2.3} /> {t}</span>
          ))}
        </div>
      </section>

      {/* WIZARD */}
      <section className="sfwizardwrap">
        <div className="container">
          <StylefinderWizard />
        </div>
      </section>

      {/* INSPIRATION */}
      <section className="sfinsp">
        <div className="container">
          <Reveal as="header" className="sec-head sec-head--center">
            <span className="kicker">Inspiration</span>
            <h2 className="sec-head__title">Küchenprofile als Inspiration</h2>
            <p className="sec-head__lead">Sechs typische Richtungen – vielleicht ist deine schon dabei.</p>
          </Reveal>
          <div className="sfinsp__grid">
            {INSPIRATION.map((c, i) => (
              <Reveal key={c.name} delay={(i % 3) * 0.06}>
                <article className="sfinspcard">
                  <span className="sfinspcard__img" style={{ backgroundImage: `url(${c.image})` }} aria-hidden="true" />
                  <span className="sfinspcard__scrim" aria-hidden="true" />
                  <span className="sfinspcard__body">
                    <span className="sfinspcard__name">{c.name}</span>
                    <span className="sfinspcard__text">{c.text}</span>
                    <span className="sfinspcard__foot">
                      <span className="sfinspcard__budget">{c.budget}</span>
                      <span className="sfinspcard__arrow"><ArrowUpRight size={17} strokeWidth={1.8} /></span>
                    </span>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="sfinsp__trust">
            {INSP_TRUST.map((x) => (
              <span key={x.t} className="sfinsp__trust-item"><x.icon size={18} strokeWidth={1.5} /> {x.t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* KÜCHEN FÜR IHR ECHTES LEBEN */}
      <section className="sflife">
        <div className="container">
          <SectionHeader
            kicker="Lebenssituationen"
            title="Küchen für dein echtes Leben."
            lead="Jede Lebenssituation hat ihre eigene ideale Küche. Hier findest du deinen Ausgangspunkt."
          />
          <CardGrid cols={4}>
            {LIFE.map((l) => (
              <Reveal key={l.title}>
                <FeatureCard icon={l.icon} title={l.title} text={l.text} />
              </Reveal>
            ))}
          </CardGrid>
          <div className="section__cta">
            <CTAButton to="/beratung">Diesen Stil planen lassen</CTAButton>
          </div>
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="sffaq">
        <div className="container sffaq__top">
          <Reveal className="sffaq__why">
            <h2 className="sffaq__title">Warum der Stylefinder<br /><span className="grad">keine Planung ersetzt.</span></h2>
            <div className="sffaq__mini">
              {WHY_NOT_PLAN.map((w) => (
                <div className="sffaqmini" key={w.title}>
                  <span className="sffaqmini__icon"><w.icon size={20} strokeWidth={1.5} /></span>
                  <div>
                    <span className="sffaqmini__t">{w.title}</span>
                    <span className="sffaqmini__d">{w.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="sffaq__list" delay={0.06}>
            <span className="kicker">Häufige Fragen</span>
            <h3 className="sffaq__list-title">Häufige Fragen zum Stylefinder</h3>
            {FAQ.map((f) => (
              <details className="sfacc" key={f.q}>
                <summary>{f.q}<span className="sfacc__plus" aria-hidden="true">+</span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </Reveal>
        </div>

        <div className="container">
          <div className="sffinal">
            <div className="sffinal__media">
              <img src={faqKitchen} alt="" loading="lazy" />
              <div className="sffinal__veil" aria-hidden="true" />
            </div>
            <div className="sffinal__body">
              <h3>Lass uns dein Ergebnis gemeinsam in eine <span className="grad">echte Küche</span> übersetzen.</h3>
              <p>Aus Orientierung wird Planung – persönlich, ehrlich und auf höchstem Niveau.</p>
              <div className="sffinal__actions">
                <CTAButton to="/beratung">Planungsgespräch buchen</CTAButton>
                <CTAButton href="#sf-wizard" variant="dark">Zurück zum Stylefinder</CTAButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
