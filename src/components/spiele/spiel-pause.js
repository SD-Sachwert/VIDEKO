/**
 * SPIEL-PAUSE — eine Bremse, die jedes Spiel versteht.
 *
 * Die Game-Shell kann eine laufende Runde minimieren. Dabei darf zweierlei
 * nicht passieren: die Uhr darf nicht heimlich weiterlaufen (das erledigt
 * spiel-lauf.js), und die Simulation darf nicht weiterrechnen, waehrend
 * niemand hinschaut. Genau dafuer ist diese Datei da.
 *
 * WARUM NICHT EINFACH `laeuft` AUSSCHALTEN
 * ----------------------------------------
 * Die Spielfelder haengen an `laeuft`: VidekoJump rendert seine Buehne hinter
 * `{laeuft && …}`. Wer `laeuft` umlegt, wirft das Canvas weg und damit die
 * ganze Runde. Die Pause laeuft deshalb an `laeuft` vorbei — ueber ein
 * eigenes, winziges Register je Spiel-Key.
 *
 * WIE EIN SPIEL SIE BENUTZT
 * -------------------------
 * Ganz oben in der rAF-Schleife:
 *
 *     if (istPausiert(GAME)) { vorher = jetzt; frame = requestAnimationFrame(schleife); return }
 *
 * Das haelt die Physik an, laesst das Canvas stehen und setzt den
 * Zeitabstand zurueck — sonst kaeme nach dem Weiterspielen ein einziger
 * riesiger Schritt, und die Figur waere tot, bevor der Finger wieder da ist.
 *
 * Das Register ist bewusst global und nicht React-State: die Schleife liest
 * es 60-mal je Sekunde und soll dafuer kein Rendern ausloesen.
 */

const pausen = new Set()
const hoerer = new Set()

/** Setzt oder loescht die Pause fuer genau ein Spiel. */
export function pauseSetzen(game, an) {
  if (!game) return
  const vorher = pausen.has(game)
  if (an) pausen.add(game)
  else pausen.delete(game)
  if (pausen.has(game) === vorher) return
  for (const f of hoerer) {
    try {
      f(game, Boolean(an))
    } catch {
      /* Ein taubes Ohr darf die anderen nicht mitnehmen. */
    }
  }
}

/** Die Frage, die die Spielschleife jeden Frame stellt. */
export const istPausiert = (game) => Boolean(game) && pausen.has(game)

/** Fuer Spiele, die beim Pausieren noch etwas erledigen wollen (Ton aus). */
export function pauseHoeren(f) {
  hoerer.add(f)
  return () => hoerer.delete(f)
}

/** Nur fuer Tests und den Abbau: alles wieder freigeben. */
export function pausenLeeren() {
  const offen = [...pausen]
  pausen.clear()
  for (const game of offen) {
    for (const f of hoerer) {
      try {
        f(game, false)
      } catch {
        /* siehe oben */
      }
    }
  }
}
