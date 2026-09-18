import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from './SpielKarte.jsx'
import { useSpielLauf } from './spiel-lauf.js'
import { istPausiert } from './spiele/spiel-pause.js'
import { SPIEL_NACH_KEY, TEXTE } from '../data/terminal.js'

/**
 * KUECHEN-DASH — laufen, springen, nicht hängen bleiben.
 *
 * Der Monteur läuft von allein durch Baustelle und Küchenstudio. Ein Tipp ist
 * ein Sprung. Im Weg: Kartons, Rohre, Kabelrollen, Arbeitsplatten, Farbeimer,
 * Paletten, Schränke, Möbelfüße und Leitern. Im Hintergrund ziehen ab und zu
 * Schilder vorbei — BALD FERTIG, 90 TAGE, eine Mini-Toilette, eine Kiste mit
 * 2.500 Möbelfüßen. Die sind reine Deko: sie stehen nie im Weg, melden sich
 * nicht über dem Spielfeld und ändern nichts am Ablauf.
 *
 * FAIR BLEIBT ES SO
 * -----------------
 * Alles rechnet in Feldhöhen (h). Der Sprung erreicht 0,44 h und dauert rund
 * 0,56 s; kein Hindernis ist höher als 0,28 h oder breiter als 0,30 h. Der
 * Abstand zum nächsten Hindernis ist nie kleiner als Tempo × (Flugzeit + 0,35 s)
 * plus Hindernisbreite — ein Sprung mit sauberer Landung reicht also immer.
 * Die Trefferzonen sind nach innen versetzt: wer knapp drüber ist, ist drüber.
 * Es gibt genau einen Sprung, keinen Doppelsprung.
 *
 * DER SERVER RECHNET MIT
 * ---------------------
 * Punkte sind Meter, 10 Meter je h. Das Tempo startet bei 1,4 h/s und endet
 * nach rund 400 m bei 2,2 h/s, also 22 m/s — schneller nicht, weil ein
 * Hindernis auf einem Hochkant-Handy sonst zu kurz sichtbar wäre;
 * der Server erlaubt bis 33 m/s (msJePunkt 30). Die Punkte gehen alle 150 ms
 * gesammelt an useSpielLauf, der Rest vor der Abgabe.
 *
 * Und wie bei allen Spielen: kein Einfluss auf die Ziehung.
 */

const SPIEL = SPIEL_NACH_KEY.kuechen_dash
const T = TEXTE.g

const BODEN = 0.8 // Bodenlinie, Anteil der Feldhöhe von oben
const LAEUFER_X = 0.22 // Anteil der Feldbreite
const LAEUFER_B = 0.13
const LAEUFER_H = 0.24
const SCHWERE = 11
const ABSPRUNG = 3.1
const TEMPO_START = 1.4
const TEMPO_MAX = 2.2
const TEMPO_ZUWACHS = 0.02 // h/s je gelaufenem h
const FRUEH_BIS = 6 // h, also 60 m nur flache Hindernisse
const PUFFER_MS = 120
const CRASH_MS = 450

/* Die Hindernisse: Breite und Höhe in h, `tief` = darf früh kommen. */
const ARTEN = {
  karton: { b: 0.15, h: 0.13, tief: true },
  rohr: { b: 0.26, h: 0.07, tief: true },
  kabel: { b: 0.13, h: 0.13, tief: true },
  eimer: { b: 0.1, h: 0.12, tief: true },
  palette: { b: 0.3, h: 0.07, tief: true },
  fuss: { b: 0.18, h: 0.09, tief: true },
  platte: { b: 0.28, h: 0.11, tief: false },
  schrank: { b: 0.13, h: 0.27, tief: false },
  leiter: { b: 0.12, h: 0.28, tief: false },
}
const NORMAL = Object.keys(ARTEN)
const FRUEH = NORMAL.filter((k) => ARTEN[k].tief)

/* Easter Eggs: nur im Hintergrund, nie im Weg. */
const DEKO = {
  toilette: { b: 0.14, h: 0.16, text: 'gagToilette' },
  fuesse2500: { b: 0.2, h: 0.15, text: 'gagFuesse' },
}

function summen(muster) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(muster)
  } catch {
    /* ohne Motor geht es auch */
  }
}

/** Die Hindernis-Grafiken. Einfach, lesbar, in VIDEKO-Farben. */
function Grafik({ art }) {
  const { b, h } = ARTEN[art] ?? DEKO[art]
  const W = Math.round(b * 100)
  const H = Math.round(h * 100)
  const box = `0 0 ${W} ${H}`
  const gold = 'var(--trm-gold, #d8b25a)'
  const dunkel = '#2a2520'
  const holz = '#8a6a44'
  const metall = '#9aa0a6'

  let inhalt
  switch (art) {
    case 'karton':
      inhalt = (
        <>
          <rect x="1" y="1" width={W - 2} height={H - 2} fill="#a07a4c" stroke="#5e4428" strokeWidth="1.5" />
          <rect x={W / 2 - 2} y="1" width="4" height={H - 2} fill="#d9c49c" opacity="0.8" />
          <path d={`M4 ${H - 5} h7`} stroke="#5e4428" strokeWidth="1.5" />
        </>
      )
      break
    case 'rohr':
      inhalt = (
        <>
          <rect x="3" y="1" width={W - 6} height={H - 2} rx={H / 2 - 1} fill={metall} stroke="#555b60" strokeWidth="1.5" />
          <rect x="6" y="2.5" width={W - 12} height="1.5" fill="#e4e8eb" opacity="0.7" />
          <rect x="1" y="0.5" width="4" height={H - 1} fill="#6d7378" />
          <rect x={W - 5} y="0.5" width="4" height={H - 1} fill="#6d7378" />
        </>
      )
      break
    case 'kabel':
      inhalt = (
        <>
          <circle cx={W / 2} cy={H / 2} r={H / 2 - 1} fill={holz} stroke="#4e3a22" strokeWidth="1.5" />
          <circle cx={W / 2} cy={H / 2} r={H / 2 - 3.5} fill="#1a1a1a" />
          <circle cx={W / 2} cy={H / 2} r={H / 2 - 5.5} fill="none" stroke="#e07b2e" strokeWidth="1" />
          <circle cx={W / 2} cy={H / 2} r="2" fill={holz} />
        </>
      )
      break
    case 'eimer':
      inhalt = (
        <>
          <path d={`M1 2 H${W - 1} L${W - 2} ${H - 1} H2 Z`} fill="#ecebe6" stroke="#8b8a84" strokeWidth="1.2" />
          <rect x="1" y="4" width={W - 2} height="3" fill={gold} />
          <path d={`M2 2 Q${W / 2} -2 ${W - 2} 2`} fill="none" stroke="#555" strokeWidth="1" />
        </>
      )
      break
    case 'palette':
      inhalt = (
        <>
          <rect x="0.5" y="0.5" width={W - 1} height="2.5" fill={holz} />
          <rect x="0.5" y={H - 2.5} width={W - 1} height="2" fill={holz} />
          {[0.5, W / 2 - 2.5, W - 5.5].map((x) => (
            <rect key={x} x={x} y="3" width="5" height={H - 5.5} fill="#6f5334" />
          ))}
        </>
      )
      break
    case 'fuss':
      inhalt = (
        <>
          {[1, W / 2 - 2.5, W - 6].map((x) => (
            <g key={x}>
              <rect x={x} y="1" width="5" height={H - 3} fill={metall} stroke="#5b6166" strokeWidth="0.8" />
              <rect x={x - 1} y={H - 2.5} width="7" height="2" fill={dunkel} />
            </g>
          ))}
        </>
      )
      break
    case 'platte':
      inhalt = (
        <>
          <rect x="0.5" y="0.5" width={W - 1} height="3.5" fill="#d8d2c4" stroke="#8b857a" strokeWidth="0.8" />
          <rect x="0.5" y="4" width={W - 1} height="1" fill={gold} />
          <path d={`M4 5 L9 ${H} M9 5 L4 ${H} M${W - 9} 5 L${W - 4} ${H} M${W - 4} 5 L${W - 9} ${H}`} stroke="#3a3530" strokeWidth="1.3" />
        </>
      )
      break
    case 'schrank':
      inhalt = (
        <>
          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="#23201c" stroke={gold} strokeWidth="1" />
          <path d={`M${W / 2} 2 V${H - 4}`} stroke="#4a443c" strokeWidth="0.8" />
          <rect x={W / 2 - 3} y={H * 0.4} width="1.2" height="5" fill={gold} />
          <rect x={W / 2 + 1.8} y={H * 0.4} width="1.2" height="5" fill={gold} />
          <rect x="1.5" y={H - 3} width={W - 3} height="2" fill="#141210" />
        </>
      )
      break
    case 'leiter':
      inhalt = (
        <>
          <path d={`M2 ${H} L${W / 2 - 1} 1 M${W - 2} ${H} L${W / 2 + 1} 1`} stroke="#c9ccd0" strokeWidth="2" />
          {[0.3, 0.5, 0.7, 0.9].map((f) => (
            <path
              key={f}
              d={`M${2 + (W / 2 - 3) * (1 - f)} ${H * f} H${W - 2 - (W / 2 - 3) * (1 - f)}`}
              stroke="#e07b2e"
              strokeWidth="1.4"
            />
          ))}
        </>
      )
      break
    case 'toilette':
      inhalt = (
        <>
          <rect x="1" y="1" width="5" height={H * 0.55} rx="1" fill="#f4f4f1" stroke="#9a9a94" strokeWidth="0.8" />
          <path d={`M4 ${H * 0.5} H${W - 1} Q${W - 1} ${H * 0.8} ${W * 0.55} ${H * 0.82} L${W * 0.6} ${H - 1} H${W * 0.3} L${W * 0.35} ${H * 0.8} Q4 ${H * 0.75} 4 ${H * 0.5} Z`} fill="#f4f4f1" stroke="#9a9a94" strokeWidth="0.8" />
          <path d={`M5 ${H * 0.48} H${W - 1.5}`} stroke={gold} strokeWidth="1.2" />
        </>
      )
      break
    case 'fuesse2500':
      inhalt = (
        <>
          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="#a07a4c" stroke="#5e4428" strokeWidth="1.2" />
          <rect x="2" y={H * 0.3} width={W - 4} height={H * 0.4} fill="#14110d" />
          <text x={W / 2} y={H * 0.56} textAnchor="middle" fontSize="4.6" fontWeight="700" fill={gold} fontFamily="system-ui, sans-serif">
            2.500 FÜSSE
          </text>
        </>
      )
      break
    default:
      inhalt = null
  }

  return (
    <svg viewBox={box} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {inhalt}
    </svg>
  )
}

/** Der VIDEKO-Monteur. Helm, Weste mit V, zwei Beine, die CSS bewegt. */
function Laeufer() {
  return (
    <svg viewBox="0 0 26 48" width="100%" height="100%" aria-hidden="true" focusable="false">
      <g className="trm-dash-bein trm-dash-bein--a">
        <rect x="9" y="31" width="4" height="14" rx="1.5" fill="#2b2b2b" />
        <rect x="8" y="43" width="7" height="4" rx="1" fill="#151515" />
      </g>
      <g className="trm-dash-bein trm-dash-bein--b">
        <rect x="13" y="31" width="4" height="14" rx="1.5" fill="#3a3a3a" />
        <rect x="12" y="43" width="7" height="4" rx="1" fill="#151515" />
      </g>
      <rect x="7" y="15" width="12" height="18" rx="3" fill="#2a2a2a" />
      <path d="M7 17 h12 v12 h-12z" fill="#e0a93a" />
      {/* Das V von VIDEKO auf der Weste. */}
      <path d="M10.2 18.4 L13 23.6 L15.8 18.4" fill="none" stroke="#141210" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 26.2 h12" stroke="#f3f1ea" strokeWidth="1.2" />
      <circle cx="13" cy="10" r="5" fill="#e2b894" />
      <path d="M7 9 a6 6 0 0 1 12 0 h2 v2 h-16 v-2z" fill="#d8b25a" />
      <rect x="18" y="17" width="4" height="10" rx="2" fill="#2a2a2a" className="trm-dash-arm" />
    </svg>
  )
}

/* Der Schluessel dieses Spiels — er steht im Lauf und im Pause-Register. */
const GAME = 'kuechen_dash'

export default function KuechenDash({ sitzung, best = null, onErgebnis }) {
  const [hindernisse, setHindernisse] = useState([])
  const [schilder, setSchilder] = useState([])
  const [meldung, setMeldung] = useState(null)
  const [meter, setMeter] = useState(0)
  const [pause, setPause] = useState(false)
  const [crash, setCrash] = useState(false)
  const [sanft, setSanft] = useState(false)

  const buehneRef = useRef(null)
  const laeuferRef = useRef(null)
  const bodenRef = useRef(null)
  const fernRef = useRef(null)
  const elemente = useRef(new Map())
  const schildElemente = useRef(new Map())
  const masseRef = useRef({ breite: 360, hoehe: 280 })

  const welt = useRef(null)
  const pauseRef = useRef(false)
  const crashRef = useRef(false)
  const sanftRef = useRef(false)
  const nrRef = useRef(0)

  const lauf = useSpielLauf({ sitzung, game: GAME, dauerVorgabe: 540000, onErgebnis, sofort: true })
  const { laeuft, punkteGeben, rundeZaehlen, fertig, starten: laufStarten } = lauf

  useEffect(() => {
    let wert
    try {
      wert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      wert = false
    }
    sanftRef.current = wert
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSanft(wert)
  }, [])

  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    const messen = () => {
      masseRef.current = { breite: el.clientWidth || 360, hoehe: el.clientHeight || 280 }
    }
    messen()
    if (typeof ResizeObserver !== 'function') {
      window.addEventListener('resize', messen)
      return () => window.removeEventListener('resize', messen)
    }
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [laeuft])

  useEffect(() => {
    if (!laeuft) return undefined
    const wechsel = () => {
      if (document.hidden && !crashRef.current) {
        pauseRef.current = true
        setPause(true)
      }
    }
    document.addEventListener('visibilitychange', wechsel)
    return () => document.removeEventListener('visibilitychange', wechsel)
  }, [laeuft])

  const melden = useCallback((art, text) => {
    nrRef.current += 1
    setMeldung({ nr: nrRef.current, art, text })
  }, [])

  useEffect(() => {
    if (!meldung) return undefined
    const uhr = setTimeout(() => setMeldung(null), 1000)
    return () => clearTimeout(uhr)
  }, [meldung])

  /** Punkte nachreichen: Meter minus bereits gegeben. */
  const abrechnen = useCallback(() => {
    const w = welt.current
    if (!w) return
    const m = Math.floor(w.strecke * 10)
    const offen = m - w.gegeben
    if (offen > 0) {
      w.gegeben = m
      punkteGeben(offen)
    }
  }, [punkteGeben])

  const crashen = useCallback(() => {
    if (crashRef.current) return
    crashRef.current = true
    abrechnen()
    setCrash(true)
    melden('verkantet', T.crash)
    summen([70, 40, 110])
    setTimeout(() => fertig(), CRASH_MS)
  }, [abrechnen, fertig, melden])

  /* Die Spielschleife. */
  useEffect(() => {
    if (!laeuft) return undefined
    let frame = 0
    let vorher = performance.now()
    let naechsteAbrechnung = 0
    let naechsteAnzeige = 0

    const schritt = (jetzt) => {
      /* Minimiert steht die Runde still. Der Zeitanker wandert mit,
         sonst kaeme der erste Frame danach mit einem dt von mehreren
         Sekunden zurueck und rechnete die Runde in einem Schritt zu
         Ende. */
      if (istPausiert(GAME)) {
        vorher = jetzt
        frame = requestAnimationFrame(schritt)
        return
      }
      const dt = Math.min(0.05, (jetzt - vorher) / 1000)
      vorher = jetzt
      const w = welt.current
      if (!w) return
      const { breite, hoehe } = masseRef.current
      const sichtB = breite / hoehe // sichtbare Breite in h

      if (!pauseRef.current && !crashRef.current) {
        w.zeit += dt
        const faktor = sanftRef.current ? 0.85 : 1
        w.tempo = Math.min(TEMPO_MAX, TEMPO_START + w.strecke * TEMPO_ZUWACHS) * faktor
        const dx = w.tempo * dt
        w.strecke += dx

        /* Springen, auch aus dem Puffer kurz vor der Landung. */
        const amBoden = w.y <= 0 && w.vy <= 0
        if (w.wunsch && amBoden && performance.now() - w.wunsch <= PUFFER_MS) {
          w.vy = ABSPRUNG
          w.wunsch = 0
          rundeZaehlen()
        }
        w.vy -= SCHWERE * dt
        w.y += w.vy * dt
        if (w.y <= 0) {
          w.y = 0
          w.vy = 0
        }

        /* Hindernisse verschieben, alte entfernen, neue anlegen. */
        let geaendert = false
        for (const o of w.liste) o.x -= dx
        const vorherLaenge = w.liste.length
        w.liste = w.liste.filter((o) => o.x + ARTEN[o.art].b > -0.2)
        if (w.liste.length !== vorherLaenge) geaendert = true
        for (const s of w.schilder) s.x -= dx * 0.5
        const vorherSchilder = w.schilder.length
        w.schilder = w.schilder.filter((s) => s.x > -0.8)

        w.bisNaechstes -= dx
        if (w.bisNaechstes <= 0) {
          const flug = (2 * ABSPRUNG) / SCHWERE
          const pool = w.strecke < FRUEH_BIS ? FRUEH : NORMAL
          let art = pool[Math.floor(Math.random() * pool.length)]
          if (art === w.letzteArt) art = pool[Math.floor(Math.random() * pool.length)]
          w.letzteArt = art
          w.naechstId += 1
          w.liste.push({ id: w.naechstId, art, x: sichtB + 0.1 })
          geaendert = true

          /* Sicherer Mindestabstand plus Zufall, der mit der Strecke schrumpft.
             Nach dem Höchsttempo wird es nur noch dichter, nie enger als das Minimum. */
          const minimum = w.tempo * (flug + 0.35) + ARTEN[art].b
          const zufall = Math.random() * Math.max(0.15, 1.5 - w.strecke * 0.012)
          w.bisNaechstes = minimum + zufall
        }

        /* Hintergrund-Gags: nur Deko, kein Hindernis. */
        w.bisSchild -= dx
        if (w.bisSchild <= 0) {
          w.naechstId += 1
          const deko = w.strecke > 25 && Math.random() < 0.35 ? (Math.random() < 0.5 ? 'toilette' : 'fuesse2500') : null
          const text = deko ? T[DEKO[deko].text] : Math.random() < 0.5 ? T.gagBald : T.gagTage
          w.schilder.push({ id: w.naechstId, text, deko, x: sichtB + 0.4 })
          w.bisSchild = 18 + Math.random() * 22
        }
        if (w.schilder.length !== vorherSchilder || w.schilder.some((s) => !s.gezeigt)) {
          for (const s of w.schilder) s.gezeigt = true
          setSchilder(w.schilder.map((s) => ({ id: s.id, text: s.text, deko: s.deko })))
        }
        if (geaendert) setHindernisse(w.liste.map((o) => ({ id: o.id, art: o.art })))

        /* Kollision mit nach innen versetzten Trefferzonen. */
        const px0 = (LAEUFER_X * breite) / hoehe + LAEUFER_B * 0.22
        const px1 = px0 + LAEUFER_B * 0.56
        const py0 = w.y + 0.02
        for (const o of w.liste) {
          const a = ARTEN[o.art]
          const rand = Math.min(0.03, a.b * 0.2)
          const ox0 = o.x + rand
          const ox1 = o.x + a.b - rand
          const oh = a.h - Math.min(0.02, a.h * 0.2)
          if (px1 > ox0 && px0 < ox1 && py0 < oh) {
            crashen()
            break
          }
        }

        if (jetzt >= naechsteAbrechnung) {
          naechsteAbrechnung = jetzt + 150
          abrechnen()
        }
        if (jetzt >= naechsteAnzeige) {
          naechsteAnzeige = jetzt + 100
          setMeter(Math.floor(w.strecke * 10))
        }
      }

      /* Zeichnen: nur transforms. */
      const bodenY = hoehe * BODEN
      const l = laeuferRef.current
      if (l) {
        l.style.width = `${(LAEUFER_B * hoehe).toFixed(1)}px`
        l.style.height = `${(LAEUFER_H * hoehe).toFixed(1)}px`
        l.style.transform = `translate3d(${(LAEUFER_X * breite).toFixed(1)}px, ${(bodenY - (w.y + LAEUFER_H) * hoehe).toFixed(1)}px, 0)`
        l.dataset.luft = w.y > 0 ? '1' : '0'
      }
      for (const o of w.liste) {
        const el = elemente.current.get(o.id)
        if (!el) continue
        const a = ARTEN[o.art]
        el.style.width = `${(a.b * hoehe).toFixed(1)}px`
        el.style.height = `${(a.h * hoehe).toFixed(1)}px`
        el.style.transform = `translate3d(${(o.x * hoehe).toFixed(1)}px, ${(bodenY - a.h * hoehe).toFixed(1)}px, 0)`
      }
      for (const s of w.schilder) {
        const el = schildElemente.current.get(s.id)
        if (el) el.style.transform = `translate3d(${(s.x * hoehe).toFixed(1)}px, 0, 0)`
      }
      if (bodenRef.current) bodenRef.current.style.backgroundPositionX = `${(-w.strecke * hoehe) % 64}px`
      if (fernRef.current) fernRef.current.style.backgroundPositionX = `${(-w.strecke * hoehe * 0.25).toFixed(1)}px`

      frame = requestAnimationFrame(schritt)
    }

    frame = requestAnimationFrame(schritt)
    return () => cancelAnimationFrame(frame)
  }, [laeuft, abrechnen, crashen, rundeZaehlen])

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    welt.current = {
      zeit: 0,
      strecke: 0,
      gegeben: 0,
      tempo: TEMPO_START,
      y: 0,
      vy: 0,
      wunsch: 0,
      liste: [],
      schilder: [],
      bisNaechstes: 2.2,
      bisSchild: 6,
      naechstId: 0,
      letzteArt: null,
    }
    elemente.current.clear()
    schildElemente.current.clear()
    pauseRef.current = false
    crashRef.current = false
    setHindernisse([])
    setSchilder([])
    setMeldung(null)
    setMeter(0)
    setPause(false)
    setCrash(false)
    return true
  }, [laufStarten])

  const tippen = useCallback(() => {
    if (!laeuft || crashRef.current || !welt.current) return
    if (pauseRef.current) {
      pauseRef.current = false
      setPause(false)
      return
    }
    welt.current.wunsch = performance.now()
  }, [laeuft])

  const tastatur = useCallback(
    (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        e.preventDefault()
        tippen()
      }
    },
    [tippen],
  )

  return (
    <SpielKarte
      spiel={{ ...SPIEL, leisteLabel: T.strecke, leisteWert: meter }}
      lauf={{ ...lauf, starten }}
      best={best}
    >
      {laeuft && (
        <>
          <div
            className="trm-dash-buehne"
            ref={buehneRef}
            role="button"
            tabIndex={0}
            aria-label={T.springen}
            data-sanft={sanft ? '1' : '0'}
            data-crash={crash ? '1' : '0'}
            data-pause={pause ? '1' : '0'}
            onPointerDown={(e) => {
              e.preventDefault()
              tippen()
            }}
            onKeyDown={tastatur}
          >
            <span className="trm-dash-fern" ref={fernRef} aria-hidden="true" />
            <div className="trm-dash-schilder" aria-hidden="true">
              {schilder.map((s) => (
                <span
                  key={s.id}
                  className={`trm-dash-schild${s.deko ? ' trm-dash-schild--gag' : ''}`}
                  ref={(el) => {
                    if (el) schildElemente.current.set(s.id, el)
                    else schildElemente.current.delete(s.id)
                  }}
                >
                  {s.deko && (
                    <span className="trm-dash-schild__bild">
                      <Grafik art={s.deko} />
                    </span>
                  )}
                  {s.text}
                </span>
              ))}
            </div>
            <span className="trm-dash-boden" ref={bodenRef} aria-hidden="true" />
            {hindernisse.map((o) => (
              <span
                key={o.id}
                className={`trm-dash-hindernis trm-dash-hindernis--${o.art}`}
                aria-hidden="true"
                ref={(el) => {
                  if (el) elemente.current.set(o.id, el)
                  else elemente.current.delete(o.id)
                }}
              >
                <Grafik art={o.art} />
              </span>
            ))}
            <span className="trm-dash-laeufer" ref={laeuferRef} aria-hidden="true" data-luft="0">
              <Laeufer />
            </span>
            <span className="trm-stack-tipp" aria-hidden="true">
              {T.tippen}
            </span>
          </div>

          {pause && <p className="trm-spiel__pause">{T.pause}</p>}

          {meldung && (
            <p key={meldung.nr} className={`trm-spiel__ruf trm-spiel__ruf--${meldung.art}`}>
              {meldung.text}
            </p>
          )}
        </>
      )}
    </SpielKarte>
  )
}
