import crypto from 'node:crypto'

import { EMAIL_MUSTER, FELD_GRENZEN, WIEDER_NEUTRAL } from '../src/data/terminal.js'
import {
  GESAMT_SPIELE,
  SPIELE,
  SPIEL_SCHLUESSEL,
  belegErzeugen,
  belegPruefen,
  aktivierteZaehlen,
  bestesHeute,
  clean,
  einstellungenLesen,
  gesamtrangliste,
  laufticket,
  laufticketPruefen,
  laufVerdacht,
  rangliste,
  spielSchluessel,
  tresorkoenig,
} from './_terminal-kern.js'
import { gesamtranking } from './_terminal-gesamtranking.js'

/**
 * Das Testlabor: eine vollstaendig virtuelle Teilnehmerin.
 *
 * WARUM DIESE DATEI EXISTIERT
 * ---------------------------
 * Wer die Aktion einmal aktiviert hat, sieht danach immer nur noch den
 * aktivierten Zustand. Um die Nutzerreise wieder von vorn zu sehen, gaebe es
 * zwei Wege: echte Datensaetze anlegen und wieder loeschen — oder gar keine.
 * Diese Datei ist der zweite Weg.
 *
 * Die Testsitzung ist ein signierter Beleg vom Typ 'p'. Er wird ausschliesslich
 * in api/terminal-admin.js ausgegeben, und zwar erst NACH der Admin-Anmeldung.
 * Der Admin-Schluessel selbst verlaesst dabei den Server nie: der Browser
 * bekommt nur den Beleg, und der Beleg kann nichts ausser Testmodus.
 *
 * WAS DAMIT GARANTIERT IST
 * ------------------------
 * Keine Funktion in dieser Datei schreibt. Nicht in die Teilnehmer, nicht in
 * die Scores, nicht in die Meldungen, nicht in die Einstellungen. Damit ist
 * die Trennung zwischen Test und Wirklichkeit keine Vereinbarung, an die sich
 * jemand halten muss, sondern eine Eigenschaft des Codes:
 *
 *   - die Teilnehmerzahl kann sich durch einen Test nicht aendern,
 *   - die Ziehung kann keinen Testdeckel ziehen, weil keiner existiert,
 *   - in den Ranglisten kann kein Testlauf auftauchen,
 *   - der Tresorkoenig bleibt, wer er ist,
 *   - und es gibt nichts, was hinterher aufgeraeumt werden muesste.
 *
 * Gelesen wird dagegen sehr wohl: Termin, Teilnehmerzahl, Ranglisten und
 * Tresorkoenig kommen im Testmodus aus der echten Datenbank. Sonst wuerde man
 * im Testlabor eine Seite pruefen, die es so gar nicht gibt.
 *
 * WO DER TESTSTAND LIEGT
 * ----------------------
 * In der Serverless-Welt gibt es kein Gedaechtnis zwischen zwei Aufrufen. Der
 * Stand der Testsitzung (aktiviert ja/nein, bisherige Bestwerte) steht deshalb
 * im Beleg selbst: jede Antwort gibt einen neuen Beleg zurueck, der Browser
 * legt ihn ab. Faelschen laesst sich daran nichts — er ist signiert — und
 * selbst wenn: er beschreibt eine Person, die es nicht gibt.
 */

/** So heisst die Testperson ueberall auf der Seite. */
export const PROBE_HANDLE = 'videko_test'
/** Und das steht statt einer Deckelnummer. Keine echte Nummer wird belegt. */
export const PROBE_DECKEL = 'TEST'

/** Der Teilnehmer-Platzhalter fuer das Laufticket. Keine echte Kennung. */
const PROBE_ID = 'probe'

function leereBeste(roh) {
  const beste = {}
  for (const s of SPIEL_SCHLUESSEL) {
    const wert = Number(roh?.[s])
    beste[s] = Number.isFinite(wert) && wert > 0 ? Math.trunc(wert) : null
  }
  return beste
}

/** Einen Testbeleg ausstellen. Nur api/terminal-admin.js ruft das auf. */
export function probeErzeugen(stand = {}) {
  return belegErzeugen('p', {
    a: stand.aktiv ? 1 : 0,
    m: Number.isFinite(stand.seit) ? stand.seit : Date.now(),
    b: leereBeste(stand.beste),
    /* Der zuletzt eingeloeste Testlink. Damit gilt auch im Testlabor: ein
       Link, einmal benutzt, ist verbraucht. */
    w: typeof stand.w === 'string' ? stand.w : undefined,
    /* Einwilligung zur Rangliste, rein virtuell. Voreinstellung: ja — so sah
       die Testperson bisher aus. Das Testlabor kann sie ohne Einwilligung
       starten, um den Fall "noch nicht oeffentlich" zu sehen. */
    l: stand.leaderboardOk === false ? 0 : 1,
  })
}

/** Die Felder, aus denen ein Folgebeleg entsteht — nichts geht verloren. */
const weiter = (stand, extra = {}) => ({
  aktiv: stand.aktiv, seit: stand.seit, beste: stand.beste, w: stand.w, leaderboardOk: stand.leaderboardOk, ...extra,
})

/** Einen Testbeleg pruefen. null heisst: kein Testmodus. */
export function probeLesen(beleg) {
  const daten = belegPruefen(beleg, 'p')
  if (!daten) return null
  return {
    aktiv: daten.a === 1,
    seit: Number.isFinite(daten.m) ? daten.m : Date.now(),
    beste: leereBeste(daten.b),
    w: typeof daten.w === 'string' ? daten.w : null,
    leaderboardOk: daten.l !== 0,
  }
}

const summe = (beste) => GESAMT_SPIELE.reduce((s, k) => s + (Number(beste[k]) || 0), 0)

/**
 * Ein Platz, der nicht in der Liste steht.
 *
 * Die Testpunkte landen in keiner Rangliste — trotzdem soll im Testlabor
 * sichtbar sein, wie "PLATZ 7 VON 143" aussieht. Gerechnet wird deshalb, wo
 * der Testlauf stehen WUERDE: gegen die echte oeffentliche Liste, ohne sie
 * anzufassen. `gelistet` bleibt dabei ausdruecklich false.
 *
 * Die oeffentliche Liste ist auf zwanzig Eintraege gekuerzt. Reicht der
 * Testwert nicht in diese zwanzig, wird der Platz hinter dem Feld angesetzt
 * statt geraten.
 */
function virtuellerRang(punkte, liste) {
  const eintraege = liste.eintraege || []
  const wert = Number(punkte) || 0
  if (wert <= 0) return { platz: null, bisPlatz: null, luecke: null, vorMir: null, top10Luecke: null, top3Luecke: null, von: liste.gesamtZahl || 0 }

  const index = eintraege.findIndex((e) => e.punkte <= wert)
  const platz = index >= 0 ? index + 1 : Math.max(eintraege.length + 1, (liste.gesamtZahl || 0) + 1)

  let bisPlatz = null
  let luecke = null
  let vorMir = null
  for (let i = Math.min(index >= 0 ? index : eintraege.length, eintraege.length) - 1; i >= 0; i -= 1) {
    if (eintraege[i].punkte > wert) {
      bisPlatz = i + 1
      luecke = eintraege[i].punkte - wert + 1
      vorMir = eintraege[i].instagram ?? null
      break
    }
  }
  const lueckeBis = (ziel) => (platz > ziel && eintraege.length >= ziel ? eintraege[ziel - 1].punkte - wert + 1 : null)

  return {
    platz,
    bisPlatz,
    luecke,
    vorMir,
    top10Luecke: lueckeBis(10),
    top3Luecke: lueckeBis(3),
    von: Math.max(liste.gesamtZahl || 0, platz),
  }
}

/* ------------------------------------------------------------------ */
/* Die Aktionen im Testmodus                                           */
/* ------------------------------------------------------------------ */

async function probeZustand(stand, res) {
  const [einstellungen, aktiviert, koenig] = await Promise.all([
    einstellungenLesen(),
    aktivierteZaehlen(),
    tresorkoenig(),
  ])

  let teilnehmer = null
  let spiele = null
  if (stand.aktiv) {
    teilnehmer = {
      deckel: PROBE_DECKEL,
      instagram: PROBE_HANDLE,
      aktiviertAm: new Date(stand.seit).toISOString(),
      leaderboardOk: stand.leaderboardOk,
      probe: true,
    }
    const gesamt = summe(stand.beste)
    const [liste, rangGesamt] = await Promise.all([
      gesamtrangliste(null),
      /* Virtuell eingerechnet: wo die Testperson stuende. Die Liste selbst
         bleibt die echte, und die Testperson steht nie darin. */
      gesamtranking(null, stand.beste ?? {}),
    ])
    const rang = virtuellerRang(gesamt, liste)
    spiele = {
      beste: stand.beste,
      gesamt: gesamt || null,
      platz: rang.platz,
      /* Nie true. Der Testlauf steht in keiner oeffentlichen Liste. */
      gelistet: false,
      gesamtranking: rangGesamt,
    }
  }

  res.status(200).json({
    ok: true,
    probe: true,
    aktiviert: aktiviert ?? 0,
    einstellungen,
    teilnehmer,
    spiele,
    koenig,
  })
}

/**
 * Aktivierung im Testmodus.
 *
 * Die Eingaben werden bewusst NICHT geprueft — die Formularpruefung sitzt in
 * der echten Aktion und wird dort getestet. Hier geht es darum, den Zustand
 * danach zu sehen. Geschrieben wird nichts, und zurueck kommt immer dieselbe
 * virtuelle Person.
 */
function probeAktivieren(stand, b, res) {
  const neu = weiter(stand, { aktiv: true, seit: Date.now(), leaderboardOk: b.leaderboardOk !== false })
  res.status(200).json({
    ok: true,
    probe: probeErzeugen(neu),
    sitzung: null,
    teilnehmer: {
      deckel: PROBE_DECKEL,
      instagram: PROBE_HANDLE,
      aktiviertAm: new Date(neu.seit).toISOString(),
      leaderboardOk: neu.leaderboardOk,
      probe: true,
    },
  })
}

async function probeSpielStart(b, res) {
  const game = spielSchluessel(b.game)
  if (!game) {
    res.status(400).json({ ok: false, grund: 'spiel' })
    return
  }
  /* Der Game-Schalter gilt auch im Testlabor. */
  const { spieleAktiv } = await einstellungenLesen()
  if (spieleAktiv?.[game] === false) {
    res.status(403).json({ ok: false, grund: 'aus' })
    return
  }
  res.status(200).json({ ok: true, ticket: laufticket(PROBE_ID, game), dauerMs: SPIELE[game].dauerMs })
}

async function probeSpielEnde(stand, b, res) {
  const game = spielSchluessel(b.game)
  if (!game) {
    res.status(400).json({ ok: false, grund: 'spiel' })
    return
  }
  const ticket = laufticketPruefen(b.ticket, PROBE_ID, game)
  if (!ticket) {
    res.status(401).json({ ok: false, grund: 'ticket' })
    return
  }

  const regeln = SPIELE[game]
  const punkte = Math.trunc(Number(b.score))
  if (!Number.isFinite(punkte) || punkte < 0 || punkte > regeln.hart) {
    res.status(400).json({ ok: false, grund: 'punkte' })
    return
  }
  /* Dieselbe Plausibilitaetsregel wie in der echten Aktion, damit im Testlabor
     auch der Fall "nicht gewertet" zu sehen ist. */
  const rohRunden = Math.trunc(Number(b.runden))
  const runden = Number.isFinite(rohRunden) && rohRunden >= 0 ? Math.min(rohRunden, 9999) : null
  const verdacht = laufVerdacht(game, { dauerMs: ticket.dauerMs, punkte, runden }).length > 0

  const beste = { ...stand.beste }
  if (!verdacht && (beste[game] == null || punkte > beste[game])) beste[game] = punkte
  const neu = weiter(stand, { aktiv: true, beste })

  const gesamtPunkte = summe(beste)
  const [gesamtListe, spielListe, heute, rangGesamtranking] = await Promise.all([
    gesamtrangliste(null),
    rangliste(game, null),
    bestesHeute(game),
    gesamtranking(null, beste),
  ])
  const rangGesamt = virtuellerRang(gesamtPunkte, gesamtListe)
  const rangSpiel = virtuellerRang(beste[game], spielListe)

  res.status(200).json({
    ok: true,
    probe: probeErzeugen(neu),
    /* Ehrlich: gespeichert wird im Testmodus nichts. */
    gespeichert: false,
    gewertet: !verdacht,
    punkte,
    beste,
    gesamt: gesamtPunkte || null,
    platz: rangGesamt.platz,
    gelistet: false,
    rang: {
      platz: rangSpiel.platz,
      von: rangSpiel.von,
      bisPlatz: rangSpiel.bisPlatz,
      luecke: rangSpiel.luecke,
      vorMir: rangSpiel.vorMir,
      top10Luecke: rangSpiel.top10Luecke,
      top3Luecke: rangSpiel.top3Luecke,
    },
    heute,
    gesamtranking: rangGesamtranking,
  })
}

/**
 * Wieder-Login im Testmodus.
 *
 * Keine Mail, keine Tabelle, keine Suche nach einer Adresse. Die Antwort ist
 * derselbe neutrale Satz wie draussen — zusaetzlich kommt der Link, den die
 * Testperson sonst per Mail bekaeme, direkt mit: ein signierter Beleg vom Typ
 * 'w', 15 Minuten gueltig. Ein echter Zugangslink hat ein anderes Format und
 * kommt hier nie durch, und umgekehrt.
 */
function probeWiederAnfordern(b, res) {
  const email = clean(b.email, FELD_GRENZEN.email)
  if (!email || !EMAIL_MUSTER.test(email)) {
    res.status(400).json({ ok: false, grund: 'felder', felder: ['email'] })
    return
  }
  res.status(200).json({
    ok: true,
    probe: true,
    meldung: WIEDER_NEUTRAL,
    testLink: belegErzeugen('w', { n: crypto.randomBytes(12).toString('base64url') }),
  })
}

function probeWiederEinloesen(stand, b, res) {
  const link = belegPruefen(clean(b.token, 400), 'w')
  if (!link?.n || link.n === stand.w) {
    res.status(401).json({ ok: false, grund: 'link' })
    return
  }
  const neu = weiter(stand, { aktiv: true, seit: stand.aktiv ? stand.seit : Date.now(), w: link.n })
  res.status(200).json({
    ok: true,
    probe: probeErzeugen(neu),
    sitzung: null,
    teilnehmer: {
      deckel: PROBE_DECKEL,
      instagram: PROBE_HANDLE,
      aktiviertAm: new Date(neu.seit).toISOString(),
      leaderboardOk: neu.leaderboardOk,
      probe: true,
    },
  })
}

async function probeRangliste(res) {
  const [einzeln, gesamt, { spieleAktiv, spieleReihenfolge }, rangGesamt] = await Promise.all([
    Promise.all(SPIEL_SCHLUESSEL.map((game) => rangliste(game, null))),
    gesamtrangliste(null),
    einstellungenLesen(),
    gesamtranking(null),
  ])
  const listen = Object.fromEntries(SPIEL_SCHLUESSEL.map((game, i) => [game, einzeln[i]]))
  res.status(200).json({
    ok: true,
    probe: true,
    listen: { ...listen, gesamt, gesamtranking: rangGesamt },
    spieleAktiv,
    spieleReihenfolge,
  })
}

/**
 * Einwilligung im Testmodus: nur der Beleg aendert sich. Die Testperson
 * steht ohnehin in keiner Liste — an- und abschalten laesst sich trotzdem
 * vollstaendig durchspielen.
 */
function probeEinwilligung(stand, b, res) {
  if (!stand.aktiv) {
    res.status(401).json({ ok: false, grund: 'sitzung' })
    return
  }
  if (typeof b.ok !== 'boolean') {
    res.status(400).json({ ok: false, grund: 'felder' })
    return
  }
  res.status(200).json({ ok: true, probe: probeErzeugen(weiter(stand, { leaderboardOk: b.ok })), leaderboardOk: b.ok })
}

/**
 * Der Einstieg. Gibt true zurueck, wenn die Aktion im Testmodus beantwortet
 * wurde — dann darf der Aufrufer nicht weiterlaufen.
 */
export async function probeBehandeln(aktion, b, res, stand) {
  if (aktion === 'probe-reset') {
    /* Die Testsitzung auf null zuruecksetzen.
       Braucht bewusst keinen Admin-Schluessel: wer hier ankommt, hat bereits
       einen gueltigen Testbeleg vorgelegt — und bekommt dafuer einen
       leeren zurueck. Das gibt niemandem mehr Rechte, als er schon hatte,
       und es wird dabei nichts gelesen und nichts geschrieben. */
    res.status(200).json({ ok: true, probe: probeErzeugen({ aktiv: false }) })
    return true
  }
  if (aktion === 'zustand') {
    await probeZustand(stand, res)
    return true
  }
  if (aktion === 'aktivieren') {
    probeAktivieren(stand, b, res)
    return true
  }
  if (aktion === 'melden') {
    /* Angenommen, nicht gespeichert. Eine Testmeldung darf nie in der
       Verwaltung auftauchen und schon gar nicht neben einer echten Ziehung. */
    res.status(200).json({ ok: true, probe: true, gespeichert: false, nummer: clean(b.deckel, 12) })
    return true
  }
  if (aktion === 'spiel-start') {
    await probeSpielStart(b, res)
    return true
  }
  if (aktion === 'spiel-ende') {
    await probeSpielEnde(stand, b, res)
    return true
  }
  if (aktion === 'rangliste') {
    await probeRangliste(res)
    return true
  }
  if (aktion === 'leaderboard') {
    probeEinwilligung(stand, b, res)
    return true
  }
  if (aktion === 'wieder-anfordern') {
    probeWiederAnfordern(b, res)
    return true
  }
  if (aktion === 'wieder-einloesen') {
    probeWiederEinloesen(stand, b, res)
    return true
  }
  /* 'code' laeuft absichtlich durch die echte Pruefung: der Code soll im
     Testmodus genauso stimmen oder nicht stimmen wie draussen. */
  return false
}
