import { GEWERTETE_GAMES, HAUPTGAMES_ANZAHL, RANGPUNKTE_MAX } from '../src/data/terminal.js'
import {
  KAMPAGNE,
  RANG_LAENGE,
  TABELLE_SCORES,
  TABELLE_TEILNEHMER,
  UUID_MUSTER,
  besteJePerson,
  clean,
  einstellungenSchreiben,
  gemerkt,
  gesamtrankingEinstellungenLesen,
  kopfzeilen,
  lesen,
  namenLesen,
  nurGewertete,
  ohneRankingIds,
  rangSpeicherLeeren,
  rankingBerechtigt,
  restUrl,
  ziehungBerechtigt,
} from './_terminal-kern.js'

/**
 * Das Gesamtranking: die besten VIER Ergebnisse aus SECHS Hauptgames.
 *
 * Eine Wertung fuer die ganze Aktion — keine Wochen, kein Reset. Gerechnet
 * wird ausschliesslich hier im Server und ausschliesslich aus der bestehenden
 * Score-Tabelle (status = 'gueltig'). Es gibt keine zweite Score-Datenbank.
 * Der Client bekommt das Ergebnis; er bestimmt nie, welche vier Spiele zaehlen.
 *
 * DIE FORMEL
 * ----------
 * 1. Je Person und Hauptgame zaehlt nur der beste gueltige Lauf.
 * 2. Je Hauptgame werden alle Personen mit einem solchen Lauf nach Punkten
 *    geordnet. N ist ihre Anzahl. Der Platz ist 1 + die Zahl der Personen mit
 *    ECHT mehr Punkten — Gleichstand teilt sich also den besseren Platz.
 * 3. Rangpunkte = round(1000 × (N − Platz) ÷ (N − 1)).
 *    Platz 1 bekommt 1000, der letzte Platz 0. Ist N = 1, bekommt die eine
 *    Person 1000.
 * 4. Von den hoechstens sechs Rangpunkt-Ergebnissen einer Person zaehlen nur
 *    die BESTEN VIER; die uebrigen werden gestrichen. Gesamtpunkte = Summe
 *    dieser vier, hoechstens 4000.
 * 5. In der Wertung steht, wer mindestens VIER verschiedene Hauptgames mit
 *    einem gueltigen Lauf gespielt hat — welche vier, ist egal. Bei gleichen
 *    Gesamtpunkten gewinnt, wer den Stand frueher erreicht hat: massgeblich
 *    ist der spaeteste der vier GEWERTETEN Bestlaeufe.
 *
 * Warum Raenge statt Rohpunkte: die Games haben voellig verschiedene Skalen
 * (Kuechen-Tinder schafft 10.000, Leitungsfinder 450.000). Rohpunkte zu
 * addieren hiesse, ein einziges Game entscheiden zu lassen.
 *
 * Warum vier aus sechs: sechs Pflichtspiele sind an einem Stadtfestabend zu
 * viel. Vier aus sechs laesst zwei Fehlgriffe zu und belohnt trotzdem, wer
 * mehr spielt — jedes weitere Game kann ein schwaches ersetzen, nie
 * verschlechtern.
 *
 * ABSCHLUSS
 * ---------
 * Die Verwaltung kann das Ranking abschliessen. Dann wird der Stand in
 * videko_terminal_gesamtranking_snapshot eingefroren; ab da gilt nur noch der
 * Snapshot, spaetere Laeufe aendern daran nichts. Die Laeufe selbst bleiben
 * unberuehrt. Wiederoeffnen geht bewusst nur per SQL (Spalte
 * gesamtranking_abgeschlossen_am auf null).
 */

export const TABELLE_GR_SNAPSHOT = 'videko_terminal_gesamtranking_snapshot'
export const TABELLE_GR_PROTOKOLL = 'videko_terminal_gesamtranking_protokoll'

/** Wortlaut der zweiten Bestaetigung, wenn schon gewertet wurde. */
export const HAUPTGAME_BESTAETIGUNG = 'HAUPTGAME WIRKLICH ÄNDERN'

/** So viele Zeilen je Abfrage und hoechstens so viele Seiten je Game. */
const SEITE = 1000
const MAX_SEITEN = 50

/** So viele Personen zeigt die Verwaltung hoechstens — Top 20 plus Umfeld. */
const ADMIN_LAENGE = 200

/** Rangpunkte fuer einen Platz unter N Personen. Siehe Formel oben. */
export function rangpunkte(platz, n) {
  const p = Number(platz)
  const anzahl = Number(n)
  if (!Number.isInteger(p) || !Number.isInteger(anzahl) || p < 1 || anzahl < 1 || p > anzahl) return 0
  if (anzahl === 1) return RANGPUNKTE_MAX
  return Math.round((RANGPUNKTE_MAX * (anzahl - p)) / (anzahl - 1))
}

/**
 * Alle gueltigen Laeufe eines Games, seitenweise. Gibt null zurueck, wenn eine
 * Seite nicht gelesen werden kann — ein halber Datenstand soll nie als ganzer
 * durchgehen, schon gar nicht in einem Snapshot.
 */
async function laeufeAlleLesen(game) {
  const alle = []
  for (let seite = 0; seite < MAX_SEITEN; seite += 1) {
    const antwort = await fetch(
      restUrl(
        `${TABELLE_SCORES}?select=teilnehmer_id,score,created_at`
        + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
        + `&game=eq.${encodeURIComponent(game)}`
        + '&status=eq.gueltig'
        + `&order=created_at.asc,id.asc&limit=${SEITE}&offset=${seite * SEITE}`,
      ),
      { headers: kopfzeilen() },
    )
    if (!antwort.ok) return null
    const zeilen = await antwort.json().catch(() => null)
    if (!Array.isArray(zeilen)) return null
    alle.push(...zeilen)
    if (zeilen.length < SEITE) break
  }
  return alle
}

/**
 * Die besten vier Ergebnisse einer Person auswaehlen.
 *
 * `spiele` ist `{ game: { rangpunkte, wann? } }`. Heraus kommen die Summe der
 * besten vier, die Keys der gewerteten und der gestrichenen Spiele sowie der
 * spaeteste Zeitpunkt UNTER DEN GEWERTETEN — nur der entscheidet den
 * Gleichstand, denn ein gestrichener Lauf zaehlt nirgends.
 *
 * Bei gleichen Rangpunkten kommt das frueher erreichte Ergebnis zuerst in die
 * Wertung; der Spielname entscheidet zuletzt. Das ist reine Bestimmtheit: die
 * Summe ist in dem Fall ohnehin dieselbe.
 */
export function besteViere(spiele) {
  const sortiert = Object.entries(spiele ?? {}).sort(
    (a, b) =>
      (b[1].rangpunkte ?? 0) - (a[1].rangpunkte ?? 0)
      || String(a[1].wann ?? '').localeCompare(String(b[1].wann ?? ''))
      || a[0].localeCompare(b[0]),
  )
  const gewertet = sortiert.slice(0, GEWERTETE_GAMES)
  let gesamt = 0
  let wann = null
  for (const [, w] of gewertet) {
    gesamt += w.rangpunkte ?? 0
    if (w.wann != null && (wann == null || String(w.wann) > String(wann))) wann = w.wann
  }
  return {
    gesamt,
    wann,
    gewertet: gewertet.map(([k]) => k),
    gestrichen: sortiert.slice(GEWERTETE_GAMES).map(([k]) => k),
  }
}

/**
 * Der Kern der Rechnung, ohne Datenbank.
 *
 * `bestJeSpiel` ist `{ game: Map(id -> { punkte, wann }) }`. Heraus kommen die
 * Anzahl je Game und alle Teilnehmer — qualifizierte zuerst, nach
 * Gesamtpunkten geordnet.
 */
export function gesamtrankingRechnen(hauptgames, bestJeSpiel) {
  const anzahl = {}
  const personen = new Map()

  for (const game of hauptgames) {
    const karte = bestJeSpiel[game] ?? new Map()
    const sortiert = [...karte.entries()]
      .map(([id, w]) => ({ id, punkte: w.punkte, wann: w.wann }))
      .sort((a, b) => b.punkte - a.punkte)
    const n = sortiert.length
    anzahl[game] = n

    let platz = 0
    sortiert.forEach((e, i) => {
      if (i === 0 || e.punkte < sortiert[i - 1].punkte) platz = i + 1
      let person = personen.get(e.id)
      if (!person) {
        person = {
          id: e.id,
          gesamt: 0,
          wann: null,
          gespielt: 0,
          qualifiziert: false,
          spiele: {},
          gewertet: [],
          gestrichen: [],
        }
        personen.set(e.id, person)
      }
      person.spiele[game] = { score: e.punkte, platz, rangpunkte: rangpunkte(platz, n), wann: e.wann }
      person.gespielt += 1
    })
  }

  /* Erst wenn ALLE Games durch sind, steht fest, welche vier die besten sind.
     Deshalb wird die Summe nicht in der Schleife aufaddiert. */
  const teilnehmer = [...personen.values()]
  for (const t of teilnehmer) {
    const auswahl = besteViere(t.spiele)
    t.gesamt = auswahl.gesamt
    t.wann = auswahl.wann
    t.gewertet = auswahl.gewertet
    t.gestrichen = auswahl.gestrichen
    t.qualifiziert = t.gespielt >= GEWERTETE_GAMES
  }
  teilnehmer.sort((a, b) => {
    if (a.qualifiziert !== b.qualifiziert) return a.qualifiziert ? -1 : 1
    return (b.gesamt - a.gesamt) || String(a.wann).localeCompare(String(b.wann)) || String(a.id).localeCompare(String(b.id))
  })
  return { anzahl, teilnehmer }
}

/**
 * Live aus den Laeufen rechnen. `streng`: bei einem Lesefehler null statt Luecke.
 *
 * N ist die Zahl ALLER rankingberechtigten Personen mit einem Lauf in diesem
 * Game — egal, ob sie ueber einen Deckel oder ueber eine Einladung
 * hereingekommen sind. Ein eingeladener Mensch verschiebt die Rangpunkte
 * aller anderen genauso wie jeder Deckelbesitzer und kann selbst Platz 1
 * belegen. Das ist so gewollt: es gibt genau ein Ranking.
 *
 * Herausgenommen wird vor dem Zaehlen von N nur, wessen Laeufe ueberhaupt
 * nicht gewertet werden — also wer keinen Instagram-Follow bestaetigt hat.
 *
 * Laesst sich diese Liste nicht lesen, wird gar nicht gerechnet. Lieber kein
 * Ranking als eines, in dem ungewertete Laeufe stecken.
 */
async function liveRechnen(hauptgames, streng = false) {
  const [gesperrt, ...teile] = await Promise.all([
    ohneRankingIds(),
    ...hauptgames.map((g) => laeufeAlleLesen(g)),
  ])
  if (gesperrt == null) return null
  if (streng && teile.some((t) => t == null)) return null
  const bestJeSpiel = {}
  hauptgames.forEach((g, i) => {
    bestJeSpiel[g] = besteJePerson(nurGewertete(teile[i] ?? [], gesperrt))
  })
  return gesamtrankingRechnen(hauptgames, bestJeSpiel)
}

async function snapshotLesen() {
  const zeilen = await lesen(
    `${TABELLE_GR_SNAPSHOT}?select=spiele,daten,erstellt_am`
    + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&order=erstellt_am.desc&limit=1`,
  )
  const z = zeilen[0]
  if (!z || !Array.isArray(z.spiele) || !z.daten || !Array.isArray(z.daten.teilnehmer)) return null
  return z
}

/**
 * Der gueltige Stand: nach dem Abschluss der Snapshot, vorher live. Fehlt der
 * Snapshot trotz Abschluss (sollte nicht vorkommen), wird live gerechnet —
 * lieber ein aktueller Stand als gar keiner.
 */
export async function gesamtrankingDaten() {
  return gemerkt('gr:daten', async () => {
    const einstellungen = await gesamtrankingEinstellungenLesen()
    if (einstellungen.abgeschlossenAm) {
      const snap = await snapshotLesen()
      if (snap) {
        return {
          einstellungen,
          hauptgames: snap.spiele,
          anzahl: snap.daten.anzahl ?? {},
          teilnehmer: snap.daten.teilnehmer,
          abgeschlossen: true,
        }
      }
    }
    /* Ohne Gastliste liefert liveRechnen bewusst nichts. Dann steht hier eine
       leere Wertung — sichtbar unvollstaendig, aber niemals falsch. */
    const { anzahl, teilnehmer } = (await liveRechnen(einstellungen.hauptgames))
      ?? { anzahl: {}, teilnehmer: [] }
    return {
      einstellungen,
      hauptgames: einstellungen.hauptgames,
      anzahl,
      teilnehmer,
      abgeschlossen: Boolean(einstellungen.abgeschlossenAm),
    }
  })
}

const qualifizierte = (d) => d.teilnehmer.filter((t) => t.qualifiziert)

/** Luecke zum naechsten erreichbaren Platz: erster Eintrag mit ECHT mehr Punkten. */
function lueckeNachOben(liste, index, punkte) {
  for (let i = Math.min(index, liste.length) - 1; i >= 0; i -= 1) {
    if (liste[i].gesamt > punkte) return { bisPlatz: i + 1, luecke: liste[i].gesamt - punkte + 1 }
  }
  return { bisPlatz: null, luecke: null }
}

function eigenesAusSpielen(d, spiele, basis) {
  const fehlende = d.hauptgames.filter((g) => spiele[g] == null)
  const gespielt = d.hauptgames.length - fehlende.length
  const auswahl = besteViere(spiele)
  const gewertet = new Set(auswahl.gewertet)
  return {
    spiele: d.hauptgames.map((g) => ({
      key: g,
      score: spiele[g]?.score ?? null,
      platz: spiele[g]?.platz ?? null,
      von: spiele[g]?.von ?? d.anzahl[g] ?? 0,
      rangpunkte: spiele[g]?.rangpunkte ?? 0,
      /* Welche vier zaehlen, entscheidet der Server. Der Client zeigt es nur an. */
      gewertet: gewertet.has(g),
    })),
    gespielt,
    /* `noetig` ist die Huerde (vier), nicht die Zahl der Spiele (sechs). */
    noetig: GEWERTETE_GAMES,
    fehlt: Math.max(0, GEWERTETE_GAMES - gespielt),
    qualifiziert: gespielt >= GEWERTETE_GAMES,
    gewertet: auswahl.gewertet,
    gestrichen: auswahl.gestrichen,
    fehlende,
    max: GEWERTETE_GAMES * RANGPUNKTE_MAX,
    abgeschlossen: d.abgeschlossen,
    ...basis,
  }
}

/** Der eigene Stand einer echten Person. */
export function eigenesBerechnen(d, id) {
  const quali = qualifizierte(d)
  const t = d.teilnehmer.find((x) => x.id === id) ?? null
  const spiele = {}
  for (const g of d.hauptgames) {
    if (t?.spiele?.[g]) spiele[g] = { ...t.spiele[g], von: d.anzahl[g] ?? 0 }
  }
  const index = t?.qualifiziert ? quali.findIndex((x) => x.id === id) : -1
  const punkte = t ? t.gesamt : 0
  return eigenesAusSpielen(d, spiele, {
    platz: index >= 0 ? index + 1 : null,
    punkte: t?.qualifiziert ? punkte : null,
    zwischenstand: punkte,
    von: quali.length,
    ...(index > 0 ? lueckeNachOben(quali, index, punkte) : { bisPlatz: null, luecke: null }),
  })
}

/**
 * Wo eine virtuelle Person (Testlabor) mit diesen Bestwerten stehen WUERDE.
 * Sie wird rechnerisch eingefuegt; die echte Liste bleibt unberuehrt.
 */
export function eigenesVirtuell(d, beste) {
  const spiele = {}
  for (const g of d.hauptgames) {
    if (beste?.[g] == null) continue
    const wert = Number(beste[g])
    if (!Number.isFinite(wert) || wert < 0) continue
    const besser = d.teilnehmer.filter((t) => (t.spiele?.[g]?.score ?? -1) > wert).length
    const platz = besser + 1
    const von = (d.anzahl[g] ?? 0) + 1
    spiele[g] = { score: wert, platz, von, rangpunkte: rangpunkte(platz, von) }
  }
  const summe = besteViere(spiele).gesamt
  const quali = qualifizierte(d)
  const qualifiziert = Object.keys(spiele).length >= GEWERTETE_GAMES
  /* Bei Gleichstand steht die virtuelle Person hinten — sie hat den Stand
     "gerade eben" erreicht. */
  const index = qualifiziert ? quali.filter((t) => t.gesamt >= summe).length : -1
  return eigenesAusSpielen(d, spiele, {
    platz: qualifiziert ? index + 1 : null,
    punkte: qualifiziert ? summe : null,
    zwischenstand: summe,
    von: quali.length + (qualifiziert ? 1 : 0),
    ...(qualifiziert && index > 0 ? lueckeNachOben(quali, index, summe) : { bisPlatz: null, luecke: null }),
  })
}

/**
 * Die oeffentliche Liste plus — nur mit eigener id — der eigene Stand.
 *
 * Die Plaetze sind die ECHTEN Plaetze unter allen Qualifizierten. Wer der
 * Veroeffentlichung nicht zugestimmt hat, steht mit `instagram: null` in der
 * Liste — sonst wuerden die Preisplaetze oeffentlich falsch aussehen. Keine
 * id, keine E-Mail, keine Deckelnummer verlaesst diese Funktion.
 *
 * `virtuell` (Testlabor): Bestwerte einer Person, die es nicht gibt.
 */
export async function gesamtranking(eigeneId = null, virtuell = null) {
  const d = await gesamtrankingDaten()
  const quali = qualifizierte(d)
  const top = quali.slice(0, RANG_LAENGE)
  const namen = await namenLesen(top.map((t) => t.id))

  let eigen = null
  let einwilligung = false
  if (virtuell) {
    eigen = eigenesVirtuell(d, virtuell)
  } else if (eigeneId && UUID_MUSTER.test(String(eigeneId))) {
    eigen = eigenesBerechnen(d, eigeneId)
    einwilligung = namen.has(eigeneId) || (await namenLesen([eigeneId])).has(eigeneId)
  }

  return {
    eintraege: top.map((t, i) => ({
      platz: i + 1,
      instagram: namen.get(t.id) ?? null,
      punkte: t.gesamt,
      /* Welche vier gewertet wurden — Spielnamen, sonst nichts. Keine Scores,
         keine Plaetze anderer Leute, keine Kennung. */
      gewertet: Array.isArray(t.gewertet) ? t.gewertet : [],
      ich: eigeneId ? t.id === eigeneId : false,
    })),
    gesamtZahl: quali.length,
    spiele: d.hauptgames,
    gewerteteGames: GEWERTETE_GAMES,
    maxPunkte: GEWERTETE_GAMES * RANGPUNKTE_MAX,
    preise: d.einstellungen.preise,
    abgeschlossen: d.abgeschlossen,
    abgeschlossenAm: d.einstellungen.abgeschlossenAm,
    eigenerPlatz: eigen?.platz ?? null,
    eigenePunkte: eigen?.punkte ?? null,
    /* Oeffentlich mit Namen steht nur, wer qualifiziert ist UND zugestimmt hat. */
    gelistet: Boolean(eigen?.qualifiziert && einwilligung && !virtuell),
    eigen: eigen ? { ...eigen, oeffentlich: einwilligung && !virtuell, probe: Boolean(virtuell) } : null,
  }
}

/**
 * Der Tresorkoenig: die Spitze des Gesamtrankings.
 *
 * Bewusst oeffentlich und ohne Beleg — er steht in jeder Zustandsantwort, auch
 * bevor jemand aktiviert hat. Oeffentlich ist daran nur, was die Person dafuer
 * freigegeben hat: Instagram-Name und Punktzahl. Wer nicht zugestimmt hat,
 * steht ohne Namen in der Liste; wer nicht qualifiziert ist, gar nicht.
 *
 * Die alte Summe aus Truhenknacker und Goldrausch (`tresorkoenig()` im Kern)
 * bleibt unveraendert bestehen, wird hier aber nicht mehr gelesen.
 */
export async function tresorkoenigGesamt() {
  const { eintraege } = await gesamtranking(null)
  return eintraege[0] ?? null
}

/* ------------------------------------------------------------------ */
/* Verwaltung                                                          */
/* ------------------------------------------------------------------ */

/**
 * Abschliessen: Snapshot schreiben, dann den Zeitpunkt setzen.
 *
 * Die Reihenfolge ist Absicht. Scheitert der Snapshot, bleibt das Ranking
 * offen und nichts ist verloren. Scheitert erst der Zeitpunkt, liegt ein
 * Snapshot ungenutzt in der Tabelle — beim naechsten Versuch entsteht ein
 * neuerer, und gelesen wird immer der neueste.
 */
export async function gesamtrankingAbschliessen() {
  const einstellungen = await gesamtrankingEinstellungenLesen()
  if (einstellungen.abgeschlossenAm) return { ok: false, grund: 'abgeschlossen', status: 409 }

  const stand = await liveRechnen(einstellungen.hauptgames, true)
  if (!stand) return { ok: false, grund: 'server', status: 500 }

  const jetzt = new Date().toISOString()
  const snapshot = await fetch(restUrl(TABELLE_GR_SNAPSHOT), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=minimal' }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      erstellt_am: jetzt,
      spiele: einstellungen.hauptgames,
      /* Nur ids, Punkte und Plaetze. Keine E-Mail, keine Deckelnummer. */
      daten: { anzahl: stand.anzahl, teilnehmer: stand.teilnehmer },
    }),
  })
  if (!snapshot.ok) return { ok: false, grund: 'server', status: 500 }

  const gesetzt = await einstellungenSchreiben({ gesamtranking_abgeschlossen_am: jetzt })
  rangSpeicherLeeren()
  if (!gesetzt) return { ok: false, grund: 'server', status: 500 }
  return { ok: true, abgeschlossenAm: jetzt, qualifiziert: stand.teilnehmer.filter((t) => t.qualifiziert).length }
}

/**
 * Wie viele Personen haben schon einen gueltigen Run in mindestens einem der
 * Hauptgames? null, wenn das nicht sicher gelesen werden kann — der Aufrufer
 * behandelt das wie "es gibt Daten".
 */
export async function grTeilnehmerZahl(hauptgames) {
  const stand = await liveRechnen(hauptgames, true)
  return stand ? stand.teilnehmer.length : null
}

/**
 * Jede Aenderung der Hauptgames landet im Protokoll — vor dem Speichern.
 * Scheitert das Protokoll, wird nicht gespeichert.
 */
export async function hauptgamesProtokollieren({ vorher, nachher, teilnehmerZahl, bestaetigt }) {
  const antwort = await fetch(restUrl(TABELLE_GR_PROTOKOLL), {
    method: 'POST',
    headers: kopfzeilen({ Prefer: 'return=minimal' }),
    body: JSON.stringify({
      kampagne: KAMPAGNE,
      art: 'hauptgames',
      vorher,
      nachher,
      teilnehmer_zahl: teilnehmerZahl,
      bestaetigt,
    }),
  })
  return antwort.ok
}

/** Kleinbuchstaben ohne Leerraum — nur fuer den Vergleich, nie fuer eine Ausgabe. */
const vergleichswert = (s) => clean(s, 200).toLowerCase().replace(/^@/, '')

/**
 * Hinweis „ein Preis pro Person": teilen sich zwei der Top 3 E-Mail oder
 * Instagram-Namen? Verglichen wird im Server; heraus kommen nur die Plaetze
 * und die Art der Uebereinstimmung — nie die Adresse selbst.
 */
export function doppelteTop3(top3) {
  const hinweise = []
  for (let i = 0; i < top3.length; i += 1) {
    for (let j = i + 1; j < top3.length; j += 1) {
      const a = top3[i]
      const b = top3[j]
      if (a.email && a.email === b.email) hinweise.push({ plaetze: [i + 1, j + 1], art: 'gleiche E-Mail' })
      if (a.instagram && a.instagram === b.instagram) hinweise.push({ plaetze: [i + 1, j + 1], art: 'gleicher Instagram-Name' })
    }
  }
  return hinweise
}

/**
 * Admin-Ansicht: Top 20 mit Namen (auch ohne Einwilligung, gekennzeichnet),
 * Werte je Game, verdaechtige und verworfene Laeufe dieser Personen in den
 * Hauptgames und der Doppelt-Hinweis fuer die Top 3.
 */
export async function gesamtrankingAdmin() {
  rangSpeicherLeeren()
  const d = await gesamtrankingDaten()
  const quali = qualifizierte(d)
  const top = quali.slice(0, RANG_LAENGE)
  /* Die Verwaltung sieht auch, wer noch nicht qualifiziert ist — sonst fehlt
     genau die Gruppe, bei der man wissen will, woran es haengt. */
  const alleRoh = d.teilnehmer.slice(0, ADMIN_LAENGE)
  const ids = alleRoh.map((t) => t.id).filter((id) => UUID_MUSTER.test(String(id)))

  let personen = []
  let laeufe = []
  if (ids.length) {
    ;[personen, laeufe] = await Promise.all([
      lesen(
        `${TABELLE_TEILNEHMER}?select=id,instagram_handle,leaderboard_ok,email,deckel_nummer,`
        + 'anspruch_art,besitz_status,registrierungsquelle,folgt_bestaetigt_von_nutzer,'
        + 'folgt_pruefstatus,folgt_geprueft_am'
        + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}&id=in.(${ids.join(',')})`,
      ),
      lesen(
        `${TABELLE_SCORES}?select=id,teilnehmer_id,game,score,status,notiz,dauer_ms,created_at`
        + `&kampagne=eq.${encodeURIComponent(KAMPAGNE)}`
        + `&teilnehmer_id=in.(${ids.join(',')})`
        + `&game=in.(${d.hauptgames.map(encodeURIComponent).join(',')})`
        + '&status=in.(verdacht,verworfen)&order=created_at.desc&limit=200',
      ),
    ])
  }

  const nachId = new Map(personen.map((p) => [p.id, p]))
  const platzNachId = new Map(quali.map((t, i) => [t.id, i + 1]))

  /* Eine Zeile der Verwaltungsliste. Die drei Berechtigungen stehen
     nebeneinander und werden nicht vermischt: das Game-Ranking haengt allein
     an den Spielen, `deckel` ist reine Anzeige. */
  const adminZeile = (t) => {
    const p = nachId.get(t.id)
    return {
      platz: platzNachId.get(t.id) ?? null,
      instagram: clean(p?.instagram_handle, 40) || null,
      oeffentlich: p?.leaderboard_ok === true,
      punkte: t.gesamt,
      wann: t.wann,
      gespielt: t.gespielt,
      qualifiziert: t.qualifiziert === true,
      fehlt: Math.max(0, GEWERTETE_GAMES - (t.gespielt ?? 0)),
      gewertet: Array.isArray(t.gewertet) ? t.gewertet : [],
      gestrichen: Array.isArray(t.gestrichen) ? t.gestrichen : [],
      spiele: Object.fromEntries(d.hauptgames.map((g) => [g, t.spiele[g] ?? null])),
      rankingBerechtigt: rankingBerechtigt(p),
      folgtBestaetigt: p?.folgt_bestaetigt_von_nutzer === true,
      /* Nur ob ueberhaupt einer da ist — die Nummer steht allein im Pruefblatt. */
      deckel: p?.deckel_nummer != null,
    }
  }

  const liste = top.map(adminZeile)
  const alle = alleRoh.map(adminZeile)

  const doppelt = doppelteTop3(
    top.slice(0, 3).map((t) => {
      const p = nachId.get(t.id)
      return { email: vergleichswert(p?.email), instagram: vergleichswert(p?.instagram_handle) }
    }),
  )

  const verdacht = laeufe.map((l) => ({
    id: l.id,
    teilnehmerId: l.teilnehmer_id,
    platz: platzNachId.get(l.teilnehmer_id) ?? null,
    instagram: clean(nachId.get(l.teilnehmer_id)?.instagram_handle, 40) || null,
    game: l.game,
    score: l.score,
    status: l.status,
    notiz: l.notiz ?? null,
    dauerMs: l.dauer_ms ?? null,
    wann: l.created_at,
  }))

  /* Pruefblatt fuer Platz 1 bis 3 vor der Preisvergabe. Nur hier, hinter der
     Admin-Anmeldung, steht die Deckelnummer — oeffentlich nie. Es wird nichts
     automatisch disqualifiziert; das Blatt sammelt nur, was zu pruefen ist.

     Zwei Berechtigungen stehen nebeneinander und werden nicht vermischt:
     `spielpreis` haengt allein am Instagram-Follow, `ziehung` allein am
     Deckel. Ein eingeladener Mensch kann hier auf Platz 1 stehen und den
     Spielpreis bekommen, ohne je in der Deckelziehung zu sein. */
  const pruefung = top.slice(0, 3).map((t, i) => {
    const p = nachId.get(t.id)
    const platz = i + 1
    return {
      platz,
      instagram: clean(p?.instagram_handle, 40) || null,
      oeffentlich: p?.leaderboard_ok === true,
      punkte: t.gesamt,
      gewertet: Array.isArray(t.gewertet) ? t.gewertet : [],
      gestrichen: Array.isArray(t.gestrichen) ? t.gestrichen : [],
      spiele: d.hauptgames.map((g) => ({
        key: g,
        score: t.spiele[g]?.score ?? null,
        platz: t.spiele[g]?.platz ?? null,
        rangpunkte: t.spiele[g]?.rangpunkte ?? null,
        gewertet: Array.isArray(t.gewertet) ? t.gewertet.includes(g) : false,
      })),
      verdacht: verdacht
        .filter((v) => v.teilnehmerId === t.id)
        .map(({ id, game, score, status, notiz, dauerMs, wann }) => ({ id, game, score, status, notiz, dauerMs, wann })),
      doppelt: doppelt
        .filter((h) => h.plaetze.includes(platz))
        .map((h) => ({ mitPlatz: h.plaetze.find((x) => x !== platz), art: h.art })),
      deckel: p?.deckel_nummer ?? null,
      anspruchArt: p?.anspruch_art ?? null,
      besitzStatus: p?.besitz_status ?? null,
      /* Woher der Mensch kam — aendert an der Preisberechtigung nichts,
         beantwortet aber die erste Rueckfrage jeder Pruefung. */
      quelle: p?.registrierungsquelle ?? 'deckel',
      /* Selbstauskunft. Nie als Pruefung ausgegeben. */
      folgtBestaetigt: p?.folgt_bestaetigt_von_nutzer === true,
      /* Stand der Pruefung von Hand: 'offen' | 'bestaetigt' | 'abgelehnt'. */
      folgtPruefstatus: p?.folgt_pruefstatus ?? 'offen',
      folgtGeprueftAm: p?.folgt_geprueft_am ?? null,
      /* Preis aus dem Spiel: haengt am Instagram-Follow, nicht am Deckel. */
      spielpreisBerechtigt: rankingBerechtigt(p),
      /* Grosse Deckelziehung: haengt allein am Deckel. */
      ziehungBerechtigt: ziehungBerechtigt(p),
    }
  })

  return {
    ok: true,
    hauptgames: d.hauptgames,
    testslot: d.einstellungen.testslot,
    preise: d.einstellungen.preise,
    abgeschlossen: d.abgeschlossen,
    abgeschlossenAm: d.einstellungen.abgeschlossenAm,
    gesamtZahl: quali.length,
    teilnehmerZahl: d.teilnehmer.length,
    anzahl: d.anzahl,
    gewerteteGames: GEWERTETE_GAMES,
    maxPunkte: GEWERTETE_GAMES * RANGPUNKTE_MAX,
    top: liste,
    alle,
    /* Die interne teilnehmerId faellt heraus: die Admin-Antwort nennt nur den
       Platz und den Lauf, nie eine Kennung, ueber die sich eine Person
       zuordnen laesst. */
    verdacht: verdacht.map((v) => {
      const kopie = { ...v }
      delete kopie.teilnehmerId
      return kopie
    }),
    doppelt,
    pruefung,
  }
}

export { GEWERTETE_GAMES, HAUPTGAMES_ANZAHL }
