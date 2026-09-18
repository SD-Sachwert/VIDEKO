/**
 * Oeffentliche Freigabe des Tresor-Terminals.
 *
 * Temporaer deaktiviert nach Stadtfest 2026. Fuer zukuenftiges VIDEKO
 * Community Game vorgesehen.
 *
 * WAS DER SCHALTER TUT
 * --------------------
 * Die Umgebungsvariable TERMINAL_PUBLIC_ENABLED steuert, ob das Terminal nach
 * aussen existiert. Nur der Wert `true` schaltet es frei; fehlt die Variable
 * oder steht etwas anderes darin, ist es zu. Gesperrt heisst:
 *
 *   - /terminal und alle Unterseiten (Rangliste, Ziehung, Admin,
 *     Teilnahmebedingungen, Einladungen) liefern die normale 404-Seite.
 *     Der Prerender schreibt fuer sie kein HTML, die App kennt die Routen
 *     nicht (auch nicht bei Navigation innerhalb der SPA).
 *   - /api/terminal, /api/terminal-admin und /api/terminal-instagram
 *     antworten mit 404, bevor sie irgendetwas lesen oder schreiben. Damit
 *     entstehen keine neuen Teilnehmer, Scores, Deckelaktivierungen,
 *     Einladungen oder Ziehungen.
 *
 * WAS ER NICHT TUT
 * ----------------
 * Nichts wird geloescht: Datenbank (videko-core-pilot), Migrationen, Games,
 * Admin, Ranking, Ziehung, Instagram-Sync und alle Umgebungsvariablen
 * (INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID, CRON_SECRET, TERMINAL_*) bleiben
 * unveraendert erhalten.
 *
 * WIEDER AKTIVIEREN
 * -----------------
 * 1. In Vercel (Production) TERMINAL_PUBLIC_ENABLED=true setzen.
 * 2. Den Instagram-Cron wieder in vercel.json eintragen:
 *      "crons": [{ "path": "/api/terminal-instagram", "schedule": "0 * * * *" }]
 * 3. Neu deployen. Der Wert wird zur Build-Zeit ins Frontend uebernommen —
 *    ein reines Umstellen der Variable ohne neuen Build reicht fuer die
 *    Seiten nicht, fuer die APIs schon.
 */

/** Liest den Schalter aus einem Umgebungswert (Server, Build, Prerender). */
export function terminalFreigabeAus(wert) {
  return String(wert ?? '').trim().toLowerCase() === 'true'
}

/* Im Browser- und SSR-Bundle ersetzt Vite `__TERMINAL_PUBLIC_ENABLED__`
   (vite.config.js bzw. scripts/_prerender-bundle.mjs) durch true/false. Die
   typeof-Pruefung haelt das Modul auch dort lauffaehig, wo nicht ersetzt
   wird — dann gilt: zu. */
/* global __TERMINAL_PUBLIC_ENABLED__ */
export const TERMINAL_OEFFENTLICH =
  typeof __TERMINAL_PUBLIC_ENABLED__ !== 'undefined' && __TERMINAL_PUBLIC_ENABLED__ === true
