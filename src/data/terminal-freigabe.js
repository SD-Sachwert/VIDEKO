/**
 * Oeffentliche Freigabe des Tresor-Terminals.
 *
 * Nach dem Stadtfest 2026 war der Terminal voruebergehend abgeschaltet.
 * Seit 01.10.2026 ist er wieder bewusst oeffentlich erreichbar, damit wir
 * auf dem bestehenden Stand weiterbauen koennen.
 *
 * WAS DER SCHALTER TUT
 * --------------------
 * TERMINAL_CODE_ENABLED ist die lokale, versionierte Betriebsfreigabe.
 * Solange sie true ist, ist der Terminal oeffentlich aktiv - unabhaengig davon,
 * ob in Vercel noch ein alter TERMINAL_PUBLIC_ENABLED-Wert fehlt oder auf false
 * steht. Das ist absichtlich so, weil die Wiederinbetriebnahme ueber Code und
 * nicht ueber eine Vercel-ENV erfolgt.
 *
 * Wenn TERMINAL_CODE_ENABLED spaeter wieder auf false gesetzt wird, greift
 * erneut die Umgebungsvariable TERMINAL_PUBLIC_ENABLED: nur deren Wert `true`
 * schaltet den Terminal dann frei.
 *
 * Aktiv bedeutet:
 *   - /terminal und die Unterseiten sind wieder als Routen vorhanden.
 *   - Prerender schreibt die statischen Terminal-Seiten wieder.
 *   - /api/terminal, /api/terminal-admin und /api/terminal-instagram laufen
 *     wieder durch ihre normalen Auth-/Konfigurationspruefungen statt am
 *     vorgelagerten 404-Gate zu enden.
 *
 * Unveraendert:
 *   - Es wird nichts an Datenbank, Scores, Teilnehmern oder Ziehungen geaendert.
 *   - Admin-Schutz, Rate-Limits und alle bestehenden Terminal-Regeln bleiben.
 *   - Der Instagram-Cron wird hierdurch NICHT aktiviert.
 */

/**
 * Versionierte Betriebsfreigabe.
 *
 * true  = Terminal ist bewusst wieder live.
 * false = Vercel-ENV TERMINAL_PUBLIC_ENABLED entscheidet wieder.
 */
export const TERMINAL_CODE_ENABLED = true

/** Liest den effektiven Schalter fuer Server, Build und Prerender. */
export function terminalFreigabeAus(wert) {
  if (TERMINAL_CODE_ENABLED) return true
  return String(wert ?? '').trim().toLowerCase() === 'true'
}

/* Im Browser- und SSR-Bundle ersetzt Vite `__TERMINAL_PUBLIC_ENABLED__`
   (vite.config.js bzw. scripts/_prerender-bundle.mjs) durch true/false. Die
   typeof-Pruefung haelt das Modul auch dort lauffaehig, wo nicht ersetzt
   wird — dann gilt: zu. */
/* global __TERMINAL_PUBLIC_ENABLED__ */
export const TERMINAL_OEFFENTLICH =
  typeof __TERMINAL_PUBLIC_ENABLED__ !== 'undefined' && __TERMINAL_PUBLIC_ENABLED__ === true
