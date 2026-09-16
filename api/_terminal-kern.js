import crypto from 'node:crypto'

import {
  GESAMT_SPIELE,
  HAUPTGAMES_ANZAHL,
  MEILENSTEINE,
  STANDARD_HAUPTGAMES,
  STANDARD_REIHENFOLGE,
  TERMINAL_KAMPAGNE,
} from '../src/data/terminal.js'

/**
 * Gemeinsamer Kern der beiden Terminal-Endpoints.
 *
 * api/terminal.js (oeffentlich) und api/terminal-admin.js (geschuetzt) teilen
 * Datenbankzugriff, Belege und Eingabepruefung. Beides doppelt zu pflegen
 * waere die sicherste Art, irgendwann zwei verschiedene Regeln zu haben.
 *
 * Der fuehrende Unterstrich ist kein Stilmittel: Vercel routet Dateien unter
 * api/, die mit _ beginnen, NICHT als Endpoint. Diese Datei ist damit ein
 * Modul und keine oeffentliche URL.
 *
 * Datenhaltung: das Core-System videko-core-pilot, ueber ein eigenes
 * Variablenpaar (TERMINAL_SUPABASE_URL / TERMINAL_SUPABASE_SERVICE_KEY).
 * Bewusst NICHT SUPABASE_URL: das zeigt auf das Projekt `buchhaltung`, in dem
 * das Terminal frueher lag und in dem Leads und Bestellungen weiterhin
 * liegen. Dorthin darf das Terminal nie wieder schreiben — zeigt die URL
 * darauf, gilt das Terminal als nicht konfiguriert.
 *
 * Zugriff ausschliesslich ueber die REST-Schnittstelle mit dem Dienst-
 * schluessel, serverseitig. Im Browser liegt kein Schluessel, und die
 * Tabellen haben RLS ohne Policy — der anon key kommt an sie nicht heran.
 */

const {
  TERMINAL_SUPABASE_URL: SUPABASE_URL = '',
  TERMINAL_SUPABASE_SERVICE_KEY: SUPABASE_SERVICE_KEY = '',

  /** Die Loesung des Raetsels. Steht nur hier, nie im Bundle. */
  TERMINAL_CODE = '',

  /** Schluessel fuer die Signatur der Belege (Zugang, Sitzung). */
  TERMINAL_TOKEN_SECRET = '',

  /** Salz fuer den IP-Hash der Ratenbegrenzung. Die IP selbst wird nie gespeichert. */
  TERMINAL_IP_SALT = '',

  /** Notbremse. Nur ein ausdrueckliches '0' haelt das Schreiben an. */
  TERMINAL_SCHREIBEN = '',
} = process.env

export const TABELLE_TEILNEHMER = 'videko_terminal_teilnehmer'
export const TABELLE_EINSTELLUNGEN = 'videko_terminal_einstellungen'
export const TABELLE_ZIEHUNGEN = 'videko_terminal_ziehungen'
export const TABELLE_MELDUNGEN = 'videko_terminal_meldungen'
export const TABELLE_SCORES = 'videko_terminal_scores'
export const TABELLE_WIEDER = 'videko_terminal_wiederherstellung'
export const TABELLE_SPIELSTARTS = 'videko_terminal_spielstarts'
export const TABELLE_ADMIN_VERSUCHE = 'videko_terminal_admin_versuche'

export const KAMPAGNE = TERMINAL_KAMPAGNE.id

/* ------------------------------------------------------------------ */
/* Kleinkram                                                           */
/* ------------------------------------------------------------------ */

export const clean = (s, max = 200) =>
  String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max)

/** Mehrzeiliger Freitext: Zeilenumbrueche bleiben, Laenge ist begrenzt. */
export const cleanText = (s, max = 600) =>
  String(s ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max)

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  const raw = await new Promise((res) => {
    let d = ''
    req.on('data', (c) => (d += c))
    req.on('end', () => res(d))
    req.on('error', () => res(''))
  })
  try { return JSON.parse(raw) } catch { return {} }
}

export function klientIp(req) {
  const weiter = String(req.headers['x-forwarded-for'] || '')
  return weiter.split(',')[0].trim() || req.socket?.remoteAddress || 'unbekannt'
}

export function ipHash(ip) {
  return crypto.createHash('sha256').update(`${TERMINAL_IP_SALT}|${ip}`).digest('hex')
}

export const schreibenErlaubt = () => TERMINAL_SCHREIBEN !== '0'

/** Das alte Projekt `buchhaltung`. Bleibt unangetastete Sicherheitskopie. */
const ALTES_PROJEKT = 'tshdfkmpkcpkeufplzda'

export function konfiguriert() {
  if (SUPABASE_URL.includes(ALTES_PROJEKT)) return false
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY && TERMINAL_TOKEN_SECRET)
}

/** Ist ueberhaupt ein Raetselcode hinterlegt? Ohne ihn darf nichts aufgehen. */
export const codeHinterlegt = () => clean(TERMINAL_CODE, 64).length > 0

/**
 * Zwei Zeichenketten vergleichen, ohne ueber die Laufzeit zu verraten, wie
 * viele Zeichen gestimmt haben. Verglichen werden die Hashes, damit
 * timingSafeEqual auch bei verschiedenen Laengen arbeiten kann.
 */
export function gleichSicher(a, b) {
  const ha = crypto.createHash('sha256').update(String(a ?? '')).digest()
  const hb = crypto.createHash('sha256').update(String(b ?? '')).digest()
  return crypto.timingSafeEqual(ha, hb)
}

/**
 * Raetselcode pruefen: Gross- und Kleinschreibung egal, Leerraum egal.
 * Der richtige Code wird nie zurueckgegeben — diese Funktion sagt nur ja
 * oder nein.
 */
export function codeStimmt(eingabe) {
  const soll = clean(TERMINAL_CODE, 64).toUpperCase().replace(/\s+/g, '')
  const ist = clean(eingabe, 64).toUpperCase().replace(/\s+/g, '')
  if (!soll || !ist) return false
  return gleichSicher(soll, ist)
}

/* ------------------------------------------------------------------ */
/* Belege (HMAC)                                                       */
/* ------------------------------------------------------------------ */

/**
 * Ein Beleg ist `v1.<nutzlast>.<signatur>`, beides base64url.
 *
 *   t: 'z' — Zugang. Der Code stimmte. Lebt kurz, damit ein Reload waehrend
 *            des Ausfuellens nicht auf Zustand A zurueckwirft.
 *   t: 's' — Sitzung. Ein Deckel wurde aktiviert. Macht das Dashboard nach
 *            einem Reload wieder auffindbar.
 *   t: 'r' — Laufticket eines Spiels. Der Server gibt es beim Start aus und
 *            bindet darin Teilnehmer, Spiel, Startzeit und eine Nonce. Ohne
 *            gueltiges Ticket wird kein Punktestand angenommen.
 *   t: 'p' — Probe. Die Testsitzung des Admin-Testlabors. Sie wird nur nach
 *            erfolgreicher Admin-Anmeldung ausgegeben und beschreibt eine
 *            rein virtuelle Testperson. Sie gehoert zu keinem Datensatz,
 *            erzeugt keinen und veraendert keinen. Siehe _terminal-probe.js.
 *
 * In der Nutzlast steht nie eine E-Mail-Adresse und nie der Raetselcode —
 * ein Zugangsbeleg ist ausdruecklich KEIN Ersatz fuer den Code: er bestaetigt
 * nur, dass dieser Server ihn bereits geprueft hat.
 */
const BELEG_LEBEN_MS = {
  z: 2 * 60 * 60 * 1000 /* Zugang: zwei Stunden reichen fuers Formular */,
  s: 365 * 24 * 60 * 60 * 1000 /* Sitzung: die Aktion laeuft ein Jahr lang */,
  r: 10 * 60 * 1000 /* Laufticket: eine Runde dauert 30 Sekunden */,
  p: 12 * 60 * 60 * 1000 /* Probe: ein Arbeitstag am Testlabor reicht */,
  w: 15 * 60 * 1000 /* Testlink fuer den Wieder-Login: so kurz wie der echte */,
}

const b64 = (buf) => Buffer.from(buf).toString('base64url')

function signieren(text) {
  return b64(crypto.createHmac('sha256', TERMINAL_TOKEN_SECRET).update(text).digest())
}

export function belegErzeugen(typ, daten = {}) {
  const nutzlast = b64(JSON.stringify({
    ...daten,
    t: typ,
    exp: Date.now() + (BELEG_LEBEN_MS[typ] ?? BELEG_LEBEN_MS.z),
  }))
  return `v1.${nutzlast}.${signieren(nutzlast)}`
}

/**
 * Beleg pruefen. Gibt die Nutzlast zurueck oder null — null heisst in jedem
 * Fall: nicht weiterarbeiten. Falsche Signatur, abgelaufen, falscher Typ,
 * Unsinn im Feld: alles derselbe Ausgang.
 */
export function belegPruefen(beleg, typ) {
  const teile = String(beleg ?? '').split('.')
  if (teile.length !== 3 || teile[0] !== 'v1') return null
  const [, nutzlast, signatur] = teile

  let soll
  try {
    soll = signieren(nutzlast)
  } catch {
    return null
  }
  if (!gleichSicher(soll, signatur)) return null

  let daten
  try {
    daten = JSON.parse(Buffer.from(nutzlast, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (!daten || daten.t !== typ) return null
  if (!Number.isFinite(daten.exp) || daten.exp < Date.now()) return null
  return daten
}

/* ------------------------------------------------------------------ */
/* Datenbank                                                           */
/* ------------------------------------------------------------------ */

export function kopfzeilen(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export const restUrl = (pfad) => `${SUPABASE_URL}/rest/v1/${pfad}`

/** Lesen. Gibt immer ein Array zurueck — auch wenn die Abfrage scheitert. */
export async function lesen(pfad) {
  const antwort = await fetch(restUrl(pfad), { headers: kopfzeilen() })
  if (!antwort.ok) return []
  const daten = await antwort.json().catch(() => [])
  return Array.isArray(daten) ? daten : []
}

/** Zaehlen ueber content-range, ohne die Zeilen selbst zu holen. */
export async function zaehlen(pfad) {
  const antwort = await fetch(restUrl(`${pfad}&select=id`), {
    headers: kopfzeilen({ Prefer: 'count=exact' }),
  })
  if (!antwort.ok) return null
  const bereich = antwort.headers.get('content-range') || ''
  const n = Number(bereich.split('/')[1])
  return Number.isFinite(n) ? n : null
}

/* ------------------------------------------------------------------ */
/* Einstellungen                                                       */
/* ------------------------------------------------------------------ */

/**
 * Die laufenden Werte der Kampagne. Fehlt die Zeile (frische Datenbank,
 * noch kein Admin-Besuch), gelten die Startwerte aus terminal.js — die Seite
 * funktioniert dann, nur ohne Termin.
 */
export const EINSTELLUNGEN_SPALTEN =
  'kampagne,naechste_ziehung,follower_zahl,follower_ziel,live_modus,'
  + 'gezogene_nummer,meldefrist_bis,meldefrist_stunden,meilenstein_gewinne,spiele_aktiv,spiele_reihenfolge,'
  + 'guest_practice_game'

/** Das Game, das ohne aktivierten Deckel im Practice Mode spielbar ist. */
export const PRACTICE_STANDARD = 'leitungsfinder'

export function practiceSaeubern(roh) {
  const key = clean(roh, 32)
  return Object.hasOwn(SPIELE, key) ? key : PRACTICE_STANDARD
}

export async function einstellungenLesen() {
  /* Das Gesamtranking liest seine Spalten in einer eigenen Abfrage. Fehlen
     sie (Migration noch nicht gelaufen), scheitert nur diese — die uebrigen
     Einstellungen kommen trotzdem, und das Gesamtranking nimmt die Standards. */
  const [zeilen, gesamtranking] = await Promise.all([
    lesen(
      `${TABELLE_EINSTELLUNGEN}?select=${EINSTELLUNGEN_SPALTEN}`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&limit=1`,
    ),
    gesamtrankingEinstellungenLesen(),
  ])
  const z = zeilen[0] ?? {}
  return {
    gesamtranking,
    naechsteZiehung: z.naechste_ziehung ?? null,
    followerZahl: z.follower_zahl ?? 0,
    followerZiel: z.follower_ziel ?? TERMINAL_KAMPAGNE.followerZiel,
    live: z.live_modus === true,
    gezogeneNummer: z.gezogene_nummer ?? null,
    meldefristBis: z.meldefrist_bis ?? null,
    meldefristStunden: z.meldefrist_stunden ?? TERMINAL_KAMPAGNE.meldefristStunden,
    meilensteinGewinne: meilensteineSaeubern(z.meilenstein_gewinne),
    spieleAktiv: spieleAktivSaeubern(z.spiele_aktiv, gesamtranking),
    spieleReihenfolge: reihenfolgeSaeubern(z.spiele_reihenfolge),
    guestPracticeGame: practiceSaeubern(z.guest_practice_game),
  }
}

/* --- Gesamtranking: Einstellungen --------------------------------- */

export const GESAMTRANKING_SPALTEN =
  'gesamtranking_spiele,testslot_game,preis_gesamt_1,preis_gesamt_2,preis_gesamt_3,gesamtranking_abgeschlossen_am'

/**
 * Die fuenf Hauptgames. Gilt nur eine Liste aus genau fuenf verschiedenen,
 * bekannten Spielen — alles andere faellt auf den Standard zurueck. So kann
 * ein halb gespeicherter Wert das Ranking nie auf vier oder sechs Spiele
 * verbiegen.
 */
export function hauptgamesPruefen(roh) {
  if (!Array.isArray(roh)) return null
  const liste = roh.map((k) => clean(k, 32))
  if (liste.length !== HAUPTGAMES_ANZAHL) return null
  if (new Set(liste).size !== HAUPTGAMES_ANZAHL) return null
  if (!liste.every((k) => Object.hasOwn(SPIELE, k))) return null
  return liste
}

export const hauptgamesSaeubern = (roh) => hauptgamesPruefen(roh) ?? [...STANDARD_HAUPTGAMES]

/**
 * Der Testslot: ein bekanntes Spiel, das kein Hauptgame ist — sonst keiner.
 * Leer heisst leer: es gibt keinen stillen Rueckfall auf ein Standardspiel.
 */
export function testslotSaeubern(roh, hauptgames) {
  const key = clean(roh, 32)
  if (Object.hasOwn(SPIELE, key) && !hauptgames.includes(key)) return key
  return null
}

export const preisSaeubern = (roh) => clean(roh, 80) || null

export async function gesamtrankingEinstellungenLesen() {
  const zeilen = await lesen(
    `${TABELLE_EINSTELLUNGEN}?select=${GESAMTRANKING_SPALTEN}`
    + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&limit=1`,
  )
  const z = zeilen[0] ?? {}
  const hauptgames = hauptgamesSaeubern(z.gesamtranking_spiele)
  return {
    hauptgames,
    testslot: testslotSaeubern(z.testslot_game, hauptgames),
    preise: {
      1: preisSaeubern(z.preis_gesamt_1),
      2: preisSaeubern(z.preis_gesamt_2),
      3: preisSaeubern(z.preis_gesamt_3),
    },
    abgeschlossenAm: z.gesamtranking_abgeschlossen_am ?? null,
  }
}

/**
 * Preisnamen je Meilenstein. Nur bekannte Stufen, nur kurzer Text — was
 * darueber hinausgeht, faellt weg. Eine leere Stufe zeigt die Seite als
 * MYSTERY-ZUSATZGEWINN.
 */
export function meilensteineSaeubern(roh) {
  const aus = {}
  if (!roh || typeof roh !== 'object') return aus
  for (const ziel of MEILENSTEINE) {
    const name = clean(roh[ziel] ?? roh[String(ziel)], 80)
    if (name) aus[String(ziel)] = name
  }
  return aus
}

/**
 * Game-Schalter. Ein ausdrueckliches true/false gewinnt. Fehlt der Eintrag,
 * ist ein Spiel genau dann sichtbar, wenn es Hauptgame oder Testslot ist —
 * ohne Testslot also nur die fuenf Hauptgames. Ohne Gesamtranking-Angaben
 * gilt `standardAktiv` des Spiels.
 */
export function spieleAktivSaeubern(roh, gesamtranking = null) {
  const aus = {}
  const obj = roh && typeof roh === 'object' ? roh : {}
  const gezeigt = gesamtranking
    ? new Set([...(gesamtranking.hauptgames ?? []), ...(gesamtranking.testslot ? [gesamtranking.testslot] : [])])
    : null
  for (const [key, regeln] of Object.entries(SPIELE)) {
    const standard = gezeigt ? gezeigt.has(key) : regeln.standardAktiv !== false
    aus[key] = obj[key] === true ? true : obj[key] === false ? false : standard
  }
  return aus
}

/**
 * Reihenfolge der Spielkarten. Nur bekannte Schluessel, jeder einmal; was in
 * der gespeicherten Liste fehlt, haengt in der Standardreihenfolge hinten an.
 */
export function reihenfolgeSaeubern(roh) {
  const liste = Array.isArray(roh) ? roh.map((k) => clean(k, 32)).filter((k) => Object.hasOwn(SPIELE, k)) : []
  const aus = [...new Set(liste)]
  for (const key of STANDARD_REIHENFOLGE) if (Object.hasOwn(SPIELE, key) && !aus.includes(key)) aus.push(key)
  for (const key of Object.keys(SPIELE)) if (!aus.includes(key)) aus.push(key)
  return aus
}

/**
 * Einstellungen schreiben (anlegen oder ergaenzen). `Prefer: resolution=
 * merge-duplicates` macht daraus ein upsert auf den Primaerschluessel
 * `kampagne` — so muss der Betrieb die Zeile nie von Hand anlegen.
 */
export async function einstellungenSchreiben(felder) {
  const antwort = await fetch(restUrl(TABELLE_EINSTELLUNGEN), {
    method: 'POST',
    headers: kopfzeilen({
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      ...felder,
      aktualisiert_am: new Date().toISOString(),
    }),
  })
  return antwort.ok
}

/**
 * Anzahl aktivierter Deckel. Oeffentliche Zahl, keine Personendaten.
 * Gezaehlt werden Nummern, nicht Ansprueche: ein weiterer Besitzanspruch auf
 * eine schon aktivierte Nummer macht aus einem Deckel keine zwei.
 */
export async function aktivierteZaehlen() {
  return zaehlen(`${TABELLE_TEILNEHMER}?kampagne=eq.${encodeURIComponent(KAMPAGNE)}&anspruch_art=eq.${ANSPRUCH_ERST}`)
}

export const ANSPRUCH_ERST = 'erstaktivierung'
export const ANSPRUCH_WEITERER = 'weiterer_besitzanspruch'

/* ------------------------------------------------------------------ */
/* Spiele: Laufticket, Ergebnisse, Rangliste                           */
/* ------------------------------------------------------------------ */

/**
 * Die beiden Spiele und ihre Plausibilitaetsgrenzen.
 *
 * `dauerMs` ist die Spielzeit, die der Browser vorgibt. `plausibel` ist die
 * Punktzahl, die ein sehr guter Lauf erreichen kann — darueber wird der Lauf
 * gespeichert, aber als 'verdacht' markiert und aus jeder Rangliste
 * genommen. `hart` ist die Grenze, ab der gar nichts mehr angenommen wird.
 *
 * Die Zahlen sind bewusst grosszuegig: ein ehrlicher Ausnahmelauf soll nicht
 * am Server scheitern, ein `score: 999999999` aber auch nicht durchkommen.
 */
export const SPIELE = {
  /* Oeffentlich sichtbar sind standardmaessig nur die fuenf Hauptgames und —
     falls eingetragen — der Testslot (siehe spieleAktivSaeubern). Alle anderen
     lassen sich in der Verwaltung jederzeit wieder einschalten. */
  truhenknacker: { titel: 'Truhenknacker', dauerMs: 30000, plausibel: 45000, hart: 120000, standardAktiv: false },
  goldrausch: { titel: 'Goldrausch', dauerMs: 30000, plausibel: 60000, hart: 150000, standardAktiv: false },
  /* Die beiden Endlosspiele haben keine feste Spielzeit — die Runde endet
     mit dem Fehler. `dauerMs` ist hier nur die Obergrenze, die der Browser
     mitbekommt (unterhalb der Ticketlaufzeit von zehn Minuten). Statt eines
     Anteils an der Spielzeit gilt eine Mindestdauer je Einheit: ein Modul
     braucht mindestens `msJeRunde`, bis es abgesetzt ist, ein Meter
     Kuechen-Dash mindestens `msJePunkt`.

     Kuechen-Stack: je Modul hoechstens 4 × 100 = 400 Punkte (PERFECT-Serie),
     ein sehr guter Lauf schafft um die 60 Module.
     Kuechen-Dash: Punkte = Meter, rund 10 bis 25 Meter je Sekunde. */
  kuechen_stack: { titel: 'Küchen-Stack', dauerMs: 540000, endlos: true, plausibel: 30000, hart: 90000, msJeRunde: 280, maxJeRunde: 400, standardAktiv: false },
  kuechen_dash: { titel: 'Küchen-Dash', dauerMs: 540000, endlos: true, plausibel: 12000, hart: 40000, msJePunkt: 30, standardAktiv: false },
  /* GAME-LAB. Eigene Ranglisten, nicht in GESAMT. `runden` zaehlt je Spiel
     die Aktion, die Punkte bringt (Absetzen, Drehen/Setzen, Plattform, Wurf,
     Bohrung, Tausch, Karte) — daraus Mindestdauer und Punktdecke je Aktion. */
  kuechen_balance: { titel: 'Küchen-Balance', dauerMs: 540000, endlos: true, plausibel: 30000, hart: 100000, msJeRunde: 500, maxJeRunde: 700, standardAktiv: false },
  kuechen_fit: { titel: 'Küchen-Fit', dauerMs: 540000, endlos: true, plausibel: 250000, hart: 450000, msJeRunde: 150, maxJeRunde: 1200 },
  videko_jump: { titel: 'VIDEKO Jump', dauerMs: 540000, endlos: true, plausibel: 35000, hart: 80000, msJeRunde: 150, maxJeRunde: 400 },
  kuechen_merge: { titel: 'Küchen-Merge', dauerMs: 540000, endlos: true, plausibel: 120000, hart: 250000, msJeRunde: 400, maxJeRunde: 450 },
  leitungsfinder: { titel: 'Leitungsfinder', dauerMs: 540000, endlos: true, plausibel: 450000, hart: 600000, msJeRunde: 90, maxJeRunde: 1200 },
  kuechen_crush: { titel: 'Küchen-Crush', dauerMs: 40000, plausibel: 80000, hart: 140000, msJeRunde: 300, maxJeRunde: 5000 },
  kuechen_tinder: { titel: 'Küchen-Tinder', dauerMs: 30000, plausibel: 10000, hart: 16000, msJeRunde: 450, maxJeRunde: 330 },
}

export const SPIEL_SCHLUESSEL = Object.keys(SPIELE)

export { GESAMT_SPIELE }

/**
 * Verdacht fuer einen Lauf: zu schnell fuer seine Punkte, zu viele Punkte
 * oder bei den Endlosspielen Punkte, die nicht zu den Runden passen.
 * Gibt die Gruende zurueck — leer heisst unauffaellig.
 */
export function laufVerdacht(game, { dauerMs, punkte, runden }) {
  const regeln = SPIELE[game]
  const gruende = []
  if (regeln.endlos) {
    const n = Number.isFinite(runden) ? runden : 0
    if (regeln.msJeRunde && dauerMs < n * regeln.msJeRunde) gruende.push('dauer')
    if (regeln.msJePunkt && dauerMs < punkte * regeln.msJePunkt) gruende.push('dauer')
    if (regeln.maxJeRunde && punkte > n * regeln.maxJeRunde) gruende.push('runden')
  } else {
    if (dauerMs < regeln.dauerMs * 0.5) gruende.push('dauer')
    /* Zeitspiele mit Aktionszaehler: auch hier passen Punkte und Aktionen
       zusammen. Fehlt `runden` (aeltere Seite), bleibt es bei der Dauer. */
    if (Number.isFinite(runden)) {
      if (regeln.msJeRunde && dauerMs < runden * regeln.msJeRunde) gruende.push('dauer')
      if (regeln.maxJeRunde && punkte > runden * regeln.maxJeRunde) gruende.push('runden')
    }
  }
  if (punkte > regeln.plausibel) gruende.push('punkte')
  return [...new Set(gruende)]
}
/** Spielschluessel aus einer Anfrage saeubern. Gibt null bei Unbekanntem. */
export function spielSchluessel(roh) {
  const s = clean(roh, 32).toLowerCase()
  return Object.hasOwn(SPIELE, s) ? s : null
}

/**
 * Ein Laufticket ausgeben. Es bindet Teilnehmer, Spiel, Startzeitpunkt und
 * eine Nonce — und ist signiert. Der Browser kann darin nichts aendern, ohne
 * die Signatur zu zerstoeren.
 */
export function laufticket(teilnehmerId, game) {
  return belegErzeugen('r', {
    p: teilnehmerId,
    g: game,
    s: Date.now(),
    n: crypto.randomUUID(),
  })
}

/**
 * Laufticket pruefen. Gibt `{ lauf, dauerMs }` zurueck oder null.
 *
 * Geprueft wird: Signatur (in belegPruefen), Typ, Ablauf, dass das Ticket zu
 * diesem Teilnehmer gehoert und dass es fuer dieses Spiel ausgegeben wurde.
 * Die Einmaligkeit haengt nicht an dieser Funktion, sondern am Unique-Index
 * auf lauf_id: das ist die einzige Stelle, die auch zwei gleichzeitige
 * Absendungen sicher auseinanderhaelt.
 */
export function laufticketPruefen(ticket, teilnehmerId, game) {
  const daten = belegPruefen(ticket, 'r')
  if (!daten) return null
  if (!daten.n || typeof daten.n !== 'string') return null
  if (daten.g !== game) return null
  if (!daten.p || daten.p !== teilnehmerId) return null
  if (!Number.isFinite(daten.s)) return null

  const dauerMs = Date.now() - daten.s
  if (dauerMs < 0) return null
  return { lauf: daten.n, dauerMs }
}

/**
 * Einen Lauf speichern. Gibt `{ ok, doppelt }` zurueck — `doppelt` heisst:
 * dieses Laufticket wurde schon eingeloest (Unique-Verstoss auf lauf_id).
 */
export async function scoreSpeichern(felder) {
  const antwort = await fetch(restUrl(TABELLE_SCORES), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ kampagne: KAMPAGNE, ...felder }),
  })
  if (antwort.ok) return { ok: true, doppelt: false }
  const text = await antwort.text().catch(() => '')
  return { ok: false, doppelt: antwort.status === 409 || /duplicate key|23505/.test(text) }
}

/**
 * Einen Spielstart vermerken — Grundlage der Abbruchquote. Nur Spiel,
 * Teilnehmer-ID und Lauf-ID; ein Fehler hier haelt kein Spiel auf.
 */
export async function spielstartVermerken(teilnehmerId, game, laufId) {
  try {
    await fetch(restUrl(TABELLE_SPIELSTARTS), {
      method: 'POST',
      headers: kopfzeilen({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ kampagne: KAMPAGNE, game, teilnehmer_id: teilnehmerId, lauf_id: laufId }),
    })
  } catch {
    /* Statistik, kein Spielablauf. */
  }
}

/** Der eigene Bestwert je Spiel. Private Abfrage ueber den Sitzungsbeleg. */
export async function eigeneBestwerte(teilnehmerId) {
  const zeilen = await lesen(
    `${TABELLE_SCORES}?select=game,score`
    + `&teilnehmer_id=eq.${encodeURIComponent(teilnehmerId)}`
    + '&status=eq.gueltig&order=score.desc&limit=200',
  )
  const beste = {}
  for (const s of SPIEL_SCHLUESSEL) beste[s] = null
  for (const z of zeilen) {
    const g = z.game
    const p = Number(z.score)
    if (!Object.hasOwn(beste, g) || !Number.isFinite(p)) continue
    if (beste[g] == null || p > beste[g]) beste[g] = p
  }
  return beste
}

/* --- Rangliste ---------------------------------------------------- */

/** So viele Einzellaeufe je Spiel werden betrachtet. */
const RANG_ROHGRENZE = 1000
/** So viele Personen kommen in die Vorauswahl, aus der die Liste entsteht. */
const RANG_KANDIDATEN = 240
/** So lang ist eine oeffentliche Liste. */
export const RANG_LAENGE = 20

export const UUID_MUSTER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Kleiner Zwischenspeicher im Funktionsprozess. Die Rangliste haengt am
 * Dashboard jedes Besuchers; ohne ihn stellte jeder Seitenaufruf vier
 * Datenbankabfragen. Zwanzig Sekunden alte Punktestaende sind in einem
 * Leaderboard kein Problem.
 */
const rangSpeicher = new Map()
const RANG_FRISCH_MS = 20 * 1000

/**
 * Zwischenspeicher verwerfen. Nach einer gespeicherten Runde soll der eigene
 * Platz sofort stimmen und nicht bis zu zwanzig Sekunden alt sein.
 *
 * Wirkt nur in der Instanz, die gerade schreibt — andere Instanzen rechnen
 * spaetestens nach ihrem eigenen Fenster neu. Fuer eine Bestenliste genuegt
 * das; fuer die Antwort auf die eigene Runde, die hier entsteht, nicht.
 */
export function rangSpeicherLeeren() {
  rangSpeicher.clear()
}

export async function gemerkt(schluessel, hole) {
  const jetzt = Date.now()
  const alt = rangSpeicher.get(schluessel)
  if (alt && alt.bis > jetzt) return alt.wert
  const wert = await hole()
  rangSpeicher.set(schluessel, { wert, bis: jetzt + RANG_FRISCH_MS })
  return wert
}

async function laeufeLesen(game) {
  return lesen(
    `${TABELLE_SCORES}?select=teilnehmer_id,score,created_at`
    + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
    + `&game=eq.${encodeURIComponent(game)}`
    + '&status=eq.gueltig'
    + `&order=score.desc,created_at.asc&limit=${RANG_ROHGRENZE}`,
  )
}

/**
 * Je Person nur der beste Lauf. Bei gleichem Punktestand gewinnt der
 * frueher erreichte — dieselbe Regel wie im Gesamtranking, damit die
 * Reihenfolge nicht von der Laufzeit einer Abfrage abhaengt.
 */
export function besteJePerson(zeilen) {
  const karte = new Map()
  for (const z of zeilen) {
    const id = z.teilnehmer_id
    const punkte = Number(z.score)
    if (!id || !Number.isFinite(punkte)) continue
    const alt = karte.get(id)
    if (!alt || punkte > alt.punkte || (punkte === alt.punkte && z.created_at < alt.wann)) {
      karte.set(id, { punkte, wann: z.created_at })
    }
  }
  return karte
}

/** Absteigend nach Punkten, bei Gleichstand gewinnt der frühere Zeitpunkt. */
export const nachRang = (a, b) => (b.punkte - a.punkte) || String(a.wann).localeCompare(String(b.wann))

/**
 * Die Instagram-Namen der Vorauswahl — ausschliesslich von Personen, die der
 * Veroeffentlichung zugestimmt haben. Wer nicht zugestimmt hat, taucht hier
 * nicht auf und damit in keiner oeffentlichen Liste.
 *
 * Ausgewaehlt werden nur id und instagram_handle. Deckelnummer und E-Mail
 * verlassen die Datenbank fuer diesen Zweck nicht.
 */
export async function namenLesen(ids) {
  const sauber = ids.filter((i) => UUID_MUSTER.test(String(i)))
  const karte = new Map()
  for (let i = 0; i < sauber.length; i += 120) {
    const teil = sauber.slice(i, i + 120)
    const zeilen = await lesen(
      `${TABELLE_TEILNEHMER}?select=id,instagram_handle`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
      + '&leaderboard_ok=is.true'
      + `&id=in.(${teil.join(',')})`,
    )
    for (const z of zeilen) {
      const name = clean(z.instagram_handle, 40)
      if (z.id && name) karte.set(z.id, name)
    }
  }
  return karte
}

/**
 * Aus einer Personenliste eine oeffentliche Rangliste machen: zuerst nach
 * Punkten sortieren, dann auf die Zustimmenden eindampfen, dann fortlaufend
 * numerieren. Die eigene Position wird an derselben Liste bestimmt — sie
 * bleibt damit konsistent mit dem, was oeffentlich zu sehen ist.
 */
async function listeBauen(karte, eigeneId) {
  const alle = [...karte.entries()]
    .map(([id, w]) => ({ id, punkte: w.punkte, wann: w.wann }))
    .sort(nachRang)
    .slice(0, RANG_KANDIDATEN)

  const namen = await namenLesen(alle.map((e) => e.id))
  const oeffentlich = alle.filter((e) => namen.has(e.id))

  const eintraege = oeffentlich.slice(0, RANG_LAENGE).map((e, i) => ({
    platz: i + 1,
    instagram: namen.get(e.id),
    punkte: e.punkte,
    ich: eigeneId ? e.id === eigeneId : false,
  }))

  const eigenerIndex = eigeneId ? oeffentlich.findIndex((e) => e.id === eigeneId) : -1

  /* Der naechste wirklich erreichbare Platz und was dafuer fehlt.
     Nach oben gelaufen bis zum ersten Eintrag mit ECHT mehr Punkten: wer
     gleichauf liegt, ist kein Ziel, denn bei Gleichstand gewinnt der frueher
     erreichte Stand — und der gehoert dem anderen. Genau deshalb steht in der
     Luecke ein Punkt mehr als die reine Differenz. */
  let bisPlatz = null
  let luecke = null
  let vorMir = null
  if (eigenerIndex > 0) {
    const meine = oeffentlich[eigenerIndex].punkte
    for (let i = eigenerIndex - 1; i >= 0; i -= 1) {
      if (oeffentlich[i].punkte > meine) {
        bisPlatz = i + 1
        luecke = oeffentlich[i].punkte - meine + 1
        /* Nur ein Name aus der oeffentlichen, zugestimmten Liste. */
        vorMir = namen.get(oeffentlich[i].id) ?? null
        break
      }
    }
  }
  /* Abstand in die Top 10 und aufs Treppchen — nur fuer wen es noch ein Ziel ist. */
  const lueckeBis = (platz) => {
    if (eigenerIndex < platz || oeffentlich.length < platz) return null
    return oeffentlich[platz - 1].punkte - oeffentlich[eigenerIndex].punkte + 1
  }

  return {
    eintraege,
    eigenerPlatz: eigenerIndex >= 0 ? eigenerIndex + 1 : null,
    eigenePunkte: eigeneId && karte.has(eigeneId) ? karte.get(eigeneId).punkte : null,
    gelistet: eigenerIndex >= 0,
    /* Die Zahl hinter "PLATZ 7 VON 143". Gezaehlt wird, wer oeffentlich in
       der Wertung steht — gedeckelt durch RANG_KANDIDATEN, weil weiter unten
       ohnehin niemand nachschlaegt. Sollte die Aktion diese Grenze je
       erreichen, steht dort eben "von 240" statt einer groesseren Zahl; das
       ist ehrlicher, als eine Zahl zu raten. */
    gesamtZahl: oeffentlich.length,
    bisPlatz,
    luecke,
    vorMir,
    top10Luecke: lueckeBis(10),
    top3Luecke: lueckeBis(3),
  }
}

/**
 * Mitternacht in Berlin als Zeitpunkt.
 *
 * `setHours(0,0,0,0)` waere falsch: der Server laeuft in UTC, und Berlin ist
 * je nach Jahreszeit ein oder zwei Stunden voraus. "Bester heute" wuerde
 * damit jede Nacht zwei Stunden zu spaet umspringen. Deshalb wird das
 * Berliner Datum ueber die Zeitzone selbst ermittelt.
 */
function tagesbeginnBerlin(jetzt = new Date()) {
  const teile = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(jetzt)
  const w = (name) => Number(teile.find((t) => t.type === name)?.value)

  /* Wie weit ist die Berliner Wanduhr der UTC-Wanduhr im selben Augenblick
     voraus? Das ist der Versatz, inklusive Sommerzeit. */
  const wanduhr = Date.UTC(w('year'), w('month') - 1, w('day'), w('hour'), w('minute'), w('second'))
  const versatz = wanduhr - Math.floor(jetzt.getTime() / 1000) * 1000

  return new Date(Date.UTC(w('year'), w('month') - 1, w('day')) - versatz)
}

/**
 * Der beste heutige Lauf eines Spiels — "BESTER HEUTE" auf der Spielkarte.
 *
 * Bewusst nur ein einziger Datensatz und nur zwei Felder daraus. Der Name
 * kommt ueber dieselbe Zustimmungspruefung wie die Rangliste; wer nicht
 * zugestimmt hat, erscheint mit `instagram: null` und die Seite zeigt nur
 * die Punktzahl.
 */
export async function bestesHeute(game) {
  return gemerkt(`h:${game}`, async () => {
    const ab = tagesbeginnBerlin().toISOString()
    const zeilen = await lesen(
      `${TABELLE_SCORES}?select=teilnehmer_id,score`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
      + `&game=eq.${encodeURIComponent(game)}`
      + '&status=eq.gueltig'
      + `&created_at=gte.${encodeURIComponent(ab)}`
      + '&order=score.desc,created_at.asc&limit=1',
    )
    const top = zeilen[0]
    const punkte = Number(top?.score)
    if (!top || !Number.isFinite(punkte)) return null
    const namen = await namenLesen([top.teilnehmer_id])
    return { punkte, instagram: namen.get(top.teilnehmer_id) ?? null }
  })
}

/** Rangliste eines einzelnen Spiels. */
export async function rangliste(game, eigeneId = null) {
  const zeilen = await gemerkt(`l:${game}`, () => laeufeLesen(game))
  return listeBauen(besteJePerson(zeilen), eigeneId)
}

/**
 * Gesamtrangliste: bester Truhenknacker-Lauf plus bester Goldrausch-Lauf.
 *
 * Wer nur ein Spiel gespielt hat, steht mit diesem einen Wert in der Liste —
 * es wird nichts hochgerechnet. Bei Gleichstand entscheidet, wer den Stand
 * zuerst erreicht hat: das ist der spaetere der beiden Laeufe, und der
 * frueheste davon gewinnt.
 */
export async function gesamtrangliste(eigeneId = null) {
  /* Nur Truhenknacker und Goldrausch — die neuen Spiele haben eigene Listen
     und aendern an der Gesamtwertung nichts. */
  const teile = await Promise.all(
    GESAMT_SPIELE.map((g) => gemerkt(`l:${g}`, () => laeufeLesen(g))),
  )

  const summe = new Map()
  for (const zeilen of teile) {
    for (const [id, w] of besteJePerson(zeilen)) {
      const alt = summe.get(id)
      if (!alt) summe.set(id, { punkte: w.punkte, wann: w.wann })
      else {
        alt.punkte += w.punkte
        if (String(w.wann) > String(alt.wann)) alt.wann = w.wann
      }
    }
  }

  return listeBauen(summe, eigeneId)
}

/**
 * Der aktuelle Spitzenplatz der Gesamtliste — der „Tresorkönig“ fuers
 * Dashboard. Null, solange noch niemand mit Zustimmung gespielt hat.
 */
export async function tresorkoenig() {
  const liste = await gemerkt('koenig', async () => {
    const { eintraege } = await gesamtrangliste(null)
    return eintraege[0] ?? null
  })
  return liste
}

/* ------------------------------------------------------------------ */
/* Leaderboard-Einwilligung                                            */
/* ------------------------------------------------------------------ */

/**
 * Einwilligung setzen oder widerrufen. Geschrieben werden ausschliesslich
 * leaderboard_ok und leaderboard_ok_am der eigenen Zeile — Deckel, Scores,
 * Aktivierung und Ziehung bleiben unberuehrt. Danach wird der Ranglisten-
 * speicher geleert, damit ein Widerruf sofort wirkt.
 *
 * leaderboard_ok_am haelt den Zeitpunkt der letzten Aenderung fest, auch
 * beim Widerruf — so bleibt nachvollziehbar, wann entschieden wurde.
 */
export async function einwilligungSetzen(teilnehmerId, ok) {
  if (!UUID_MUSTER.test(String(teilnehmerId))) return null
  const antwort = await fetch(
    restUrl(`${TABELLE_TEILNEHMER}?id=eq.${encodeURIComponent(teilnehmerId)}`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&select=leaderboard_ok`),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=representation' }),
      body: JSON.stringify({ leaderboard_ok: ok === true, leaderboard_ok_am: new Date().toISOString() }),
    },
  )
  if (!antwort.ok) return null
  const zeilen = await antwort.json().catch(() => null)
  if (!Array.isArray(zeilen) || zeilen.length !== 1) return null
  rangSpeicherLeeren()
  return zeilen[0].leaderboard_ok === true
}
