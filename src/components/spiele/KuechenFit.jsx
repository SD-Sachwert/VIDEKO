import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  BREITE,
  FORMEN,
  HOEHE,
  LOCK_RESETS,
  SPERRE_MS,
  TEILE,
  drehen,
  fallPunkte,
  fallTiefe,
  festsetzen,
  geist,
  neuesSpiel,
  schwierigkeit,
  verschieben,
  zellenVon,
} from './fit-logik.js'
import './fit.css'

/**
 * KUECHEN-FIT — Schraenke einpassen, Reihen abraeumen.
 *
 * Die Regeln stehen in fit-logik.js und sind dort getestet. Hier geht es
 * nur um Zeit, Finger und Bild.
 *
 * STEUERUNG MIT EINEM FINGER
 * --------------------------
 * Waagerecht ziehen schiebt das Teil Spalte fuer Spalte unter dem Finger
 * mit. Ein kurzer Tipp dreht. Langsam nach unten ziehen laesst es schneller
 * fallen, ein schneller Wisch nach unten setzt es sofort ab. Die Schwellen
 * sind in Zellen gemessen, nicht in Pixeln — auf jedem Handy gleich.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Jedes eingerastete Teil ist eine Runde; der Server verlangt mindestens
 * 150 ms je Teil, gemessen ab Ausgabe des Laufscheins. Deshalb rastet kein
 * Teil frueher als SPERRE_MS nach seinem Erscheinen ein — gezaehlt ab dem
 * spaeteren Zeitpunkt von Erscheinen und Ticketankunft. Ohne Ticket rastet
 * gar nichts ein: ein hart abgesetztes Teil wartet dann unten, bis es
 * darf. Das faellt nur in der ersten Sekunde auf, wenn ueberhaupt.
 *
 * TEMPO
 * -----
 * Die Schleife zaehlt die gespielte Zeit (ohne Pause) und fragt jede volle
 * Sekunde `schwierigkeit(sekunden, reihen)`. Fallzeit und Einrastzeit kommen
 * nur von dort; die Stufe steigt nie wieder ab. Fuer Tests stehen Stufe und
 * Fallzeit als data-stufe und data-fall-ms an der Buehne.
 *
 * WIE ES FLUESSIG BLEIBT
 * ----------------------
 * Ein Canvas zeichnet das Feld. Die liegenden Schraenke stehen in einem
 * zweiten, unsichtbaren Canvas und werden nur neu gemalt, wenn sich das Feld
 * aendert. Die Schleife malt nur, wenn etwas passiert ist. React rendert
 * bei Einrasten, Meldung und Pause — nie pro Frame.
 */

const SPIEL = SPIEL_NACH_KEY.kuechen_fit

const RAEUMEN_MS = 220
const RAEUMEN_SANFT_MS = 140
const CRASH_MS = 560
const TIPP_PX = 10
const TIPP_MS = 500
const WISCH_MS = 260
const WISCH_ZELLEN = 2.2
/* Typischer Wert eines PERFECT FIT am Anfang: 500 Bonus plus die Reihe. */
const HEBEL_PUNKTE = 600

/* Farben fuer das Canvas. Gelesen aus den CSS-Tokens, mit denselben Werten
   als Rueckfall, falls die Tokens (noch) fehlen. */
const TOKEN_RUECKFALL = {
  '--trm-gold': '#c9a050',
  '--trm-gold-hell': '#e8c978',
  '--trm-gold-tief': '#8b6b38',
  '--trm-nacht': '#0a0908',
  '--trm-creme': '#f4efe4',
  '--trm-gruen': '#57c47c',
  '--trm-rot': '#e2453a',
}

function farbeLesen(text) {
  const t = String(text || '').trim()
  let m = t.match(/^#([0-9a-f]{6})$/i)
  if (m) {
    const n = parseInt(m[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  m = t.match(/^#([0-9a-f]{3})$/i)
  if (m) return m[1].split('').map((c) => parseInt(c + c, 16))
  m = t.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i)
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
  return null
}

function mischen(a, b, anteil) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * anteil))
}

const rgb = (c, alpha = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`

/**
 * Acht Fronten, acht Toene. Unterscheidbar nicht allein ueber die Farbe:
 * jede Front hat ihren eigenen Griff (Leiste oben, Stange senkrecht,
 * Knopf, Griffmulde) — so bleibt das Feld auch ohne Farbsehen lesbar.
 */
function paletteBauen(el) {
  const stil = el ? getComputedStyle(el) : null
  const t = {}
  for (const [name, rueck] of Object.entries(TOKEN_RUECKFALL)) {
    t[name] = farbeLesen(stil?.getPropertyValue(name)) || farbeLesen(rueck)
  }
  const nacht = t['--trm-nacht']
  const gold = t['--trm-gold']
  const hell = t['--trm-gold-hell']
  const tief = t['--trm-gold-tief']
  const creme = t['--trm-creme']
  const gruen = t['--trm-gruen']
  const rot = t['--trm-rot']
  const front = (basis, anteil) => mischen(nacht, basis, anteil)
  return {
    nacht,
    gold,
    hell,
    tief,
    creme,
    rot,
    /* code -> [Front, Kante, Griffart] */
    fronten: {
      1: [front(tief, 0.55), hell, 'leiste'], // Unterschrank: Eiche dunkel
      2: [front(creme, 0.62), gold, 'stange'], // Hochschrank: Lack creme
      3: [front(gold, 0.72), hell, 'kante'], // Arbeitsplatte: Gold
      4: [front(creme, 0.2), gold, 'knopf'], // Eckschrank: Anthrazit
      5: [front(tief, 0.3), hell, 'knopf'], // Eckschrank: Nussbaum
      6: [front(gruen, 0.28), gold, 'mulde'], // Kochinsel: Salbei
      7: [front(rot, 0.26), gold, 'leiste'], // Inselmodul: Bordeaux
      8: [front(gold, 0.36), hell, 'mulde'], // Inselmodul: Bronze
      9: [front(creme, 0.1), tief, 'altbestand'], // Altbestand: matt, schraffiert
      10: [front(creme, 0.45), hell, 'doppel'], // Spuelenzeile: Stein hell
      11: [front(gruen, 0.45), gold, 'stange'], // Kuehlkombi: Salbei hell
      12: [front(tief, 0.75), hell, 'leiste'], // Winkelzeile: Eiche hell
      13: [front(rot, 0.42), rot, 'warnung'], // Saeulenkreuz: Problemteil
      14: [front(rot, 0.2), rot, 'warnung'], // Treppenregal: Problemteil
    },
  }
}

function summen(muster) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(muster)
  } catch {
    /* kein Vibrationsmotor, kein Problem */
  }
}

function rundesRechteck(ctx, x, y, b, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, b, h, r)
  else ctx.rect(x, y, b, h)
}

/** Eine Schrankfront in einer Zelle. */
function frontMalen(ctx, palette, code, px, py, z, alpha = 1) {
  const [flaeche, kante, griff] = palette.fronten[code] || palette.fronten[1]
  const i = Math.max(1, Math.round(z * 0.06))
  const b = z - 2 * i
  ctx.globalAlpha = alpha
  const verlauf = ctx.createLinearGradient(0, py, 0, py + z)
  verlauf.addColorStop(0, rgb(mischen(flaeche, palette.creme, 0.1)))
  verlauf.addColorStop(1, rgb(mischen(flaeche, palette.nacht, 0.25)))
  ctx.fillStyle = verlauf
  rundesRechteck(ctx, px + i, py + i, b, b, Math.max(1.5, z * 0.1))
  ctx.fill()
  ctx.lineWidth = 1
  ctx.strokeStyle = rgb(kante, 0.55)
  ctx.stroke()

  ctx.fillStyle = rgb(kante, 0.85)
  const mitte = px + z / 2
  const dicke = Math.max(1.5, z * 0.07)
  if (griff === 'leiste') {
    ctx.fillRect(px + z * 0.28, py + z * 0.24, z * 0.44, dicke)
  } else if (griff === 'stange') {
    ctx.fillRect(px + z * 0.68, py + z * 0.24, dicke, z * 0.52)
  } else if (griff === 'kante') {
    ctx.fillRect(px + i, py + i, b, Math.max(2, z * 0.14))
    ctx.fillStyle = rgb(palette.nacht, 0.35)
    ctx.fillRect(px + z * 0.3, py + z * 0.58, z * 0.4, dicke)
  } else if (griff === 'knopf') {
    ctx.beginPath()
    ctx.arc(mitte, py + z * 0.34, Math.max(1.5, z * 0.08), 0, Math.PI * 2)
    ctx.fill()
  } else if (griff === 'doppel') {
    ctx.beginPath()
    ctx.arc(px + z * 0.32, py + z * 0.34, Math.max(1.5, z * 0.07), 0, Math.PI * 2)
    ctx.arc(px + z * 0.68, py + z * 0.34, Math.max(1.5, z * 0.07), 0, Math.PI * 2)
    ctx.fill()
  } else if (griff === 'altbestand') {
    /* Schraffur: alt, im Weg, gehoert weg. */
    ctx.strokeStyle = rgb(kante, 0.45)
    ctx.beginPath()
    ctx.moveTo(px + i + b * 0.2, py + i + b)
    ctx.lineTo(px + i + b, py + i + b * 0.2)
    ctx.moveTo(px + i, py + i + b * 0.55)
    ctx.lineTo(px + i + b * 0.55, py + i)
    ctx.stroke()
  } else if (griff === 'warnung') {
    /* Problemteil: roter Schraegstrich wie ein Warnband. */
    ctx.strokeStyle = rgb(kante, 0.9)
    ctx.lineWidth = Math.max(1.5, z * 0.09)
    ctx.beginPath()
    ctx.moveTo(px + i + b * 0.18, py + i + b * 0.82)
    ctx.lineTo(px + i + b * 0.82, py + i + b * 0.18)
    ctx.stroke()
    ctx.lineWidth = 1
  } else {
    ctx.fillStyle = rgb(palette.nacht, 0.5)
    ctx.fillRect(px + i, py + z * 0.72, b, Math.max(1.5, z * 0.09))
    ctx.fillStyle = rgb(kante, 0.5)
    ctx.fillRect(px + i, py + z * 0.72 + Math.max(1.5, z * 0.09), b, 1)
  }
  ctx.globalAlpha = 1
}

/** Wo das Feld auf der Buehne liegt. Oben bleibt ein Streifen fuer die Vorschau. */
function geometrie(breite, hoehe) {
  const rand = 8
  const kopf = 30
  const z = Math.max(8, Math.floor(Math.min((breite - 2 * rand) / BREITE, (hoehe - kopf - rand) / HOEHE)))
  const fb = z * BREITE
  const fh = z * HOEHE
  return { z, x0: Math.round((breite - fb) / 2), y0: Math.round(kopf + (hoehe - kopf - rand - fh) / 2), fb, fh, kopf }
}

export default function KuechenFit({ sitzung, best = null, onErgebnis }) {
  const [reihen, setReihen] = useState(0)
  const [tempo, setTempo] = useState(() => {
    const s = schwierigkeit(0)
    return { stufe: s.stufe, fallMs: s.fallMs }
  })
  const [naechstes, setNaechstes] = useState(null)
  const [meldung, setMeldung] = useState(null)
  const [pause, setPause] = useState(false)
  const [crash, setCrash] = useState(false)
  const [sanft, setSanft] = useState(false)

  const buehneRef = useRef(null)
  const canvasRef = useRef(null)
  const lagerRef = useRef(null)
  const masseRef = useRef({ breite: 300, hoehe: 480, dpr: 1 })
  const paletteRef = useRef(null)
  const standRef = useRef(null)
  /* Alles, was die Schleife pro Teil braucht, in einem Ref. */
  const takt = useRef({
    fallSeit: 0,
    lockSeit: 0,
    resets: 0,
    hartGesetzt: false,
    erschienen: 0,
    wartenBis: 0,
    raeumen: null,
    crashSeit: 0,
    lagerAlt: true,
    malen: true,
    /* Gespielte Zeit ohne Pause, daraus Stufe und Tempo. */
    vorFrame: 0,
    spielMs: 0,
    sek: 0,
    stufe: 1,
    fallMs: schwierigkeit(0).fallMs,
    lockMs: schwierigkeit(0).lockMs,
  })
  const crashUhrRef = useRef(0)
  const fingerRef = useRef(null)
  const nrRef = useRef(0)
  const pauseRef = useRef(false)
  const crashRef = useRef(false)
  const sanftRef = useRef(false)

  const lauf = useSpielLauf({ sitzung, game: 'kuechen_fit', dauerVorgabe: 540000, onErgebnis, sofort: true })
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

  /* Groesse messen, Canvas auf DPR (hoechstens 2) einstellen, Farben lesen. */
  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    paletteRef.current = paletteBauen(el)
    const messen = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const breite = el.clientWidth || 300
      const hoehe = el.clientHeight || 480
      masseRef.current = { breite, hoehe, dpr }
      const c = canvasRef.current
      if (c) {
        c.width = Math.round(breite * dpr)
        c.height = Math.round(hoehe * dpr)
      }
      takt.current.lagerAlt = true
      takt.current.malen = true
    }
    messen()
    el.focus({ preventScroll: true })
    if (typeof ResizeObserver !== 'function') {
      window.addEventListener('resize', messen)
      return () => window.removeEventListener('resize', messen)
    }
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [laeuft])

  /* Wer den Tab wechselt, findet das Spiel angehalten vor. Der Tipp zum
     Weiterspielen dreht nichts und schiebt nichts. */
  useEffect(() => {
    if (!laeuft) return undefined
    const wechsel = () => {
      if (document.hidden && !crashRef.current) {
        pauseRef.current = true
        fingerRef.current = null
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

  /** Der normale Weg ins Game Over — auch fuer das Testlabor. */
  const aufgeben = useCallback(() => {
    if (crashRef.current) return
    crashRef.current = true
    pauseRef.current = false
    fingerRef.current = null
    takt.current.crashSeit = performance.now()
    takt.current.malen = true
    setPause(false)
    setCrash(true)
    melden('verkantet', 'KÜCHE VOLL')
    summen([60, 40, 90])
    clearTimeout(crashUhrRef.current)
    crashUhrRef.current = setTimeout(() => fertig(), CRASH_MS)
  }, [fertig, melden])

  useTestEnde('kuechen_fit', laeuft, aufgeben)

  useEffect(() => {
    const uhr = crashUhrRef
    return () => clearTimeout(uhr.current)
  }, [])

  /** Neues Teil ist sichtbar: Uhren fuer Fall, Sperre und Einrasten neu. */
  const teilBeginnt = useCallback(() => {
    const t = takt.current
    t.fallSeit = performance.now()
    t.lockSeit = 0
    t.resets = 0
    t.hartGesetzt = false
    t.erschienen = Date.now()
    t.malen = true
  }, [])

  /** Stufe hoeher? Dann Tempo uebernehmen. Gibt die neue Stufe oder 0. */
  const tempoHeben = useCallback((schw) => {
    const t = takt.current
    if (schw.stufe <= t.stufe) return 0
    t.stufe = schw.stufe
    t.fallMs = schw.fallMs
    t.lockMs = schw.lockMs
    const stand = standRef.current
    if (stand) stand.stufe = Math.max(stand.stufe || 1, schw.stufe)
    setTempo({ stufe: schw.stufe, fallMs: schw.fallMs })
    return schw.stufe
  }, [])

  /** Jede volle gespielte Sekunde aus der Schleife. */
  const tempoPruefen = useCallback(() => {
    const stand = standRef.current
    if (!stand) return
    const stufe = tempoHeben(schwierigkeit(takt.current.spielMs / 1000, stand.reihen))
    if (stufe) {
      melden('treffer', `LEVEL ${stufe}`)
      summen(12)
    }
  }, [melden, tempoHeben])

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    clearTimeout(crashUhrRef.current)
    standRef.current = neuesSpiel()
    pauseRef.current = false
    crashRef.current = false
    fingerRef.current = null
    const start = schwierigkeit(0)
    Object.assign(takt.current, {
      wartenBis: 0,
      raeumen: null,
      crashSeit: 0,
      lagerAlt: true,
      vorFrame: 0,
      spielMs: 0,
      sek: 0,
      stufe: start.stufe,
      fallMs: start.fallMs,
      lockMs: start.lockMs,
    })
    teilBeginnt()
    setReihen(0)
    setTempo({ stufe: start.stufe, fallMs: start.fallMs })
    setNaechstes(standRef.current.naechstes)
    setMeldung(null)
    setPause(false)
    setCrash(false)
    return true
  }, [laufStarten, teilBeginnt])

  /** Darf das aktuelle Teil schon einrasten? Siehe DER SERVER RECHNET MIT. */
  const darfEinrasten = useCallback(() => {
    const ticketSeit = ticketSeitRef.current
    if (!ticketSeit) return false
    return Date.now() - Math.max(takt.current.erschienen, ticketSeit) >= SPERRE_MS
  }, [ticketSeitRef])

  /** Einrasten, werten, melden, naechstes Teil vorbereiten. */
  const einrastenJetzt = useCallback(() => {
    const stand = standRef.current
    if (!stand?.aktuell || crashRef.current) return
    const sek = takt.current.spielMs / 1000
    const { stand: neu, ereignis } = festsetzen(stand, sek)
    standRef.current = neu
    rundeZaehlen()
    if (ereignis.punkte) punkteGeben(ereignis.punkte)

    const t = takt.current
    t.lagerAlt = true
    t.malen = true
    /* Viele Reihen heben die Stufe auch vor der Uhr. */
    const stufeHoch = tempoHeben(schwierigkeit(sek, neu.reihen))

    if (ereignis.anzahl) {
      const dauer = sanftRef.current ? RAEUMEN_SANFT_MS : RAEUMEN_MS
      t.raeumen = { seit: performance.now(), dauer, reihen: ereignis.reihen, vorher: ereignis.vorher, perfekt: ereignis.perfekt }
      t.wartenBis = performance.now() + dauer
      setReihen(neu.reihen)
    }

    if (ereignis.perfekt) {
      melden('perfekt', ereignis.kette >= 2 ? `PERFECT FIT ×${ereignis.kette}` : 'PERFECT FIT')
      summen([18, 30, 18])
    } else if (ereignis.kette >= 2) {
      melden('gold', `KOMBO ×${ereignis.kette}`)
      summen([14, 24, 14])
    } else if (ereignis.anzahl >= 2) {
      melden(ereignis.anzahl >= 4 ? 'gold' : 'gut', `${ereignis.anzahl} REIHEN`)
      summen(16)
    } else if (stufeHoch) {
      melden('treffer', `LEVEL ${stufeHoch}`)
      summen(12)
    } else if (ereignis.nachschub) {
      melden('verkantet', 'NACHSCHUB')
      summen([20, 30, 20])
    } else {
      summen(ereignis.anzahl ? 12 : 6)
    }
    /* Faellt ein Levelaufstieg mit einer groesseren Meldung zusammen, geht
       er nicht verloren: er steht in der Leiste. */

    if (ereignis.vorbei) {
      aufgeben()
      return
    }
    setNaechstes(neu.naechstes)
    if (!t.raeumen) teilBeginnt()
  }, [aufgeben, melden, punkteGeben, rundeZaehlen, teilBeginnt, tempoHeben])

  /* ---------------------------------------------------------------- */
  /* Eingaben                                                          */
  /* ---------------------------------------------------------------- */

  /** Ist gerade Eingabe moeglich? Nicht in Pause, Crash oder beim Raeumen. */
  const spielbar = () => {
    const stand = standRef.current
    return laeuft && stand?.aktuell && !pauseRef.current && !crashRef.current && !takt.current.raeumen
  }

  /** Nach einer erfolgreichen Bewegung am Boden: Einrasten neu anlaufen lassen, begrenzt. */
  const bewegt = () => {
    const t = takt.current
    t.malen = true
    if (t.lockSeit && t.resets < LOCK_RESETS) {
      t.resets += 1
      t.lockSeit = performance.now()
    }
  }

  const schieben = (dx) => {
    if (!spielbar() || takt.current.hartGesetzt) return false
    const stand = standRef.current
    const neu = verschieben(stand.feld, stand.aktuell, dx, 0)
    if (!neu) return false
    stand.aktuell = neu
    bewegt()
    return true
  }

  const drehenJetzt = (richtung) => {
    if (!spielbar() || takt.current.hartGesetzt) return
    const stand = standRef.current
    const neu = drehen(stand.feld, stand.aktuell, richtung)
    if (!neu) return
    stand.aktuell = neu
    bewegt()
  }

  const sanftFallen = () => {
    if (!spielbar() || takt.current.hartGesetzt) return false
    const stand = standRef.current
    const neu = verschieben(stand.feld, stand.aktuell, 0, 1)
    if (!neu) return false
    stand.aktuell = neu
    takt.current.fallSeit = performance.now()
    takt.current.malen = true
    punkteGeben(fallPunkte(1, false))
    return true
  }

  const hartAbsetzen = () => {
    if (!spielbar() || takt.current.hartGesetzt) return
    const stand = standRef.current
    const tiefe = fallTiefe(stand.feld, stand.aktuell)
    stand.aktuell = { ...stand.aktuell, y: stand.aktuell.y + tiefe }
    if (tiefe) punkteGeben(fallPunkte(tiefe, true))
    takt.current.hartGesetzt = true
    takt.current.malen = true
    summen(10)
    if (darfEinrasten()) einrastenJetzt()
  }

  const weiter = () => {
    pauseRef.current = false
    fingerRef.current = { verbraucht: true }
    takt.current.fallSeit = performance.now()
    if (takt.current.lockSeit) takt.current.lockSeit = performance.now()
    setPause(false)
  }

  const zeigerRunter = (e) => {
    e.preventDefault()
    if (!laeuft || crashRef.current) return
    /* preventDefault verhindert den Fokus per Maus; Tastatur soll danach trotzdem gehen. */
    e.currentTarget.focus?.({ preventScroll: true })
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* Capture ist nur Komfort */
    }
    if (pauseRef.current) {
      weiter()
      return
    }
    const stand = standRef.current
    fingerRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      seit: performance.now(),
      spalte: stand?.aktuell ? stand.aktuell.x : 0,
      stueck: takt.current.erschienen,
      weit: false,
      runter: 0,
      verbraucht: false,
    }
  }

  const zeigerZieht = (e) => {
    const f = fingerRef.current
    if (!f || f.verbraucht || f.id !== e.pointerId || !spielbar()) return
    const stand = standRef.current
    /* Ein neues Teil ist erschienen, der Finger liegt noch: ab hier neu messen. */
    if (f.stueck !== takt.current.erschienen) {
      Object.assign(f, { x: e.clientX, y: e.clientY, spalte: stand.aktuell.x, stueck: takt.current.erschienen, runter: 0 })
    }
    const { z } = geometrie(masseRef.current.breite, masseRef.current.hoehe)
    const dx = e.clientX - f.x
    const dy = e.clientY - f.y
    if (Math.abs(dx) > TIPP_PX || Math.abs(dy) > TIPP_PX) f.weit = true

    /* Waagerecht: die Zielspalte folgt dem Finger, das Teil laeuft Schritt
       fuer Schritt hin und bleibt an Hindernissen stehen. */
    const ziel = f.spalte + Math.round(dx / z)
    let sicherung = BREITE
    while (stand.aktuell.x !== ziel && sicherung > 0) {
      sicherung -= 1
      if (!schieben(ziel > stand.aktuell.x ? 1 : -1)) break
    }

    /* Senkrecht und langsam: sanft mitziehen, eine Zelle je Zellenhoehe. */
    if (dy > z && Math.abs(dy) > Math.abs(dx) * 1.5) {
      const soll = Math.floor(dy / z) - 1
      while (f.runter < soll) {
        f.runter += 1
        if (!sanftFallen()) break
      }
    }
    takt.current.malen = true
  }

  const zeigerHoch = (e) => {
    const f = fingerRef.current
    fingerRef.current = null
    if (!f || f.verbraucht || f.id !== e.pointerId) return
    const dauer = performance.now() - f.seit
    const dx = e.clientX - f.x
    const dy = e.clientY - f.y
    const { z } = geometrie(masseRef.current.breite, masseRef.current.hoehe)
    if (!f.weit && dauer < TIPP_MS) {
      drehenJetzt(1)
    } else if (dauer < WISCH_MS && dy > z * WISCH_ZELLEN && dy > Math.abs(dx) * 1.5) {
      hartAbsetzen()
    }
  }

  const tastatur = (e) => {
    if (!laeuft || crashRef.current) return
    const k = e.key
    const bekannt = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'x', 'X', 'z', 'Z', 'Enter']
    if (!bekannt.includes(k)) return
    e.preventDefault()
    if (pauseRef.current) {
      weiter()
      fingerRef.current = null
      return
    }
    if (k === 'ArrowLeft') schieben(-1)
    else if (k === 'ArrowRight') schieben(1)
    else if (k === 'ArrowUp' || k === 'x' || k === 'X') drehenJetzt(1)
    else if (k === 'z' || k === 'Z') drehenJetzt(-1)
    else if (k === 'ArrowDown') sanftFallen()
    else if (!e.repeat) hartAbsetzen()
  }

  /* ---------------------------------------------------------------- */
  /* Schleife: Schwerkraft, Einrasten, Malen                           */
  /* ---------------------------------------------------------------- */

  const schrittRef = useRef(null)
  useEffect(() => {
    schrittRef.current = { einrastenJetzt, darfEinrasten, teilBeginnt, tempoPruefen }
  }, [einrastenJetzt, darfEinrasten, teilBeginnt, tempoPruefen])

  useEffect(() => {
    if (!laeuft) return undefined
    let frame = 0

    const lagerMalen = (feld, z) => {
      const { dpr } = masseRef.current
      let lager = lagerRef.current
      if (!lager) {
        lager = document.createElement('canvas')
        lagerRef.current = lager
      }
      lager.width = Math.max(1, Math.round(z * BREITE * dpr))
      lager.height = Math.max(1, Math.round(z * HOEHE * dpr))
      const ctx = lager.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, z * BREITE, z * HOEHE)
      const palette = paletteRef.current
      for (let y = 0; y < HOEHE; y += 1) {
        for (let x = 0; x < BREITE; x += 1) {
          if (feld[y][x]) frontMalen(ctx, palette, feld[y][x], x * z, y * z, z)
        }
      }
    }

    const malen = (jetzt) => {
      const c = canvasRef.current
      const palette = paletteRef.current
      const stand = standRef.current
      if (!c || !palette || !stand) return
      const { breite, hoehe, dpr } = masseRef.current
      const g = geometrie(breite, hoehe)
      const { z, x0, y0, fb, fh } = g
      const t = takt.current
      const ctx = c.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, breite, hoehe)

      /* Rueckwand: feine Fugen wie Wandfliesen, goldener Rahmen. */
      ctx.fillStyle = rgb(palette.nacht, 0.55)
      ctx.fillRect(x0, y0, fb, fh)
      ctx.strokeStyle = rgb(palette.gold, 0.08)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 1; x < BREITE; x += 1) {
        ctx.moveTo(x0 + x * z + 0.5, y0)
        ctx.lineTo(x0 + x * z + 0.5, y0 + fh)
      }
      for (let y = 1; y < HOEHE; y += 1) {
        ctx.moveTo(x0, y0 + y * z + 0.5)
        ctx.lineTo(x0 + fb, y0 + y * z + 0.5)
      }
      ctx.stroke()
      ctx.strokeStyle = rgb(palette.gold, 0.5)
      ctx.strokeRect(x0 - 0.5, y0 - 0.5, fb + 1, fh + 1)

      const r = t.raeumen
      if (r) {
        /* Waehrend des Raeumens das Feld von vorher mit goldenen Reihen. */
        for (let y = 0; y < HOEHE; y += 1) {
          for (let x = 0; x < BREITE; x += 1) {
            const code = r.vorher[y][x]
            if (code) frontMalen(ctx, palette, code, x0 + x * z, y0 + y * z, z)
          }
        }
        const p = Math.min(1, (jetzt - r.seit) / r.dauer)
        const staerke = sanftRef.current ? 0.7 : 0.9 * (1 - p * 0.6)
        for (const y of r.reihen) {
          const band = ctx.createLinearGradient(x0, 0, x0 + fb, 0)
          band.addColorStop(0, rgb(palette.gold, staerke * 0.6))
          band.addColorStop(0.5, rgb(r.perfekt ? palette.creme : palette.hell, staerke))
          band.addColorStop(1, rgb(palette.gold, staerke * 0.6))
          ctx.fillStyle = band
          const schrumpf = sanftRef.current ? 0 : (z / 2) * p * p
          ctx.fillRect(x0, y0 + y * z + schrumpf, fb, z - 2 * schrumpf)
        }
      } else {
        if (t.lagerAlt || !lagerRef.current) {
          lagerMalen(stand.feld, z)
          t.lagerAlt = false
        }
        ctx.drawImage(lagerRef.current, x0, y0, fb, fh)

        if (stand.aktuell && !crashRef.current) {
          /* Geist: nur die Umrisse, damit er nie mit echten Schraenken verwechselt wird. */
          const schatten = geist(stand.feld, stand.aktuell)
          ctx.strokeStyle = rgb(palette.hell, 0.5)
          ctx.setLineDash([3, 3])
          for (const [x, y] of zellenVon(schatten)) {
            ctx.strokeRect(x0 + x * z + 2.5, y0 + y * z + 2.5, z - 5, z - 5)
          }
          ctx.setLineDash([])
          const code = TEILE[stand.aktuell.typ].code
          for (const [x, y] of zellenVon(stand.aktuell)) {
            frontMalen(ctx, palette, code, x0 + x * z, y0 + y * z, z)
          }
        }
      }

      /* Vorschau oben rechts, klein. */
      const typ = stand.naechstes
      if (typ) {
        const m = Math.max(5, Math.floor(g.kopf / 3.4))
        const lage = FORMEN[typ][0]
        const xs = lage.map(([x]) => x)
        const ys = lage.map(([, y]) => y)
        const bw = (Math.max(...xs) - Math.min(...xs) + 1) * m
        const bh = (Math.max(...ys) - Math.min(...ys) + 1) * m
        const vx = x0 + fb - bw
        const vy = Math.max(2, (y0 - bh) / 2)
        for (const [x, y] of lage) {
          frontMalen(ctx, palette, TEILE[typ].code, vx + (x - Math.min(...xs)) * m, vy + (y - Math.min(...ys)) * m, m, 0.9)
        }
      }

      /* Game Over: die Kueche laeuft von unten voll. */
      if (crashRef.current) {
        const p = sanftRef.current ? 1 : Math.min(1, (jetzt - t.crashSeit) / (CRASH_MS - 80))
        const bis = Math.ceil(HOEHE * p)
        ctx.fillStyle = rgb(palette.nacht, 0.62)
        ctx.fillRect(x0, y0 + fh - bis * z, fb, bis * z)
        ctx.strokeStyle = rgb(palette.rot, 0.7)
        ctx.lineWidth = 2
        ctx.strokeRect(x0 - 1, y0 - 1, fb + 2, fh + 2)
      }
    }

    const schritt = (jetzt) => {
      const t = takt.current
      const stand = standRef.current
      const h = schrittRef.current
      /* Hoechstens 250 ms je Bild zaehlen: ein Ruckler ist keine Spielzeit. */
      const dt = t.vorFrame ? Math.min(250, Math.max(0, jetzt - t.vorFrame)) : 0
      t.vorFrame = jetzt
      if (stand && h && !pauseRef.current && !crashRef.current) {
        t.spielMs += dt
        const sek = Math.floor(t.spielMs / 1000)
        if (sek !== t.sek) {
          t.sek = sek
          h.tempoPruefen()
        }
        if (t.raeumen) {
          t.malen = true
          if (jetzt >= t.wartenBis) {
            t.raeumen = null
            t.lagerAlt = true
            if (stand.aktuell) h.teilBeginnt()
          }
        } else if (stand.aktuell) {
          const unten = !verschieben(stand.feld, stand.aktuell, 0, 1)
          if (t.hartGesetzt) {
            if (h.darfEinrasten()) h.einrastenJetzt()
          } else if (unten) {
            if (!t.lockSeit) t.lockSeit = jetzt
            if (jetzt - t.lockSeit >= t.lockMs && h.darfEinrasten()) h.einrastenJetzt()
          } else {
            t.lockSeit = 0
            if (jetzt - t.fallSeit >= t.fallMs) {
              stand.aktuell = { ...stand.aktuell, y: stand.aktuell.y + 1 }
              t.fallSeit = jetzt
              t.malen = true
            }
          }
        }
      }
      if (crashRef.current && jetzt - t.crashSeit < CRASH_MS) t.malen = true
      if (t.malen) {
        t.malen = false
        malen(jetzt)
      }
      frame = requestAnimationFrame(schritt)
    }

    takt.current.malen = true
    frame = requestAnimationFrame(schritt)
    return () => cancelAnimationFrame(frame)
  }, [laeuft])

  const naechsterName = naechstes ? TEILE[naechstes].name : ''

  return (
    <SpielKarte
      spiel={{ ...SPIEL, leisteLabel: 'REIHEN', leisteWert: reihen, hebel: { wort: 'PERFECT FIT', punkte: HEBEL_PUNKTE } }}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span className="trm-spiel__combo trm-fit-level" data-an="1">
          LV {tempo.stufe}
        </span>
      }
    >
      {laeuft && (
        <>
          <div
            className="trm-fit-buehne"
            ref={buehneRef}
            role="application"
            tabIndex={0}
            aria-label="Küchen-Fit Spielfeld. Pfeiltasten schieben, Pfeil hoch dreht, Leertaste setzt ab."
            data-sanft={sanft ? '1' : '0'}
            data-crash={crash ? '1' : '0'}
            data-pause={pause ? '1' : '0'}
            data-stufe={tempo.stufe}
            data-fall-ms={tempo.fallMs}
            onPointerDown={zeigerRunter}
            onPointerMove={zeigerZieht}
            onPointerUp={zeigerHoch}
            onPointerCancel={() => {
              fingerRef.current = null
            }}
            onKeyDown={tastatur}
          >
            <canvas className="trm-fit-canvas" ref={canvasRef} aria-hidden="true" />
            <span
              className="trm-fit-naechstes"
              aria-hidden="true"
              data-problem={naechstes && TEILE[naechstes].gruppe === 'problem' ? '1' : '0'}
            >
              NÄCHSTES: <b>{naechsterName}</b>
            </span>
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
