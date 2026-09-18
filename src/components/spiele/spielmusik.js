/**
 * Hintergrundmusik fuer die Game-Shell.
 *
 * Sechs Spiele, sechs Stuecke — aber immer nur ein Element und ein Zustand.
 * Die Shell sagt nur, welches Spiel laeuft und ob gerade gespielt wird; alles
 * andere (Laden, Schleife, Lautstaerke, Wechsel, Pause) haengt hier.
 *
 * Vier Regeln, die den Aufbau bestimmen:
 *
 * 1. NIE VON SELBST. Der erste `play()`-Versuch passiert ausschliesslich in
 *    einem echten Klick (Start, Nochmal, Weiterspielen, Ton an). Scheitert er
 *    trotzdem — iOS ist streng —, bleibt es still und das Spiel laeuft weiter.
 *    Es gibt keinen stummen Vorabstart, der spaeter laut gedreht wird.
 * 2. UNTER DEN EFFEKTEN. Die Quittungstoene aus `spielgefuehl.js` liegen bei
 *    0,12; die Musik darunter. Sie traegt, ohne einen Treffer zu verdecken.
 *    Die eine echte Instrumentalspur darf ein wenig lauter stehen als die
 *    Stuecke mit Gesang — Text unter einem Spiel lenkt ab.
 * 3. EIN SCHALTER. `tonStatus()` gilt fuer beides. Wer stummschaltet, schaltet
 *    Musik und Effekte zusammen ab — zwei Regler waeren am Handy einer zu
 *    viel.
 * 4. NIE ZWEI GLEICHZEITIG. Beim Spielwechsel wird das alte Element hart
 *    angehalten, bevor das neue entsteht. Eine laufende Blende gehoert immer
 *    dem aktuellen Element; beim Wechsel stirbt sie mit.
 *
 * Die Dateien liegen im Build (`src/assets/audio`), nicht auf einem fremden
 * Server: jede wird erst beim ersten Start ihres Spiels geladen (`preload`
 * steht auf `none`), danach aus dem eigenen Cache. Deshalb sind es Mono-Spuren
 * mit 64 kbit/s — ueber einen Handylautsprecher bei knapp zehn Prozent
 * Lautstaerke hoert das niemand, ueber Mobilfunk am Stadtfest schon.
 */

import { tonStatus } from './spielgefuehl.js'
import stueckSlam from '../../assets/audio/videko-kuechen-instrumental.mp3'
import stueckJump from '../../assets/audio/licht-an.mp3'
import stueckMerge from '../../assets/audio/besser-als-nichts.mp3'
import stueckCrush from '../../assets/audio/noch-wach.mp3'
import stueckFit from '../../assets/audio/unendlichkeit.mp3'
import stueckLeitung from '../../assets/audio/wir-sind-videko.mp3'

/**
 * Dezent. Darueber muss jeder Treffer noch zu hoeren sein.
 *
 * `MUSIK_LAUT` ist der Wert fuer Stuecke mit Gesang, `MUSIK_LAUT_INSTRUMENTAL`
 * der fuer die eine echte Instrumentalspur. Beide bleiben im vorgegebenen Band
 * von acht bis zwoelf Prozent.
 */
export const MUSIK_LAUT = 0.09
export const MUSIK_LAUT_INSTRUMENTAL = 0.12

/* Einblenden statt Einschalten: ein harter Einsatz mitten in der ersten
   Sekunde einer Runde wirkt wie ein Fehler. Kurz genug, dass der erste Ton
   trotzdem zur Startgeste gehoert. */
const BLENDE_MS = 400
const BLENDE_TAKT = 40

/**
 * Welches Stueck zu welchem Spiel gehoert — ein eigenes je Hauptgame.
 *
 * `laut` steht daneben, weil die Stuecke unterschiedlich dicht sind: nur
 * VIDEKO KUECHEN liegt als Instrumental vor, die uebrigen fuenf laufen als
 * normale Fassung mit Gesang und deshalb leiser.
 *
 * Ein unbekannter Schluessel (Practice, Legacy, Testlauf) faellt auf
 * `standard` zurueck — das Instrumental, weil es am wenigsten ablenkt.
 */
const STUECKE = {
  standard: { datei: stueckSlam, laut: MUSIK_LAUT_INSTRUMENTAL },
  videko_jump: { datei: stueckJump, laut: MUSIK_LAUT },
  kuechen_merge: { datei: stueckMerge, laut: MUSIK_LAUT },
  kuechen_crush: { datei: stueckCrush, laut: MUSIK_LAUT },
  kuechen_fit: { datei: stueckFit, laut: MUSIK_LAUT },
  leitungsfinder: { datei: stueckLeitung, laut: MUSIK_LAUT },
  videko_slam: { datei: stueckSlam, laut: MUSIK_LAUT_INSTRUMENTAL },
}

/** Der Eintrag zu einem Spiel — nie `undefined`. */
const eintrag = (key) => STUECKE[key] ?? STUECKE.standard

/** Nur die Datei. Bleibt exportiert, weil die Zuordnung pruefbar sein soll. */
export function musikStueck(key) {
  return eintrag(key).datei
}

/** Die Ziellautstaerke zu einem Spiel. */
export function musikLaut(key) {
  return eintrag(key).laut
}

let el = null
let quelle = null
let ziel = MUSIK_LAUT
let blende = null

function element(key) {
  const wunsch = eintrag(key)
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null
  if (el && quelle === wunsch.datei) {
    ziel = wunsch.laut
    return el
  }
  /* Spielwechsel. Erst die Blende toeten, sonst dreht sie gleich das neue
     Element hoch, das noch gar nicht spielen darf. Dann das alte Stueck
     anhalten — zwei Songs uebereinander waeren der schlimmste Fehler hier. */
  blendeStoppen()
  if (el) {
    try {
      el.pause()
      el.currentTime = 0
    } catch { /* egal */ }
  }
  try {
    el = new Audio(wunsch.datei)
    el.loop = true
    el.preload = 'none'
    el.volume = 0
    quelle = wunsch.datei
    ziel = wunsch.laut
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

function blenden(wohin) {
  blendeStoppen()
  const a = el
  if (!a) return
  const schritt = (wohin - a.volume) / Math.max(1, BLENDE_MS / BLENDE_TAKT)
  blende = setInterval(() => {
    if (!el) return blendeStoppen()
    const naechste = el.volume + schritt
    const fertig = schritt >= 0 ? naechste >= wohin : naechste <= wohin
    try {
      el.volume = fertig ? wohin : Math.min(1, Math.max(0, naechste))
    } catch { /* egal */ }
    if (fertig) blendeStoppen()
  }, BLENDE_TAKT)
}

/**
 * Musik soll laufen. Ohne Ton passiert nichts — und aus einem Effekt heraus
 * darf der Aufruf still scheitern: dann hat es schlicht keine Geste gegeben.
 *
 * Ist `key` ein anderes Spiel als beim letzten Mal, wechselt `element()` das
 * Stueck: altes aus, neues an, nie beides. Ist es dasselbe, laeuft es an der
 * Stelle weiter, an der `musikAus()` es angehalten hat — eine Pause setzt den
 * Song nicht zurueck.
 */
export function musikAn(key) {
  if (!tonStatus()) return
  const a = element(key)
  if (!a) return
  const wohin = ziel
  try {
    const antwort = a.play()
    if (antwort?.then) antwort.then(() => blenden(wohin), () => { /* keine Geste */ })
    else blenden(wohin)
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
