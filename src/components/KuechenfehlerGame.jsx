import { useRef, useState, useCallback } from 'react'
import { Search, Eye, Lightbulb, Check, ArrowRight, Square, Lamp, Plug, Boxes, Trash2, Cpu, Ruler, MoveHorizontal } from 'lucide-react'

import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'
import scene from '../assets/images/kuechenfehler/scene.png'
import ctaBg from '../assets/images/kuechenfehler/cta-bg.png'

const HOTSPOTS = [
  { id: 1, title: 'Zu wenig Arbeitsfläche', x: 49, y: 48, r: 6, text: 'Die Arbeitsfläche ist zu knapp bemessen. Das macht Kochen und Vorbereiten im Alltag schnell unpraktisch.', hint: 'Dort, wo vorbereitet wird, sollte genug Platz sein.' },
  { id: 2, title: 'Müllsystem ungünstig platziert', x: 91, y: 67, r: 6, text: 'Wenn der Müll zu weit weg oder ungeschickt sitzt, wird jeder Handgriff unnötig umständlich.', hint: 'Achte auf das, was beim Schnippeln ständig gebraucht wird.' },
  { id: 3, title: 'Schwaches Arbeitslicht', x: 59, y: 31, r: 7, text: 'Gute Küchenbeleuchtung ist kein Deko-Thema. Wer schlecht sieht, arbeitet schlechter.', hint: 'Nicht nur schönes Licht zählt, sondern brauchbares Licht.' },
  { id: 4, title: 'Steckdosen nicht da, wo man sie braucht', x: 60, y: 41, r: 6, text: 'Kleingeräte brauchen Strom an sinnvollen Stellen – nicht erst nach einer Kabel-Expedition.', hint: 'Denk an Kaffeemaschine, Toaster, Mixer und Co.' },
  { id: 5, title: 'Laufwege unpraktisch', x: 68, y: 48, r: 8, text: 'Zwischen Kühlen, Spülen und Kochen sollte die Küche mitdenken – nicht gegen dich arbeiten.', hint: 'Die Küche sollte dich nicht auf Wanderschaft schicken.' },
  { id: 6, title: 'Geräteposition unergonomisch', x: 84, y: 41, r: 7, text: 'Wenn Geräte zu tief oder unglücklich sitzen, nervt dich das jeden einzelnen Tag.', hint: 'Schau auf die Einbauhöhe der Geräte.' },
  { id: 7, title: 'Stauraum nicht clever genutzt', x: 80, y: 66, r: 7, text: 'Schöner Look bringt wenig, wenn Stauraum verschenkt wird oder Dinge schwer erreichbar sind.', hint: 'Nicht jeder schöne Bereich ist auch praktisch genutzt.' },
  { id: 8, title: 'Ergonomie nicht mitgedacht', x: 50, y: 45, r: 6, text: 'Gute Planung fühlt sich im Alltag leicht an. Schlechte Planung merkt man bei jedem Griff.', hint: 'Achte auf die tägliche Nutzungshöhe und Greifzone.' },
]

const WRONG = [
  'Knapp vorbei. Die Pflanze ist unschuldig.',
  'Schöner Versuch. Aber das ist diesmal nicht der Übeltäter.',
  'Sieht verdächtig aus, ist aber unschuldig.',
  'Fast. Da liegt der Hund heute nicht begraben.',
]

const HOWTO = [
  { icon: Search, t: 'Küche untersuchen', d: 'Klicke dich durch die Küche und schau genau hin – die Fehler sind gut versteckt.' },
  { icon: Eye, t: 'Fehler finden', d: 'Entdecke alle 8 Planungsfehler, die den Alltag später unnötig erschweren.' },
  { icon: Lightbulb, t: 'Besser planen', d: 'Verstehe typische Stolperfallen – und plane deine Küche von Anfang an richtig.' },
]

const THEMES = [
  { icon: Square, t: 'Arbeitsfläche' }, { icon: MoveHorizontal, t: 'Laufwege' }, { icon: Lamp, t: 'Licht' }, { icon: Plug, t: 'Steckdosen' },
  { icon: Boxes, t: 'Stauraum' }, { icon: Trash2, t: 'Müllsystem' }, { icon: Cpu, t: 'Geräteposition' }, { icon: Ruler, t: 'Ergonomie' },
]

export default function KuechenfehlerGame() {
  const imgRef = useRef(null)
  const [found, setFound] = useState([])
  const [active, setActive] = useState(null)
  const [wrong, setWrong] = useState(null)
  const [hint, setHint] = useState(null)
  const wrongTimer = useRef(0)
  const hintTimer = useRef(0)

  const onClick = useCallback((e) => {
    const el = imgRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * 100
    const py = ((e.clientY - r.top) / r.height) * 100
    const hit = HOTSPOTS.find((h) => {
      const dx = ((px - h.x) / 100) * r.width
      const dy = ((py - h.y) / 100) * r.height
      return Math.hypot(dx, dy) <= (h.r / 100) * r.width
    })
    if (hit) {
      setActive(hit.id)
      setWrong(null)
      setFound((f) => (f.includes(hit.id) ? f : [...f, hit.id]))
    } else {
      const msg = WRONG[Math.floor((found.length + (wrong ? 1 : 0)) % WRONG.length)]
      setWrong({ x: px, y: py, msg })
      clearTimeout(wrongTimer.current)
      wrongTimer.current = setTimeout(() => setWrong(null), 2000)
    }
  }, [found.length, wrong])

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
          <h2 className="kfg-title">Finde die <span className="grad">8 Küchensünden</span></h2>
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
            <p className="kfg-hinttext">Klicke in die Küche, um versteckte Planungsfehler zu entdecken. <b>Schon {count} von 8 gefunden – weiter so!</b></p>
          </Reveal>

          <Reveal className="kfg-side" delay={0.1}>
            <span className="kfg-side__h">Dein Fortschritt</span>
            <span className="kfg-side__count">{count} von 8 gefunden</span>
            <span className="kfg-bar"><span style={{ width: `${(count / 8) * 100}%` }} /></span>
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
              <span className="kfg-reward__d">Wer alle 8 findet, versteht Küchenplanung besser als so mancher Prospekt. 😉</span>
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
