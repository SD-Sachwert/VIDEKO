import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Lock, Save, RefreshCw, Heart, Printer, Send, Paperclip, Sparkle,
  Users, PartyPopper, ChefHat, Archive, Wind, LayoutGrid, Zap, Droplets, Leaf, Sun, Footprints, Gem, Wallet,
  Maximize, Baby, CircleDot, Cpu, Package, Coffee, Wine, PiggyBank, Coins, BadgeEuro, HelpCircle,
} from 'lucide-react'

import CTAButton from '../CTAButton.jsx'
import logoMain from '../../assets/brand/logo-main.png'
import { EMPTY_ANSWERS, PRIORITY_LIST, computeProfile, computeResultStyle } from './stylefinderLogic.js'

import sModern from '../../assets/images/stylefinder-assets/02_stil_hell_modern_minimal.png'
import sNatur from '../../assets/images/stylefinder-assets/03_stil_skandinavisch_natuerlich.png'
import sDunkel from '../../assets/images/stylefinder-assets/05_stil_dunkel_luxurioes_wohnlich.png'
import sHell from '../../assets/images/stylefinder-assets/08_stil_hell_luxurioes_mit_pflanzen.png'
import sLandhaus from '../../assets/images/stylefinder-assets/04_stil_hell_wohnlich_landhaus_modern.png'
import sIndustrial from '../../assets/images/stylefinder-assets/06_stil_industrial_dark_city.png'

import mNaturstein from '../../assets/images/materialien/cards/material-card-naturstein.png'
import mHolz from '../../assets/images/materialien/cards/material-card-holz.png'
import mMetall from '../../assets/images/materialien/cards/material-card-metall.png'
import mKeramik from '../../assets/images/materialien/cards/material-card-keramik.png'
import mGlas from '../../assets/images/materialien/cards/material-card-glas.png'
import mLack from '../../assets/images/materialien/cards/material-card-lack-matt.png'
import mBronze from '../../assets/images/materialien/cards/material-card-bronze.png'
import mPlatten from '../../assets/images/materialien/cards/material-card-quarzkomposit.png'

import iHell from '../../assets/images/inspiration/05_helle_kueche.png'
import iWohnlich from '../../assets/images/inspiration/03_wohnliche_kueche.png'
import iModernK from '../../assets/images/inspiration/02_moderne_kueche.png'

const STEPS = ['Stil', 'Mehrwerte', 'Materialdetails', 'Farbwelten', 'Funktionsraum', 'Budget', 'Prioritäten', 'Ergebnis']

const STYLE_OPTIONS = [
  { label: 'Modern & grifflos', sub: 'Klar, reduziert, technisch', img: sModern },
  { label: 'Warm & natürlich', sub: 'Holz, weiche Töne', img: sNatur },
  { label: 'Dunkel & elegant', sub: 'Tiefe Farben, edel', img: sDunkel },
  { label: 'Hell & zeitlos', sub: 'Licht und Leichtigkeit', img: sHell },
  { label: 'Landhaus modern', sub: 'Charakter, modern gedacht', img: sLandhaus },
  { label: 'Statement / Industrial', sub: 'Roh, markant, urban', img: sIndustrial },
]
const MEHRWERTE = [
  { label: 'Familienzeit', icon: Users }, { label: 'Gäste & Geselligkeit', icon: PartyPopper },
  { label: 'Kochen mit Freude', icon: ChefHat }, { label: 'Viel Stauraum', icon: Archive },
  { label: 'Aufgeräumte Ruhe', icon: Wind }, { label: 'Offenes Wohnen', icon: LayoutGrid },
  { label: 'Schnelle Alltagsküche', icon: Zap }, { label: 'Statement-Design', icon: Sparkles },
  { label: 'Pflegeleicht', icon: Droplets }, { label: 'Natürliches Wohngefühl', icon: Leaf },
  { label: 'Mehr Licht', icon: Sun }, { label: 'Kurze Wege', icon: Footprints },
]
const MAT_TEX = {
  Naturstein: mNaturstein, Holz: mHolz, Keramik: mKeramik, Glas: mGlas, Metall: mMetall, Mattlack: mLack,
  Rillenfronten: mLack, Arbeitsplatten: mPlatten, 'Warme Hölzer': mHolz, 'Gebürstetes Messing': mBronze,
  'Dunkler Stein': mNaturstein, 'Helle Oberflächen': mLack,
}
const MATERIALS = Object.keys(MAT_TEX)
const FARBWELTEN = [
  { label: 'Hell & natürlich', sub: 'Licht, Leinen, helle Hölzer', dots: ['#efe9dd', '#d8cdb6', '#b79b78'], img: sHell },
  { label: 'Beige & Sand', sub: 'Warme Neutraltöne', dots: ['#e7d9c2', '#cdb796', '#a98c63'], img: sNatur },
  { label: 'Warmes Holz', sub: 'Honig- und Nusstöne', dots: ['#caa06a', '#8a5a32', '#e3c79c'], img: sLandhaus },
  { label: 'Dunkel & elegant', sub: 'Tiefe Töne, edler Look', dots: ['#2b2925', '#12110f', '#c9a050'], img: sDunkel },
  { label: 'Greige modern', sub: 'Grau trifft Beige', dots: ['#cfc7ba', '#a89e8c', '#6f665a'], img: iModernK },
  { label: 'Schwarz & Bronze', sub: 'Kontrast mit Charakter', dots: ['#15140f', '#3a352c', '#b08642'], img: sIndustrial },
  { label: 'Soft White', sub: 'Ruhig, hell, zeitlos', dots: ['#f4efe6', '#e6ddcc', '#cfc3ad'], img: iHell },
  { label: 'Stein & Taupe', sub: 'Erdig und natürlich', dots: ['#bdb3a3', '#8d8275', '#5f574c'], img: iWohnlich },
]
const FUNKTION = [
  { label: 'Viel Stauraum', icon: Archive }, { label: 'Kurze Wege', icon: Footprints },
  { label: 'Große Arbeitsfläche', icon: Maximize }, { label: 'Offene Wohnküche', icon: LayoutGrid },
  { label: 'Kochen zu zweit', icon: Users }, { label: 'Familienalltag', icon: Baby },
  { label: 'Kücheninsel', icon: CircleDot }, { label: 'Geräte auf Augenhöhe', icon: Cpu },
  { label: 'Speisekammer', icon: Package }, { label: 'Frühstücksplatz', icon: Coffee },
  { label: 'Homebar', icon: Wine }, { label: 'Ruhiger Look trotz Funktion', icon: Wind },
]
const BUDGETS = [
  { label: 'bis 10.000 €', icon: PiggyBank }, { label: '10.000 – 15.000 €', icon: Coins },
  { label: '15.000 – 20.000 €', icon: Wallet }, { label: '20.000 – 30.000 €', icon: BadgeEuro },
  { label: '30.000 €+', icon: Gem }, { label: 'noch offen', icon: HelpCircle },
]

const EXPERT_TIPS = [
  'Stil ist kein Persönlichkeitstest. Es geht darum, was du jeden Morgen sehen willst, ohne innerlich zu kündigen.',
  'Mehrwerte sind keine Spielereien. Wenn ein Feature deinen Alltag nicht besser macht, ist es nur Deko mit Preisschild.',
  'Material ist wie Schuhwerk: Schön bringt wenig, wenn es nach drei Wochen aussieht wie nach einem Festival.',
  'Mut zur Farbe ist gut. Mut zur Farbe ohne Lichtkonzept ist manchmal nur eine sehr teure Höhle mit Spüle.',
  'Eine Küche ist kein Möbelkatalog. Laufwege, Stauraum und Griffe entscheiden, ob Kochen Spaß macht oder tägliches Tetris wird.',
  'Budget ist kein Spaßverderber. Es ist der Türsteher, der verhindert, dass Wunsch und Realität sich vor allen Leuten prügeln.',
  'Wenn alles wichtig ist, ist nichts wichtig. Hier sortieren wir aus, bevor die Küche aussieht wie ein Wunschzettel mit Fronten.',
  'Dein Profil ist kein endgültiges Urteil. Es ist die Abkürzung zu einem Gespräch, bei dem wir nicht bei Adam und Arbeitsplatte anfangen.',
]

const RESULT = {
  'Warm & natürlich': { img: sNatur, char: 'Warme Töne, natürliche Materialien, ein Raum zum Ankommen.', tags: ['Natürlich', 'Warm', 'Einladend', 'Harmonisch'], mats: [mHolz, mNaturstein, mKeramik] },
  'Modern & grifflos': { img: sModern, char: 'Klar, reduziert, zeitlos – Technik und Ruhe in Balance.', tags: ['Modern', 'Minimal', 'Klar', 'Funktional'], mats: [mLack, mGlas, mNaturstein] },
  'Dunkel & elegant': { img: sDunkel, char: 'Tiefe Töne, edle Oberflächen, ein Statement mit Stil.', tags: ['Elegant', 'Edel', 'Dramatisch', 'Hochwertig'], mats: [mNaturstein, mMetall, mBronze] },
  'Hell & zeitlos': { img: sHell, char: 'Helligkeit, Leichtigkeit und Details, die bleiben.', tags: ['Hell', 'Zeitlos', 'Leicht', 'Fein'], mats: [mLack, mGlas, mHolz] },
  'Landhaus modern': { img: sLandhaus, char: 'Charaktervoll, warm und modern interpretiert.', tags: ['Wohnlich', 'Warm', 'Charakter', 'Natürlich'], mats: [mHolz, mNaturstein, mKeramik] },
  'Statement / Industrial': { img: sIndustrial, char: 'Roh, markant, urban – Küche mit Haltung.', tags: ['Industrial', 'Markant', 'Urban', 'Stark'], mats: [mMetall, mNaturstein, mBronze] },
}

function Chip({ active, onClick, children }) {
  return <button type="button" className={`sf-chip ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active}>{active && <Check size={14} strokeWidth={2.6} />} {children}</button>
}

export default function StylefinderFlow() {
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [a, setA] = useState(EMPTY_ANSWERS)
  const [saved, setSaved] = useState(false)
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState([])
  const [sent, setSent] = useState(false)
  const [liked, setLiked] = useState(() => new Set())
  const toggleLike = (e, label) => { e.stopPropagation(); setLiked((s) => { const n = new Set(s); n.has(label) ? n.delete(label) : n.add(label); return n }) }
  const flowTop = useRef(null)

  const toggle = (key, value, max) => setA((p) => {
    const arr = p[key]
    if (arr.includes(value)) return { ...p, [key]: arr.filter((x) => x !== value) }
    if (max && arr.length >= max) return p
    return { ...p, [key]: [...arr, value] }
  })
  const set = (key, value) => setA((p) => ({ ...p, [key]: value }))
  const setPrio = (label, value) => setA((p) => ({ ...p, prioritaeten: { ...p.prioritaeten, [label]: value } }))

  const valid = [
    a.styleSelections.length >= 1 && a.styleSelections.length <= 2,
    a.mehrwerte.length >= 1,
    a.materials.length >= 1,
    a.farbwelten.length >= 1,
    a.funktion.length >= 1,
    a.budget !== '',
    true,
  ]
  const isResult = step === 7
  const profile = computeProfile(a)
  const answeredSteps = Math.round((profile.completeness / 100) * 7)
  const scrollTop = () => flowTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const goTo = (i) => { if (i <= maxReached) { setStep(i); scrollTop() } }
  const next = () => {
    if (step <= 6 && !valid[step]) return
    const n = Math.min(7, step + 1)
    setStep(n); setMaxReached((m) => Math.max(m, n)); scrollTop()
  }
  const back = () => { if (step > 0) { setStep(step - 1); scrollTop() } }
  const restart = () => { setA(EMPTY_ANSWERS); setStep(0); setMaxReached(0); scrollTop() }
  const saveProgress = () => { try { localStorage.setItem('videko_stylefinder', JSON.stringify(a)) } catch { /* ignore */ } setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const printResult = () => { if (typeof window !== 'undefined') window.print() }
  const sendToVideko = () => {
    const lines = [
      `Mein Ergebnis aus dem VIDEKO Stylefinder: ${resultStyle}`,
      `Stil-Charakter: ${R.char}`,
      '',
      `Farbwelten: ${a.farbwelten.slice(0, 3).join(', ') || '—'}`,
      `Materialien: ${a.materials.slice(0, 4).join(', ') || '—'}`,
      `Funktion: ${a.funktion.slice(0, 3).join(', ') || '—'}`,
      `Budgetrahmen: ${a.budget || 'noch offen'}`,
      '',
      notes ? `Meine Wünsche / Hinweise:\n${notes}` : '',
      files.length ? `Anhänge (bitte im Mailprogramm anhängen): ${files.map((f) => f.name).join(', ')}` : '',
      '',
      'Bitte meldet euch für eine persönliche Beratung. Danke!',
    ].filter((l) => l !== '')
    const url = `mailto:info@videko-kuechen.de?subject=${encodeURIComponent(`Stylefinder-Ergebnis: ${resultStyle}`)}&body=${encodeURIComponent(lines.join('\n'))}`
    if (typeof window !== 'undefined') window.location.href = url
    setSent(true); setTimeout(() => setSent(false), 4000)
  }

  const resultStyle = computeResultStyle(a)
  const R = RESULT[resultStyle]

  return (
    <div className="sf-wrap" ref={flowTop}>
      {/* stepper */}
      <div className="sf-stepper" role="tablist">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={`sf-step ${i === step ? 'is-current' : ''} ${i < step && (i > 6 || valid[i]) ? 'is-done' : ''}`} onClick={() => goTo(i)} disabled={i > maxReached}>
            <span className="sf-step__n">{i > maxReached ? <Lock size={12} /> : (i < step ? <Check size={13} strokeWidth={2.6} /> : i + 1)}</span>
            <span className="sf-step__label">{s}</span>
          </button>
        ))}
      </div>
      <div className="sf-progress"><span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <div className="sf-count">Schritt {step + 1}/{STEPS.length}</div>

      {isResult ? (
        <div className="sf-result">
          <div className="sf-result__head">
            <span className="kicker kicker--gold">Dein Ergebnis</span>
            <h2 className="sf-result__bighead">Treffer. <span className="grad">Das bist ziemlich genau du.</span></h2>
            <p className="sf-result__note">Bevor du wieder 47 Screenshots in einem Ordner namens „Küche_final_final2" sammelst: Hier ist deine erste, ehrliche Einschätzung – schick sie uns lieber direkt.</p>
          </div>
          <div className="sf-result__card">
            <div className="sf-result__media"><img src={R.img} alt={resultStyle} />
              <span className="sf-result__match"><b>Dein Stil</b><span>{resultStyle}</span></span>
            </div>
            <div className="sf-result__body">
              <span className="sf-result__type">{resultStyle}</span>
              <p className="sf-result__blurb">{R.char}</p>
              <p className="sf-result__why"><Sparkle size={15} strokeWidth={2} /> Warum das passt: Du hast {a.farbwelten[0] ? `bei den Farben „${a.farbwelten[0]}"` : 'klare Farbtendenzen'} gewählt, legst Wert auf {a.funktion[0] || 'durchdachte Funktion'} – und genau dafür ist dieser Stil gemacht. Kein Zufall, sondern dein Bauchgefühl mit Plan.</p>
              <div className="sf-tags">{R.tags.map((t) => <span key={t}>{t}</span>)}</div>
              <ul className="sf-result__facts">
                <li><span>Farben</span><b>{a.farbwelten.slice(0, 2).join(', ') || '—'}</b></li>
                <li><span>Materialien</span><b>{a.materials.slice(0, 3).join(', ') || '—'}</b></li>
                <li><span>Funktion</span><b>{a.funktion.slice(0, 2).join(', ') || '—'}</b></li>
                <li><span>Budget</span><b>{a.budget || 'noch offen'}</b></li>
              </ul>
              <div className="sf-result__mats">
                {R.mats.map((m, i) => <span key={i} className="sf-result__swatch" style={{ backgroundImage: `url(${m})` }} />)}
                <span className="sf-result__matlabel">Empfohlene Oberflächen</span>
              </div>

              <div className="sf-send">
                <span className="sf-send__head">Wünsche, Notizen oder Anhänge? Pack alles dazu.</span>
                <textarea className="sf-send__notes" rows={3} placeholder="z. B. Raummaße, Lieblingsdetails, Wunsch nach Kochinsel – oder was dir sonst wichtig ist …" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <label className="sf-send__file">
                  <Paperclip size={15} strokeWidth={2} /> {files.length ? `${files.length} Datei(en) ausgewählt` : 'Grundriss oder Inspirationsbild anhängen'}
                  <input type="file" multiple accept="image/*,.pdf" onChange={(e) => setFiles(Array.from(e.target.files || []))} hidden />
                </label>
              </div>

              <div className="sf-result__actions">
                <button type="button" className="sf-actbtn" onClick={printResult}><Printer size={16} strokeWidth={2} /> Ergebnis drucken</button>
                <button type="button" className="sf-actbtn sf-actbtn--gold" onClick={sendToVideko}><Send size={16} strokeWidth={2} /> {sent ? 'Mail geöffnet …' : 'An VIDEKO senden'}</button>
              </div>

              <div className="sf-result__next">
                <span className="sf-result__nextlabel">Dein nächster Schritt</span>
                <CTAButton to="/beratung">Daraus einen echten Plan machen <ArrowRight size={16} strokeWidth={2} /></CTAButton>
              </div>
              <button type="button" className="sf-link sf-restart" onClick={restart}><RefreshCw size={15} /> Neu starten</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="sf-layout">
          <div className="sf-main">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="sf-stepbody">
                {step === 0 && (
                  <>
                    <h2 className="sf-q">Welcher Stil spricht dich spontan an?</h2>
                    <p className="sf-micro">Keine Sorge, wir fragen nicht nach deinem Sternzeichen. Bauchgefühl reicht. <em>(1–2 wählen)</em></p>
                    <div className="sf-imggrid">
                      {STYLE_OPTIONS.map((o) => {
                        const active = a.styleSelections.includes(o.label)
                        return (
                          <div key={o.label} role="button" tabIndex={0} className={`sf-imgcard ${active ? 'is-active' : ''}`} onClick={() => toggle('styleSelections', o.label, 2)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle('styleSelections', o.label, 2) } }}>
                            <span className="sf-imgcard__img" style={{ backgroundImage: `url(${o.img})` }}>
                              <button type="button" className={`sf-like ${liked.has(o.label) ? 'is-on' : ''}`} aria-label="Merken" onClick={(e) => toggleLike(e, o.label)}><Heart size={15} strokeWidth={2} fill={liked.has(o.label) ? 'currentColor' : 'none'} /></button>
                              {active && <span className="sf-imgcard__check"><Check size={14} strokeWidth={2.8} /></span>}
                            </span>
                            <span className="sf-imgcard__label">{o.label}</span>
                            <span className="sf-imgcard__sub">{o.sub}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <h2 className="sf-q">Was soll deine Küche für dich können?</h2>
                    <p className="sf-micro">Stauraum ist wie WLAN: Man merkt erst, dass er fehlt, wenn's nervt. <em>(Mehrfachauswahl)</em></p>
                    <div className="sf-iconrid">
                      {MEHRWERTE.map((o) => {
                        const active = a.mehrwerte.includes(o.label)
                        return (
                          <button key={o.label} type="button" className={`sf-iconcard ${active ? 'is-active' : ''}`} onClick={() => toggle('mehrwerte', o.label)}>
                            <o.icon size={22} strokeWidth={1.6} /><span>{o.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="sf-q">Welche Materialien sprechen dich an?</h2>
                    <p className="sf-micro">Anfassen darfst du später im Studio – Bildschirm lecken zählt nicht. <em>(Mehrfachauswahl)</em></p>
                    <div className="sf-matgrid">
                      {MATERIALS.map((label) => {
                        const active = a.materials.includes(label)
                        return (
                          <button key={label} type="button" className={`sf-matcard ${active ? 'is-active' : ''}`} onClick={() => toggle('materials', label)}>
                            <span className="sf-matcard__tex" style={{ backgroundImage: `url(${MAT_TEX[label]})` }} />
                            <span className="sf-matcard__label">{label}{active && <Check size={14} strokeWidth={2.6} />}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h2 className="sf-q">Welche Farbwelt passt zu dir?</h2>
                    <p className="sf-micro">Dunkel, hell oder „nur nicht wie bei Tante Monika"? <em>(Mehrfachauswahl)</em></p>
                    <div className="sf-imggrid sf-imggrid--4">
                      {FARBWELTEN.map((o) => {
                        const active = a.farbwelten.includes(o.label)
                        return (
                          <div key={o.label} role="button" tabIndex={0} className={`sf-imgcard ${active ? 'is-active' : ''}`} onClick={() => toggle('farbwelten', o.label)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle('farbwelten', o.label) } }}>
                            <span className="sf-imgcard__img" style={{ backgroundImage: `url(${o.img})` }}>
                              <button type="button" className={`sf-like ${liked.has(o.label) ? 'is-on' : ''}`} aria-label="Merken" onClick={(e) => toggleLike(e, o.label)}><Heart size={15} strokeWidth={2} fill={liked.has(o.label) ? 'currentColor' : 'none'} /></button>
                              {active && <span className="sf-imgcard__check"><Check size={14} strokeWidth={2.8} /></span>}
                            </span>
                            <span className="sf-imgcard__label">{o.label}</span>
                            <span className="sf-imgcard__dots">{o.dots.map((d, k) => <span key={k} style={{ background: d }} />)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <h2 className="sf-q">Wie soll deine Küche funktionieren?</h2>
                    <p className="sf-micro">Inselküche? Schön. Aber nur, wenn der Raum nicht danach weint. <em>(Mehrfachauswahl)</em></p>
                    <div className="sf-iconrid">
                      {FUNKTION.map((o) => {
                        const active = a.funktion.includes(o.label)
                        return (
                          <button key={o.label} type="button" className={`sf-iconcard ${active ? 'is-active' : ''}`} onClick={() => toggle('funktion', o.label)}>
                            <o.icon size={22} strokeWidth={1.6} /><span>{o.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <h2 className="sf-q">Welcher Rahmen passt zu deinem Projekt?</h2>
                    <p className="sf-micro">Nicht auf den Euro genau – aber so, dass wir realistisch planen können.</p>
                    <div className="sf-budgrid">
                      {BUDGETS.map((b) => {
                        const active = a.budget === b.label
                        return (
                          <button key={b.label} type="button" className={`sf-budcard ${active ? 'is-active' : ''}`} onClick={() => set('budget', b.label)}>
                            <span className="sf-budcard__ic"><b.icon size={20} strokeWidth={1.6} /></span>
                            <span className="sf-budcard__label">{b.label}</span>
                            {active && <span className="sf-budcard__check"><Check size={14} strokeWidth={2.8} /></span>}
                          </button>
                        )
                      })}
                    </div>
                    <div className="sf-infobox"><span>Realistische Einordnung</span><span>Planungssicherheit</span><span>Im Preis mitgedacht</span></div>
                  </>
                )}

                {step === 6 && (
                  <>
                    <h2 className="sf-q">Was ist dir am wichtigsten?</h2>
                    <p className="sf-micro">Zieh die Regler je nach Wichtigkeit. <em>(1 = nebensächlich · 5 = entscheidend)</em></p>
                    <div className="sf-priolist">
                      {PRIORITY_LIST.map((p) => (
                        <div key={p} className="sf-prio2">
                          <span className="sf-prio2__label">{p}</span>
                          <input type="range" min="1" max="5" value={a.prioritaeten[p]} onChange={(e) => setPrio(p, Number(e.target.value))} style={{ '--p': `${((a.prioritaeten[p] - 1) / 4) * 100}%` }} />
                          <span className="sf-prio2__val">{a.prioritaeten[p]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="sf-nav">
              {step > 0 ? <button type="button" className="sf-link" onClick={back}><ArrowLeft size={16} /> Zurück</button> : <span />}
              <div className="sf-nav__right">
                {!valid[step] && <span className="sf-hint">Bitte triff erst deine Auswahl.</span>}
                <button type="button" className="sf-btn-primary" onClick={next} disabled={!valid[step]}>
                  {step === 6 ? 'Ergebnis anzeigen' : 'Weiter'} <ArrowRight size={17} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          <aside className="sf-side">
            <div className="sf-profile">
              <span className="sf-profile__eyebrow"><Sparkles size={13} strokeWidth={2} /> VIDEKO Stylefinder</span>
              <h3 className="sf-profile__title">Dein Stylefinder-Profil.</h3>
              <div className="sf-compass2">
                <div className="sf-compass2__viz">
                  <svg className="sf-arc" viewBox="0 0 240 150" aria-hidden="true">
                    <path className="sf-arc__bg" d="M20,140 A100,100 0 0 1 220,140" />
                    <path className="sf-arc__fg" d="M20,140 A100,100 0 0 1 220,140" style={{ strokeDasharray: 314.16, strokeDashoffset: 314.16 * (1 - answeredSteps / 7) }} />
                  </svg>
                  {Array.from({ length: 7 }).map((_, i) => {
                    const a = Math.PI * (1 + i / 6)
                    const x = 120 + 100 * Math.cos(a)
                    const y = 140 + 100 * Math.sin(a)
                    const on = i < answeredSteps
                    return <span key={i} className={`sf-pt ${on ? 'is-on' : ''}`} style={{ left: `${(x / 240) * 100}%`, top: `${(y / 200) * 100}%` }}>{on ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
                  })}
                  <div className="sf-badge"><span className="sf-badge__marble" aria-hidden="true" /><img src={logoMain} alt="VIDEKO Küchen" /></div>
                </div>
                <span className="sf-compass2__cap">{answeredSteps} von 7 erfasst</span>
                <span className="sf-compass2__sub">{answeredSteps >= 7 ? 'Profil vollständig' : 'Profil wächst'}</span>
              </div>
              <div className="sf-bars">
                {Object.entries(profile.bars).map(([k, v]) => (
                  <div className="sf-bar" key={k}>
                    <div className="sf-bar__top"><span>{k}</span><span className="sf-bar__pct">{v}%</span></div>
                    <div className="sf-bar__track"><span style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="sf-profile__status">
                <span>{maxReached >= 7 ? 7 : maxReached + (valid[step] ? 1 : 0)} / 7 Schritte erfasst</span>
                <span className="sf-profile__muted">Fertig in ca. 1–2 Minuten</span>
              </div>
              <button type="button" className="sf-link sf-save" onClick={saveProgress}><Save size={15} /> {saved ? 'Gespeichert!' : 'Fortschritt speichern'}</button>
              <div className="sf-tip"><span className="sf-tip__head"><Gem size={13} strokeWidth={2} /> Experten-Tipp</span><p>{EXPERT_TIPS[step]}</p></div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
