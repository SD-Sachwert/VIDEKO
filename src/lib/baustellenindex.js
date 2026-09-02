/**
 * VIDEKO-Baustellenindex — der taegliche, automatisch berechnete Baubarometer
 * von /entdecken.
 *
 * WAS DAS IST — UND WAS NICHT
 * ---------------------------
 * Die Prozentwerte sind KEIN belegter, pruefbarer Baufortschritt. Sie sind ein
 * bewusst launiger Index: aus einem festen Startwert je Bereich, dem
 * Eroeffnungstermin und dem heutigen Datum errechnet sich eine Kurve, die bis
 * zum 01.12.2026 auf den Zielwert laeuft. Niemand misst hier eine Baustelle.
 * Die Seite sagt das an mehreren Stellen ausdruecklich („Vom Bauleiter
 * ausdruecklich nicht geprueft.“, „wissenschaftlich ungefaehr“) — der Index
 * darf lustig sein, aber er darf niemandem etwas vormachen.
 *
 * WARUM DETERMINISTISCH
 * ---------------------
 * Es gibt keine Datenbank, keine API, keinen Cronjob und niemanden, der taeglich
 * Zahlen pflegt. Der Wert eines Bereichs an einem Tag ergibt sich allein aus
 * (Bereichs-ID, Datum) — derselbe Tag liefert nach jedem Reload denselben Wert,
 * auf jedem Geraet. Kein Math.random() beim Rendern.
 *
 * WIE DIE KURVE ENTSTEHT
 * ----------------------
 * Jeder Tag zwischen Basisdatum und Eroeffnung bekommt pro Bereich ein Gewicht
 * aus einem FNV-1a-Hash ueber `id|YYYY-MM-DD`, gestreckt auf [0.35, 1.65]. Der
 * Fortschritt an Tag t ist der Anteil der bis dahin gesammelten Gewichte an der
 * Gesamtsumme:
 *
 *     prozent(t) = start + (ziel - start) * summe(1..t) / summe(1..n)
 *
 * Daraus folgt alles, was gefordert war: Gewichte sind positiv, also steigt der
 * Wert nie ab. Jeder Bereich hat eigene Gewichte, also laufen die Bereiche
 * unterschiedlich schnell — mal ein Tag ohne sichtbare Bewegung, mal zwei
 * Punkte auf einmal. Am Zieltag ist der Anteil exakt 1, der Bereich steht also
 * punktgenau auf seinem Zielwert. Danach wird geklemmt.
 */

const TAG_MS = 86400000

/** Basis- und Zieltag des Index. Beides Kalendertage in Europe/Berlin. */
export const INDEX_BASIS = '2026-09-02'
export const INDEX_ZIEL = '2026-12-01'

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
  const [jahr, monat, tag] = iso.split('-').map(Number)
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

/** Tagesgewicht eines Bereichs: reproduzierbar in [0.35, 1.65]. */
function tagesGewicht(id, iso) {
  return 0.35 + (fnv1a(`${id}|${iso}`) / 4294967296) * 1.3
}

/**
 * Kumulierte Gewichte eines Bereichs, einmal berechnet und dann gehalten.
 * 90 Tage pro Bereich — der Aufwand faellt einmal pro Seitenaufruf an.
 */
const kurven = new Map()

function kurve(bereich) {
  const vorhanden = kurven.get(bereich.id)
  if (vorhanden) return vorhanden

  const start = tagesNummer(bereich.baseDate || INDEX_BASIS)
  const ende = tagesNummer(INDEX_ZIEL)
  const tage = Math.max(1, ende - start)
  const summen = new Float64Array(tage + 1)

  let summe = 0
  for (let i = 1; i <= tage; i += 1) {
    summe += tagesGewicht(bereich.id, tagesIso(start + i))
    summen[i] = summe
  }

  const eintrag = { start, ende, summen, gesamt: summe || 1 }
  kurven.set(bereich.id, eintrag)
  return eintrag
}

/**
 * Roher Prozentwert eines Bereichs an einem Kalendertag — mit Nachkommastellen,
 * damit die Tagesdifferenz sauber aus derselben Kurve faellt.
 */
function rohProzent(bereich, iso) {
  const k = kurve(bereich)
  const n = tagesNummer(iso)
  if (!Number.isFinite(n) || n <= k.start) return bereich.basePercent
  if (n >= k.ende) return bereich.targetPercent
  const anteil = k.summen[n - k.start] / k.gesamt
  return bereich.basePercent + (bereich.targetPercent - bereich.basePercent) * anteil
}

/** Angezeigter Wert: ganze Zahl, nie unter 0, nie ueber 100 oder ueber Ziel. */
export function bereichsProzent(bereich, iso) {
  const grenze = Math.min(100, bereich.targetPercent)
  return Math.max(0, Math.min(grenze, Math.round(rohProzent(bereich, iso))))
}

/**
 * Status-Stufen. Zweite, automatische Statuszeile — der individuelle Text des
 * Bereichs bleibt die Hauptaussage, das hier ist nur der Kommentar dazu.
 */
export const STATUS_STUFEN = [
  { ab: 100, text: 'Fertig. Angeblich.' },
  { ab: 95, text: 'Fast fertig. Also theoretisch.' },
  { ab: 80, text: 'Nur noch ungefähr 742 Kleinigkeiten.' },
  { ab: 65, text: 'Jetzt wird’s langsam ernst.' },
  { ab: 45, text: 'Gefährlich nah an Fortschritt.' },
  { ab: 25, text: 'Sieht langsam nach Baustelle aus.' },
  { ab: 10, text: 'Man erkennt zumindest Absicht.' },
  { ab: 0, text: 'Wir nennen es einen Anfang.' },
]

export function statusStufe(prozent) {
  return (STATUS_STUFEN.find((s) => prozent >= s.ab) || STATUS_STUFEN[STATUS_STUFEN.length - 1]).text
}

/**
 * Der komplette Index fuer einen Kalendertag.
 *
 * @param {Array} bereiche Bereichsdefinitionen aus data/entdecken.js
 * @param {string} iso     Kalendertag `YYYY-MM-DD`, Vorgabe: heute (Berlin)
 * @returns {{ tag, bereiche, gesamt, gesamtGestern, gesamtDelta }}
 */
export function baustellenIndex(bereiche, iso = heutigerTag()) {
  const gestern = tagVerschieben(iso, -1)

  const werte = bereiche.map((b) => {
    const prozent = bereichsProzent(b, iso)
    const vortag = bereichsProzent(b, gestern)
    return {
      ...b,
      prozent,
      vortag,
      delta: Math.max(0, prozent - vortag),
      stufe: statusStufe(prozent),
    }
  })

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
  }
}
