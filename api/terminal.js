import crypto from 'node:crypto'

import {
  EMAIL_MUSTER,
  FELD_GRENZEN,
  WIEDER_NEUTRAL,
  deckelNummer,
  instagramNormalisieren,
} from '../src/data/terminal.js'
import { mailAbsender, mailBereit, mailTransport } from './_mail.js'
import {
  ANSPRUCH_ERST,
  ANSPRUCH_WEITERER,
  KAMPAGNE,
  SPIELE,
  SPIEL_SCHLUESSEL,
  TABELLE_MELDUNGEN,
  TABELLE_TEILNEHMER,
  TABELLE_WIEDER,
  aktivierteZaehlen,
  belegErzeugen,
  belegPruefen,
  bestesHeute,
  clean,
  cleanText,
  codeHinterlegt,
  codeStimmt,
  eigeneBestwerte,
  einstellungenLesen,
  einwilligungSetzen,
  gesamtrangliste,
  ipHash,
  klientIp,
  konfiguriert,
  kopfzeilen,
  laufticket,
  laufticketPruefen,
  laufVerdacht,
  lesen,
  rangSpeicherLeeren,
  rangliste,
  readBody,
  restUrl,
  schreibenErlaubt,
  scoreSpeichern,
  spielSchluessel,
  spielstartVermerken,
  tresorkoenig,
  zaehlen,
} from './_terminal-kern.js'
import { gesamtranking } from './_terminal-gesamtranking.js'
import { probeBehandeln, probeLesen } from './_terminal-probe.js'

/**
 * Oeffentlicher Endpoint der Bierdeckel-Aktion (Vercel Serverless, Node).
 *
 * Neun Aktionen, ein Einstieg:
 *
 *   zustand     — oeffentlicher Stand: aktivierte Deckel, Termin, Followerzahl,
 *                 gezogene Nummer, Tresorkoenig. Liegt ein Sitzungsbeleg an,
 *                 kommen zusaetzlich der eigene Deckel und die eigenen
 *                 Bestwerte zurueck.
 *   code        — Raetselcode pruefen. Bei Erfolg gibt es einen Zugangsbeleg.
 *   aktivieren  — Deckel eintragen. Braucht einen gueltigen Zugangsbeleg.
 *   melden      — Gewinnmeldung nach einer Ziehung.
 *   spiel-start — Laufticket fuer eine Spielrunde ausgeben.
 *   spiel-ende  — Punktestand gegen das Laufticket annehmen.
 *   rangliste   — oeffentliche Bestenliste eines Spiels oder gesamt.
 *   leaderboard — eigene Einwilligung zur oeffentlichen Rangliste setzen
 *                 oder widerrufen. Aendert nichts an Deckel, Scores, Ziehung.
 *   wieder-anfordern — Zugangslink per Mail fuer einen schon aktivierten
 *                 Deckel. Antwortet immer gleich, ob die Adresse bekannt ist
 *                 oder nicht.
 *   wieder-einloesen — Zugangslink gegen einen Sitzungsbeleg tauschen.
 *
 * Dazu kommt ein Sonderweg: liegt ein gueltiger Testbeleg an (`probe`, nur
 * ueber die Admin-Anmeldung zu bekommen), beantwortet _terminal-probe.js die
 * Aktion rein virtuell. Von dort fuehrt kein Weg in eine Tabelle zurueck.
 *
 * DIE SPIELE UND DIE ZIEHUNG HABEN NICHTS MITEINANDER ZU TUN
 * ----------------------------------------------------------
 * Punkte landen in einer eigenen Tabelle, die in der Ziehung nicht vorkommt.
 * Gezogen wird weiterhin ausschliesslich aus den aktivierten Deckeln. Keine
 * Aktion hier kann eine Gewinnchance veraendern, und keine darf es koennen.
 *
 * WAS DIESER ENDPOINT NIE TUT
 * ---------------------------
 * 1. Den richtigen Code verraten. `code` antwortet ja oder nein, nie mit dem
 *    Sollwert und nie mit einem Hinweis darauf.
 * 2. Fremde Personendaten herausgeben. `zustand` liefert Teilnehmerfelder
 *    ausschliesslich gegen einen gueltigen, signierten Sitzungsbeleg, und
 *    selbst dann ohne E-Mail-Adresse — die bleibt auf dem Server.
 * 3. Ziehen. Gezogen wird ausschliesslich in api/terminal-admin.js, dort mit
 *    crypto.randomInt ueber die tatsaechlich aktivierten Nummern.
 * 4. Behaupten, ein Instagram-Follow sei geprueft. Gespeichert wird die
 *    Selbstauskunft der Person (folgt_bestaetigt_von_nutzer) — nichts weiter.
 *
 * Die Eindeutigkeit der Erstaktivierung entsteht nicht hier, sondern in der
 * Datenbank: ein partieller UNIQUE-Index auf (kampagne, deckel_nummer) fuer
 * anspruch_art = 'erstaktivierung'. Zwei gleichzeitige Anfragen mit derselben
 * freien Nummer koennen die Vorabpruefung beide passieren — erstaktivieren
 * kann nur eine, die andere bekommt 409 'belegt' und damit das Warnfenster.
 * Weitere Besitzansprueche sind erlaubt, erzeugen aber nie ein zweites Los.
 */

/* Ratenbegrenzung, erste Stufe: pro Instanz im Speicher. Serverless-Instanzen
   sind kurzlebig, das ist nur der billige Vorfilter. Die belastbare Grenze
   zieht die Abfrage auf ip_hash weiter unten.

   Codeversuche bekommen ein eigenes, engeres Fenster: ein achtstelliger Code
   laedt zum Durchprobieren ein.

   Spielrunden haben ein weiteres Fenster. Start und Ende zaehlen je einmal.
   Kuechen-Stack und Kuechen-Dash sind auf schnelles Neustarten gebaut — ein
   frueher Fehler beendet eine Runde nach wenigen Sekunden. Die Grenze liegt
   deshalb bei 120 Runden in zehn Minuten — eine alle fuenf Sekunden, auch
   hinter einem geteilten Mobilfunk-Ausgang — und soll nur verhindern, dass
   jemand Tickets am Band abarbeitet. */
const FENSTER_MS = 10 * 60 * 1000
const MAX_SCHREIBEN = 5
const MAX_CODE = 30
const MAX_SPIEL = 240
const MAX_EINWILLIGUNG = 20
const gesehen = new Map()

function zuSchnell(ip, schluessel, grenze) {
  const jetzt = Date.now()
  const id = `${schluessel}|${ip}`
  const alt = (gesehen.get(id) || []).filter((t) => jetzt - t < FENSTER_MS)
  if (alt.length >= grenze) return true
  alt.push(jetzt)
  gesehen.set(id, alt)
  return false
}

const BREMSE = { ok: false, grund: 'bremse', meldung: 'Das ging uns gerade zu schnell. Bitte einen Moment warten.' }
const NICHT_DA = { ok: false, grund: 'server', meldung: 'Die Aktionsseite ist gerade nicht erreichbar. Bitte kurz beim Team melden.' }
const PAUSE = { ok: false, grund: 'server', meldung: 'Die Aktion ist gerade pausiert. Bitte später noch einmal versuchen.' }

/* ------------------------------------------------------------------ */
/* zustand                                                             */
/* ------------------------------------------------------------------ */

/**
 * Oeffentlicher Stand plus — nur gegen gueltigen Beleg — der eigene Deckel.
 *
 * Die Teilnehmerzeile wird frisch gelesen statt aus dem Beleg entnommen: im
 * Beleg steht nur eine id. Handle und Zeitpunkt kommen damit immer aus der
 * Datenbank, und der Beleg bleibt frei von Inhalten, die jemand im Browser
 * umschreiben koennte.
 *
 * Der Tresorkoenig ist oeffentlich — er steht in jeder Antwort, auch ohne
 * Beleg. Oeffentlich ist daran nur, was die Person dafuer freigegeben hat:
 * Instagram-Name und Punktzahl.
 */
async function zustand(b, res) {
  const [einstellungen, aktiviert, koenig] = await Promise.all([
    einstellungenLesen(),
    aktivierteZaehlen(),
    tresorkoenig(),
  ])

  let teilnehmer = null
  let spiele = null
  const beleg = belegPruefen(b.sitzung, 's')
  if (beleg?.id) {
    const [zeilen, beste, gesamt, rangGesamt] = await Promise.all([
      lesen(
        `${TABELLE_TEILNEHMER}?select=deckel_nummer,instagram_handle,aktiviert_am,leaderboard_ok`
        + `&id=eq.${encodeURIComponent(beleg.id)}&limit=1`,
      ),
      eigeneBestwerte(beleg.id),
      gesamtrangliste(beleg.id),
      gesamtranking(beleg.id),
    ])
    const z = zeilen[0]
    /* Kein `email` in der Auswahl oben, und auch hier nicht. Die Adresse
       gehoert der Meldung im Gewinnfall, nicht dem Dashboard. */
    if (z) {
      teilnehmer = {
        deckel: z.deckel_nummer,
        instagram: z.instagram_handle,
        aktiviertAm: z.aktiviert_am,
        leaderboardOk: z.leaderboard_ok === true,
      }
    }
    /* Die eigenen Werte bekommt nur, wer den Beleg hat. `platz` ist der Platz
       in der oeffentlichen Gesamtliste — ohne Einwilligung gibt es keinen,
       dann steht hier null und im Dashboard der Hinweis darauf. */
    spiele = {
      beste,
      gesamt: gesamt.eigenePunkte,
      platz: gesamt.eigenerPlatz,
      gelistet: gesamt.gelistet,
      /* Das Gesamtranking ueber die fuenf Hauptgames: Liste plus eigener Stand. */
      gesamtranking: rangGesamt,
    }
  }

  res.status(200).json({ ok: true, aktiviert: aktiviert ?? 0, einstellungen, teilnehmer, spiele, koenig })
}

/* ------------------------------------------------------------------ */
/* code                                                                */
/* ------------------------------------------------------------------ */

/**
 * Raetselcode pruefen.
 *
 * Ein falscher Code ist kein Serverfehler: die Antwort ist 200 ohne Beleg.
 * Die Seite sagt dann „Code noch nicht geknackt." und bleibt stehen. Nur ein
 * echtes Problem (Netz, Konfiguration) fuehrt zu einem Fehlerstatus — sonst
 * koennte die Seite beides nicht auseinanderhalten und muesste luegen.
 */
function code(b, res, ip) {
  if (zuSchnell(ip, 'code', MAX_CODE)) {
    res.status(429).json(BREMSE)
    return
  }
  if (!codeHinterlegt()) {
    /* Ohne hinterlegten Code darf nichts aufgehen — und schon gar nicht
       alles. Das ist ein Konfigurationsfehler, kein falscher Code. */
    res.status(503).json(NICHT_DA)
    return
  }

  const eingabe = clean(b.code, 64)
  if (!codeStimmt(eingabe)) {
    res.status(200).json({ ok: true, zugang: null })
    return
  }

  res.status(200).json({ ok: true, zugang: belegErzeugen('z') })
}

/* ------------------------------------------------------------------ */
/* aktivieren                                                          */
/* ------------------------------------------------------------------ */

async function aktivieren(b, res, ip) {
  if (!belegPruefen(b.zugang, 'z')) {
    /* Abgelaufen oder gefaelscht. Die Seite schickt die Person zurueck zum
       Codefeld — ohne den Code zu nennen. */
    res.status(401).json({ ok: false, grund: 'zugang' })
    return
  }

  const nummer = deckelNummer(b.deckel)
  if (nummer == null) {
    res.status(400).json({ ok: false, grund: 'nummer' })
    return
  }

  const instagram = instagramNormalisieren(b.instagram)
  const email = clean(b.email, FELD_GRENZEN.email)
  const folgt = b.folgt === true
  /* Die Einwilligung in die oeffentliche Bestenliste ist freiwillig und hat
     mit der Teilnahme nichts zu tun: ohne sie wird der Deckel genauso
     aktiviert, gezogen und im Gewinnfall ausgezahlt — der Instagram-Name
     erscheint dann nur auf keiner oeffentlichen Liste. Deshalb steht sie
     nicht in der Pflichtfeldpruefung. */
  const leaderboardOk = b.leaderboard === true

  const felder = []
  if (!instagram) felder.push('instagram')
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) felder.push('email')
  /* Der Haken ist Pflicht. Er belegt eine Selbstauskunft, keine Pruefung —
     geprueft wird im Gewinnfall von Hand. */
  if (!folgt) felder.push('folgt')
  if (felder.length) {
    res.status(400).json({ ok: false, grund: 'felder', felder })
    return
  }

  if (zuSchnell(ip, 'schreiben', MAX_SCHREIBEN)) {
    res.status(429).json(BREMSE)
    return
  }

  const hash = ipHash(ip)
  const seit = new Date(Date.now() - FENSTER_MS).toISOString()
  const wiederholt = await zaehlen(
    `${TABELLE_TEILNEHMER}?ip_hash=eq.${hash}&aktiviert_am=gte.${encodeURIComponent(seit)}`,
  )
  if (wiederholt != null && wiederholt >= MAX_SCHREIBEN) {
    res.status(429).json(BREMSE)
    return
  }

  /* Ist die Nummer schon aktiviert? Dann kein Fehler, sondern eine Frage:
     die Seite zeigt ein Warnfenster, und nur mit ausdruecklicher Bestaetigung
     (besitzBestaetigt) entsteht ein weiterer Besitzanspruch. Der zaehlt nie
     als Los — Lostopf und Zaehler lesen nur Erstaktivierungen. Den Ausschlag
     fuer die Erstaktivierung gibt der partielle UNIQUE-Index. */
  const schon = await lesen(
    `${TABELLE_TEILNEHMER}?select=id&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
    + `&deckel_nummer=eq.${nummer}&anspruch_art=eq.${ANSPRUCH_ERST}&limit=1`,
  )
  const belegt = schon.length > 0
  if (belegt && b.besitzBestaetigt !== true) {
    res.status(409).json({ ok: false, grund: 'belegt' })
    return
  }
  const anspruchArt = belegt ? ANSPRUCH_WEITERER : ANSPRUCH_ERST

  const jetztIso = new Date().toISOString()
  const antwort = await fetch(restUrl(TABELLE_TEILNEHMER), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      deckel_nummer: nummer,
      instagram_handle: instagram,
      email,
      folgt_bestaetigt_von_nutzer: true,
      aktiviert_am: jetztIso,
      status: 'aktiv',
      ip_hash: hash,
      leaderboard_ok: leaderboardOk,
      leaderboard_ok_am: leaderboardOk ? jetztIso : null,
      anspruch_art: anspruchArt,
    }),
  })

  if (antwort.status === 409) {
    /* Jemand war zwischen Vorabpruefung und Schreiben schneller. Dann dieselbe
       Frage wie oben — bestaetigt wird immer ausdruecklich. */
    res.status(409).json({ ok: false, grund: 'belegt' })
    return
  }
  if (!antwort.ok) {
    res.status(500).json({ ok: false, grund: 'server' })
    return
  }

  const zeilen = await antwort.json().catch(() => null)
  const zeile = Array.isArray(zeilen) ? zeilen[0] : null
  if (!zeile?.id) {
    /* Ohne bestaetigte Zeile gibt es keinen Erfolg zu melden. */
    res.status(500).json({ ok: false, grund: 'server' })
    return
  }

  res.status(200).json({
    ok: true,
    sitzung: belegErzeugen('s', { id: zeile.id }),
    teilnehmer: {
      deckel: zeile.deckel_nummer,
      instagram: zeile.instagram_handle,
      aktiviertAm: zeile.aktiviert_am,
      leaderboardOk: zeile.leaderboard_ok === true,
    },
    aktiviert: (await aktivierteZaehlen()) ?? undefined,
  })
}

/* ------------------------------------------------------------------ */
/* melden                                                              */
/* ------------------------------------------------------------------ */

/**
 * Gewinnmeldung. Bewusst ohne jede automatische Bewertung: dieser Endpoint
 * nimmt entgegen und legt ab. Ob ein Gewinn vorliegt, entscheidet die
 * Pruefung von Hand — Originaldeckel, Teilnahme, Follow, Frist.
 *
 * Die Antwort sagt deshalb nie „du hast gewonnen", auch dann nicht, wenn die
 * gemeldete Nummer zufaellig die gezogene ist.
 */
async function melden(b, res, ip) {
  const nummer = deckelNummer(b.deckel)
  const instagram = instagramNormalisieren(b.instagram)
  const email = clean(b.email, FELD_GRENZEN.email)
  if (nummer == null || !instagram || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ ok: false, grund: 'felder' })
    return
  }

  if (zuSchnell(ip, 'melden', MAX_SCHREIBEN)) {
    res.status(429).json(BREMSE)
    return
  }

  const einstellungen = await einstellungenLesen()
  const antwort = await fetch(restUrl(TABELLE_MELDUNGEN), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      deckel_nummer: nummer,
      instagram_handle: instagram,
      email,
      nachricht: cleanText(b.nachricht, FELD_GRENZEN.nachricht) || null,
      /* Festhalten, auf welche Ziehung sich die Meldung bezieht. Sonst
         laesst sich spaeter nicht mehr sagen, ob sie fristgerecht war. */
      gezogene_nummer: einstellungen.gezogeneNummer,
      gemeldet_am: new Date().toISOString(),
      status: 'offen',
      ip_hash: ipHash(ip),
    }),
  })

  if (!antwort.ok) {
    res.status(500).json({ ok: false, grund: 'server' })
    return
  }

  res.status(200).json({ ok: true, gespeichert: true })
}

/* ------------------------------------------------------------------ */
/* spiel-start                                                         */
/* ------------------------------------------------------------------ */

/**
 * Laufticket fuer eine Runde ausgeben.
 *
 * Spielen darf nur, wer einen Deckel aktiviert hat — der Sitzungsbeleg ist
 * der Nachweis. Im Ticket steht, wer spielt, welches Spiel und wann es
 * losging; es ist signiert und damit im Browser nicht aenderbar.
 */
async function spielStart(b, res, ip) {
  const beleg = belegPruefen(b.sitzung, 's')
  if (!beleg?.id) {
    res.status(401).json({ ok: false, grund: 'sitzung' })
    return
  }

  const game = spielSchluessel(b.game)
  if (!game) {
    res.status(400).json({ ok: false, grund: 'spiel' })
    return
  }

  if (zuSchnell(ip, 'spiel', MAX_SPIEL)) {
    res.status(429).json(BREMSE)
    return
  }

  /* Ein im Admin ausgeblendetes Spiel startet nicht — auch nicht ueber einen
     alten Tab. Die Scores bleiben davon unberuehrt. Kann der Stand nicht
     gelesen werden, liefert einstellungenLesen die Voreinstellung: aktiv. */
  const { spieleAktiv } = await einstellungenLesen()
  if (spieleAktiv?.[game] === false) {
    res.status(403).json({ ok: false, grund: 'aus' })
    return
  }

  /* Der Start wird vermerkt (Abbruchquote im Admin). Die Nonce steht im
     frisch signierten Ticket; ohne sie liessen sich Start und Ergebnis nicht
     zusammenfuehren. */
  const ticket = laufticket(beleg.id, game)
  const lauf = laufticketPruefen(ticket, beleg.id, game)?.lauf
  if (lauf) await spielstartVermerken(beleg.id, game, lauf)

  res.status(200).json({ ok: true, ticket, dauerMs: SPIELE[game].dauerMs })
}

/* ------------------------------------------------------------------ */
/* spiel-ende                                                          */
/* ------------------------------------------------------------------ */

/**
 * Punktestand annehmen — aber nur gegen ein gueltiges Laufticket.
 *
 * Ein reiner `{ score: 999999999 }` aus der Konsole kommt hier nicht durch.
 * Geprueft wird in dieser Reihenfolge:
 *
 *   1. Sitzungsbeleg — wer schickt?
 *   2. Laufticket — Signatur, Typ, Ablauf, Teilnehmer, Spiel. Der Start-
 *      zeitpunkt kommt aus dem Ticket, nicht aus der Anfrage.
 *   3. Punktzahl gegen die harte Obergrenze des Spiels → darueber 400.
 *   4. Dauer und Punktzahl gegen die Plausibilitaetsgrenze → auffaellig wird
 *      gespeichert, aber als 'verdacht' markiert und aus jeder Rangliste
 *      genommen.
 *   5. Einmaligkeit: der Unique-Index auf lauf_id. Ein zweiter Versuch mit
 *      demselben Ticket bekommt 409.
 *
 * Das ist keine Hochsicherheitspruefung — wer das Spiel selbst nachbaut, kann
 * ein ehrlich aussehendes Ergebnis erzeugen. Trivial manipulierbar ist es
 * nicht mehr, und genau das war die Aufgabe.
 */
async function spielEnde(b, res, ip) {
  const beleg = belegPruefen(b.sitzung, 's')
  if (!beleg?.id) {
    res.status(401).json({ ok: false, grund: 'sitzung' })
    return
  }

  const game = spielSchluessel(b.game)
  if (!game) {
    res.status(400).json({ ok: false, grund: 'spiel' })
    return
  }

  const ticket = laufticketPruefen(b.ticket, beleg.id, game)
  if (!ticket) {
    /* Abgelaufen, gefaelscht, fuer ein anderes Spiel oder eine andere Person
       ausgestellt. Die Seite bittet dann um eine neue Runde. */
    res.status(401).json({ ok: false, grund: 'ticket' })
    return
  }

  if (zuSchnell(ip, 'spiel', MAX_SPIEL)) {
    res.status(429).json(BREMSE)
    return
  }

  const regeln = SPIELE[game]
  const punkte = Math.trunc(Number(b.score))
  if (!Number.isFinite(punkte) || punkte < 0 || punkte > regeln.hart) {
    res.status(400).json({ ok: false, grund: 'punkte' })
    return
  }

  const rohRunden = Math.trunc(Number(b.runden))
  const runden = Number.isFinite(rohRunden) && rohRunden >= 0 ? Math.min(rohRunden, 9999) : null

  /* Nach oben ist die Dauer durch die Ticketlaufzeit begrenzt (zehn Minuten) —
     bewusst grosszuegig, denn in einem Hintergrund-Tab stehen die Animationen
     still, waehrend die Serveruhr weiterlaeuft. Verdaechtig ist der andere
     Fall: ein Ergebnis, das schneller da war als moeglich. Fuer die Zeit-
     spiele heisst das: schneller als die halbe Runde. Fuer die Endlosspiele:
     schneller als die Mindestzeit je Modul bzw. Meter — siehe laufVerdacht. */
  const gruende = laufVerdacht(game, { dauerMs: ticket.dauerMs, punkte, runden })
  const verdacht = gruende.length > 0

  const { ok, doppelt } = await scoreSpeichern({
    teilnehmer_id: beleg.id,
    game,
    score: punkte,
    lauf_id: ticket.lauf,
    dauer_ms: ticket.dauerMs,
    runden,
    status: verdacht ? 'verdacht' : 'gueltig',
    notiz: verdacht ? gruende.join('+') : null,
    ip_hash: ipHash(ip),
  })

  if (doppelt) {
    /* Dasselbe Ticket ein zweites Mal. Entweder ein doppelt abgeschickter
       Abschluss oder ein Versuch, einen Lauf mehrfach zu werten. */
    res.status(409).json({ ok: false, grund: 'doppelt' })
    return
  }
  if (!ok) {
    res.status(500).json({ ok: false, grund: 'server' })
    return
  }

  /* Der eigene Stand soll unmittelbar nach der Runde stimmen, nicht erst nach
     Ablauf des Zwischenspeichers. */
  rangSpeicherLeeren()

  const [beste, gesamt, eigenesSpiel, heute, rangGesamt] = await Promise.all([
    eigeneBestwerte(beleg.id),
    gesamtrangliste(beleg.id),
    rangliste(game, beleg.id),
    bestesHeute(game),
    gesamtranking(beleg.id),
  ])

  res.status(200).json({
    ok: true,
    gespeichert: true,
    /* Ehrlich benannt: gespeichert ist der Lauf in jedem Fall, gewertet wird
       er nur, wenn Dauer und Punktzahl zusammenpassen. */
    gewertet: !verdacht,
    punkte,
    beste,
    gesamt: gesamt.eigenePunkte,
    platz: gesamt.eigenerPlatz,
    gelistet: gesamt.gelistet,
    /* Der eigene Stand in genau diesem Spiel — Grundlage fuer "PLATZ 7 VON
       143" und "NOCH 1.420 PUNKTE BIS PLATZ 5" direkt nach der Runde. Ohne
       Zustimmung zur Rangliste bleiben die Felder null; die Spielkarte zeigt
       dann nur den eigenen Score. */
    rang: {
      platz: eigenesSpiel.eigenerPlatz,
      von: eigenesSpiel.gesamtZahl,
      bisPlatz: eigenesSpiel.bisPlatz,
      luecke: eigenesSpiel.luecke,
      vorMir: eigenesSpiel.vorMir,
      top10Luecke: eigenesSpiel.top10Luecke,
      top3Luecke: eigenesSpiel.top3Luecke,
    },
    heute,
    gesamtranking: rangGesamt,
  })
}

/* ------------------------------------------------------------------ */
/* rangliste                                                           */
/* ------------------------------------------------------------------ */

/**
 * Die oeffentlichen Bestenlisten. Alle fuenf in einer Antwort: das Umschalten
 * zwischen den Reitern soll nicht jedes Mal eine Anfrage kosten.
 *
 * Oeffentlich ist hier ausschliesslich Instagram-Name und Punktzahl, und das
 * nur von Personen, die genau dem zugestimmt haben (leaderboard_ok). Keine
 * Deckelnummer, keine E-Mail-Adresse, keine Teilnehmer-id verlaesst diese
 * Funktion — siehe listeBauen in _terminal-kern.js.
 *
 * Liegt ein Sitzungsbeleg an, kommt zusaetzlich der eigene Platz zurueck. Der
 * Beleg ist dafuer Pflicht: sonst koennte jeder die Platzierung beliebiger
 * Teilnehmer-ids abfragen.
 */
async function ranglisteAktion(b, res) {
  const beleg = belegPruefen(b.sitzung, 's')
  const eigene = beleg?.id ?? null

  const [einzeln, gesamt, { spieleAktiv, spieleReihenfolge }, rangGesamt] = await Promise.all([
    Promise.all(SPIEL_SCHLUESSEL.map((game) => rangliste(game, eigene))),
    gesamtrangliste(eigene),
    einstellungenLesen(),
    gesamtranking(eigene),
  ])

  const listen = Object.fromEntries(SPIEL_SCHLUESSEL.map((game, i) => [game, einzeln[i]]))
  res.status(200).json({
    ok: true,
    listen: { ...listen, gesamt, gesamtranking: rangGesamt },
    spieleAktiv,
    spieleReihenfolge,
  })
}

/* ------------------------------------------------------------------ */
/* leaderboard                                                         */
/* ------------------------------------------------------------------ */

/**
 * Einwilligung zur oeffentlichen Rangliste — jederzeit an, jederzeit aus.
 *
 * Braucht den Sitzungsbeleg; geaendert wird nur die eigene Zeile und dort nur
 * leaderboard_ok samt Zeitpunkt. Ein Widerruf nimmt den Namen sofort aus
 * allen Listen (der Ranglistenspeicher wird geleert). Die Scores bleiben
 * gespeichert — sie tauchen nur nicht mehr oeffentlich auf.
 */
async function einwilligung(b, res, ip) {
  const beleg = belegPruefen(b.sitzung, 's')
  if (!beleg?.id) {
    res.status(401).json({ ok: false, grund: 'sitzung' })
    return
  }
  if (typeof b.ok !== 'boolean') {
    res.status(400).json({ ok: false, grund: 'felder' })
    return
  }
  if (zuSchnell(ip, 'einwilligung', MAX_EINWILLIGUNG)) {
    res.status(429).json(BREMSE)
    return
  }

  const stand = await einwilligungSetzen(beleg.id, b.ok)
  if (stand === null) {
    res.status(500).json({ ok: false, grund: 'server' })
    return
  }
  res.status(200).json({ ok: true, leaderboardOk: stand })
}

/* ------------------------------------------------------------------ */
/* wieder-anfordern / wieder-einloesen                                 */
/* ------------------------------------------------------------------ */

/**
 * Wieder-Login fuer Deckel, die schon aktiviert sind — neues Handy, anderer
 * Browser, Speicher geleert.
 *
 * WAS HIER NICHT PASSIERT
 * -----------------------
 * Keine erneute Aktivierung. Deckelnummer, Instagram-Name, Scores und Ziehung
 * bleiben unberuehrt: geschrieben wird ausschliesslich in die eigene Tabelle
 * videko_terminal_wiederherstellung. Heraus kommt derselbe Sitzungsbeleg wie
 * nach der Aktivierung — mehr nicht.
 *
 * NICHTS VERRATEN
 * ---------------
 * Ob zu einer Adresse ein Deckel gehoert, laesst sich von aussen nicht
 * erkennen: dieselbe Antwort, derselbe Status, und jede Antwort braucht
 * mindestens WIEDER_MINDEST_MS — der Weg mit Mail waere sonst messbar
 * langsamer. Auch fuer unbekannte Adressen wird eine Zeile geschrieben (ohne
 * Teilnehmer, ohne Token), damit das Mengenlimit fuer beide gleich greift.
 *
 * DER TOKEN
 * ---------
 * 32 Zufallsbytes aus crypto.randomBytes, 15 Minuten gueltig, einmal
 * verwendbar. Gespeichert wird nur sein SHA-256 — wer die Tabelle liest, kann
 * damit nichts anfangen. Der Link traegt ihn im Fragment (#wieder=…), das nie
 * an einen Server und damit in kein Zugriffsprotokoll gelangt.
 */
const WIEDER_LEBEN_MS = 15 * 60 * 1000
const WIEDER_FENSTER_MS = 15 * 60 * 1000
const MAX_WIEDER_IP = 5
const MAX_WIEDER_MAIL = 3
const MAX_WIEDER_EINLOESEN = 20
const WIEDER_MINDEST_MS = 3500
const WIEDER_AUFBEWAHREN_MS = 24 * 60 * 60 * 1000
const TOKEN_MUSTER = /^[A-Za-z0-9_-]{43}$/
const LINK_UNGUELTIG = { ok: false, grund: 'link' }

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex')
const warteBis = (zeitpunkt) => new Promise((fertig) => setTimeout(fertig, Math.max(0, zeitpunkt - Date.now())))

/** Nie aus dem Host-Header: sonst liesse sich der Link auf eine fremde Seite lenken. */
function terminalBasis() {
  const basis = String(process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '')
  return /^https:\/\/[^/\s]+$/.test(basis) ? basis : 'https://videko-kuechen.de'
}

/* Reservierte Domains (RFC 2606) bekommen nie Post — daran haengen die
   Pruefdeckel der automatischen Tests. */
const reserviert = (adresse) => /\.(invalid|test|example|localhost)$/i.test(adresse.split('@').pop() || '')

const htmlSicher = (s) => String(s ?? '').replace(/[&<>"]/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[z]))

async function zugangslinkSenden(an, nummer, token) {
  if (!mailBereit() || reserviert(an)) return
  const link = `${terminalBasis()}/terminal#wieder=${token}`
  const deckel = Number.isFinite(Number(nummer)) ? ` für Deckel Nr. ${Number(nummer)}` : ''
  const text = [
    'Hallo,',
    '',
    `hier ist dein Zugangslink zum VIDEKO Terminal${deckel}:`,
    '',
    link,
    '',
    'Der Link ist 15 Minuten gültig und funktioniert nur ein einziges Mal. Danach bist du auf diesem Gerät wieder eingeloggt.',
    '',
    'Du hast keinen Link angefordert? Dann ignoriere diese Mail einfach. An deinem Deckel ändert sich nichts.',
    '',
    'VIDEKO Küchen',
  ].join('\n')
  const html = `<p>Hallo,</p>
<p>hier ist dein Zugangslink zum VIDEKO Terminal${htmlSicher(deckel)}:</p>
<p><a href="${htmlSicher(link)}">Zum VIDEKO Terminal</a></p>
<p>Der Link ist 15 Minuten gültig und funktioniert nur ein einziges Mal. Danach bist du auf diesem Gerät wieder eingeloggt.</p>
<p>Du hast keinen Link angefordert? Dann ignoriere diese Mail einfach. An deinem Deckel ändert sich nichts.</p>
<p>VIDEKO Küchen</p>`
  await mailTransport({ connectionTimeout: 6000, greetingTimeout: 6000, socketTimeout: 8000 }).sendMail({
    from: mailAbsender(),
    to: an,
    subject: 'Dein Zugangslink zum VIDEKO Terminal',
    text,
    html,
  })
}

async function wiederEintragen(felder) {
  const antwort = await fetch(restUrl(TABELLE_WIEDER), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ kampagne: KAMPAGNE, ...felder }),
  })
  return antwort.ok
}

async function wiederAnfordern(b, res, ip) {
  const start = Date.now()
  const email = clean(b.email, FELD_GRENZEN.email).toLowerCase()
  /* Eine kaputte Adresse verraet nichts ueber andere — die darf sofort
     zurueck. */
  if (!email || !EMAIL_MUSTER.test(email)) {
    res.status(400).json({ ok: false, grund: 'felder', felder: ['email'] })
    return
  }

  if (zuSchnell(ip, 'wieder', MAX_WIEDER_IP)) {
    res.status(429).json(BREMSE)
    return
  }

  const ipH = ipHash(ip)
  const mailH = ipHash(`mail|${email}`)
  const seit = encodeURIComponent(new Date(start - WIEDER_FENSTER_MS).toISOString())
  const [proIp, proMail] = await Promise.all([
    zaehlen(`${TABELLE_WIEDER}?ip_hash=eq.${ipH}&erstellt_am=gte.${seit}`),
    zaehlen(`${TABELLE_WIEDER}?email_hash=eq.${mailH}&erstellt_am=gte.${seit}`),
  ])
  if ((proIp ?? 0) >= MAX_WIEDER_IP || (proMail ?? 0) >= MAX_WIEDER_MAIL) {
    res.status(429).json(BREMSE)
    return
  }

  try {
    /* ilike, weil Adressen so gespeichert sind, wie sie eingetippt wurden.
       Platzhalter aus der Eingabe werden entschaerft, und entschieden wird
       danach per exaktem Vergleich — nie ueber ein Muster. */
    const muster = email.replace(/[\\%_*]/g, (z) => (z === '*' ? '_' : `\\${z}`))
    const zeilen = await lesen(
      `${TABELLE_TEILNEHMER}?select=id,deckel_nummer,email&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
      + `&email=ilike.${encodeURIComponent(muster)}&aktiviert_am=not.is.null&limit=5`,
    )
    const treffer = zeilen.filter((z) => z?.id && String(z.email ?? '').trim().toLowerCase() === email)
    const jetztIso = new Date().toISOString()

    if (treffer.length === 0) {
      await wiederEintragen({ email_hash: mailH, ip_hash: ipH })
    }

    for (const z of treffer) {
      /* Aeltere, noch offene Links dieses Deckels sind ab jetzt wertlos. */
      await fetch(
        restUrl(`${TABELLE_WIEDER}?teilnehmer_id=eq.${encodeURIComponent(z.id)}&verbraucht_am=is.null`),
        { method: 'PATCH', headers: kopfzeilen({ Prefer: 'return=minimal' }), body: JSON.stringify({ verbraucht_am: jetztIso }) },
      )
      const token = crypto.randomBytes(32).toString('base64url')
      const gespeichert = await wiederEintragen({
        teilnehmer_id: z.id,
        token_hash: sha256(token),
        email_hash: mailH,
        ip_hash: ipH,
        gueltig_bis: new Date(Date.now() + WIEDER_LEBEN_MS).toISOString(),
      })
      if (gespeichert) {
        try {
          await zugangslinkSenden(String(z.email).trim(), z.deckel_nummer, token)
        } catch {
          /* Nach aussen bleibt es bei derselben Antwort. */
        }
      }
    }

    /* Alte Zeilen braucht niemand: das Fenster ist 15 Minuten, der Link auch. */
    await fetch(
      restUrl(`${TABELLE_WIEDER}?erstellt_am=lt.${encodeURIComponent(new Date(Date.now() - WIEDER_AUFBEWAHREN_MS).toISOString())}`),
      { method: 'DELETE', headers: kopfzeilen({ Prefer: 'return=minimal' }) },
    )
  } catch {
    /* Auch ein Fehler unterwegs aendert die Antwort nicht. */
  }

  await warteBis(start + WIEDER_MINDEST_MS)
  res.status(200).json({ ok: true, meldung: WIEDER_NEUTRAL })
}

/**
 * Zugangslink einloesen.
 *
 * Verbraucht wird in einem einzigen PATCH mit allen Bedingungen im Filter:
 * passender Hash, noch nicht verbraucht, noch nicht abgelaufen. Kommen zwei
 * Aufrufe mit demselben Link gleichzeitig, kann nur einer die Zeile aendern.
 * Ungueltig, abgelaufen, schon benutzt: nach aussen derselbe Ausgang.
 */
async function wiederEinloesen(b, res, ip) {
  if (zuSchnell(ip, 'einloesen', MAX_WIEDER_EINLOESEN)) {
    res.status(429).json(BREMSE)
    return
  }

  const token = clean(b.token, 64)
  if (!TOKEN_MUSTER.test(token)) {
    res.status(401).json(LINK_UNGUELTIG)
    return
  }

  const jetztIso = new Date().toISOString()
  const antwort = await fetch(
    restUrl(
      `${TABELLE_WIEDER}?token_hash=eq.${sha256(token)}&verbraucht_am=is.null`
      + `&gueltig_bis=gt.${encodeURIComponent(jetztIso)}&teilnehmer_id=not.is.null&select=teilnehmer_id`,
    ),
    { method: 'PATCH', headers: kopfzeilen({ Prefer: 'return=representation' }), body: JSON.stringify({ verbraucht_am: jetztIso }) },
  )
  if (!antwort.ok) {
    res.status(500).json({ ok: false, grund: 'server' })
    return
  }
  const verbraucht = await antwort.json().catch(() => null)
  const id = Array.isArray(verbraucht) && verbraucht.length === 1 ? verbraucht[0].teilnehmer_id : null
  if (!id) {
    res.status(401).json(LINK_UNGUELTIG)
    return
  }

  const zeilen = await lesen(
    `${TABELLE_TEILNEHMER}?select=id,deckel_nummer,instagram_handle,aktiviert_am,leaderboard_ok`
    + `&id=eq.${encodeURIComponent(id)}&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&aktiviert_am=not.is.null&limit=1`,
  )
  const zeile = zeilen[0]
  if (!zeile?.id) {
    res.status(401).json(LINK_UNGUELTIG)
    return
  }

  res.status(200).json({
    ok: true,
    sitzung: belegErzeugen('s', { id: zeile.id }),
    teilnehmer: {
      deckel: zeile.deckel_nummer,
      instagram: zeile.instagram_handle,
      aktiviertAm: zeile.aktiviert_am,
      leaderboardOk: zeile.leaderboard_ok === true,
    },
  })
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

  const b = await readBody(req)
  const aktion = clean(b.aktion, 20)
  const ip = klientIp(req)

  /* Honigtopf: ein ausgefuelltes unsichtbares Feld kommt nicht von einem
     Menschen. Antwort unauffaellig, aber ohne Erfolgsbehauptung — und ohne
     Beleg, mit dem es weitergehen koennte. */
  if (clean(b.website, 80)) {
    res.status(200).json({ ok: true, gespeichert: false, status: 'ignoriert' })
    return
  }

  if (!konfiguriert()) {
    res.status(503).json(NICHT_DA)
    return
  }

  /* Testmodus. Der Beleg kommt aus dem Admin-Testlabor und beschreibt eine
     Person, die es nicht gibt. Er steht vor allem anderen, damit im Testmodus
     mit Sicherheit keine der schreibenden Funktionen unten erreicht wird —
     auch nicht durch einen Fehler in einer Bedingung. Die Notbremse
     (TERMINAL_SCHREIBEN) gilt hier nicht: es wird ohnehin nichts geschrieben,
     und gerade bei angehaltener Aktion will man pruefen koennen. */
  const probe = probeLesen(b.probe)
  if (probe) {
    try {
      if (await probeBehandeln(aktion, b, res, probe)) return
    } catch {
      res.status(500).json({ ok: false, grund: 'server' })
      return
    }
  }

  /* Die Notbremse haelt alles an, was schreibt — auch die Spiele. Ein Lauf,
     der nicht gespeichert werden kann, soll nicht erst gespielt werden. */
  const schreibend = aktion === 'aktivieren' || aktion === 'melden'
    || aktion === 'spiel-start' || aktion === 'spiel-ende' || aktion === 'leaderboard'
  if (schreibend && !schreibenErlaubt()) {
    res.status(503).json(PAUSE)
    return
  }

  try {
    if (aktion === 'zustand') return await zustand(b, res)
    if (aktion === 'code') return code(b, res, ip)
    if (aktion === 'aktivieren') return await aktivieren(b, res, ip)
    if (aktion === 'melden') return await melden(b, res, ip)
    if (aktion === 'spiel-start') return await spielStart(b, res, ip)
    if (aktion === 'spiel-ende') return await spielEnde(b, res, ip)
    if (aktion === 'rangliste') return await ranglisteAktion(b, res)
    if (aktion === 'leaderboard') return await einwilligung(b, res, ip)
    if (aktion === 'wieder-anfordern') return await wiederAnfordern(b, res, ip)
    if (aktion === 'wieder-einloesen') return await wiederEinloesen(b, res, ip)
  } catch {
    res.status(500).json({ ok: false, grund: 'server' })
    return
  }

  res.status(400).json({ ok: false, grund: 'aktion' })
}
