/**
 * VIDEKO-Baustellenindex — das taegliche, automatisch gerechnete Baubarometer
 * von /entdecken.
 *
 * WAS DAS IST — UND WAS NICHT
 * ---------------------------
 * Die Prozentwerte sind KEIN belegter, pruefbarer Baufortschritt. Sie sind ein
 * bewusst launiges Stimmungsbarometer. Die Seite sagt das an mehreren Stellen
 * ausdruecklich („Vom Bauleiter ausdruecklich nicht geprueft.“,
 * „wissenschaftlich ungefaehr“) — der Index darf lustig sein, aber er darf
 * niemandem etwas vormachen.
 *
 * WARUM ER NICHT MEHR AUF DEN 01.12. ZULAEUFT
 * -------------------------------------------
 * Die frueheren Kurven liefen alle punktgenau zum Eroeffnungstermin auf ihren
 * Zielwert — mathematisch waere am 30.11. also alles fertig gewesen. Das war
 * eine Behauptung, die wir nicht halten koennen. Es gibt deshalb kein Zieldatum
 * mehr in der Rechnung. Jeder Bereich waechst fuer sich, in seinem eigenen
 * Tempo, gegen seine eigene Obergrenze — und manche waechst gar nicht, weil sie
 * auf ein echtes Ereignis wartet.
 *
 * DREI MODI
 * ---------
 *   AUTO           waechst taeglich von selbst gegen `softCap`.
 *   AUTO_BIS_GATE  waechst von selbst, aber nur bis `preDeliveryCap`; erst wenn
 *                  das Gate faellt, laeuft er weiter gegen `softCap`.
 *   GATED          steht exakt auf `basePercent` und ruehrt sich keinen Punkt,
 *                  bis das Gate faellt. Danach waechst er wie ein AUTO-Bereich.
 *
 * Das Gate ist ein Datum in data/entdecken.js (BAUSTELLEN_GATES). Solange es
 * `null` ist, passiert nichts — kein taeglicher Pflegeaufwand, ein einziger
 * Eintrag setzt spaeter alles in Bewegung.
 *
 * WARUM DETERMINISTISCH
 * ---------------------
 * Es gibt keine Datenbank, keine API, keinen Cronjob und niemanden, der taeglich
 * Zahlen pflegt. Der Wert eines Bereichs an einem Tag ergibt sich allein aus
 * (Bereichs-ID, Datum, Gate) — derselbe Tag liefert nach jedem Reload denselben
 * Wert, auf jedem Geraet. Kein Math.random() beim Rendern.
 *
 * WIE DIE KURVE ENTSTEHT
 * ----------------------
 * Jeder Tag bekommt pro Bereich ein Gewicht aus einem FNV-1a-Hash ueber
 * `id|YYYY-MM-DD`, gestreckt auf [1-variance, 1+variance]. Aufsummiert und mit
 * `dailyPace` multipliziert ergibt das den bisher „geleisteten Aufwand“ c. Der
 * angezeigte Wert naehert sich damit asymptotisch der Obergrenze:
 *
 *     wert = cap - (cap - start) * e^(-c / (cap - start))
 *
 * Anfangs entspricht das fast genau `dailyPace` Punkten pro Tag, spaeter wird es
 * zaeher — und die Obergrenze wird nie erreicht. Gewichte sind positiv, also
 * sinkt kein Wert jemals. Jeder Bereich hat eigene Gewichte, also gibt es Tage
 * ohne sichtbare Bewegung und Tage mit zwei Punkten.
 *
 * KEIN AUTOMATISCHES 100 %
 * ------------------------
 * Ohne `completedAt` ist bei 99 % Schluss — auch lange nach dem 01.12. 100 %
 * gibt es nur, wenn jemand einen Bereich bewusst als fertig eintraegt. Das
 * verhindert, dass die Seite eine Fertigstellung behauptet, die es nicht gibt.
 */

const TAG_MS = 86400000

/** Basistag des Index und der geplante Eroeffnungstag (nur noch Anzeige). */
export const INDEX_BASIS = '2026-09-02'
export const INDEX_ZIEL = '2026-12-01'

/** Die drei Wachstumsmodi. Siehe Kopfkommentar. */
export const MODUS = {
  AUTO: 'auto',
  AUTO_BIS_GATE: 'auto-bis-gate',
  GATED: 'gated',
}

/**
 * Heutiger Kalendertag als `YYYY-MM-DD` — immer in Europe/Berlin, damit der
 * Index fuer einen Besucher in Tokio denselben Tag zeigt wie fuer uns.
 * `en-CA` liefert genau dieses ISO-Format.
 */
const TAGES_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function heutigerTag(zeitpunkt = new Date()) {
  return TAGES_FORMAT.format(zeitpunkt)
}

/** Kalendertag -> fortlaufende Tagesnummer (UTC-Mitternacht, zeitzonenfrei). */
function tagesNummer(iso) {
  const [jahr, monat, tag] = String(iso).split('-').map(Number)
  return Math.round(Date.UTC(jahr, monat - 1, tag) / TAG_MS)
}

/** Tagesnummer -> Kalendertag. Umkehrung von tagesNummer(). */
function tagesIso(nummer) {
  const d = new Date(nummer * TAG_MS)
  const zwei = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${zwei(d.getUTCMonth() + 1)}-${zwei(d.getUTCDate())}`
}

/** Kalendertag um `tage` verschieben. Negative Werte gehen zurueck. */
export function tagVerschieben(iso, tage) {
  return tagesIso(tagesNummer(iso) + tage)
}

/**
 * Ganze Kalendertage von `von` bis `bis`. Positiv, wenn `bis` spaeter liegt.
 * Rechnet ueber Tagesnummern, also ohne Sommerzeit- und Jahreswechselfallen.
 */
export function tageZwischen(von, bis) {
  const a = tagesNummer(von)
  const b = tagesNummer(bis)
  return Number.isFinite(a) && Number.isFinite(b) ? b - a : 0
}

/**
 * FNV-1a, 32 Bit. Klein, schnell, streut kurze Zeichenketten gut — und vor
 * allem: ueberall exakt gleich, weil nur ganzzahlige Operationen vorkommen
 * (Math.imul statt `*`, sonst verliert die Gleitkommazahl Bits).
 */
function fnv1a(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Tagesgewicht eines Bereichs: reproduzierbar in [1-variance, 1+variance]. */
function tagesGewicht(id, iso, variance) {
  return 1 - variance + (fnv1a(`${id}|${iso}`) / 4294967296) * variance * 2
}

/**
 * Kumulierte Tagesgewichte eines Bereichs ab seinem Basistag, einmal berechnet
 * und dann gehalten. Die Reihe waechst nur so weit, wie tatsaechlich gefragt
 * wird — und hoechstens ueber ein paar Jahre, falls jemand mit falsch gestellter
 * Uhr vorbeikommt.
 */
const MAX_TAGE = 4000
const kurven = new Map()

function kumuliert(bereich, n) {
  const start = tagesNummer(bereich.baseDate || INDEX_BASIS)
  if (!Number.isFinite(n) || n <= start) return 0

  let k = kurven.get(bereich.id)
  if (!k) {
    k = { start, summen: [0] }
    kurven.set(bereich.id, k)
  }

  const brauch = Math.min(n - start, MAX_TAGE)
  while (k.summen.length <= brauch) {
    const i = k.summen.length
    k.summen.push(
      k.summen[i - 1] + tagesGewicht(bereich.id, tagesIso(start + i), bereich.variance ?? 0.5)
    )
  }
  return k.summen[brauch]
}

/**
 * Asymptotische Annaeherung an eine Obergrenze. `aufwand` ist die mit
 * `dailyPace` gewichtete Summe der Tagesgewichte; anfangs entspricht ein
 * Aufwandspunkt fast genau einem Prozentpunkt, spaeter immer weniger. Die
 * Grenze wird nie erreicht — deshalb steht am 30.11. nichts auf 99.
 */
function annaehern(start, cap, aufwand) {
  const spanne = cap - start
  if (!(spanne > 0) || !(aufwand > 0)) return start
  return cap - spanne * Math.exp(-aufwand / spanne)
}

/** Tagesnummer, an der das Gate eines Bereichs faellt — `null`, solange offen. */
function gateNummer(bereich, gates) {
  if (!bereich.gate) return null
  const datum = gates ? gates[bereich.gate] : null
  return datum ? tagesNummer(datum) : null
}

/** Roher Prozentwert mit Nachkommastellen, damit die Tagesdifferenz stimmt. */
function rohProzent(bereich, n, gateN) {
  const pace = bereich.dailyPace || 0
  const base = bereich.basePercent

  if (bereich.modus === MODUS.GATED) {
    // Steht. Punkt. Bis das Gate faellt, passiert hier gar nichts.
    if (gateN === null || n <= gateN) return base
    const aufwand = (kumuliert(bereich, n) - kumuliert(bereich, gateN)) * pace
    return annaehern(base, bereich.softCap, aufwand)
  }

  if (bereich.modus === MODUS.AUTO_BIS_GATE) {
    // Waechst von selbst, aber nur bis zur Vorlieferungs-Obergrenze.
    const bisGate = gateN === null ? n : Math.min(n, gateN)
    const vorher = annaehern(base, bereich.preDeliveryCap, kumuliert(bereich, bisGate) * pace)
    if (gateN === null || n <= gateN) return vorher
    // Danach laeuft dieselbe Kurve weiter — nahtlos, ohne Sprung.
    const aufwand =
      (kumuliert(bereich, n) - kumuliert(bereich, gateN)) * (bereich.gatePace || pace)
    return annaehern(vorher, bereich.softCap, aufwand)
  }

  return annaehern(base, bereich.softCap, kumuliert(bereich, n) * pace)
}

/**
 * Angezeigter Wert eines Bereichs: ganze Zahl, nie unter 0.
 *
 * 100 % gibt es ausschliesslich ueber `completedAt` — ohne diesen Eintrag ist
 * bei 99 % Schluss, egal wie lange die Kurve laeuft.
 */
export function bereichsProzent(bereich, iso, gates) {
  const n = tagesNummer(iso)
  if (bereich.completedAt && n >= tagesNummer(bereich.completedAt)) return 100
  return Math.max(0, Math.min(99, Math.round(rohProzent(bereich, n, gateNummer(bereich, gates)))))
}

/** Steht der Bereich blockiert still? Nur GATED-Bereiche vor ihrem Gate. */
function istGesperrt(bereich, n, gateN) {
  if (bereich.modus !== MODUS.GATED) return false
  return gateN === null || n <= gateN
}

/**
 * Status-Stufen der einzelnen Karte. Zweite, automatische Zeile — der
 * handgeschriebene Text des Bereichs bleibt die Hauptaussage.
 */
export const STATUS_STUFEN = [
  { ab: 100, text: 'Fertig. Angeblich.' },
  { ab: 95, text: 'Fast fertig. Also theoretisch.' },
  { ab: 80, text: 'Nur noch ungefähr 742 Kleinigkeiten.' },
  { ab: 65, text: 'Jetzt wird’s langsam ernst.' },
  { ab: 45, text: 'Gefährlich nah an Fortschritt.' },
  { ab: 25, text: 'Sieht langsam nach Baustelle aus.' },
  { ab: 10, text: 'Man erkennt zumindest Absicht.' },
  { ab: 1, text: 'Wir nennen es einen Anfang.' },
  { ab: 0, text: 'Hier ist noch gar nichts passiert.' },
]

export function statusStufe(prozent) {
  return (STATUS_STUFEN.find((s) => prozent >= s.ab) || STATUS_STUFEN[STATUS_STUFEN.length - 1]).text
}

/**
 * Die trockene Zeile unter dem grossen Gesamtindex. Bewusst eine eigene Reihe:
 * Sie kommentiert das Gesamtbild, nicht einen einzelnen Bereich.
 */
export const GESAMT_STATUS = [
  { ab: 100, text: 'Keine Ahnung wie. Aber fertig.' },
  { ab: 95, text: 'Bitte nichts mehr anfassen.' },
  { ab: 85, text: 'Fast fertig. Also nach Baustellenmaßstab.' },
  { ab: 75, text: 'Nur noch ungefähr 742 Kleinigkeiten.' },
  { ab: 65, text: 'Langsam wird’s ernst.' },
  { ab: 55, text: 'Sieht verdächtig nach Fortschritt aus.' },
  { ab: 45, text: 'Jetzt bloß nicht hektisch werden.' },
  { ab: 35, text: 'Für den Rest gibt es ja Nachtschichten.' },
  { ab: 25, text: 'Man erkennt langsam Absicht.' },
  { ab: 15, text: 'Das wird schon irgendwie.' },
  { ab: 0, text: 'Wir haben zumindest angefangen.' },
]

export function gesamtStatus(prozent) {
  return (GESAMT_STATUS.find((s) => prozent >= s.ab) || GESAMT_STATUS[GESAMT_STATUS.length - 1]).text
}

/**
 * Der komplette Index fuer einen Kalendertag.
 *
 * @param {Array}  bereiche Bereichsdefinitionen aus data/entdecken.js
 * @param {string} iso      Kalendertag `YYYY-MM-DD`, Vorgabe: heute (Berlin)
 * @param {object} gates    BAUSTELLEN_GATES aus data/entdecken.js
 * @returns {{ tag, bereiche, gesamt, gesamtGestern, gesamtDelta, status }}
 */
export function baustellenIndex(bereiche, iso = heutigerTag(), gates = {}) {
  const gestern = tagVerschieben(iso, -1)
  const n = tagesNummer(iso)

  const werte = bereiche.map((b) => {
    const prozent = bereichsProzent(b, iso, gates)
    const vortag = bereichsProzent(b, gestern, gates)
    const gateN = gateNummer(b, gates)
    const gesperrt = istGesperrt(b, n, gateN)
    // Die Ausstellung ist nicht gesperrt, sie haengt nur an ihrer Obergrenze —
    // das ist ein eigener, milderer Zustand.
    const amCap =
      b.modus === MODUS.AUTO_BIS_GATE &&
      (gateN === null || n <= gateN) &&
      prozent >= Math.floor(b.preDeliveryCap) - 1

    return {
      ...b,
      prozent,
      vortag,
      delta: Math.max(0, prozent - vortag),
      stufe: statusStufe(prozent),
      gesperrt,
      // Ersetzt im blockierten Fall die „+1 seit gestern“-Plakette.
      hinweis: gesperrt || amCap ? b.gateText || null : null,
    }
  })

  // Ehrlicher Durchschnitt ueber alle Bereiche. Bewusst ungewichtet: Die
  // Bereiche, die auf 0 stehen, sollen den Index nach unten ziehen.
  const mittel = (liste, feld) =>
    liste.length ? Math.round(liste.reduce((s, b) => s + b[feld], 0) / liste.length) : 0

  const gesamt = mittel(werte, 'prozent')
  const gesamtGestern = mittel(werte, 'vortag')

  return {
    tag: iso,
    bereiche: werte,
    gesamt,
    gesamtGestern,
    gesamtDelta: Math.max(0, gesamt - gesamtGestern),
    status: gesamtStatus(gesamt),
  }
}
