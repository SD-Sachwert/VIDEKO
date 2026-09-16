/**
 * VIDEKO SLAM — was aus den Fronten kommt.
 *
 * Reine Daten, kein React, kein DOM: die Liste wird von slam-logik.js
 * gezogen und von scripts/spiele/slam-logik-test.mjs geprueft.
 *
 * DREI ARTEN
 * ----------
 * `gut`      — gehoert ins Haus. Schlagen bringt Punkte.
 * `schlecht` — gehoert in den Container. Schlagen kostet Zeit.
 * `spezial`  — seltene Dinger mit eigener Wirkung (siehe WIRKUNG).
 *
 * Die guten Sachen decken absichtlich das ganze VIDEKO-Feld ab und nicht nur
 * die Kueche: Bad, Boden, Wand, Decke, Elektro, Photovoltaik, Licht, Haus.
 * Fremde Marken kommen darin nicht vor — die Dinge heissen, was sie sind.
 *
 * `bild` ist der Schluessel in die Strichzeichnungen in VidekoSlam.jsx.
 */

/** Wirkung der Spezialobjekte — die Logik liest nur diese Schluessel. */
export const WIRKUNG = {
  /** Fettes Punktepaket, sonst nichts. */
  gold: 'gold',
  /** Alles Sichtbare bleibt laenger stehen, neue Sachen kommen langsamer. */
  frost: 'frost',
  /** Raeumt in diesem Moment jeden Mist vom Feld. */
  hitze: 'hitze',
  /** Kurze Phase: alles gleichzeitig, doppelte Punkte. */
  chaos: 'chaos',
  /** Osterei. Kostet nichts, bringt wenig, sagt aber hallo. */
  ente: 'ente',
}

export const OBJEKTE = [
  /* --- gehoert ins Haus ------------------------------------------------ */
  { id: 'schrauber', name: 'AKKUSCHRAUBER', art: 'gut', bild: 'schrauber' },
  { id: 'pv', name: 'PV-MODUL', art: 'gut', bild: 'pv' },
  { id: 'leuchte', name: 'PENDELLEUCHTE', art: 'gut', bild: 'leuchte' },
  { id: 'armatur', name: 'KOCHENDWASSERHAHN', art: 'gut', bild: 'armatur' },
  { id: 'stuhl', name: 'DESIGNSTUHL', art: 'gut', bild: 'stuhl' },
  { id: 'waschtisch', name: 'WASCHTISCH', art: 'gut', bild: 'waschtisch' },
  { id: 'kochmuetze', name: 'KOCHMÜTZE', art: 'gut', bild: 'kochmuetze' },
  { id: 'schluessel', name: 'HAUSSCHLÜSSEL', art: 'gut', bild: 'schluessel' },
  { id: 'barren', name: 'GOLDBARREN', art: 'gut', bild: 'barren' },
  { id: 'diele', name: 'PARKETTDIELE', art: 'gut', bild: 'diele' },
  { id: 'dose', name: 'SCHALTERDOSE', art: 'gut', bild: 'dose' },
  { id: 'decke', name: 'SPANNDECKE', art: 'gut', bild: 'decke' },

  /* --- gehoert in den Container ---------------------------------------- */
  { id: 'klobuerste', name: 'KLOBÜRSTE', art: 'schlecht', bild: 'klobuerste' },
  { id: 'ziegel', name: 'KAPUTTER ZIEGEL', art: 'schlecht', bild: 'ziegel' },
  { id: 'schuh', name: 'ALTER SCHUH', art: 'schlecht', bild: 'schuh' },
  { id: 'kabelsalat', name: 'KABELSALAT', art: 'schlecht', bild: 'kabelsalat' },
  { id: 'toast', name: 'BRENNENDER TOAST', art: 'schlecht', bild: 'toast' },
  { id: 'muellsack', name: 'MÜLLSACK', art: 'schlecht', bild: 'muellsack' },
  { id: 'saege', name: 'ROSTIGE SÄGE', art: 'schlecht', bild: 'saege' },

  /* --- selten ----------------------------------------------------------- */
  { id: 'gold', name: 'VIDEKO GOLD', art: 'spezial', wirkung: WIRKUNG.gold, bild: 'emblem' },
  { id: 'kuehlschrank', name: 'KÜHLSCHRANK', art: 'spezial', wirkung: WIRKUNG.frost, bild: 'kuehlschrank' },
  { id: 'backofen', name: 'BACKOFEN', art: 'spezial', wirkung: WIRKUNG.hitze, bild: 'backofen' },
  { id: 'chaos', name: 'BAUSTELLEN-CHAOS', art: 'spezial', wirkung: WIRKUNG.chaos, bild: 'sirene' },
  { id: 'ente', name: 'GUMMIENTE', art: 'spezial', wirkung: WIRKUNG.ente, bild: 'ente' },
]

export const OBJEKT_NACH_ID = Object.fromEntries(OBJEKTE.map((o) => [o.id, o]))
export const GUTE = OBJEKTE.filter((o) => o.art === 'gut')
export const SCHLECHTE = OBJEKTE.filter((o) => o.art === 'schlecht')
export const SPEZIALE = OBJEKTE.filter((o) => o.art === 'spezial')

/**
 * Trockene Sprueche. Sie tragen keine Information — die steht in den Punkten
 * darueber — sondern nur den Ton der Baustelle. Sie laufen reihum, damit
 * nicht zweimal hintereinander derselbe faellt.
 */
export const SPRUECHE = {
  /** Mist geschlagen. */
  fehler: [
    'DAS WAR NICHT IM LEISTUNGSVERZEICHNIS.',
    'WER HAT DAS AUFGEMESSEN?',
    'DER ELEKTRIKER WAR’S.',
    'SO WAR DAS NICHT GEPLANT.',
    'DAS GEHT AUF REGIE.',
  ],
  /** Gutes durchgelassen. */
  verpasst: [
    'PASST. FAST.',
    'WAR DA WAS?',
    'GEHT NOCH SCHNELLER.',
  ],
  /** Lange Serie. */
  serie: [
    'SITZT.',
    'SAUBERE ARBEIT.',
    'ABNAHME OHNE MÄNGEL.',
  ],
}

/** Der n-te Spruch einer Gruppe (n ab 0), reihum. */
export function spruch(gruppe, n) {
  const liste = SPRUECHE[gruppe]
  if (!liste || !liste.length) return ''
  return liste[Math.max(0, Math.floor(n)) % liste.length]
}
