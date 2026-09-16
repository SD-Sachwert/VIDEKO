import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  ABWURF_MS,
  BREITE,
  CHAIN_ESKALIERT,
  FIEBER_S,
  GROSS_AB,
  HOEHE,
  KOMBO_MAX,
  KOMBO_S,
  LINIE_Y,
  OBERSTE,
  SCHRITT_S,
  SPAWN_Y,
  STUFEN,
  UEBER_S,
  WARN_ABSTAND,
  abwerfen,
  basisPunkte,
  klemmeX,
  komboFaktor,
  landeY,
  neuesSpiel,
  schritt,
  selteneAnsage,
  vorschau,
} from './merge-logik.js'
import {
  HAPTIK,
  farbenLesen,
  funkenwerk,
  klang,
  klangSchliessen,
  rufwerk,
  ruettler,
  sanftHoeren,
  vibrieren,
} from './spielgefuehl.js'
import './spielgefuehl.css'
import './merge.css'

/**
 * KUECHEN-MERGE — zwei Gleiche werden eins, bis zur Kuecheninsel.
 *
 * Physik, Verschmelzen, Wertung und Ueberlauf stehen in merge-logik.js und
 * sind dort getestet. Hier geht es nur um Zeit, Finger und Bild.
 *
 * STEUERUNG
 * ---------
 * Das gehaltene Teil folgt dem Finger waagerecht (absolut, nicht relativ:
 * wo der Finger ist, faellt es). Loslassen wirft ab. Am Rechner zielen die
 * Pfeiltasten, Leertaste, Enter oder Pfeil runter werfen ab.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Jeder Abwurf ist eine Runde; der Server verlangt je Runde eine
 * Mindestdauer ab Ausgabe des Laufscheins. Deshalb faellt kein Teil frueher
 * als ABWURF_MS nach dem spaeteren Zeitpunkt von letztem Abwurf und
 * Ticketankunft. Ohne Ticket faellt nichts. Wer zu frueh loslaesst, verliert
 * nichts: der Abwurf wird vorgemerkt und kommt, sobald er darf — an der
 * Stelle, auf die dann gezielt ist.
 *
 * WIE ES FLUESSIG BLEIBT
 * ----------------------
 * Die Physik laeuft in festen Schritten (120 Hz) mit einem Zeitspeicher,
 * unabhaengig von der Bildrate. Jede Stufe wird einmal je Groesse in ein
 * kleines Canvas vorgemalt und danach nur noch kopiert. React rendert bei
 * Abwurf, Verschmelzung, Meldung und Pause — nie pro Frame.
 *
 * DAS GEFUEHL KOMMT AUS EINEM MODUL
 * ---------------------------------
 * Funken, schwebende Zahlen, Ruetteln, Haptik und Klang stehen in
 * spielgefuehl.js — dieselben Werkzeuge wie in Jump und Fit. Hier wird nur
 * entschieden, WANN etwas passiert. Alle drei Werke haben einen festen
 * Vorrat, leben nur im laufenden Spiel und werden im Cleanup geleert; es
 * bleibt also nichts stehen, wenn die Karte verschwindet.
 */

const SPIEL = SPIEL_NACH_KEY.kuechen_merge
const GAME = 'kuechen_merge'

const CRASH_MS = 560
const FLASH_MS = 380
const FLASH_GROSS_MS = 620 // grosse Verschmelzungen: doppelter Ring, mehr Funken
const KNALL_MS = 520 // Standzeit der Spezial-Druckwelle
const TRAUM_FLASH_MS = 520
const GOLD_FLASH_MS = 420 // goldener Schleier bei CHAIN 3+
/* Kuerzel auf einem geladenen Teil. Bewusst Buchstaben statt Symbolen:
   jede Schrift kann sie, und sie stehen im gleichen Gold wie alles andere. */
const SPEZIAL_ZEICHEN = { bombe: 'B', blitz: 'Z', ofen: 'O', gold: 'G', frost: 'F' }
const TAST_TEMPO = 70 // Einheiten je Sekunde
const MAX_SCHRITTE = 12 // je Frame; nach langem Haenger lieber kurz langsamer
/* Typische mittlere Verschmelzung: ein Backofen (Stufe 6) bringt 210. */
const HEBEL_PUNKTE = basisPunkte(5)

const TAKT_START = {
  zielX: BREITE / 2,
  vorgemerkt: false,
  letzterAbwurf: 0,
  crashSeit: 0,
  blitze: [],
  knalle: [],
  tasten: 0,
  kette: 0, // zuletzt gerenderte Kombo, damit React nur bei Aenderung rendert
  warn: 0, // zuletzt gerenderte Warnstufe
  hitze: 0, // zuletzt gerenderte Stufe der Druckkurve
  alarmSeit: -Infinity,
  traumSeit: 0,
  goldSeit: 0,
  fieberBis: 0, // in performance.now()-Zeit, nur fuer das Bild
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
 * Die Tokens kommen aus spielgefuehl.js (ein Leser fuer alle Spiele); hier
 * werden sie nur noch in Zahlentripel zerlegt, weil die Verlaeufe der Embleme
 * damit rechnen. `farben` bleibt als Strings erhalten — genau die Form, die
 * rufwerk.malen() erwartet.
 */
function paletteBauen(el) {
  const farben = farbenLesen(el)
  const p = (wert, rueck) => farbeLesen(wert) || farbeLesen(rueck)
  return {
    farben,
    nacht: p(farben.nacht, '#0a0908'),
    gold: p(farben.gold, '#c9a050'),
    hell: p(farben.goldHell, '#e8c978'),
    tief: p(farben.goldTief, '#8b6b38'),
    creme: p(farben.creme, '#f4efe4'),
    rot: p(farben.rot, '#e2453a'),
  }
}

/** Behaelter auf der Buehne. Oben bleibt ein Streifen fuer die Vorschau,
    unten einer fuer Stufenleiste und Kombo. */
function geometrie(breite, hoehe) {
  const rand = 8
  const kopf = 30
  const fuss = 26
  const z = Math.max(1, Math.min((breite - 2 * rand) / BREITE, (hoehe - kopf - fuss - rand) / HOEHE))
  const fb = z * BREITE
  const fh = z * HOEHE
  return {
    z,
    x0: Math.round((breite - fb) / 2),
    y0: Math.round(kopf + (hoehe - kopf - fuss - rand - fh) / 2),
    fb,
    fh,
    kopf,
  }
}

function rr(ctx, x, y, b, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, b, h, r)
  else ctx.rect(x, y, b, h)
}

/**
 * Das Piktogramm einer Stufe, im Einheitskreis (Radius 1, Mitte 0/0).
 * Nur goldene Linien — die Groesse und der Ton der Scheibe unterscheiden
 * die Stufen, das Bild sagt, was es ist.
 */
function piktogramm(ctx, stufe) {
  const linie = (pts) => {
    ctx.beginPath()
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.stroke()
  }
  switch (stufe) {
    case 0: // Kaffeetasse
      rr(ctx, -0.42, -0.12, 0.66, 0.5, 0.12)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0.3, 0.12, 0.15, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()
      linie([[-0.55, 0.5], [0.4, 0.5]])
      linie([[-0.18, -0.26], [-0.12, -0.44]])
      linie([[0.02, -0.26], [0.08, -0.44]])
      break
    case 1: // Toaster
      rr(ctx, -0.5, -0.2, 1, 0.62, 0.2)
      ctx.stroke()
      linie([[-0.3, -0.2], [-0.3, -0.4], [-0.06, -0.4], [-0.06, -0.2]])
      linie([[0.06, -0.2], [0.06, -0.4], [0.3, -0.4], [0.3, -0.2]])
      linie([[0.5, 0.02], [0.62, 0.02]])
      break
    case 2: // Wasserkocher
      linie([[-0.3, -0.3], [0.3, -0.3], [0.4, 0.45], [-0.4, 0.45], [-0.3, -0.3]])
      linie([[-0.3, -0.18], [-0.55, -0.34]])
      ctx.beginPath()
      ctx.arc(0.38, 0.06, 0.24, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()
      linie([[-0.1, -0.4], [0.1, -0.4]])
      break
    case 3: // Mikrowelle
      rr(ctx, -0.56, -0.34, 1.12, 0.68, 0.08)
      ctx.stroke()
      rr(ctx, -0.44, -0.22, 0.62, 0.44, 0.04)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0.38, -0.12, 0.07, 0, Math.PI * 2)
      ctx.stroke()
      linie([[0.3, 0.12], [0.46, 0.12]])
      break
    case 4: // Kaffeemaschine
      linie([[-0.38, 0.5], [-0.38, -0.5], [0.4, -0.5], [0.4, -0.2], [-0.38, -0.2]])
      linie([[-0.38, 0.5], [0.4, 0.5]])
      linie([[0.1, -0.2], [0.1, -0.08]])
      rr(ctx, -0.04, 0.08, 0.28, 0.28, 0.05)
      ctx.stroke()
      break
    case 5: // Backofen
      rr(ctx, -0.5, -0.5, 1, 1, 0.08)
      ctx.stroke()
      linie([[-0.5, -0.24], [0.5, -0.24]])
      for (const x of [-0.28, 0, 0.28]) {
        ctx.beginPath()
        ctx.arc(x, -0.37, 0.05, 0, Math.PI * 2)
        ctx.stroke()
      }
      linie([[-0.3, -0.1], [0.3, -0.1]])
      rr(ctx, -0.34, 0.02, 0.68, 0.34, 0.05)
      ctx.stroke()
      break
    case 6: // Spuelmaschine
      rr(ctx, -0.48, -0.54, 0.96, 1.08, 0.06)
      ctx.stroke()
      linie([[-0.48, -0.3], [0.48, -0.3]])
      linie([[-0.2, -0.42], [0.2, -0.42]])
      linie([[-0.28, -0.12], [0.28, -0.12]])
      for (const x of [-0.24, -0.08, 0.08, 0.24]) linie([[x, 0.36], [x, 0.14]])
      linie([[-0.3, 0.36], [0.3, 0.36]])
      break
    case 7: // Kuehlschrank
      rr(ctx, -0.36, -0.62, 0.72, 1.24, 0.1)
      ctx.stroke()
      linie([[-0.36, -0.14], [0.36, -0.14]])
      linie([[-0.22, -0.46], [-0.22, -0.26]])
      linie([[-0.22, 0.0], [-0.22, 0.3]])
      break
    case 8: // Hochschrank
      rr(ctx, -0.42, -0.64, 0.84, 1.28, 0.05)
      ctx.stroke()
      linie([[0, -0.64], [0, 0.64]])
      linie([[-0.42, -0.1], [0.42, -0.1]])
      linie([[-0.1, -0.44], [-0.1, -0.26]])
      linie([[0.1, -0.44], [0.1, -0.26]])
      linie([[-0.1, 0.06], [-0.1, 0.26]])
      linie([[0.1, 0.06], [0.1, 0.26]])
      break
    default: // Kuecheninsel
      linie([[-0.68, -0.2], [0.68, -0.2]])
      linie([[-0.6, -0.2], [-0.6, 0.4], [0.6, 0.4], [0.6, -0.2]])
      linie([[-0.2, -0.2], [-0.2, 0.4]])
      linie([[0.2, -0.2], [0.2, 0.4]])
      for (const x of [-0.4, 0, 0.4]) linie([[x - 0.08, -0.08], [x + 0.08, -0.08]])
      linie([[-0.34, -0.5], [-0.34, -0.3]])
      linie([[-0.34, -0.5], [-0.14, -0.5]])
      break
  }
}

/** Eine Stufe als Emblem: dunkle Scheibe, Goldring, Piktogramm, ab mittlerer Groesse Name. */
function emblemMalen(ctx, palette, stufe, cx, cy, r, alpha = 1) {
  const anteil = stufe / OBERSTE
  const scheibe = mischen(palette.nacht, stufe % 2 ? palette.tief : palette.gold, 0.1 + anteil * 0.34)
  const ring = mischen(palette.tief, palette.hell, 0.25 + anteil * 0.75)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(cx, cy)
  const verlauf = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r)
  verlauf.addColorStop(0, rgb(mischen(scheibe, palette.creme, 0.08)))
  verlauf.addColorStop(1, rgb(mischen(scheibe, palette.nacht, 0.35)))
  ctx.fillStyle = verlauf
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = Math.max(1, r * (0.06 + anteil * 0.04))
  ctx.strokeStyle = rgb(ring, 0.95)
  ctx.beginPath()
  ctx.arc(0, 0, r - ctx.lineWidth / 2, 0, Math.PI * 2)
  ctx.stroke()
  if (stufe >= 5) {
    /* Die grossen Teile tragen einen feinen zweiten Ring. */
    ctx.lineWidth = 1
    ctx.strokeStyle = rgb(ring, 0.35)
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2)
    ctx.stroke()
  }
  const mitName = r >= 30
  const s = r * (mitName ? 0.5 : 0.62)
  ctx.save()
  ctx.translate(0, mitName ? -r * 0.12 : 0)
  ctx.scale(s, s)
  ctx.lineWidth = Math.max(1.1, r * 0.05) / s
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = rgb(mischen(palette.hell, palette.creme, anteil * 0.4))
  piktogramm(ctx, stufe)
  ctx.restore()
  if (mitName) {
    const name = STUFEN[stufe].name
    let groesse = Math.max(8, Math.min(12, r * 0.2))
    ctx.font = `700 ${groesse}px system-ui, sans-serif`
    while (groesse > 7 && ctx.measureText(name).width > r * 1.55) {
      groesse -= 0.5
      ctx.font = `700 ${groesse}px system-ui, sans-serif`
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = rgb(palette.creme, 0.78)
    ctx.fillText(name, 0, r * 0.56)
  }
  ctx.restore()
}

export default function KuechenMerge({ sitzung, best = null, onErgebnis }) {
  const [hoechste, setHoechste] = useState(-1)
  const [naechstes, setNaechstes] = useState(null)
  const [meldung, setMeldung] = useState(null)
  const [pause, setPause] = useState(false)
  const [crash, setCrash] = useState(false)
  const [sanft, setSanft] = useState(false)
  /* kette: laufende Kombo (0 = keine), nr: zaehlt Verschmelzungen, damit der
     Zeitbalken bei jeder neu startet. */
  const [kombo, setKombo] = useState({ kette: 0, nr: 0 })
  /* 0 ruhig, 1 Warnung (nah an der Linie), 2 kritisch (drueber oder fast). */
  const [warnstufe, setWarnstufe] = useState(0)
  /* an: laeuft das Fieber gerade, nr: zaehlt Fieberphasen, damit der
     Zeitbalken bei jeder neuen Phase von vorn startet. */
  const [fieber, setFieber] = useState({ an: false, nr: 0 })
  /* Stufe der Druckkurve: 0 ruhig, 1 heizt auf, 2 ueberhitzt, 3 brennt.
     nr zaehlt die Wechsel, damit die Einblendung jedes Mal neu anlaeuft. */
  const [hitzeStufe, setHitzeStufe] = useState({ stufe: 0, name: '', nr: 0 })

  const buehneRef = useRef(null)
  const canvasRef = useRef(null)
  const masseRef = useRef({ breite: 320, hoehe: 480, dpr: 1 })
  const paletteRef = useRef(null)
  const spriteRef = useRef(new Map())
  const standRef = useRef(null)
  const takt = useRef({ ...TAKT_START, blitze: [], knalle: [] })
  /* Die drei Werke aus spielgefuehl.js. Sie entstehen mit der Schleife und
     werden in deren Cleanup geleert — nichts davon ueberlebt die Karte. */
  const funkenRef = useRef(null)
  const rufRef = useRef(null)
  const bebenRef = useRef(null)
  const fingerRef = useRef(null)
  const nrRef = useRef(0)
  const pauseRef = useRef(false)
  const crashRef = useRef(false)
  const sanftRef = useRef(false)
  const crashUhrRef = useRef(0)

  const lauf = useSpielLauf({ sitzung, game: GAME, dauerVorgabe: 540000, onErgebnis, sofort: true })
  const { laeuft, punkteGeben, rundeZaehlen, fertig, starten: laufStarten, ticketSeitRef } = lauf

  /* Eine Quelle fuer alle Spiele — spielgefuehl.js entscheidet, was sanft ist,
     und meldet sich auch, wenn der Wunsch mitten in der Runde umgelegt wird. */
  useEffect(() => {
    const setzen = (wert) => {
      sanftRef.current = wert
      setSanft(wert)
    }
    return sanftHoeren(setzen)
  }, [])

  /* Keine Crash-Uhr und kein Audiokontext ueberleben das Aushaengen. */
  useEffect(
    () => () => {
      clearTimeout(crashUhrRef.current)
      crashUhrRef.current = 0
      klangSchliessen()
    },
    [],
  )

  /* Groesse messen, Canvas auf DPR (hoechstens 2) einstellen, Farben lesen. */
  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    paletteRef.current = paletteBauen(el)
    const messen = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const breite = el.clientWidth || 320
      const hoehe = el.clientHeight || 480
      masseRef.current = { breite, hoehe, dpr }
      const c = canvasRef.current
      if (c) {
        c.width = Math.round(breite * dpr)
        c.height = Math.round(hoehe * dpr)
      }
      spriteRef.current.clear()
    }
    messen()
    try {
      el.focus({ preventScroll: true })
    } catch {
      /* aelterer Browser ohne Optionen */
    }
    if (typeof ResizeObserver !== 'function') {
      window.addEventListener('resize', messen)
      return () => window.removeEventListener('resize', messen)
    }
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [laeuft])

  /* Wer den Tab wechselt, findet das Spiel angehalten vor. Der Tipp zum
     Weiterspielen wirft nichts ab. */
  useEffect(() => {
    if (!laeuft) return undefined
    const wechsel = () => {
      if (document.hidden && !crashRef.current) {
        pauseRef.current = true
        fingerRef.current = null
        takt.current.vorgemerkt = false
        takt.current.tasten = 0
        setPause(true)
      }
    }
    document.addEventListener('visibilitychange', wechsel)
    return () => document.removeEventListener('visibilitychange', wechsel)
  }, [laeuft])

  /* `klein` ist optional: eine zweite, leise Zeile unter der Ansage. Sie
     traegt den trockenen Satz, waehrend die erste Zeile die Information
     behaelt — so muss keine der beiden der anderen weichen. */
  const melden = useCallback((art, text, klein = '') => {
    nrRef.current += 1
    setMeldung({ nr: nrRef.current, art, text, klein })
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
    takt.current.vorgemerkt = false
    takt.current.crashSeit = performance.now()
    takt.current.kette = 0
    takt.current.fieberBis = 0
    /* Beim Ueberlauf wird es still: keine Funken, kein Ruetteln, kein Fieber. */
    funkenRef.current?.leeren()
    rufRef.current?.leeren()
    bebenRef.current?.leeren()
    setPause(false)
    setCrash(true)
    setKombo((alt) => (alt.kette ? { kette: 0, nr: alt.nr } : alt))
    setFieber((alt) => (alt.an ? { an: false, nr: alt.nr } : alt))
    melden('verkantet', 'ÜBERGELAUFEN')
    klang('fehler')
    vibrieren(HAPTIK.fehler)
    clearTimeout(crashUhrRef.current)
    crashUhrRef.current = setTimeout(() => {
      crashUhrRef.current = 0
      fertig()
    }, CRASH_MS)
  }, [fertig, melden])

  useTestEnde(GAME, laeuft, aufgeben)

  const starten = useCallback(async () => {
    /* Der Stand entsteht vor dem Lauf: mit sofort=true ist die Buehne schon
       im naechsten Render sichtbar, und sie soll nie das alte Brett zeigen. */
    clearTimeout(crashUhrRef.current)
    crashUhrRef.current = 0
    standRef.current = neuesSpiel()
    pauseRef.current = false
    crashRef.current = false
    fingerRef.current = null
    Object.assign(takt.current, { ...TAKT_START, blitze: [], knalle: [] })
    funkenRef.current?.leeren()
    rufRef.current?.leeren()
    bebenRef.current?.leeren()
    setHoechste(-1)
    setNaechstes(vorschau(standRef.current).naechstes)
    setMeldung(null)
    setPause(false)
    setCrash(false)
    setKombo({ kette: 0, nr: 0 })
    setFieber({ an: false, nr: 0 })
    setWarnstufe(0)
    setHitzeStufe({ stufe: 0, name: '', nr: 0 })
    return laufStarten()
  }, [laufStarten])

  /** Darf jetzt ein Teil fallen? Siehe DER SERVER RECHNET MIT. */
  const darfAbwerfen = useCallback(() => {
    const ticketSeit = ticketSeitRef.current
    if (!ticketSeit) return false
    return Date.now() - Math.max(takt.current.letzterAbwurf, ticketSeit) >= ABWURF_MS
  }, [ticketSeitRef])

  /** Abwerfen jetzt oder vormerken. */
  const abwurfWunsch = useCallback(() => {
    const stand = standRef.current
    if (!stand || stand.vorbei || crashRef.current || pauseRef.current) return
    if (!darfAbwerfen()) {
      takt.current.vorgemerkt = true
      return
    }
    takt.current.vorgemerkt = false
    takt.current.letzterAbwurf = Date.now()
    abwerfen(stand, takt.current.zielX)
    rundeZaehlen()
    klang('landung', 1.15)
    vibrieren(HAPTIK.tipp)
    setNaechstes(vorschau(stand).naechstes)
    setHoechste(stand.hoechste)
  }, [darfAbwerfen, rundeZaehlen])

  /**
   * Ereignisse eines Physikschritts in Punkte, Bild, Klang und Meldungen.
   *
   * Hier wird nur entschieden, WANN etwas passiert — das WIE steht in
   * spielgefuehl.js. Pro Schritt geht hoechstens eine Meldung raus, sonst
   * ueberschreibt eine Kettenreaktion sich selbst.
   */
  const auswerten = useCallback(
    (ereignisse) => {
      const stand = standRef.current
      const t = takt.current
      const jetzt = performance.now()
      const palette = paletteRef.current
      const { breite, hoehe } = masseRef.current
      const { z, x0, y0 } = geometrie(breite, hoehe)
      const px = (x) => x0 + x * z
      const py = (y) => y0 + y * z
      const funken = funkenRef.current
      const rufe = rufRef.current
      const beben = bebenRef.current
      const gold = palette ? palette.farben.gold : '#c9a050'
      const hell = palette ? palette.farben.goldHell : '#e8c978'
      const creme = palette ? palette.farben.creme : '#f4efe4'
      const rot = palette ? palette.farben.rot : '#e2453a'

      let summe = 0
      let groesstes = null
      let merges = 0
      let spruch = null
      let vorbei = false
      let chainMax = 0

      for (const e of ereignisse) {
        if (e.art === 'vorbei') {
          vorbei = true
          continue
        }
        if (e.spruch) spruch = e.spruch
        if (e.chain > chainMax) chainMax = e.chain

        if (e.art === 'fieber') {
          /* FIEBER: ab jetzt goldener Rand, mehr Punkte, mehr Spezialteile. */
          t.fieberBis = jetzt + e.dauer * 1000
          setFieber((alt) => ({ an: true, nr: alt.nr + 1 }))
          klang('kraft')
          vibrieren(HAPTIK.fieber)
          beben?.stoss(7)
          funken?.schuss({
            x: px(BREITE / 2), y: py(LINIE_Y), anzahl: 22, farbe: [gold, hell, creme],
            tempo: 300, streuung: Math.PI * 2, schwere: 420, leben: 900, gr: 3.4, art: 'stern',
          })
          rufe?.zeigen({ x: px(BREITE / 2), y: py(LINIE_Y + 14), text: 'FIEBER', art: 'combo', gr: 30, farbe: hell })
          continue
        }
        if (e.art === 'hitze') {
          /* Die Kueche heizt auf. Einmal ansagen — Ruf, Ton, kurzer Stoss —
             danach traegt die Stufe nur noch der Rahmen und die Linie. */
          t.hitze = e.stufe
          setHitzeStufe((alt) => ({ stufe: e.stufe, name: e.name, nr: alt.nr + 1 }))
          if (e.hoch && e.name) {
            rufe?.zeigen({ x: px(BREITE / 2), y: py(LINIE_Y + 22), text: e.name, art: 'ruf', gr: 21, farbe: rot })
            klang('fehler', 0.85 + e.stufe * 0.2)
            vibrieren(HAPTIK.treffer)
            beben?.stoss(e.stufe >= 3 ? 11 : 6)
          }
          continue
        }
        if (e.art === 'fieber-ende') {
          /* Sauber zurueck: der Rand geht aus, egal was gerade passiert. */
          t.fieberBis = 0
          setFieber((alt) => (alt.an ? { an: false, nr: alt.nr } : alt))
          klang('tick', 0.55)
          continue
        }
        if (e.art === 'spezial-geboren') {
          /* Noch keine Punkte — das Teil traegt jetzt nur eine Ladung. */
          rufe?.zeigen({ x: px(e.x), y: py(e.y) - 8, text: e.wort, art: 'ruf', gr: 15, farbe: hell })
          klang('zeit', 1.2)
          funken?.schuss({
            x: px(e.x), y: py(e.y), anzahl: 8, farbe: hell,
            tempo: 150, streuung: Math.PI * 2, schwere: 260, leben: 620, gr: 2.6, art: 'stern',
          })
          continue
        }

        summe += e.punkte

        if (e.art === 'spezial') {
          t.knalle.push({
            seit: jetzt, form: e.form, x: e.x, y: e.y,
            r: e.r, b: e.b, h: e.h, weite: e.weite, spezial: e.spezial,
          })
          const stark = e.abgeraeumt >= 3 || e.form === 'gold'
          klang('explosion', e.form === 'zeile' ? 1.25 : 1)
          vibrieren(stark ? HAPTIK.explosion : HAPTIK.treffer)
          beben?.stoss(stark ? 12 : 7)
          funken?.schuss({
            x: px(e.x), y: py(e.y),
            anzahl: Math.min(30, 12 + e.abgeraeumt * 4),
            farbe: e.form === 'frost' ? [creme, hell] : [gold, hell, creme],
            tempo: e.form === 'zeile' ? 420 : 300,
            streuung: e.form === 'zeile' ? 0.9 : Math.PI * 2,
            richtung: e.form === 'zeile' ? 0 : -Math.PI / 2,
            schwere: 620, leben: 700, gr: 3.2, art: 'krume',
          })
          if (e.form === 'zeile') {
            funken?.schuss({
              x: px(e.x), y: py(e.y), anzahl: 12, farbe: hell,
              tempo: 420, streuung: 0.9, richtung: Math.PI, schwere: 620, leben: 700, gr: 3.2, art: 'krume',
            })
          }
          rufe?.zeigen({ x: px(e.x), y: py(e.y) - 14, text: e.ruf, art: 'ruf', gr: stark ? 20 : 16, farbe: hell })
          if (e.punkte) rufe?.zeigen({ x: px(e.x), y: py(e.y) + 12, text: `+${e.punkte}`, art: 'punkte', gr: 19 })
          if (!groesstes || stark) groesstes = e
          continue
        }

        /* Bleibt: 'merge' und 'traum'. */
        merges += 1
        t.blitze.push({ x: e.x, y: e.y, stufe: e.stufe, gross: e.gross, seit: jetzt })
        const chain = Math.max(1, e.chain || 1)
        const wucht = e.art === 'traum' ? 3 : e.gross ? 1.7 : 1
        funken?.schuss({
          x: px(e.x), y: py(e.y),
          anzahl: Math.min(34, Math.round((e.gross ? 12 : 6) * wucht * (0.7 + chain * 0.45))),
          farbe: chain >= 3 ? [hell, creme] : [gold, hell],
          tempo: 180 * wucht + chain * 30,
          streuung: Math.PI * 2, schwere: 800, leben: 560 + chain * 60,
          gr: 2 + wucht * 0.9, art: chain >= 3 ? 'stern' : 'punkt',
        })
        if (e.punkte) {
          rufe?.zeigen({
            x: px(e.x), y: py(e.y), text: `+${e.punkte}`,
            art: 'punkte', gr: e.art === 'traum' ? 28 : e.gross ? 22 : 17,
          })
        }
        beben?.stoss(e.art === 'traum' ? 14 : (e.gross ? 3 + (e.stufe - GROSS_AB) : 1.6) + chain * 1.2)
        klang('pop', Math.min(2.2, 0.8 + e.stufe * 0.09 + (e.kette - 1) * 0.12 + (chain - 1) * 0.1))
        if (e.art === 'traum') {
          t.traumSeit = jetzt
          klang('perfekt', 1)
          vibrieren(HAPTIK.perfekt)
        } else if (e.gross) {
          vibrieren(HAPTIK.gut)
        } else {
          vibrieren(HAPTIK.tipp)
        }
        if (chain >= 3) t.goldSeit = jetzt
        if (e.eskaliert) {
          rufe?.zeigen({ x: px(e.x), y: py(e.y) - 26, text: 'KÜCHE ESKALIERT', art: 'combo', gr: 20, farbe: hell })
          klang('combo', 1.4)
        } else if (chain >= 2) {
          rufe?.zeigen({ x: px(e.x), y: py(e.y) - 22, text: `CHAIN ×${chain}`, art: 'combo', gr: 16, farbe: hell })
        }
        if (!groesstes || e.art === 'traum' || e.stufe > groesstes.stufe || e.kette > (groesstes.kette || 0)) groesstes = e
      }

      if (summe) punkteGeben(summe)
      if (chainMax >= 2) klang('combo', Math.min(1.8, 1 + chainMax * 0.12))

      if (groesstes) {
        setHoechste(stand.hoechste)
        if (stand.kette > 0 && merges) {
          t.kette = stand.kette
          setKombo((alt) => ({ kette: stand.kette, nr: alt.nr + merges }))
        }
        /* Genau eine Meldung. Ein Spruch schlaegt alles — er kommt selten. */
        if (spruch) melden('gold', spruch)
        else if (groesstes.art === 'traum') melden('perfekt', groesstes.kette >= 2 ? `TRAUMKÜCHE ×${groesstes.kette}` : 'TRAUMKÜCHE')
        else if (groesstes.art === 'spezial') melden(groesstes.abgeraeumt >= 3 ? 'gold' : 'treffer', groesstes.wort)
        else if (chainMax >= CHAIN_ESKALIERT) melden('gold', `CHAIN ×${chainMax}`)
        /* Die oberen Stufen baut man je Runde genau einmal zum ersten Mal.
           Dieser eine Moment bekommt einen eigenen trockenen Satz — der Name
           bleibt daneben stehen, damit die Ansage trotzdem etwas sagt. */
        else if (groesstes.neuHoechste && groesstes.stufe >= 4) melden('gold', `NEU: ${STUFEN[groesstes.stufe].name}`, selteneAnsage(groesstes.stufe) || '')
        else if (groesstes.kette >= 2) melden(groesstes.kette >= 3 ? 'gold' : 'gut', `KOMBO ×${groesstes.kette}`)
        else if (groesstes.gross) melden('treffer', STUFEN[groesstes.stufe].name)
      } else if (spruch) {
        melden('gold', spruch)
      }
      /* Zum Schluss, damit der Ueberlauf alles wieder abraeumt. */
      if (vorbei) aufgeben()
    },
    [aufgeben, melden, punkteGeben],
  )

  const schrittRef = useRef(null)
  useEffect(() => {
    schrittRef.current = { abwurfWunsch, darfAbwerfen, auswerten }
  }, [abwurfWunsch, darfAbwerfen, auswerten])

  /* ---------------------------------------------------------------- */
  /* Eingaben                                                          */
  /* ---------------------------------------------------------------- */

  const weltX = (clientX) => {
    const el = buehneRef.current
    if (!el) return BREITE / 2
    const rect = el.getBoundingClientRect()
    const { z, x0 } = geometrie(masseRef.current.breite, masseRef.current.hoehe)
    return (clientX - rect.left - x0) / z
  }

  const zielen = (clientX) => {
    const stand = standRef.current
    if (!stand) return
    takt.current.zielX = klemmeX(stand.aktuell, weltX(clientX))
  }

  const weiter = () => {
    pauseRef.current = false
    setPause(false)
  }

  const zeigerRunter = (e) => {
    e.preventDefault()
    if (!laeuft || crashRef.current) return
    try {
      e.currentTarget.focus({ preventScroll: true })
    } catch {
      /* Fokus ist nur Komfort */
    }
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* Capture ist nur Komfort */
    }
    if (pauseRef.current) {
      weiter()
      fingerRef.current = { id: e.pointerId, verbraucht: true }
      return
    }
    fingerRef.current = { id: e.pointerId, verbraucht: false }
    takt.current.vorgemerkt = false
    zielen(e.clientX)
  }

  const zeigerZieht = (e) => {
    const f = fingerRef.current
    if (pauseRef.current || crashRef.current) return
    /* Maus ohne gedrueckte Taste zielt auch — am Rechner fuehlt sich das richtig an. */
    if (f && (f.verbraucht || f.id !== e.pointerId)) return
    if (!f && e.pointerType !== 'mouse') return
    zielen(e.clientX)
  }

  const zeigerHoch = (e) => {
    const f = fingerRef.current
    fingerRef.current = null
    if (!f || f.verbraucht || f.id !== e.pointerId) return
    e.preventDefault()
    zielen(e.clientX)
    abwurfWunsch()
  }

  const tasteRunter = (e) => {
    if (!laeuft || crashRef.current) return
    const k = e.key
    const bekannt = ['ArrowLeft', 'ArrowRight', 'ArrowDown', ' ', 'Enter', 'a', 'A', 'd', 'D']
    if (!bekannt.includes(k)) return
    e.preventDefault()
    if (pauseRef.current) {
      if (!e.repeat) weiter()
      return
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') takt.current.tasten = -1
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') takt.current.tasten = 1
    else if (!e.repeat) abwurfWunsch()
  }

  const tasteHoch = (e) => {
    const k = e.key
    const t = takt.current
    if ((k === 'ArrowLeft' || k === 'a' || k === 'A') && t.tasten === -1) t.tasten = 0
    if ((k === 'ArrowRight' || k === 'd' || k === 'D') && t.tasten === 1) t.tasten = 0
  }

  /* ---------------------------------------------------------------- */
  /* Schleife: feste Physikschritte, Malen                             */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!laeuft) return undefined
    let frame = 0
    let vorher = performance.now()
    let speicher = 0

    /* Feste Vorraete: 150 Funken und 12 Rufe reichen fuer die dickste
       Kettenreaktion und kosten auf dem Handy nichts. */
    funkenRef.current = funkenwerk(150)
    rufRef.current = rufwerk(12)
    bebenRef.current = ruettler({ abfall: 0.85, max: 16 })

    const sprite = (stufe, z, dpr) => {
      const r = STUFEN[stufe].r * z
      const schluessel = `${stufe}:${Math.round(r * dpr)}`
      let bild = spriteRef.current.get(schluessel)
      if (!bild) {
        bild = document.createElement('canvas')
        const seite = Math.ceil((2 * r + 4) * dpr)
        bild.width = seite
        bild.height = seite
        const ctx = bild.getContext('2d')
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        emblemMalen(ctx, paletteRef.current, stufe, r + 2, r + 2, r)
        spriteRef.current.set(schluessel, bild)
      }
      return bild
    }

    const zeichneTeil = (ctx, stufe, cx, cy, r, z, dpr, alpha = 1, winkel = 0) => {
      const rVoll = STUFEN[stufe].r * z
      const bild = sprite(stufe, z, dpr)
      const seite = (bild.width / dpr) * (r / rVoll)
      ctx.globalAlpha = alpha
      if (winkel) {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(winkel)
        ctx.drawImage(bild, -seite / 2, -seite / 2, seite, seite)
        ctx.restore()
      } else {
        ctx.drawImage(bild, cx - seite / 2, cy - seite / 2, seite, seite)
      }
      ctx.globalAlpha = 1
    }

    const malen = (jetzt, dtMs) => {
      const c = canvasRef.current
      const palette = paletteRef.current
      const stand = standRef.current
      if (!c || !palette || !stand) return
      const { breite, hoehe, dpr } = masseRef.current
      const { z, x0, y0, fb, fh, kopf } = geometrie(breite, hoehe)
      const t = takt.current
      const weich = sanftRef.current
      const ctx = c.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, breite, hoehe)

      /* Beben: der Ruettler aus spielgefuehl.js klingt von selbst ab und
         liefert ohne Stoss exakt null. */
      const ruck = bebenRef.current ? bebenRef.current.versatz(dtMs) : { x: 0, y: 0 }
      ctx.save()
      ctx.translate(ruck.x, ruck.y)

      /* Behaelter: dunkle Rueckwand, goldener Rahmen, oben offen. Bei
         kritischem Fuellstand wird der obere Bereich rot unterlegt. */
      ctx.fillStyle = rgb(palette.nacht, 0.5)
      ctx.fillRect(x0, y0, fb, fh)
      /* Die Ueberlauflinie wandert mit der Druckkurve nach unten — der Stand
         traegt sie, gerechnet wird sie nur einmal je Schritt in der Logik. */
      const ly = y0 + (stand.linieY ?? LINIE_Y) * z
      const puls = weich ? 1 : 0.55 + 0.45 * Math.sin(jetzt / 90)
      if (!crashRef.current && (stand.warnung || stand.gefahr > 0)) {
        const staerke = stand.kritisch ? 0.16 + 0.16 * puls + stand.gefahr * 0.2 : 0.1 * stand.fuellung
        const verlauf = ctx.createLinearGradient(0, y0, 0, ly + WARN_ABSTAND * z)
        verlauf.addColorStop(0, rgb(palette.rot, staerke))
        verlauf.addColorStop(1, rgb(palette.rot, 0))
        ctx.fillStyle = verlauf
        ctx.fillRect(x0, y0, fb, ly - y0 + WARN_ABSTAND * z)
      }
      ctx.strokeStyle = stand.kritisch && !crashRef.current ? rgb(palette.rot, 0.55 + 0.35 * puls) : rgb(palette.gold, 0.55)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x0 - 0.75, y0)
      ctx.lineTo(x0 - 0.75, y0 + fh + 0.75)
      ctx.lineTo(x0 + fb + 0.75, y0 + fh + 0.75)
      ctx.lineTo(x0 + fb + 0.75, y0)
      ctx.stroke()

      /* Ueberlauflinie: leise gestrichelt, bei Warnung rot, kritisch pulsierend. */
      if (stand.gefahr > 0 || crashRef.current) {
        ctx.strokeStyle = rgb(palette.rot, crashRef.current ? 0.9 : (0.55 + stand.gefahr * 0.45) * puls)
        ctx.lineWidth = 2.5
      } else if (stand.kritisch) {
        ctx.strokeStyle = rgb(palette.rot, 0.5 * puls + 0.2)
        ctx.lineWidth = 2
      } else if (stand.warnung) {
        ctx.strokeStyle = rgb(palette.rot, 0.35)
        ctx.lineWidth = 1.5
      } else {
        ctx.strokeStyle = rgb(palette.gold, 0.22)
        ctx.lineWidth = 1
      }
      ctx.setLineDash([6, 5])
      ctx.beginPath()
      ctx.moveTo(x0, ly)
      ctx.lineTo(x0 + fb, ly)
      ctx.stroke()
      ctx.setLineDash([])

      /* Gehaltenes Teil mit Lot bis zum ersten Aufprall. */
      if (!crashRef.current && !stand.vorbei) {
        const stufe = stand.aktuell
        const x = klemmeX(stufe, t.zielX)
        const cx = x0 + x * z
        const cy = y0 + SPAWN_Y * z
        const r = STUFEN[stufe].r * z
        const { y: landung } = landeY(stand, stufe, x)
        const bereit = schrittRef.current?.darfAbwerfen() ?? false
        if (landung * z + y0 > cy + r) {
          ctx.strokeStyle = rgb(palette.hell, bereit ? 0.35 : 0.15)
          ctx.lineWidth = 1
          ctx.setLineDash([2, 4])
          ctx.beginPath()
          ctx.moveTo(cx, cy + r)
          ctx.lineTo(cx, y0 + landung * z)
          ctx.stroke()
          ctx.setLineDash([])
        }
        zeichneTeil(ctx, stufe, cx, cy, r, z, dpr, bereit ? 1 : 0.5)
      }

      /* Liegende Teile, rollend. */
      const tot = crashRef.current
      for (const k of stand.koerper) {
        zeichneTeil(ctx, k.stufe, x0 + k.x * z, y0 + k.y * z, k.r * z, z, dpr, tot ? 0.55 : 1, k.winkel)
        /* Geladenes Teil: pulsierender Ring plus Kuerzel, damit man sieht,
           was beim naechsten Verschmelzen losgeht. */
        if (k.spezial && !tot) {
          const kx = x0 + k.x * z
          const ky = y0 + k.y * z
          const kr = k.r * z
          const pp = weich ? 0.8 : 0.6 + 0.4 * Math.sin(jetzt / 110 + k.id)
          ctx.strokeStyle = rgb(palette.hell, 0.35 + 0.5 * pp)
          ctx.lineWidth = 2
          ctx.setLineDash([4, 3])
          ctx.beginPath()
          ctx.arc(kx, ky, kr + 3, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
          const kuerzel = SPEZIAL_ZEICHEN[k.spezial] || '*'
          ctx.font = `800 ${Math.max(9, Math.min(15, kr * 0.5))}px system-ui, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.lineWidth = 3
          ctx.strokeStyle = rgb(palette.nacht, 0.8)
          ctx.strokeText(kuerzel, kx, ky - kr * 0.52)
          ctx.fillStyle = rgb(palette.hell, 0.6 + 0.4 * pp)
          ctx.fillText(kuerzel, kx, ky - kr * 0.52)
        }
        if (k.ueber > 0 && !tot) {
          ctx.strokeStyle = rgb(palette.rot, 0.45 + 0.5 * Math.min(1, k.ueber / (stand.ueberS || UEBER_S)) * puls)
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(x0 + k.x * z, y0 + k.y * z, k.r * z + 1.5, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      /* Blitze an den Verschmelzpunkten. Grosse: doppelter Ring, Schein,
         doppelt so viele Funken, laenger. */
      t.blitze = t.blitze.filter((b) => jetzt - b.seit < (b.gross ? FLASH_GROSS_MS : FLASH_MS) * (weich ? 0.6 : 1))
      for (const b of t.blitze) {
        const dauer = (b.gross ? FLASH_GROSS_MS : FLASH_MS) * (weich ? 0.6 : 1)
        const p = Math.min(1, (jetzt - b.seit) / dauer)
        const rBasis = STUFEN[Math.min(OBERSTE, b.stufe)].r * z
        const traum = b.stufe > OBERSTE
        const bxp = x0 + b.x * z
        const byp = y0 + b.y * z
        const weite = traum ? 1.8 : b.gross ? 1.1 : 0.7
        const radius = weich ? rBasis : rBasis * (0.7 + p * weite)
        if (b.gross) {
          const schein = ctx.createRadialGradient(bxp, byp, 0, bxp, byp, radius * 1.3)
          schein.addColorStop(0, rgb(traum ? palette.creme : palette.hell, (1 - p) * 0.35))
          schein.addColorStop(1, rgb(palette.hell, 0))
          ctx.fillStyle = schein
          ctx.beginPath()
          ctx.arc(bxp, byp, radius * 1.3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.strokeStyle = rgb(traum ? palette.creme : palette.hell, (1 - p) * 0.9)
        ctx.lineWidth = Math.max(1.5, (traum ? 6 : b.gross ? 4.5 : 3) * (1 - p))
        ctx.beginPath()
        ctx.arc(bxp, byp, radius, 0, Math.PI * 2)
        ctx.stroke()
        if (b.gross && !weich) {
          ctx.strokeStyle = rgb(palette.gold, (1 - p) * 0.6)
          ctx.lineWidth = Math.max(1, 2.5 * (1 - p))
          ctx.beginPath()
          ctx.arc(bxp, byp, radius * (0.55 + p * 0.9), 0, Math.PI * 2)
          ctx.stroke()
        }
        if (!weich) {
          const funken = b.gross ? 16 : 8
          const groesse = b.gross ? 3 : 2
          ctx.fillStyle = rgb(palette.hell, (1 - p) * 0.9)
          for (let i = 0; i < funken; i += 1) {
            const w = (i / funken) * Math.PI * 2 + b.stufe
            const d = radius * (0.9 + p * (b.gross ? 0.9 : 0.5))
            ctx.fillRect(bxp + Math.cos(w) * d - groesse / 2, byp + Math.sin(w) * d - groesse / 2, groesse, groesse)
          }
        }
      }

      /* Druckwellen der Spezialteile: die Form, die wirklich abgeraeumt hat. */
      t.knalle = t.knalle.filter((n) => jetzt - n.seit < KNALL_MS)
      for (const n of t.knalle) {
        const p = Math.min(1, (jetzt - n.seit) / KNALL_MS)
        const a = (1 - p) * (weich ? 0.45 : 0.85)
        const nx = x0 + n.x * z
        const ny = y0 + n.y * z
        ctx.lineWidth = Math.max(1.5, 5 * (1 - p))
        if (n.form === 'kreis') {
          ctx.strokeStyle = rgb(palette.hell, a)
          ctx.beginPath()
          ctx.arc(nx, ny, n.r * z * (0.35 + p * 0.85), 0, Math.PI * 2)
          ctx.stroke()
        } else if (n.form === 'zeile') {
          const hh = n.h * z * (0.5 + p * 0.5)
          const schleier = ctx.createLinearGradient(x0, ny - hh, x0, ny + hh)
          schleier.addColorStop(0, rgb(palette.hell, 0))
          schleier.addColorStop(0.5, rgb(palette.hell, a * 0.5))
          schleier.addColorStop(1, rgb(palette.hell, 0))
          ctx.fillStyle = schleier
          ctx.fillRect(x0, ny - hh, fb, hh * 2)
          ctx.strokeStyle = rgb(palette.creme, a)
          ctx.beginPath()
          ctx.moveTo(x0, ny)
          ctx.lineTo(x0 + fb, ny)
          ctx.stroke()
        } else if (n.form === 'feld') {
          const bb = n.b * z * (0.5 + p * 0.6)
          const hh = n.h * z * (0.5 + p * 0.6)
          ctx.strokeStyle = rgb(palette.hell, a)
          rr(ctx, nx - bb, ny - hh, bb * 2, hh * 2, 6)
          ctx.stroke()
        } else if (n.form === 'gold') {
          ctx.strokeStyle = rgb(palette.gold, a)
          ctx.beginPath()
          ctx.arc(nx, ny, 12 * (1 + p * 2.4), 0, Math.PI * 2)
          ctx.stroke()
        } else {
          /* Frost: kalter Schleier ueber dem ganzen Behaelter. */
          ctx.fillStyle = rgb(palette.creme, a * 0.18)
          ctx.fillRect(x0, y0, fb, fh)
        }
      }

      /* CHAIN 3+: goldener Schleier ueber dem Feld. */
      if (t.goldSeit) {
        const p = (jetzt - t.goldSeit) / GOLD_FLASH_MS
        if (p >= 1) t.goldSeit = 0
        else {
          ctx.fillStyle = rgb(palette.gold, (weich ? 0.12 : 0.26) * (1 - p))
          ctx.fillRect(x0, y0, fb, fh)
        }
      }

      /* Traumkueche: der ganze Behaelter leuchtet kurz creme auf. */
      if (t.traumSeit) {
        const p = (jetzt - t.traumSeit) / TRAUM_FLASH_MS
        if (p >= 1) t.traumSeit = 0
        else {
          ctx.fillStyle = rgb(palette.creme, (weich ? 0.18 : 0.35) * (1 - p))
          ctx.fillRect(x0, y0, fb, fh)
        }
      }

      /* Solange der Froster laeuft, liegt ein kalter Hauch ueber dem Feld. */
      if (stand.frostBis > stand.zeit && !tot) {
        ctx.fillStyle = rgb(palette.creme, 0.07)
        ctx.fillRect(x0, y0, fb, fh)
      }

      /* FIEBER: pulsierender Goldrahmen direkt am Behaelter. */
      if (t.fieberBis > jetzt && !tot) {
        const rest = Math.min(1, (t.fieberBis - jetzt) / 800)
        const fp = weich ? 0.75 : 0.5 + 0.5 * Math.sin(jetzt / 130)
        ctx.strokeStyle = rgb(palette.hell, (0.35 + 0.55 * fp) * rest)
        ctx.lineWidth = 3
        ctx.strokeRect(x0 + 1.5, y0 + 1.5, fb - 3, fh - 3)
        const schein = ctx.createLinearGradient(0, y0 + fh, 0, y0 + fh - 60)
        schein.addColorStop(0, rgb(palette.gold, 0.2 * fp * rest))
        schein.addColorStop(1, rgb(palette.gold, 0))
        ctx.fillStyle = schein
        ctx.fillRect(x0, y0 + fh - 60, fb, 60)
      }

      /* Funken und schwebende Zahlen ganz oben, aber noch im Beben. */
      funkenRef.current?.malen(ctx)
      rufRef.current?.malen(ctx, palette.farben)

      if (tot) {
        const p = weich ? 1 : Math.min(1, (jetzt - t.crashSeit) / (CRASH_MS - 80))
        ctx.fillStyle = rgb(palette.nacht, 0.45 * p)
        ctx.fillRect(x0, y0, fb, fh)
        ctx.fillStyle = rgb(palette.rot, 0.18 * p)
        ctx.fillRect(x0, y0, fb, ly - y0)
      }
      ctx.restore()

      /* Vorschau oben rechts: Emblem in einem Goldring, gut lesbar. */
      const vr = Math.max(6, Math.min(kopf * 0.42, 13))
      const vx = x0 + fb - vr - 3
      const vy = Math.max(vr + 3, Math.min(kopf / 2, y0 - vr - 2))
      ctx.fillStyle = rgb(palette.nacht, 0.8)
      ctx.beginPath()
      ctx.arc(vx, vy, vr + 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = rgb(palette.gold, 0.7)
      ctx.lineWidth = 1
      ctx.stroke()
      zeichneTeil(ctx, stand.naechstes, vx, vy, vr, vr / STUFEN[stand.naechstes].r, dpr, 1)
    }

    const tick = (jetzt) => {
      const dtMs = Math.min(100, jetzt - vorher)
      const dt = dtMs / 1000
      vorher = jetzt
      const stand = standRef.current
      const h = schrittRef.current
      const t = takt.current
      if (stand && h && !pauseRef.current && !crashRef.current) {
        if (t.tasten) t.zielX = klemmeX(stand.aktuell, t.zielX + t.tasten * TAST_TEMPO * dt)
        if (t.vorgemerkt && h.darfAbwerfen()) h.abwurfWunsch()
        speicher += dt
        let n = 0
        const gesammelt = []
        while (speicher >= SCHRITT_S && n < MAX_SCHRITTE && !stand.vorbei) {
          speicher -= SCHRITT_S
          n += 1
          const e = schritt(stand)
          if (e.length) gesammelt.push(...e)
        }
        if (n >= MAX_SCHRITTE) speicher = 0
        if (gesammelt.length) h.auswerten(gesammelt)

        /* Kombo abgelaufen? Warnstufe gewechselt? Nur bei Aenderung rendern. */
        if (t.kette && !stand.kette && !crashRef.current) {
          t.kette = 0
          setKombo((alt) => ({ kette: 0, nr: alt.nr }))
        }
        const w = stand.kritisch ? 2 : stand.warnung ? 1 : 0
        if (w !== t.warn && !crashRef.current) {
          if (w === 2 && jetzt - t.alarmSeit > 1500) {
            t.alarmSeit = jetzt
            klang('fehler', 1.3)
            vibrieren(HAPTIK.treffer)
          }
          t.warn = w
          setWarnstufe(w)
        }
      } else {
        speicher = 0
      }
      /* Die Effekte laufen auch in der Pause aus — sie hoeren nur auf, neue
         zu bekommen. Das sieht ruhiger aus als ein eingefrorener Funke. */
      funkenRef.current?.schritt(dtMs)
      rufRef.current?.schritt(dtMs)
      malen(jetzt, dtMs)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      /* Nichts lebt laenger als die Schleife: kein Funke, kein Ruf, kein Beben. */
      funkenRef.current?.leeren()
      rufRef.current?.leeren()
      bebenRef.current?.leeren()
      funkenRef.current = null
      rufRef.current = null
      bebenRef.current = null
    }
  }, [laeuft])

  const naechsterName = naechstes != null ? STUFEN[naechstes].name : ''
  const hoechsterName = hoechste >= 0 ? STUFEN[hoechste].name : ''
  const komboAn = kombo.kette >= 2 && !crash
  const komboProzent = Math.round((komboFaktor(kombo.kette) - 1) * 100)
  const warnung = crash ? 0 : warnstufe
  const fieberAn = fieber.an && !crash

  return (
    <SpielKarte
      spiel={{
        ...SPIEL,
        leisteLabel: 'HÖCHSTES',
        leisteWert: hoechste + 1,
        hebel: { wort: 'VERSCHMELZUNG', punkte: HEBEL_PUNKTE },
      }}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span className="trm-spiel__combo trm-merge-hoechstes" data-an={hoechste >= 5 ? '1' : '0'}>
          {hoechsterName}
        </span>
      }
    >
      {laeuft && (
        <>
          <div
            className="trm-merge-buehne"
            ref={buehneRef}
            role="application"
            tabIndex={0}
            aria-label="Küchen-Merge Spielfeld. Ziehen zum Zielen, loslassen zum Fallenlassen. Pfeiltasten zielen, Leertaste lässt fallen."
            style={{
              '--trm-merge-kombo-ms': `${Math.round(KOMBO_S * 1000)}ms`,
              '--trm-merge-fieber-ms': `${Math.round(FIEBER_S * 1000)}ms`,
            }}
            data-sanft={sanft ? '1' : '0'}
            data-crash={crash ? '1' : '0'}
            data-pause={pause ? '1' : '0'}
            data-fieber={fieberAn ? '1' : '0'}
            data-warnung={warnung}
            data-hitze={crash ? 0 : hitzeStufe.stufe}
            data-combo={crash ? 0 : kombo.kette}
            data-hoechste={hoechste}
            data-naechstes={naechstes ?? undefined}
            onPointerDown={zeigerRunter}
            onPointerMove={zeigerZieht}
            onPointerUp={zeigerHoch}
            onPointerCancel={() => {
              fingerRef.current = null
            }}
            onKeyDown={tasteRunter}
            onKeyUp={tasteHoch}
            onBlur={() => {
              takt.current.tasten = 0
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <canvas className="trm-merge-canvas" ref={canvasRef} aria-hidden="true" />
            <span className="trm-merge-naechstes" data-stufe={naechstes ?? undefined} aria-hidden="true">
              NÄCHSTES: <b>{naechsterName}</b>
            </span>

            {/* Die Druckkurve: ein eigenes Element, weil beide Pseudo-Elemente
                der Buehne schon Fieber und Warnung tragen. Es glueht nur,
                der Name steht darunter in der Pille. */}
            <span className="trm-merge-hitze-schein" data-stufe={crash ? 0 : hitzeStufe.stufe} aria-hidden="true" />
            <span
              className="trm-merge-hitze"
              key={hitzeStufe.nr}
              data-stufe={crash ? 0 : hitzeStufe.stufe}
              role="status"
            >
              {crash ? '' : hitzeStufe.name}
            </span>

            <span className="trm-merge-alarm" data-an={warnung === 2 ? '1' : '0'} role="status">
              {warnung === 2 ? 'ÜBERLAUF!' : ''}
            </span>

            {/* Der Tonschalter sitzt in der gemeinsamen Game-Shell
                (SpielKarte), nicht mehr hier. */}

            <span className="trm-merge-fieber" data-an={fieberAn ? '1' : '0'} aria-hidden="true">
              FIEBER
              {fieberAn && <i key={fieber.nr} className="trm-merge-fieber-zeit" />}
            </span>

            <div className="trm-merge-fuss" aria-hidden="true">
              <span className="trm-merge-stufen">
                {STUFEN.map((s, i) => (
                  <span
                    key={s.name}
                    className="trm-merge-stufe"
                    data-stufe={i}
                    data-erreicht={i <= hoechste ? '1' : '0'}
                    data-hoechste={i === hoechste ? '1' : undefined}
                    title={s.name}
                  />
                ))}
              </span>
              <span className="trm-merge-kombo" data-an={komboAn ? '1' : '0'} data-max={kombo.kette >= KOMBO_MAX ? '1' : '0'}>
                KOMBO <b>×{Math.max(kombo.kette, 1)}</b>
                {komboProzent > 0 && <span className="trm-merge-kombo-bonus">+{komboProzent}%</span>}
                {komboAn && <i key={kombo.nr} className="trm-merge-kombo-zeit" />}
              </span>
            </div>
          </div>

          {pause && <p className="trm-spiel__pause">PAUSE — zum Weiterspielen tippen</p>}

          {meldung && (
            <p key={meldung.nr} className={`trm-spiel__ruf trm-spiel__ruf--${meldung.art}`}>
              {meldung.text}
              {meldung.klein && <small className="trm-merge-ruf__klein">{meldung.klein}</small>}
            </p>
          )}
        </>
      )}
    </SpielKarte>
  )
}
