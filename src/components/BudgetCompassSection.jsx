import { useState } from 'react'
import {
  Compass, Eye, Sparkles, CalendarCheck,
  HandCoins, Gem, PencilRuler, ShieldCheck, ArrowRight,
} from 'lucide-react'

import Reveal from './Reveal.jsx'
import MagneticButton from './MagneticButton.jsx'

import bgStone from '../assets/images/planung/budget/budget-bg-stone-texture.jpg'
import segEntry from '../assets/images/planung/budget/segment-entry-12-15k.jpg'
import segPremium from '../assets/images/planung/budget/segment-premium-18-25k.jpg'
import segExclusive from '../assets/images/planung/budget/segment-exclusive-25-35k.jpg'
import segLuxury from '../assets/images/planung/budget/segment-luxury-35k-plus.jpg'

// showcase (5 tiers × 4 example kitchens, 16:9)
import b01 from '../assets/images/planung/budget/showcase/showcase-5000-12500-01.jpg'
import b02 from '../assets/images/planung/budget/showcase/showcase-5000-12500-02.jpg'
import b03 from '../assets/images/planung/budget/showcase/showcase-5000-12500-03.jpg'
import b04 from '../assets/images/planung/budget/showcase/showcase-5000-12500-04.jpg'
import e01 from '../assets/images/planung/budget/showcase/showcase-12000-15000-01.jpg'
import e02 from '../assets/images/planung/budget/showcase/showcase-12000-15000-02.jpg'
import e03 from '../assets/images/planung/budget/showcase/showcase-12000-15000-03.jpg'
import e04 from '../assets/images/planung/budget/showcase/showcase-12000-15000-04.jpg'
import p01 from '../assets/images/planung/budget/showcase/showcase-18000-25000-01.jpg'
import p02 from '../assets/images/planung/budget/showcase/showcase-18000-25000-02.jpg'
import p03 from '../assets/images/planung/budget/showcase/showcase-18000-25000-03.jpg'
import p04 from '../assets/images/planung/budget/showcase/showcase-18000-25000-04.jpg'
import x01 from '../assets/images/planung/budget/showcase/showcase-25000-35000-01.jpg'
import x02 from '../assets/images/planung/budget/showcase/showcase-25000-35000-02.jpg'
import x03 from '../assets/images/planung/budget/showcase/showcase-25000-35000-03.jpg'
import x04 from '../assets/images/planung/budget/showcase/showcase-25000-35000-04.jpg'
import l01 from '../assets/images/planung/budget/showcase/showcase-35000-plus-01.jpg'
import l02 from '../assets/images/planung/budget/showcase/showcase-35000-plus-02.jpg'
import l03 from '../assets/images/planung/budget/showcase/showcase-35000-plus-03.jpg'
import l04 from '../assets/images/planung/budget/showcase/showcase-35000-plus-04.jpg'

// Single source of truth for budget tiers.
// `compass` is set only for the four tiers shown on the dial (pos + needle angle + segment image).
// The lowest tier (Basis) is reachable via the tier pills below the compass.
const TIERS = [
  {
    key: 'basis', range: '5.000–12.500 €', label: 'Basis',
    text: 'Schöne, funktionale Küchen für kleinere Grundrisse und smarte Budgets.',
    images: [b01, b02, b03, b04], compass: null,
  },
  {
    key: 'einstieg', range: '12.000–15.000 €', label: 'Einstieg',
    text: 'Solide Qualität, durchdachtes Design und mehr Gestaltungsfreiheit.',
    images: [e01, e02, e03, e04], compass: { pos: 'left', angle: -90, image: segEntry },
  },
  {
    key: 'premium', range: '18.000–25.000 €', label: 'Premium',
    text: 'Hochwertige Materialien, individuelle Planung und starke Wohnlichkeit.',
    images: [p01, p02, p03, p04], compass: { pos: 'top', angle: 0, image: segPremium },
  },
  {
    key: 'exklusiv', range: '25.000–35.000 €', label: 'Exklusiv',
    text: 'Designstarke Küchen mit mehr Raumwirkung, Komfort und Materialtiefe.',
    images: [x01, x02, x03, x04], compass: { pos: 'right', angle: 90, image: segExclusive },
  },
  {
    key: 'luxus', range: '35.000 €+', label: 'Luxus',
    text: 'Maßarbeit ohne Kompromisse, hochwertige Materialien und klare Statement-Küchen.',
    images: [l01, l02, l03, l04], compass: { pos: 'bottom', angle: 180, image: segLuxury },
  },
]

const COMPASS = TIERS.filter((t) => t.compass)
const SHOWCASE_FORMS = ['Moderne Inselküche', 'L-Küche', 'Wohnküche', 'Designküche']

const STEPS = [
  { n: '01', icon: Compass, label: 'Budget wählen' },
  { n: '02', icon: Eye, label: 'Möglichkeiten sehen' },
  { n: '03', icon: Sparkles, label: 'Inspiration erhalten' },
  { n: '04', icon: CalendarCheck, label: 'Beratung buchen' },
]

const TRUST = [
  { icon: HandCoins, label: 'Faire Preise' },
  { icon: Gem, label: 'Beste Qualität' },
  { icon: PencilRuler, label: 'Individuelle Planung' },
  { icon: ShieldCheck, label: 'Langfristige Werte' },
]

const STATS = [
  { pre: 'Seit', value: '2008', post: 'für dich da' },
  { pre: 'Über', value: '1.250', post: 'Küchen realisiert' },
  { pre: 'Mehr als', value: '25', post: 'Auszeichnungen' },
]

export default function BudgetCompassSection() {
  const [activeKey, setActiveKey] = useState('premium')
  const active = TIERS.find((t) => t.key === activeKey)
  const needleAngle = active.compass ? active.compass.angle : 0
  const onCompass = Boolean(active.compass)

  return (
    <section className="budget" id="budget">
      <div className="budget__bg" style={{ backgroundImage: `url(${bgStone})` }} aria-hidden="true" />

      <div className="container budget__inner">
        {/* hero: copy + compass */}
        <div className="budget__hero">
          <Reveal className="budget__copy">
            <span className="kicker">Dein Budget, deine Möglichkeiten</span>
            <h2 className="budget__title">
              Was kostet<br />eine gute Küche<br /><span className="grad">wirklich?</span>
            </h2>
            <p className="budget__lead">
              Transparenz schafft Vertrauen. Unser Budget-Kompass hilft dir,
              realistische Erwartungen zu setzen und die perfekte Küche für dein
              Budget zu finden.
            </p>
            <MagneticButton as="a" href="#budget-showcase">Kompass starten</MagneticButton>
            <span className="budget__hint">
              <Compass size={15} strokeWidth={1.7} /> Vertrauen durch Transparenz
            </span>
          </Reveal>

          <Reveal className="budget__compass-wrap" delay={0.1}>
            <div className="compass">
              <div className="compass__ring" aria-hidden="true" />
              <div className="compass__dial">
                {COMPASS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`cseg cseg--${t.compass.pos} ${t.key === activeKey ? 'cseg--active' : ''}`}
                    style={{ backgroundImage: `url(${t.compass.image})` }}
                    onClick={() => setActiveKey(t.key)}
                    aria-label={`${t.range} ${t.label}`}
                    aria-pressed={t.key === activeKey}
                  >
                    <span className="cseg__tint" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="compass__divider" aria-hidden="true" />

              <div className="compass__labels" aria-hidden="true">
                {COMPASS.map((t) => (
                  <span
                    key={t.key}
                    className={`clabel clabel--${t.compass.pos} ${t.key === activeKey ? 'clabel--active' : ''}`}
                  >
                    <span className="clabel__range">{t.range.replace(' €', '')}</span>
                    <span className="clabel__name">{t.label}</span>
                  </span>
                ))}
              </div>

              <div
                className="compass__needle"
                style={{ transform: `rotate(${needleAngle}deg)`, opacity: onCompass ? 1 : 0.25 }}
                aria-hidden="true"
              />
              <div className="compass__hub" aria-hidden="true" />
            </div>
          </Reveal>
        </div>

        {/* steps */}
        <Reveal className="budget__steps">
          {STEPS.map((s, i) => (
            <div className="bstep" key={s.n}>
              <span className="bstep__icon" aria-hidden="true">
                <s.icon size={20} strokeWidth={1.5} />
              </span>
              <span className="bstep__n">{s.n}</span>
              <span className="bstep__label">{s.label}</span>
              {i < STEPS.length - 1 && <span className="bstep__line" aria-hidden="true" />}
            </div>
          ))}
        </Reveal>

        {/* budget showcase */}
        <Reveal className="budget__showcase" id="budget-showcase">
          <div className="showcase__head">
            <div className="showcase__intro">
              <span className="kicker">Küchenbeispiele in deiner Budgetspanne</span>
              <h3 className="showcase__title">
                {active.range} <span className="showcase__tier">· {active.label}</span>
              </h3>
              <p className="showcase__text">{active.text}</p>
            </div>
            <div className="showcase__tiers" role="tablist" aria-label="Budgetstufe">
              {TIERS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`tierpill ${t.key === activeKey ? 'tierpill--active' : ''}`}
                  onClick={() => setActiveKey(t.key)}
                  role="tab"
                  aria-selected={t.key === activeKey}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="showcase__grid" key={activeKey}>
            {active.images.map((img, idx) => (
              <article className="showcard" key={img}>
                <span className="showcard__img" style={{ backgroundImage: `url(${img})` }} aria-hidden="true" />
                <span className="showcard__scrim" aria-hidden="true" />
                <span className="showcard__edge" aria-hidden="true" />
                <span className="showcard__meta">{SHOWCASE_FORMS[idx]}</span>
              </article>
            ))}
          </div>

          <a className="showcase__cta" href="/beratung">
            <span>Beratung zu diesem Budget buchen</span>
            <ArrowRight size={16} strokeWidth={2} />
          </a>
        </Reveal>

        {/* trust strip */}
        <Reveal className="budget__trust">
          <h3 className="budget__trust-title">Ehrlich, transparent,<br />auf Augenhöhe.</h3>
          <div className="budget__trust-grid">
            {TRUST.map((t) => (
              <div className="btrust" key={t.label}>
                <span className="btrust__icon" aria-hidden="true">
                  <t.icon size={20} strokeWidth={1.5} />
                </span>
                <span className="btrust__label">{t.label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* bottom band */}
        <Reveal className="budget__bottom">
          <div className="budget__bottom-lead">
            <span className="btrust__icon" aria-hidden="true">
              <CalendarCheck size={20} strokeWidth={1.5} />
            </span>
            <div>
              <span className="budget__bottom-title">Persönliche Beratung</span>
              <span className="budget__bottom-sub">Seit 2008 für dich da</span>
            </div>
          </div>
          <div className="budget__stats">
            {STATS.map((s) => (
              <div className="bstat" key={s.value}>
                <span className="bstat__pre">{s.pre}</span>
                <span className="bstat__value">{s.value}</span>
                <span className="bstat__post">{s.post}</span>
              </div>
            ))}
          </div>
          <a className="budget__bottom-cta" href="/beratung">
            <span>Termin vereinbaren</span>
            <ArrowRight size={17} strokeWidth={2} />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
