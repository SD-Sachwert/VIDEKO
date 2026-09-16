/**
 * KUECHEN-TINDER — Spiellogik ohne React.
 *
 * Reine Funktionen mit injizierbarem Zufall, getestet in
 * scripts/spiele/tinder-logik-test.mjs.
 *
 * ABLAUF
 * ------
 * Eine Runde ist eine Folge von Aufgabenbloecken. Jeder Block hat einen
 * Aufgabentyp (tinder-karten.js) und 4–6 Karten. Der naechste Typ kommt aus
 * einem gemischten Beutel aller zehn Typen — nie derselbe direkt noch einmal.
 * Keine Karte kommt in einer Runde zweimal (erst wenn der ganze Pool
 * verbraucht ist, was in 30 s nicht vorkommt).
 *
 * SCHWIERIGKEIT
 * -------------
 * Die Zielstufe haengt an der Kartenzahl: die ersten Karten sind Stufe 1,
 * dann 2, dann 3. Gezogen wird die unbenutzte Karte mit der kleinsten
 * Abweichung von der Zielstufe.
 *
 * WERTUNG
 * -------
 * Richtig: BASIS × Combo-Faktor + Tempobonus + Stufenbonus, gedeckelt auf
 * MAX_JE_ANTWORT. Falsch: 0 Punkte, Combo 0, STRAFE_MS Zeitstrafe.
 */

import { AUFGABEN_TYPEN, KARTEN } from './tinder-karten.js'

export { AUFGABEN_TYPEN, KARTEN }

export const SPIELZEIT_MS = 30000
/** Mindestabstand zwischen zwei Antworten (Ausflug der alten Karte). */
export const ABSTAND_MS = 260
/** Sperre und Einblendung beim Aufgabenwechsel. */
export const AUFGABE_SPERRE_MS = 600
export const STRAFE_MS = 2000
export const KARTEN_MIN = 4
export const KARTEN_MAX = 6
/** Hoechstens so viele gleiche Antworten hintereinander. */
export const GLEICHE_MAX = 3

export const BASIS_PUNKTE = 80
/** Combo-Stufen: ab dieser Combo gilt der Faktor. */
export const COMBO_STUFEN = [
  { ab: 15, faktor: 3 },
  { ab: 10, faktor: 2.5 },
  { ab: 6, faktor: 2 },
  { ab: 3, faktor: 1.5 },
  { ab: 0, faktor: 1 },
]
export const TEMPO_SCHNELL_MS = 900
export const TEMPO_ZUEGIG_MS = 1500
export const TEMPO_SCHNELL = 40
export const TEMPO_ZUEGIG = 20
export const STUFEN_BONUS = { 1: 0, 2: 10, 3: 20 }
/** Punktdecke je Antwort — liegt unter maxJeRunde des Servers (340). */
export const MAX_JE_ANTWORT = 320

/** Zielstufe nach Kartenzahl (0-basiert: wie viele Karten schon gezeigt). */
export const STUFE_GRENZEN = { zwei: 6, drei: 14 }

export const TYP_NACH_KEY = Object.fromEntries(AUFGABEN_TYPEN.map((t) => [t.key, t]))

/* ------------------------------------------------------------------ */
/* Zufall                                                              */
/* ------------------------------------------------------------------ */

/** Deterministischer Zufall (mulberry32) fuer Tests und Wiederholungen. */
export function zufallMitSaat(saat = 1) {
  let a = saat >>> 0
  return function zufall() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mischen(liste, zufall) {
  const a = liste.slice()
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(zufall() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ------------------------------------------------------------------ */
/* Schwierigkeit und Wertung                                           */
/* ------------------------------------------------------------------ */

/** Zielstufe fuer die Karte mit Index `gezeigt` (0 = erste Karte). */
export function stufeFuer(gezeigt) {
  if (gezeigt >= STUFE_GRENZEN.drei) return 3
  if (gezeigt >= STUFE_GRENZEN.zwei) return 2
  return 1
}

/** Faktor zur Combo, die diese Antwort mitzaehlt (1 = erste richtige). */
export function faktorFuer(combo) {
  for (const s of COMBO_STUFEN) if (combo >= s.ab) return s.faktor
  return 1
}

/** Tempobonus fuer `zeitMs` bis zur Entscheidung. */
export function tempoBonus(zeitMs) {
  if (!Number.isFinite(zeitMs) || zeitMs < 0) return 0
  if (zeitMs < TEMPO_SCHNELL_MS) return TEMPO_SCHNELL
  if (zeitMs < TEMPO_ZUEGIG_MS) return TEMPO_ZUEGIG
  return 0
}

/** Punkte fuer eine richtige Antwort, gedeckelt. */
export function punkteFuer(combo, zeitMs, stufe = 1) {
  const roh = Math.round(BASIS_PUNKTE * faktorFuer(combo)) + tempoBonus(zeitMs) + (STUFEN_BONUS[stufe] || 0)
  return Math.min(MAX_JE_ANTWORT, roh)
}

/* ------------------------------------------------------------------ */
/* Kartenfolge                                                         */
/* ------------------------------------------------------------------ */

function typZiehen(zustand) {
  let beutel = zustand.typBeutel
  const offen = (key) => KARTEN.some((k) => k.typ === key && !zustand.benutzt.includes(k.id))
  for (let versuch = 0; versuch < 3; versuch += 1) {
    if (!beutel.length) beutel = mischen(AUFGABEN_TYPEN.map((t) => t.key), zustand.zufall)
    const idx = beutel.findIndex((key) => key !== zustand.typ && offen(key))
    if (idx >= 0) {
      const key = beutel[idx]
      return { key, typBeutel: beutel.filter((_, i) => i !== idx) }
    }
    beutel = []
  }
  /* Pool erschoepft: alles wieder frei, nur der Typwechsel bleibt Pflicht. */
  const key = mischen(AUFGABEN_TYPEN.map((t) => t.key).filter((k) => k !== zustand.typ), zustand.zufall)[0]
  return { key, typBeutel: [], zuruecksetzen: true }
}

function karteWaehlen(zustand, typ, ziel, wunschJa) {
  const frei = KARTEN.filter((k) => k.typ === typ && !zustand.benutzt.includes(k.id))
  if (!frei.length) return null
  const mitAntwort = frei.filter((k) => k.ja === wunschJa)
  const kandidaten = mitAntwort.length ? mitAntwort : frei
  const abstand = Math.min(...kandidaten.map((k) => Math.abs(k.stufe - ziel)))
  const beste = kandidaten.filter((k) => Math.abs(k.stufe - ziel) === abstand)
  return beste[Math.floor(zustand.zufall() * beste.length)]
}

function wunschAntwort(zustand) {
  const s = zustand.antwortSchwanz
  if (s.length >= GLEICHE_MAX && s.slice(-GLEICHE_MAX).every((v) => v === s[s.length - 1])) {
    return !s[s.length - 1]
  }
  /* Leicht zum Ausgleich ziehen, sonst Zufall. */
  const diff = zustand.jaSumme - zustand.neinSumme
  const pJa = Math.max(0.2, Math.min(0.8, 0.5 - diff * 0.15))
  return zustand.zufall() < pJa
}

/**
 * Die naechste Karte ziehen. Gibt `{ zustand, eintrag }`; `eintrag` ist
 * `{ nr, typ, aufgabe, karte, stufe, neu }`. `neu` = erste Karte eines Blocks.
 */
export function naechsteKarte(zustand) {
  let z = { ...zustand }
  let neu = false
  if (z.blockRest <= 0 || !z.typ) {
    const gezogen = typZiehen(z)
    if (gezogen.zuruecksetzen) z.benutzt = []
    z.typ = gezogen.key
    z.typBeutel = gezogen.typBeutel
    z.blockRest = KARTEN_MIN + Math.floor(z.zufall() * (KARTEN_MAX - KARTEN_MIN + 1))
    z.bloecke += 1
    neu = true
  }
  const ziel = stufeFuer(z.gezeigt)
  let karte = karteWaehlen(z, z.typ, ziel, wunschAntwort(z))
  if (!karte) {
    /* Typ leer mitten im Block: sofort wechseln. */
    z.blockRest = 0
    return naechsteKarte(z)
  }
  z.benutzt = [...z.benutzt, karte.id]
  z.blockRest -= 1
  z.gezeigt += 1
  z.jaSumme += karte.ja ? 1 : 0
  z.neinSumme += karte.ja ? 0 : 1
  z.antwortSchwanz = [...z.antwortSchwanz, karte.ja].slice(-GLEICHE_MAX)
  const eintrag = { nr: z.gezeigt, typ: z.typ, aufgabe: TYP_NACH_KEY[z.typ], karte, stufe: karte.stufe, neu }
  z.aktuell = eintrag
  return { zustand: z, eintrag }
}

/** Kurzform fuer die Anzeige: die naechste Aufgabe ist der Typ des Eintrags. */
export function naechsteAufgabe(zustand) {
  return naechsteKarte(zustand).eintrag.aufgabe
}

/** Eine frische Runde mit der ersten Karte als `zustand.aktuell`. */
export function rundeErzeugen(zufall = Math.random) {
  const start = {
    zufall,
    typ: null,
    typBeutel: [],
    blockRest: 0,
    bloecke: 0,
    benutzt: [],
    gezeigt: 0,
    jaSumme: 0,
    neinSumme: 0,
    antwortSchwanz: [],
    aktuell: null,
    combo: 0,
    besteCombo: 0,
    punkte: 0,
    richtige: 0,
    falsche: 0,
    runden: 0,
    strafeMs: 0,
  }
  return naechsteKarte(start).zustand
}

/**
 * Die aktuelle Karte beantworten. `antwort` true = JA, `zeitMs` = Zeit seit
 * die Karte entscheidbar war. Gibt das Ereignis und `zustand` mit der
 * naechsten Karte als `aktuell`.
 */
export function antwortWerten(zustand, antwort, zeitMs) {
  const eintrag = zustand.aktuell
  const karte = eintrag.karte
  const richtig = Boolean(antwort) === karte.ja
  const comboVorher = zustand.combo
  const combo = richtig ? comboVorher + 1 : 0
  const punkte = richtig ? punkteFuer(combo, zeitMs, karte.stufe) : 0
  const strafeMs = richtig ? 0 : STRAFE_MS
  const bewertet = {
    ...zustand,
    combo,
    besteCombo: Math.max(zustand.besteCombo, combo),
    punkte: zustand.punkte + punkte,
    richtige: zustand.richtige + (richtig ? 1 : 0),
    falsche: zustand.falsche + (richtig ? 0 : 1),
    runden: zustand.runden + 1,
    strafeMs: zustand.strafeMs + strafeMs,
  }
  const { zustand: weiter, eintrag: naechster } = naechsteKarte(bewertet)
  return {
    zustand: weiter,
    richtig,
    punkte,
    combo,
    comboVorher,
    comboVerloren: !richtig && comboVorher > 0,
    faktor: richtig ? faktorFuer(combo) : 0,
    bonus: richtig ? tempoBonus(zeitMs) : 0,
    strafeMs,
    loesung: karte.ja,
    warum: karte.warum,
    karte,
    neueAufgabe: naechster.neu,
  }
}

/**
 * Welche Meldung ein Ereignis bekommt: `{ art, text }` fuer die Klassen
 * `trm-spiel__ruf--<art>`.
 */
export function meldungFuer(ereignis) {
  if (!ereignis.richtig) {
    return { art: 'verkantet', text: ereignis.comboVerloren && ereignis.comboVorher >= 2 ? `COMBO ×${ereignis.comboVorher} WEG` : 'FALSCH' }
  }
  const c = ereignis.combo
  const stufe = COMBO_STUFEN.find((s) => s.ab > 0 && s.ab === c)
  if (stufe) return { art: stufe.faktor >= 2.5 ? 'perfekt' : 'gold', text: `COMBO ×${c} · PUNKTE ×${String(stufe.faktor).replace('.', ',')}` }
  return { art: ereignis.bonus >= TEMPO_SCHNELL ? 'gut' : 'treffer', text: `+${ereignis.punkte}` }
}
