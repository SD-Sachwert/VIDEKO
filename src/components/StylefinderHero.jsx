import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ShieldCheck, Sparkles, Clock, Award } from 'lucide-react'

import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'
import { KiHinweis } from './legal/KiKennzeichnung.jsx'
import inspImg from '../assets/images/stylefinder-sec/insp.webp'
import berImg from '../assets/images/stylefinder-sec/ber.webp'
import resultImg from '../assets/images/stylefinder-sec/result.webp'
import o1 from '../assets/images/stylefinder-sec/o1.webp'
import o2 from '../assets/images/stylefinder-sec/o2.webp'
import o3 from '../assets/images/stylefinder-sec/o3.webp'
import o4 from '../assets/images/stylefinder-sec/o4.webp'

const OPTIONS = [
  { img: o1, t: 'Modern Luxury' },
  { img: o2, t: 'Warm Natural' },
  { img: o3, t: 'Purist Minimal' },
  { img: o4, t: 'Classic Elegant' },
]

const TRUST = [
  { icon: ShieldCheck, t: '100% unverbindlich', d: 'Ohne Verpflichtungen' },
  { icon: Sparkles, t: 'Für deinen Stil', d: 'Individuell & persönlich' },
  { icon: Clock, t: '2 Minuten Zeit', d: 'Schnell & unkompliziert' },
  { icon: Award, t: 'Durchdachte Planung', d: 'Persönlich statt von der Stange' },
]

function SideCard({ img, title, text, cta, to, active }) {
  return (
    <div className={`sfc sfc--side ${active ? 'is-active' : ''}`}>
      <span className="sfc__media"><img src={img} alt="" loading="lazy" /></span>
      <span className="sfc__body">
        <span className="sfc__title">{title}</span>
        <span className="sfc__text">{text}</span>
        <Link to={to} className="sfc__cta" onClick={(e) => { if (!active) e.preventDefault() }}>{cta} <ArrowRight size={15} strokeWidth={2} /></Link>
      </span>
    </div>
  )
}

function StyleCard({ active }) {
  const [opt, setOpt] = useState(0)
  return (
    <div className={`sfc sfc--main ${active ? 'is-active' : ''}`}>
      <span className="sfc__label">Empfohlener erster Schritt</span>
      <span className="sfc__title sfc__title--main">Stylefinder starten</span>
      <span className="sfc__text">Beantworte 7 kurze Fragen und wir sagen dir, welche Küche zu dir passt – bevor du dich in 14 Beigetönen verlierst.</span>
      <div className="sfq">
        <span className="sfq__prog">Frage 1 von 7</span>
        <span className="sfq__q">Welche Atmosphäre spricht dich am meisten an?</span>
        <div className="sfq__opts">
          {OPTIONS.map((o, i) => (
            <button key={o.t} type="button" className={`sfq__opt ${opt === i ? 'is-sel' : ''}`} onClick={() => setOpt(i)}>
              <span className="sfq__optimg" style={{ backgroundImage: `url(${o.img})` }} aria-hidden="true" />
              <span className="sfq__optlabel">{o.t}{opt === i && <Check size={13} strokeWidth={3} />}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="sfresult">
        <span className="sfresult__img" style={{ backgroundImage: `url(${resultImg})` }} aria-hidden="true" />
        <span className="sfresult__body">
          <span className="sfresult__k">Voraussichtliches Ergebnis</span>
          <span className="sfresult__t">Modern Luxury – 92% Match</span>
          <span className="sfresult__d">Zeitlos. Edel. Individuell.</span>
        </span>
        <span className="sfresult__badge">92%<i>Match</i></span>
      </div>
      <div className="sfc__ctawrap"><CTAButton to="/stylefinder" size="md">Jetzt Stylefinder starten <ArrowRight size={16} strokeWidth={2} /></CTAButton></div>
      <span className="sfc__quip"><Clock size={13} strokeWidth={1.9} /> Dauert kürzer als drei Stunden planlos Küchen googeln.</span>
      <div className="sfc__micro"><span><Check size={13} strokeWidth={2.6} /> Kostenlos</span><span><Check size={13} strokeWidth={2.6} /> ca. 2 Minuten</span><span><Check size={13} strokeWidth={2.6} /> Ohne Registrierung</span></div>
    </div>
  )
}

export default function StylefinderHero() {
  const [active, setActive] = useState(1) // 0 insp, 1 stylefinder, 2 beratung

  return (
    <section className="section section--light sfsec">
      <div className="container">
        <Reveal className="sfsec__head">
          <span className="kicker">Dein Einstieg</span>
          <h2 className="lp-h2">Womit möchtest du <span className="grad">starten?</span></h2>
          <p className="lp-lead">Inspiration sammeln, deinen Stil finden oder direkt persönlich beraten lassen – such dir deinen Weg aus.</p>
        </Reveal>

        <Reveal as="div" className={`sfsec__row sf-a${active}`}>
          <div className={`sfslot ${active === 0 ? 'is-clickable' : 'is-clickable'}`} onClick={() => setActive(0)} role="button" tabIndex={0}>
            <SideCard img={inspImg} title="Inspiration finden" text="Entdecke Stile, Materialien und Ideen für Küchen, die zu dir passen." cta="Ideen ansehen" to="/inspiration" active={active === 0} />
          </div>
          <div className="sfslot sfslot--center" onClick={() => setActive(1)}>
            <StyleCard active={active === 1} />
          </div>
          <div className="sfslot is-clickable" onClick={() => setActive(2)} role="button" tabIndex={0}>
            <SideCard img={berImg} title="Persönliche Beratung" text="Gemeinsam planen wir deine Küche – ehrlich, persönlich und auf Augenhöhe." cta="Beratung anfragen" to="/beratung" active={active === 2} />
          </div>
        </Reveal>

        <div className="sfsec__trust">
          {TRUST.map((t, i) => (
            <Reveal key={t.t} as="div" className="sftrust" delay={i * 0.05}>
              <span className="sftrust__ic"><t.icon size={18} strokeWidth={1.7} /></span>
              <span className="sftrust__b"><span className="sftrust__t">{t.t}</span><span className="sftrust__d">{t.d}</span></span>
            </Reveal>
          ))}
        </div>
        <KiHinweis
          className="vnc__ainote"
          variant="section-notice"
          text="Bild- und Ergebnisdarstellungen sind KI-generierte Symbolbilder; abgebildete Personen sind nicht real. Das Stylefinder-Ergebnis dient nur der Veranschaulichung."
        />
      </div>
    </section>
  )
}
