/**
 * Vorschaubilder der Spielauswahl.
 *
 * Die Bilder sind echte Aufnahmen aus den Spielen: aufgenommen im gebauten
 * dist bei 390x844 (deviceScaleFactor 3), nachdem ein Bot ein paar Sekunden
 * wirklich gespielt hat. Kein gerendertes Symbolbild, keine KI-Illustration —
 * wer die Karte sieht, sieht das Spielfeld, das er gleich bekommt.
 *
 * Neu aufnehmen: scripts/terminal-vorschaubilder.mjs (dort steht auch, welcher
 * Ausschnitt je Spiel gewaehlt wurde und warum).
 */
import crush from '../assets/images/spiele/kuechen_crush.webp'
import fit from '../assets/images/spiele/kuechen_fit.webp'
import merge from '../assets/images/spiele/kuechen_merge.webp'
import leitung from '../assets/images/spiele/leitungsfinder.webp'
import jump from '../assets/images/spiele/videko_jump.webp'
import slam from '../assets/images/spiele/videko_slam.webp'

/** Spielschluessel -> Bild-URL. Fehlt ein Schluessel, bleibt das Ikon. */
export const SPIEL_VORSCHAU = {
  leitungsfinder: leitung,
  kuechen_merge: merge,
  kuechen_crush: crush,
  videko_jump: jump,
  kuechen_fit: fit,
  videko_slam: slam,
}

/** Intrinsische Groesse aller Vorschaubilder — gegen Layoutspruenge. */
export const VORSCHAU_BREITE = 312
export const VORSCHAU_HOEHE = 240

export function vorschauBild(key) {
  return SPIEL_VORSCHAU[key] ?? null
}
