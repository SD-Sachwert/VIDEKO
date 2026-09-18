/**
 * Hintergrundmusik fuer die Game-Shell.
 *
 * Ein Stueck, ein Element, ein Zustand — nicht sechs Songs. Die Shell sagt
 * nur, ob gerade gespielt wird; alles andere (Laden, Schleife, Lautstaerke,
 * Pause) haengt hier.
 *
 * Drei Regeln, die den Aufbau bestimmen:
 *
 * 1. NIE VON SELBST. Der erste `play()`-Versuch passiert ausschliesslich in
 *    einem echten Klick (Start, Nochmal, Weiterspielen, Ton an). Scheitert er
 *    trotzdem — iOS ist streng —, bleibt es still und das Spiel laeuft weiter.
 *    Es gibt keinen stummen Vorabstart, der spaeter laut gedreht wird.
 * 2. UNTER DEN EFFEKTEN. Die Quittungstoene aus `spielgefuehl.js` liegen bei
 *    0,12; die Musik bei 0,09. Sie traegt, ohne einen Treffer zu verdecken.
 * 3. EIN SCHALTER. `tonStatus()` gilt fuer beides. Wer stummschaltet, schaltet
 *    Musik und Effekte zusammen ab — zwei Regler waeren am Handy einer zu
 *    viel.
 *
 * Die Datei liegt im Build (`src/assets/audio`), nicht auf einem fremden
 * Server: sie wird erst beim ersten Start geladen, dann aber aus dem eigenen
 * Cache.
 */

import { tonStatus } from './spielgefuehl.js'
import stueckStandard from '../../assets/audio/videko-kuechen-instrumental.mp3'

/** Dezent. Darueber muss jeder Treffer noch zu hoeren sein. */
export const MUSIK_LAUT = 0.09

/* Einblenden statt Einschalten: ein harter Einsatz mitten in der ersten
   Sekunde einer Runde wirkt wie ein Fehler. */
const BLENDE_MS = 900
const BLENDE_TAKT = 50

/**
 * Welches Stueck zu welchem Spiel gehoert. Heute fuer alle dasselbe — die
 * Zuordnung steht trotzdem schon hier, damit ein zweites Stueck spaeter eine
 * Zeile ist und kein Umbau.
 */
const STUECKE = { standard: stueckStandard }

export function musikStueck(key) {
  return STUECKE[key] ?? STUECKE.standard
}

let el = null
let quelle = null
let blende = null

function element(key) {
  const wunsch = musikStueck(key)
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null
  if (el && quelle === wunsch) return el
  if (el) {
    try { el.pause() } catch { /* egal */ }
  }
  try {
    el = new Audio(wunsch)
    el.loop = true
    el.preload = 'none'
    el.volume = 0
    quelle = wunsch
  } catch {
    el = null
    quelle = null
  }
  return el
}

function blendeStoppen() {
  if (blende === null) return
  clearInterval(blende)
  blende = null
}

function blenden(ziel) {
  blendeStoppen()
  const a = el
  if (!a) return
  const schritt = (ziel - a.volume) / Math.max(1, BLENDE_MS / BLENDE_TAKT)
  blende = setInterval(() => {
    if (!el) return blendeStoppen()
    const naechste = el.volume + schritt
    const fertig = schritt >= 0 ? naechste >= ziel : naechste <= ziel
    try {
      el.volume = fertig ? ziel : Math.min(1, Math.max(0, naechste))
    } catch { /* egal */ }
    if (fertig) blendeStoppen()
  }, BLENDE_TAKT)
}

/**
 * Musik soll laufen. Ohne Ton passiert nichts — und aus einem Effekt heraus
 * darf der Aufruf still scheitern: dann hat es schlicht keine Geste gegeben.
 */
export function musikAn(key) {
  if (!tonStatus()) return
  const a = element(key)
  if (!a) return
  try {
    const antwort = a.play()
    if (antwort?.then) antwort.then(() => blenden(MUSIK_LAUT), () => { /* keine Geste */ })
    else blenden(MUSIK_LAUT)
  } catch { /* Musik ist Beiwerk, nie ein Grund fuer einen Absturz */ }
}

/** Anhalten, Stelle merken. Fuer Pause, Anleitung, Stummschalten. */
export function musikAus() {
  blendeStoppen()
  if (!el) return
  try { el.pause() } catch { /* egal */ }
}

/** Runde vorbei: anhalten und an den Anfang. Die naechste faengt vorn an. */
export function musikZurueck() {
  musikAus()
  if (!el) return
  try {
    el.currentTime = 0
    el.volume = 0
  } catch { /* egal */ }
}
