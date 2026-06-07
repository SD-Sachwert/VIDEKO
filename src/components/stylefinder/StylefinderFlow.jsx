import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Lock, Save, RefreshCw, ChevronUp, ChevronDown, Heart,
  Users, PartyPopper, ChefHat, Archive, Wind, LayoutGrid, Zap, Droplets, Leaf, Sun, Footprints, Gem,
} from 'lucide-react'

import CTAButton from '../CTAButton.jsx'
import { EMPTY_ANSWERS, computeProfile, computeResultStyle } from './stylefinderLogic.js'

import sModern from '../../assets/images/stylefinder_assets_videko/02_stil_hell_modern_minimal.png'
import sNatur from '../../assets/images/stylefinder_assets_videko/03_stil_skandinavisch_natuerlich.png'
import sDunkel from '../../assets/images/stylefinder_assets_videko/05_stil_dunkel_luxurioes_wohnlich.png'
import sHell from '../../assets/images/stylefinder_assets_videko/08_stil_hell_luxurioes_mit_pflanzen.png'
import sLandhaus from '../../assets/images/stylefinder_assets_videko/04_stil_hell_wohnlich_landhaus_modern.png'
import sIndustrial from '../../assets/images/stylefinder_assets_videko/06_stil_industrial_dark_city.png'

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
import iInsel from '../../assets/images/inspiration/07_kueche_mit_insel.png'
import iKlein from '../../assets/images/inspiration/08_kleine_kueche_clever_geplant.png'
import iDetails from '../../assets/images/inspiration/06_materialien_und_details.png'

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
  { label: 'Viel Stauraum', img: iKlein }, { label: 'Kurze Wege', img: iModernK },
  { label: 'Große Arbeitsfläche', img: iDetails }, { label: 'Offene Wohnküche', img: sHell },
  { label: 'Kochen zu zweit', img: iWohnlich }, { label: 'Familienalltag', img: iWohnlich },
  { label: 'Kücheninsel', img: iInsel }, { label: 'Geräte auf Augenhöhe', img: sModern },
  { label: 'Speisekammer', img: iKlein }, { label: 'Frühstücksplatz', img: iHell },
  { label: 'Homebar', img: sDunkel }, { label: 'Ruhiger Look trotz Funktion', img: sModern },
]
const BUDGETS = ['bis 10.000 €', '10.000 – 15.000 €', '15.000 – 20.000 €', '20.000 – 30.000 €', '30.000 €+', 'noch offen']

const EXPERT_TIPS = [
  'Vertrau deinem Bauchgefühl – dein erster Eindruck verrät oft am meisten.',
  'Überleg, was dich im Alltag wirklich nervt. Genau das lösen wir zuerst.',
  'Materialien dürfen sich beißen – Kontraste machen eine Küche spannend.',
  'Eine ruhige Basisfarbe + ein Akzent wirkt fast immer hochwertig.',
  'Kurze Wege zwischen Spüle, Herd und Kühlschrank sparen täglich Nerven.',
  'Budget heißt Priorisieren – wir holen das Maximum aus deinem Rahmen.',
  'Was oben steht, planen wir zuerst kompromisslos – der Rest folgt klug.',
  'Dein Ergebnis ist ein Startpunkt, kein Urteil. Wir verfeinern es gemeinsam.',
]

const RESULT = {
  'Warm & natürlich': { img: sNatur, char: 'Warme Töne, natürliche Materialien, ein Raum zum Ankommen.', tags: ['Natürlich', 'Warm', 'Einladend', 'Harmonisch'], mats: [mHolz, mNaturstein, mKeramik] },
  'Modern & grifflos': { img: sModern, char: 'Klar, reduziert, zeitlos – Technik und Ruhe in Balance.', tags: ['Modern', 'Minimal', 'Klar', 'Funktional'], mats: [mLack, mGlas, mNaturstein] },
  'Dunkel & elegant': { img: sDunkel, char: 'Tiefe Töne, edle Oberflächen, ein Statement mit Stil.', tags: ['Elegant', 'Edel', 'Dramatisch', 'Hochwertig'], mats: [mNaturstein, mMetall, mBronze] },
  'Hell & zeitlos': { img: sHell, char: 'Helligkeit, Leichtigkeit und Details, die bleiben.', tags: ['Hell', 'Zeitlos', 'Leicht', 'Fein'], mats: [mLack, mGlas, mHolz] },
  'Landhaus modern': { img: sLandhaus, char: 'Charaktervoll, warm und modern interpretiert.', tags: ['Wohnlich', 'Warm', 'Charakter', 'Natürlich'], mats: [mHolz, mNaturstein, mKeramik] },
  'Statement / Industrial': { img: sIndustrial, char: 'Roh, markant, urban – Küche mit Haltung.', tags: ['Industrial', 'Markant', 'Urban', 'Stark'], mats: [mMetall, mNaturstein, mBronze] },
}

const MOODS = ['Stimmung', 'Premium', 'Harmonie', 'Funktional', 'Großzügig', 'Offen']
const DETAILS = ['Arbeitsplatte', 'Fronten', 'Griffe', 'Armatur', 'Licht', 'Stauraum']

function Chip({ active, onClick, children }) {
  return <button type="button" className={`sf-chip ${active ? 'is-active' : ''}`} onClick={onClick} aria-pressed={active}>{active && <Check size={14} strokeWidth={2.6} />} {children}</button>
}

export default function StylefinderFlow() {
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [a, setA] = useState(EMPTY_ANSWERS)
  const [saved, setSaved] = useState(false)
  const [mood, setMood] = useState(0)
  const [detail, setDetail] = useState({ Arbeitsplatte: 3, Fronten: 3, Griffe: 2, Armatur: 3, Licht: 4, Stauraum: 3 })
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
  const movePrio = (i, dir) => setA((p) => {
    const arr = [...p.prioritaeten]; const j = i + dir
    if (j < 0 || j >= arr.length) return p
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    return { ...p, prioritaeten: arr }
  })

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
            <p className="sf-result__note">Wir haben deinen Stil gefunden – und der passt ziemlich gut zu dir.</p>
          </div>
          <div className="sf-result__card">
            <div className="sf-result__media"><img src={R.img} alt={resultStyle} /></div>
            <div className="sf-result__body">
              <span className="sf-result__type">{resultStyle}</span>
              <p className="sf-result__blurb">{R.char}</p>
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
              <div className="sf-result__cta">
                <CTAButton to="/beratung">Termin vereinbaren</CTAButton>
                <CTAButton to="/beratung" variant="dark">Persönliche Beratung anfragen</CTAButton>
              </div>
              <button type="button" className="sf-link sf-restart" onClick={restart}><RefreshCw size={15} /> Neu starten</button>
            </div>
          </div>
        </div>
      ) : (
        <>
        <div className="sf-layout">
          <div className="sf-main">
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
                    <p className="sf-micro">Wähle aus, was dir im Alltag wirklich wichtig ist. <em>(Mehrfachauswahl)</em></p>
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
                    <p className="sf-micro">Oberflächen, Details und Haptiken, die dich anziehen. <em>(Mehrfachauswahl)</em></p>
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
                    <p className="sf-micro">Wähle die Töne, die deine Küche tragen sollen. <em>(Mehrfachauswahl)</em></p>
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
                    <p className="sf-micro">Wähle, was im Alltag für dich wirklich zählt. <em>(Mehrfachauswahl)</em></p>
                    <div className="sf-imggrid sf-imggrid--4">
                      {FUNKTION.map((o) => {
                        const active = a.funktion.includes(o.label)
                        return (
                          <div key={o.label} role="button" tabIndex={0} className={`sf-imgcard sf-imgcard--sm ${active ? 'is-active' : ''}`} onClick={() => toggle('funktion', o.label)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle('funktion', o.label) } }}>
                            <span className="sf-imgcard__img" style={{ backgroundImage: `url(${o.img})` }}>
                              <button type="button" className={`sf-like ${liked.has(o.label) ? 'is-on' : ''}`} aria-label="Merken" onClick={(e) => toggleLike(e, o.label)}><Heart size={14} strokeWidth={2} fill={liked.has(o.label) ? 'currentColor' : 'none'} /></button>
                              {active && <span className="sf-imgcard__check"><Check size={13} strokeWidth={2.8} /></span>}
                            </span>
                            <span className="sf-imgcard__label">{o.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <h2 className="sf-q">Welcher Rahmen passt zu deinem Projekt?</h2>
                    <p className="sf-micro">Nicht auf den Euro genau – aber so, dass wir realistisch planen können.</p>
                    <div className="sf-segments">{BUDGETS.map((b) => <button key={b} type="button" className={`sf-segment ${a.budget === b ? 'is-active' : ''}`} onClick={() => set('budget', b)}>{b}</button>)}</div>
                    <div className="sf-infobox"><span>Realistische Einordnung</span><span>Planungssicherheit</span><span>Im Preis mitgedacht</span></div>
                  </>
                )}

                {step === 6 && (
                  <>
                    <h2 className="sf-q">Was ist dir am wichtigsten?</h2>
                    <p className="sf-micro">Bring deine Wünsche in eine Reihenfolge – damit wir wissen, worauf es ankommt.</p>
                    <ol className="sf-prio">
                      {a.prioritaeten.map((p, i) => (
                        <li key={p} className="sf-prio__item">
                          <span className="sf-prio__rank">{i + 1}</span>
                          <span className="sf-prio__label">{p}</span>
                          <span className="sf-prio__ctrl">
                            <button type="button" onClick={() => movePrio(i, -1)} disabled={i === 0} aria-label="Höher"><ChevronUp size={16} /></button>
                            <button type="button" onClick={() => movePrio(i, 1)} disabled={i === a.prioritaeten.length - 1} aria-label="Tiefer"><ChevronDown size={16} /></button>
                          </span>
                        </li>
                      ))}
                    </ol>
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
              <div className="sf-donut">
                <svg viewBox="0 0 110 110">
                  <circle className="sf-donut__bg" cx="55" cy="55" r="46" />
                  <circle className="sf-donut__fg" cx="55" cy="55" r="46" transform="rotate(-90 55 55)" style={{ strokeDasharray: 289, strokeDashoffset: 289 * (1 - profile.completeness / 100) }} />
                </svg>
                <span className="sf-donut__val">{profile.completeness}%<small>Profil</small></span>
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

        {/* LIVE VORSCHAU + DETAIL ANPASSEN */}
        <div className="sf-preview-row">
          <div className="sf-preview">
            <span className="sf-block__head">Live Vorschau</span>
            <div className="sf-preview__media" style={{ backgroundImage: `url(${R.img})` }}>
              <span className="sf-preview__scrim" aria-hidden="true" />
              <span className="sf-preview__cap">{MOODS[mood]} · {resultStyle}</span>
            </div>
            <div className="sf-preview__tabs">
              {MOODS.map((m, k) => <button key={m} type="button" className={`sf-mood ${mood === k ? 'is-active' : ''}`} onClick={() => setMood(k)}>{m}</button>)}
            </div>
          </div>
          <div className="sf-detail">
            <span className="sf-block__head">Detail anpassen</span>
            {DETAILS.map((d) => (
              <div className="sf-detail__row" key={d}>
                <span className="sf-detail__label">{d}</span>
                <input type="range" min="1" max="5" value={detail[d]} onChange={(e) => setDetail({ ...detail, [d]: Number(e.target.value) })} style={{ '--p': `${((detail[d] - 1) / 4) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  )
}
