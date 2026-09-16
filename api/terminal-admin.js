import crypto from 'node:crypto'

import { TERMINAL_KAMPAGNE, deckelNummer } from '../src/data/terminal.js'
import {
  ANSPRUCH_ERST,
  KAMPAGNE,
  SPIEL_SCHLUESSEL,
  TABELLE_ADMIN_VERSUCHE,
  TABELLE_MELDUNGEN,
  TABELLE_SCORES,
  TABELLE_SPIELSTARTS,
  TABELLE_TEILNEHMER,
  TABELLE_ZIEHUNGEN,
  aktivierteZaehlen,
  clean,
  einstellungenLesen,
  einstellungenSchreiben,
  gesamtrankingEinstellungenLesen,
  gleichSicher,
  hauptgamesPruefen,
  preisSaeubern,
  ipHash,
  klientIp,
  konfiguriert,
  kopfzeilen,
  lesen,
  meilensteineSaeubern,
  rangSpeicherLeeren,
  readBody,
  reihenfolgeSaeubern,
  restUrl,
  schreibenErlaubt,
  zaehlen,
} from './_terminal-kern.js'
import { instagramStandLesen, instagramSynchronisieren } from './_terminal-instagram.js'
import {
  HAUPTGAME_BESTAETIGUNG,
  grTeilnehmerZahl,
  gesamtrankingAbschliessen,
  gesamtrankingAdmin,
  hauptgamesProtokollieren,
} from './_terminal-gesamtranking.js'
import { probeErzeugen } from './_terminal-probe.js'

/**
 * Geschuetzter Endpoint der Bierdeckel-Aktion: Liste, Export, Einstellungen,
 * Ziehung, Meldungen.
 *
 * ZUGANG
 * ------
 * Die Website hat keine Benutzeranmeldung — es gibt nichts, woran sich eine
 * Rollenpruefung haengen koennte. Deshalb ein serverseitiges Geheimnis:
 * TERMINAL_ADMIN_TOKEN, geschickt im Kopf x-terminal-admin, verglichen in
 * gleichbleibender Laufzeit. Im ausgelieferten Bundle steht kein Passwort und
 * keine Pruefung — wer die Admin-Seite oeffnet, hat eine Eingabemaske und
 * sonst nichts. Die Entscheidung faellt hier.
 *
 * Fehlt die Variable, ist der Endpoint zu. Kein Standardpasswort, kein
 * „erstmal offen".
 *
 * DIE ZIEHUNG
 * -----------
 * Gezogen wird hier und nur hier:
 *   1. alle tatsaechlich aktivierten Deckelnummern lesen,
 *   2. auf eindeutige Nummern verdichten — drei Besitzansprueche auf #1847
 *      sind ein Los, nicht drei (topfBilden),
 *   3. alle schon gezogenen Nummern abziehen,
 *   4. aus dem Rest mit crypto.randomInt eine auswaehlen.
 *
 * Wer die gezogene Nummer wirklich besitzt, entscheidet der Originaldeckel.
 * Gibt es mehrere Ansprueche, ordnet der Server keinen davon zu; die
 * Verwaltung bestaetigt von Hand genau einen (besitz-bestaetigen).
 *
 * crypto.randomInt, nicht Math.random: letzteres ist vorhersagbar und hat bei
 * einer Ziehung mit echten Gewinnen nichts zu suchen. Gezogen wird aus den
 * aktivierten Nummern — nie aus 1..5000, denn ein nie aktivierter Deckel
 * kann niemandem gehoeren.
 *
 * Die Ziehung wird in videko_terminal_ziehungen protokolliert (Zeitpunkt,
 * Meldefrist, Status) und zusaetzlich in die Einstellungen gespiegelt, weil
 * die oeffentliche Seite genau diese eine Zeile liest.
 */

const { TERMINAL_ADMIN_TOKEN = '' } = process.env

const STATUS_OFFEN = 'offen'
const STATUS_GECLAIMT = 'geclaimt'
const STATUS_ABGELAUFEN = 'abgelaufen'
const STATUS_ERLAUBT = new Set([STATUS_OFFEN, STATUS_GECLAIMT, STATUS_ABGELAUFEN, 'neu_gezogen'])

/** Obergrenze aller Listen. Mehr als die gedruckten Deckel kann es nicht geben. */
const ALLE = TERMINAL_KAMPAGNE.deckelGesamt

/* ------------------------------------------------------------------ */
/* Zugang                                                              */
/* ------------------------------------------------------------------ */

function angemeldet(req) {
  const mitgebracht = clean(req.headers['x-terminal-admin'], 200)
  if (!TERMINAL_ADMIN_TOKEN || !mitgebracht) return false
  return gleichSicher(TERMINAL_ADMIN_TOKEN, mitgebracht)
}

/*
 * Bremse gegen Durchprobieren des Schluessels.
 *
 * Hoechstens ADMIN_MAX_FEHL falsche Schluessel je IP in ADMIN_FENSTER_MS,
 * danach ADMIN_SPERRE_MS gesperrt — auch fuer den richtigen Schluessel, sonst
 * waere die Sperre ein Orakel. Gezaehlt werden nur mitgebrachte, falsche
 * Schluessel; eine erfolgreiche Anmeldung wird nirgends vermerkt, eine
 * Anfrage ganz ohne Schluessel ist kein Rateversuch.
 *
 * Zwei Stufen wie im oeffentlichen Endpoint: im Speicher der Instanz (billig,
 * aber kurzlebig) und belastbar in videko_terminal_admin_versuche (nur
 * IP-Hash). Fehlt die Tabelle, bleibt die Speicherstufe. Die Antwort nennt
 * nie, wie viele Versuche noch bleiben.
 */
const ADMIN_MAX_FEHL = 10
const ADMIN_FENSTER_MS = 10 * 60 * 1000
const ADMIN_SPERRE_MS = 15 * 60 * 1000
const fehlImSpeicher = new Map()
const sperreImSpeicher = new Map()

async function adminGesperrt(hash) {
  const jetzt = Date.now()
  const bis = sperreImSpeicher.get(hash)
  if (bis && bis > jetzt) return true
  if (bis) sperreImSpeicher.delete(hash)
  const seit = encodeURIComponent(new Date(jetzt - ADMIN_SPERRE_MS).toISOString())
  const n = await zaehlen(`${TABELLE_ADMIN_VERSUCHE}?ip_hash=eq.${hash}&art=eq.sperre&created_at=gte.${seit}`)
  return (n ?? 0) > 0
}

async function versuchVermerken(hash, art) {
  try {
    await fetch(restUrl(TABELLE_ADMIN_VERSUCHE), {
      method: 'POST',
      headers: kopfzeilen({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ ip_hash: hash, art }),
    })
  } catch {
    /* ohne Tabelle bleibt die Speicherstufe */
  }
}

/** Einen Fehlversuch vermerken. true, wenn damit die Sperre greift. */
async function fehlversuch(hash) {
  const jetzt = Date.now()
  const alt = (fehlImSpeicher.get(hash) || []).filter((t) => jetzt - t < ADMIN_FENSTER_MS)
  alt.push(jetzt)
  fehlImSpeicher.set(hash, alt)

  await versuchVermerken(hash, 'fehl')
  const seit = encodeURIComponent(new Date(jetzt - ADMIN_FENSTER_MS).toISOString())
  const n = await zaehlen(`${TABELLE_ADMIN_VERSUCHE}?ip_hash=eq.${hash}&art=eq.fehl&created_at=gte.${seit}`)

  if (Math.max(alt.length, n ?? 0) < ADMIN_MAX_FEHL) return false
  sperreImSpeicher.set(hash, jetzt + ADMIN_SPERRE_MS)
  fehlImSpeicher.delete(hash)
  await versuchVermerken(hash, 'sperre')
  return true
}

/** Nur fuer Tests: Speicherstufe leeren. */
export function adminBremseLeeren() {
  fehlImSpeicher.clear()
  sperreImSpeicher.clear()
}

const GESPERRT = { ok: false, grund: 'bremse', meldung: 'Zu viele Versuche. Bitte später erneut.' }

/* ------------------------------------------------------------------ */
/* Lesen                                                               */
/* ------------------------------------------------------------------ */

const TEILNEHMER_SPALTEN =
  'id,deckel_nummer,instagram_handle,email,folgt_bestaetigt_von_nutzer,aktiviert_am,status,'
  + 'anspruch_art,besitz_status,besitz_geprueft_am'

/** Seitengroesse beim Lesen — PostgREST liefert je Anfrage hoechstens so viele Zeilen. */
const SEITE = 1000
/** Obergrenze fuer seitenweises Lesen der Teilnehmer (Ansprueche, nicht Deckel). */
const TEILNEHMER_GRENZE = 50000

/** Alle Zeilen einer Abfrage, seitenweise. `pfad` endet ohne limit/offset. */
async function alleLesen(pfad) {
  const zeilen = []
  for (let von = 0; von < TEILNEHMER_GRENZE; von += SEITE) {
    const seite = await lesen(`${pfad}&limit=${SEITE}&offset=${von}`)
    zeilen.push(...seite)
    if (seite.length < SEITE) break
  }
  return zeilen
}

/**
 * Aktivierungen lesen, optional gefiltert.
 *
 * Gesucht wird nach Deckelnummer oder Instagram-Name. Nicht nach E-Mail-
 * Adresse: die steht in der Liste, aber eine Suche darueber macht aus dem
 * Endpoint ein Werkzeug, mit dem man pruefen kann, ob eine fremde Adresse
 * teilgenommen hat.
 */
async function liste(b) {
  const suche = clean(b.suche, 60)
  let filter = `kampagne=eq.${encodeURIComponent(KAMPAGNE)}`

  const nummer = deckelNummer(suche)
  if (nummer != null) {
    filter += `&deckel_nummer=eq.${nummer}`
  } else if (suche) {
    /* ilike mit Sternchen — PostgREST will sie anstelle von Prozentzeichen. */
    const muster = `*${suche.replace(/[*,()]/g, '')}*`
    filter += `&instagram_handle=ilike.${encodeURIComponent(muster)}`
  }

  /* Nicht mehr durch die Deckelzahl begrenzt: auf eine Nummer koennen
     mehrere Besitzansprueche kommen. */
  return alleLesen(
    `${TABELLE_TEILNEHMER}?select=${TEILNEHMER_SPALTEN}&${filter}`
    + '&order=aktiviert_am.desc,id.asc',
  )
}

async function ziehungen() {
  return lesen(
    `${TABELLE_ZIEHUNGEN}?select=id,deckel_nummer,gezogen_am,meldefrist_bis,status,notiz`
    + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&order=gezogen_am.desc&limit=${ALLE}`,
  )
}

async function meldungen() {
  return lesen(
    `${TABELLE_MELDUNGEN}?select=id,deckel_nummer,instagram_handle,email,nachricht,`
    + `gezogene_nummer,gemeldet_am,status`
    + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&order=gemeldet_am.desc&limit=${ALLE}`,
  )
}

/** Der gesamte Stand in einem Rutsch — die Admin-Seite holt nichts einzeln. */
async function stand() {
  const [einstellungen, aktiviert, eintraege, lose, gemeldet, instagramSync] = await Promise.all([
    einstellungenLesen(),
    aktivierteZaehlen(),
    liste({}),
    ziehungen(),
    meldungen(),
    /* Wirft nie: fehlen die Sync-Spalten, kommen Nullwerte. */
    instagramStandLesen(),
  ])
  return {
    ok: true,
    einstellungen,
    aktiviert: aktiviert ?? eintraege.length,
    teilnehmer: eintraege,
    ziehungen: lose,
    meldungen: gemeldet,
    instagramSync,
    schreiben: schreibenErlaubt(),
  }
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Ein CSV-Feld. Anfuehrungszeichen werden verdoppelt, und ein Feld, das mit
 * =, +, - oder @ beginnt, bekommt ein vorangestelltes Apostroph: sonst
 * behandelt Excel es beim Oeffnen als Formel. Ein Instagram-Name beginnt
 * nun einmal gern mit @.
 */
function feld(wert) {
  let text = wert == null ? '' : String(wert)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

function csvBauen(zeilen) {
  const kopf = [
    'Deckelnummer',
    'Instagram',
    'E-Mail',
    'Follow laut Eigenangabe',
    'Aktiviert am',
    'Status',
    'Anspruch',
    'Besitz',
  ]
  const inhalt = zeilen.map((z) => [
    z.deckel_nummer,
    z.instagram_handle ? `@${z.instagram_handle}` : '',
    z.email ?? '',
    z.folgt_bestaetigt_von_nutzer ? 'ja' : 'nein',
    z.aktiviert_am ?? '',
    z.status ?? '',
    z.anspruch_art ?? ANSPRUCH_ERST,
    z.besitz_status ?? '',
  ])

  /* Semikolon als Trenner und ein BOM voran: so oeffnet Excel unter Windows
     die Datei ohne Importdialog und mit richtigen Umlauten. */
  const text = [kopf, ...inhalt].map((r) => r.map(feld).join(';')).join('\r\n')
  /* \uFEFF ist das BOM, hier als Escape: als echtes Zeichen waere es im
     Quelltext unsichtbar. */
  return `\uFEFF${text}\r\n`
}

/* ------------------------------------------------------------------ */
/* Einstellungen                                                       */
/* ------------------------------------------------------------------ */

/** ISO-Zeitpunkt oder null. Unsinn wird verworfen, nicht geraten. */
function zeitpunkt(roh) {
  const text = clean(roh, 40)
  if (!text) return null
  const d = new Date(text)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function ganzzahl(roh, max) {
  const n = Number(roh)
  if (!Number.isFinite(n)) return null
  const i = Math.trunc(n)
  if (i < 0 || i > max) return null
  return i
}

async function einstellungen(b) {
  const felder = {}

  if ('naechsteZiehung' in b) {
    /* Leeres Feld heisst ausdruecklich „Termin offen" — das ist eine
       Aenderung, kein fehlender Wert. */
    felder.naechste_ziehung = zeitpunkt(b.naechsteZiehung)
  }
  if ('followerZahl' in b) {
    const n = ganzzahl(b.followerZahl, 10_000_000)
    if (n == null) return { ok: false, grund: 'felder' }
    felder.follower_zahl = n
  }
  if ('followerZiel' in b) {
    const n = ganzzahl(b.followerZiel, 10_000_000)
    if (n == null || n === 0) return { ok: false, grund: 'felder' }
    felder.follower_ziel = n
  }
  if ('live' in b) felder.live_modus = b.live === true
  if ('meilensteinGewinne' in b) {
    /* Preisnamen je Meilenstein. Leer gelassen heisst: MYSTERY-ZUSATZGEWINN.
       Unbekannte Stufen und ueberlange Texte fallen beim Saeubern weg. */
    felder.meilenstein_gewinne = meilensteineSaeubern(b.meilensteinGewinne)
  }
  if ('spieleAktiv' in b) {
    /* Nur bekannte Spiele, nur ja/nein. Gespeichert wird beides ausdruecklich:
       Stack und Dash stehen ohne Eintrag auf AUS, die anderen auf AN — ein
       bewusstes Einschalten muss deshalb auch als true stehen bleiben. Die
       Scores bleiben davon unberuehrt. */
    const roh = b.spieleAktiv && typeof b.spieleAktiv === 'object' ? b.spieleAktiv : null
    if (!roh) return { ok: false, grund: 'felder' }
    const aus = {}
    for (const key of SPIEL_SCHLUESSEL) if (typeof roh[key] === 'boolean') aus[key] = roh[key]
    felder.spiele_aktiv = aus
  }
  if ('spieleReihenfolge' in b) {
    if (!Array.isArray(b.spieleReihenfolge)) return { ok: false, grund: 'felder' }
    felder.spiele_reihenfolge = reihenfolgeSaeubern(b.spieleReihenfolge)
  }
  if ('guestPracticeGame' in b) {
    /* Das eine Game ohne aktivierten Deckel. Nur bekannte Spiele. */
    const key = clean(b.guestPracticeGame, 32)
    if (!SPIEL_SCHLUESSEL.includes(key)) return { ok: false, grund: 'felder' }
    felder.guest_practice_game = key
  }

  /* Gesamtranking. Die Warnung „Dieses Game ist Bestandteil des
     Gesamtrankings" zeigt die Oberflaeche; hier wird nur geprueft. */
  const grFelder = ['hauptgames', 'testslot', 'preisGesamt1', 'preisGesamt2', 'preisGesamt3']
  let protokoll = null
  if (grFelder.some((k) => k in b)) {
    const aktuell = await gesamtrankingEinstellungenLesen()
    let hauptgames = aktuell.hauptgames
    if ('hauptgames' in b) {
      const neu = hauptgamesPruefen(b.hauptgames)
      if (!neu) return { ok: false, grund: 'felder' }
      const geaendert = neu.join(',') !== aktuell.hauptgames.join(',')
      /* Nach dem Abschluss gilt der Snapshot. Die Auswahl darf dann nicht
         mehr still auseinanderlaufen — auch nicht mit Bestaetigung. */
      if (aktuell.abgeschlossenAm && geaendert) {
        return { ok: false, grund: 'abgeschlossen' }
      }
      if (geaendert) {
        /* Gibt es schon gewertete Runs, braucht es die zweite, ausdrueckliche
           Bestaetigung. Kann das nicht sicher gelesen werden, gilt: es gibt
           Daten. */
        const teilnehmerZahl = await grTeilnehmerZahl(aktuell.hauptgames)
        const datenDa = teilnehmerZahl == null || teilnehmerZahl > 0
        const bestaetigt = b.bestaetigung === HAUPTGAME_BESTAETIGUNG
        if (datenDa && !bestaetigt) return { ok: false, grund: 'bestaetigung', teilnehmerZahl }
        protokoll = { vorher: aktuell.hauptgames, nachher: neu, teilnehmerZahl, bestaetigt }
      }
      hauptgames = neu
      felder.gesamtranking_spiele = neu
    }
    if ('testslot' in b) {
      const key = clean(b.testslot, 32)
      if (key === '') {
        felder.testslot_game = null
      } else {
        if (!SPIEL_SCHLUESSEL.includes(key) || hauptgames.includes(key)) return { ok: false, grund: 'felder' }
        felder.testslot_game = key
      }
    } else if ('hauptgames' in b && aktuell.testslot && hauptgames.includes(aktuell.testslot)) {
      /* Der bisherige Testslot ist jetzt Hauptgame — dann gibt es keinen. */
      felder.testslot_game = null
    }
    for (const platz of [1, 2, 3]) {
      if (`preisGesamt${platz}` in b) felder[`preis_gesamt_${platz}`] = preisSaeubern(b[`preisGesamt${platz}`])
    }

    /* Sichtbarkeit folgt der Auswahl: was neu Hauptgame oder Testslot wird,
       geht an; was aus beidem herausfaellt, geht aus. Andere Schalter bleiben,
       wie sie sind. */
    const testslot = 'testslot_game' in felder ? felder.testslot_game : aktuell.testslot
    const vorher = new Set([...aktuell.hauptgames, ...(aktuell.testslot ? [aktuell.testslot] : [])])
    const nachher = new Set([...hauptgames, ...(testslot ? [testslot] : [])])
    const rein = [...nachher].filter((k) => !vorher.has(k))
    const raus = [...vorher].filter((k) => !nachher.has(k))
    if (rein.length || raus.length) {
      const schalter = { ...(felder.spiele_aktiv ?? (await einstellungenLesen()).spieleAktiv) }
      for (const k of rein) schalter[k] = true
      for (const k of raus) schalter[k] = false
      felder.spiele_aktiv = schalter
    }
  }

  if (Object.keys(felder).length === 0) return { ok: false, grund: 'felder' }
  if (protokoll && !(await hauptgamesProtokollieren(protokoll))) return { ok: false, grund: 'server' }
  const geschrieben = await einstellungenSchreiben(felder)
  if (!geschrieben) return { ok: false, grund: 'server' }
  /* Neue Hauptgames aendern das Gesamtranking sofort, nicht erst in 20 s. */
  rangSpeicherLeeren()
  return { ok: true, einstellungen: await einstellungenLesen() }
}

/* ------------------------------------------------------------------ */
/* Ziehen                                                              */
/* ------------------------------------------------------------------ */

/**
 * Der Lostopf: jede aktivierte Nummer genau einmal, gezogene Nummern nicht.
 *
 * Aus Teilnehmerzeilen wird eine Menge eindeutiger Nummern. Wie viele
 * Besitzansprueche auf einer Nummer liegen, spielt fuer die Chance keine
 * Rolle — 1, 2, 5 oder 20 Ansprueche sind immer genau ein Los.
 */
export function topfBilden(teilnehmer, lose = []) {
  const schonGezogen = new Set(lose.map((z) => z.deckel_nummer))
  return [...new Set(teilnehmer.map((t) => t.deckel_nummer))]
    .filter((n) => Number.isInteger(n) && !schonGezogen.has(n))
}

/**
 * Eine Nummer ziehen.
 *
 * Ablehnen, solange eine Ziehung offen ist: sonst laufen zwei Meldefristen
 * gleichzeitig und niemand weiss mehr, welche Nummer gesucht wird. Erst
 * zuordnen (geclaimt) oder ablaufen lassen, dann neu ziehen.
 */
async function ziehen() {
  const lose = await ziehungen()
  const offen = lose.find((z) => z.status === STATUS_OFFEN)
  if (offen) return { ok: false, grund: 'offen', ziehung: offen }

  const teilnehmer = await alleLesen(
    `${TABELLE_TEILNEHMER}?select=deckel_nummer`
    + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&order=id.asc`,
  )
  const topf = topfBilden(teilnehmer, lose)

  if (topf.length === 0) return { ok: false, grund: 'leer' }

  /* Hier faellt die Entscheidung. crypto.randomInt liefert eine gleich-
     verteilte Zahl aus einer kryptografischen Quelle — kein Math.random,
     nirgends, und ausdruecklich nicht im Browser. */
  const nummer = topf[crypto.randomInt(0, topf.length)]

  const { meldefristStunden } = await einstellungenLesen()
  const jetzt = new Date()
  const frist = new Date(jetzt.getTime() + meldefristStunden * 60 * 60 * 1000)

  const antwort = await fetch(restUrl(TABELLE_ZIEHUNGEN), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      deckel_nummer: nummer,
      gezogen_am: jetzt.toISOString(),
      meldefrist_bis: frist.toISOString(),
      status: STATUS_OFFEN,
    }),
  })
  if (!antwort.ok) return { ok: false, grund: 'server' }

  const zeilen = await antwort.json().catch(() => null)
  const zeile = Array.isArray(zeilen) ? zeilen[0] : null

  /* Die oeffentliche Seite liest die Einstellungen, nicht das Protokoll.
     Beides wird hier gesetzt — das Protokoll bleibt die Geschichte, die
     Einstellungen sind der aktuelle Aushang. */
  await einstellungenSchreiben({
    gezogene_nummer: nummer,
    meldefrist_bis: frist.toISOString(),
  })

  return { ok: true, ziehung: zeile, einstellungen: await einstellungenLesen() }
}

/**
 * Eine Ziehung abschliessen: zugeordnet oder abgelaufen.
 *
 * In beiden Faellen verschwindet die Nummer vom Aushang. „GESUCHT: #1847"
 * waere falsch, sobald der Deckel abgegeben wurde — und genauso falsch, wenn
 * die Frist verstrichen ist.
 */
async function ziehungStatus(b) {
  const id = clean(b.id, 60)
  const neu = clean(b.status, 20)
  if (!id || !STATUS_ERLAUBT.has(neu)) return { ok: false, grund: 'felder' }

  const antwort = await fetch(
    restUrl(`${TABELLE_ZIEHUNGEN}?id=eq.${encodeURIComponent(id)}`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=representation' }),
      body: JSON.stringify({
        status: neu,
        notiz: clean(b.notiz, 300) || null,
        abgeschlossen_am: neu === STATUS_OFFEN ? null : new Date().toISOString(),
      }),
    },
  )
  if (!antwort.ok) return { ok: false, grund: 'server' }

  if (neu !== STATUS_OFFEN) {
    await einstellungenSchreiben({ gezogene_nummer: null, meldefrist_bis: null })
  }

  return { ok: true, ziehungen: await ziehungen(), einstellungen: await einstellungenLesen() }
}

/**
 * Im Gewinnfall: einen Besitzanspruch als bestaetigt markieren.
 *
 * Die Verwaltung hat den Originaldeckel gesehen und waehlt genau einen
 * Anspruch. Alle anderen Ansprueche derselben Nummer werden als nicht
 * bestaetigt vermerkt — geloescht wird nichts.
 */
async function besitzBestaetigen(b) {
  const id = clean(b.id, 60)
  if (!id) return { ok: false, grund: 'felder' }

  const kampagne = `kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
  const zeilen = await lesen(
    `${TABELLE_TEILNEHMER}?select=id,deckel_nummer&id=eq.${encodeURIComponent(id)}&${kampagne}&limit=1`,
  )
  const zeile = zeilen[0]
  if (!zeile || !Number.isInteger(zeile.deckel_nummer)) return { ok: false, grund: 'felder' }

  const jetzt = new Date().toISOString()
  const setzen = (filter, status) => fetch(restUrl(`${TABELLE_TEILNEHMER}?${filter}`), {
    method: 'PATCH',
    headers: kopfzeilen({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ besitz_status: status, besitz_geprueft_am: jetzt }),
  })

  const bestaetigt = await setzen(`id=eq.${encodeURIComponent(zeile.id)}&${kampagne}`, 'bestaetigt')
  if (!bestaetigt.ok) return { ok: false, grund: 'server' }
  const andere = await setzen(
    `${kampagne}&deckel_nummer=eq.${zeile.deckel_nummer}&id=neq.${encodeURIComponent(zeile.id)}`,
    'nicht_bestaetigt',
  )
  if (!andere.ok) return { ok: false, grund: 'server' }

  return stand()
}

/** Eine Gewinnmeldung abhaken. Geprueft wird von Hand, hier wird notiert. */
async function meldungStatus(b) {
  const id = clean(b.id, 60)
  const neu = clean(b.status, 20)
  if (!id || !['offen', 'geprueft', 'bestaetigt', 'abgelehnt'].includes(neu)) {
    return { ok: false, grund: 'felder' }
  }

  const antwort = await fetch(
    restUrl(`${TABELLE_MELDUNGEN}?id=eq.${encodeURIComponent(id)}`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ status: neu, notiz: clean(b.notiz, 300) || null }),
    },
  )
  if (!antwort.ok) return { ok: false, grund: 'server' }
  return { ok: true, meldungen: await meldungen() }
}

/* ------------------------------------------------------------------ */
/* Game-Leaderboard                                                    */
/* ------------------------------------------------------------------ */

/**
 * Die Moderation der Spielergebnisse.
 *
 * ZWEI DINGE, DIE HIER BEWUSST FEHLEN
 * -----------------------------------
 * 1. Loeschen. Ein auffaelliger Lauf wird auf `verworfen` gesetzt und
 *    verschwindet damit aus jeder Wertung — der Datensatz bleibt aber
 *    erhalten. Eine Fehlentscheidung laesst sich so zuruecknehmen; ein
 *    geloeschter Lauf waere weg. Fuer die alltaegliche Moderation ist
 *    endgueltiges Loeschen schlicht nicht noetig.
 * 2. Ziehungsdaten. Zu einem Lauf wird ausschliesslich der Instagram-Name
 *    nachgeschlagen, nie die Deckelnummer und nie die E-Mail. Wer einen Lauf
 *    aus der Wertung nimmt, aendert damit nichts an der Teilnahme dieser
 *    Person an der Ziehung — und soll die Ziehungsdaten in diesem Bereich
 *    auch gar nicht vor sich haben.
 */

const SCORE_STATUS = new Set(['gueltig', 'verdacht', 'verworfen'])
const SCORE_SPALTEN = 'id,teilnehmer_id,game,score,status,dauer_ms,runden,notiz,created_at'
const SCORE_GRENZE = 500

/**
 * Die Namen zu einer Menge von Teilnehmer-IDs.
 *
 * Anders als in der oeffentlichen Rangliste wird hier NICHT auf
 * `leaderboard_ok` gefiltert: die Moderation muss auch einen Lauf zuordnen
 * koennen, dessen Name oeffentlich nicht erscheint. Gelesen werden trotzdem
 * nur id und Name.
 */
async function scoreNamen(ids) {
  const sauber = [...new Set(ids.filter(Boolean).map(String))]
  const karte = new Map()
  for (let i = 0; i < sauber.length; i += 120) {
    const teil = sauber.slice(i, i + 120)
    const zeilen = await lesen(
      `${TABELLE_TEILNEHMER}?select=id,instagram_handle`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
      + `&id=in.(${teil.join(',')})`,
    )
    for (const z of zeilen) karte.set(z.id, clean(z.instagram_handle, 40) || null)
  }
  return karte
}

/**
 * Die Laufliste fuer die Verwaltung.
 *
 * `filter` schraenkt auf einen Status ein, `suche` auf einen Instagram-Namen
 * oder eine Deckelnummer — die Nummer wird nur zum Nachschlagen der Person
 * benutzt und nicht zurueckgegeben.
 */
async function scores(b) {
  const filter = clean(b.filter, 20)
  const suche = clean(b.suche, 60)

  let abfrage = `kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
  if (SCORE_STATUS.has(filter)) abfrage += `&status=eq.${filter}`

  const spiel = clean(b.game, 20)
  if (spiel) abfrage += `&game=eq.${encodeURIComponent(spiel)}`

  if (suche) {
    /* Erst die passenden Personen suchen, dann deren Laeufe holen. Zwei
       Abfragen statt eines Joins — PostgREST koennte das auch in einem
       Aufruf, aber dann stuenden die Teilnehmerspalten in der Antwort, und
       genau das soll hier nicht passieren. */
    const nummer = deckelNummer(suche)
    let personenFilter = `kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
    if (nummer != null) personenFilter += `&deckel_nummer=eq.${nummer}`
    else personenFilter += `&instagram_handle=ilike.${encodeURIComponent(`*${suche.replace(/[*,()]/g, '')}*`)}`

    const treffer = await lesen(`${TABELLE_TEILNEHMER}?select=id&${personenFilter}&limit=200`)
    if (treffer.length === 0) return { ok: true, scores: [] }
    abfrage += `&teilnehmer_id=in.(${treffer.map((t) => t.id).join(',')})`
  }

  const zeilen = await lesen(
    `${TABELLE_SCORES}?select=${SCORE_SPALTEN}&${abfrage}`
    + `&order=created_at.desc&limit=${SCORE_GRENZE}`,
  )

  const namen = await scoreNamen(zeilen.map((z) => z.teilnehmer_id))
  return {
    ok: true,
    scores: zeilen.map((z) => ({
      id: z.id,
      instagram: namen.get(z.teilnehmer_id) ?? null,
      game: z.game,
      score: Number(z.score),
      status: z.status,
      dauerMs: z.dauer_ms,
      runden: z.runden,
      notiz: z.notiz,
      wann: z.created_at,
    })),
  }
}

/**
 * Einen Lauf aus der Wertung nehmen oder wieder freigeben.
 *
 * `verworfen` nimmt ihn aus jeder oeffentlichen Liste, `gueltig` gibt ihn
 * frei, `verdacht` markiert ihn zur spaeteren Pruefung. Geloescht wird nie.
 */
async function scoreStatus(b) {
  const id = clean(b.id, 60)
  const neu = clean(b.status, 20)
  if (!id || !SCORE_STATUS.has(neu)) return { ok: false, grund: 'felder' }

  const antwort = await fetch(
    restUrl(`${TABELLE_SCORES}?id=eq.${encodeURIComponent(id)}`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ status: neu }),
    },
  )
  if (!antwort.ok) return { ok: false, grund: 'server' }

  /* Die Ranglisten haengen an einem kurzen Zwischenspeicher. Nach einer
     Statusaenderung soll die oeffentliche Liste nicht noch zwanzig Sekunden
     den verworfenen Lauf zeigen. */
  rangSpeicherLeeren()

  return scores(b)
}

/* ------------------------------------------------------------------ */
/* Game-Statistik                                                      */
/* ------------------------------------------------------------------ */

/**
 * Kennzahlen je Spiel — nur Zahlen, keine Namen, keine IDs in der Antwort.
 *
 * Gezaehlt werden alle gespeicherten Laeufe ausser 'verworfen'.
 *
 *   laeufe            — Anzahl Laeufe
 *   spieler           — verschiedene Teilnehmer
 *   laeufeJeSpieler   — laeufe / spieler
 *   anteilMehrfach    — Anteil der Spieler mit mindestens zwei Laeufen
 *   dauerSchnitt      — mittlere Dauer in ms
 *   dauerMedian       — Median der Dauer in ms
 *   scoreMedian       — Median der Punktzahl
 *   anteilVerdacht    — Anteil der Laeufe mit Status 'verdacht'
 *   replayRate        — Anteil der Laeufe, die innerhalb von fuenf Minuten
 *                       nach dem Ende des vorherigen Laufs derselben Person
 *                       im selben Spiel beginnen — also "direkt nochmal".
 *
 * Gelesen wird seitenweise; bei sehr vielen Laeufen deckelt STATS_GRENZE.
 */
const STATS_SEITE = 1000
const STATS_GRENZE = 50000
const REPLAY_FENSTER_MS = 5 * 60 * 1000
const SCHNELL_FENSTER_MS = 60 * 1000

function median(werte) {
  if (werte.length === 0) return null
  const s = [...werte].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

const anteil = (teil, ganz) => (ganz > 0 ? Math.round((teil / ganz) * 1000) / 1000 : null)

async function statistik() {
  const zeilen = []
  for (let von = 0; von < STATS_GRENZE; von += STATS_SEITE) {
    const seite = await lesen(
      `${TABELLE_SCORES}?select=teilnehmer_id,game,score,status,dauer_ms,lauf_id,created_at`
      + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&status=neq.verworfen`
      + `&order=created_at.asc&limit=${STATS_SEITE}&offset=${von}`,
    )
    zeilen.push(...seite)
    if (seite.length < STATS_SEITE) break
  }

  /* Spielstarts (seit dem Game-Lab vermerkt). Fehlt die Tabelle noch, bleibt
     die Abbruchquote leer — der Rest der Statistik laeuft trotzdem. */
  const starts = []
  try {
    for (let von = 0; von < STATS_GRENZE; von += STATS_SEITE) {
      const seite = await lesen(
        `${TABELLE_SPIELSTARTS}?select=game,lauf_id,created_at`
        + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
        + `&order=created_at.asc&limit=${STATS_SEITE}&offset=${von}`,
      )
      starts.push(...seite)
      if (seite.length < STATS_SEITE) break
    }
  } catch {
    /* ohne Starts */
  }
  const beendet = new Set(zeilen.map((z) => z.lauf_id).filter(Boolean))

  const spiele = {}
  for (const game of SPIEL_SCHLUESSEL) {
    const laeufe = zeilen.filter((z) => z.game === game)
    const jePerson = new Map()
    for (const z of laeufe) {
      const liste = jePerson.get(z.teilnehmer_id) || []
      liste.push(z)
      jePerson.set(z.teilnehmer_id, liste)
    }

    let replays = 0
    let replays60 = 0
    for (const liste of jePerson.values()) {
      for (let i = 1; i < liste.length; i += 1) {
        const ende = new Date(liste[i - 1].created_at).getTime()
        const beginn = new Date(liste[i].created_at).getTime() - (Number(liste[i].dauer_ms) || 0)
        if (beginn - ende <= REPLAY_FENSTER_MS) replays += 1
        if (beginn - ende <= SCHNELL_FENSTER_MS) replays60 += 1
      }
    }

    /* Abbruch: Starts, zu denen nie ein Ergebnis kam. Nur Starts, die aelter
       als zehn Minuten sind — juengere koennen noch laufen. */
    const grenze = Date.now() - 10 * 60 * 1000
    const eigeneStarts = starts.filter((s) => s.game === game && new Date(s.created_at).getTime() < grenze)
    const abgebrochen = eigeneStarts.filter((s) => !beendet.has(s.lauf_id)).length
    const laeufeJePerson = [...jePerson.values()].map((l) => l.length)

    const dauern = laeufe.map((z) => Number(z.dauer_ms)).filter((n) => Number.isFinite(n) && n >= 0)
    const spieler = jePerson.size
    spiele[game] = {
      laeufe: laeufe.length,
      spieler,
      laeufeJeSpieler: spieler > 0 ? Math.round((laeufe.length / spieler) * 100) / 100 : null,
      anteilMehrfach: anteil([...jePerson.values()].filter((l) => l.length >= 2).length, spieler),
      dauerSchnitt: dauern.length ? Math.round(dauern.reduce((a, n) => a + n, 0) / dauern.length) : null,
      dauerMedian: median(dauern),
      scoreMedian: median(laeufe.map((z) => Number(z.score) || 0)),
      anteilVerdacht: anteil(laeufe.filter((z) => z.status === 'verdacht').length, laeufe.length),
      replayRate: anteil(replays, laeufe.length),
      /* Anteil der Laeufe, auf die binnen 60 s ein neuer Lauf derselben Person
         folgte (Game Over -> NOCHMAL). */
      replay60: anteil(replays60, laeufe.length),
      laeufeMedianJeSpieler: median(laeufeJePerson),
      anteilDreiPlus: anteil(laeufeJePerson.filter((n) => n >= 3).length, spieler),
      starts: eigeneStarts.length,
      abbruchQuote: anteil(abgebrochen, eigeneStarts.length),
    }
  }
  return { ok: true, spiele, gekappt: zeilen.length >= STATS_GRENZE }
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ ok: false, grund: 'methode' })
    return
  }

  /* Keine Suchmaschine, kein Zwischenspeicher. */
  res.setHeader('Cache-Control', 'no-store')

  if (!konfiguriert() || !TERMINAL_ADMIN_TOKEN) {
    res.status(503).json({
      ok: false,
      grund: 'server',
      meldung: 'Die Verwaltung ist nicht eingerichtet.',
    })
    return
  }

  const hash = ipHash(klientIp(req))
  if (await adminGesperrt(hash)) {
    res.status(429).json(GESPERRT)
    return
  }

  if (!angemeldet(req)) {
    /* Eine Antwort fuer jeden Fehlversuch, ohne Unterschied zwischen „kein
       Token" und „falsches Token". Die Sperre greift erst beim naechsten
       Aufruf — so sieht der zehnte Fehlversuch aus wie der erste. */
    if (clean(req.headers['x-terminal-admin'], 200)) await fehlversuch(hash)
    res.status(401).json({ ok: false, grund: 'zugang' })
    return
  }

  const b = await readBody(req)
  const aktion = clean(b.aktion, 20)

  try {
    if (aktion === 'stand') {
      res.status(200).json(await stand())
      return
    }

    if (aktion === 'suche') {
      res.status(200).json({ ok: true, teilnehmer: await liste(b) })
      return
    }

    if (aktion === 'csv') {
      res.status(200).json({ ok: true, csv: csvBauen(await liste({})) })
      return
    }

    if (aktion === 'einstellungen') {
      const ergebnis = await einstellungen(b)
      res.status(ergebnis.ok ? 200 : 400).json(ergebnis)
      return
    }

    if (aktion === 'ziehen') {
      if (!schreibenErlaubt()) {
        res.status(503).json({ ok: false, grund: 'pause' })
        return
      }
      const ergebnis = await ziehen()
      res.status(ergebnis.ok ? 200 : 409).json(ergebnis)
      return
    }

    if (aktion === 'ziehung-status') {
      const ergebnis = await ziehungStatus(b)
      res.status(ergebnis.ok ? 200 : 400).json(ergebnis)
      return
    }

    if (aktion === 'besitz-bestaetigen') {
      if (!schreibenErlaubt()) {
        res.status(503).json({ ok: false, grund: 'pause' })
        return
      }
      const ergebnis = await besitzBestaetigen(b)
      res.status(ergebnis.ok ? 200 : 400).json(ergebnis)
      return
    }

    if (aktion === 'meldung-status') {
      const ergebnis = await meldungStatus(b)
      res.status(ergebnis.ok ? 200 : 400).json(ergebnis)
      return
    }

    if (aktion === 'scores') {
      res.status(200).json(await scores(b))
      return
    }

    if (aktion === 'score-status') {
      const ergebnis = await scoreStatus(b)
      res.status(ergebnis.ok ? 200 : 400).json(ergebnis)
      return
    }

    if (aktion === 'stats') {
      res.status(200).json(await statistik())
      return
    }

    if (aktion === 'gesamtranking') {
      res.status(200).json(await gesamtrankingAdmin())
      return
    }

    if (aktion === 'gr-abschliessen') {
      if (!schreibenErlaubt()) {
        res.status(503).json({ ok: false, grund: 'pause' })
        return
      }
      const { status, ...ergebnis } = await gesamtrankingAbschliessen()
      res.status(ergebnis.ok ? 200 : (status ?? 409)).json(ergebnis)
      return
    }

    /* Instagram-Follower jetzt holen — dasselbe, was der Cron stuendlich tut.
       Haengt wie 'einstellungen' nicht an TERMINAL_SCHREIBEN: es aendert nur
       die Anzeige der Followerzahl, keine Teilnahme und keine Ziehung. */
    if (aktion === 'instagram-sync') {
      const ergebnis = await instagramSynchronisieren()
      res.status(ergebnis.ok ? 200 : 502).json({
        ok: ergebnis.ok,
        grund: ergebnis.grund ?? null,
        wert: ergebnis.wert ?? null,
        am: ergebnis.am,
        hinweis: ergebnis.hinweis ?? null,
        stand: await instagramStandLesen(),
      })
      return
    }

    /* Testlabor. Hier — und nur hier — entsteht ein Testbeleg, und zwar erst
       hinter der Admin-Anmeldung ein paar Zeilen weiter oben. Der Browser
       bekommt ausschliesslich diesen Beleg; der Admin-Schluessel bleibt, wo er
       ist, und steht weder in der Adresszeile noch im Bundle.

       Der Beleg kann nichts weiter, als die oeffentliche Seite in den
       Testmodus zu versetzen. Er oeffnet keine Verwaltung, er aendert nichts
       und er gehoert zu keinem Datensatz. */
    if (aktion === 'testsession') {
      res.status(200).json({ ok: true, probe: probeErzeugen({ aktiv: false, leaderboardOk: b.leaderboardOk !== false }) })
      return
    }
  } catch {
    res.status(500).json({ ok: false, grund: 'server' })
    return
  }

  res.status(400).json({ ok: false, grund: 'aktion' })
}
