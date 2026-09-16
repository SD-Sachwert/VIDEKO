/**
 * TRUHENKNACKER — Schwierigkeit nachrechnen.
 *
 *   node scripts/truhen-simulation.mjs [laeufe]
 *
 * Das Spiel soll sich nach ein paar Versuchen nicht von allein loesen. Ob das
 * so ist, kann man nicht am Gefuehl ablesen, sondern nur an Punktzahlen. Dieses
 * Skript spielt vier Spielertypen jeweils einige tausend Runden durch und gibt
 * die Verteilung aus. Es importiert die Regeln aus
 * src/components/truhen-regeln.js — genau die Datei, die auch das echte Spiel
 * benutzt. Andere Zahlen zu simulieren als die ausgelieferten waere sinnlos.
 *
 * Zielkorridor aus der Aufgabenstellung:
 *
 *   Erstspieler, erster Versuch      2.000 –  6.000
 *   Geuebt, nach ein paar Runden     7.000 – 13.000
 *   Gute Spieler                    14.000 – 20.000
 *   Spitzenwerte deutlich darueber, aber selten.
 *
 * Das Spielermodell
 * -----------------
 * Ein Mensch trifft den Knopf nicht auf die Millisekunde. Der Fehler ist im
 * Kern eine Zeitstreuung: sigma Millisekunden daneben. Weil sich der Ring
 * dreht, wird daraus ein Winkelfehler von tempo * sigma. Das erklaert, warum
 * schnelle Ringe schwerer sind, ohne dass man Schwierigkeit extra erfinden
 * muesste — sie folgt aus der Geometrie.
 *
 * Dazu kommen drei Dinge, die nicht aus der Geometrie folgen:
 *   - Attrappen. Wer hastig spielt, stoppt auf einer falschen Markierung.
 *   - Richtungswechsel. Ein Ring, der die Richtung wechselt, macht die
 *     Vorhersage unsicherer; das erhoeht sigma fuer diesen Ring.
 *   - Bedenkzeit. Vor jedem Stopp vergeht Zeit, die niemand zurueckbekommt.
 *
 * Das Modell ist eine Naeherung, kein Beweis. Es taugt, um grobe Fehlgriffe zu
 * finden — etwa einen Korridor, der um den Faktor drei danebenliegt.
 */

import {
  COMBO_MAX_STUFE,
  COMBO_SCHRITT,
  GENAU_PERFEKT,
  PUNKTE,
  RUNDEN_BONUS,
  STRAFE_MS,
  guete,
  punkteFuer,
  rundeBauen,
} from '../src/components/truhen-regeln.js'

/* Diese beiden Werte stehen in spiel-lauf.js und begrenzen den Lauf. */
const DAUER_MS = 30000
const STRAFE_MAX_MS = 10000

/**
 * Die vier Spielertypen.
 *
 *   sigma     Zeitstreuung des Stopps in Millisekunden
 *   denken    Bedenkzeit vor jedem Stopp in Millisekunden
 *   falle     Wahrscheinlichkeit, je Attrappe auf die falsche zu stoppen
 *   geduld    Anteil der Faelle, in denen auf die naechste Umdrehung gewartet
 *             wird, statt schlecht zu stoppen (gute Spieler warten oefter)
 */
const TYPEN = [
  { name: 'Erstspieler', sigma: 90, denken: 480, falle: 0.18, geduld: 0.08 },
  { name: 'Geuebt', sigma: 60, denken: 320, falle: 0.08, geduld: 0.14 },
  { name: 'Gut', sigma: 40, denken: 230, falle: 0.03, geduld: 0.18 },
  { name: 'Spitze', sigma: 26, denken: 180, falle: 0.01, geduld: 0.2 },
]

/** Normalverteilte Zufallszahl (Box-Muller), Mittelwert 0, Streuung 1. */
function normal() {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Ein vollstaendiger Lauf. Gibt Punkte und erreichte Runde zurueck. */
function lauf(typ) {
  let restMs = DAUER_MS
  let strafeSumme = 0
  let punkte = 0
  let combo = 0
  let runde = 1
  let perfekte = 0
  let stopps = 0

  while (restMs > 0 && runde < 40) {
    const ringe = rundeBauen(runde)

    for (const ring of ringe) {
      let fest = false
      let ersterVersuch = true

      while (!fest && restMs > 0) {
        /* Warten, bis die Markierung wieder vorbeikommt. Beim ersten Versuch
           steht der Ring zufaellig, also im Mittel eine halbe Umdrehung;
           nach einem Fehlgriff steht er kurz hinter der Marke, also fast eine
           ganze. */
        const umlaufMs = (360 / ring.tempo) * 1000
        const wartenMs = ersterVersuch ? umlaufMs * Math.random() : umlaufMs * 0.92
        ersterVersuch = false

        /* Geduldige Spieler lassen einen ungünstigen Anlauf verstreichen. */
        const extraMs = Math.random() < typ.geduld ? umlaufMs : 0

        restMs -= wartenMs + extraMs + typ.denken
        stopps += 1
        if (restMs <= 0) break

        /* Auf eine falsche Markierung gestoppt: sicherer Fehlgriff. */
        const aufFalle = Math.random() < typ.falle * ring.attrappen.length
        if (aufFalle) {
          combo = 0
          const strafe = Math.min(STRAFE_MS, STRAFE_MAX_MS - strafeSumme)
          strafeSumme += strafe
          restMs -= strafe
          continue
        }

        /* Ein Ring, der die Richtung wechselt, ist schlechter vorhersagbar. */
        const unruhe = ring.wechselMs > 0 ? 1.35 : 1
        /* Aus der Zeitstreuung wird ueber das Tempo ein Winkelfehler.
           110 ms daneben sind bei 74 Grad/s acht Grad, bei 268 Grad/s
           dreissig — deshalb sind schnelle Ringe von selbst schwerer. */
        const winkelFehler = (ring.tempo * normal() * typ.sigma * unruhe) / 1000
        const art = guete(Math.abs(winkelFehler), ring.zone)

        if (art === null) {
          combo = 0
          const strafe = Math.min(STRAFE_MS, STRAFE_MAX_MS - strafeSumme)
          strafeSumme += strafe
          restMs -= strafe
          continue
        }

        combo = art === 'treffer' ? Math.max(combo, 1) : combo + 1
        punkte += punkteFuer(art, combo)
        if (art === 'perfekt') perfekte += 1
        fest = true
      }

      if (restMs <= 0) break
    }

    if (restMs <= 0) break
    punkte += RUNDEN_BONUS * runde
    runde += 1
  }

  return { punkte, runde: runde - 1, perfekteQuote: stopps ? perfekte / stopps : 0 }
}

function quantil(sortiert, q) {
  const i = Math.min(sortiert.length - 1, Math.max(0, Math.round((sortiert.length - 1) * q)))
  return sortiert[i]
}

const laeufe = Number(process.argv[2]) || 4000
const tausend = (n) => Math.round(n).toLocaleString('de-DE')

console.log(`\nTruhenknacker — ${tausend(laeufe)} Laeufe je Typ`)
console.log(`Punkte: perfekt ${PUNKTE.perfekt} · gut ${PUNKTE.gut} · treffer ${PUNKTE.treffer}`)
console.log(
  `Rundenbonus ${RUNDEN_BONUS} · Combo bis x${(1 + COMBO_MAX_STUFE * COMBO_SCHRITT).toFixed(2)}` +
    ` · perfekt ab ${GENAU_PERFEKT}\n`,
)
console.log('Typ           Median      Bereich (10–90%)        Spitze     Runde   perfekt')
console.log('─'.repeat(80))

for (const typ of TYPEN) {
  const ergebnisse = Array.from({ length: laeufe }, () => lauf(typ))
  const punkte = ergebnisse.map((e) => e.punkte).sort((a, b) => a - b)
  const runden = ergebnisse.map((e) => e.runde).sort((a, b) => a - b)
  const perfekt = ergebnisse.reduce((s, e) => s + e.perfekteQuote, 0) / laeufe

  console.log(
    typ.name.padEnd(13) +
      tausend(quantil(punkte, 0.5)).padStart(7) +
      '   ' +
      `${tausend(quantil(punkte, 0.1))} – ${tausend(quantil(punkte, 0.9))}`.padStart(18) +
      '   ' +
      tausend(quantil(punkte, 0.995)).padStart(9) +
      '   ' +
      String(quantil(runden, 0.5)).padStart(5) +
      '   ' +
      `${Math.round(perfekt * 100)} %`.padStart(7),
  )
}

console.log('\nZiel: 2.000–6.000 · 7.000–13.000 · 14.000–20.000 · darueber selten\n')
