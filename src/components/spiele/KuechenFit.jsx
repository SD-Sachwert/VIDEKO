import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { istPausiert } from './spiel-pause.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  BREITE,
  FORMEN,
  GEDULD_MAX_MS,
  HOEHE,
  LOCK_RESETS,
  SPERRE_MS,
  TEILE,
  drehen,
  fallPunkte,
  fallTiefe,
  festsetzen,
  gefuehlPlatzierung,
  gefuehlStart,
  gefuehlTakt,
  geist,
  neuesSpiel,
  schwierigkeit,
  verschieben,
  zellenVon,
  zoneAnteil,
  zoneSpalten,
} from './fit-logik.js'
import {
  HAPTIK,
  comboStufe,
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
 * DAS SPIELGEFUEHL
 * ----------------
 * Jede Platzierung bekommt eine Note (PERFECT FIT / GOOD / KNAPP DANEBEN),
 * gerechnet in fit-logik.js, gemalt hier. Dazu die Einbau-Zone (der goldene
 * Streifen, in den das Teil soll), Combo, Fieber und der Geduldsbalken unter
 * dem Feld. Der Balken ist der spielinterne Druck: er sinkt stetig und wird
 * von guten Zuegen aufgefuellt. Laeuft er leer, ist die Runde vorbei — die
 * globale Rundenuhr aus useSpielLauf bleibt davon unberuehrt, Kuechen-Fit ist
 * und bleibt ein Endlosspiel.
 *
 * Funken, Rufe, Ruetteln, Klang und Vibration kommen alle aus
 * spielgefuehl.js, damit sich ein Treffer hier genauso anfuehlt wie in den
 * anderen Spielen — und damit reduzierte Bewegung an einer Stelle greift.
 *
 * WIE ES FLUESSIG BLEIBT
 * ----------------------
 * Ein Canvas zeichnet das Feld. Die liegenden Schraenke stehen in einem
 * zweiten, unsichtbaren Canvas und werden nur neu gemalt, wenn sich das Feld
 * aendert. Die Schleife malt nur, wenn etwas passiert ist: solange nichts
 * lebt (keine Funken, kein Fieber, stehende Zone, unveraenderter Balken)
 * bleibt das Bild stehen. React rendert bei Einrasten, Meldung und Pause —
 * nie pro Frame.
 */

const SPIEL = SPIEL_NACH_KEY.kuechen_fit

const RAEUMEN_MS = 220
const RAEUMEN_SANFT_MS = 140
const CRASH_MS = 560
const TIPP_PX = 10
const TIPP_MS = 500
const WISCH_MS = 260
const WISCH_ZELLEN = 2.2
/* Typischer Wert eines PERFECT FIT am Anfang: 500 Bonus, die Reihe mit 100
   und 120 fuer die saubere Platzierung. */
const HEBEL_PUNKTE = 720
/* Funkenvorrat. Klein genug fuers Handy, gross genug fuer vier Reihen. */
const FUNKEN_VORRAT = 120
const RUF_VORRAT = 10
/* Wie lange ein Ruf hoechstens lebt — danach darf das Bild wieder stehen. */
const RUF_MS = 1000

/* Die drei Noten in Worten, Farbe und Wucht. */
const NOTEN = {
  perfekt: { wort: 'PERFECT FIT', ton: 'perfekt', funken: 16, stoss: 7 },
  gut: { wort: 'GOOD', ton: 'pop', funken: 6, stoss: 3 },
  daneben: { wort: 'KNAPP DANEBEN', ton: 'fehler', funken: 0, stoss: 0 },
}

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
    /* code -> [Front, Kante, Oberflaechenzeichen]
       Die Teile kommen aus dem ganzen Haus (siehe TEILE in fit-logik.js),
       darum traegt nicht mehr jede Zelle einen Schrankgriff: die Steigleitung
       bekommt ein Rohr, das Dielenpaket eine Fuge, der PV-Winkel ein Raster.
       Die Farben sind gemessen und bleiben unveraendert — nur das Zeichen
       obendrauf sagt jetzt, welches Gewerk da liegt. */
    fronten: {
      1: [front(tief, 0.55), hell, 'leiste'], // Unterschrank: Eiche dunkel
      2: [front(creme, 0.62), gold, 'rohr'], // Steigleitung: Lack creme
      3: [front(gold, 0.72), hell, 'fuge'], // Dielenpaket: Gold
      4: [front(creme, 0.2), gold, 'knopf'], // Eckschrank: Anthrazit
      5: [front(tief, 0.3), hell, 'knopf'], // Sockelprofil: Nussbaum
      6: [front(gruen, 0.28), gold, 'mulde'], // Kochinsel: Salbei
      7: [front(rot, 0.26), gold, 'leiste'], // Deckenprofil: Bordeaux
      8: [front(gold, 0.36), hell, 'mulde'], // Wandpaneel: Bronze
      9: [front(creme, 0.1), tief, 'altbestand'], // Altbestand: matt, schraffiert
      10: [front(creme, 0.45), hell, 'doppel'], // Waschtisch: Stein hell
      11: [front(gruen, 0.45), gold, 'stange'], // Kuehlkombi: Salbei hell
      12: [front(tief, 0.75), hell, 'raster'], // PV-Winkel: Eiche hell
      13: [front(rot, 0.42), rot, 'warnung'], // Leitungskreuz: Problemteil
      14: [front(rot, 0.2), rot, 'warnung'], // Treppenlauf: Problemteil
    },
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
  } else if (griff === 'rohr') {
    /* Steigleitung: ein Strang senkrecht durch die Zelle, oben und unten
       ein Flansch. Die Zelle liest sich damit als Leitung, nicht als Front. */
    ctx.fillRect(mitte - dicke / 2, py + i, dicke, b)
    ctx.fillRect(px + z * 0.3, py + z * 0.2, z * 0.4, Math.max(1.2, z * 0.05))
    ctx.fillRect(px + z * 0.3, py + z * 0.74, z * 0.4, Math.max(1.2, z * 0.05))
  } else if (griff === 'fuge') {
    /* Dielenpaket: eine durchlaufende Fuge und ein versetzter Stoss —
       genau das Muster, an dem man einen verlegten Boden erkennt. */
    ctx.fillRect(px + i, py + z * 0.46, b, Math.max(1.2, z * 0.045))
    ctx.fillStyle = rgb(palette.nacht, 0.4)
    ctx.fillRect(px + z * 0.62, py + i, Math.max(1.2, z * 0.045), b * 0.46)
  } else if (griff === 'raster') {
    /* PV-Winkel: das Zellraster eines Moduls, ein Kreuz genuegt dafuer. */
    ctx.fillRect(mitte - dicke / 4, py + i, Math.max(1.2, dicke / 2), b)
    ctx.fillRect(px + i, py + z / 2 - dicke / 4, b, Math.max(1.2, dicke / 2))
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

/**
 * Wo das Feld auf der Buehne liegt. Oben bleibt ein Streifen fuer die
 * Vorschau, unten einer fuer den Geduldsbalken — und seit der Daumentaste
 * fuer FALLEN LASSEN, die dort quer sitzt. Der Streifen kostet auf 390 x 844
 * genau eine Zellenbreite Feld; dafuer liegt die wichtigste Eingabe des
 * Spiels dort, wo der Daumen ohnehin ist.
 */
const FUSS = 62

function geometrie(breite, hoehe) {
  const rand = 8
  const kopf = 30
  const z = Math.max(8, Math.floor(Math.min((breite - 2 * rand) / BREITE, (hoehe - kopf - FUSS) / HOEHE)))
  const fb = z * BREITE
  const fh = z * HOEHE
  return { z, x0: Math.round((breite - fb) / 2), y0: Math.round(kopf + (hoehe - kopf - FUSS - fh) / 2), fb, fh, kopf }
}

/* Der Schluessel dieses Spiels — er steht im Lauf und im Pause-Register. */
const GAME = 'kuechen_fit'

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
  /* Nur was die Leiste und die Buehne brauchen — nie pro Frame gesetzt. */
  const [anzeige, setAnzeige] = useState({ combo: 0, fieber: 0 })

  const buehneRef = useRef(null)
  const canvasRef = useRef(null)
  const lagerRef = useRef(null)
  const masseRef = useRef({ breite: 300, hoehe: 480, dpr: 1 })
  const paletteRef = useRef(null)
  const tokenRef = useRef(null)
  const standRef = useRef(null)
  /* Das Spielgefuehl: Zustand aus fit-logik.js, Effekte aus spielgefuehl.js.
     Die Werke entstehen einmal und werden beim Aufraeumen geleert. */
  const gefuehlRef = useRef(null)
  const funkenRef = useRef(null)
  const rufeRef = useRef(null)
  const ruettelRef = useRef(null)
  if (funkenRef.current == null) funkenRef.current = funkenwerk(FUNKEN_VORRAT)
  if (rufeRef.current == null) rufeRef.current = rufwerk(RUF_VORRAT)
  if (ruettelRef.current == null) ruettelRef.current = ruettler({ abfall: 0.84, max: 12 })
  if (tokenRef.current == null) tokenRef.current = farbenLesen(null)
  const anzeigeRef = useRef({ combo: 0, fieber: 0 })
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
    /* Was das Bild lebendig haelt: Beben, laufende Rufe, Balkenstand. */
    beben: { x: 0, y: 0 },
    rufeBis: 0,
    geduldStrich: -1,
  })
  const crashUhrRef = useRef(0)
  const fingerRef = useRef(null)
  const nrRef = useRef(0)
  const pauseRef = useRef(false)
  const crashRef = useRef(false)
  const sanftRef = useRef(false)

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

  /* Groesse messen, Canvas auf DPR (hoechstens 2) einstellen, Farben lesen. */
  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    paletteRef.current = paletteBauen(el)
    /* Dieselben Tokens noch einmal als fertige Farbstrings — so will es das
       Rufwerk aus spielgefuehl.js. */
    tokenRef.current = farbenLesen(el)
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

  /**
   * Der normale Weg ins Game Over — auch fuer das Testlabor.
   * `grund` ist 'geduld', wenn der Balken leergelaufen ist; sonst ist die
   * Kueche voll. Das Testlabor ruft ohne Grund, das ist Absicht.
   */
  const aufgeben = useCallback((grund) => {
    if (crashRef.current) return
    crashRef.current = true
    pauseRef.current = false
    fingerRef.current = null
    takt.current.crashSeit = performance.now()
    takt.current.malen = true
    funkenRef.current.leeren()
    ruettelRef.current.leeren()
    setPause(false)
    setCrash(true)
    anzeigeRef.current = { combo: 0, fieber: 0 }
    setAnzeige({ combo: 0, fieber: 0 })
    melden('verkantet', grund === 'geduld' ? 'ZEIT ABGELAUFEN' : 'KÜCHE VOLL')
    vibrieren(HAPTIK.fehler)
    klang('explosion')
    clearTimeout(crashUhrRef.current)
    crashUhrRef.current = setTimeout(() => fertig(), CRASH_MS)
  }, [fertig, melden])

  useTestEnde('kuechen_fit', laeuft, aufgeben)

  useEffect(() => {
    const uhr = crashUhrRef
    const funken = funkenRef.current
    const rufe = rufeRef.current
    const ruettel = ruettelRef.current
    return () => {
      clearTimeout(uhr.current)
      /* Nichts lebt laenger als die Komponente: kein Partikel, kein Ton. */
      funken.leeren()
      rufe.leeren()
      ruettel.leeren()
      klangSchliessen()
    }
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
      vibrieren(HAPTIK.tipp)
      klang('tick', 1 + stufe * 0.02)
    }
  }, [melden, tempoHeben])

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    clearTimeout(crashUhrRef.current)
    standRef.current = neuesSpiel()
    gefuehlRef.current = gefuehlStart()
    funkenRef.current.leeren()
    rufeRef.current.leeren()
    ruettelRef.current.leeren()
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
      beben: { x: 0, y: 0 },
      rufeBis: 0,
      geduldStrich: -1,
    })
    teilBeginnt()
    setReihen(0)
    anzeigeRef.current = { combo: 0, fieber: 0 }
    setAnzeige({ combo: 0, fieber: 0 })
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

  /** Bildpunkt in der Mitte einer Zellenliste — fuer Funken und Rufe. */
  const mitteVon = useCallback((zellen) => {
    const { breite, hoehe } = masseRef.current
    const { z, x0, y0 } = geometrie(breite, hoehe)
    let sx = 0
    let sy = 0
    for (const [x, y] of zellen) {
      sx += x
      sy += y
    }
    const n = Math.max(1, zellen.length)
    return { x: x0 + (sx / n + 0.5) * z, y: y0 + (sy / n + 0.5) * z, z }
  }, [])

  /** Combo und Fieber nach aussen geben — nur, wenn sich wirklich etwas aendert. */
  const anzeigeSetzen = useCallback((combo, fieber) => {
    const a = anzeigeRef.current
    if (a.combo === combo && a.fieber === fieber) return
    anzeigeRef.current = { combo, fieber }
    setAnzeige({ combo, fieber })
  }, [])

  /** Einrasten, werten, melden, naechstes Teil vorbereiten. */
  const einrastenJetzt = useCallback(() => {
    const stand = standRef.current
    if (!stand?.aktuell || crashRef.current) return
    const t = takt.current
    const g = gefuehlRef.current
    const sek = t.spielMs / 1000
    const ort = mitteVon(zellenVon(stand.aktuell))
    /* Wie viel vom Teil in der Einbau-Zone liegt, muss VOR dem Einrasten
       gemessen werden — danach gibt es das Teil nicht mehr. */
    const anteil = g ? zoneAnteil(g.zone, stand.aktuell) : 0

    const { stand: neu, ereignis } = festsetzen(stand, sek, anteil)
    standRef.current = neu
    rundeZaehlen()

    /* Note, Combo, Fieber, Zeitgutschrift: alles rein gerechnet in
       fit-logik.js, hier wird es nur noch sichtbar und hoerbar. */
    const gp = g
      ? gefuehlPlatzierung(g, {
          art: ereignis.art,
          reihen: ereignis.anzahl,
          zonenTreffer: ereignis.zonenTreffer,
          stufe: Math.max(t.stufe, ereignis.stufe),
          stufeAuf: ereignis.stufeAuf,
        })
      : null
    if (gp) gefuehlRef.current = gp.zustand
    const gm = gp?.ereignis || null

    /* Ein einziger Aufruf je Teil — der Vertrag mit useSpielLauf bleibt. */
    const punkte = ereignis.punkte + (gm?.punkte || 0)
    if (punkte) punkteGeben(punkte)

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

    /* ---- Anzeige: die Note steht immer da, gross und an Ort und Stelle. */
    const note = NOTEN[ereignis.art] || NOTEN.daneben
    const farben = tokenRef.current
    const funken = funkenRef.current
    const rufe = rufeRef.current
    const jetzt = performance.now()
    const notenFarbe = ereignis.art === 'perfekt' ? farben.goldHell : ereignis.art === 'gut' ? farben.creme : farben.rot

    rufe.zeigen({
      x: ort.x,
      y: ort.y,
      text: ereignis.zonenTreffer && ereignis.art !== 'daneben' ? `${note.wort} · ZONE` : note.wort,
      art: 'ruf',
      gr: ereignis.art === 'perfekt' ? 20 : 15,
      farbe: notenFarbe,
    })
    if (punkte) {
      rufe.zeigen({ x: ort.x, y: ort.y + 22, text: `+${punkte}`, art: 'punkte', gr: 15, farbe: farben.creme })
    }
    if (gm?.zeitBonus > 0) {
      const sekunden = (gm.zeitBonus / 1000).toFixed(1).replace('.', ',')
      rufe.zeigen({ x: ort.x, y: ort.y + 40, text: `+${sekunden} s`, art: 'zeit', gr: 13 })
    }
    if (gm?.fieberStart) {
      rufe.zeigen({ x: ort.x, y: ort.y - 30, text: gm.fieberStart >= 2 ? 'FIEBER ×2' : 'FIEBER', art: 'combo', gr: 22, farbe: farben.gold })
    } else {
      const stufeWort = gm ? comboStufe(gm.combo) : null
      if (stufeWort) {
        rufe.zeigen({ x: ort.x, y: ort.y - 26, text: `${stufeWort.wort} ×${gm.combo}`, art: 'combo', gr: 15 })
      }
    }
    t.rufeBis = jetzt + RUF_MS

    /* ---- Funken, Beben, Ton. Alles aus spielgefuehl.js, alles gedeckelt. */
    if (note.funken) {
      const stark = gm?.fieberStufe || 0
      funken.schuss({
        x: ort.x,
        y: ort.y,
        anzahl: note.funken + stark * 4,
        farbe: ereignis.art === 'perfekt' ? [farben.gold, farben.goldHell, farben.creme] : [farben.gold, farben.goldTief],
        art: ereignis.art === 'perfekt' ? 'stern' : 'punkt',
        tempo: 150 + stark * 40,
        gr: ereignis.art === 'perfekt' ? 3 : 2,
        leben: 560,
      })
    }
    if (ereignis.anzahl) {
      /* Abgeraeumte Reihen sprayen ueber die ganze Breite. */
      const { breite, hoehe } = masseRef.current
      const geo = geometrie(breite, hoehe)
      for (const y of ereignis.reihen) {
        funken.schuss({
          x: geo.x0 + geo.fb / 2,
          y: geo.y0 + (y + 0.5) * geo.z,
          anzahl: 10,
          farbe: [farben.gold, farben.goldHell],
          art: 'krume',
          tempo: 240,
          streuung: Math.PI * 0.7,
          richtung: 0,
          gr: 2.5,
          leben: 520,
        })
      }
    }
    if (note.stoss) ruettelRef.current.stoss(note.stoss + (ereignis.anzahl || 0) * 2)

    if (ereignis.art === 'perfekt') {
      vibrieren(gm?.fieberStart ? HAPTIK.fieber : HAPTIK.perfekt)
      klang('perfekt', 1 + Math.min(8, gm?.combo || 0) * 0.04)
      if (gm?.fieberStart) klang('kraft', 1 + gm.fieberStart * 0.1)
    } else if (ereignis.art === 'gut') {
      vibrieren(HAPTIK.gut)
      klang('pop', 1 + Math.min(8, gm?.combo || 0) * 0.03)
    } else {
      vibrieren(HAPTIK.treffer)
      klang('landung')
    }
    if (ereignis.anzahl) klang('combo', 1 + ereignis.anzahl * 0.06)

    anzeigeSetzen(gm?.combo || 0, gm?.fieberStufe || 0)

    /* ---- Der DOM-Ruf bleibt dem Seltenen vorbehalten: Spruch, Level,
       Nachschub. So steht nicht nach jedem Zug ein Satz auf dem Feld. */
    if (gm?.spruch) melden('gut', gm.spruch)
    else if (stufeHoch) melden('treffer', `LEVEL ${stufeHoch}`)
    else if (ereignis.nachschub) {
      melden('verkantet', 'NACHSCHUB')
      vibrieren(HAPTIK.explosion)
    }

    if (ereignis.vorbei) {
      aufgeben()
      return
    }
    setNaechstes(neu.naechstes)
    if (!t.raeumen) teilBeginnt()
  }, [anzeigeSetzen, aufgeben, melden, mitteVon, punkteGeben, rundeZaehlen, teilBeginnt, tempoHeben])

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
    if (tiefe) ruettelRef.current.stoss(3)
    vibrieren(HAPTIK.tipp)
    klang('treffer', 1.1)
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
    schrittRef.current = { einrastenJetzt, darfEinrasten, teilBeginnt, tempoPruefen, aufgeben, anzeigeSetzen }
  }, [einrastenJetzt, darfEinrasten, teilBeginnt, tempoPruefen, aufgeben, anzeigeSetzen])

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
      const gf = gefuehlRef.current
      const ctx = c.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, breite, hoehe)

      /* Das Beben verschiebt nur das Feld, nicht Balken und Vorschau. */
      ctx.save()
      if (t.beben.x || t.beben.y) ctx.translate(t.beben.x, t.beben.y)

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

      /* Die Einbau-Zone liegt als Bodenmarkierung unter den Schraenken.
         Trifft das Teil sie ganz, wird sie deutlich heller. */
      if (gf?.zone && !t.raeumen && !crashRef.current) {
        const { von, bis } = zoneSpalten(gf.zone)
        const zx = x0 + von * z
        const zb = (bis - von) * z
        const treffer = stand.aktuell ? zoneAnteil(gf.zone, stand.aktuell) >= 1 : false
        const band = ctx.createLinearGradient(0, y0, 0, y0 + fh)
        band.addColorStop(0, rgb(palette.gold, treffer ? 0.06 : 0.02))
        band.addColorStop(1, rgb(palette.gold, treffer ? 0.26 : 0.12))
        ctx.fillStyle = band
        ctx.fillRect(zx, y0, zb, fh)
        ctx.strokeStyle = rgb(treffer ? palette.hell : palette.gold, treffer ? 0.85 : 0.38)
        ctx.lineWidth = treffer ? 2 : 1
        ctx.setLineDash([5, 4])
        ctx.strokeRect(zx + 1, y0 + 1, zb - 2, fh - 2)
        ctx.setLineDash([])
        ctx.lineWidth = 1
      }

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

      /* Fieber: der Rahmen glueht, oben zeigt ein Streifen die Restzeit. */
      if (gf?.fieber && !crashRef.current) {
        const rest = Math.max(0, Math.min(1, gf.fieber.restMs / gf.fieber.gesamtMs))
        const puls = sanftRef.current ? 0.8 : 0.72 + 0.28 * Math.sin(jetzt / 130)
        ctx.strokeStyle = rgb(palette.hell, (0.3 + 0.5 * rest) * puls)
        ctx.lineWidth = 1 + gf.fieber.stufe
        ctx.strokeRect(x0 - 2, y0 - 2, fb + 4, fh + 4)
        ctx.lineWidth = 1
        ctx.fillStyle = rgb(palette.hell, 0.85)
        ctx.fillRect(x0 + 1, y0 + 1, (fb - 2) * rest, 2)
      }

      ctx.restore()

      /* Der Geduldsbalken unter dem Feld. Er ist der ganze Zeitdruck des
         Spiels — die Runde endet, wenn er leer ist. */
      const anteilGeduld = gf ? Math.max(0, Math.min(1, gf.geduldMs / GEDULD_MAX_MS)) : 1
      const by = Math.min(hoehe - 6, y0 + fh + 5)
      ctx.fillStyle = rgb(palette.nacht, 0.72)
      rundesRechteck(ctx, x0, by, fb, 5, 2.5)
      ctx.fill()
      ctx.strokeStyle = rgb(palette.gold, 0.22)
      ctx.stroke()
      const voll = fb * anteilGeduld
      if (voll > 1) {
        const knapp = anteilGeduld < 0.25
        const puls = knapp && !sanftRef.current ? 0.65 + 0.35 * Math.sin(jetzt / 110) : 1
        const balken = ctx.createLinearGradient(x0, 0, x0 + fb, 0)
        balken.addColorStop(0, rgb(knapp ? palette.rot : palette.tief, puls))
        balken.addColorStop(1, rgb(knapp ? palette.rot : gf?.fieber ? palette.creme : palette.hell, puls))
        ctx.fillStyle = balken
        rundesRechteck(ctx, x0, by, voll, 5, 2.5)
        ctx.fill()
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

      /* Funken und Rufe liegen ueber allem — sie sind die Quittung. */
      funkenRef.current.malen(ctx)
      rufeRef.current.malen(ctx, tokenRef.current)

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
      /* Minimiert steht die Runde still. Der Zeitanker wandert mit,
         sonst kaeme der erste Frame danach mit einem dt von mehreren
         Sekunden zurueck und rechnete die Runde in einem Schritt zu
         Ende. */
      if (istPausiert(GAME)) {
        takt.current.vorFrame = jetzt
        frame = requestAnimationFrame(schritt)
        return
      }
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

        /* Geduld sinkt, Fieber laeuft ab, die Zone wandert. Alles gerechnet
           in fit-logik.js — hier wird nur weitergereicht. */
        const gf = gefuehlRef.current
        if (gf) {
          const schub = gefuehlTakt(gf, dt, t.stufe)
          gefuehlRef.current = schub.zustand
          if (schub.ereignis.fieberEnde) {
            h.anzeigeSetzen(schub.zustand.combo, 0)
            t.malen = true
          }
          /* Nur bei sichtbarer Aenderung neu malen: der Balken hat 200
             Striche, mehr sieht ohnehin niemand. */
          const strich = Math.round(schub.ereignis.geduldAnteil * 200)
          if (strich !== t.geduldStrich) {
            t.geduldStrich = strich
            t.malen = true
          }
          if (schub.zustand.fieber || schub.zustand.zone?.tempo) t.malen = true
          if (schub.ereignis.leer) h.aufgeben('geduld')
        }
      }

      if (stand && h && !pauseRef.current && !crashRef.current) {
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
      /* Funken, Rufe und Beben laufen weiter — aber nur, solange wirklich
         etwas lebt. Im Leerlauf bleibt das Bild stehen. */
      if (stand && !pauseRef.current) {
        const funken = funkenRef.current
        if (funken.aktiv()) {
          funken.schritt(dt)
          t.malen = true
        }
        if (jetzt < t.rufeBis) {
          rufeRef.current.schritt(dt)
          t.malen = true
        }
        const v = ruettelRef.current.versatz(dt)
        if (v.kraft || t.beben.x || t.beben.y) {
          t.beben = v
          t.malen = true
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
        <span className="trm-fit-stand">
          <span className="trm-spiel__combo trm-fit-level" data-an="1">
            LV {tempo.stufe}
          </span>
          <span
            className="trm-spiel__combo trm-fit-combo"
            data-an={anzeige.combo >= 2 ? '1' : '0'}
            data-fieber={anzeige.fieber || 0}
          >
            ×{Math.max(1, anzeige.combo)}
          </span>
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
            data-fieber={anzeige.fieber || 0}
            data-combo={anzeige.combo}
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

            {/* Der Tonschalter sitzt in der gemeinsamen Game-Shell
                (SpielKarte), nicht mehr hier. */}

            {/* FALLEN LASSEN. Der harte Fall war bisher nur ueber einen
                schnellen Wisch nach unten erreichbar — das findet auf dem
                Handy niemand. Jetzt liegt er als breite Taste unter dem
                Feld, genau im Daumenweg.

                Sie darf die Buehne nicht mitbedienen: ein durchgereichter
                Tipp wuerde das Teil drehen, eine durchgereichte Leertaste
                es ein zweites Mal absetzen. Darum stoppt sie Zeiger und
                Tasten, bevor die Buehne sie sieht, und wirft selbst auf
                `pointerdown` ab — nicht auf `click`, damit der Fall genau
                dann passiert, wenn der Daumen aufsetzt. `click` bleibt nur
                fuer die Tastatur (dort ist `detail` 0); sonst faenge der
                Klick nach dem Zeiger ein zweites Teil ab. */}
            <button
              type="button"
              className="trm-fit-drop"
              aria-label="Teil sofort fallen lassen"
              onPointerDown={(e) => {
                e.stopPropagation()
                hartAbsetzen()
              }}
              onPointerUp={(e) => e.stopPropagation()}
              onPointerMove={(e) => e.stopPropagation()}
              onPointerCancel={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') e.stopPropagation()
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') e.stopPropagation()
              }}
              onClick={(e) => {
                if (e.detail === 0) hartAbsetzen()
              }}
            >
              FALLEN LASSEN
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
