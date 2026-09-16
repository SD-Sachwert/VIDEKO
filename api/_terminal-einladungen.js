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
  rankingBerechtigt,
  restUrl,
  sha256Hex,
  ziehungBerechtigt,
} from './_terminal-kern.js'

/**
 * Einladungen und eingeladene Spieler.
 *
 * DIE ZWEI REGELN, DIE ALLES ANDERE BESTIMMEN
 * -------------------------------------------
 * 1. SPIELEN UND RANKEN darf jeder vollstaendig registrierte Mensch. Ganz
 *    gleich, ob er ueber einen Deckelcode oder ueber einen Einladungslink
 *    hereingekommen ist: alle Hauptgames, alle Ranglisten, Platz 1-3, das
 *    Gesamtranking — und drei eigene Einladungsslots. Voraussetzung dafuer
 *    ist der Instagram-Handle samt Follow-Bestaetigung, nicht der Deckel.
 *
 * 2. AN DER DECKELZIEHUNG nimmt nur teil, wer einen echten physischen Deckel
 *    aktiviert hat. Ein Deckel ist genau ein Los. Eine Einladung erzeugt
 *    weiterhin KEIN Los — weder fuer den Einlader noch fuer den Eingeladenen.
 *
 * Daraus folgt alles Weitere in dieser Datei:
 *   - Einladungen erzeugen darf jeder aktive Account. Es gibt ausdruecklich
 *     Einladungsketten: 1 -> 3 -> 9 -> 27. Die Tiefe ist nicht begrenzt.
 *   - Jeder Account hat gleich viele Slots (Einstellung
 *     `einladungen_pro_teilnehmer`, Vorgabe 3). Mehr als diese Zahl
 *     gleichzeitig gueltiger Slots kann niemand haben: dafuer sorgt der
 *     partielle UNIQUE-Index ueber (kampagne, einlader_teilnehmer_id,
 *     slot_nummer) where widerrufen_am is null zusammen mit der Bedingung
 *     `verwendet_am is null` beim Widerruf. Erstellen, widerrufen, neu
 *     erstellen gibt also keinen vierten Gast her.
 *   - Ein ueber eine Einladung registrierter Mensch wird mit
 *     deckel_nummer = NULL angelegt. Die Datenbank laesst gar nichts anderes
 *     zu (videko_terminal_gast_ohne_deckel_chk), und sie laesst umgekehrt
 *     keinen Ziehungsteilnehmer ohne Nummer zu
 *     (videko_terminal_offiziell_deckel_chk). Ziehungsberechtigt ohne echten
 *     Deckel zu werden ist damit nicht nur verboten, sondern unmoeglich.
 *   - Ruestet er spaeter einen Deckel nach, geschieht das ausschliesslich
 *     durch `gastKonvertieren` — und das schreibt dieselbe Zeile fort. Es
 *     entsteht nie ein zweiter Account, die Scores haengen unveraendert an
 *     derselben id, die drei Slots bleiben, und `registrierungsquelle` bleibt
 *     'einladung': woher jemand kam, aendert sich nie rueckwirkend.
 *
 * WARUM `teilnahme_status` TROTZDEM BLEIBT
 * ---------------------------------------
 * Das Feld beantwortet ab jetzt genau eine Frage: haengt an diesem Account
 * ein physischer Deckel, also ein Los? Es ist die Grundlage der Ziehung und
 * durch zwei CHECKs in der Datenbank abgesichert. Fuer Ranglisten, fuer die
 * Spielberechtigung und fuer Einladungen wird es nicht mehr herangezogen.
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
  'id,deckel_nummer,instagram_handle,aktiviert_am,leaderboard_ok,status,'
  + 'teilnahme_status,eingeladen_von,eingeladen_am,gast_konvertiert_am,anspruch_art,'
  + 'registrierungsquelle,deckel_aktiviert_am,folgt_bestaetigt_von_nutzer,folgt_pruefstatus'

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
 * Haengt an dieser Zeile kein physischer Deckel?
 *
 * Das ist ab jetzt die einzige Bedeutung von `teilnahme_status`: eine reine
 * Aussage ueber das Los, nicht ueber die Spielberechtigung. Der Name bleibt,
 * weil die Spalte und die beiden CHECKs in der Datenbank so heissen.
 *
 * Alte Zeilen aus der Zeit vor der Migration haben den Standardwert
 * 'offiziell'; fehlt das Feld (weil eine Abfrage es nicht mitgelesen hat),
 * gilt ebenfalls nicht-Gast. Im Zweifel wird also niemand versehentlich aus
 * der Ziehung genommen.
 */
export const ohneDeckel = (zeile) => zeile?.teilnahme_status === STATUS_GAST

/**
 * Darf dieser Account einladen?
 *
 * Jeder registrierte, aktive Account — unabhaengig davon, ob ein Deckel
 * dranhaengt und ueber welchen Weg er entstanden ist. Genau das ist der
 * Unterschied zum alten Modell: Ketten sind gewollt.
 *
 * Der einzige Riegel ist `status`: ein Account, den die Verwaltung
 * abgeschaltet hat, erzeugt keine neuen Links mehr. Geschrieben wird dieses
 * Feld heute nur mit 'aktiv'; die Pruefung steht hier, damit ein spaeteres
 * Abschalten sofort greift.
 */
export const einladenBerechtigt = (zeile) =>
  Boolean(zeile?.id) && (zeile.status == null || zeile.status === 'aktiv')

/**
 * Die oeffentlich zeigbare Sicht auf einen Account.
 *
 * Alle drei Berechtigungen stehen hier nebeneinander und getrennt, weil die
 * Seite sie getrennt braucht:
 *
 *   rankingOk  Instagram-Handle da und Follow bestaetigt -> gewertete Scores,
 *              Ranglisten, Gesamtranking, Preise in den Games.
 *   ziehungOk  echter Deckel aktiviert -> Los in der grossen Verlosung.
 *   einladenOk aktiver Account -> drei eigene Einladungsslots.
 *
 * Alle drei kommen immer vom Server und stehen in keinem Beleg, den jemand im
 * Browser umschreiben koennte.
 */
export function teilnehmerSicht(zeile) {
  if (!zeile) return null
  return {
    deckel: zeile.deckel_nummer,
    instagram: zeile.instagram_handle,
    aktiviertAm: zeile.aktiviert_am,
    leaderboardOk: zeile.leaderboard_ok === true,
    quelle: zeile.registrierungsquelle ?? (zeile.eingeladen_von ? 'einladung' : 'deckel'),
    rankingOk: rankingBerechtigt(zeile),
    ziehungOk: ziehungBerechtigt(zeile),
    einladenOk: einladenBerechtigt(zeile),
    folgtBestaetigt: zeile.folgt_bestaetigt_von_nutzer === true,
    eingeladenVon: zeile.eingeladen_von ?? null,
    eingeladenAm: zeile.eingeladen_am ?? null,
    deckelAktiviertAm: zeile.deckel_aktiviert_am ?? zeile.gast_konvertiert_am ?? null,
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
 * Das Team eines Spielers: `max` Slots, jeder in genau einem von drei
 * Zustaenden.
 *
 *   'frei'       noch keine Einladung erzeugt
 *   'eingeladen' Link existiert, noch niemand hat ihn eingeloest
 *   'beigetreten' jemand ist ueber diesen Link im Terminal
 *
 * Das gilt fuer jeden Account gleich — auch fuer einen, der selbst ueber eine
 * Einladung hereingekommen ist. Genau daraus entsteht die Kette.
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

/** Instagram-Namen der selbst eingeladenen Spieler. Keine E-Mail, nie. */
async function gastNamen(ids) {
  const liste = ids.filter((id) => UUID_MUSTER.test(String(id ?? '')))
  if (!liste.length) return new Map()
  const zeilen = await lesen(
    `${TABELLE_TEILNEHMER}?select=id,instagram_handle,teilnahme_status,deckel_nummer`
    + `&id=in.(${liste.map((id) => encodeURIComponent(id)).join(',')})&limit=${liste.length}`,
  )
  return new Map(zeilen.map((z) => [z.id, {
    instagram: z.instagram_handle,
    /* Wer inzwischen selbst einen Deckel aktiviert hat, darf das zeigen — es
       ist genau der Erfolg, den das Team sichtbar machen soll. Auf die
       Spielberechtigung hat es keinen Einfluss; die hat ohnehin jeder. */
    deckel: ziehungBerechtigt(z),
  }]))
}

/* ------------------------------------------------------------------ */
/* Einladung erzeugen und widerrufen                                   */
/* ------------------------------------------------------------------ */

/**
 * Den naechsten freien Slot belegen.
 *
 * Fuer jeden aktiven Account, ganz gleich ob mit oder ohne Deckel. Der
 * Aufrufer hat das schon geprueft; hier steht es trotzdem noch einmal, weil
 * diese Funktion die einzige Stelle ist, an der ein Einladungsslot entsteht.
 *
 * Mehr als `max` gleichzeitig gueltige Slots kann dabei niemand bekommen:
 * gelesen werden nur die nicht widerrufenen Zeilen, und widerrufen laesst
 * sich nur ein noch unbenutzter Slot. Erstellen, widerrufen, neu erstellen
 * gibt also keinen zusaetzlichen Gast her, sondern immer nur denselben Platz.
 *
 * Laufen zwei Anfragen gleichzeitig, koennen beide denselben freien Slot
 * finden — schreiben kann ihn nur eine. Den Ausschlag gibt der partielle
 * UNIQUE-Index (kampagne, einlader_teilnehmer_id, slot_nummer) where
 * widerrufen_am is null, nicht diese Funktion.
 */
export async function einladungErzeugen(einlader, max, basis, ipH = null) {
  if (!einladenBerechtigt(einlader)) return { ok: false, grund: 'konto' }
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
  if (!einladenBerechtigt(einlader)) return { ok: false, grund: 'konto' }
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
  /* Der Einlader muss ein aktiver Account sein. Einen Deckel braucht er
     nicht — auch ein selbst eingeladener Spieler laedt weiter ein. Ist sein
     Konto abgeschaltet, ist der Link wertlos: dann lieber gar nichts
     anbieten. */
  if (!einladenBerechtigt(einlader)) return { ok: false, grund: 'link' }

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
 * Eine Einladung einloesen und den Spieleraccount anlegen.
 *
 * Der Ablauf in drei Schritten, und nur der erste entscheidet:
 *
 *   1. Ein einziger PATCH setzt `verwendet_am`, und alle Bedingungen stehen
 *      im Filter: passender Hash, nicht widerrufen, nicht verbraucht, nicht
 *      abgelaufen. Kommen zwei Anfragen mit demselben Link gleichzeitig an,
 *      kann nur eine die Zeile aendern. Genau hier wird der Token
 *      einmalig — nicht in einer Pruefung davor.
 *   2. Der Account entsteht: deckel_nummer NULL, teilnahme_status 'gast'
 *      (= noch kein Los), registrierungsquelle 'einladung'.
 *   3. Die Einladung bekommt die neue id nachgetragen.
 *
 * Scheitert Schritt 2, wird Schritt 1 zurueckgenommen — der Link bleibt dann
 * benutzbar, statt durch einen Serverfehler verloren zu gehen.
 *
 * `folgt` ist die Selbstauskunft „ich folge @videko.kuechen". Sie ist hier
 * genauso Pflicht wie beim Deckelweg und entscheidet ueber die gewerteten
 * Scores. Der Aufrufer prueft sie; uebernommen wird hier ausschliesslich der
 * uebergebene Wert, nie ein stillschweigendes true.
 */
export async function gastAnlegen({
  token: roh, instagram, email, folgt, leaderboard, ipH,
}) {
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

  /* Wer eingeladen hat, muss ein aktiver Account sein — einen Deckel braucht
     er nicht. Einladungsketten sind ausdruecklich gewollt. */
  const einlader = await teilnehmerLesen(einladung.einlader_teilnehmer_id)
  if (!einladenBerechtigt(einlader)) return zurueck('link', 401)

  /* Vermerken, nicht sperren. Siehe `selbstVerdacht` am Ende der Datei. Im
     Protokoll steht nur die Einladungs-id — keine Adresse, kein Hash. */
  if (selbstVerdacht(einladung.ip_hash, ipH)) {
    console.warn('[terminal] einladung: gleiche herkunft wie einlader', einladung.id)
  }

  const folgtOk = folgt === true
  const listeOk = leaderboard === true
  const neu = await fetch(restUrl(TABELLE_TEILNEHMER), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      /* Ohne eigenen Deckel gibt es keine Nummer. Die Datenbank laesst auch
         keine zu — und ohne Nummer kein Los. */
      deckel_nummer: null,
      instagram_handle: instagram,
      email,
      /* Die Selbstauskunft zum Follow. Sie entscheidet ueber die gewerteten
         Scores und gilt hier genau wie beim Deckelweg. Geprueft wird sie vor
         einer Preisausgabe von Hand — behauptet wird nichts. */
      folgt_bestaetigt_von_nutzer: folgtOk,
      aktiviert_am: jetztIso,
      status: 'aktiv',
      ip_hash: ipH,
      leaderboard_ok: listeOk,
      leaderboard_ok_am: listeOk ? jetztIso : null,
      /* 'gast' heisst ab jetzt nur noch: an diesem Account haengt kein
         physischer Deckel, also kein Los. Spielen, ranken und einladen darf
         er trotzdem uneingeschraenkt. */
      teilnahme_status: STATUS_GAST,
      registrierungsquelle: 'einladung',
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
 * Einen Deckel an einem bestehenden Account nachruesten.
 *
 * Das passiert nur an einer einzigen Stelle im ganzen System: wenn jemand mit
 * laufender Sitzung einen echten Deckel aktiviert. Es gibt keinen Schalter in
 * der Verwaltung, keinen API-Parameter und keinen anderen Weg.
 *
 * Fortgeschrieben wird DIESELBE Zeile. Deshalb:
 *   - bleiben alle Scores, wo sie sind (sie haengen an teilnehmer_id),
 *   - bleiben die bisherigen Rangplaetze unveraendert,
 *   - bleibt die Anmeldung dieselbe (der Sitzungsbeleg traegt dieselbe id),
 *   - bleiben die eigenen Einladungsslots samt Team bestehen,
 *   - bleibt `eingeladen_von` stehen, die Herkunft also nachvollziehbar,
 *   - entsteht kein zweiter Account, nicht einmal kurzzeitig.
 *
 * `registrierungsquelle` wird ausdruecklich NICHT auf 'deckel' gesetzt. Wer
 * ueber eine Einladung kam, kam ueber eine Einladung — sonst liesse sich
 * hinterher nicht mehr messen, wie viele Deckel die Kette gebracht hat. Was
 * dazukommt, ist `deckel_aktiviert_am`.
 *
 * Neu ist ab hier nur eines: das Los. Gespielt und gerankt hat diese Person
 * vorher schon genauso.
 *
 * Der Filter traegt `teilnahme_status=eq.gast`: zwei gleichzeitige Versuche
 * koennen nicht beide durchkommen, und eine Zeile, an der schon ein Deckel
 * haengt, wird hier nie angefasst.
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
        deckel_aktiviert_am: jetztIso,
        aktiviert_am: jetztIso,
        /* Die Follow-Bestaetigung hat diese Person bei der Registrierung
           bereits gegeben; der Deckelweg verlangt sie ebenfalls. Sie wird
           hier bestaetigt, nicht erfunden — ohne sie kaeme man gar nicht bis
           hierher. `registrierungsquelle` bleibt unberuehrt. */
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

