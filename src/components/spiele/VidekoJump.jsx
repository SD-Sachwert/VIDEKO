import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  COMBO_AB,
  FIGUR_B,
  FIGUR_H,
  GABE_R,
  GEGNER_DREH,
  GEGNER_H,
  GOLD_BONUS,
  HERD_BONUS,
  HOEHE_JE_EINHEIT,
  MAGNET_R,
  MEILENSTEIN,
  NEIGUNG_WARTEN_MS,
  PLATTE_DICKE,
  SCHWERE,
  SICHT_MIN,
  SPERRE_MS,
  TAKT,
  VX_MAX,
  eingabeAus,
  neigungAchse,
  neigungGrad,
  neuesSpiel,
  schritt,
  tiefpass,
  zeigerAchse,
} from './jump-logik.js'
import {
  HAPTIK,
  funkenwerk,
  klang,
  klangSchliessen,
  rufwerk,
  ruettler,
  sanftHoeren,
  vibrieren,
} from './spielgefuehl.js'
import './spielgefuehl.css'
import './jump.css'

/**
 * VIDEKO JUMP — von Arbeitsplatte zu Arbeitsplatte, nur nach oben.
 *
 * Physik, Platten und Wertung stehen in jump-logik.js und sind dort
 * getestet. Hier geht es nur um Zeit, Finger und Bild.
 *
 * STEUERUNG
 * ---------
 * Standard ist der Daumen. Das ganze Feld ist ein waagerechter Regler: wo
 * der Finger liegt, dahin zieht es, und zwar so stark, wie er von der Mitte
 * weg liegt. Am Rand voller Ausschlag, in der Mitte Ruhe. Das ist bewusst
 * eine Position und kein Wischen — eine Position kann man blind halten und
 * mitten im Fall umgreifen, ohne einen Startpunkt zu verlieren. Mit mehreren
 * Fingern gilt der zuletzt aufgesetzte. Tastatur: Pfeile oder A/D halten.
 * Gesprungen wird von allein.
 *
 * Die Neigung ist nur noch eine Option und muss eingeschaltet werden. Beim
 * Einschalten wird der Neutralpunkt gemessen (kaum jemand haelt das Handy
 * flach); darunter liegt eine Totzone, darueber ein Tiefpass und eine
 * Maximalgeschwindigkeit. Wer still haelt, steht still. Liefert der Sensor
 * nichts, wird die Erlaubnis verweigert oder fehlt er ganz, sagt die Taste
 * es kurz, und Touch laeuft weiter. Ein liegender Finger schlaegt immer die
 * Neigung.
 *
 * Fuer Tests steht die wirksame Richtung als data-richtung (-1 … 1) und
 * ihre Quelle als data-steuerung (touch, neigung) an der Buehne.
 *
 * GLEICH AUF JEDEM HANDY
 * ----------------------
 * Die Welt ist genau eine Buehnenbreite breit und mindestens SICHT_MIN
 * Breiten hoch. Ist die Buehne dafuer zu flach, wird das Spielfeld schmaler
 * und mittig gezeigt — es wird nie gestreckt. Gerechnet wird in festen
 * Schritten von 1/120 s, egal wie oft der Bildschirm malt.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Eine Runde ist die erste Landung auf einer Platte. Der Server verlangt
 * mindestens 150 ms je Runde, gemessen ab Ausgabe des Laufscheins — und
 * der kommt beim Sofortstart erst nach dem ersten Sprung an. Deshalb
 * landen Runde und Punkte zuerst in einer Kasse. Gebucht wird erst mit
 * Ticket und hoechstens eine Runde je SPERRE_MS, gezaehlt ab dem spaeteren
 * Zeitpunkt von Ticketankunft und letzter Buchung. Die Punkte gehen immer
 * zusammen mit ihrer Runde raus: so kann der Punktestand nie der
 * Rundenzahl davonlaufen. Beim Absturz wartet die Abgabe, bis die Kasse
 * leer ist (hoechstens ein paar Sekunden).
 *
 * WIE ES FLUESSIG BLEIBT
 * ----------------------
 * Ein Canvas malt alles; der Marmorgrund liegt vorgerendert in einem
 * zweiten, unsichtbaren Canvas. React rendert nur bei Landung auf neuer
 * Hoehe, Meldung, Pause und Absturz — nie pro Frame.
 */

const SPIEL = SPIEL_NACH_KEY.videko_jump

const CRASH_MS = 560
/* Laenger wartet die Abgabe nicht auf eine volle Kasse. */
const KASSE_WARTEN_MS = 3000
/* Nach einem Ruckler hoechstens so viele Schritte nachholen (0,25 s). */
const SCHRITTE_MAX = 30
const STAUCHEN_MS = 130
const HEBEL_PUNKTE = GOLD_BONUS

const TASTEN_LINKS = ['ArrowLeft', 'a', 'A']
const TASTEN_RECHTS = ['ArrowRight', 'd', 'D']

/* So lange bleibt eine Fehlermeldung auf der Neigungstaste stehen. */
const NEIGUNG_FEHLER_MS = 2500
/* So viele Messwerte bilden den Neutralpunkt. Bei 60 Hz sind das gut
   100 ms — kurz genug, dass es sich nach dem Tipp sofort anfuehlt. */
const NEIGUNG_PROBEN = 6
/* Die Taste zeigt die geltende Steuerung, nicht einen Wunsch. */
const NEIGUNG_TEXT = {
  aus: 'STEUERUNG TOUCH',
  fragt: 'NEIGUNG …',
  aktiv: 'STEUERUNG NEIGUNG',
  verweigert: 'NEIGUNG VERWEIGERT',
  'nicht-unterstuetzt': 'KEIN NEIGUNGSSENSOR',
}
const NEIGUNG_HILFE = {
  aus: 'Steuerung Touch. Tippen schaltet auf Neigung um.',
  fragt: 'Neigungssensor wird angefragt.',
  aktiv: 'Steuerung Neigung. Tippen schaltet zurück auf Touch.',
  verweigert: 'Neigung wurde verweigert. Touch bleibt aktiv.',
  'nicht-unterstuetzt': 'Kein Neigungssensor gefunden. Touch bleibt aktiv.',
}
/* So lange fliegt die Kochmuetze nach einer Boostplatte hoch. */
const BOOST_FLUG_MS = 520

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

function paletteBauen(el) {
  const stil = el ? getComputedStyle(el) : null
  const t = {}
  for (const [name, rueck] of Object.entries(TOKEN_RUECKFALL)) {
    t[name] = farbeLesen(stil?.getPropertyValue(name)) || farbeLesen(rueck)
  }
  const nacht = t['--trm-nacht']
  const creme = t['--trm-creme']
  return {
    nacht,
    gold: t['--trm-gold'],
    hell: t['--trm-gold-hell'],
    tief: t['--trm-gold-tief'],
    creme,
    rot: t['--trm-rot'],
    gruen: t['--trm-gruen'],
    stein: mischen(nacht, creme, 0.2),
    steinTief: mischen(nacht, creme, 0.07),
  }
}

/* Haptik kommt aus spielgefuehl.js — ein Ort fuer alle Spiele. */
const summen = vibrieren

/* Das Rufwerk malt mit fertigen CSS-Farben, die Palette haelt rgb-Tripel.
   Ein kleiner Uebersetzer, damit beide Seiten unveraendert bleiben. */
function rufFarben(palette) {
  return {
    gruen: rgb(palette.gruen),
    goldHell: rgb(palette.hell),
    creme: rgb(palette.creme),
    nacht: rgb(palette.nacht),
  }
}

/* ------------------------------------------------------------------ */
/* Das echte VIDEKO-Symbol                                             */
/* ------------------------------------------------------------------ */
/*
 * Die Figur ist nicht irgendein gemaltes V, sondern das Markenzeichen
 * selbst: dieselbe Datei, die auch als Favicon ausgeliefert wird
 * (public/favicon-512.png, reines V/D-Emblem ohne Schriftzug, mit
 * Transparenz). Sie wird ausschliesslich gleichmaessig skaliert und
 * gedreht — nie gestaucht, nie gespiegelt, nie eingefaerbt.
 *
 * Das Federn beim Landen (Squash/Stretch) sitzt deshalb nicht im Logo,
 * sondern in der Kochmuetze, die als eigenes Spielelement darueber liegt,
 * und im Schatten darunter. So bleibt das Logo unveraendert und die Figur
 * trotzdem lebendig.
 */
const LOGO_QUELLE = '/favicon-512.png'
let logoBild = null
function logoHolen() {
  if (logoBild) return logoBild
  if (typeof Image === 'undefined') return null
  const img = new Image()
  img.decoding = 'async'
  img.src = LOGO_QUELLE
  logoBild = img
  return img
}
const logoDa = (img) => !!(img && img.complete && img.naturalWidth > 0)

/* ------------------------------------------------------------------ */
/* Trockene Kommentare (sparsam eingesetzt)                            */
/* ------------------------------------------------------------------ */

/* Ein Spruch je Teilesorte. VIDEKO baut nicht nur Kuechen, also fliegt hier
   auch nicht nur Kuecheninventar — und der Ton bleibt trocken, nie albern. */
const SPRUCH_TREFFER = {
  backofen: 'DER BACKOFEN WAR SCHNELLER.',
  kuehlschrank: 'DER KÜHLSCHRANK HATTE ANDERE PLÄNE.',
  pfanne: 'DIE PFANNE WAR ZUERST DA.',
  karton: 'NUR EIN KARTON. TROTZDEM BLÖD.',
  werkzeugkiste: 'WER HAT DAS AUFGEMESSEN?',
  farbrolle: 'ZWEITER ANSTRICH. INKLUSIVE.',
  kabeltrommel: 'DER ELEKTRIKER WAR ES.',
  pvmodul: 'VOLLE EINSPEISUNG. NACH UNTEN.',
  bodenpaket: 'BODEN KAM FRÜHER ALS GEPLANT.',
  waschbecken: 'BECKEN VERSENKT.',
  leuchte: 'LICHT AUS.',
  maklerschild: 'OBJEKT LEIDER VERGEBEN.',
  deckenring: 'SPANNDECKE ÜBERSPANNT.',
  schranktuer: 'DAS WAR NICHT IM LEISTUNGSVERZEICHNIS.',
}
const SPRUCH_KNAPP = ['KNAPP.', 'DAS WAR SPORTLICH.', 'MIT DER FUSSSPITZE.', 'PASST. FAST.']
/* An die Leiter der Logik gebunden, damit Wort und Zahl nicht auseinanderlaufen. */
const STUFEN_WORT = ['HEISS', 'BAULEITUNG NERVÖS', 'BAUSTELLE ESKALIERT', 'KOMPLETT GESTÖRT']
const SPRUCH_STUFE = Object.fromEntries(COMBO_AB.map((n, i) => [n, STUFEN_WORT[i] || 'KOMPLETT GESTÖRT']))
const SPRUCH_GABE = {
  muetze: 'GOLDENE KOCHMÜTZE',
  schuerze: 'SCHUTZSCHÜRZE',
  turbo: 'TURBO',
  magnet: 'MAGNET',
  superkoch: 'VIDEKO SUPERKOCH',
}
/* Die vier seltenen Wellen. Kurzer Titel oben, trockener Satz im Feld. */
const SPRUCH_WELLE = {
  stampede: { titel: 'KÜHLSCHRANK-STAMPEDE', satz: 'ALLE AUF EINMAL.' },
  ofenalarm: { titel: 'OFEN-ALARM', satz: 'ES WIRD HEISS.' },
  goldrausch: { titel: 'GOLDRAUSCH', satz: 'DAS GEHT AUF REGIE.' },
  kuechenchef: { titel: 'KÜCHENCHEF-MODUS', satz: 'DOPPELT. OHNE NACHFRAGE.' },
}

function rundesRechteck(ctx, x, y, b, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, b, h, r)
  else ctx.rect(x, y, b, h)
}

/** Wo das Spielfeld auf der Buehne liegt: s Pixel je Weltbreite, x0 linker Rand. */
function geometrie(breite, hoehe) {
  const s = Math.max(40, Math.min(breite, hoehe / SICHT_MIN))
  return { s, x0: Math.round((breite - s) / 2) }
}

/**
 * Schwarzer Marmor mit Goldadern, einmal je Groesse gemalt. Die Adern
 * werden oben und unten gespiegelt fortgesetzt, damit die Kachel beim
 * Mitlaufen keine Naht zeigt.
 */
function marmorMalen(ziel, breite, hoehe, dpr, palette) {
  ziel.width = Math.max(1, Math.round(breite * dpr))
  ziel.height = Math.max(1, Math.round(hoehe * dpr))
  const ctx = ziel.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = rgb(palette.nacht)
  ctx.fillRect(0, 0, breite, hoehe)
  const schein = ctx.createRadialGradient(breite * 0.3, hoehe * 0.25, 0, breite * 0.3, hoehe * 0.25, hoehe * 0.8)
  schein.addColorStop(0, rgb(mischen(palette.nacht, palette.tief, 0.28)))
  schein.addColorStop(1, rgb(palette.nacht, 0))
  ctx.fillStyle = schein
  ctx.fillRect(0, 0, breite, hoehe)

  /* Fester Zufall: jede Groesse bekommt dasselbe Muster. */
  let a = 7
  const zufall = () => {
    a = (a * 16807) % 2147483647
    return a / 2147483647
  }
  for (let i = 0; i < 9; i += 1) {
    const y = zufall() * hoehe
    const neigung = (zufall() - 0.5) * hoehe * 0.7
    const breit = 0.4 + zufall() * 1.3
    const alpha = 0.04 + zufall() * 0.1
    const farbe = zufall() < 0.3 ? palette.creme : palette.gold
    const k1 = (zufall() - 0.5) * hoehe * 0.4
    const k2 = (zufall() - 0.5) * hoehe * 0.4
    for (const versatz of [-hoehe, 0, hoehe]) {
      ctx.beginPath()
      ctx.moveTo(-10, y + versatz)
      ctx.bezierCurveTo(breite * 0.33, y + k1 + versatz, breite * 0.66, y + neigung + k2 + versatz, breite + 10, y + neigung + versatz)
      ctx.strokeStyle = rgb(farbe, alpha)
      ctx.lineWidth = breit
      ctx.stroke()
    }
  }
}

export default function VidekoJump({ sitzung, best = null, onErgebnis }) {
  const [hoehe, setHoehe] = useState(0)
  const [meldung, setMeldung] = useState(null)
  const [pause, setPause] = useState(false)
  const [crash, setCrash] = useState(false)
  const [sanft, setSanft] = useState(false)
  const [gelenkt, setGelenkt] = useState(false)
  /* Was gerade wirkt: fuer die kleine Leiste ueber dem Spielfeld. */
  const [kraefte, setKraefte] = useState({
    combo: 0, muetze: 0, schutz: false, turbo: 0, magnet: 0, superkoch: 0,
  })
  /* aus | fragt | aktiv | verweigert | nicht-unterstuetzt */
  const [neigung, setNeigung] = useState('aus')

  const buehneRef = useRef(null)
  const canvasRef = useRef(null)
  const marmorRef = useRef(null)
  const masseRef = useRef({ breite: 320, hoehe: 480, dpr: 1 })
  const paletteRef = useRef(null)
  const standRef = useRef(null)
  const nrRef = useRef(0)
  const pauseRef = useRef(false)
  const crashRef = useRef(false)
  const sanftRef = useRef(false)
  const uhrRef = useRef(0)
  /* Runden und Punkte, die noch auf ihre Buchung warten. */
  const kasseRef = useRef({ offen: [], letzte: 0 })
  /* Eingabe: gehaltene Tasten und Finger (pointerId -> -1, 0, 1). 0 heisst:
     dieser Finger hat die Pause beendet und lenkt nicht. */
  const eingabeRef = useRef({ links: false, rechts: false, sperre: false, finger: new Map() })
  const bildRef = useRef({
    gelandet: 0, crashSeit: 0, getroffen: 0, gabe: 0, muetzeWackel: 0,
    boost: 0, fegeUhr: 0, endeText: '',
  })
  /* Effektwerke (§7). Einmal angelegt, ueber die ganze Runde wiederverwendet:
     fester Vorrat, keine neuen Objekte pro Funke. */
  const fxRef = useRef(null)
  if (fxRef.current == null) {
    fxRef.current = { funken: funkenwerk(140), rufe: rufwerk(10), beben: ruettler({ max: 10 }) }
  }
  const logoRef = useRef(null)
  /* Neigung: Hoerer, Uhren und die zuletzt erkannte Richtung. `token` macht
     spaete Antworten einer abgebrochenen Anfrage wirkungslos. */
  const neigungRef = useRef({
    aktiv: false, fragt: false, richtung: 0, token: 0, hoerer: null, uhr: 0, zurueck: 0,
    /* Neutralpunkt und die Messwerte, aus denen er gebildet wird. */
    null0: 0, proben: 0, summe: 0,
  })

  const lauf = useSpielLauf({ sitzung, game: 'videko_jump', dauerVorgabe: 540000, onErgebnis, sofort: true })
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

  useEffect(() => {
    const uhr = uhrRef
    return () => clearTimeout(uhr.current)
  }, [])

  /* Das Markenzeichen einmal holen. Es liegt im Modul, nicht in der
     Komponente — jedes weitere Spiel bekommt dieselbe geladene Datei. */
  useEffect(() => {
    logoRef.current = logoHolen()
  }, [])

  /* Ton beim Verlassen sauber schliessen (§15). */
  useEffect(() => () => klangSchliessen(), [])

  /* Groesse messen, Canvas auf DPR (hoechstens 2), Farben lesen, Marmor malen. */
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
      if (!marmorRef.current) marmorRef.current = document.createElement('canvas')
      marmorMalen(marmorRef.current, breite, hoehe, dpr, paletteRef.current)
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

  const eingabeLoslassen = useCallback(() => {
    const e = eingabeRef.current
    e.links = false
    e.rechts = false
    e.finger.clear()
  }, [])

  /** Neigung ganz abschalten: Hoerer weg, Uhren weg, laufende Anfrage ungueltig. */
  const neigungAus = useCallback(() => {
    const n = neigungRef.current
    n.token += 1
    if (n.hoerer) window.removeEventListener('deviceorientation', n.hoerer)
    clearTimeout(n.uhr)
    clearTimeout(n.zurueck)
    Object.assign(n, {
      aktiv: false, fragt: false, richtung: 0, hoerer: null, uhr: 0, zurueck: 0,
      null0: 0, proben: 0, summe: 0,
    })
  }, [])

  /* Mit dem Lauf endet auch die Neigung — und beim Aushaengen sowieso. */
  useEffect(() => {
    if (!laeuft) return undefined
    return () => neigungAus()
  }, [laeuft, neigungAus])

  /* Wer den Tab wechselt, findet das Spiel angehalten vor. Der Tipp zum
     Weiterspielen lenkt nicht. */
  useEffect(() => {
    if (!laeuft) return undefined
    const wechsel = () => {
      if (document.hidden && !crashRef.current) {
        pauseRef.current = true
        eingabeLoslassen()
        setPause(true)
      }
    }
    document.addEventListener('visibilitychange', wechsel)
    return () => document.removeEventListener('visibilitychange', wechsel)
  }, [laeuft, eingabeLoslassen])

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
    eingabeLoslassen()
    bildRef.current.crashSeit = performance.now()
    setPause(false)
    setCrash(true)
    /* Ein Gegnertreffer hat schon die passende Zeile gesetzt. Nur wer
       wirklich ins Leere faellt, bekommt ABGESTUERZT. */
    melden('verkantet', bildRef.current.endeText || 'ABGESTÜRZT')
    summen([60, 40, 90])
    const beginn = Date.now()
    /* Erst abgeben, wenn die Kasse leer ist — siehe DER SERVER RECHNET MIT. */
    const abgeben = () => {
      if (kasseRef.current.offen.length && Date.now() - beginn < CRASH_MS + KASSE_WARTEN_MS) {
        uhrRef.current = setTimeout(abgeben, 100)
        return
      }
      uhrRef.current = 0
      fertig()
    }
    uhrRef.current = setTimeout(abgeben, CRASH_MS)
  }, [eingabeLoslassen, fertig, melden])

  useTestEnde('videko_jump', laeuft, aufgeben)

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    clearTimeout(uhrRef.current)
    standRef.current = neuesSpiel(Math.floor(Math.random() * 2147483646) + 1)
    kasseRef.current = { offen: [], letzte: 0 }
    bildRef.current = {
      gelandet: 0, crashSeit: 0, getroffen: 0, gabe: 0, muetzeWackel: 0,
      boost: 0, fegeUhr: 0, endeText: '',
    }
    /* Nichts aus der letzten Runde darf in die neue hineinragen. */
    fxRef.current.funken.leeren()
    fxRef.current.rufe.leeren()
    fxRef.current.beben.leeren()
    pauseRef.current = false
    crashRef.current = false
    eingabeLoslassen()
    setHoehe(0)
    setKraefte({ combo: 0, muetze: 0, schutz: false, turbo: 0, magnet: 0, superkoch: 0 })
    setMeldung(null)
    setPause(false)
    setCrash(false)
    setGelenkt(false)
    neigungAus()
    setNeigung('aus')
    return true
  }, [laufStarten, eingabeLoslassen, neigungAus])

  /** Hoechstens eine Runde aus der Kasse buchen — mit Ticket und Abstand. */
  const buchen = useCallback(() => {
    const kasse = kasseRef.current
    const ticketSeit = ticketSeitRef.current
    if (!kasse.offen.length || !ticketSeit) return
    const jetzt = Date.now()
    if (jetzt - Math.max(ticketSeit, kasse.letzte) < SPERRE_MS) return
    const punkte = kasse.offen.shift()
    kasse.letzte = jetzt
    rundeZaehlen()
    if (punkte) punkteGeben(punkte)
  }, [punkteGeben, rundeZaehlen, ticketSeitRef])

  /** Weltkoordinaten in Bildkoordinaten — fuer Funken und schwebende Zahlen. */
  const weltZuBild = useCallback((wx, wy) => {
    const { breite, hoehe: h } = masseRef.current
    const { s, x0 } = geometrie(breite, h)
    const stand = standRef.current
    return { x: x0 + wx * s, y: h - (wy - (stand ? stand.kamera : 0)) * s, s }
  }, [])

  /** Was die Logik in einem Schritt gemeldet hat. */
  const verarbeiten = useCallback(
    (ereignisse) => {
      const fx = fxRef.current
      const pal = paletteRef.current
      const gold = pal ? rgb(pal.hell) : '#e8c978'
      const creme = pal ? rgb(pal.creme) : '#f4efe4'
      const rot = pal ? rgb(pal.rot) : '#e2453a'
      const gruen = pal ? rgb(pal.gruen) : '#57c47c'

      for (const e of ereignisse) {
        if (e.art === 'landung' || e.art === 'durchflug') {
          const landung = e.art === 'landung'
          if (landung) bildRef.current.gelandet = performance.now()
          if (landung) {
            const b = weltZuBild(e.platte.x, e.platte.y)
            /* Aufsetzimpuls: ein bisschen Staub unter den Fuessen. */
            fx.funken.schuss({
              x: b.x, y: b.y, anzahl: e.knapp ? 8 : 4, farbe: e.knapp ? gold : creme,
              tempo: b.s * 0.5, streuung: 1.5, richtung: -Math.PI / 2, gr: 2.2, leben: 380,
            })
          }
          if (e.zerbrochen) {
            const b = weltZuBild(e.platte.x, e.platte.y)
            fx.funken.schuss({ x: b.x, y: b.y, anzahl: 10, farbe: creme, tempo: b.s * 0.7, gr: 2.4, art: 'krume' })
            summen(HAPTIK.tipp)
            klang('fehler', 1.4)
          }
          if (e.boost) {
            /* Die rote Platte ist kein Fehler, sondern der Katapultstart.
               Also Funken nach oben, Rauch hinterher, und die Muetze fliegt. */
            const b = weltZuBild(e.platte.x, e.platte.y)
            bildRef.current.boost = performance.now()
            fx.funken.schuss({
              x: b.x, y: b.y, anzahl: 18, farbe: [gold, rot],
              tempo: b.s * 1.2, streuung: 1.1, richtung: -Math.PI / 2, gr: 3, art: 'stern',
            })
            /* Negative Schwere = Rauch, der langsam nach oben zieht. */
            fx.funken.schuss({
              x: b.x, y: b.y, anzahl: 7, farbe: creme, tempo: b.s * 0.3,
              streuung: 2.2, richtung: -Math.PI / 2, schwere: -140, leben: 900, gr: 4,
            })
            fx.beben.stoss(7)
            melden('gold', `HEISS! +${HERD_BONUS}`)
            klang('kraft', 1.25)
            summen(HAPTIK.fieber)
          }
          if (!e.neu) continue
          kasseRef.current.offen.push(e.punkte)
          if (e.punkte) setHoehe(e.hoehe)

          const b = weltZuBild(e.platte.x, e.platte.y)
          if (e.punkte && (e.knapp || e.gold || e.mult > 1 || !landung)) {
            fx.rufe.zeigen({ x: b.x, y: b.y - 14, text: `+${e.punkte}`, art: 'punkte', gr: 16 })
          }
          if (e.knapp) {
            /* KNAPP: Goldfunken an der Fussspitze, und die Kombo zaehlt hoch. */
            fx.funken.schuss({ x: b.x, y: b.y - 6, anzahl: 9, farbe: gold, tempo: b.s * 0.8, gr: 2.6, art: 'stern' })
            klang('combo', 1 + Math.min(6, e.combo) * 0.07)
            summen(HAPTIK.gut)
            if (e.comboStufe) {
              fx.rufe.zeigen({ x: b.x, y: b.y - 40, text: SPRUCH_STUFE[e.comboStufe], art: 'combo', gr: 20 })
              fx.beben.stoss(e.comboStufe >= 8 ? 9 : 5)
              melden('gold', `KOMBO ×${e.combo}`)
              summen(HAPTIK.fieber)
            } else if (e.combo % 2 === 1) {
              /* Sparsam: nicht nach jedem Sprung ein Spruch. */
              fx.rufe.zeigen({ x: b.x, y: b.y - 34, text: SPRUCH_KNAPP[e.combo % SPRUCH_KNAPP.length], art: 'ruf', gr: 13 })
            }
          }
          if (e.meilenstein) {
            melden('perfekt', `${e.meilenstein} M`)
            summen(HAPTIK.perfekt)
            klang('perfekt')
            fx.beben.stoss(6)
          } else if (e.gold) {
            melden('gold', `GOLDPLATTE +${GOLD_BONUS}`)
            summen(HAPTIK.gut)
            klang('kraft')
            fx.funken.schuss({ x: b.x, y: b.y, anzahl: 14, farbe: gold, tempo: b.s * 0.9, gr: 3, art: 'stern' })
          } else if (landung) {
            summen(HAPTIK.tipp)
            klang('sprung', 1 + Math.min(8, e.combo) * 0.05)
          }
        } else if (e.art === 'gabe') {
          const b = weltZuBild(e.gabe.x, e.gabe.y)
          bildRef.current.gabe = performance.now()
          const gabeFarbe = e.gart === 'schuerze' ? gruen : e.gart === 'magnet' ? rot : gold
          fx.funken.schuss({
            x: b.x, y: b.y, anzahl: e.gart === 'superkoch' ? 26 : 16,
            farbe: e.gart === 'superkoch' ? [gold, creme] : gabeFarbe,
            tempo: b.s * 0.9, gr: 3, art: 'stern',
          })
          fx.rufe.zeigen({
            x: b.x, y: b.y - 18, text: SPRUCH_GABE[e.gart] || 'BONUS',
            art: 'combo', gr: e.gart === 'superkoch' ? 20 : 15,
          })
          fx.beben.stoss(e.gart === 'superkoch' ? 10 : 4)
          klang('kraft', e.gart === 'turbo' ? 1.3 : e.gart === 'superkoch' ? 0.8 : 1)
          summen(e.gart === 'superkoch' ? HAPTIK.fieber : HAPTIK.gut)
          if (e.gart === 'superkoch') melden('gold', 'VIDEKO SUPERKOCH')
        } else if (e.art === 'welle') {
          /* Wellen betreffen den ganzen Bildschirm, also ruft der Text
             aus der Mitte und nicht von einer einzelnen Platte. */
          const { breite, hoehe: h } = masseRef.current
          const w = SPRUCH_WELLE[e.welle] || { titel: 'BAUSTELLE', satz: 'ES GEHT LOS.' }
          fx.rufe.zeigen({ x: breite / 2, y: h * 0.42, text: w.titel, art: 'combo', gr: 22 })
          fx.beben.stoss(8)
          melden('gold', w.satz)
          klang('kraft', 0.9)
          summen(HAPTIK.fieber)
        } else if (e.art === 'wegfegen') {
          /* Turbo und Superkoch raeumen ganze Reihen ab. Ohne Bremse waere
             das ein Funkenregen, der das Budget sprengt. */
          const jetzt = performance.now()
          const b = weltZuBild(e.gegner.x, e.gegner.y)
          fx.funken.schuss({ x: b.x, y: b.y, anzahl: 6, farbe: [gold, creme], tempo: b.s * 0.8, gr: 2.4, art: 'krume' })
          if (jetzt - bildRef.current.fegeUhr > 60) {
            bildRef.current.fegeUhr = jetzt
            fx.beben.stoss(4)
            klang('treffer', 1.3)
            summen(HAPTIK.tipp)
          }
        } else if (e.art === 'schutz') {
          const b = weltZuBild(e.gegner.x, e.gegner.y)
          /* Das Schild zerplatzt sichtbar — sonst merkt niemand, dass der
             eine Rettungsanker jetzt aufgebraucht ist. */
          fx.funken.schuss({ x: b.x, y: b.y, anzahl: 22, farbe: [gruen, creme], tempo: b.s * 1.1, gr: 3, art: 'stern' })
          fx.funken.schuss({ x: b.x, y: b.y, anzahl: 10, farbe: gruen, tempo: b.s * 0.5, gr: 2.2, art: 'krume' })
          fx.rufe.zeigen({ x: b.x, y: b.y - 16, text: 'SCHÜRZE GERETTET.', art: 'combo', gr: 15 })
          fx.beben.stoss(9)
          melden('perfekt', 'SCHÜRZE GERETTET.')
          klang('explosion', 1.2)
          summen(HAPTIK.treffer)
        } else if (e.art === 'treffer') {
          const b = weltZuBild(e.gegner.x, e.gegner.y)
          bildRef.current.getroffen = performance.now()
          const text = SPRUCH_TREFFER[e.gegner.art] || 'DAS WAR KEIN SPRUNGBRETT.'
          fx.funken.schuss({ x: b.x, y: b.y, anzahl: 18, farbe: [rot, creme], tempo: b.s * 1.1, gr: 3, art: 'krume' })
          melden('verkantet', text)
          /* Der Absturz folgt im selben Durchlauf. Damit aufgeben() die
             Zeile nicht ueberschreibt, merken wir sie uns hier. */
          if (e.toedlich) bildRef.current.endeText = text
          fx.beben.stoss(10)
          klang('explosion')
          summen(HAPTIK.explosion)
        } else if (e.art === 'absturz') {
          aufgeben()
        }
      }
    },
    [aufgeben, melden, weltZuBild],
  )

  /* ---------------------------------------------------------------- */
  /* Eingaben                                                          */
  /* ---------------------------------------------------------------- */

  const weiter = () => {
    pauseRef.current = false
    eingabeLoslassen()
    setPause(false)
  }

  /* Der Daumen gibt eine Position vor, keine Geste: wo er liegt, dorthin
     zieht die Figur — und zwar umso staerker, je weiter aussen er liegt. */
  const achseAus = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    return zeigerAchse(e.clientX, r.left, r.width)
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
      /* null statt 0: der Finger, der die Pause beendet hat, lenkt nicht
         mit — aber er ist bekannt, damit sein Ziehen ignoriert wird. */
      eingabeRef.current.finger.set(e.pointerId, null)
      return
    }
    const finger = eingabeRef.current.finger
    finger.delete(e.pointerId)
    finger.set(e.pointerId, achseAus(e))
    if (!gelenkt) setGelenkt(true)
  }

  const zeigerZieht = (e) => {
    const finger = eingabeRef.current.finger
    /* 0 ist eine gueltige Mitte, deshalb has() statt einer Wahrheitspruefung. */
    if (!finger.has(e.pointerId) || finger.get(e.pointerId) === null) return
    finger.set(e.pointerId, achseAus(e))
  }

  const zeigerWeg = (e) => {
    eingabeRef.current.finger.delete(e.pointerId)
  }

  const tasteRunter = (e) => {
    if (!laeuft || crashRef.current) return
    const k = e.key
    const links = TASTEN_LINKS.includes(k)
    const rechts = TASTEN_RECHTS.includes(k)
    if (!links && !rechts && k !== ' ' && k !== 'Enter') return
    e.preventDefault()
    const ein = eingabeRef.current
    if (pauseRef.current) {
      if (!e.repeat) {
        weiter()
        ein.sperre = true
      }
      return
    }
    /* Die Taste, die die Pause beendet hat, lenkt erst nach dem Loslassen. */
    if (ein.sperre && e.repeat) return
    if (links) ein.links = true
    if (rechts) ein.rechts = true
    if ((links || rechts) && !gelenkt) setGelenkt(true)
  }

  const tasteHoch = (e) => {
    const ein = eingabeRef.current
    ein.sperre = false
    if (TASTEN_LINKS.includes(e.key)) ein.links = false
    if (TASTEN_RECHTS.includes(e.key)) ein.rechts = false
  }

  /* Fokus wandert zur Neigungstaste: das ist kein Verlassen des Spielfelds. */
  const fokusWeg = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return
    eingabeLoslassen()
  }

  /**
   * NEIGUNG AKTIVIEREN. Die Erlaubnis (iOS) wird direkt im Tipp angefragt,
   * sonst wird einfach gelauscht. Kommen binnen NEIGUNG_WARTEN_MS keine
   * Daten, gibt es keinen brauchbaren Sensor.
   */
  const neigungUmschalten = () => {
    const n = neigungRef.current
    if (n.aktiv || n.fragt) {
      neigungAus()
      setNeigung('aus')
      return
    }
    neigungAus()
    const token = n.token
    const gilt = () => n.token === token
    const scheitern = (status) => {
      if (!gilt()) return
      neigungAus()
      setNeigung(status)
      n.zurueck = setTimeout(() => setNeigung((s) => (s === status ? 'aus' : s)), NEIGUNG_FEHLER_MS)
    }
    const Sensor = typeof window !== 'undefined' ? window.DeviceOrientationEvent : undefined
    if (typeof Sensor !== 'function') {
      scheitern('nicht-unterstuetzt')
      return
    }
    n.fragt = true
    setNeigung('fragt')

    const hoeren = () => {
      if (!gilt()) return
      const hoerer = (ev) => {
        if (!gilt()) return
        let winkel
        try {
          winkel = window.screen?.orientation?.angle ?? window.orientation ?? 0
        } catch {
          winkel = 0
        }
        const grad = neigungGrad(ev.beta, ev.gamma, winkel)
        if (grad === null) return
        if (!n.aktiv) {
          /* Neutralpunkt: die ersten Messwerte legen fest, wie das Geraet
             gerade gehalten wird. Sonst driftet jeder, der nicht exakt
             senkrecht sitzt, dauerhaft in eine Richtung. */
          n.proben += 1
          n.summe += grad
          if (n.proben < NEIGUNG_PROBEN) return
          n.null0 = n.summe / n.proben
          n.richtung = 0
          n.aktiv = true
          n.fragt = false
          clearTimeout(n.uhr)
          n.uhr = 0
          setNeigung('aktiv')
          setGelenkt(true)
          return
        }
        /* Tiefpass: der Sensor rauscht, die Figur soll nicht zittern. */
        n.richtung = tiefpass(n.richtung, neigungAchse(grad, n.null0))
      }
      n.hoerer = hoerer
      window.addEventListener('deviceorientation', hoerer)
      n.uhr = setTimeout(() => {
        if (!n.aktiv) scheitern('nicht-unterstuetzt')
      }, NEIGUNG_WARTEN_MS)
    }
    const fehler = (err) => scheitern(err?.name === 'NotAllowedError' ? 'verweigert' : 'nicht-unterstuetzt')

    if (typeof Sensor.requestPermission === 'function') {
      try {
        Promise.resolve(Sensor.requestPermission()).then(
          (antwort) => (antwort === 'granted' ? hoeren() : scheitern('verweigert')),
          fehler,
        )
      } catch (err) {
        fehler(err)
      }
    } else {
      hoeren()
    }
  }

  /* ---------------------------------------------------------------- */
  /* Schleife: fester Takt, Kasse, Malen                               */
  /* ---------------------------------------------------------------- */

  const helferRef = useRef(null)
  useEffect(() => {
    helferRef.current = { verarbeiten, buchen }
  }, [verarbeiten, buchen])

  useEffect(() => {
    if (!laeuft) return undefined
    let frame = 0
    let vorher = performance.now()
    let bebenUhr = vorher
    let speicher = 0
    /* Der Kraefte-Streifen ist React; er soll nur bei echter Aenderung neu
       rendern, nicht sechzigmal pro Sekunde. */
    let kraefteMerk = ''

    /* Einmal je Bild: wirksame Richtung bestimmen und fuer Tests an die
       Buehne schreiben — nur bei Aenderung, ohne React. */
    let gemeldet = { richtung: 0, quelle: 'touch' }
    const steuerungLesen = () => {
      const ein = eingabeRef.current
      const n = neigungRef.current
      const steuer = eingabeAus({
        finger: ein.finger.values(),
        links: ein.links,
        rechts: ein.rechts,
        neigung: n.richtung,
        neigungAktiv: n.aktiv,
      })
      /* Analoge Werte aendern sich fast jedes Bild. Fuer das Attribut
         genuegen zwei Nachkommastellen — sonst schreiben wir sechzigmal
         je Sekunde ins DOM, nur damit ein Test etwas ablesen kann. */
      const grob = Math.round(steuer.richtung * 100) / 100
      if (grob !== gemeldet.richtung || steuer.quelle !== gemeldet.quelle) {
        const el = buehneRef.current
        if (el) {
          el.setAttribute('data-richtung', String(grob))
          el.setAttribute('data-steuerung', steuer.quelle)
        }
        gemeldet = { richtung: grob, quelle: steuer.quelle }
      }
      return steuer.richtung
    }

    const plattenMalen = (ctx, p, palette, g, yBild, jetzt) => {
      const { s, x0 } = g
      const dicke = Math.max(6, PLATTE_DICKE * s)
      const py = yBild(p.y)
      if (p.art === 'boden') {
        const verlauf = ctx.createLinearGradient(0, py, 0, py + dicke * 3)
        verlauf.addColorStop(0, rgb(palette.stein))
        verlauf.addColorStop(1, rgb(palette.steinTief))
        ctx.fillStyle = verlauf
        ctx.fillRect(x0, py, s, masseRef.current.hoehe - py + 2)
        ctx.fillStyle = rgb(palette.hell, 0.9)
        ctx.fillRect(x0, py, s, 1.5)
        return
      }
      const px = x0 + (p.x - p.b / 2) * s
      const pw = p.b * s
      const r = Math.min(4, dicke / 2)

      if (p.art === 'glas') {
        if (p.weg) {
          /* Zerbrochen: zwei Haelften fallen auseinander und verblassen. */
          const alpha = Math.max(0, 0.6 + p.fallV * 0.35)
          if (alpha <= 0) return
          const spreiz = -p.fallV * s * 0.08
          ctx.fillStyle = rgb(palette.creme, alpha * 0.3)
          ctx.strokeStyle = rgb(palette.creme, alpha)
          ctx.lineWidth = 1
          for (const [dx, b] of [[-spreiz, pw * 0.48], [pw * 0.52 + spreiz, pw * 0.48]]) {
            rundesRechteck(ctx, px + dx, py, b, dicke, r)
            ctx.fill()
            ctx.stroke()
          }
          return
        }
        ctx.fillStyle = rgb(palette.creme, 0.16)
        rundesRechteck(ctx, px, py, pw, dicke, r)
        ctx.fill()
        ctx.strokeStyle = rgb(palette.creme, 0.7)
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(px + pw * 0.3, py + 1)
        ctx.lineTo(px + pw * 0.38, py + dicke * 0.6)
        ctx.lineTo(px + pw * 0.33, py + dicke - 1)
        ctx.moveTo(px + pw * 0.38, py + dicke * 0.6)
        ctx.lineTo(px + pw * 0.5, py + dicke * 0.7)
        ctx.strokeStyle = rgb(palette.creme, 0.45)
        ctx.stroke()
        return
      }

      if (p.art === 'gold') {
        /* Feder unter der Platte: das Zeichen fuer den hohen Sprung. */
        const mitte = px + pw / 2
        const unten = py + dicke + dicke * 1.1
        ctx.beginPath()
        ctx.moveTo(mitte - dicke * 0.5, py + dicke)
        for (let i = 1; i <= 4; i += 1) {
          ctx.lineTo(mitte + (i % 2 ? dicke * 0.5 : -dicke * 0.5), py + dicke + (dicke * 1.1 * i) / 4)
        }
        ctx.strokeStyle = rgb(palette.tief)
        ctx.lineWidth = Math.max(1.5, dicke * 0.18)
        ctx.stroke()
        ctx.fillStyle = rgb(palette.tief)
        ctx.fillRect(mitte - dicke * 0.7, unten - 1, dicke * 1.4, 2)
        const verlauf = ctx.createLinearGradient(0, py, 0, py + dicke)
        verlauf.addColorStop(0, rgb(palette.hell))
        verlauf.addColorStop(1, rgb(palette.tief))
        ctx.fillStyle = verlauf
        rundesRechteck(ctx, px, py, pw, dicke, r)
        ctx.fill()
        ctx.fillStyle = rgb(palette.creme, p.beruehrt ? 0.35 : 0.8)
        ctx.fillRect(px + r, py + 1, pw - 2 * r, 1.2)
        return
      }

      if (p.art === 'broeckel') {
        const ton = mischen(palette.stein, palette.tief, 0.45)
        if (p.weg) {
          /* Zerfallen: vier Brocken fallen auseinander und verblassen. */
          const alpha = Math.max(0, 0.75 + p.fallV * 0.35)
          if (alpha <= 0) return
          const spreiz = sanftRef.current ? 0 : -p.fallV * s * 0.05
          ctx.fillStyle = rgb(ton, alpha)
          for (let i = 0; i < 4; i += 1) {
            const f = i / 4
            ctx.fillRect(px + pw * f + (f - 0.375) * spreiz * 2, py + (i % 2) * spreiz * 0.6, pw / 4 - 2, dicke * 0.8)
          }
          return
        }
        const verlaufB = ctx.createLinearGradient(0, py, 0, py + dicke)
        verlaufB.addColorStop(0, rgb(mischen(ton, palette.creme, 0.1)))
        verlaufB.addColorStop(1, rgb(mischen(ton, palette.nacht, 0.4)))
        ctx.fillStyle = verlaufB
        rundesRechteck(ctx, px, py, pw, dicke, r)
        ctx.fill()
        /* Gestrichelte Kante: diese Platte haelt nicht ewig. */
        ctx.strokeStyle = rgb(palette.hell, 0.75)
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        ctx.moveTo(px + r, py + 0.75)
        ctx.lineTo(px + pw - r, py + 0.75)
        ctx.stroke()
        ctx.setLineDash([])
        /* Kleine Kerben am Anfang, nach der ersten Landung ein grosser Riss. */
        ctx.strokeStyle = rgb(palette.nacht, 0.9)
        ctx.lineWidth = 1.2
        ctx.beginPath()
        if (p.risse >= 1) {
          ctx.moveTo(px + pw * 0.48, py + 1)
          ctx.lineTo(px + pw * 0.53, py + dicke * 0.45)
          ctx.lineTo(px + pw * 0.46, py + dicke - 1)
          ctx.moveTo(px + pw * 0.53, py + dicke * 0.45)
          ctx.lineTo(px + pw * 0.64, py + dicke * 0.62)
        } else {
          ctx.moveTo(px + pw * 0.25, py + dicke - 1)
          ctx.lineTo(px + pw * 0.28, py + dicke * 0.6)
          ctx.moveTo(px + pw * 0.72, py + dicke - 1)
          ctx.lineTo(px + pw * 0.69, py + dicke * 0.55)
        }
        ctx.stroke()
        return
      }

      if (p.art === 'lift') {
        /* Die Fahrbahn als feine Linie hinter der Platte. */
        ctx.strokeStyle = rgb(palette.gold, 0.3)
        ctx.lineWidth = 1
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(px + pw / 2, yBild(p.yMax))
        ctx.lineTo(px + pw / 2, yBild(p.yMin) + dicke)
        ctx.stroke()
        ctx.setLineDash([])
      }

      const koerper =
        p.art === 'herd'
          /* Die Boostplatte ist die einzige rot leuchtende Flaeche im Spiel.
             Sie darf nicht wie eine Falle aussehen, sondern wie eine Rampe. */
          ? mischen(palette.nacht, palette.rot, 0.55)
          : p.art === 'bewegt'
            ? mischen(palette.nacht, palette.tief, 0.55)
            : p.art === 'lift'
              ? mischen(palette.stein, palette.gold, 0.25)
              : palette.stein
      const verlauf = ctx.createLinearGradient(0, py, 0, py + dicke)
      verlauf.addColorStop(0, rgb(mischen(koerper, palette.creme, 0.08)))
      verlauf.addColorStop(1, rgb(mischen(koerper, palette.nacht, 0.35)))
      ctx.fillStyle = verlauf
      rundesRechteck(ctx, px, py, pw, dicke, r)
      ctx.fill()
      ctx.fillStyle = rgb(p.art === 'herd' ? palette.rot : palette.hell, p.art === 'herd' ? 0.55 : 0.85)
      ctx.fillRect(px + r, py, pw - 2 * r, 1.5)

      if (p.art === 'bewegt') {
        /* Kleine Pfeile an beiden Enden: diese Platte faehrt. */
        ctx.strokeStyle = rgb(palette.hell, 0.8)
        ctx.lineWidth = 1.3
        const h = dicke * 0.28
        const ym = py + dicke / 2
        ctx.beginPath()
        ctx.moveTo(px + h * 2.2, ym - h)
        ctx.lineTo(px + h * 1.2, ym)
        ctx.lineTo(px + h * 2.2, ym + h)
        ctx.moveTo(px + pw - h * 2.2, ym - h)
        ctx.lineTo(px + pw - h * 1.2, ym)
        ctx.lineTo(px + pw - h * 2.2, ym + h)
        ctx.stroke()
      } else if (p.art === 'lift') {
        /* Pfeil hoch und Pfeil runter: diese Platte faehrt senkrecht. */
        ctx.strokeStyle = rgb(palette.hell, 0.85)
        ctx.lineWidth = 1.3
        const h = dicke * 0.26
        const ym = py + dicke / 2
        ctx.beginPath()
        for (const [f, dir] of [[0.3, -1], [0.7, 1]]) {
          const xm = px + pw * f
          ctx.moveTo(xm - h, ym - dir * h * 0.5)
          ctx.lineTo(xm, ym + dir * h * 0.5)
          ctx.lineTo(xm + h, ym - dir * h * 0.5)
        }
        ctx.stroke()
      } else if (p.art === 'herd') {
        /* BOOSTPLATTE. Glut darunter, drei Pfeile nach oben darauf: beides
           zusammen sagt "hier geht es hoch", ohne ein Wort Erklaerung. */
        const puls = sanftRef.current ? 0.8 : 0.65 + 0.35 * Math.sin(jetzt / 180 + p.id)
        const glut = p.heiss ? 1 : puls
        const hof = ctx.createLinearGradient(0, py - dicke * 1.6, 0, py + dicke)
        hof.addColorStop(0, rgb(palette.rot, 0))
        hof.addColorStop(1, rgb(palette.rot, 0.34 * glut))
        ctx.fillStyle = hof
        ctx.fillRect(px - 2, py - dicke * 1.6, pw + 4, dicke * 2.6)

        ctx.strokeStyle = rgb(mischen(palette.hell, palette.creme, 0.4), 0.55 + 0.45 * glut)
        ctx.lineWidth = 1.6
        ctx.lineCap = 'round'
        const ph = dicke * 0.3
        const ym = py + dicke * 0.62
        ctx.beginPath()
        for (const f of [0.28, 0.5, 0.72]) {
          const xm = px + pw * f
          ctx.moveTo(xm - ph, ym)
          ctx.lineTo(xm, ym - ph)
          ctx.lineTo(xm + ph, ym)
        }
        ctx.stroke()
        ctx.lineCap = 'butt'
      }
    }

    /**
     * Ein fliegendes Bauteil. Vierzehn Sorten quer durch die VIDEKO-Gewerke —
     * Kueche, Bad, Boden, Wand, Decke, Elektro, PV, Licht, Immobilie. Alle aus
     * demselben Bauplan: Korpus in Stein, ein Merkmal in Gold oder Rot. Das
     * reicht, um sie im Flug auseinanderzuhalten, und kostet pro Bild nur ein
     * paar Rechtecke. Keine Fremdmarken, nur Formen.
     */
    const gegnerMalen = (ctx, palette, cx, cy, s, g, jetzt) => {
      const b = g.b * s
      const h = GEGNER_H * s
      /* Getroffenes bleibt einen Wimpernschlag liegen und verblasst. */
      const alpha = g.weg ? Math.max(0, (g.wegBis - standRef.current.zeit) / 0.5) : 1
      if (alpha <= 0) return
      const dreh = sanftRef.current ? 0 : g.dreh
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(cx, cy)
      /* Nur was rund ist, rollt wirklich; der Rest schaukelt bloss. */
      if (GEGNER_DREH[g.art]) ctx.rotate(dreh)
      else ctx.rotate(Math.sin(jetzt / 260 + g.id) * 0.06)
      const korpus = mischen(palette.nacht, palette.creme, 0.24)
      ctx.fillStyle = rgb(korpus)
      ctx.strokeStyle = rgb(palette.nacht, 0.85)
      ctx.lineWidth = 1

      if (g.art === 'backofen' || g.art === 'schranktuer') {
        /* Klappmuster: die Tuer geht auf und zu, und genau so weit reicht
           auch die Trefferflaeche. Was man sieht, trifft — nichts anderes. */
        const auf = Math.max(0, Math.min(1, g.auf || 0))
        const kern = b * 0.34
        const ofen = g.art === 'backofen'
        rundesRechteck(ctx, -kern / 2, -h / 2, kern, h, 3)
        ctx.fill()
        ctx.stroke()
        ctx.save()
        ctx.translate(kern / 2, -h / 2)
        ctx.rotate(auf * 1.35)
        ctx.fillStyle = rgb(ofen ? palette.rot : palette.gold, 0.75)
        rundesRechteck(ctx, 0, 0, b * 0.66, h * 0.9, 2)
        ctx.fill()
        ctx.stroke()
        ctx.restore()
        if (ofen) {
          /* Glut hinter der Scheibe, nur wenn die Tuer offen steht. */
          ctx.fillStyle = rgb(palette.rot, 0.35 + 0.5 * auf)
          ctx.fillRect(-kern * 0.32, -h * 0.2, kern * 0.64, h * 0.4)
        } else {
          ctx.fillStyle = rgb(palette.hell, 0.85)
          ctx.fillRect(-kern * 0.1, -h * 0.1, kern * 0.5, 1.8)
        }
      } else if (g.art === 'kuehlschrank') {
        rundesRechteck(ctx, -b / 2, -h / 2, b, h, 3)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = rgb(palette.creme, 0.5)
        ctx.fillRect(-b / 2 + 2, -h * 0.06, b - 4, 1.4)
        ctx.fillStyle = rgb(palette.hell, 0.85)
        ctx.fillRect(b * 0.28, -h * 0.34, 2, h * 0.26)
      } else if (g.art === 'pfanne') {
        ctx.beginPath()
        ctx.ellipse(0, 0, h * 0.52, h * 0.34, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = rgb(palette.hell, 0.85)
        ctx.fillRect(h * 0.45, -1.2, b * 0.45, 2.4)
      } else if (g.art === 'karton') {
        ctx.fillStyle = rgb(mischen(palette.tief, palette.creme, 0.35))
        ctx.fillRect(-b / 2, -h / 2, b, h)
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.nacht, 0.5)
        ctx.beginPath()
        ctx.moveTo(0, -h / 2)
        ctx.lineTo(0, h / 2)
        ctx.stroke()
      } else if (g.art === 'werkzeugkiste') {
        /* Kiste mit Buegelgriff. */
        rundesRechteck(ctx, -b / 2, -h * 0.12, b, h * 0.62, 2)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.hell, 0.9)
        ctx.lineWidth = 1.8
        ctx.beginPath()
        ctx.moveTo(-b * 0.22, -h * 0.12)
        ctx.quadraticCurveTo(0, -h * 0.62, b * 0.22, -h * 0.12)
        ctx.stroke()
        ctx.fillStyle = rgb(palette.rot, 0.55)
        ctx.fillRect(-b / 2 + 2, h * 0.1, b - 4, 2)
      } else if (g.art === 'farbrolle') {
        /* Walze mit Stiel. */
        rundesRechteck(ctx, -b * 0.42, -h * 0.3, b * 0.84, h * 0.6, h * 0.2)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.hell, 0.9)
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(0, h * 0.3)
        ctx.lineTo(0, h * 0.78)
        ctx.stroke()
        ctx.fillStyle = rgb(palette.creme, 0.35)
        ctx.fillRect(-b * 0.42, -h * 0.06, b * 0.84, 1.6)
      } else if (g.art === 'kabeltrommel') {
        /* Rolle mit Speichen und einem herausstehenden Kabelende. */
        const rr = h * 0.5
        ctx.beginPath()
        ctx.arc(0, 0, rr, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.hell, 0.75)
        ctx.lineWidth = 1.2
        ctx.beginPath()
        for (let i = 0; i < 3; i += 1) {
          const a = (i * Math.PI) / 3
          ctx.moveTo(-Math.cos(a) * rr * 0.8, -Math.sin(a) * rr * 0.8)
          ctx.lineTo(Math.cos(a) * rr * 0.8, Math.sin(a) * rr * 0.8)
        }
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.rot, 0.8)
        ctx.beginPath()
        ctx.moveTo(rr * 0.7, 0)
        ctx.quadraticCurveTo(b * 0.5, -h * 0.2, b * 0.52, h * 0.1)
        ctx.stroke()
      } else if (g.art === 'pvmodul') {
        /* Flache Platte mit Zellenraster — das breiteste Teil im Spiel. */
        rundesRechteck(ctx, -b / 2, -h * 0.28, b, h * 0.56, 2)
        ctx.fillStyle = rgb(mischen(palette.nacht, palette.tief, 0.5))
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.hell, 0.45)
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const f of [0.25, 0.5, 0.75]) {
          const xm = -b / 2 + b * f
          ctx.moveTo(xm, -h * 0.28)
          ctx.lineTo(xm, h * 0.28)
        }
        ctx.moveTo(-b / 2, 0)
        ctx.lineTo(b / 2, 0)
        ctx.stroke()
      } else if (g.art === 'bodenpaket') {
        /* Gestapelte Dielen. */
        ctx.fillStyle = rgb(mischen(palette.stein, palette.gold, 0.2))
        rundesRechteck(ctx, -b / 2, -h * 0.34, b, h * 0.68, 2)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.nacht, 0.55)
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const f of [-0.1, 0.12]) {
          ctx.moveTo(-b / 2, h * f)
          ctx.lineTo(b / 2, h * f)
        }
        ctx.stroke()
      } else if (g.art === 'waschbecken') {
        /* Wanne mit Hahn. */
        rundesRechteck(ctx, -b / 2, -h * 0.3, b, h * 0.8, 3)
        ctx.fill()
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.hell, 0.9)
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(-b * 0.22, -h * 0.3)
        ctx.quadraticCurveTo(-b * 0.22, -h * 0.75, b * 0.08, -h * 0.7)
        ctx.stroke()
      } else if (g.art === 'leuchte') {
        /* Pendelleuchte: Schirm mit Lichtkegel. */
        ctx.beginPath()
        ctx.moveTo(-b * 0.4, h * 0.2)
        ctx.lineTo(b * 0.4, h * 0.2)
        ctx.lineTo(b * 0.14, -h * 0.34)
        ctx.lineTo(-b * 0.14, -h * 0.34)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        const kegel = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.9)
        kegel.addColorStop(0, rgb(palette.hell, 0.5))
        kegel.addColorStop(1, rgb(palette.hell, 0))
        ctx.fillStyle = kegel
        ctx.beginPath()
        ctx.moveTo(-b * 0.4, h * 0.2)
        ctx.lineTo(b * 0.4, h * 0.2)
        ctx.lineTo(b * 0.62, h * 0.9)
        ctx.lineTo(-b * 0.62, h * 0.9)
        ctx.closePath()
        ctx.fill()
      } else if (g.art === 'maklerschild') {
        /* Schild am Pfosten. Text waere unleserlich, also nur zwei Balken. */
        ctx.strokeStyle = rgb(palette.nacht, 0.85)
        ctx.fillRect(-1, -h * 0.1, 2, h * 0.7)
        rundesRechteck(ctx, -b / 2, -h * 0.5, b, h * 0.44, 2)
        ctx.fillStyle = rgb(palette.creme, 0.85)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = rgb(palette.nacht, 0.6)
        ctx.fillRect(-b * 0.36, -h * 0.4, b * 0.72, 2)
        ctx.fillRect(-b * 0.36, -h * 0.28, b * 0.46, 2)
      } else {
        /* Spanndecken-Ring: ein offener Reif, der sich dreht. */
        const rr = h * 0.5
        ctx.strokeStyle = rgb(mischen(palette.stein, palette.creme, 0.3))
        ctx.lineWidth = Math.max(2, h * 0.16)
        ctx.beginPath()
        ctx.arc(0, 0, rr, 0.35, Math.PI * 2 - 0.35)
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.hell, 0.6)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(0, 0, rr * 0.62, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
      ctx.globalAlpha = 1
    }

    /** Eine Kraft, frei in der Luft: Muetze, Schuerze, Turbo, Magnet, Superkoch. */
    const gabeMalen = (ctx, palette, cx, cy, s, gb, jetzt) => {
      const alpha = gb.weg ? Math.max(0, (gb.wegBis - standRef.current.zeit) / 0.5) : 1
      if (alpha <= 0) return
      const r = GABE_R * s
      const schweben = sanftRef.current ? 0 : Math.sin(jetzt / 300 + gb.id) * r * 0.22
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(cx, cy + schweben)
      const farbe = gb.art === 'schuerze' ? palette.gruen : gb.art === 'magnet' ? palette.rot : palette.hell
      /* Heller Hof, damit man sie von weitem sieht. */
      const hof = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.1)
      hof.addColorStop(0, rgb(farbe, 0.4))
      hof.addColorStop(1, rgb(farbe, 0))
      ctx.fillStyle = hof
      ctx.beginPath()
      ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2)
      ctx.fill()
      if (gb.art === 'superkoch') {
        /* Der seltenste Fund bekommt einen zweiten, pulsenden Ring. */
        const puls = sanftRef.current ? 0.7 : 0.55 + 0.45 * Math.sin(jetzt / 140 + gb.id)
        ctx.strokeStyle = rgb(palette.hell, 0.35 + 0.45 * puls)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, r * (1.5 + 0.25 * puls), 0, Math.PI * 2)
        ctx.stroke()
      }

      if (gb.art === 'superkoch') {
        /* Das Markenzeichen selbst — die staerkste Kraft traegt das VD. */
        const logo = logoRef.current
        if (logo) {
          ctx.drawImage(logo, -r * 0.95, -r * 0.95, r * 1.9, r * 1.9)
        } else {
          muetzeMalen(ctx, r * 1.9, rgb(palette.hell), rgb(palette.tief))
        }
      } else if (gb.art === 'magnet') {
        /* Hufeisen: offener Bogen, zwei Schenkel, rote Pole. */
        ctx.strokeStyle = rgb(palette.rot)
        ctx.lineWidth = Math.max(2.4, r * 0.34)
        ctx.lineCap = 'butt'
        ctx.beginPath()
        ctx.arc(0, r * 0.1, r * 0.62, Math.PI, 0)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-r * 0.62, r * 0.1)
        ctx.lineTo(-r * 0.62, r * 0.7)
        ctx.moveTo(r * 0.62, r * 0.1)
        ctx.lineTo(r * 0.62, r * 0.7)
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.creme, 0.9)
        ctx.beginPath()
        ctx.moveTo(-r * 0.62, r * 0.7)
        ctx.lineTo(-r * 0.62, r * 0.95)
        ctx.moveTo(r * 0.62, r * 0.7)
        ctx.lineTo(r * 0.62, r * 0.95)
        ctx.stroke()
      } else if (gb.art === 'muetze') {
        muetzeMalen(ctx, r * 1.9, rgb(palette.hell), rgb(palette.tief))
      } else if (gb.art === 'schuerze') {
        ctx.fillStyle = rgb(palette.gruen)
        ctx.beginPath()
        ctx.moveTo(-r * 0.55, -r * 0.7)
        ctx.lineTo(r * 0.55, -r * 0.7)
        ctx.lineTo(r * 0.7, r * 0.8)
        ctx.lineTo(-r * 0.7, r * 0.8)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = rgb(palette.nacht, 0.7)
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.strokeStyle = rgb(palette.creme, 0.8)
        ctx.beginPath()
        ctx.moveTo(-r * 0.55, -r * 0.7)
        ctx.lineTo(-r * 0.95, -r * 0.95)
        ctx.moveTo(r * 0.55, -r * 0.7)
        ctx.lineTo(r * 0.95, -r * 0.95)
        ctx.stroke()
      } else {
        /* Turbo: Flammenpfeil nach oben. */
        ctx.fillStyle = rgb(palette.hell)
        ctx.beginPath()
        ctx.moveTo(0, -r)
        ctx.lineTo(r * 0.75, r * 0.15)
        ctx.lineTo(r * 0.28, r * 0.15)
        ctx.lineTo(r * 0.28, r)
        ctx.lineTo(-r * 0.28, r)
        ctx.lineTo(-r * 0.28, r * 0.15)
        ctx.lineTo(-r * 0.75, r * 0.15)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = rgb(palette.nacht, 0.7)
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.restore()
      ctx.globalAlpha = 1
    }

    /**
     * Die Kochmuetze. Eigenes Spielelement, nie Teil des Logos: sie wird
     * separat gezeichnet, damit sie federn und wackeln darf, waehrend das
     * Markenzeichen darunter unangetastet bleibt. Gezeichnet um (0,0) mit
     * `br` als Gesamtbreite, Unterkante auf y = 0.
     */
    function muetzeMalen(ctx, br, fuellung, kante) {
      const hb = br / 2
      const bandH = br * 0.26
      ctx.fillStyle = fuellung
      ctx.strokeStyle = kante
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(-hb * 0.62, -bandH - hb * 0.42, hb * 0.48, 0, Math.PI * 2)
      ctx.arc(hb * 0.62, -bandH - hb * 0.42, hb * 0.48, 0, Math.PI * 2)
      ctx.arc(0, -bandH - hb * 0.66, hb * 0.55, 0, Math.PI * 2)
      ctx.fill()
      rundesRechteck(ctx, -hb, -bandH, br, bandH, bandH * 0.35)
      ctx.fill()
      ctx.stroke()
    }

    const figurMalen = (ctx, palette, cx, fuss, s, jetzt) => {
      const w = FIGUR_B * s
      const h = FIGUR_H * s
      const stand = standRef.current
      const bild = bildRef.current
      const sanftAn = sanftRef.current
      const seit = jetzt - bild.gelandet
      /* Das Federn: 1 = ruhig, kleiner = gestaucht. Es wirkt NUR auf Muetze
         und Schatten — das Logo selbst wird nie verzogen. */
      const stauch = !sanftAn && seit < STAUCHEN_MS ? 1 - 0.18 * (1 - seit / STAUCHEN_MS) : 1
      const neigung = sanftAn ? 0 : (stand.spieler.vx / VX_MAX) * 0.16
      const muetzeAn = stand.muetzeBis > stand.zeit
      const turboAn = stand.turboBis > stand.zeit
      const magnetAn = stand.magnetBis > stand.zeit
      const superAn = stand.superBis > stand.zeit
      const blinkt = stand.unverwundbarBis > stand.zeit
      /* Getroffen: die Figur flackert, solange sie unverwundbar ist. */
      const sicht = blinkt && !sanftAn ? (Math.sin(jetzt / 45) > 0 ? 0.35 : 1) : 1

      ctx.save()
      ctx.translate(cx, fuss)

      /* Schatten: federt mit, liegt aber flach auf der Platte. */
      ctx.globalAlpha = 0.3 * sicht
      ctx.fillStyle = rgb(palette.nacht)
      ctx.beginPath()
      ctx.ellipse(0, 0, (w * 0.46) / stauch, w * 0.12 * stauch, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      if (magnetAn) {
        /* Der Wirkradius wird gezeigt, nicht behauptet: alles Gold innerhalb
           dieses Kreises kommt von selbst. Ohne Drehung, damit er ruhig liegt. */
        const rr = MAGNET_R * s
        const puls = sanftAn ? 0.5 : 0.35 + 0.25 * Math.sin(jetzt / 220)
        ctx.strokeStyle = rgb(palette.rot, 0.28 + 0.2 * puls)
        ctx.lineWidth = 1.4
        ctx.setLineDash([6, 7])
        ctx.beginPath()
        ctx.arc(0, -h * 0.4, rr, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.rotate(neigung)

      if (turboAn) {
        /* Turbo: eine Flamme unter den Fuessen. */
        const lang = h * (0.7 + 0.3 * Math.sin(jetzt / 40))
        const flamme = ctx.createLinearGradient(0, 0, 0, lang)
        flamme.addColorStop(0, rgb(palette.hell, 0.85))
        flamme.addColorStop(1, rgb(palette.rot, 0))
        ctx.fillStyle = flamme
        ctx.beginPath()
        ctx.moveTo(-w * 0.26, 0)
        ctx.lineTo(w * 0.26, 0)
        ctx.lineTo(0, lang)
        ctx.closePath()
        ctx.fill()
      }

      const koerper = h * 0.8
      if (muetzeAn) {
        /* Goldene Kochmuetze aktiv: ein warmer Hof um die ganze Figur. */
        const hof = ctx.createRadialGradient(0, -koerper * 0.5, 0, 0, -koerper * 0.5, koerper)
        hof.addColorStop(0, rgb(palette.hell, 0.45))
        hof.addColorStop(1, rgb(palette.hell, 0))
        ctx.fillStyle = hof
        ctx.beginPath()
        ctx.arc(0, -koerper * 0.5, koerper, 0, Math.PI * 2)
        ctx.fill()
      }
      if (superAn) {
        /* SUPERKOCH: der einzige Zustand, in dem die Figur selbst brennt.
           Zwei gegenlaeufige Ringe, damit er sich vom Muetzenhof abhebt. */
        const dreh = sanftAn ? 0 : jetzt / 420
        const hof = ctx.createRadialGradient(0, -koerper * 0.5, 0, 0, -koerper * 0.5, koerper * 1.35)
        hof.addColorStop(0, rgb(palette.hell, 0.55))
        hof.addColorStop(0.6, rgb(palette.gold, 0.25))
        hof.addColorStop(1, rgb(palette.hell, 0))
        ctx.fillStyle = hof
        ctx.beginPath()
        ctx.arc(0, -koerper * 0.5, koerper * 1.35, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = rgb(palette.creme, 0.7)
        ctx.lineWidth = 1.6
        for (const [rf, vz] of [[0.9, 1], [1.12, -1]]) {
          ctx.save()
          ctx.translate(0, -koerper * 0.5)
          ctx.rotate(dreh * vz)
          ctx.beginPath()
          ctx.arc(0, 0, koerper * rf, 0.4, Math.PI * 2 - 0.4)
          ctx.stroke()
          ctx.restore()
        }
      }
      if (stand.schutz) {
        /* Schutzschuerze: ein gruener Ring, der einen Treffer schluckt. */
        ctx.strokeStyle = rgb(palette.gruen, 0.75)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, -koerper * 0.5, koerper * 0.72, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.globalAlpha = sicht
      /* DAS LOGO. Quadratisch aus der Datei, quadratisch aufs Feld:
         gleichmaessig skaliert, sonst nichts. */
      const logo = logoRef.current
      if (logoDa(logo)) {
        ctx.drawImage(logo, -koerper / 2, -koerper, koerper, koerper)
      } else {
        /* Solange die Datei laedt: eine neutrale goldene Scheibe. Bewusst
           kein selbstgemaltes V — falsche Marke ist schlimmer als keine. */
        ctx.fillStyle = rgb(palette.gold, 0.8)
        ctx.beginPath()
        ctx.arc(0, -koerper * 0.5, koerper * 0.38, 0, Math.PI * 2)
        ctx.fill()
      }

      /* Die Muetze obenauf: sie federt und wackelt beim Landen nach. */
      const wackel = !sanftAn && seit < STAUCHEN_MS * 3
        ? Math.sin((seit / STAUCHEN_MS) * 4) * 0.22 * (1 - seit / (STAUCHEN_MS * 3))
        : 0
      /* Nach einer Boostplatte hebt es ihr kurz die Muetze vom Kopf —
         eine halbe Sekunde hoch und zurueck, mit einer Drehung. */
      const flugSeit = jetzt - bild.boost
      const flug = !sanftAn && bild.boost && flugSeit < BOOST_FLUG_MS ? 1 - flugSeit / BOOST_FLUG_MS : 0
      const bogen = flug ? Math.sin((1 - flug) * Math.PI) : 0
      ctx.save()
      ctx.translate(0, -koerper * 0.94 - bogen * koerper * 0.85)
      ctx.rotate(wackel + bogen * 0.9)
      ctx.scale(1 / stauch, stauch)
      muetzeMalen(
        ctx,
        w * 0.72,
        rgb(muetzeAn ? palette.hell : palette.creme),
        rgb(palette.nacht, 0.7),
      )
      ctx.restore()

      ctx.globalAlpha = 1
      ctx.restore()
    }

    const malen = (jetzt) => {
      const c = canvasRef.current
      const palette = paletteRef.current
      const stand = standRef.current
      if (!c || !palette || !stand) return
      const { breite, hoehe, dpr } = masseRef.current
      const g = geometrie(breite, hoehe)
      const { s, x0 } = g
      const kamera = stand.kamera
      const yBild = (y) => hoehe - (y - kamera) * s
      const ctx = c.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, breite, hoehe)
      /* Screenshake (§7): verschiebt das ganze Bild, nie einzelne Teile. */
      const stoss = fxRef.current.beben.versatz(jetzt - bebenUhr)
      bebenUhr = jetzt
      if (stoss.kraft) ctx.translate(stoss.x, stoss.y)

      /* Marmor laeuft langsamer mit als die Platten: Tiefe ohne Aufwand. */
      const marmor = marmorRef.current
      if (marmor) {
        const versatz = sanftRef.current ? 0 : (((kamera * s * 0.3) % hoehe) + hoehe) % hoehe
        ctx.drawImage(marmor, 0, versatz, breite, hoehe)
        ctx.drawImage(marmor, 0, versatz - hoehe, breite, hoehe)
      }

      ctx.save()
      ctx.beginPath()
      ctx.rect(x0, 0, s, hoehe)
      ctx.clip()

      /* Hoehenmarken rechts: alle 10 HOEHE ein Strich, alle 100 eine Linie. */
      const unten = Math.floor(kamera)
      const oben = Math.ceil(kamera + hoehe / s)
      ctx.font = `600 ${Math.max(9, Math.round(s * 0.028))}px system-ui, sans-serif`
      ctx.textAlign = 'right'
      for (let k = Math.max(1, unten); k <= oben; k += 1) {
        const y = Math.round(yBild(k)) + 0.5
        const wert = k * HOEHE_JE_EINHEIT
        if (wert % MEILENSTEIN === 0) {
          ctx.strokeStyle = rgb(palette.gold, 0.35)
          ctx.setLineDash([4, 5])
          ctx.beginPath()
          ctx.moveTo(x0, y)
          ctx.lineTo(x0 + s, y)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = rgb(palette.hell, 0.7)
          ctx.fillText(`${wert} M`, x0 + s - 6, y - 4)
        } else {
          ctx.strokeStyle = rgb(palette.gold, 0.22)
          ctx.beginPath()
          ctx.moveTo(x0 + s - 10, y)
          ctx.lineTo(x0 + s, y)
          ctx.stroke()
        }
      }

      const obenWelt = kamera + hoehe / s + 0.1
      for (const p of stand.platten) {
        if (p.y > obenWelt || p.y < kamera - 0.2) continue
        plattenMalen(ctx, p, palette, g, yBild, jetzt)
      }

      /* Kraefte liegen hinter der Figur, die Kuechenteile davor. */
      for (const gb of stand.gaben) {
        if (gb.y > obenWelt || gb.y < kamera - 0.2) continue
        gabeMalen(ctx, palette, x0 + gb.x * s, yBild(gb.y), s, gb, jetzt)
      }

      /* Die Figur, am Rand zweimal, damit der Uebergang nahtlos ist. */
      const sp = stand.spieler
      const fuss = yBild(sp.y)
      const halb = FIGUR_B * 0.8
      figurMalen(ctx, palette, x0 + sp.x * s, fuss, s, jetzt)
      if (sp.x < halb) figurMalen(ctx, palette, x0 + (sp.x + 1) * s, fuss, s, jetzt)
      if (sp.x > 1 - halb) figurMalen(ctx, palette, x0 + (sp.x - 1) * s, fuss, s, jetzt)

      for (const gg of stand.gegner) {
        if (gg.y > obenWelt || gg.y < kamera - 0.3) continue
        const gy = yBild(gg.y)
        const ghalb = gg.b * 0.6
        gegnerMalen(ctx, palette, x0 + gg.x * s, gy, s, gg, jetzt)
        if (gg.x < ghalb) gegnerMalen(ctx, palette, x0 + (gg.x + 1) * s, gy, s, gg, jetzt)
        if (gg.x > 1 - ghalb) gegnerMalen(ctx, palette, x0 + (gg.x - 1) * s, gy, s, gg, jetzt)
      }

      /* Funken und schwebende Zahlen ganz oben, aber noch im Spielfeld. */
      fxRef.current.funken.malen(ctx)
      fxRef.current.rufe.malen(ctx, rufFarben(palette))
      ctx.restore()

      /* Ist die Buehne zu flach, bleiben links und rechts dunkle Raender. */
      if (x0 > 0) {
        ctx.fillStyle = rgb(palette.nacht, 0.72)
        ctx.fillRect(0, 0, x0, hoehe)
        ctx.fillRect(x0 + s, 0, breite - x0 - s, hoehe)
        ctx.fillStyle = rgb(palette.gold, 0.45)
        ctx.fillRect(x0 - 1, 0, 1, hoehe)
        ctx.fillRect(x0 + s, 0, 1, hoehe)
      }

      if (crashRef.current) {
        const p = Math.min(1, (jetzt - bildRef.current.crashSeit) / CRASH_MS)
        const tief = ctx.createLinearGradient(0, hoehe * 0.4, 0, hoehe)
        tief.addColorStop(0, rgb(palette.rot, 0))
        tief.addColorStop(1, rgb(palette.rot, (sanftRef.current ? 0.22 : 0.35) * p))
        ctx.fillStyle = tief
        ctx.fillRect(0, 0, breite, hoehe)
      }
    }

    const schleife = (jetzt) => {
      const stand = standRef.current
      const helfer = helferRef.current
      const richtung = steuerungLesen()
      const dt = Math.min(250, Math.max(0, jetzt - vorher)) / 1000
      vorher = jetzt
      if (stand && helfer) {
        if (crashRef.current) {
          /* Nach dem Absturz faellt nur noch die Figur, der Rest steht. */
          stand.spieler.vy -= SCHWERE * dt
          stand.spieler.y += stand.spieler.vy * dt
          speicher = 0
        } else if (pauseRef.current) {
          speicher = 0
        } else {
          speicher += dt
          let n = 0
          while (speicher >= TAKT && n < SCHRITTE_MAX) {
            speicher -= TAKT
            n += 1
            const ereignisse = schritt(stand, richtung)
            if (ereignisse.length) helfer.verarbeiten(ereignisse)
            if (stand.vorbei || crashRef.current) break
          }
          if (n >= SCHRITTE_MAX) speicher = 0
        }
        helfer.buchen()

        /* Was gerade wirkt, oben anzeigen — als Text, nicht als Zahlenkolonne. */
        const rest = (bis) => Math.max(0, Math.ceil(bis - stand.zeit))
        const jetztKraefte = {
          combo: stand.combo,
          muetze: rest(stand.muetzeBis),
          schutz: !!stand.schutz,
          turbo: stand.turboBis > stand.zeit ? 1 : 0,
          magnet: rest(stand.magnetBis),
          superkoch: rest(stand.superBis),
        }
        const schluessel = [
          jetztKraefte.combo, jetztKraefte.muetze, jetztKraefte.schutz,
          jetztKraefte.turbo, jetztKraefte.magnet, jetztKraefte.superkoch,
        ].join('|')
        if (schluessel !== kraefteMerk) {
          kraefteMerk = schluessel
          setKraefte(jetztKraefte)
        }
      }
      /* Effekte laufen auch in der Pause und nach dem Absturz aus. */
      const dtMs = Math.min(250, Math.max(0, dt * 1000))
      fxRef.current.funken.schritt(dtMs)
      fxRef.current.rufe.schritt(dtMs)
      malen(jetzt)
      frame = requestAnimationFrame(schleife)
    }

    frame = requestAnimationFrame(schleife)
    return () => cancelAnimationFrame(frame)
  }, [laeuft])

  return (
    <SpielKarte
      spiel={{ ...SPIEL, leisteLabel: 'HÖHE', leisteWert: hoehe, hebel: { wort: 'GOLDPLATTE', punkte: HEBEL_PUNKTE } }}
      lauf={{ ...lauf, starten }}
      best={best}
    >
      {laeuft && (
        <>
          <div
            className="trm-jump-buehne"
            ref={buehneRef}
            role="application"
            tabIndex={0}
            aria-label="VIDEKO Jump Spielfeld. Daumen auflegen und liegen lassen: die Figur zieht dorthin, wo der Daumen liegt, weiter außen stärker. Pfeiltasten halten geht auch. Wahlweise per Neigung."
            data-sanft={sanft ? '1' : '0'}
            data-crash={crash ? '1' : '0'}
            data-pause={pause ? '1' : '0'}
            data-gelenkt={gelenkt ? '1' : '0'}
            data-richtung="0"
            data-steuerung="touch"
            onPointerDown={zeigerRunter}
            onPointerMove={zeigerZieht}
            onPointerUp={zeigerWeg}
            onPointerCancel={zeigerWeg}
            onLostPointerCapture={zeigerWeg}
            onKeyDown={tasteRunter}
            onKeyUp={tasteHoch}
            onBlur={fokusWeg}
            onContextMenu={(e) => e.preventDefault()}
          >
            <canvas className="trm-jump-canvas" ref={canvasRef} aria-hidden="true" />
            {/* Was gerade wirkt. Nur was wirklich an ist — sonst leer. */}
            <span className="trm-jump-kraefte" aria-hidden="true">
              {kraefte.combo >= COMBO_AB[0] && (
                <span className="trm-jump-kraft" data-art="combo">×{kraefte.combo}</span>
              )}
              {kraefte.muetze > 0 && (
                <span className="trm-jump-kraft" data-art="muetze">MÜTZE {kraefte.muetze}</span>
              )}
              {kraefte.schutz && <span className="trm-jump-kraft" data-art="schutz">SCHÜRZE</span>}
              {kraefte.turbo > 0 && <span className="trm-jump-kraft" data-art="turbo">TURBO</span>}
              {kraefte.magnet > 0 && (
                <span className="trm-jump-kraft" data-art="magnet">MAGNET {kraefte.magnet}</span>
              )}
              {kraefte.superkoch > 0 && (
                <span className="trm-jump-kraft" data-art="superkoch">SUPERKOCH {kraefte.superkoch}</span>
              )}
            </span>
            <span className="trm-jump-hinweis" aria-hidden="true">
              <span>‹ DAUMEN</span>
              <span>DAUMEN ›</span>
            </span>
            {/* Der Tonschalter sitzt in der gemeinsamen Game-Shell
                (SpielKarte), nicht mehr hier. */}
            {/* Eigene Taste in der Buehne: ihr Tipp lenkt nicht und beendet
                keine Pause. Pfeiltasten laufen weiter zur Buehne durch. */}
            <button
              type="button"
              className="trm-jump-neigung"
              data-status={neigung}
              aria-pressed={neigung === 'aktiv'}
              aria-label={NEIGUNG_HILFE[neigung] || NEIGUNG_HILFE.aus}
              title={NEIGUNG_HILFE[neigung] || NEIGUNG_HILFE.aus}
              aria-live="polite"
              disabled={crash}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') e.stopPropagation()
              }}
              onClick={neigungUmschalten}
            >
              {NEIGUNG_TEXT[neigung] || NEIGUNG_TEXT.aus}
            </button>
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
