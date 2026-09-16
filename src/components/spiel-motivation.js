import { TEXTE, fuelle, zahl } from '../data/terminal.js'

const T = TEXTE.g

/**
 * EINE Zeile unter dem Ergebnis, die den naechsten Lauf begruendet.
 *
 * Reihenfolge nach Wirkung: ein neuer Rekord schlaegt alles; danach das
 * naechste greifbare Ziel (mit dem Spielhebel, wenn eine einzige Aktion
 * gereicht haette), dann Top 3 und Top 10, solange sie nah genug sind, dann
 * der Platz direkt darueber, zuletzt der eigene Bestwert. Nie mehrere Zeilen:
 * das Feld ist klein, und eine klare Ansage wirkt staerker als drei.
 *
 * Eigene Datei, weil SpielKarte.jsx nur Bauteile exportieren soll.
 */
export function motivation({ neuerBest, rang, punkte, eigenBest, hebel }) {
  if (rang?.platz === 1) return T.spitze

  /* Ein neuer Rekord steht schon als eigene Zeile da. Gibt es noch einen
     Platz darueber, ist der Abstand die bessere Ansage als ein zweites Lob. */
  const luecke = rang?.bisPlatz > 0 && rang.luecke > 0 ? rang.luecke : null
  if (neuerBest && !luecke) return T.motivRekord
  if (luecke && hebel?.wort && hebel.punkte > 0 && luecke <= hebel.punkte) {
    return fuelle(T.motivHebel, { wort: hebel.wort, ziel: rang.bisPlatz })
  }
  const nah = (wert, anteil) => wert > 0 && wert <= Math.max(punkte * anteil, hebel?.punkte || 0)
  if (rang?.platz > 3 && nah(rang.top3Luecke, 0.25)) {
    return fuelle(T.motivTop3, { punkte: zahl(rang.top3Luecke) })
  }
  if (rang?.platz > 10 && nah(rang.top10Luecke, 0.5)) {
    return fuelle(T.motivTop10, { punkte: zahl(rang.top10Luecke) })
  }
  if (luecke) {
    return rang.vorMir
      ? fuelle(T.motivVorMir, { punkte: zahl(luecke), ziel: rang.bisPlatz, name: rang.vorMir })
      : fuelle(T.bisPlatz, { punkte: zahl(luecke), ziel: rang.bisPlatz })
  }
  if (eigenBest > punkte) {
    return punkte >= eigenBest * 0.8
      ? fuelle(T.motivKnapp, { punkte: zahl(eigenBest - punkte) })
      : fuelle(T.motivBest, { best: zahl(eigenBest) })
  }
  return null
}
