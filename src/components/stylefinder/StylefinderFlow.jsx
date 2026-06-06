import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Upload, Lock, Save, HelpCircle,
  Square, Minus, CircleDot, LayoutGrid, CornerDownRight, RefreshCw, Loader2, X,
} from 'lucide-react'

import CTAButton from '../CTAButton.jsx'
import { EMPTY_ANSWERS, computeResult, computeLeadScore } from './stylefinderLogic.js'

import sModern from '../../assets/images/kuechenwelten/stilfindercard-modern-warm.jpg'
import sNatur from '../../assets/images/kuechenwelten/stilfindercard-natuerlich-luxurioes.jpg'
import sDunkel from '../../assets/images/kuechenwelten/stilfindercard-dunkel-dramatisch.jpg'
import sHell from '../../assets/images/kuechenwelten/stilfindercard-zeitlos-elegant.jpg'
import sLandhaus from '../../assets/images/inspiration/03_wohnliche_kueche.png'
import sIndustrial from '../../assets/images/kuechenwelten/stilfindercard-industrial-premium.jpg'

import rModernWarm from '../../assets/images/kuechenwelten/stilfinderresult-modern-warm.jpg'
import rDark from '../../assets/images/kuechenwelten/stilfinderresult-dunkel-dramatisch.jpg'
import rNatural from '../../assets/images/kuechenwelten/stilfinderresult-natuerlich-luxurioes.jpg'
import rClean from '../../assets/images/kuechenwelten/stilfinderresult-zeitlos-elegant.jpg'
import rFamily from '../../assets/images/inspiration/03_wohnliche_kueche.png'
import rCompact from '../../assets/images/inspiration/08_kleine_kueche_clever_geplant.png'
import rPremium from '../../assets/images/kuechenwelten/stilfinderresult-industrial-premium.jpg'
import rCountry from '../../assets/images/inspiration/02_moderne_kueche.png'

import mNaturstein from '../../assets/images/materialien/cards/material-card-naturstein.png'
import mHolz from '../../assets/images/materialien/cards/material-card-holz.png'
import mMetall from '../../assets/images/materialien/cards/material-card-metall.png'
import mKeramik from '../../assets/images/materialien/cards/material-card-keramik.png'
import mGlas from '../../assets/images/materialien/cards/material-card-glas.png'
import mLack from '../../assets/images/materialien/cards/material-card-lack-matt.png'
import mBronze from '../../assets/images/materialien/cards/material-card-bronze.png'

const STYLE_OPTIONS = [
  { label: 'Modern & grifflos', img: sModern },
  { label: 'Warm & natürlich', img: sNatur },
  { label: 'Dunkel & elegant', img: sDunkel },
  { label: 'Hell & zeitlos', img: sHell },
  { label: 'Landhaus modern', img: sLandhaus },
  { label: 'Statement / Industrial', img: sIndustrial },
]
const LAYOUTS = [
  { label: 'Zeile', icon: Minus }, { label: 'L-Küche', icon: CornerDownRight },
  { label: 'U-Küche', icon: Square }, { label: 'Inselküche', icon: CircleDot },
  { label: 'Wohnküche / offen', icon: LayoutGrid }, { label: 'Noch offen', icon: HelpCircle },
]
const BUDGETS = ['5.000–12.500 €', '12.500–18.000 €', '18.000–25.000 €', '25.000–40.000 €', '40.000 €+']
const APPLIANCE_LABELS = ['solide', 'Preis-Leistung', 'besser als Standard', 'hochwertig', 'Premium']
const APPLIANCES = ['Backofen', 'Dampfgarer', 'Mikrowelle', 'Induktion', 'Muldenlüfter / Bora-Art', 'Geschirrspüler', 'Kühl-Gefrier-Kombi', 'Weinkühlschrank', 'Kaffeevollautomat']
const MATERIAL_MOODS = ['pflegeleicht', 'hochwertig & edel', 'natürlich & warm', 'minimalistisch', 'familienfreundlich', 'besonders / auffällig', 'dunkle Akzente', 'helle Naturtöne']
const COOKING = ['Ich koche fast täglich', 'Familie & viel Stauraum', 'Ich empfange gerne Gäste', 'Schnell & praktisch', 'Design im Fokus', 'Chaos mit Stil']
const PROJECT_STATUS = ['Ich sammle Inspiration', 'Ich plane konkret', 'Ich habe schon ein Angebot', 'Neubau / Umbau läuft', 'Küche muss bald bestellt werden', 'Ich will erstmal wissen, was möglich ist']
const TIMELINES = ['sofort / schnellstmöglich', '1–3 Monate', '3–6 Monate', '6–12 Monate', 'später / noch offen']
const UPLOAD_TYPES = ['Grundriss', 'Maße', 'Raumfotos', 'bestehendes Angebot', 'Inspirationsbilder', 'Bauplan']

const RESULTS = {
  ModernWarm: { name: 'Modern Warm', img: rModernWarm, form: 'L-Küche oder offene Wohnküche', materials: [mHolz, mNaturstein, mLack], blurb: 'Du magst klare Linien, aber keine sterile Showroom-Kälte. Zu dir passt eine Küche mit ruhigen Fronten, warmen Naturtönen, guter Beleuchtung und Geräten, die im Alltag nicht nerven. Klingt simpel. Ist es aber nur, wenn man sauber plant.' },
  DarkLuxury: { name: 'Dark Luxury', img: rDark, form: 'Inselküche mit Statement-Front', materials: [mNaturstein, mMetall, mBronze], blurb: 'Tiefe Töne, edle Oberflächen und ein Hauch Drama. Deine Küche darf ein Statement sein – dunkel, hochwertig und mit Geräten, die mitspielen. Wir sorgen dafür, dass es edel wirkt und nicht schwer.' },
  NaturalLiving: { name: 'Natural Living', img: rNatural, form: 'offene Wohnküche', materials: [mHolz, mKeramik, mNaturstein], blurb: 'Holz, weiche Töne und echte Geborgenheit. Deine Küche soll ein Ort zum Leben sein – warm, natürlich und ehrlich. Materialien, die man fühlen will, und ein Raum, in den man gerne kommt.' },
  CleanMinimal: { name: 'Clean Minimal', img: rClean, form: 'grifflose Zeile oder L-Küche', materials: [mLack, mGlas, mNaturstein], blurb: 'Ruhe, Klarheit, keine unnötigen Linien. Deine Küche lebt von Reduktion, guten Proportionen und pflegeleichten Oberflächen. Weniger, aber richtig.' },
  FamilySmart: { name: 'Family Smart', img: rFamily, form: 'L- oder U-Küche mit viel Stauraum', materials: [mLack, mKeramik, mHolz], blurb: 'Alltag, Familie, Tempo. Deine Küche muss robust, clever organisiert und pflegeleicht sein – und trotzdem schön. Genau dafür planen wir Stauraum, der wirklich funktioniert.' },
  CountryModern: { name: 'Country Modern', img: rCountry, form: 'L-Küche oder Wohnküche', materials: [mHolz, mNaturstein, mKeramik], blurb: 'Landhaus, aber modern gedacht. Warme Materialien, charaktervolle Fronten und trotzdem zeitgemäße Technik. Gemütlich, ohne altmodisch zu sein.' },
  CompactClever: { name: 'Compact Clever', img: rCompact, form: 'Zeile oder kompakte L-Küche', materials: [mLack, mHolz, mGlas], blurb: 'Wenig Platz, viel Wirkung. Deine Küche holt aus jedem Zentimeter etwas heraus – clevere Auszüge, gute Wege und eine klare Optik. Klein, aber richtig durchdacht.' },
  PremiumStatement: { name: 'Premium Statement', img: rPremium, form: 'Inselküche mit Wohnanschluss', materials: [mNaturstein, mMetall, mBronze], blurb: 'Du willst eine Küche, die beeindruckt – Insel, Premiumgeräte und eine Arbeitsplatte, die man nicht übersieht. Hier holen wir Material, Licht und Technik auf Top-Niveau zusammen.' },
}

function Chip({ active, onClick, children, disabled }) {
  return (
    <button type="button" className={`sf-chip ${active ? 'is-active' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={active}>
      {active && <Check size={14} strokeWidth={2.6} />} {children}
    </button>
  )
}

function Slider({ label, value, onChange, labels }) {
  return (
    <div className="sf-slider">
      <div className="sf-slider__top"><span>{label}</span><span className="sf-slider__val">{labels ? labels[value - 1] : value}</span></div>
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

  const STEPS = ['Stil', 'Grundriss', 'Budget', 'Geräte', 'Material', 'Alltag', 'Projekt']
  const valid = [
    a.styleSelections.length >= 1 && a.styleSelections.length <= 2,
    a.layout !== '',
    a.budgetRange !== '',
    a.applianceLevel >= 1,
    a.materialMoods.length >= 1 && a.materialMoods.length <= 3,
    a.cookingUsage.length >= 1,
    a.projectStatus !== '' && a.timeline !== '',
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
    const r = computeResult(a)
    setResult(r); setShowResult(true)
    setTimeout(() => flowTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  // score count-up
  useEffect(() => {
    if (!showResult || !result) return
    let raf, start
    const dur = 1100
    const tick = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / dur)
      setDisplayScore(Math.round(result.score * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [showResult, result])

  const addFiles = (list) => {
    const incoming = Array.from(list).map((f) => ({ name: f.name, size: f.size, type: f.type }))
    setFiles((prev) => [...prev, ...incoming])
  }
  const removeFile = (i) => setFiles((prev) => prev.filter((_, k) => k !== i))

  const contactValid = contact.firstName && contact.lastName && /\S+@\S+\.\S+/.test(contact.email) && contact.postalCodeCity && contact.privacyAccepted

  async function submitStylefinderLead(payload) {
    // TODO: connect to the real VIDEKO lead endpoint / mail service.
    // No backend wired yet — package a clean payload and resolve as "queued".
    // eslint-disable-next-line no-console
    console.info('[stylefinder lead]', payload)
    await new Promise((r) => setTimeout(r, 800))
    return { ok: true }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!contactValid || submitting) return
    setSubmitting(true); setSubmitError('')
    const payload = { ...a, resultType: result?.type, resultScore: result?.score, budgetAssessment: result?.budgetAssessment, leadScore: computeLeadScore(a, files.length > 0), uploadedFiles: files, contact }
    try {
      const res = await submitStylefinderLead(payload)
      if (res?.ok) setSent(true)
      else setSubmitError('Das hat leider nicht geklappt. Bitte versuch es noch einmal.')
    } catch {
      setSubmitError('Verbindung fehlgeschlagen. Bitte versuch es noch einmal oder ruf uns an.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- RESULT + UPLOAD + CONTACT ---------------- */
  if (showResult && result) {
    const R = RESULTS[result.type]
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
        {/* RESULT */}
        <div className="sf-result">
          <div className="sf-result__head">
            <span className="kicker kicker--gold">Deine erste VIDEKO-Einschätzung</span>
            <p className="sf-result__note">Noch kein verbindliches Angebot – aber schon deutlich besser als wildes Küchenraten.</p>
          </div>
          <div className="sf-result__card">
            <div className="sf-result__media">
              <img src={R.img} alt={R.name} />
              <span className="sf-result__score"><b>{displayScore}%</b><span>Stil-Match</span></span>
            </div>
            <div className="sf-result__body">
              <span className="sf-result__type">{R.name}</span>
              <p className="sf-result__blurb">{R.blurb}</p>
              <div className="sf-result__materials">
                {R.materials.map((m, i) => <span key={i} className="sf-result__swatch" style={{ backgroundImage: `url(${m})` }} />)}
                <span className="sf-result__matlabel">Passende Materialien</span>
              </div>
              <ul className="sf-result__facts">
                <li><span>Empfohlene Form</span><b>{R.form}</b></li>
                <li><span>Budget-Realismus</span><b>{result.budgetAssessment}</b></li>
                <li><span>Geräte</span><b>{result.applianceText}</b></li>
              </ul>
              <p className="sf-result__missing"><Sparkles size={15} strokeWidth={2} /> Für ein genaues Angebot fehlen noch: Grundriss / Maße & ein paar Raumfotos.</p>
              <div className="sf-result__cta">
                <button type="button" className="btn-magnet sf-btn-primary" onClick={() => uploadRef.current?.scrollIntoView({ behavior: 'smooth' })}>Grundriss hochladen & Angebot sichern</button>
                <button type="button" className="sf-link" onClick={() => { try { localStorage.setItem('videko_stylefinder', JSON.stringify({ a, result })) } catch { /* ignore */ } }}><Save size={16} /> Ergebnis speichern</button>
              </div>
            </div>
          </div>
        </div>

        {/* UPLOAD */}
        <div className="sf-upload" ref={uploadRef}>
          <div className="sf-section-head">
            <h2>Jetzt wird aus Bauchgefühl Planung.</h2>
            <p>Lade hoch, was du hast. Je mehr wir sehen, desto weniger müssen wir raten.</p>
          </div>
          <div className="sf-upload__types">
            {UPLOAD_TYPES.map((t) => <span key={t} className="sf-pill">{t}</span>)}
          </div>
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
            <ul className="sf-files">
              {files.map((f, i) => (
                <li key={i}><span>{f.name}</span><button type="button" onClick={() => removeFile(i)} aria-label="Entfernen"><X size={14} /></button></li>
              ))}
            </ul>
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
              <select value={contact.preferredContact} onChange={(e) => setContact({ ...contact, preferredContact: e.target.value })}>
                <option>E-Mail</option><option>Telefon</option><option>WhatsApp</option>
              </select>
            </label>
          </div>
          <label className="sf-field"><span>Was sollten wir noch wissen? (optional)</span><textarea rows={3} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} /></label>
          <label className="sf-check"><input type="checkbox" checked={contact.privacyAccepted} onChange={(e) => setContact({ ...contact, privacyAccepted: e.target.checked })} required /><span>Ich akzeptiere die <a href="/datenschutz" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a>. *</span></label>
          <label className="sf-check"><input type="checkbox" checked={contact.marketingConsent} onChange={(e) => setContact({ ...contact, marketingConsent: e.target.checked })} /><span>Schickt mir gerne Inspiration & Neuigkeiten (optional).</span></label>
          {submitError && <p className="sf-error">{submitError}</p>}
          <button type="submit" className="btn-magnet sf-btn-primary sf-submit" disabled={!contactValid || submitting}>
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
      {/* stepper */}
      <div className="sf-stepper" role="tablist">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={`sf-step ${i === step ? 'is-current' : ''} ${valid[i] && i < step ? 'is-done' : ''}`}
            onClick={() => goTo(i)}
            disabled={i > maxReached}
          >
            <span className="sf-step__n">{i > maxReached ? <Lock size={12} /> : (valid[i] && i < step ? <Check size={13} strokeWidth={2.6} /> : i + 1)}</span>
            <span className="sf-step__label">{s}</span>
          </button>
        ))}
      </div>
      <div className="sf-progress"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <div className="sf-count">Schritt {step + 1}/{STEPS.length}</div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="sf-stepbody"
        >
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
              <h2 className="sf-q">Welche Küchenform passt ungefähr zu deinem Raum?</h2>
              <p className="sf-micro">Wenn du es nicht weißt: Kein Drama. Dafür gibt es Menschen mit Maßband.</p>
              <div className="sf-iconrid">
                {LAYOUTS.map((o) => {
                  const Icon = o.icon
                  const active = a.layout === o.label
                  return (
                    <button key={o.label} type="button" className={`sf-iconcard ${active ? 'is-active' : ''}`} onClick={() => set('layout', o.label)}>
                      <Icon size={26} strokeWidth={1.6} /><span>{o.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="sf-q">In welchem Rahmen soll deine Küche ungefähr liegen?</h2>
              <p className="sf-micro">Keine Sorge – das ist keine Beichte, nur Orientierung. Wir zeigen dir keine Luftschlösser mit Raketenantrieb.</p>
              <div className="sf-segments">
                {BUDGETS.map((b) => (
                  <button key={b} type="button" className={`sf-segment ${a.budgetRange === b ? 'is-active' : ''}`} onClick={() => set('budgetRange', b)}>{b}</button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="sf-q">Wie hochwertig sollen deine Geräte sein?</h2>
              <p className="sf-micro">Geräte können aus einer Küche Alltag machen – oder ein Cockpit. Beides okay.</p>
              <Slider label="Geräte-Niveau" value={a.applianceLevel} onChange={(v) => set('applianceLevel', v)} labels={APPLIANCE_LABELS} />
              <p className="sf-sub">Welche Geräte sind dir wichtig? <em>(optional, Mehrfachauswahl)</em></p>
              <div className="sf-chips">
                {APPLIANCES.map((g) => <Chip key={g} active={a.selectedAppliances.includes(g)} onClick={() => toggle('selectedAppliances', g)}>{g}</Chip>)}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="sf-q">Was soll deine Küche ausstrahlen?</h2>
              <p className="sf-micro">Arbeitsplatten sind wie Schuhe: Man merkt erst zu spät, wenn man am falschen Ende gespart hat. <em>(1–3 wählen)</em></p>
              <div className="sf-chips">
                {MATERIAL_MOODS.map((m) => <Chip key={m} active={a.materialMoods.includes(m)} onClick={() => toggle('materialMoods', m, 3)}>{m}</Chip>)}
              </div>
              <Slider label="Wie wichtig ist dir eine besondere Arbeitsplatte?" value={a.countertopImportance} onChange={(v) => set('countertopImportance', v)} />
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="sf-q">Wie nutzt du deine Küche wirklich?</h2>
              <p className="sf-micro">Hier bitte ehrlich sein. Eine Küche für Instagram und eine für Montagabend sind zwei verschiedene Tiere.</p>
              <div className="sf-chips">
                {COOKING.map((c) => <Chip key={c} active={a.cookingUsage.includes(c)} onClick={() => toggle('cookingUsage', c)}>{c}</Chip>)}
              </div>
              <Slider label="Wie wichtig ist dir Stauraum?" value={a.storageImportance} onChange={(v) => set('storageImportance', v)} />
              <Slider label="Wie wichtig ist dir Pflegeleichtigkeit?" value={a.easyCareImportance} onChange={(v) => set('easyCareImportance', v)} />
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="sf-q">Wo stehst du gerade?</h2>
              <p className="sf-micro">Wir unterscheiden zwischen „mal schauen" und „Hilfe, der Estrich kommt".</p>
              <div className="sf-chips">
                {PROJECT_STATUS.map((p) => <Chip key={p} active={a.projectStatus === p} onClick={() => set('projectStatus', p)}>{p}</Chip>)}
              </div>
              <p className="sf-sub">Bis wann soll es soweit sein?</p>
              <div className="sf-chips">
                {TIMELINES.map((t) => <Chip key={t} active={a.timeline === t} onClick={() => set('timeline', t)}>{t}</Chip>)}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="sf-nav">
        {step > 0
          ? <button type="button" className="sf-link" onClick={back}><ArrowLeft size={16} /> Zurück</button>
          : <span />}
        <div className="sf-nav__right">
          {!valid[step] && <span className="sf-hint">Bitte triff erst deine Auswahl.</span>}
          <button type="button" className="btn-magnet sf-btn-primary" onClick={next} disabled={!valid[step]}>
            {isLast ? 'Ergebnis anzeigen' : 'Weiter'} <ArrowRight size={17} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
