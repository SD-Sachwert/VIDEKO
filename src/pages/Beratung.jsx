import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone, Check, ArrowRight, Compass, PhoneCall, Store, ChevronDown, ShieldCheck } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import heroImg from '../assets/images/leistungen/ls-hero.png'
import cIdee from '../assets/images/beratung/story-idee.png'
import cPlanung from '../assets/images/beratung/story-richtung.png'
import cKueche from '../assets/images/beratung/story-kueche.png'

const ANLIEGEN = ['Rückruf', 'Studio-Termin', 'Ich habe erst mal Fragen']
const KUECHENART = ['Zeile', 'L-Küche', 'U-Küche', 'Insel', 'Noch offen']
const STATUS = ['Neubau', 'Renovierung', 'Austausch', 'Erstmal Ideen sammeln']
const ZEIT = ['So schnell wie möglich', 'In 1–3 Monaten', 'In 3–6 Monaten', 'Später']
const BUDGET = ['bis 12.500 €', '12.500–18.000 €', '18.000–25.000 €', '25.000–40.000 €', '40.000 €+', 'Noch offen']
const GRUNDRISS = ['Ja', 'Nein']

const ENTRIES = [
  { icon: Compass, title: 'Ich will erst mal grob planen', text: 'Du hast Ideen, aber noch keinen fertigen Plan? Perfekt. Genau dafür ist der Stylefinder da.', cta: 'Stylefinder starten', to: '/stylefinder' },
  { icon: PhoneCall, title: 'Ich will einen Rückruf', text: 'Kurz anfragen, wir melden uns persönlich. Ohne Callcenter-Gelaber.', cta: 'Rückruf anfragen', anliegen: 'Rückruf' },
  { icon: Store, title: 'Ich will direkt ins Studio', text: 'Wenn du schon konkreter bist, planen wir direkt den nächsten sinnvollen Schritt.', cta: 'Termin anfragen', anliegen: 'Studio-Termin' },
]

const ABLAUF = [
  'Wir schauen uns deine Angaben an.',
  'Wir melden uns persönlich.',
  'Wir klären, wo du gerade stehst.',
  'Wir planen den nächsten sinnvollen Schritt.',
  'Du entscheidest in Ruhe.',
]

const STORY = [
  { title: 'Aus Idee wird Richtung', text: 'Wir finden deinen Stil. Klar und inspirierend.', img: cIdee },
  { title: 'Aus Richtung wird Planung', text: 'Aus Maßen und Ideen wird ein konkreter Plan.', img: cPlanung },
  { title: 'Aus Planung wird Küche', text: 'Deine Küche. Für jeden Tag gemacht.', img: cKueche },
]

function Chip({ active, onClick, children }) {
  return <button type="button" className={`bf-chip ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active}>{active && <Check size={13} strokeWidth={2.8} />} {children}</button>
}

export default function Beratung() {
  const heroRef = useRef(null)
  const formRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  const [sent, setSent] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [f, setF] = useState({ anliegen: '', kueche: '', status: '', zeit: '', budget: '', grundriss: '' })
  const set = (k, v) => setF((p) => ({ ...p, [k]: p[k] === v ? '' : v }))

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => formRef.current?.querySelector('input')?.focus(), 600)
  }
  const pick = (anliegen) => { if (anliegen) setF((p) => ({ ...p, anliegen })); scrollToForm() }

  useEffect(() => {
    if (window.location.hash === '#anfrage-formular') {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [])

  return (
    <div className="leist-page">
      {/* HERO */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Beratung anfragen</span>
            <h1 className="pagehero__title">Erzähl uns groß,<br /><span className="grad">wir sortieren den Rest.</span></h1>
            <p className="pagehero__lead">
              Keine Hotline. Kein Rabatt-Gebrüll. Kein Küchenlatein mit 47 Abkürzungen. Nur ehrliche
              Beratung, klare nächste Schritte und eine Küche, die zu deinem Leben passt.
            </p>
            <div className="pagehero__actions">
              <button type="button" className="btn btn--primary btn--lg" onClick={scrollToForm}>
                <span className="btn__shimmer" aria-hidden="true" /><span className="btn__label">Anfrage starten</span>
              </button>
              <Link className="leist-hero__link" to="/stylefinder">Erst Stylefinder machen <ArrowRight size={16} strokeWidth={1.9} /></Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* INTRO */}
      <section className="section beratung-intro">
        <div className="container">
          <Reveal>
            <h2 className="bintro__title">Du musst noch nicht <span className="grad">alles wissen.</span></h2>
            <p className="bintro__text">Ein paar Ideen, ein grobes Ziel oder einfach nur der Wunsch nach Veränderung reichen völlig aus. Wir helfen dir, daraus etwas zu machen, das wirklich zu dir passt.</p>
          </Reveal>
          {/* DREI EINSTIEGS-KARTEN */}
          <div className="bf-entries">
            {ENTRIES.map((e, i) => (
              <Reveal key={e.title} className="bf-entry" delay={(i % 3) * 0.07}>
                <span className="bf-entry__ic"><e.icon size={22} strokeWidth={1.6} /></span>
                <span className="bf-entry__title">{e.title}</span>
                <span className="bf-entry__text">{e.text}</span>
                {e.to
                  ? <Link className="bf-entry__btn" to={e.to}>{e.cta} <ArrowRight size={15} strokeWidth={1.9} /></Link>
                  : <button type="button" className="bf-entry__btn" onClick={() => pick(e.anliegen)}>{e.cta} <ArrowRight size={15} strokeWidth={1.9} /></button>}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + INFO */}
      <section className="section beratung2" id="anfrage-formular" ref={formRef}>
        <div className="container">
          <div className="bf">
            <Reveal className="bf-form">
              <form onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
                <h2 className="bf-form__title">Kurz reicht. <span className="grad">Wirklich.</span></h2>
                <p className="bf-form__sub">Wir brauchen keinen Küchen-Essay. Ein paar Infos genügen.</p>

                <div className="contact__row">
                  <label className="field"><span>Name *</span><input type="text" required placeholder="Dein Name" /></label>
                  <label className="field"><span>Telefon *</span><input type="tel" required placeholder="Für den Rückruf" /></label>
                </div>
                <label className="field"><span>E-Mail *</span><input type="email" required placeholder="name@beispiel.de" /></label>

                <div className="bf-group">
                  <span className="bf-label">Dein Anliegen</span>
                  <div className="bf-chips">{ANLIEGEN.map((o) => <Chip key={o} active={f.anliegen === o} onClick={() => set('anliegen', o)}>{o}</Chip>)}</div>
                </div>

                <label className="field"><span>Nachricht</span><textarea rows={4} placeholder="Ein Satz reicht. Roman geht auch. Wir urteilen nicht." /></label>

                <button type="button" className="bf-toggle" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails}>
                  Mehr Details angeben (optional) <ChevronDown size={16} strokeWidth={2} className={showDetails ? 'is-open' : ''} />
                </button>
                <AnimatePresence initial={false}>
                  {showDetails && (
                    <motion.div className="bf-details" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                      <div className="bf-group"><span className="bf-label">Küchenart</span><div className="bf-chips">{KUECHENART.map((o) => <Chip key={o} active={f.kueche === o} onClick={() => set('kueche', o)}>{o}</Chip>)}</div></div>
                      <div className="bf-group"><span className="bf-label">Projektstatus</span><div className="bf-chips">{STATUS.map((o) => <Chip key={o} active={f.status === o} onClick={() => set('status', o)}>{o}</Chip>)}</div></div>
                      <div className="bf-group"><span className="bf-label">Zeitplan</span><div className="bf-chips">{ZEIT.map((o) => <Chip key={o} active={f.zeit === o} onClick={() => set('zeit', o)}>{o}</Chip>)}</div></div>
                      <div className="bf-group"><span className="bf-label">Budgetrahmen</span><div className="bf-chips">{BUDGET.map((o) => <Chip key={o} active={f.budget === o} onClick={() => set('budget', o)}>{o}</Chip>)}</div></div>
                      <div className="bf-group"><span className="bf-label">Grundriss vorhanden?</span><div className="bf-chips">{GRUNDRISS.map((o) => <Chip key={o} active={f.grundriss === o} onClick={() => set('grundriss', o)}>{o}</Chip>)}</div></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button className="btn btn--primary btn--lg bf-submit" type="submit">
                  <span className="btn__shimmer" aria-hidden="true" /><span className="btn__label">Anfrage absenden</span>
                </button>
                <p className="bf-trust"><ShieldCheck size={14} strokeWidth={1.8} /> Deine Daten sind sicher. Kein Spam, kein Weiterverkauf.</p>
                {sent && <p className="contact__ok" role="status">Anfrage ist raus. Wir melden uns persönlich – kein Bot, kein Küchen-Orakel.<br /><em>(Demo-Formular – Versand wird später angebunden.)</em></p>}
              </form>
            </Reveal>

            <Reveal className="bf-aside" delay={0.08}>
              <div className="bf-ablauf">
                <span className="kicker kicker--gold">Was nach deiner Anfrage passiert</span>
                <ol className="bf-steps">
                  {ABLAUF.map((s, i) => <li key={i}><span className="bf-steps__n">{i + 1}</span><span>{s}</span></li>)}
                </ol>
                <div className="bf-contact">
                  <h3>VIDEKO Küchen eG</h3>
                  <ul>
                    <li><MapPin size={16} strokeWidth={1.7} /> <span>Hertzstraße 4, 97076 Würzburg</span></li>
                    <li><Mail size={16} strokeWidth={1.7} /> <a href="mailto:info@videko-kuechen.de">info@videko-kuechen.de</a></li>
                    <li><Phone size={16} strokeWidth={1.7} /> <a href="tel:+491605545818">0160 5545818</a></li>
                  </ul>
                  <p className="bf-contact__note">Kein Druck. Kein Küchenbasar. Nur ehrliche Planung.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* DREI BILDKARTEN */}
      <section className="section beratung-story">
        <div className="container">
          <div className="bstory">
            {STORY.map((s, i) => (
              <Reveal key={s.title} className="bstory-card" delay={(i % 3) * 0.06}>
                <span className="bstory-card__img" style={{ backgroundImage: `url(${s.img})` }} aria-hidden="true" />
                <span className="bstory-card__body">
                  <span className="bstory-card__title">{s.title}</span>
                  <span className="bstory-card__text">{s.text}</span>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
