import { useRef, useState, useCallback, useEffect } from 'react'
import { Search, Eye, Lightbulb, Check, ArrowRight, Square, Lamp, Plug, Boxes, Trash2, Cpu, Ruler, MoveHorizontal } from 'lucide-react'

import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'
import scene from '../assets/images/kuechenfehler/scene.png'
import ctaBg from '../assets/images/kuechenfehler/cta-bg.png'

const HOTSPOTS = [
  { id: 1, title: 'Kühlschrank im Abseits', x: 9, y: 42, r: 7, text: 'Der Kühlschrank sitzt zu weit weg vom eigentlichen Arbeitsbereich. Kühlen, Spülen und Kochen werden dadurch unnötig laufintensiv.', hint: 'Achte auf die Wege zwischen Kühlen, Spülen und Kochen.' },
  { id: 2, title: 'Zu wenig Durchgang', x: 48, y: 35, r: 6, text: 'Die Insel steht zu nah an der Küchenzeile. Sobald jemand kocht, spült oder eine Tür öffnet, wird es hier schnell eng.', hint: 'Wie viel Platz bleibt zwischen Insel und Zeile?' },
  { id: 3, title: 'Zu wenig Arbeitsfläche am Kochfeld', x: 47, y: 45, r: 6, text: 'Das Kochfeld nimmt auf der Insel zu viel Platz ein. Für Schneidebrett, Schüsseln, Gewürze oder heiße Töpfe bleibt kaum echte Arbeitsfläche.', hint: 'Wo wird geschnitten und abgestellt, wenn der Topf läuft?' },
  { id: 4, title: 'Steckdose an der Insel fehlt', x: 58, y: 55, r: 5, text: 'Eine Insel ohne Steckdose ist hübsch, aber im Alltag schnell unpraktisch. Mixer, Küchenmaschine oder Laptop brauchen Strom genau dort, wo gearbeitet wird.', hint: 'Kleingeräte brauchen Strom – auch auf der Insel.' },
  { id: 5, title: 'Kein Stauraum unter den Sitzplätzen', x: 45, y: 56, r: 6, text: 'Unter dem Sitzbereich bleibt Stauraum verschenkt. Gerade bei kleinen Küchen zählt jeder sinnvoll genutzte Zentimeter.', hint: 'Schau unter den Sitzbereich.' },
  { id: 6, title: 'Wasserhahn vor dem Fenster', x: 63, y: 25, r: 6, text: 'Der Wasserhahn sitzt ungünstig vor dem Fenster. Wenn das Fenster nicht richtig aufgeht, ist das kein Detailfehler, sondern Alltagstheater.', hint: 'Schau, was vor dem Fenster im Weg steht.' },
  { id: 7, title: 'Nur Türenschränke statt Auszüge', x: 63, y: 36, r: 6, text: 'Viele Türenschränke bedeuten: öffnen, bücken, suchen, fluchen. Auszüge wären deutlich ergonomischer und übersichtlicher.', hint: 'Bücken und suchen – oder herausziehen?' },
  { id: 8, title: 'Stauraum an der Wand verschenkt', x: 75, y: 15, r: 7, text: 'Die Wandfläche bleibt ungenutzt. Das sieht luftig aus, verschenkt aber Stauraum – besonders wenn unten ohnehin wenig clever gelöst ist.', hint: 'Die Wandfläche könnte mehr leisten.' },
  { id: 9, title: 'Backofen zu tief geplant', x: 72, y: 43, r: 6, text: 'Der Backofen sitzt zu niedrig. Jedes Blech wird zur Kniebeuge. Kann man machen – muss man aber nicht, wenn man besser plant.', hint: 'Achte auf die Einbauhöhe der Geräte.' },
]

const WRONG = [
  'Fast. Da liegt der Küchenhund heute nicht begraben.',
  'Guter Klick, falscher Tatort.',
  'Da ist nichts. Außer vielleicht dein Bauchgefühl.',
  'Knapp daneben ist auch vorbei geplant.',
  'Hier ist alles sauber. Verdächtig sauber sogar.',
  'Der Fehler versteckt sich woanders. Der kleine Mistkerl.',
  'Das war’s nicht. Aber der Ehrgeiz gefällt uns.',
  'Leider nein. Diese Ecke ist unschuldig.',
  'Klick war gut. Ziel war frech daneben.',
  'Noch kein Treffer. Der Raum lacht leise.',
]

const HOWTO = [
  { icon: Search, t: 'Küche untersuchen', d: 'Klicke dich durch die Küche und schau genau hin – die Fehler sind gut versteckt.' },
  { icon: Eye, t: 'Fehler finden', d: 'Entdecke alle 9 Planungsfehler, die den Alltag später unnötig erschweren.' },
  { icon: Lightbulb, t: 'Besser planen', d: 'Verstehe typische Stolperfallen – und plane deine Küche von Anfang an richtig.' },
]

const THEMES = [
  { icon: Square, t: 'Arbeitsfläche' }, { icon: MoveHorizontal, t: 'Laufwege' }, { icon: Plug, t: 'Steckdosen' }, { icon: Boxes, t: 'Stauraum' },
  { icon: Lamp, t: 'Fensterplanung' }, { icon: Trash2, t: 'Auszüge' }, { icon: Cpu, t: 'Gerätehöhe' }, { icon: Ruler, t: 'Ergonomie' },
]

export default function KuechenfehlerGame() {
  const imgRef = useRef(null)
  const [found, setFound] = useState([])
  const [active, setActive] = useState(null)
  const [wrong, setWrong] = useState(null)
  const [hint, setHint] = useState(null)
  const wrongTimer = useRef(0)
  const hintTimer = useRef(0)
  const wrongBag = useRef([]) // gemischter "Sack": jeder Spruch genau 1x, bis alle durch sind, dann neu mischen

  const nextWrong = () => {
    if (wrongBag.current.length === 0) {
      const arr = WRONG.map((_, i) => i)
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      wrongBag.current = arr
    }
    return WRONG[wrongBag.current.pop()]
  }

  const onClick = useCallback((e) => {
    const el = imgRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * 100
    const py = ((e.clientY - r.top) / r.height) * 100
    const hit = HOTSPOTS.find((h) => {
      const dx = ((px - h.x) / 100) * r.width
      const dy = ((py - h.y) / 100) * r.height
      // etwas kleinere, aber noch fingerfreundliche Hitbox (visuell unverändert)
      const hitR = Math.max((h.r / 100) * r.width * 1.12, 22)
      return Math.hypot(dx, dy) <= hitR
    })
    if (hit) {
      setActive(hit.id)
      setWrong(null)
      setFound((f) => (f.includes(hit.id) ? f : [...f, hit.id]))
    } else {
      // Popup schließen + zufälligen Spruch (ohne Wiederholung bis alle durch sind) zeigen
      setActive(null)
      setWrong({ x: Math.min(84, Math.max(16, px)), y: Math.min(86, Math.max(14, py)), msg: nextWrong() })
      clearTimeout(wrongTimer.current)
      wrongTimer.current = setTimeout(() => setWrong(null), 2200)
    }
  }, [])

  // Popup: Klick außerhalb / Escape schließt; X bleibt zusätzlich erhalten
  useEffect(() => {
    if (active == null) return
    const onDoc = (ev) => { if (!ev.target.closest('.kfg-pop') && !ev.target.closest('.kfg-marker')) setActive(null) }
    const onKey = (ev) => { if (ev.key === 'Escape') setActive(null) }
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0)
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [active])

  const showHint = () => {
    const next = HOTSPOTS.find((h) => !found.includes(h.id))
    if (!next) return
    setHint(next.id)
    clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(null), 4000)
  }
  const revealAll = () => { setFound(HOTSPOTS.map((h) => h.id)); setActive(null); setHint(null) }

  const activeHs = active != null ? HOTSPOTS.find((h) => h.id === active) : null
  const hintHs = hint != null ? HOTSPOTS.find((h) => h.id === hint) : null
  const count = found.length
  const done = count === HOTSPOTS.length

  return (
    <section className="section section--light kfg">
      <div className="container">
        <Reveal className="kfg-head">
          <span className="kfg-badge">Interaktiv</span>
          <h2 className="kfg-title">Finde die <span className="grad">9 Küchensünden</span></h2>
          <p className="kfg-sub">Klicke in die Küche und finde die Planungsfehler, die im Alltag wirklich nerven.</p>
        </Reveal>

        <div className="kfg-main">
          <Reveal className="kfg-stagewrap">
            <div className="kfg-stage" ref={imgRef} onClick={onClick}>
              <img src={scene} alt="Küche – finde die Planungsfehler" draggable={false} />
              {found.map((id) => {
                const h = HOTSPOTS.find((x) => x.id === id)
                return <span key={id} className={`kfg-marker ${active === id ? 'is-active' : ''}`} style={{ left: `${h.x}%`, top: `${h.y}%` }} onClick={(e) => { e.stopPropagation(); setActive(id) }}><Check size={14} strokeWidth={3} /></span>
              })}
              {hintHs && <span className="kfg-hintring" style={{ left: `${hintHs.x}%`, top: `${hintHs.y}%` }} aria-hidden="true" />}
              {activeHs && (
                <div className={`kfg-pop ${activeHs.x > 55 ? 'kfg-pop--l' : 'kfg-pop--r'}`} style={{ left: `${activeHs.x}%`, top: `${activeHs.y}%` }} onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="kfg-pop__x" onClick={() => setActive(null)} aria-label="Schließen">×</button>
                  <span className="kfg-pop__t">{activeHs.title}</span>
                  <span className="kfg-pop__d">{activeHs.text}</span>
                </div>
              )}
              {wrong && <div className="kfg-wrong" style={{ left: `${wrong.x}%`, top: `${wrong.y}%` }}>{wrong.msg}</div>}
            </div>
            <p className="kfg-hinttext">Klicke in die Küche, um versteckte Planungsfehler zu entdecken. <b>Schon {count} von 9 gefunden – weiter so!</b></p>
          </Reveal>

          <Reveal className="kfg-side" delay={0.1}>
            <span className="kfg-side__h">Dein Fortschritt</span>
            <span className="kfg-side__count">{count} von 9 gefunden</span>
            <span className="kfg-bar"><span style={{ width: `${(count / 9) * 100}%` }} /></span>
            <div className="kfg-circles">
              {HOTSPOTS.map((h) => <span key={h.id} className={`kfg-circle ${found.includes(h.id) ? 'is-on' : ''}`}>{found.includes(h.id) ? <Check size={12} strokeWidth={3} /> : h.id}</span>)}
            </div>
            <div className="kfg-side__btns">
              <button type="button" className="kfg-btn kfg-btn--primary" onClick={showHint} disabled={done}>Hinweis anzeigen</button>
              <button type="button" className="kfg-btn" onClick={revealAll}>Alle Fehler aufdecken</button>
            </div>
            {hintHs && <p className="kfg-side__hint"><Lightbulb size={14} strokeWidth={2} /> {hintHs.hint}</p>}
            <div className="kfg-found">
              <span className="kfg-found__h">Bereits gefunden</span>
              {count === 0 && <span className="kfg-found__empty">Noch nichts entdeckt – klick dich rein.</span>}
              {found.map((id) => <span key={id} className="kfg-found__item"><Check size={13} strokeWidth={3} /> {HOTSPOTS.find((h) => h.id === id).title}</span>)}
            </div>
            <div className="kfg-reward">
              <span className="kfg-reward__t">Kleine Belohnung</span>
              <span className="kfg-reward__d">Wer alle 9 findet, versteht Küchenplanung besser als so mancher Prospekt. 😉</span>
            </div>
          </Reveal>
        </div>

        <div className="kfg-howto">
          {HOWTO.map((c, i) => (
            <Reveal key={c.t} className="kfg-howcard" delay={i * 0.06}>
              <span className="kfg-howcard__ic"><c.icon size={20} strokeWidth={1.7} /></span>
              <span className="kfg-howcard__t">{c.t}</span>
              <span className="kfg-howcard__d">{c.d}</span>
            </Reveal>
          ))}
        </div>

        <div className="kfg-themes-head"><span className="kicker">Welche Sünden verstecken sich?</span></div>
        <div className="kfg-themes">
          {THEMES.map((t) => (
            <Reveal key={t.t} as="div" className="kfg-theme"><span className="kfg-theme__ic"><t.icon size={18} strokeWidth={1.7} /></span><span>{t.t}</span></Reveal>
          ))}
        </div>
      </div>

      <div className="container">
        <Reveal className="kfg-cta" style={{ backgroundImage: `url(${ctaBg})` }}>
          <span className="kfg-cta__veil" aria-hidden="true" />
          <div className="kfg-cta__inner">
            <h3 className="kfg-cta__title">{done ? 'Alle 8 gefunden!' : 'Alle 8 gefunden?'} <span className="grad">Dann wird's Zeit für die echte Planung.</span></h3>
            <p className="kfg-cta__text">Wir verwandeln dein Spielerlebnis in eine maßgeschneiderte Küche, die wirklich zu dir, deinem Alltag und deinem Raum passt.</p>
            <CTAButton to="/beratung">Kostenlosen Küchencheck starten <ArrowRight size={16} strokeWidth={2} /></CTAButton>
            <div className="kfg-cta__benefits"><span>Unverbindlich</span><span>Individuell</span><span>Persönlich</span></div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
