/**
 * Datenverwaltung: die physischen Deckeldaten einer Kampagne ansehen und
 * zuruecksetzen.
 *
 * WAS HIER "DECKELDATEN" HEISST
 * -----------------------------
 * Alles, was an einer gedruckten Nummer haengt:
 *   - die Nummer selbst an einer Teilnehmerzeile (`deckel_nummer`) samt
 *     Aktivierungszeitpunkt und Besitzpruefung,
 *   - die Zeilen in videko_terminal_ziehungen (gezogene Nummern),
 *   - die Zeilen in videko_terminal_meldungen (Gewinnmeldungen zu Nummern),
 *   - die Zeilen in videko_terminal_wiederherstellung (Zugangstoken).
 *
 * WAS HIER NIE ANGEFASST WIRD
 * ---------------------------
 * Der Spieler selbst. Seine Zeile bleibt stehen, mit Instagram-Name,
 * E-Mail, Einwilligungen, Einladungskette (`eingeladen_von`), Herkunft
 * (`registrierungsquelle`) und Registrierungszeitpunkt. Und vor allem:
 * videko_terminal_scores wird von dieser Datei nicht einmal gelesen —
 * ausser um zu zeigen, wie viele Laeufe erhalten bleiben. Leaderboards,
 * Gesamtranking und Einladungen laufen danach unveraendert weiter.
 *
 * Das ist keine Nebensache, sondern die Trennlinie der ganzen Aktion: das
 * Game-Ranking haengt an `folgt_bestaetigt_von_nutzer` und am
 * Instagram-Namen (`rankingBerechtigt`), die Ziehung an der Deckelnummer
 * (`ziehungBerechtigt`). Wer hier zuruecksetzt, nimmt Lose weg, keine
 * Punkte.
 *
 * WARUM AUS 'offiziell' EIN 'gast' WIRD
 * -------------------------------------
 * Die Datenbank erzwingt das:
 *   videko_terminal_offiziell_deckel_chk:
 *     teilnahme_status <> 'offiziell' OR deckel_nummer IS NOT NULL
 *   videko_terminal_gast_ohne_deckel_chk:
 *     teilnahme_status <> 'gast'      OR deckel_nummer IS NULL
 * Eine Nummer laesst sich also gar nicht loeschen, ohne den Status
 * mitzusetzen. `teilnahme_status` beantwortet ohnehin nur noch die eine
 * Frage "haengt ein Los an diesem Konto?" — fuer Ranglisten, Spielrecht und
 * Einladungen wird es nicht mehr herangezogen (siehe _terminal-einladungen).
 *
 * WAS STEHENBLEIBT — UND WARUM
 * ----------------------------
 * `anspruch_art` kennt nur 'erstaktivierung' und 'weiterer_besitzanspruch';
 * einen neutralen Wert gibt es im CHECK nicht. Der Rest bleibt deshalb als
 * bedeutungsloser Vermerk stehen. Wirkung hat er keine mehr: jede Zaehlung
 * physischer Aktivierungen verlangt zusaetzlich `teilnahme_status =
 * 'offiziell'` (siehe `aktivierteZaehlen`), und der steht danach auf 'gast'.
 * Eine Schemaaenderung dafuer waere teurer als der Vermerk.
 *
 * KEINE ECHTE TRANSAKTION
 * -----------------------
 * PostgREST kennt keine mehrteilige Transaktion ohne eigene
 * Datenbankfunktion. Stattdessen ist jeder Schritt fuer sich idempotent und
 * die Reihenfolge so gewaehlt, dass ein Abbruch nichts Widerspruechliches
 * hinterlaesst: erst die abhaengigen Tabellen, zuletzt die Teilnehmerzeile.
 * Bricht es in der Mitte ab, ist ein zweiter Aufruf die Reparatur — und der
 * zurueckgegebene `nachher`-Stand zeigt ungeschminkt, was noch dasteht.
 */

import { deckelNummer } from '../src/data/terminal.js'
import {
  ANSPRUCH_ERST,
  KAMPAGNE,
  NUR_OFFIZIELLE,
  STATUS_GAST,
  TABELLE_MELDUNGEN,
  TABELLE_SCORES,
  TABELLE_TEILNEHMER,
  TABELLE_WIEDER,
  TABELLE_ZIEHUNGEN,
  clean,
  kopfzeilen,
  lesen,
  restUrl,
  zaehlen,
} from './_terminal-kern.js'

/** Das Wort, das der Admin abtippen muss. Nichts daran ist versehentlich. */
export const RESET_WORT = 'DECKEL LÖSCHEN'

const kampagne = `kampagne=eq.${encodeURIComponent(KAMPAGNE)}`

/** Hoechstzahl gelisteter Nummern. Mehr Deckel gibt es nicht. */
const LISTE_MAX = 5000

/**
 * Die Felder, die eine Teilnehmerzeile vom Deckel loesen.
 *
 * `teilnahme_status` muss mit, sonst verweigert der CHECK das UPDATE.
 * `gast_konvertiert_am` ebenfalls: der Vermerk bedeutet "hat spaeter einen
 * Deckel nachgeruestet" und waere ohne Deckel schlicht falsch.
 *
 * `deckel_aktiviert` steht ausdruecklich NICHT hier: die Spalte ist
 * `GENERATED ALWAYS AS (deckel_nummer IS NOT NULL) STORED`. Postgres
 * verweigert jedes Schreiben darauf ("can only be updated to DEFAULT") und
 * laesst das ganze UPDATE scheitern. Sie raeumt sich von selbst, sobald die
 * Nummer faellt.
 */
const GELOEST = {
  deckel_nummer: null,
  teilnahme_status: STATUS_GAST,
  deckel_aktiviert_am: null,
  besitz_status: null,
  besitz_geprueft_am: null,
  gast_konvertiert_am: null,
}

/** Dieselben Felder ohne Statuswechsel — fuer Reste ohne Nummer. */
const GELOEST_RESTE = {
  deckel_aktiviert_am: null,
  besitz_status: null,
  besitz_geprueft_am: null,
}

/**
 * Schreiben mit Zaehlung. Gibt die Zahl betroffener Zeilen zurueck, `null`
 * wenn die Anfrage gescheitert ist — die beiden zu verwechseln waere fatal,
 * deshalb nie `0` als Ersatz fuer einen Fehler.
 */
let letzterFehler = null

async function schreiben(methode, pfad, koerper = null) {
  const antwort = await fetch(restUrl(pfad), {
    method: methode,
    headers: kopfzeilen({ Prefer: 'return=minimal,count=exact' }),
    ...(koerper ? { body: JSON.stringify(koerper) } : {}),
  })
  if (!antwort.ok) {
    /* Ohne diesen Satz steht der Admin vor einem blanken "server" und kann
       nichts damit anfangen. PostgREST-Fehler nennen Spalte und Constraint,
       keine Zugangsdaten; gekappt, damit nichts Langes durchrutscht. */
    const text = await antwort.text().catch(() => '')
    letzterFehler = `${antwort.status} ${text.replace(/\s+/g, ' ').slice(0, 200)}`.trim()
    return null
  }
  const bereich = antwort.headers.get('content-range') || ''
  const n = Number(bereich.split('/')[1])
  return Number.isFinite(n) ? n : 0
}

/** Die Absage eines gescheiterten Schritts, samt Grund aus der Datenbank. */
const serverFehler = () => ({ ok: false, grund: 'server', detail: letzterFehler })

/** Eine `in.()`-Liste aus Ids. Nur, was wie eine Id aussieht. */
const inListe = (ids) =>
  `(${ids.map((id) => encodeURIComponent(String(id))).join(',')})`

/* ------------------------------------------------------------------ */
/* Ansehen                                                             */
/* ------------------------------------------------------------------ */

/**
 * Der Deckelstand in Zahlen — zugleich der Dry-Run vor jedem Reset und die
 * Kontrolle danach. `aktiviert` ist die Zahl, die nach einem vollstaendigen
 * Reset auf 0 stehen muss.
 */
export async function deckelStand() {
  const [aktiviert, ansprueche, erst, weiterer, wieder, gezogen, gemeldet, scores] =
    await Promise.all([
      zaehlen(`${TABELLE_TEILNEHMER}?${kampagne}&anspruch_art=eq.${ANSPRUCH_ERST}${NUR_OFFIZIELLE}`),
      zaehlen(`${TABELLE_TEILNEHMER}?${kampagne}&deckel_nummer=not.is.null`),
      zaehlen(`${TABELLE_TEILNEHMER}?${kampagne}&deckel_nummer=not.is.null&anspruch_art=eq.${ANSPRUCH_ERST}`),
      zaehlen(`${TABELLE_TEILNEHMER}?${kampagne}&deckel_nummer=not.is.null&anspruch_art=neq.${ANSPRUCH_ERST}`),
      zaehlen(`${TABELLE_WIEDER}?${kampagne}`),
      zaehlen(`${TABELLE_ZIEHUNGEN}?${kampagne}`),
      zaehlen(`${TABELLE_MELDUNGEN}?${kampagne}`),
      zaehlen(`${TABELLE_SCORES}?${kampagne}`),
    ])

  /* Die belegten Nummern mit Namen: der Admin soll vor dem Loeschen sehen,
     was daran haengt, und nicht nur eine Zahl. */
  const zeilen = await lesen(
    `${TABELLE_TEILNEHMER}?select=id,deckel_nummer,instagram_handle,anspruch_art,`
    + `deckel_aktiviert_am,besitz_status&${kampagne}&deckel_nummer=not.is.null`
    + `&order=deckel_nummer.asc,id.asc&limit=${LISTE_MAX}`,
  )

  return {
    ok: true,
    stand: {
      aktiviert: aktiviert ?? 0,
      ansprueche: ansprueche ?? 0,
      erstaktivierungen: erst ?? 0,
      weitereAnsprueche: weiterer ?? 0,
      wiederherstellungen: wieder ?? 0,
      ziehungen: gezogen ?? 0,
      meldungen: gemeldet ?? 0,
      /* Nur zur Anzeige: die Zahl, die der Reset nicht anruehrt. */
      scores: scores ?? 0,
      teilnehmerGesamt: (await zaehlen(`${TABELLE_TEILNEHMER}?${kampagne}`)) ?? 0,
      belegt: zeilen.map((z) => ({
        id: z.id,
        nummer: z.deckel_nummer,
        instagram: z.instagram_handle ?? null,
        anspruch: z.anspruch_art ?? null,
        aktiviertAm: z.deckel_aktiviert_am ?? null,
        besitz: z.besitz_status ?? null,
      })),
    },
  }
}

/**
 * Was am Zuruecksetzen einer einzelnen Nummer haengen wuerde.
 *
 * Es zaehlt ausdruecklich auch die Scores mit — nicht, weil sie geloescht
 * wuerden, sondern damit im Dialog steht, was erhalten bleibt.
 */
export async function deckelVorschau(roh) {
  const nummer = deckelNummer(roh)
  if (nummer == null) return { ok: false, grund: 'felder' }

  const treffer = await lesen(
    `${TABELLE_TEILNEHMER}?select=id,deckel_nummer,instagram_handle,anspruch_art,`
    + `aktiviert_am,deckel_aktiviert_am,besitz_status,teilnahme_status,registrierungsquelle,`
    + `eingeladen_von,folgt_bestaetigt_von_nutzer&${kampagne}&deckel_nummer=eq.${nummer}`
    + '&order=aktiviert_am.asc,id.asc',
  )
  const ids = treffer.map((t) => t.id).filter(Boolean)

  const [wieder, gezogen, gemeldet, scores] = await Promise.all([
    ids.length ? zaehlen(`${TABELLE_WIEDER}?${kampagne}&teilnehmer_id=in.${inListe(ids)}`) : 0,
    zaehlen(`${TABELLE_ZIEHUNGEN}?${kampagne}&deckel_nummer=eq.${nummer}`),
    zaehlen(`${TABELLE_MELDUNGEN}?${kampagne}&or=(deckel_nummer.eq.${nummer},gezogene_nummer.eq.${nummer})`),
    ids.length ? zaehlen(`${TABELLE_SCORES}?${kampagne}&teilnehmer_id=in.${inListe(ids)}`) : 0,
  ])

  return {
    ok: true,
    vorschau: {
      nummer,
      gefunden: treffer.length,
      teilnehmer: treffer.map((t) => ({
        id: t.id,
        instagram: t.instagram_handle ?? null,
        anspruch: t.anspruch_art ?? null,
        registriertAm: t.aktiviert_am ?? null,
        aktiviertAm: t.deckel_aktiviert_am ?? null,
        besitz: t.besitz_status ?? null,
        status: t.teilnahme_status ?? null,
        quelle: t.registrierungsquelle ?? null,
        eingeladen: Boolean(t.eingeladen_von),
        folgtBestaetigt: t.folgt_bestaetigt_von_nutzer === true,
      })),
      wiederherstellungen: wieder ?? 0,
      ziehungen: gezogen ?? 0,
      meldungen: gemeldet ?? 0,
      /* bleibt erhalten */
      scores: scores ?? 0,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Zuruecksetzen                                                       */
/* ------------------------------------------------------------------ */

/**
 * Eine einzelne Nummer loesen. Der Spieler bleibt, sein Deckel geht.
 *
 * Reihenfolge: Ziehung und Meldung zur Nummer, dann die Zugangstoken der
 * betroffenen Zeilen, zuletzt die Zeilen selbst. Waere es umgekehrt, stuende
 * nach einem Abbruch eine gezogene Nummer ohne Besitzer da.
 */
export async function deckelReset(roh) {
  const nummer = deckelNummer(roh)
  if (nummer == null) return { ok: false, grund: 'felder' }

  const treffer = await lesen(
    `${TABELLE_TEILNEHMER}?select=id&${kampagne}&deckel_nummer=eq.${nummer}`,
  )
  const ids = treffer.map((t) => t.id).filter(Boolean)

  const gezogen = await schreiben(
    'DELETE', `${TABELLE_ZIEHUNGEN}?${kampagne}&deckel_nummer=eq.${nummer}`,
  )
  if (gezogen === null) return { ...serverFehler(), schritt: 'ziehungen' }

  const gemeldet = await schreiben(
    'DELETE',
    `${TABELLE_MELDUNGEN}?${kampagne}&or=(deckel_nummer.eq.${nummer},gezogene_nummer.eq.${nummer})`,
  )
  if (gemeldet === null) return { ...serverFehler(), schritt: 'meldungen' }

  let wieder = 0
  let geloest = 0
  if (ids.length) {
    wieder = await schreiben(
      'DELETE', `${TABELLE_WIEDER}?${kampagne}&teilnehmer_id=in.${inListe(ids)}`,
    )
    if (wieder === null) return { ...serverFehler(), schritt: 'wiederherstellung' }

    geloest = await schreiben(
      'PATCH', `${TABELLE_TEILNEHMER}?${kampagne}&deckel_nummer=eq.${nummer}`, GELOEST,
    )
    if (geloest === null) return { ...serverFehler(), schritt: 'teilnehmer' }
  }

  const { stand } = await deckelStand()
  return {
    ok: true,
    nummer,
    geaendert: { teilnehmer: geloest, wiederherstellungen: wieder, ziehungen: gezogen, meldungen: gemeldet },
    stand,
  }
}

/**
 * Alle physischen Deckeldaten der Kampagne zuruecksetzen.
 *
 * Verlangt das ausgeschriebene Wort im Klartext. Die Pruefung steht hier auf
 * dem Server, nicht im Browser: eine Loeschung, die sich mit einem
 * fetch-Aufruf ausloesen laesst, waere keine.
 */
export async function deckelResetAlle(b) {
  const wort = clean(b?.bestaetigung, 40)
  if (wort !== RESET_WORT) return { ok: false, grund: 'bestaetigung' }

  const vorher = (await deckelStand()).stand

  const gezogen = await schreiben('DELETE', `${TABELLE_ZIEHUNGEN}?${kampagne}`)
  if (gezogen === null) return { ...serverFehler(), schritt: 'ziehungen' }

  const gemeldet = await schreiben('DELETE', `${TABELLE_MELDUNGEN}?${kampagne}`)
  if (gemeldet === null) return { ...serverFehler(), schritt: 'meldungen' }

  const wieder = await schreiben('DELETE', `${TABELLE_WIEDER}?${kampagne}`)
  if (wieder === null) return { ...serverFehler(), schritt: 'wiederherstellung' }

  const geloest = await schreiben(
    'PATCH', `${TABELLE_TEILNEHMER}?${kampagne}&deckel_nummer=not.is.null`, GELOEST,
  )
  if (geloest === null) return { ...serverFehler(), schritt: 'teilnehmer' }

  /* Altzeilen, an denen ein Aktivierungsdatum oder eine Besitzpruefung klebt,
     obwohl gar keine Nummer mehr dransteht. Ohne Statuswechsel — der stimmt
     bei ihnen schon.

     `deckel_aktiviert` gehoert nicht in diesen Filter: die generierte Spalte
     steht bei einer Zeile ohne Nummer auf `false`, nie auf NULL. Ein
     `not.is.null` darauf traefe also jede Gastzeile und bliese die gemeldete
     Zahl auf. */
  const reste = await schreiben(
    'PATCH',
    `${TABELLE_TEILNEHMER}?${kampagne}&deckel_nummer=is.null`
    + '&or=(deckel_aktiviert_am.not.is.null,besitz_status.not.is.null)',
    GELOEST_RESTE,
  )
  if (reste === null) return { ...serverFehler(), schritt: 'reste' }

  const nachher = (await deckelStand()).stand
  return {
    ok: true,
    geaendert: {
      teilnehmer: geloest,
      reste,
      wiederherstellungen: wieder,
      ziehungen: gezogen,
      meldungen: gemeldet,
    },
    vorher,
    stand: nachher,
    /* Die eine Zahl, an der sich der Erfolg messen laesst. */
    sauber: (nachher.aktiviert ?? 0) === 0 && (nachher.ansprueche ?? 0) === 0,
  }
}
