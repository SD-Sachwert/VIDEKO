/**
 * TRUHENKNACKER — die Spielregeln, getrennt von der Darstellung.
 *
 * Warum eine eigene Datei: die Schwierigkeit dieses Spiels ist nichts, was
 * man sich ausdenken und dann hoffen kann. Sie muss an echten Punktzahlen
 * nachgerechnet werden. Die Komponente ist JSX und laesst sich in Node nicht
 * laden; dieses Modul ist reines JavaScript und wird sowohl von
 * TruhenKnacker.jsx als auch von scripts/truhen-simulation.mjs gelesen.
 * Damit gibt es genau eine Quelle fuer Tempo, Zonen und Punkte — eine
 * Simulation, die andere Zahlen benutzt als das Spiel, waere wertlos.
 *
 * Hier steht keine Optik und kein React. Nur: wie schnell dreht sich was, wie
 * breit ist die Trefferzone, was bringt ein Treffer.
 *
 * ZIELKORRIDOR — und was die Simulation dazu sagt
 * -----------------------------------------------
 *                        Vorgabe            gemessen (Median, 10-90 %)
 *   Erstspieler       2.000 –  6.000        4.500   (3.000 –  7.100)
 *   Geuebt            7.000 – 13.000        7.900   (5.100 – 11.400)
 *   Gute Spieler     14.000 – 20.000       13.200   (9.000 – 18.600)
 *   Spitze           deutlich darueber     22.000  (15.500 – 30.000)
 *
 * Gemessen mit 8.000 Laeufen je Spielertyp. Das oberste Halbprozent der
 * Spitzenspieler liegt bei knapp 40.000 — moeglich, aber selten, so wie
 * vorgegeben. Kein Typ loest das Spiel: selbst die Spitze kommt im Median
 * nur bis Runde 5.
 *
 * Wer die Zahlen unten anfasst, laesst die Simulation danach erneut laufen.
 */

/* Geometrie. Der Kreismittelpunkt ist (110|110), vier moegliche Bahnen. */
export const MITTE = 110

export const BAHNEN = [
  { r: 92, dicke: 13 },
  { r: 72, dicke: 12 },
  { r: 52, dicke: 11 },
  { r: 32, dicke: 10 },
]

/**
 * Punkte je Treffergüte.
 *
 * Der Abstand zwischen `treffer` und `perfekt` ist Absicht und gross: ein
 * gerade noch erwischter Ring soll sich anders anfuehlen als ein sitzender.
 * Wer nur "irgendwie" trifft, kommt damit nicht ueber den mittleren Bereich
 * hinaus, egal wie lange er spielt.
 */
export const PUNKTE = { perfekt: 780, gut: 240, treffer: 70 }

/** Bonus fuer eine abgeschlossene Runde, multipliziert mit der Rundennummer. */
export const RUNDEN_BONUS = 480

/** Ab dieser ComboStufe waechst der Faktor nicht weiter. */
export const COMBO_MAX_STUFE = 10

/** Zuwachs je Comboschritt. */
export const COMBO_SCHRITT = 0.2

/** Was ein verkanteter Ring an Spielzeit kostet. */
export const STRAFE_MS = 1600

/**
 * Wie genau ein Treffer sein muss — Anteile der halben Trefferzone.
 *
 * 0,16 heisst: vom gesamten Trefferfenster gelten die mittleren 16 Prozent
 * als perfekt. Das ist bewusst schmal. In Version 2.0 waren es 22 Prozent,
 * und damit kam auch ein mittelmaessiger Lauf fast durchgaengig auf perfekt.
 */
export const GENAU_PERFEKT = 0.2
export const GENAU_GUT = 0.48

/** Falsche Markierungen sitzen an festen Stellen — nie in der Naehe der echten. */
export const ATTRAPPEN_WINKEL = [132, 228, 96, 264, 156, 204]

/** Obergrenze fuer das Tempo. Darueber ist es kein Koennen mehr, sondern Glueck. */
export const TEMPO_MAX = 340

/** Untergrenze fuer die Trefferzone, in Grad. */
export const ZONE_MIN = 20

/**
 * Die Ringe einer Runde.
 *
 * Die Steigerung liegt auf vier Achsen gleichzeitig, damit keine davon allein
 * zu steil sein muss:
 *
 *   Tempo        waechst mit der Runde und nach innen
 *   Trefferzone  schrumpft mit der Runde und nach innen
 *   Gegenlauf    ab Runde 2 laufen die Ringe gegeneinander
 *   Richtungs-
 *   wechsel      ab Runde 3, und das Intervall wird kuerzer
 *   Attrappen    ab Runde 2, ab Runde 4 zwei, ab Runde 6 drei
 *
 * Ein vierter Ring kommt ab Runde 3 dazu. Mehr als vier waeren auf einem
 * Telefon nicht mehr zu unterscheiden.
 */
export function rundeBauen(runde, sanft = false, zufall = Math.random) {
  const anzahl = runde <= 2 ? 3 : 4
  const gegenlauf = runde >= 2 && runde % 2 === 0 ? -1 : 1

  return Array.from({ length: anzahl }, (unbenutzt, n) => {
    const tempo = Math.min(TEMPO_MAX, 150 + n * 36 + (runde - 1) * 24)
    const zone = Math.max(ZONE_MIN, 64 - n * 8 - (runde - 1) * 5)
    const attrappen = runde >= 6 ? 3 : runde >= 4 ? 2 : runde >= 2 ? 1 : 0

    /* Der Richtungswechsel beginnt in Runde 3 bei 1,6 Sekunden und wird je
       Runde 150 ms kuerzer — nicht unter 700 ms, sonst zittert der Ring nur
       noch auf der Stelle, statt eine Richtung zu haben. */
    const wechselMs = runde >= 3 ? Math.max(700, 1600 - (runde - 3) * 150) : 0

    return {
      bahn: BAHNEN[n],
      /* Sanfter Modus fuer prefers-reduced-motion: langsamer und mit
         groesserer Zone, damit das Spiel spielbar bleibt statt zu flimmern. */
      tempo: sanft ? tempo * 0.55 : tempo,
      zone: sanft ? Math.min(80, zone * 1.3) : zone,
      richtung: (n % 2 === 0 ? 1 : -1) * gegenlauf,
      wechselMs: sanft ? 0 : wechselMs,
      attrappen: ATTRAPPEN_WINKEL.slice(0, attrappen).map((winkel, i) => ({
        winkel,
        breite: zone * (i === 0 ? 0.95 : 1.1),
      })),
      /* Der erste Ring der ersten Runde startet gegenueber der Markierung:
         niemand soll beim Start sofort stoppen muessen. */
      start: runde === 1 && n === 0 ? 180 : zufall() * 360,
    }
  })
}

/** Winkel auf [-180, 180) bringen — so ist der Abstand zur Markierung vorzeichenbehaftet. */
export function abstand(winkel) {
  const w = ((winkel % 360) + 540) % 360
  return w - 180
}

/**
 * Treffergüte aus Winkelabstand und Zonenbreite.
 * `null` heisst: daneben, das Schloss verkantet.
 */
export function guete(weg, zone) {
  const halb = zone / 2
  if (weg > halb) return null
  const genau = weg / halb
  if (genau <= GENAU_PERFEKT) return 'perfekt'
  if (genau <= GENAU_GUT) return 'gut'
  return 'treffer'
}

/** Punkte fuer einen Treffer bei gegebener Combostufe. */
export function punkteFuer(art, combo) {
  const faktor = 1 + Math.min(Math.max(combo, 1) - 1, COMBO_MAX_STUFE) * COMBO_SCHRITT
  return Math.round(PUNKTE[art] * faktor)
}
