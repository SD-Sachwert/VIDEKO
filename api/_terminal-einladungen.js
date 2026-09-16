import crypto from 'node:crypto'

import {
  KAMPAGNE,
  STATUS_GAST,
  STATUS_OFFIZIELL,
  TABELLE_EINLADUNGEN,
  TABELLE_TEILNEHMER,
  UUID_MUSTER,
  ableiten,
  clean,
  kopfzeilen,
  lesen,
  restUrl,
  sha256Hex,
} from './_terminal-kern.js'

/**
 * Einladungen und Gastspieler.
 *
 * DIE EINE REGEL, DIE ALLES ANDERE BESTIMMT
 * -----------------------------------------
 * Ein physischer Deckel ist genau ein Los. Eine Einladung bringt keinen
 * Deckel, kein Los, keinen Platz im offiziellen Gesamtranking und keine
 * eigenen Einladungsslots. Sie bringt genau eines: einen weiteren Menschen
 * ins Terminal. Erst ein eigener echter Deckel macht aus einem Gast einen
 * offiziellen Teilnehmer.
 *
 * Daraus folgt alles Weitere in dieser Datei:
 *   - Einladungen erzeugen darf nur, wer teilnahme_status = 'offiziell' ist.
 *     Ein Gast bekommt hier keine Slots — es gibt keine Einladungsketten.
 *   - Ein Gast wird mit deckel_nummer = NULL angelegt. Die Datenbank laesst
 *     gar nichts anderes zu (videko_terminal_gast_ohne_deckel_chk), und sie
 *     laesst umgekehrt keinen offiziellen Teilnehmer ohne Nummer zu
 *     (videko_terminal_offiziell_deckel_chk). Ein Statuswechsel ohne echten
 *     Deckel ist damit nicht nur verboten, sondern unmoeglich.
 *   - Aus einem Gast wird ein offizieller Teilnehmer ausschliesslich durch
 *     `gastKonvertieren` — und das schreibt dieselbe Zeile fort. Es entsteht
 *     nie ein zweiter Account, und die gespielten Scores haengen unveraendert
 *     an derselben id.
 *
 * DER TOKEN
 * ---------
 * Der Einladungstoken wird aus der Zeilen-id und dem Terminal-Geheimnis
 * abgeleitet: base64url(HMAC-SHA256(Geheimnis, 'einladung|<id>')). Er ist
 * damit 43 Zeichen lang, ohne das Geheimnis nicht erratbar — und er laesst
 * sich jederzeit neu berechnen, sodass der Einlader seinen Link im Dashboard
 * immer wieder anzeigen kann, ohne dass wir ihn irgendwo aufbewahren muessen.
 *
 * In der Datenbank steht nur sein SHA-256-Hash. Ein Datenbankleck gibt
 * deshalb keine benutzbaren Einladungslinks her, und die Verwaltung kann den
 * Klartext gar nicht anzeigen, weil sie ihn nicht hat.
 */

/* Wie der Wiederherstellungstoken: 32 Byte base64url sind 43 Zeichen. */
export const EINLADUNG_MUSTER = /^[A-Za-z0-9_-]{43}$/

/** Der Token einer Einladung. Aus der id, nicht aus dem Zufall. */
export const einladungToken = (id) => ableiten(`einladung|${id}`)

/** Der teilbare Link. Die Basis kommt vom Aufrufer, nie aus dem Host-Header. */
export const einladungLink = (basis, token) => `${basis}/terminal/einladung/${token}`

const jetzt = () => new Date().toISOString()

const kampagneFilter = `kampagne=eq.${encodeURIComponent(KAMPAGNE)}`

/** Nur die Felder, die ausserhalb dieser Datei gebraucht werden. */
const TEILNEHMER_SPALTEN =
  'id,deckel_nummer,instagram_handle,aktiviert_am,leaderboard_ok,'
  + 'teilnahme_status,eingeladen_von,eingeladen_am,gast_konvertiert_am,anspruch_art'

/* ------------------------------------------------------------------ */
/* Teilnehmer nachschlagen                                             */
/* ------------------------------------------------------------------ */

/**
 * Eine Teilnehmerzeile mit allen Feldern, die fuer Gaststatus und Einladungen
 * gebraucht werden. Ohne E-Mail: die bleibt auf dem Server.
 */
export async function teilnehmerLesen(id) {
  if (!UUID_MUSTER.test(String(id ?? ''))) return null
  const zeilen = await lesen(
    `${TABELLE_TEILNEHMER}?select=${TEILNEHMER_SPALTEN}`
    + `&id=eq.${encodeURIComponent(id)}&${kampagneFilter}&limit=1`,
  )
  return zeilen[0] ?? null
}

/**
 * Ist diese Zeile ein Gast?
 *
 * Alte Zeilen aus der Zeit vor der Migration haben den Standardwert
 * 'offiziell'; fehlt das Feld (weil eine Abfrage es nicht mitgelesen hat),
 * gilt ebenfalls nicht-Gast. Gast ist man nur, wenn es ausdruecklich
 * dasteht — im Zweifel also nie versehentlich.
 */
export const istGast = (zeile) => zeile?.teilnahme_status === STATUS_GAST

/** Und umgekehrt: offiziell ist, wer nicht ausdruecklich Gast ist. */
export const istOffiziell = (zeile) => Boolean(zeile) && !istGast(zeile)

/**
 * Die oeffentlich zeigbare Sicht auf einen Account.
 *
 * `gast` ist das Feld, an dem die Seite ihr gesamtes Verhalten aufhaengt —
 * es kommt immer vom Server und steht in keinem Beleg, den jemand im Browser
 * umschreiben koennte.
 */
export function teilnehmerSicht(zeile) {
  if (!zeile) return null
  return {
    deckel: zeile.deckel_nummer,
    instagram: zeile.instagram_handle,
    aktiviertAm: zeile.aktiviert_am,
    leaderboardOk: zeile.leaderboard_ok === true,
    gast: istGast(zeile),
    eingeladenVon: zeile.eingeladen_von ?? null,
    konvertiertAm: zeile.gast_konvertiert_am ?? null,
  }
}

/* ------------------------------------------------------------------ */
/* Das eigene Team                                                     */
/* ------------------------------------------------------------------ */

/**
 * Alle nicht widerrufenen Einladungen eines Einladers, aufsteigend nach Slot.
 */
async function einladungenLesen(einladerId) {
  return lesen(
    `${TABELLE_EINLADUNGEN}?select=id,slot_nummer,erstellt_am,verwendet_am,gast_teilnehmer_id,oeffnungen`
    + `&${kampagneFilter}&einlader_teilnehmer_id=eq.${encodeURIComponent(einladerId)}`
    + '&widerrufen_am=is.null&order=slot_nummer.asc',
  )
}

/**
 * Das Team eines offiziellen Teilnehmers: `max` Slots, jeder in genau einem
 * von drei Zustaenden.
 *
 *   'frei'       noch keine Einladung erzeugt
 *   'eingeladen' Link existiert, noch niemand hat ihn eingeloest
 *   'beigetreten' ein Gast ist ueber diesen Link im Terminal
 *
 * Der Klartext-Token steht nur hier, in der Antwort an den Einlader selbst.
 * Er wird nicht gespeichert und taucht in keiner Verwaltungsansicht auf.
 */
export async function teamLesen(einladerId, max, basis) {
  const zeilen = await einladungenLesen(einladerId)
  const gastIds = zeilen.map((z) => z.gast_teilnehmer_id).filter(Boolean)
  const namen = gastIds.length ? await gastNamen(gastIds) : new Map()

  const nachSlot = new Map(zeilen.map((z) => [Number(z.slot_nummer), z]))
  const slots = []
  for (let nr = 1; nr <= max; nr += 1) {
    const z = nachSlot.get(nr)
    if (!z) {
      slots.push({ slot: nr, status: 'frei' })
      continue
    }
    const token = einladungToken(z.id)
    slots.push({
      slot: nr,
      status: z.gast_teilnehmer_id ? 'beigetreten' : 'eingeladen',
      erstelltAm: z.erstellt_am,
      verwendetAm: z.verwendet_am ?? null,
      oeffnungen: Number(z.oeffnungen) || 0,
      /* Nur der Einlader selbst bekommt Token und Link zu sehen. */
      token,
      link: einladungLink(basis, token),
      gast: z.gast_teilnehmer_id ? namen.get(z.gast_teilnehmer_id) ?? null : null,
    })
  }

  /* Zusaetzliche Slots oberhalb der aktuellen Einstellung koennen entstehen,
     wenn die Zahl spaeter gesenkt wird. Sie werden weiter angezeigt — schon
     vergebene Einladungen duerfen dadurch nicht kaputtgehen. */
  for (const z of zeilen) {
    if (Number(z.slot_nummer) > max) {
      const token = einladungToken(z.id)
      slots.push({
        slot: Number(z.slot_nummer),
        status: z.gast_teilnehmer_id ? 'beigetreten' : 'eingeladen',
        erstelltAm: z.erstellt_am,
        verwendetAm: z.verwendet_am ?? null,
        oeffnungen: Number(z.oeffnungen) || 0,
        token,
        link: einladungLink(basis, token),
        gast: z.gast_teilnehmer_id ? namen.get(z.gast_teilnehmer_id) ?? null : null,
      })
    }
  }

  return {
    slots,
    frei: slots.filter((s) => s.status === 'frei').length,
    beigetreten: slots.filter((s) => s.status === 'beigetreten').length,
  }
}

/** Instagram-Namen der eigenen Gaeste. Keine E-Mail, nie. */
async function gastNamen(ids) {
  const liste = ids.filter((id) => UUID_MUSTER.test(String(id ?? '')))
  if (!liste.length) return new Map()
  const zeilen = await lesen(
    `${TABELLE_TEILNEHMER}?select=id,instagram_handle,teilnahme_status`
    + `&id=in.(${liste.map((id) => encodeURIComponent(id)).join(',')})&limit=${liste.length}`,
  )
  return new Map(zeilen.map((z) => [z.id, {
    instagram: z.instagram_handle,
    /* Ein Gast, der inzwischen selbst einen Deckel hat, darf das zeigen —
       es ist genau der Erfolg, den das Team sichtbar machen soll. */
    offiziell: z.teilnahme_status !== STATUS_GAST,
  }]))
}

/* ------------------------------------------------------------------ */
/* Einladung erzeugen und widerrufen                                   */
/* ------------------------------------------------------------------ */

/**
 * Den naechsten freien Slot belegen.
 *
 * Nur fuer offizielle Teilnehmer. Der Aufrufer hat das schon geprueft; hier
 * steht es trotzdem noch einmal, weil diese Funktion die einzige Stelle ist,
 * an der ein Einladungsslot entsteht.
 *
 * Laufen zwei Anfragen gleichzeitig, koennen beide denselben freien Slot
 * finden — schreiben kann ihn nur eine. Den Ausschlag gibt der partielle
 * UNIQUE-Index (kampagne, einlader_teilnehmer_id, slot_nummer) where
 * widerrufen_am is null, nicht diese Funktion.
 */
export async function einladungErzeugen(einlader, max, basis, ipH = null) {
  if (!istOffiziell(einlader)) return { ok: false, grund: 'gast' }
  if (!(max > 0)) return { ok: false, grund: 'geschlossen' }

  const vorhanden = await einladungenLesen(einlader.id)
  const belegt = new Set(vorhanden.map((z) => Number(z.slot_nummer)))
  let slot = 0
  for (let nr = 1; nr <= max; nr += 1) {
    if (!belegt.has(nr)) {
      slot = nr
      break
    }
  }
  if (!slot) return { ok: false, grund: 'keine-slots' }

  /* Erst die Zeile, dann der Token: der Token haengt an der id, und die
     vergibt die Datenbank. Der Hash wird direkt danach nachgetragen. */
  const antwort = await fetch(restUrl(TABELLE_EINLADUNGEN), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      einlader_teilnehmer_id: einlader.id,
      slot_nummer: slot,
      /* Platzhalter: der echte Hash braucht die id, die es erst nach dem
         Schreiben gibt. Er ist selbst ein Hash und kollidiert mit keinem
         echten Token — abgeleitet aus einem Wert, den kein Link je traegt. */
      token_hash: sha256Hex(`vorlaeufig|${crypto.randomUUID()}`),
      ip_hash: ipH,
    }),
  })

  if (antwort.status === 409) return { ok: false, grund: 'gleichzeitig' }
  if (!antwort.ok) return { ok: false, grund: 'server' }

  const zeilen = await antwort.json().catch(() => null)
  const zeile = Array.isArray(zeilen) ? zeilen[0] : null
  if (!zeile?.id) return { ok: false, grund: 'server' }

  const token = einladungToken(zeile.id)
  const nachtrag = await fetch(
    restUrl(`${TABELLE_EINLADUNGEN}?id=eq.${encodeURIComponent(zeile.id)}`),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ token_hash: sha256Hex(token) }),
    },
  )
  if (!nachtrag.ok) {
    /* Ohne gueltigen Hash ist die Einladung nicht einloesbar. Dann lieber
       den Slot wieder freigeben, als eine tote Zeile stehen zu lassen. */
    await fetch(restUrl(`${TABELLE_EINLADUNGEN}?id=eq.${encodeURIComponent(zeile.id)}`), {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ widerrufen_am: jetzt() }),
    })
    return { ok: false, grund: 'server' }
  }

  return {
    ok: true,
    slot: {
      slot,
      status: 'eingeladen',
      erstelltAm: zeile.erstellt_am,
      verwendetAm: null,
      oeffnungen: 0,
      token,
      link: einladungLink(basis, token),
      gast: null,
    },
  }
}

/**
 * Eine noch nicht eingeloeste Einladung zurueckziehen.
 *
 * Nur, solange niemand sie benutzt hat. Waere ein eingeloester Slot
 * widerrufbar, liesse sich derselbe Slot beliebig oft neu vergeben — und aus
 * drei Einladungen wuerden unbegrenzt viele Gaeste. Der Filter traegt beide
 * Bedingungen, es gibt also kein Zeitfenster dazwischen.
 */
export async function einladungWiderrufen(einlader, slotNummer) {
  if (!istOffiziell(einlader)) return { ok: false, grund: 'gast' }
  const nr = Number(slotNummer)
  if (!Number.isInteger(nr) || nr < 1) return { ok: false, grund: 'felder' }

  const antwort = await fetch(
    restUrl(
      `${TABELLE_EINLADUNGEN}?${kampagneFilter}`
      + `&einlader_teilnehmer_id=eq.${encodeURIComponent(einlader.id)}`
      + `&slot_nummer=eq.${nr}&widerrufen_am=is.null&verwendet_am=is.null&select=id`,
    ),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=representation' }),
      body: JSON.stringify({ widerrufen_am: jetzt() }),
    },
  )
  if (!antwort.ok) return { ok: false, grund: 'server' }
  const zeilen = await antwort.json().catch(() => null)
  if (!Array.isArray(zeilen) || zeilen.length !== 1) return { ok: false, grund: 'nicht-offen' }
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Einladung oeffnen                                                   */
/* ------------------------------------------------------------------ */

/**
 * Eine Einladung zu einem Token nachschlagen — ohne sie zu verbrauchen.
 *
 * Das ist die Abfrage hinter der Landingpage. Sie sagt nur, ob der Link noch
 * offen ist und wer eingeladen hat. Ungueltig, widerrufen, abgelaufen und
 * schon benutzt sind vier verschiedene Zustaende, weil die Seite dem
 * Eingeladenen etwas Verstaendliches sagen soll — aber keiner davon verraet
 * etwas ueber andere Einladungen.
 */
export async function einladungOeffnen(roh) {
  const token = clean(roh, 64)
  if (!EINLADUNG_MUSTER.test(token)) return { ok: false, grund: 'link' }

  const zeilen = await lesen(
    `${TABELLE_EINLADUNGEN}?select=id,einlader_teilnehmer_id,slot_nummer,`
    + 'erstellt_am,abgelaufen_am,verwendet_am,gast_teilnehmer_id,widerrufen_am,geoeffnet_am,oeffnungen'
    + `&token_hash=eq.${sha256Hex(token)}&limit=1`,
  )
  const z = zeilen[0]
  if (!z?.id) return { ok: false, grund: 'link' }
  if (z.widerrufen_am) return { ok: false, grund: 'widerrufen' }
  if (z.verwendet_am || z.gast_teilnehmer_id) return { ok: false, grund: 'verbraucht' }
  if (z.abgelaufen_am && new Date(z.abgelaufen_am).getTime() <= Date.now()) {
    return { ok: false, grund: 'abgelaufen' }
  }

  const einlader = await teilnehmerLesen(z.einlader_teilnehmer_id)
  /* Eingeladen haben darf nur, wer offiziell ist. Waere das nicht mehr so,
     ist der Link wertlos — dann lieber gar nichts anbieten. */
  if (!istOffiziell(einlader)) return { ok: false, grund: 'link' }

  /* Zaehlen, nicht protokollieren: nur eine Zahl und der erste Zeitpunkt.
     Ein Fehlschlag darf die Seite nicht aufhalten. */
  oeffnungZaehlen(z).catch(() => {})

  return {
    ok: true,
    einladung: {
      slot: Number(z.slot_nummer),
      erstelltAm: z.erstellt_am,
      einladerInstagram: einlader.instagram_handle,
    },
  }
}

async function oeffnungZaehlen(z) {
  const felder = { oeffnungen: (Number(z.oeffnungen) || 0) + 1 }
  if (!z.geoeffnet_am) felder.geoeffnet_am = jetzt()
  await fetch(restUrl(`${TABELLE_EINLADUNGEN}?id=eq.${encodeURIComponent(z.id)}`), {
    method: 'PATCH',
    headers: kopfzeilen({ Prefer: 'return=minimal' }),
    body: JSON.stringify(felder),
  })
}

/* ------------------------------------------------------------------ */
/* Gast anlegen                                                        */
/* ------------------------------------------------------------------ */

/**
 * Merkt sich, ob Einlader und Gast denselben IP-Hash haben.
 *
 * Das wird ausschliesslich vermerkt, nicht geahndet. Familien, WGs und jedes
 * gemeinsame WLAN teilen sich eine Adresse — eine automatische Sperre waere
 * hier haeufiger falsch als richtig. Ein Los entsteht durch eine Einladung
 * ohnehin nie, der moegliche Schaden ist also gering.
 */
export const selbstVerdacht = (einladerIpH, gastIpH) =>
  Boolean(einladerIpH) && Boolean(gastIpH) && einladerIpH === gastIpH

/**
 * Eine Einladung einloesen und den Gastaccount anlegen.
 *
 * Der Ablauf in drei Schritten, und nur der erste entscheidet:
 *
 *   1. Ein einziger PATCH setzt `verwendet_am`, und alle Bedingungen stehen
 *      im Filter: passender Hash, nicht widerrufen, nicht verbraucht, nicht
 *      abgelaufen. Kommen zwei Anfragen mit demselben Link gleichzeitig an,
 *      kann nur eine die Zeile aendern. Genau hier wird der Token
 *      einmalig — nicht in einer Pruefung davor.
 *   2. Der Gastaccount entsteht: deckel_nummer NULL, teilnahme_status 'gast'.
 *   3. Die Einladung bekommt die Gast-id nachgetragen.
 *
 * Scheitert Schritt 2, wird Schritt 1 zurueckgenommen — der Link bleibt dann
 * benutzbar, statt durch einen Serverfehler verloren zu gehen.
 */
export async function gastAnlegen({ token: roh, instagram, email, ipH }) {
  const token = clean(roh, 64)
  if (!EINLADUNG_MUSTER.test(token)) return { ok: false, grund: 'link', status: 401 }

  const jetztIso = jetzt()
  const antwort = await fetch(
    restUrl(
      `${TABELLE_EINLADUNGEN}?token_hash=eq.${sha256Hex(token)}`
      + '&verwendet_am=is.null&widerrufen_am=is.null&gast_teilnehmer_id=is.null'
      + `&or=(abgelaufen_am.is.null,abgelaufen_am.gt.${encodeURIComponent(jetztIso)})`
      + '&select=id,einlader_teilnehmer_id,ip_hash',
    ),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=representation' }),
      body: JSON.stringify({ verwendet_am: jetztIso }),
    },
  )
  if (!antwort.ok) return { ok: false, grund: 'server', status: 500 }
  const belegt = await antwort.json().catch(() => null)
  const einladung = Array.isArray(belegt) && belegt.length === 1 ? belegt[0] : null
  if (!einladung?.id) return { ok: false, grund: 'link', status: 401 }

  const zurueck = async (grund, status) => {
    await fetch(
      restUrl(`${TABELLE_EINLADUNGEN}?id=eq.${encodeURIComponent(einladung.id)}&gast_teilnehmer_id=is.null`),
      {
        method: 'PATCH',
        headers: kopfzeilen({ Prefer: 'return=minimal' }),
        body: JSON.stringify({ verwendet_am: null }),
      },
    ).catch(() => {})
    return { ok: false, grund, status }
  }

  /* Wer eingeladen hat, muss offiziell sein — sonst waere das eine
     Einladungskette, und die soll es nicht geben. */
  const einlader = await teilnehmerLesen(einladung.einlader_teilnehmer_id)
  if (!istOffiziell(einlader)) return zurueck('link', 401)

  /* Vermerken, nicht sperren. Siehe `selbstVerdacht` am Ende der Datei. Im
     Protokoll steht nur die Einladungs-id — keine Adresse, kein Hash. */
  if (selbstVerdacht(einladung.ip_hash, ipH)) {
    console.warn('[terminal] einladung: gleiche herkunft wie einlader', einladung.id)
  }

  const neu = await fetch(restUrl(TABELLE_TEILNEHMER), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      /* Ein Gast hat keine Nummer. Die Datenbank laesst auch keine zu. */
      deckel_nummer: null,
      instagram_handle: instagram,
      email,
      /* Der Instagram-Haken gehoert zur Verlosung. Ein Gast nimmt an ihr
         nicht teil, also wird hier auch nichts behauptet. */
      folgt_bestaetigt_von_nutzer: false,
      aktiviert_am: jetztIso,
      status: 'aktiv',
      ip_hash: ipH,
      leaderboard_ok: false,
      leaderboard_ok_am: null,
      teilnahme_status: STATUS_GAST,
      eingeladen_von: einlader.id,
      eingeladen_am: jetztIso,
    }),
  })
  if (!neu.ok) return zurueck('server', 500)

  const zeilen = await neu.json().catch(() => null)
  const gast = Array.isArray(zeilen) ? zeilen[0] : null
  if (!gast?.id) return zurueck('server', 500)

  const verknuepft = await fetch(
    restUrl(`${TABELLE_EINLADUNGEN}?id=eq.${encodeURIComponent(einladung.id)}`),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ gast_teilnehmer_id: gast.id }),
    },
  )
  /* Schlaegt nur die Verknuepfung fehl, ist der Account trotzdem da und
     brauchbar. Die Einladung bleibt verbraucht — das ist die sichere Seite:
     lieber eine Einladung ohne Zuordnung als eine, die zweimal geht. */
  if (!verknuepft.ok) {
    return { ok: true, gast, einlader, unvollstaendig: true }
  }

  return { ok: true, gast, einlader }
}

/* ------------------------------------------------------------------ */
/* Gast wird offizieller Teilnehmer                                    */
/* ------------------------------------------------------------------ */

/**
 * Aus einem Gast einen offiziellen Teilnehmer machen.
 *
 * Das passiert nur an einer einzigen Stelle im ganzen System: wenn jemand
 * mit Gastsitzung einen echten Deckel aktiviert. Es gibt keinen Schalter in
 * der Verwaltung, keinen API-Parameter und keinen anderen Weg.
 *
 * Fortgeschrieben wird DIESELBE Zeile. Deshalb:
 *   - bleiben alle Scores, wo sie sind (sie haengen an teilnehmer_id),
 *   - bleibt die Anmeldung dieselbe (der Sitzungsbeleg traegt dieselbe id),
 *   - bleibt `eingeladen_von` stehen, die Herkunft also nachvollziehbar,
 *   - entsteht kein zweiter Account, nicht einmal kurzzeitig.
 *
 * Der Filter traegt `teilnahme_status=eq.gast`: zwei gleichzeitige Versuche
 * koennen nicht beide durchkommen, und eine bereits offizielle Zeile wird
 * hier nie angefasst.
 */
export async function gastKonvertieren(gastId, nummer, anspruchArt) {
  const jetztIso = jetzt()
  const antwort = await fetch(
    restUrl(
      `${TABELLE_TEILNEHMER}?id=eq.${encodeURIComponent(gastId)}`
      + `&${kampagneFilter}&teilnahme_status=eq.${STATUS_GAST}`
      + `&select=${TEILNEHMER_SPALTEN}`,
    ),
    {
      method: 'PATCH',
      headers: kopfzeilen({ Prefer: 'return=representation' }),
      body: JSON.stringify({
        deckel_nummer: nummer,
        teilnahme_status: STATUS_OFFIZIELL,
        anspruch_art: anspruchArt,
        gast_konvertiert_am: jetztIso,
        aktiviert_am: jetztIso,
        folgt_bestaetigt_von_nutzer: true,
      }),
    },
  )

  /* Die Nummer ist bereits erstaktiviert: dieselbe Antwort wie bei einer
     neuen Aktivierung, damit der Mehrfachanspruch genauso funktioniert. */
  if (antwort.status === 409) return { ok: false, grund: 'belegt', status: 409 }
  if (!antwort.ok) return { ok: false, grund: 'server', status: 500 }

  const zeilen = await antwort.json().catch(() => null)
  const zeile = Array.isArray(zeilen) && zeilen.length === 1 ? zeilen[0] : null
  if (!zeile?.id) return { ok: false, grund: 'server', status: 500 }
  return { ok: true, zeile }
}

