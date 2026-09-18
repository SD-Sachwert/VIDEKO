import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { istPausiert } from './spiel-pause.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  CRASH_MS,
  FALL_MS,
  FELD_BREITE,
  PUNKTE_RISKANT,
  SOCKEL_BREITE,
  SPERRE_MS,
  TEILE,
  absetzen,
  bereich,
  klemmen,
  masse,
  neueFolge,
  oberkante,
  schwierigkeit,
  stabilitaet,
  startX,
} from './balance-logik.js'
import './balance.css'

/**
 * KUECHEN-BALANCE — Kuehlschrank auf Spuele auf Karton.
 *
 * Ein Kuechenteil schwebt ueber dem Turm. Ziehen richtet es aus, loslassen
 * setzt es ab. Ein kurzer Tipp ohne Ziehen legt drehbare Teile quer.
 * Ob der Turm haelt, rechnet balance-logik.js: liegt der Schwerpunkt aller
 * Teile ueber einer Auflage noch auf ihr? Knapp daneben wackelt es, ganz
 * daneben kippt es.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Jedes stehende Teil ist eine Runde und bringt hoechstens 600 Punkte.
 * Abgesetzt wird fruehestens SPERRE_MS nach dem Auftauchen des Teils UND
 * nach Ankunft des Laufttickets, dazu kommen FALL_MS Fallzeit. Wer zu frueh
 * loslaesst, verliert nichts: der Abwurf wird vorgemerkt und kommt, sobald
 * die Sperre vorbei ist.
 *
 * WIE ES FLUESSIG BLEIBT
 * ----------------------
 * Ein requestAnimationFrame schreibt `transform`-Matrizen direkt an die
 * Teile. Die Neigung jeder Ebene dreht alles darueber mit — das rechnet
 * eine laufende 2×3-Matrix in einem Durchgang. React rendert nur beim
 * Absetzen, Drehen und Einsturz. Im DOM stehen hoechstens SICHTBAR Teile.
 *
 * WAS MAN SIEHT, TRIFFT MAN
 * -------------------------
 * Die Wackelei verschiebt die Turmspitze sichtbar. Damit das Ziel nicht
 * luegt, wird die aktuelle Verschiebung beim Landen herausgerechnet: das
 * Teil landet dort, wo es optisch auf dem Turm aufsetzt.
 *
 * Und wie bei allen Spielen: kein Einfluss auf die Ziehung.
 */

const SPIEL = SPIEL_NACH_KEY.kuechen_balance
const GAME = 'kuechen_balance'

/* Durchschnittlicher Wert eines PERFECT-BALANCE-Bonus in den Simulationen
   (Serie ×1 bis ×3). Speist die Motivationszeile nach dem Lauf. */
const HEBEL_PUNKTE = 150

const FELD_HOEHE_MIN = 13 // so viele Einheiten passen mindestens uebereinander
const BODEN_ANTEIL = 0.92 // Oberkante Sockel, Anteil der Feldhoehe
const SCHWEBE_OBEN = 0.16 // Oberkante des schwebenden Teils, Anteil der Hoehe
const ABSTAND_SCHWEBE = 2.2 // Einheiten zwischen Turmspitze und schwebendem Teil
const SICHTBAR = 24
const TAST_TEMPO = 5 // Einheiten je Sekunde
const TIPP_PX = 8
const TIPP_MS = 300
const KAMERA_TEMPO = 4

/* Wackeln (Bogenmass). Nur Optik — entschieden wird beim Absetzen. */
const LEAN_MAX = 0.016
const LEAN_TEMPO = 1.8
const WACKEL_BASIS = 0.012
const WACKEL_MASSE = 0.0025
const WACKEL_DAEMPFUNG = 2.6
const WACKEL_OMEGA = 12
const ZITTER_AB = 0.55
const ZITTER_OMEGA = 6
const DX_MAX = 0.5 // groesste sichtbare Verschiebung der Spitze in Einheiten
const RUTSCH_S = 0.28

const EINSTURZ_TEXTE = [
  'STATIKER WURDE INFORMIERT.',
  'NOBILIA HAT DAS SO NICHT VORGESEHEN.',
  'DAS WAR NICHT IM AUFMASS.',
]

/* Die Front jedes Teils als Liste: [Art, links, oben, Breite, Hoehe] in
   Prozent der unverdrehten Form. Keine Bilder, nur Flaechen und Linien. */
const FORMEN = {
  kuehlschrank: [
    ['front', 6, 3, 88, 31],
    ['front', 6, 37, 88, 60],
    ['griff', 12, 20, 4, 11],
    ['griff', 12, 40, 4, 20],
  ],
  backofen: [
    ['leiste', 6, 5, 88, 16],
    ['knopf', 14, 9, 7, 8],
    ['knopf', 79, 9, 7, 8],
    ['griff', 16, 26, 68, 3],
    ['glas', 12, 33, 76, 54],
  ],
  unterschrank: [
    ['platte', 0, 0, 100, 10],
    ['front', 4, 14, 45, 74],
    ['front', 51, 14, 45, 74],
    ['griff', 40, 22, 3, 16],
    ['griff', 57, 22, 3, 16],
    ['sockelleiste', 4, 91, 92, 7],
  ],
  haengeschrank: [
    ['front', 4, 6, 45, 88],
    ['front', 51, 6, 45, 88],
    ['griff', 40, 64, 3, 22],
    ['griff', 57, 64, 3, 22],
  ],
  arbeitsplatte: [['kante', 0, 64, 100, 36]],
  spuele: [
    ['platte', 0, 0, 100, 14],
    ['becken', 50, 2, 42, 9],
    ['hahn', 44, 0, 3, 8],
    ['front', 4, 18, 45, 70],
    ['front', 51, 18, 45, 70],
    ['griff', 40, 26, 3, 16],
    ['griff', 57, 26, 3, 16],
    ['sockelleiste', 4, 91, 92, 7],
  ],
  waschmaschine: [
    ['leiste', 6, 5, 88, 14],
    ['knopf', 76, 8, 8, 8],
    ['rund', 18, 30, 64, 58],
  ],
  karton: [
    ['klebeband', 42, 0, 16, 36],
    ['pfeile', 20, 52, 60, 30],
  ],
  hochschrank: [
    ['front', 6, 2, 88, 30],
    ['front', 6, 34, 88, 30],
    ['front', 6, 66, 88, 31],
    ['griff', 12, 20, 4, 9],
    ['griff', 12, 37, 4, 9],
    ['griff', 12, 70, 4, 9],
  ],
  kuecheninsel: [
    ['platte', 0, 0, 100, 12],
    ['front', 4, 16, 29.5, 72],
    ['front', 35.25, 16, 29.5, 72],
    ['front', 66.5, 16, 29.5, 72],
    ['griff', 12, 23, 13, 3],
    ['griff', 43.5, 23, 13, 3],
    ['griff', 75, 23, 13, 3],
    ['sockelleiste', 4, 91, 92, 7],
  ],
}

function summen(stark) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(stark)
  } catch {
    /* kein Vibrationsmotor, kein Problem */
  }
}

function zufaellig(liste) {
  return liste[Math.floor(Math.random() * liste.length)]
}

function leererZustand() {
  return {
    folge: null,
    turm: [],
    serie: 0,
    ebenen: [],
    lean: [],
    winkel: [],
    mat: new Float64Array(120),
    haengt: null,
    haengtX: 0,
    fall: null,
    zeit: 0,
    kamera: 0,
    impuls: { amp: 0, t: 0 },
    einsturz: null,
    wartetAbwurf: false,
    dxOben: 0,
    rutsch: null,
  }
}

/** 2×3-Matrizen als [a, b, c, d, e, f] wie CSS matrix(). A∘B: erst B, dann A. */
function mal(A, B) {
  return [
    A[0] * B[0] + A[2] * B[1],
    A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3],
    A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4],
    A[1] * B[4] + A[3] * B[5] + A[5],
  ]
}

function drehUm(w, px, py) {
  const co = Math.cos(w)
  const si = Math.sin(w)
  return [co, si, -si, co, px - co * px + si * py, py - si * px - co * py]
}

function anzeige(turm, perfektNr = -1) {
  return turm.slice(-SICHTBAR).map((p) => ({
    nr: p.nr,
    art: p.art,
    quer: p.quer,
    spiegel: p.spiegel,
    perfekt: p.nr === perfektNr,
  }))
}

/** Ein Kuechenteil. Rein dekorativ; Groesse kommt ueber CSS-Variablen. */
function Teil({ art }) {
  const t = TEILE[art]
  return (
    <span className={`trm-balance-form trm-balance-form--${art}`} style={{ '--w0': t.w, '--h0': t.h }}>
      {FORMEN[art].map(([stueck, links, oben, breite, hoehe], i) => (
        <span
          key={i}
          className={`trm-balance-${stueck}`}
          style={{ left: `${links}%`, top: `${oben}%`, width: `${breite}%`, height: `${hoehe}%` }}
        />
      ))}
    </span>
  )
}

export default function KuechenBalance({ sitzung, best = null, onErgebnis }) {
  const [teile, setTeile] = useState([])
  const [haengt, setHaengt] = useState(null)
  const [meldung, setMeldung] = useState(null)
  const [hinweis, setHinweis] = useState(null)
  const [stufe, setStufe] = useState(0)
  const [hoehe, setHoehe] = useState(0)
  const [pause, setPause] = useState(false)
  const [crash, setCrash] = useState(false)
  const [sanft, setSanft] = useState(false)

  const buehneRef = useRef(null)
  const haengtRef = useRef(null)
  const lotRef = useRef(null)
  const markeRef = useRef(null)
  const sockelRef = useRef(null)
  const bodenRef = useRef(null)
  const elemente = useRef(new Map())
  const masseRef = useRef({ breite: 360, hoehe: 540, s: 36 })
  const g = useRef(leererZustand())
  const zeiger = useRef(null)
  const tasten = useRef(0)
  const pauseRef = useRef(false)
  const crashRef = useRef(false)
  const sanftRef = useRef(false)
  const nrRef = useRef(0)
  const drehHinweisRef = useRef(false)
  const abwerfenRef = useRef(() => {})
  const landenRef = useRef(() => {})

  const lauf = useSpielLauf({ sitzung, game: GAME, dauerVorgabe: 540000, onErgebnis, sofort: true })
  const { laeuft, punkteGeben, rundeZaehlen, fertig, starten: laufStarten, ticketSeitRef } = lauf

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

  /* Masse der Buehne. Eine Einheit ist so gross, dass FELD_BREITE in die
     Breite und FELD_HOEHE_MIN in die Hoehe passen. */
  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    const messen = () => {
      const breite = el.clientWidth || 360
      const hoehe = el.clientHeight || 540
      const s = Math.max(8, Math.min(breite / FELD_BREITE, (hoehe * BODEN_ANTEIL) / FELD_HOEHE_MIN))
      masseRef.current = { breite, hoehe, s }
      el.style.setProperty('--s', s.toFixed(3))
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

  /* Tastatur braucht Fokus. preventScroll: die Karte soll nicht springen. */
  useEffect(() => {
    if (!laeuft) return
    try {
      buehneRef.current?.focus({ preventScroll: true })
    } catch {
      /* aelterer Browser ohne Optionen */
    }
  }, [laeuft])

  /* Wer den Tab wechselt, findet das Spiel angehalten vor. Weiter geht es
     mit einem Tipp — und dieser Tipp setzt kein Teil ab. */
  useEffect(() => {
    if (!laeuft) return undefined
    const wechsel = () => {
      if (document.hidden && !crashRef.current) {
        pauseRef.current = true
        tasten.current = 0
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
    const uhr = setTimeout(() => setMeldung(null), 1100)
    return () => clearTimeout(uhr)
  }, [meldung])

  /** Das naechste Teil ueber den Turm haengen. */
  const naechstesTeil = useCallback(() => {
    const s = g.current
    const teil = s.folge()
    const x = startX(s.turm, masse(teil).w)
    s.haengt = { teil, x, seit: Date.now(), nr: s.turm.length, phase: Math.random() * Math.PI * 2 }
    s.haengtX = x
    setHaengt({ nr: s.turm.length, art: teil.art, quer: false, spiegel: teil.spiegel })
    if (TEILE[teil.art].drehbar && !drehHinweisRef.current) {
      drehHinweisRef.current = true
      setHinweis('Tippen = drehen')
    }
  }, [])

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    const s = leererZustand()
    s.folge = neueFolge()
    g.current = s
    pauseRef.current = false
    crashRef.current = false
    zeiger.current = null
    tasten.current = 0
    drehHinweisRef.current = false
    setTeile([])
    setMeldung(null)
    setStufe(0)
    setHoehe(0)
    setPause(false)
    setCrash(false)
    setHinweis('Ziehen · Loslassen')
    naechstesTeil()
    return true
  }, [laufStarten, naechstesTeil])

  /** Der Einsturz — fuer Kippen, Danebenwerfen und das Testlabor derselbe Weg. */
  const einstuerzen = useCallback(
    (info = {}) => {
      if (crashRef.current) return
      crashRef.current = true
      const s = g.current
      s.wartetAbwurf = false
      tasten.current = 0
      const n = s.turm.length
      let ab = n
      let seite = info.seite || (Math.random() < 0.5 ? -1 : 1)
      let fallTeil = null

      if (info.grund === 'kippt' && info.neu) {
        s.turm = [...s.turm, info.neu]
        s.ebenen = info.ebenen
        s.lean.push(0)
        ab = info.kippEbene
        setTeile(anzeige(s.turm))
        setHaengt(null)
      } else if (info.grund === 'daneben') {
        fallTeil = { x: info.xAnzeige, y: info.y, seite }
      } else {
        /* Testlabor: das obere Drittel kippt, ohne Turm faellt das Teil. */
        const f = s.fall
        if (n === 0 && s.haengt) {
          const q = f ? Math.min(1, f.t / FALL_MS) : 0
          fallTeil = {
            x: f ? f.x : s.haengtX,
            y: f ? f.y0 + (f.y1 - f.y0) * q * q : oberkante(s.turm) + ABSTAND_SCHWEBE,
            seite,
          }
        } else {
          ab = Math.max(0, n - 3)
          if (s.ebenen[ab]) seite = s.ebenen[ab].seite
          setHaengt(null)
        }
      }

      const eb = s.ebenen[ab]
      s.einsturz = {
        ab,
        seite,
        t: 0,
        fallTeil,
        pivotX: eb ? (seite > 0 ? eb.R : eb.L) : 0,
        pivotY: s.turm[ab] ? s.turm[ab].y : 0,
      }
      s.fall = null
      setCrash(true)
      melden('verkantet', info.grund === 'daneben' ? 'DANEBEN!' : zufaellig(EINSTURZ_TEXTE))
      summen([60, 40, 120])
      setTimeout(() => fertig(), CRASH_MS)
    },
    [fertig, melden],
  )

  const testEnde = useCallback(() => einstuerzen({}), [einstuerzen])
  useTestEnde(GAME, laeuft, testEnde)

  /** Loslassen. Zu frueh wird vorgemerkt, nicht verworfen. */
  const abwerfen = useCallback(() => {
    const s = g.current
    if (!s.haengt || s.fall || s.einsturz || crashRef.current || pauseRef.current) return
    const ticketSeit = ticketSeitRef.current
    if (!ticketSeit || Date.now() - Math.max(s.haengt.seit, ticketSeit) < SPERRE_MS) {
      s.wartetAbwurf = true
      return
    }
    s.wartetAbwurf = false
    const oben = oberkante(s.turm)
    s.fall = { teil: s.haengt.teil, x: s.haengtX, y0: oben + ABSTAND_SCHWEBE, y1: oben, t: 0 }
  }, [ticketSeitRef])

  const drehen = useCallback(() => {
    const s = g.current
    if (!s.haengt || s.fall || crashRef.current || pauseRef.current) return
    const teil = s.haengt.teil
    if (!TEILE[teil.art].drehbar) return
    const neu = { ...teil, quer: !teil.quer }
    const [lo, hi] = bereich(masse(neu).w)
    s.haengt.teil = neu
    s.haengt.x = klemmen(s.haengt.x, lo, hi)
    s.wartetAbwurf = false
    setHaengt((alt) => (alt ? { ...alt, quer: neu.quer } : alt))
    summen(6)
  }, [])

  /** Das fallende Teil kommt an. Hier wird gerechnet und belohnt. */
  const landen = useCallback(() => {
    const s = g.current
    const f = s.fall
    if (!f || crashRef.current) return
    s.fall = null
    const erg = absetzen({ turm: s.turm, serie: s.serie }, f.teil, f.x - s.dxOben)
    if (!erg.ok) {
      einstuerzen({ ...erg, xAnzeige: f.x, y: f.y1 })
      return
    }

    s.turm = erg.turm
    s.serie = erg.serie
    const n = s.turm.length
    s.ebenen = stabilitaet(s.turm, schwierigkeit(n).schrumpf)
    s.lean.push(0)
    const eigen = erg.ebenen[n - 1]
    const richtung = erg.gerutscht ? Math.sign(erg.gerutscht) : eigen.X >= eigen.mitte ? 1 : -1
    s.impuls = {
      amp: richtung * (WACKEL_BASIS + WACKEL_MASSE * erg.neu.m) * (sanftRef.current ? 0.35 : 1),
      t: 0,
    }
    if (Math.abs(erg.gerutscht) > 0.02) s.rutsch = { nr: erg.neu.nr, von: -erg.gerutscht, t: 0 }

    rundeZaehlen()
    punkteGeben(erg.punkte)

    if (erg.perfekt) {
      melden(erg.stufe >= 3 ? 'gold' : 'perfekt', erg.stufe > 1 ? `PERFECT BALANCE ×${erg.stufe}` : 'PERFECT BALANCE')
      summen(erg.stufe > 1 ? [18, 30, 18] : 16)
    } else if (erg.riskant) {
      melden('gut', erg.knapp ? `DAS HÄLT. BESTIMMT. +${PUNKTE_RISKANT}` : `RISKANT +${PUNKTE_RISKANT}`)
      summen([10, 20, 10])
    } else if (erg.knapp) {
      melden('treffer', 'DAS HÄLT. BESTIMMT.')
      summen([10, 20, 10])
    } else if (Math.abs(erg.gerutscht) > 0.15) {
      melden('treffer', 'RUTSCHT …')
      summen(8)
    } else {
      summen(8)
    }

    setTeile(anzeige(s.turm, erg.perfekt ? erg.neu.nr : -1))
    setHoehe(n)
    setStufe(erg.stufe)
    setHinweis(null)
    naechstesTeil()
  }, [einstuerzen, melden, naechstesTeil, punkteGeben, rundeZaehlen])

  useEffect(() => {
    abwerfenRef.current = abwerfen
    landenRef.current = landen
  })

  /* Die Spielschleife: Bewegung, Fall, Wackeln, Kamera, Einsturz. */
  useEffect(() => {
    if (!laeuft) return undefined
    let frame = 0
    let vorher = performance.now()

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
      const s = g.current
      const aktiv = !pauseRef.current
      const weich = sanftRef.current

      if (aktiv) {
        s.zeit += dt
        if (!s.einsturz) {
          if (s.haengt && !s.fall && tasten.current) {
            const [lo, hi] = bereich(masse(s.haengt.teil).w)
            s.haengt.x = klemmen(s.haengt.x + tasten.current * TAST_TEMPO * dt, lo, hi)
          }
          if (s.wartetAbwurf && !s.fall) abwerfenRef.current()
          if (s.fall) {
            s.fall.t += dt * 1000
            if (s.fall.t >= FALL_MS) landenRef.current()
          }
        } else {
          s.einsturz.t += dt
        }
        s.impuls.t += dt
        if (s.rutsch) {
          s.rutsch.t += dt
          if (s.rutsch.t > RUTSCH_S) s.rutsch = null
        }
      }

      const { breite, hoehe: feldH, s: m } = masseRef.current
      const bodenPx = feldH * BODEN_ANTEIL
      const mitteX = breite / 2
      const turm = s.turm
      const n = turm.length
      const oben = oberkante(turm)
      const d = schwierigkeit(n)
      const ez = s.einsturz

      /* Das schwebende Teil pendelt ab Hoehe 8 um die Fingerposition. */
      const h = s.haengt
      const hm = h ? masse(h.teil) : null
      const schwebeY = oben + ABSTAND_SCHWEBE
      if (h && !s.fall && !ez) {
        const [lo, hi] = bereich(hm.w)
        const amp = d.schwankAmp * (weich ? 0.8 : 1)
        s.haengtX = klemmen(h.x + amp * Math.sin(s.zeit * d.schwankTempo * Math.PI * 2 + h.phase), lo, hi)
      }

      /* Kamera: das schwebende Teil bleibt im oberen Drittel. */
      if (!ez) {
        const spitze = schwebeY + (hm ? hm.h : 1)
        const ziel = Math.max(0, spitze - (bodenPx - SCHWEBE_OBEN * feldH) / m)
        s.kamera += (ziel - s.kamera) * Math.min(1, dt * KAMERA_TEMPO)
      }
      const kam = s.kamera
      const sx = (x) => mitteX + x * m
      const sy = (y) => bodenPx - (y - kam) * m

      /* Neigung je Ebene: Schieflage nach Risiko, Aufprall, Zittern. */
      const imp = s.impuls
      const impWert = imp.amp * Math.exp(-WACKEL_DAEMPFUNG * imp.t) * Math.sin(WACKEL_OMEGA * imp.t)
      for (let k = 0; k < n; k += 1) {
        const e = s.ebenen[k]
        const ziel = e ? e.seite * LEAN_MAX * e.risiko * e.risiko : 0
        const lean = s.lean[k] || 0
        s.lean[k] = aktiv ? lean + (ziel - lean) * Math.min(1, dt * LEAN_TEMPO) : lean
        let w = s.lean[k] + impWert * Math.exp(-(n - 1 - k) / 3)
        if (!weich && e && e.risiko > ZITTER_AB) {
          w += LEAN_MAX * ((e.risiko - ZITTER_AB) / (1 - ZITTER_AB)) * Math.sin(ZITTER_OMEGA * s.zeit + k * 0.7)
        }
        s.winkel[k] = w
      }

      if (s.mat.length < n * 6) s.mat = new Float64Array(Math.max(n * 6, s.mat.length * 2))
      const mat = s.mat
      const komponieren = (faktor) => {
        let a = 1
        let b = 0
        let c = 0
        let dd = 1
        let e = 0
        let f = 0
        for (let k = 0; k < n; k += 1) {
          const p = turm[k]
          const eb = s.ebenen[k]
          const px = sx(eb ? eb.mitte : p.x)
          const py = sy(p.y)
          const w = s.winkel[k] * faktor
          const co = Math.cos(w)
          const si = Math.sin(w)
          const re = px - co * px + si * py
          const rf = py - si * px - co * py
          const na = a * co + c * si
          const nb = b * co + dd * si
          const nc = c * co - a * si
          const nd = dd * co - b * si
          e = a * re + c * rf + e
          f = b * re + dd * rf + f
          a = na
          b = nb
          c = nc
          dd = nd
          const i = k * 6
          mat[i] = a
          mat[i + 1] = b
          mat[i + 2] = c
          mat[i + 3] = dd
          mat[i + 4] = e
          mat[i + 5] = f
        }
        if (!n) return 0
        const top = turm[n - 1]
        const X = sx(top.x)
        const Y = sy(top.y + top.h)
        return (a * X + c * Y + e - X) / m
      }
      let dx = komponieren(1)
      if (Math.abs(dx) > DX_MAX) dx = komponieren(DX_MAX / Math.abs(dx))
      if (!ez) s.dxOben = dx

      /* Einsturz: ab Ebene `ab` dreht alles um die Kippkante und faellt. */
      let kipp = null
      if (ez && ez.ab < n) {
        const pX = sx(ez.pivotX)
        const pY = sy(ez.pivotY)
        let P = [pX, pY]
        if (ez.ab > 0) {
          const i = (ez.ab - 1) * 6
          P = [mat[i] * pX + mat[i + 2] * pY + mat[i + 4], mat[i + 1] * pX + mat[i + 3] * pY + mat[i + 5]]
        }
        const T = ez.t
        const theta = ez.seite * (weich ? Math.min(0.35, 1.6 * T * T) : Math.min(1.7, 7 * T * T))
        kipp = { R: drehUm(theta, P[0], P[1]), T }
      }

      for (const [nr, el] of elemente.current) {
        const p = turm[nr]
        if (!p) continue
        const i = nr * 6
        let rx = sx(p.x - p.w / 2)
        const ry = sy(p.y + p.h)
        if (s.rutsch && s.rutsch.nr === nr) {
          const q = 1 - Math.min(1, s.rutsch.t / RUTSCH_S)
          rx += s.rutsch.von * m * q * q
        }
        let M = [
          mat[i],
          mat[i + 1],
          mat[i + 2],
          mat[i + 3],
          mat[i] * rx + mat[i + 2] * ry + mat[i + 4],
          mat[i + 1] * rx + mat[i + 3] * ry + mat[i + 5],
        ]
        if (kipp && nr >= ez.ab) {
          const r = nr - ez.ab
          const T = kipp.T
          if (!weich) M = mal(M, drehUm(ez.seite * r * 0.9 * T, (p.w * m) / 2, (p.h * m) / 2))
          M = mal(kipp.R, M)
          M[4] += ez.seite * (0.3 + r * 0.45) * T * T * 5 * m * (weich ? 0.2 : 1)
          M[5] += (weich ? 2 : 9) * (0.4 + r * 0.1) * T * T * m
          if (weich) el.style.opacity = String(Math.max(0, 1 - T / 0.6))
        }
        el.style.transform = `matrix(${M[0].toFixed(4)},${M[1].toFixed(4)},${M[2].toFixed(4)},${M[3].toFixed(4)},${M[4].toFixed(1)},${M[5].toFixed(1)})`
      }

      const hel = haengtRef.current
      if (hel && hm) {
        let x = s.haengtX
        let y = schwebeY
        let rot = 0
        if (s.fall) {
          const q = Math.min(1, s.fall.t / FALL_MS)
          x = s.fall.x
          y = s.fall.y0 + (s.fall.y1 - s.fall.y0) * q * q
        } else if (ez && ez.fallTeil) {
          const T = ez.t
          x = ez.fallTeil.x + ez.fallTeil.seite * 1.4 * T
          y = ez.fallTeil.y - 14 * T * T
          rot = weich ? 0 : ez.fallTeil.seite * 3 * T
          if (weich) hel.style.opacity = String(Math.max(0, 1 - T / 0.6))
        }
        hel.style.transform = `translate(${sx(x).toFixed(1)}px,${sy(y + hm.h / 2).toFixed(1)}px) rotate(${rot.toFixed(3)}rad) translate(${((-hm.w * m) / 2).toFixed(1)}px,${((-hm.h * m) / 2).toFixed(1)}px)`
      }

      /* Mittelmarke auf der Turmspitze und Lot vom schwebenden Teil. */
      let tx = sx(0)
      let ty = sy(0)
      if (n) {
        const top = turm[n - 1]
        const i = (n - 1) * 6
        const X = sx(top.x)
        const Y = sy(top.y + top.h)
        tx = mat[i] * X + mat[i + 2] * Y + mat[i + 4]
        ty = mat[i + 1] * X + mat[i + 3] * Y + mat[i + 5]
      }
      const marke = markeRef.current
      if (marke) {
        marke.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px)`
        marke.style.opacity = ez ? '0' : '1'
      }
      const lot = lotRef.current
      if (lot) {
        const zeigen = Boolean(hm && !s.fall && !ez)
        if (zeigen) {
          const ly = sy(schwebeY)
          lot.style.transform = `translate(${sx(s.haengtX).toFixed(1)}px,${ly.toFixed(1)}px) scaleY(${Math.max(0, sy(oben) - ly).toFixed(1)})`
        }
        lot.style.opacity = zeigen ? '1' : '0'
      }
      if (sockelRef.current) {
        sockelRef.current.style.transform = `translate(${sx(-SOCKEL_BREITE / 2).toFixed(1)}px,${sy(0).toFixed(1)}px)`
      }
      if (bodenRef.current) bodenRef.current.style.transform = `translateY(${sy(0).toFixed(1)}px)`

      frame = requestAnimationFrame(schritt)
    }

    frame = requestAnimationFrame(schritt)
    return () => cancelAnimationFrame(frame)
  }, [laeuft])

  const fortsetzen = () => {
    pauseRef.current = false
    setPause(false)
  }

  const zeigerRunter = (e) => {
    e.preventDefault()
    if (!laeuft || crashRef.current) return
    if (pauseRef.current) {
      fortsetzen()
      zeiger.current = { id: e.pointerId, fortsetzen: true }
      return
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ohne Capture geht es auch */
    }
    const s = g.current
    s.wartetAbwurf = false
    zeiger.current = {
      id: e.pointerId,
      x0: e.clientX,
      basis: s.haengt ? s.haengt.x : 0,
      seit: Date.now(),
      nr: s.haengt ? s.haengt.nr : -1,
      bewegt: false,
    }
  }

  const zeigerBewegt = (e) => {
    const z = zeiger.current
    if (!z || z.id !== e.pointerId || z.fortsetzen) return
    e.preventDefault()
    const s = g.current
    const dx = e.clientX - z.x0
    if (Math.abs(dx) > TIPP_PX) z.bewegt = true
    if (z.bewegt && s.haengt && s.haengt.nr === z.nr && !s.fall && !crashRef.current) {
      const [lo, hi] = bereich(masse(s.haengt.teil).w)
      s.haengt.x = klemmen(z.basis + dx / masseRef.current.s, lo, hi)
    }
  }

  const zeigerHoch = (e) => {
    const z = zeiger.current
    if (!z || z.id !== e.pointerId) return
    zeiger.current = null
    e.preventDefault()
    if (z.fortsetzen || crashRef.current) return
    const s = g.current
    if (!s.haengt || s.haengt.nr !== z.nr) return
    if (!z.bewegt && Date.now() - z.seit < TIPP_MS && TEILE[s.haengt.teil.art].drehbar) {
      drehen()
      return
    }
    abwerfen()
  }

  const tasteRunter = (e) => {
    const k = e.key
    if (pauseRef.current) {
      e.preventDefault()
      fortsetzen()
      return
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      e.preventDefault()
      tasten.current = -1
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      e.preventDefault()
      tasten.current = 1
    } else if (k === ' ' || k === 'Enter' || k === 'ArrowDown') {
      e.preventDefault()
      if (!e.repeat) abwerfen()
    } else if (k === 'ArrowUp' || k === 'r' || k === 'R') {
      e.preventDefault()
      if (!e.repeat) drehen()
    }
  }

  const tasteHoch = (e) => {
    const k = e.key
    if ((k === 'ArrowLeft' || k === 'a' || k === 'A') && tasten.current === -1) tasten.current = 0
    if ((k === 'ArrowRight' || k === 'd' || k === 'D') && tasten.current === 1) tasten.current = 0
  }

  const haengtMasse = haengt ? masse(haengt) : null

  return (
    <SpielKarte
      spiel={{
        ...SPIEL,
        leisteLabel: 'HÖHE',
        leisteWert: hoehe,
        hebel: { wort: 'PERFECT BALANCE', punkte: HEBEL_PUNKTE },
      }}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span className="trm-spiel__combo" data-an={stufe >= 2 ? '1' : '0'}>
          {stufe >= 2 ? `×${stufe}` : ''}
        </span>
      }
    >
      {laeuft && (
        <>
          <div
            className="trm-balance-buehne"
            ref={buehneRef}
            role="application"
            tabIndex={0}
            aria-label="Küchen-Balance: ziehen zum Ausrichten, loslassen zum Absetzen, Pfeiltasten und Leertaste am Rechner"
            data-sanft={sanft ? '1' : '0'}
            data-crash={crash ? '1' : '0'}
            onPointerDown={zeigerRunter}
            onPointerMove={zeigerBewegt}
            onPointerUp={zeigerHoch}
            onPointerCancel={() => {
              zeiger.current = null
            }}
            onKeyDown={tasteRunter}
            onKeyUp={tasteHoch}
            onBlur={() => {
              tasten.current = 0
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span className="trm-balance-boden" ref={bodenRef} aria-hidden="true" />
            <span className="trm-balance-sockel" ref={sockelRef} aria-hidden="true" style={{ '--sockel-b': SOCKEL_BREITE }} />
            {teile.map((t) => {
              const tm = masse(t)
              return (
                <span
                  key={t.nr}
                  className="trm-balance-teil"
                  aria-hidden="true"
                  data-quer={t.quer ? '1' : '0'}
                  data-spiegel={t.spiegel === -1 ? '1' : '0'}
                  data-perfekt={t.perfekt ? '1' : '0'}
                  style={{ '--w': tm.w, '--h': tm.h }}
                  ref={(el) => {
                    if (el) elemente.current.set(t.nr, el)
                    else elemente.current.delete(t.nr)
                  }}
                >
                  <Teil art={t.art} />
                </span>
              )
            })}
            <span className="trm-balance-lot" ref={lotRef} aria-hidden="true" />
            <span className="trm-balance-marke" ref={markeRef} aria-hidden="true" />
            {haengt && (
              <span
                key={`h-${haengt.nr}`}
                className="trm-balance-teil trm-balance-teil--haengt"
                ref={haengtRef}
                aria-hidden="true"
                data-quer={haengt.quer ? '1' : '0'}
                data-spiegel={haengt.spiegel === -1 ? '1' : '0'}
                style={{ '--w': haengtMasse.w, '--h': haengtMasse.h }}
              >
                <Teil art={haengt.art} />
                {TEILE[haengt.art].drehbar && <span className="trm-balance-drehen">↻</span>}
              </span>
            )}
            {hinweis && (
              <span className="trm-balance-hinweis" aria-hidden="true">
                {hinweis}
              </span>
            )}
          </div>

          {pause && <p className="trm-spiel__pause">PAUSE — zum Weiterspielen tippen</p>}

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
