import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Upload, Lock, Save, Copy,
  RefreshCw, Loader2, X,
} from 'lucide-react'

import CTAButton from '../CTAButton.jsx'
import { EMPTY_ANSWERS, PROFILES, computeResult, computeLeadScore } from './stylefinderLogic.js'

import sModern from '../../assets/images/kuechenwelten/stilfindercard-modern-warm.jpg'
import sNatur from '../../assets/images/kuechenwelten/stilfindercard-natuerlich-luxurioes.jpg'
import sDunkel from '../../assets/images/kuechenwelten/stilfindercard-dunkel-dramatisch.jpg'
import sHell from '../../assets/images/kuechenwelten/stilfindercard-zeitlos-elegant.jpg'
import sLandhaus from '../../assets/images/inspiration/03_wohnliche_kueche.png'
import sIndustrial from '../../assets/images/kuechenwelten/stilfindercard-industrial-premium.jpg'

import pKompakt from '../../assets/images/inspiration/08_kleine_kueche_clever_geplant.png'
import pMiet from '../../assets/images/inspiration/02_moderne_kueche.png'
import pSolide from '../../assets/images/inspiration/05_helle_kueche.png'
import pFamilie from '../../assets/images/inspiration/03_wohnliche_kueche.png'
import pWarm from '../../assets/images/kuechenwelten/stilfinderresult-natuerlich-luxurioes.jpg'
import pHobby from '../../assets/images/inspiration/07_kueche_mit_insel.png'
import pPremium from '../../assets/images/kuechenwelten/stilfinderresult-dunkel-dramatisch.jpg'
import pArch from '../../assets/images/kuechenwelten/stilfinderresult-industrial-premium.jpg'

import mNaturstein from '../../assets/images/materialien/cards/material-card-naturstein.png'
import mHolz from '../../assets/images/materialien/cards/material-card-holz.png'
import mMetall from '../../assets/images/materialien/cards/material-card-metall.png'
import mKeramik from '../../assets/images/materialien/cards/material-card-keramik.png'
import mGlas from '../../assets/images/materialien/cards/material-card-glas.png'
import mLack from '../../assets/images/materialien/cards/material-card-lack-matt.png'
import mBronze from '../../assets/images/materialien/cards/material-card-bronze.png'

const STYLE_OPTIONS = [
  { label: 'Modern & grifflos', img: sModern }, { label: 'Warm & natürlich', img: sNatur },
  { label: 'Dunkel & elegant', img: sDunkel }, { label: 'Hell & zeitlos', img: sHell },
  { label: 'Landhaus modern', img: sLandhaus }, { label: 'Statement / Industrial', img: sIndustrial },
]
const LIVING = ['Alleine', 'Zu zweit', 'Familie', 'WG / gemeinschaftliches Wohnen', 'Mietwohnung', 'Eigentum', 'Neubau', 'Renovierung / Bestand', 'Vermietung / Mietobjekt', 'Ferienwohnung / Apartment']
const PROJECTS = ['Küchenzeile', 'L-Küche', 'U-Küche', 'Küche mit Insel', 'offene Wohnküche', 'kleine Küche / Apartmentküche', 'Austausch bestehender Küche', 'komplette Neuplanung', 'nur Orientierung / noch unsicher']
const ASSEMBLY = ['Komplettservice durch VIDEKO', 'Lieferung + Montage', 'Lieferung ohne Montage', 'Selbstmontage geplant', 'Vermieter-/Objektlösung mit pragmatischer Umsetzung', 'Ich weiß es noch nicht']
const BUDGETS = ['bis 3.000 €', '3.000–5.000 €', '5.000–12.500 €', '12.500–18.000 €', '18.000–25.000 €', '25.000–40.000 €', '40.000 €+', 'noch unsicher']
const PRIORITIES = [
  { key: 'preis', label: 'Preis / Budget einhalten' }, { key: 'pflege', label: 'Pflegeleicht' },
  { key: 'arbeit', label: 'Arbeitsfläche' }, { key: 'stauraum', label: 'Stauraum' },
  { key: 'geraete', label: 'Gerätequalität' }, { key: 'design', label: 'Optik / Design' },
  { key: 'robust', label: 'Robustheit' }, { key: 'schnell', label: 'Schnelle Umsetzung' },
]
const USAGE = ['schnelle Alltagsküche', 'viel Kochen / Hobbykoch', 'Familie mit viel Stauraum', 'selten genutzt / Mietobjekt', 'repräsentative Wohnküche', 'pflegeleicht und robust', 'kleine Wohnung / wenig Platz', 'offene Küche mit Wohnbereich']
const UPLOAD_TYPES = ['Grundriss', 'Maße', 'Raumfotos', 'bestehendes Angebot', 'Inspirationsbilder', 'Bauplan']

const PROFILE_IMG = { kompakt: pKompakt, miet: pMiet, solide: pSolide, familie: pFamilie, warm: pWarm, hobby: pHobby, premium: pPremium, architektur: pArch }
const PROFILE_MAT = {
  kompakt: [mLack, mHolz], miet: [mLack, mKeramik], solide: [mLack, mNaturstein, mHolz], familie: [mLack, mKeramik, mHolz],
  warm: [mHolz, mNaturstein, mKeramik], hobby: [mNaturstein, mMetall, mHolz], premium: [mNaturstein, mMetall, mBronze], architektur: [mNaturstein, mMetall, mGlas],
}

function Chip({ active, onClick, children, disabled }) {
  return (
    <button type="button" className={`sf-chip ${active ? 'is-active' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={active}>
      {active && <Check size={14} strokeWidth={2.6} />} {children}
    </button>
  )
}

function Slider({ label, value, onChange }) {
  return (
    <div className="sf-slider">
      <div className="sf-slider__top"><span>{label}</span><span className="sf-slider__val">{value}/5</span></div>
      <input type="range" min="1" max="5" value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ '--p': `${((value - 1) / 4) * 100}%` }} />
    </div>
  )
}

export default function StylefinderFlow() {
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [a, setA] = useState(EMPTY_ANSWERS)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)
  const [displayScore, setDisplayScore] = useState(0)
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [copied, setCopied] = useState(false)
  const [contact, setContact] = useState({ firstName: '', lastName: '', email: '', phone: '', postalCodeCity: '', preferredContact: 'E-Mail', message: '', privacyAccepted: false, marketingConsent: false })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const flowTop = useRef(null)
  const uploadRef = useRef(null)

  const toggle = (key, value, max) => setA((prev) => {
    const arr = prev[key]
    if (arr.includes(value)) return { ...prev, [key]: arr.filter((x) => x !== value) }
    if (max && arr.length >= max) return prev
    return { ...prev, [key]: [...arr, value] }
  })
  const set = (key, value) => setA((prev) => ({ ...prev, [key]: value }))
  const setPrio = (key, value) => setA((prev) => ({ ...prev, priorities: { ...prev.priorities, [key]: value } }))

  const STEPS = ['Stil', 'Wohnen', 'Projekt', 'Umsetzung', 'Budget', 'Prioritäten', 'Alltag']
  const valid = [
    a.styleSelections.length >= 1 && a.styleSelections.length <= 2,
    a.living.length >= 1,
    a.projectType !== '',
    a.assembly !== '',
    a.budgetRange !== '',
    true,
    a.usage.length >= 1,
  ]
  const isLast = step === STEPS.length - 1

  const goTo = (i) => { if (i <= maxReached) { setStep(i); scrollTop() } }
  const next = () => {
    if (!valid[step]) return
    if (isLast) { finish(); return }
    const n = step + 1
    setStep(n); setMaxReached((m) => Math.max(m, n)); scrollTop()
  }
  const back = () => { if (step > 0) { setStep(step - 1); scrollTop() } }
  const scrollTop = () => flowTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  function finish() {
    setResult(computeResult(a)); setShowResult(true)
    setTimeout(() => flowTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  useEffect(() => {
    if (!showResult || !result) return
    let raf, start
    const tick = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / 1100)
      setDisplayScore(Math.round(result.score * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [showResult, result])

  const addFiles = (list) => setFiles((prev) => [...prev, ...Array.from(list).map((f) => ({ name: f.name, size: f.size, type: f.type }))])
  const removeFile = (i) => setFiles((prev) => prev.filter((_, k) => k !== i))

  // live preview helpers
  const topPriority = PRIORITIES.reduce((best, p) => (a.priorities[p.key] > a.priorities[best.key] ? p : best), PRIORITIES[0])
  const liveItems = [
    { k: 'Stil', v: a.styleSelections[0] || '—' },
    { k: 'Wohnen', v: a.living[0] || '—' },
    { k: 'Budget', v: a.budgetRange || '—' },
    { k: 'Wichtig', v: a.priorities[topPriority.key] >= 4 ? topPriority.label : '—' },
  ]

  const contactValid = contact.firstName && contact.lastName && /\S+@\S+\.\S+/.test(contact.email) && contact.postalCodeCity && contact.privacyAccepted

  async function submitStylefinderLead(payload) {
    // TODO: connect to the real VIDEKO lead endpoint / mail service (no backend yet).
    // eslint-disable-next-line no-console
    console.info('[stylefinder lead]', payload)
    await new Promise((r) => setTimeout(r, 800))
    return { ok: true }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!contactValid || submitting) return
    setSubmitting(true); setSubmitError('')
    const payload = { ...a, resultType: result?.type, resultScore: result?.score, leadScore: computeLeadScore(a, files.length > 0), uploadedFiles: files, contact }
    try {
      const res = await submitStylefinderLead(payload)
      res?.ok ? setSent(true) : setSubmitError('Das hat leider nicht geklappt. Bitte versuch es noch einmal.')
    } catch {
      setSubmitError('Verbindung fehlgeschlagen. Bitte versuch es noch einmal oder ruf uns an.')
    } finally { setSubmitting(false) }
  }

  function copySummary() {
    const P = PROFILES[result.type]
    const txt = `VIDEKO Stylefinder – ${P.name} (${result.score}% Match)\nBudget: ${P.budget}\nForm: ${P.form}\nStil: ${a.styleSelections.join(', ')}\nMaterial: ${P.material}\nGeräte: ${P.appliances}\nUmsetzung: ${P.assembly}`
    navigator.clipboard?.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }

  /* ---------------- RESULT + UPLOAD + CONTACT ---------------- */
  if (showResult && result) {
    const P = PROFILES[result.type]
    if (sent) {
      return (
        <div className="sf-wrap" ref={flowTop}>
          <div className="sf-sent">
            <span className="sf-sent__badge"><Check size={26} strokeWidth={2.4} /></span>
            <h2 className="sf-sent__title">Deine Einschätzung ist unterwegs.</h2>
            <p className="sf-sent__text">Wir schauen uns das an und melden uns mit klarem Blick statt Küchenlatein.</p>
            <CTAButton to="/inspiration">Weiter zur Inspiration</CTAButton>
          </div>
        </div>
      )
    }
    return (
      <div className="sf-wrap" ref={flowTop}>
        <div className="sf-result">
          <div className="sf-result__head">
            <span className="kicker kicker--gold">Deine erste VIDEKO-Einschätzung</span>
            <p className="sf-result__note">Ehrliche Einschätzung statt Küchenorakel – noch kein verbindliches Angebot, aber ein klarer Startpunkt.</p>
          </div>
          <div className="sf-result__card">
            <div className="sf-result__media">
              <img src={PROFILE_IMG[result.type]} alt={P.name} />
              <span className="sf-result__score"><b>{displayScore}%</b><span>Match</span></span>
            </div>
            <div className="sf-result__body">
              <span className="sf-result__type">{P.name}</span>
              <p className="sf-result__blurb">{P.blurb}</p>
              <div className="sf-result__materials">
                {PROFILE_MAT[result.type].map((m, i) => <span key={i} className="sf-result__swatch" style={{ backgroundImage: `url(${m})` }} />)}
                <span className="sf-result__matlabel">{P.material}</span>
              </div>
              <ul className="sf-result__facts">
                <li><span>Budgetrahmen</span><b>{P.budget}</b></li>
                <li><span>Küchenform</span><b>{P.form}</b></li>
                <li><span>Stilrichtung</span><b>{a.styleSelections.join(', ') || '—'}</b></li>
                <li><span>Geräte</span><b>{P.appliances}</b></li>
                <li><span>Umsetzung</span><b>{P.assembly}</b></li>
              </ul>
              <ul className="sf-tips">
                {P.tips.map((t) => <li key={t}><Sparkles size={14} strokeWidth={2} /> {t}</li>)}
              </ul>
              <div className="sf-tags">{P.tags.map((t) => <span key={t}>#{t}</span>)}</div>
              <div className="sf-result__cta">
                <CTAButton to="/beratung">Beratung anfragen</CTAButton>
                <button type="button" className="sf-link" onClick={copySummary}><Copy size={16} /> {copied ? 'Kopiert!' : 'Zusammenfassung kopieren'}</button>
              </div>
              <button type="button" className="sf-link sf-uploadlink" onClick={() => uploadRef.current?.scrollIntoView({ behavior: 'smooth' })}>Oder Grundriss hochladen für ein genaueres Angebot ↓</button>
            </div>
          </div>
        </div>

        {/* UPLOAD */}
        <div className="sf-upload" ref={uploadRef}>
          <div className="sf-section-head">
            <h2>Jetzt wird aus Bauchgefühl Planung.</h2>
            <p>Lade hoch, was du hast. Je mehr wir sehen, desto weniger müssen wir raten.</p>
          </div>
          <div className="sf-upload__types">{UPLOAD_TYPES.map((t) => <span key={t} className="sf-pill">{t}</span>)}</div>
          <label
            className={`sf-drop ${dragOver ? 'is-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
          >
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" hidden onChange={(e) => addFiles(e.target.files)} />
            <Upload size={26} strokeWidth={1.6} />
            <span className="sf-drop__title">Dateien hierher ziehen oder klicken</span>
            <span className="sf-drop__hint">PDF, JPG, PNG. Bitte keine sensiblen Dokumente hochladen.</span>
          </label>
          {files.length > 0 && (
            <ul className="sf-files">{files.map((f, i) => <li key={i}><span>{f.name}</span><button type="button" onClick={() => removeFile(i)} aria-label="Entfernen"><X size={14} /></button></li>)}</ul>
          )}
        </div>

        {/* CONTACT */}
        <form className="sf-contact" onSubmit={onSubmit} noValidate>
          <div className="sf-section-head">
            <h2>Fast geschafft. Wohin schicken wir deine Einschätzung?</h2>
            <p>Telefon ist optional – wir melden uns auf deinem Wunschweg.</p>
          </div>
          <div className="sf-grid2">
            <label className="sf-field"><span>Vorname *</span><input value={contact.firstName} onChange={(e) => setContact({ ...contact, firstName: e.target.value })} required /></label>
            <label className="sf-field"><span>Nachname *</span><input value={contact.lastName} onChange={(e) => setContact({ ...contact, lastName: e.target.value })} required /></label>
            <label className="sf-field"><span>E-Mail *</span><input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required /></label>
            <label className="sf-field"><span>Telefon (optional)</span><input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></label>
            <label className="sf-field"><span>PLZ / Ort *</span><input value={contact.postalCodeCity} onChange={(e) => setContact({ ...contact, postalCodeCity: e.target.value })} required /></label>
            <label className="sf-field"><span>Wunschkontakt</span>
              <select value={contact.preferredContact} onChange={(e) => setContact({ ...contact, preferredContact: e.target.value })}><option>E-Mail</option><option>Telefon</option><option>WhatsApp</option></select>
            </label>
          </div>
          <label className="sf-field"><span>Was sollten wir noch wissen? (optional)</span><textarea rows={3} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} /></label>
          <label className="sf-check"><input type="checkbox" checked={contact.privacyAccepted} onChange={(e) => setContact({ ...contact, privacyAccepted: e.target.checked })} required /><span>Ich akzeptiere die <a href="/datenschutz" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a>. *</span></label>
          <label className="sf-check"><input type="checkbox" checked={contact.marketingConsent} onChange={(e) => setContact({ ...contact, marketingConsent: e.target.checked })} /><span>Schickt mir gerne Inspiration & Neuigkeiten (optional).</span></label>
          {submitError && <p className="sf-error">{submitError}</p>}
          <button type="submit" className="sf-btn-primary sf-submit" disabled={!contactValid || submitting}>
            {submitting ? <><Loader2 size={18} className="sf-spin" /> Wird gesendet …</> : 'Einschätzung senden & kostenloses Angebot anfragen'}
          </button>
          {!contactValid && <p className="sf-help">Bitte fülle Vorname, Nachname, E-Mail, PLZ/Ort aus und bestätige den Datenschutz.</p>}
          <button type="button" className="sf-link sf-restart" onClick={() => { setShowResult(false); setStep(0); setMaxReached(0); setA(EMPTY_ANSWERS); scrollTop() }}><RefreshCw size={15} /> Neu starten</button>
        </form>
      </div>
    )
  }

  /* ---------------- QUESTION STEPS ---------------- */
  return (
    <div className="sf-wrap" ref={flowTop}>
      <div className="sf-stepper" role="tablist">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={`sf-step ${i === step ? 'is-current' : ''} ${valid[i] && i < step ? 'is-done' : ''}`} onClick={() => goTo(i)} disabled={i > maxReached}>
            <span className="sf-step__n">{i > maxReached ? <Lock size={12} /> : (valid[i] && i < step ? <Check size={13} strokeWidth={2.6} /> : i + 1)}</span>
            <span className="sf-step__label">{s}</span>
          </button>
        ))}
      </div>
      <div className="sf-progress"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <div className="sf-count">Schritt {step + 1}/{STEPS.length}</div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="sf-stepbody">
          {step === 0 && (
            <>
              <h2 className="sf-q">Welcher Stil spricht dich spontan an?</h2>
              <p className="sf-micro">Nicht zu lange grübeln. Bauchgefühl ist bei Küchen erstaunlich nützlich. <em>(1–2 wählen)</em></p>
              <div className="sf-imggrid">
                {STYLE_OPTIONS.map((o) => {
                  const active = a.styleSelections.includes(o.label)
                  return (
                    <button key={o.label} type="button" className={`sf-imgcard ${active ? 'is-active' : ''}`} onClick={() => toggle('styleSelections', o.label, 2)}>
                      <span className="sf-imgcard__img" style={{ backgroundImage: `url(${o.img})` }} />
                      <span className="sf-imgcard__label">{o.label}{active && <Check size={15} strokeWidth={2.6} />}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="sf-q">Welche Wohnsituation passt aktuell zu dir?</h2>
              <p className="sf-micro">Auch kleine Küchen verdienen gute Planung. <em>(Mehrfachauswahl)</em></p>
              <div className="sf-chips">{LIVING.map((l) => <Chip key={l} active={a.living.includes(l)} onClick={() => toggle('living', l)}>{l}</Chip>)}</div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="sf-q">Was soll geplant werden?</h2>
              <p className="sf-micro">Nicht jede Küche braucht eine Insel. Manche brauchen einfach gute Entscheidungen.</p>
              <div className="sf-chips">{PROJECTS.map((pj) => <Chip key={pj} active={a.projectType === pj} onClick={() => set('projectType', pj)}>{pj}</Chip>)}</div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="sf-q">Wie soll die Küche umgesetzt werden?</h2>
              <p className="sf-micro">Von pragmatisch bis Premium – entscheidend ist, dass es zu deinem Alltag passt.</p>
              <div className="sf-chips">{ASSEMBLY.map((m) => <Chip key={m} active={a.assembly === m} onClick={() => set('assembly', m)}>{m}</Chip>)}</div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="sf-q">Welcher Budgetrahmen fühlt sich realistisch an?</h2>
              <p className="sf-micro">Wir planen nicht ins Blaue. Wir fragen erst sauber – ehrlich, ohne Bewertung.</p>
              <div className="sf-segments">{BUDGETS.map((b) => <button key={b} type="button" className={`sf-segment ${a.budgetRange === b ? 'is-active' : ''}`} onClick={() => set('budgetRange', b)}>{b}</button>)}</div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="sf-q">Was ist dir wirklich wichtig?</h2>
              <p className="sf-micro">Schieb die Regler so, wie es zu deinem Alltag passt. Es gibt kein richtig oder falsch.</p>
              <div className="sf-sliders">{PRIORITIES.map((p) => <Slider key={p.key} label={p.label} value={a.priorities[p.key]} onChange={(v) => setPrio(p.key, v)} />)}</div>
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="sf-q">Wie wird die Küche im Alltag genutzt?</h2>
              <p className="sf-micro">Hier bitte ehrlich sein – danach richtet sich die ganze Empfehlung. <em>(Mehrfachauswahl)</em></p>
              <div className="sf-chips">{USAGE.map((u) => <Chip key={u} active={a.usage.includes(u)} onClick={() => toggle('usage', u)}>{u}</Chip>)}</div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* live preview */}
      <div className="sf-live">
        <span className="sf-live__title"><Sparkles size={14} strokeWidth={2} /> Dein Profil schärft sich</span>
        <div className="sf-live__items">
          {liveItems.map((it) => <span key={it.k} className="sf-live__item"><b>{it.k}</b>{it.v}</span>)}
        </div>
      </div>

      <div className="sf-nav">
        {step > 0 ? <button type="button" className="sf-link" onClick={back}><ArrowLeft size={16} /> Zurück</button> : <span />}
        <div className="sf-nav__right">
          {!valid[step] && <span className="sf-hint">Bitte triff erst deine Auswahl.</span>}
          <button type="button" className="sf-btn-primary" onClick={next} disabled={!valid[step]}>
            {isLast ? 'Ergebnis anzeigen' : 'Weiter'} <ArrowRight size={17} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
