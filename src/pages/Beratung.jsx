import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { MapPin, Mail, Phone, Check, ArrowRight } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import heroImg from '../assets/images/leistungen/ls-hero.png'

const KUECHENART = ['Zeile', 'L-Küche', 'U-Küche', 'Insel', 'Noch offen']
const STATUS = ['Neubau', 'Renovierung', 'Austausch', 'Erstmal Ideen sammeln']
const ZEIT = ['So schnell wie möglich', 'In 1–3 Monaten', 'In 3–6 Monaten', 'Später']
const GRUNDRISS = ['Ja', 'Nein']
const BUDGET = ['bis 12.500 €', '12.500–18.000 €', '18.000–25.000 €', '25.000–40.000 €', '40.000 €+', 'Noch offen']
const WICHTIG = ['Stauraum', 'Design', 'Familienalltag', 'Kochen', 'Geräte', 'Pflegeleicht', 'Preisrahmen', 'Die alte Küche nervt einfach']

const ABLAUF = [
  'Wir schauen uns deine Angaben in Ruhe an.',
  'Wir melden uns persönlich – kein Callcenter.',
  'Wir klären gemeinsam, wo du gerade stehst.',
  'Wenn es passt, vereinbaren wir einen Termin im Studio.',
  'Du bekommst keine Standardantwort, sondern eine ehrliche Einschätzung.',
]

function Chip({ active, onClick, children }) {
  return <button type="button" className={`bf-chip ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active}>{active && <Check size={13} strokeWidth={2.8} />} {children}</button>
}

export default function Beratung() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.16])

  const [sent, setSent] = useState(false)
  const [f, setF] = useState({ kueche: '', status: '', zeit: '', grundriss: '', budget: '', wichtig: [] })
  const set = (k, v) => setF((p) => ({ ...p, [k]: p[k] === v ? '' : v }))
  const toggleW = (v) => setF((p) => ({ ...p, wichtig: p.wichtig.includes(v) ? p.wichtig.filter((x) => x !== v) : [...p.wichtig, v] }))

  return (
    <div className="leist-page">
      {/* HERO (dark) */}
      <section className="pagehero leist-hero" ref={heroRef}>
        <div className="pagehero__media" aria-hidden="true">
          <motion.img src={heroImg} alt="" className="pagehero__img" style={{ y: imgY, scale: imgScale }} />
          <div className="pagehero__veil" />
        </div>
        <div className="container pagehero__inner">
          <Reveal>
            <span className="kicker kicker--gold">Beratung anfragen</span>
            <h1 className="pagehero__title">Erzähl uns grob,<br /><span className="grad">was du vorhast.</span></h1>
            <p className="pagehero__lead">
              Du musst noch nicht alles wissen. Kein Callcenter, kein Küchenbasar, kein Rabatt-Gebrüll –
              wir melden uns persönlich und bringen Struktur rein.
            </p>
            <div className="pagehero__actions">
              <a className="leist-hero__link" href="#anfrage">Zum Formular <ArrowRight size={16} strokeWidth={1.9} /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FORM + ABLAUF */}
      <section className="section beratung2" id="anfrage">
        <div className="container">
          <div className="bf">
            {/* FORM */}
            <Reveal className="bf-form">
              <form onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
                <h2 className="bf-form__title">Deine Anfrage</h2>
                <p className="bf-form__sub">Schnell ausgefüllt – und für uns Gold wert, um dich gut zu beraten.</p>

                <div className="contact__row">
                  <label className="field"><span>Name *</span><input type="text" required placeholder="Dein Name" /></label>
                  <label className="field"><span>E-Mail *</span><input type="email" required placeholder="name@beispiel.de" /></label>
                </div>
                <label className="field"><span>Telefon *</span><input type="tel" required placeholder="Für den persönlichen Rückruf" /></label>

                <div className="bf-group">
                  <span className="bf-label">Küchenart</span>
                  <div className="bf-chips">{KUECHENART.map((o) => <Chip key={o} active={f.kueche === o} onClick={() => set('kueche', o)}>{o}</Chip>)}</div>
                </div>

                <div className="bf-group">
                  <span className="bf-label">Projektstatus</span>
                  <div className="bf-chips">{STATUS.map((o) => <Chip key={o} active={f.status === o} onClick={() => set('status', o)}>{o}</Chip>)}</div>
                  <span className="bf-hint">Auch „keine Ahnung" ist ein gültiger Startpunkt.</span>
                </div>

                <div className="bf-group">
                  <span className="bf-label">Zeitplan</span>
                  <div className="bf-chips">{ZEIT.map((o) => <Chip key={o} active={f.zeit === o} onClick={() => set('zeit', o)}>{o}</Chip>)}</div>
                </div>

                <div className="bf-group">
                  <span className="bf-label">Was ist dir wichtig? <em>(mehrere möglich)</em></span>
                  <div className="bf-chips">{WICHTIG.map((o) => <Chip key={o} active={f.wichtig.includes(o)} onClick={() => toggleW(o)}>{o}</Chip>)}</div>
                </div>

                <div className="contact__row">
                  <div className="bf-group">
                    <span className="bf-label">Grundriss vorhanden?</span>
                    <div className="bf-chips">{GRUNDRISS.map((o) => <Chip key={o} active={f.grundriss === o} onClick={() => set('grundriss', o)}>{o}</Chip>)}</div>
                  </div>
                  <div className="bf-group">
                    <span className="bf-label">Budgetrahmen <em>(optional)</em></span>
                    <div className="bf-chips">{BUDGET.map((o) => <Chip key={o} active={f.budget === o} onClick={() => set('budget', o)}>{o}</Chip>)}</div>
                    <span className="bf-hint">Keine Falle. Hilft nur, realistisch zu planen.</span>
                  </div>
                </div>

                <label className="field"><span>Nachricht</span><textarea rows={4} placeholder="Ein Satz reicht. Roman geht auch. Wir urteilen nicht." /></label>

                <label className="bf-dsgvo">
                  <input type="checkbox" required />
                  <span>Ich bin einverstanden, dass meine Angaben zur Kontaktaufnahme verarbeitet werden. <em>(DSGVO)</em></span>
                </label>

                <button className="btn btn--primary btn--lg" type="submit">
                  <span className="btn__shimmer" aria-hidden="true" />
                  <span className="btn__label">Anfrage absenden</span>
                </button>

                {sent && <p className="contact__ok" role="status">Anfrage ist raus. Wir melden uns persönlich – kein Bot, kein Küchen-Orakel.<br /><em>(Demo-Formular – Versand wird später angebunden.)</em></p>}
              </form>
            </Reveal>

            {/* ABLAUF / KONTAKT (sticky) */}
            <Reveal className="bf-aside" delay={0.08}>
              <div className="bf-ablauf">
                <span className="kicker kicker--gold">Was passiert nach deiner Anfrage?</span>
                <ol className="bf-steps">
                  {ABLAUF.map((s, i) => (
                    <li key={i}><span className="bf-steps__n">{i + 1}</span><span>{s}</span></li>
                  ))}
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
    </div>
  )
}
