/**
 * Serverseitige Pruefung des Terminals gegen die echte Produktionsdomain.
 *
 * WARUM DAS NICHT LOKAL GEHT
 * --------------------------
 * Spiellogik, Betrugsschutz und Rangliste leben in api/terminal.js — einer
 * Vercel-Function. Lokal gibt es dafuer keinen Server (kein `vercel dev`,
 * kein localhost), und ein Stub wuerde nur sich selbst bestaetigen. Genau die
 * Zusagen, die zaehlen — Laufticket einmalig, Punktzahl plausibel, Bestwert
 * wird nicht verschlechtert, keine privaten Daten in oeffentlichen Antworten —
 * kann deshalb nur dieser Lauf belegen.
 *
 * DER LAUF SCHREIBT IN DIE PRODUKTIONSDATENBANK.
 * Er benutzt dafuer ausschliesslich die Deckelnummern aus TEST_DECKEL und
 * nennt am Ende, was aufgeraeumt werden muss. Echte Teilnehmer fasst er nicht
 * an und loescht nichts.
 *
 * Aufruf: node scripts/terminal-live-test.mjs [basis-url]
 */
import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { GESAMT_SPIELE } from '../src/data/terminal.js'
import { SPIELE } from '../api/_terminal-kern.js'

const BASIS = process.argv[2] || 'https://videko-kuechen.de'

/* Raetselcode und Verwaltungsschluessel stehen in .env.local und werden nie
   ausgegeben — auch nicht in Fehlermeldungen. */
const env = readFileSync('.env.local', 'utf8')
const lies = (name) => (new RegExp(`^${name}=(.*)$`, 'm').exec(env)?.[1] || '').trim()
const CODE = lies('TERMINAL_CODE')
const ADMIN = lies('TERMINAL_ADMIN_TOKEN')
if (!CODE) throw new Error('TERMINAL_CODE fehlt in .env.local')

/* Zwei Testteilnehmer: einer mit Einwilligung in die Rangliste, einer ohne.
   Hohe Nummern, damit sie von echten Deckeln unterscheidbar bleiben. */
const TEST_DECKEL = { mit: 4998, ohne: 4999 }
const NAME = { mit: 'zz_pruefung_mit', ohne: 'zz_pruefung_ohne' }
const MAIL = { mit: 'pruefung.mit@videko-test.invalid', ohne: 'pruefung.ohne@videko-test.invalid' }

/* Der Server verlangt mindestens die halbe Spielzeit (DAUER_ANTEIL 0.5 von
   30 s). 17 s liegen sicher darueber, ohne den Lauf unnoetig zu verlaengern. */
/* 21 s: KÜCHEN-CRUSH laeuft 40 s, die Mindestdauer ist die Haelfte. */
const SPIELZEIT_MS = 21000

const ergebnisse = []
function pruefe(name, ok, notiz = '') {
  ergebnisse.push({ name, ok: Boolean(ok) })
  console.log(`  ${ok ? 'OK  ' : 'FEHL'} ${name}${notiz ? ` — ${notiz}` : ''}`)
}
const warte = (ms) => new Promise((r) => setTimeout(r, ms))

async function ruf(koerper, pfad = '/api/terminal', kopf = {}) {
  const antwort = await fetch(`${BASIS}${pfad}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...kopf },
    body: JSON.stringify(koerper),
  })
  let daten = null
  try {
    daten = await antwort.json()
  } catch {
    daten = null
  }
  return { status: antwort.status, daten }
}

/* ================================================================== */
console.log('\n=== 1. Code und Zugang ===')

const falsch = await ruf({ aktion: 'code', code: 'ZZZZZZZZ' })
pruefe('Falscher Code liefert keinen Zugang', falsch.daten?.ok === true && falsch.daten.zugang === null)

const richtig = await ruf({ aktion: 'code', code: CODE })
const zugang = richtig.daten?.zugang
pruefe('Richtiger Code liefert einen signierten Beleg', typeof zugang === 'string' && zugang.startsWith('v1.'))
pruefe('Der Beleg enthaelt den Code nicht im Klartext', typeof zugang === 'string' && !zugang.includes(CODE))

const gefaelscht = await ruf({ aktion: 'spiel-start', sitzung: 'v1.eyJpZCI6ImZyZWkifQ.xxx', game: 'goldrausch' })
pruefe('Gefaelschte Sitzung wird abgewiesen', gefaelscht.status === 401,
  `HTTP ${gefaelscht.status} ${gefaelscht.daten?.grund || ''}`)

const ohneZugang = await ruf({
  aktion: 'aktivieren', deckel: 4997, instagram: 'zz_x', email: 'x@videko-test.invalid', folgt: true,
})
pruefe('Aktivieren ohne gueltigen Zugangsbeleg wird abgewiesen', ohneZugang.status === 401,
  `HTTP ${ohneZugang.status} ${ohneZugang.daten?.grund || ''}`)

/* ================================================================== */
console.log('\n=== 2. Aktivierung (zwei Testdeckel) ===')

const sitzungen = {}
for (const art of ['mit', 'ohne']) {
  const a = await ruf({
    aktion: 'aktivieren',
    zugang,
    deckel: TEST_DECKEL[art],
    instagram: NAME[art],
    email: MAIL[art],
    folgt: true,
    leaderboard: art === 'mit',
  })
  sitzungen[art] = a.daten?.sitzung
  pruefe(`Deckel ${TEST_DECKEL[art]} aktiviert (Einwilligung: ${art === 'mit' ? 'ja' : 'nein'})`,
    a.daten?.ok === true && typeof a.daten.sitzung === 'string',
    `HTTP ${a.status} ${a.daten?.grund || ''}${a.daten?.felder ? ' ' + a.daten.felder.join(',') : ''}`)
  pruefe(`Antwort zu Deckel ${TEST_DECKEL[art]} enthaelt keine E-Mail`,
    !JSON.stringify(a.daten || {}).includes('videko-test.invalid'))
}

if (!sitzungen.mit || !sitzungen.ohne) {
  console.log('\nABBRUCH: ohne Sitzungen sind die weiteren Pruefungen sinnlos.')
  console.log(`Gepruft: ${ergebnisse.length} · fehlgeschlagen: ${ergebnisse.filter((e) => !e.ok).length}`)
  process.exit(1)
}

const doppelt = await ruf({
  aktion: 'aktivieren', zugang, deckel: TEST_DECKEL.mit,
  instagram: 'zz_pruefung_doppelt', email: 'doppelt@videko-test.invalid', folgt: true, leaderboard: true,
})
/* Zwei Sperren koennen hier greifen, und beide sind richtig: 409 "doppelt" vom
   UNIQUE-Index auf (kampagne, deckel_nummer) oder 429 "bremse" von der
   Schreibbremse pro IP. Laeuft dieser Test zweimal innerhalb von zehn Minuten,
   ist die Bremse schneller — die Aktivierung kommt dann gar nicht erst bis zur
   Doppelpruefung. Entscheidend ist, dass die Nummer kein zweites Mal
   durchgeht. */
pruefe('Dieselbe Deckelnummer laesst sich nicht zweimal aktivieren',
  doppelt.daten?.ok !== true && [409, 429].includes(doppelt.status),
  `HTTP ${doppelt.status} ${doppelt.daten?.grund || ''}`)

const ohneHaken = await ruf({
  aktion: 'aktivieren', zugang, deckel: 4996,
  instagram: 'zz_pruefung_ohne_haken', email: 'haken@videko-test.invalid', folgt: false, leaderboard: false,
})
pruefe('Ohne Follower-Bestaetigung keine Aktivierung',
  ohneHaken.status === 400 && ohneHaken.daten?.felder?.includes('folgt'),
  `HTTP ${ohneHaken.status} ${JSON.stringify(ohneHaken.daten?.felder || null)}`)

/* ================================================================== */
console.log('\n=== 3. Unbekanntes Spiel ===')

const fremdesSpiel = await ruf({ aktion: 'spiel-start', sitzung: sitzungen.mit, game: 'schachspiel' })
pruefe('Unbekanntes Spiel wird abgewiesen', fremdesSpiel.status === 400 && fremdesSpiel.daten?.grund === 'spiel',
  `HTTP ${fremdesSpiel.status} ${fremdesSpiel.daten?.grund || ''}`)

/* ================================================================== */
console.log('\n=== 4. Tickets holen und die Spielzeit abwarten ===')

/* Jedes Ticket traegt seinen eigenen Startzeitpunkt. Die Tickets werden
   deshalb gemeinsam geholt und nach einem einzigen Warten in der gewuenschten
   Reihenfolge eingeloest — sonst dauert der Lauf sieben Mal so lange. */
async function ticket(art, game) {
  const s = await ruf({ aktion: 'spiel-start', sitzung: sitzungen[art], game })
  return { ticket: s.daten?.ticket, dauerMs: s.daten?.dauerMs, status: s.status, grund: s.daten?.grund }
}

const tk = {
  a: await ticket('mit', 'truhenknacker'),
  c: await ticket('mit', 'truhenknacker'),
  d: await ticket('mit', 'truhenknacker'),
  e: await ticket('mit', 'truhenknacker'),
  f: await ticket('mit', 'truhenknacker'),
}
const gr = {
  mit: await ticket('mit', 'goldrausch'),
  ohne: await ticket('ohne', 'goldrausch'),
  kurz: await ticket('mit', 'goldrausch'),
}
/* 2.3: die beiden Endlosspiele. Auch ihre Tickets laufen durch dasselbe
   Warten — die Mindestdauer haengt dort an Modulen bzw. Metern. */
const neu = {
  stack: await ticket('mit', 'kuechen_stack'),
  stackBetrug: await ticket('mit', 'kuechen_stack'),
  stackHart: await ticket('mit', 'kuechen_stack'),
  dash: await ticket('mit', 'kuechen_dash'),
  dashBetrug: await ticket('mit', 'kuechen_dash'),
}
/* Game-Lab: die sieben Kandidaten. Je Spiel ein plausibler Lauf, ein Lauf
   mit mehr Punkten als seine Aktionen hergeben, und einer ueber der harten
   Grenze. Die Grenzen kommen direkt aus dem Server-Kern — derselbe Stand, der
   deployt wurde. */
const LAB = Object.keys(SPIELE).filter((g) => !GESAMT_SPIELE.includes(g)
  && g !== 'kuechen_stack' && g !== 'kuechen_dash')
const labTk = {}
for (const g of LAB) {
  labTk[g] = {
    gut: await ticket('mit', g),
    betrug: await ticket('mit', g),
    hart: await ticket('mit', g),
  }
}
/** Ein Lauf, der in 15 s unter allen Grenzen des Spiels bleibt. */
function labLauf(g) {
  const r = SPIELE[g]
  const runden = Math.max(1, Math.min(40, Math.floor(15000 / (r.msJeRunde || 500))))
  const obergrenze = Math.min(runden * (r.maxJeRunde || r.plausibel), r.plausibel)
  return { runden, score: Math.max(1, Math.floor(obergrenze / 2)) }
}

pruefe('Laufticket wird ausgegeben', typeof tk.a.ticket === 'string' && tk.a.ticket.length > 10)
pruefe('Die Spielzeit gibt der Server vor', Number(tk.a.dauerMs) === 30000, `${tk.a.dauerMs} ms`)
pruefe('Jedes Ticket ist ein eigenes', new Set(Object.values(tk).map((t) => t.ticket)).size === 5)

/* Zuerst das, was ohne Wartezeit geprueft werden muss: ein Lauf, der sofort
   abgegeben wird, ist zu schnell, um echt zu sein. */
const sofort = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'goldrausch', ticket: gr.kurz.ticket, score: 5000, runden: 9,
})
pruefe('Ein Lauf ohne Spielzeit wird gespeichert, aber nicht gewertet',
  sofort.daten?.gespeichert === true && sofort.daten?.gewertet === false,
  `gespeichert=${sofort.daten?.gespeichert} gewertet=${sofort.daten?.gewertet}`)

console.log(`  … ${SPIELZEIT_MS / 1000} s spielen (die Mindestdauer prueft der Server)`)
await warte(SPIELZEIT_MS)

/* ================================================================== */
console.log('\n=== 5. Gueltiger Lauf, Bestwert, Historie ===')

const endeA = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'truhenknacker', ticket: tk.a.ticket, score: 8900, runden: 14,
})
pruefe('Gueltige Punktzahl wird gespeichert', endeA.daten?.gespeichert === true,
  `HTTP ${endeA.status} ${endeA.daten?.grund || ''}`)
pruefe('Gueltige Punktzahl wird gewertet', endeA.daten?.gewertet === true)
pruefe('Bestwert steht in der Antwort', Number(endeA.daten?.beste?.truhenknacker) === 8900,
  JSON.stringify(endeA.daten?.beste))

const nochmal = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'truhenknacker', ticket: tk.a.ticket, score: 8900, runden: 14,
})
pruefe('Dasselbe Laufticket zaehlt nicht zweimal', nochmal.status === 409 && nochmal.daten?.grund === 'doppelt',
  `HTTP ${nochmal.status} ${nochmal.daten?.grund || ''}`)

const besser = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'truhenknacker', ticket: tk.c.ticket, score: 14820, runden: 21,
})
pruefe('Besserer Lauf hebt den Bestwert', Number(besser.daten?.beste?.truhenknacker) === 14820,
  JSON.stringify(besser.daten?.beste))

const schlechter = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'truhenknacker', ticket: tk.d.ticket, score: 3200, runden: 6,
})
pruefe('Schwaecherer Lauf verschlechtert den Bestwert nicht',
  Number(schlechter.daten?.beste?.truhenknacker) === 14820, JSON.stringify(schlechter.daten?.beste))
pruefe('Der schwaechere Lauf wird trotzdem gespeichert (Historie)', schlechter.daten?.gespeichert === true)

/* Der eigene Rang direkt nach der Runde. Die Spielkarte setzt daraus
   "PLATZ 7 VON 143" und "NOCH 1.420 PUNKTE BIS PLATZ 5" zusammen. Gerechnet
   wird das ausschliesslich hier auf dem Server — der Browser bekommt fertige
   Zahlen und kann sich keine eigenen ausdenken. */
const rang = besser.daten?.rang || {}
pruefe('Eigener Platz kommt mit der Runde zurueck', Number(rang.platz) > 0, `#${rang.platz}`)
pruefe('Die Teilnehmerzahl dahinter ist mindestens der eigene Platz',
  Number(rang.von) >= Number(rang.platz), `${rang.platz} von ${rang.von}`)
pruefe('Zielplatz und Luecke stehen oder fehlen gemeinsam',
  (rang.bisPlatz == null) === (rang.luecke == null), `bisPlatz=${rang.bisPlatz} luecke=${rang.luecke}`)
/* Bei Gleichstand gewinnt der frueher erreichte Stand. Deshalb muss der
   Abstand mindestens ein Punkt sein — "noch 0 Punkte" waere gelogen. */
pruefe('Der Abstand nach oben ist mindestens ein Punkt',
  rang.luecke == null || Number(rang.luecke) >= 1, `${rang.luecke}`)
pruefe('Der genannte Zielplatz liegt wirklich ueber dem eigenen',
  rang.bisPlatz == null || Number(rang.bisPlatz) < Number(rang.platz),
  `${rang.bisPlatz} vor ${rang.platz}`)

/* BESTER HEUTE. Der Lauf von eben ist von heute, also muss er mindestens so
   hoch liegen. */
const heute = besser.daten?.heute
pruefe('Bester heutiger Lauf kommt mit', heute != null && Number.isFinite(Number(heute.punkte)),
  JSON.stringify(heute))
pruefe('Der eigene Lauf steckt darin', heute != null && Number(heute.punkte) >= 14820, `${heute?.punkte}`)
pruefe('BESTER HEUTE gibt nur Punkte und Namen preis',
  heute != null && Object.keys(heute).sort().join(',') === 'instagram,punkte',
  Object.keys(heute || {}).join(','))

/* ================================================================== */
console.log('\n=== 6. Betrugsschutz ===')

const riesig = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'truhenknacker', ticket: tk.e.ticket, score: 999999999, runden: 3,
})
pruefe('score 999999999 wird abgewiesen', riesig.status === 400 && riesig.daten?.grund === 'punkte',
  `HTTP ${riesig.status} ${riesig.daten?.grund || ''}`)

/* Eine Punktzahl dicht unter der harten Grenze kommt durch die
   Eingangspruefung, ist aber in 30 Sekunden Truhenknacker nicht erreichbar
   (plausibel: 45.000). Sie darf gespeichert, aber nicht gewertet werden. */
const unplausibel = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'truhenknacker', ticket: tk.f.ticket, score: 90000, runden: 400,
})
pruefe('Unerreichbare Punktzahl wird gespeichert, aber nicht gewertet',
  unplausibel.daten?.gespeichert === true && unplausibel.daten?.gewertet === false,
  `gespeichert=${unplausibel.daten?.gespeichert} gewertet=${unplausibel.daten?.gewertet}`)
pruefe('Die unerreichbare Punktzahl landet in keinem Bestwert',
  Number(unplausibel.daten?.beste?.truhenknacker) === 14820, JSON.stringify(unplausibel.daten?.beste))

const erfunden = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'goldrausch', ticket: 'v1.frei.erfunden', score: 12000, runden: 20,
})
pruefe('Ein erfundenes Ticket wird abgewiesen', erfunden.status === 401 && erfunden.daten?.grund === 'ticket',
  `HTTP ${erfunden.status} ${erfunden.daten?.grund || ''}`)

const fremdesTicket = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.ohne, game: 'goldrausch', ticket: gr.mit.ticket, score: 12000, runden: 20,
})
pruefe('Ein Ticket einer anderen Person wird abgewiesen', fremdesTicket.status === 401,
  `HTTP ${fremdesTicket.status} ${fremdesTicket.daten?.grund || ''}`)

const falschesSpiel = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'truhenknacker', ticket: gr.mit.ticket, score: 12000, runden: 20,
})
pruefe('Ein Goldrausch-Ticket gilt nicht im Truhenknacker', falschesSpiel.status === 401,
  `HTTP ${falschesSpiel.status} ${falschesSpiel.daten?.grund || ''}`)

const negativ = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'goldrausch', ticket: gr.mit.ticket, score: -500, runden: 2,
})
pruefe('Negative Punktzahl wird abgewiesen', negativ.status === 400 && negativ.daten?.grund === 'punkte',
  `HTTP ${negativ.status} ${negativ.daten?.grund || ''}`)

/* ================================================================== */
console.log('\n=== 7. Goldrausch: mit und ohne Einwilligung ===')

const grMit = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'goldrausch', ticket: gr.mit.ticket, score: 19400, runden: 30,
})
pruefe('Goldrausch-Lauf gewertet', grMit.daten?.gewertet === true, `HTTP ${grMit.status} ${grMit.daten?.grund || ''}`)
pruefe('Gesamt = bester Truhenknacker + bester Goldrausch',
  Number(grMit.daten?.gesamt) === 14820 + 19400, `${grMit.daten?.gesamt} statt ${14820 + 19400}`)
pruefe('Mit Einwilligung: in der Liste gefuehrt', grMit.daten?.gelistet === true, `gelistet=${grMit.daten?.gelistet}`)

const grOhne = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.ohne, game: 'goldrausch', ticket: gr.ohne.ticket, score: 21840, runden: 33,
})
pruefe('Spielen geht auch ohne Einwilligung',
  grOhne.daten?.gespeichert === true && grOhne.daten?.gewertet === true,
  `gespeichert=${grOhne.daten?.gespeichert} gewertet=${grOhne.daten?.gewertet}`)
pruefe('Ohne Einwilligung: nicht in der Liste gefuehrt', grOhne.daten?.gelistet === false,
  `gelistet=${grOhne.daten?.gelistet}`)
/* Wer nicht in der Liste steht, hat dort auch keinen Platz — und bekommt
   folgerichtig kein "PLATZ x VON y" angezeigt. Die Punktzahl selbst sieht er
   weiterhin. */
pruefe('Ohne Einwilligung bleibt der eigene Rang leer',
  grOhne.daten?.rang?.platz == null && grOhne.daten?.rang?.bisPlatz == null
  && grOhne.daten?.rang?.luecke == null,
  JSON.stringify(grOhne.daten?.rang))
pruefe('Ohne Einwilligung kommen trotzdem eigene Punkte',
  Number(grOhne.daten?.punkte) === 21840, `${grOhne.daten?.punkte}`)

/* ================================================================== */
console.log('\n=== 7b. KÜCHEN-STACK und KÜCHEN-DASH (2.3) ===')

/* Seit dem Game-Lab stehen Stack und Dash ohne Admin-Eintrag auf AUS. Dann
   ist die richtige Antwort kein Ticket, sondern 403 'aus' — die Score-Pruefung
   laeuft nur, wenn jemand die beiden im Admin bewusst eingeschaltet hat. */
const stackDashAus = Object.values(neu).every((t) => t.status === 403)

if (stackDashAus) {
  pruefe('Ausgeschaltete Endlosspiele bekommen kein Ticket (403 aus)',
    Object.values(neu).every((t) => t.grund === 'aus' && t.ticket == null),
    Object.values(neu).map((t) => `${t.status} ${t.grund || ''}`).join(','))
} else {
  pruefe('Endlosspiele bekommen Tickets', Object.values(neu).every((t) => typeof t.ticket === 'string'),
    Object.values(neu).map((t) => t.status).join(','))

  const stackGut = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'kuechen_stack', ticket: neu.stack.ticket, score: 1200, runden: 12,
  })
  pruefe('KÜCHEN-STACK: plausibler Lauf gespeichert und gewertet',
    stackGut.daten?.gespeichert === true && stackGut.daten?.gewertet === true,
    `HTTP ${stackGut.status} ${stackGut.daten?.grund || ''} gewertet=${stackGut.daten?.gewertet}`)
  pruefe('KÜCHEN-STACK: Bestwert steht in der Antwort', Number(stackGut.daten?.beste?.kuechen_stack) === 1200,
    JSON.stringify(stackGut.daten?.beste))

  const stackBetrug = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'kuechen_stack', ticket: neu.stackBetrug.ticket, score: 5000, runden: 4,
  })
  pruefe('KÜCHEN-STACK: mehr Punkte als Module hergeben — gespeichert, nicht gewertet',
    stackBetrug.daten?.gespeichert === true && stackBetrug.daten?.gewertet === false,
    `gespeichert=${stackBetrug.daten?.gespeichert} gewertet=${stackBetrug.daten?.gewertet}`)

  const stackHart = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'kuechen_stack', ticket: neu.stackHart.ticket, score: 999999, runden: 5000,
  })
  pruefe('KÜCHEN-STACK: Punktzahl ueber der harten Grenze abgewiesen',
    stackHart.status === 400 && stackHart.daten?.grund === 'punkte', `HTTP ${stackHart.status} ${stackHart.daten?.grund || ''}`)

  const dashGut = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'kuechen_dash', ticket: neu.dash.ticket, score: 320, runden: 0,
  })
  pruefe('KÜCHEN-DASH: plausibler Lauf gespeichert und gewertet',
    dashGut.daten?.gespeichert === true && dashGut.daten?.gewertet === true,
    `HTTP ${dashGut.status} ${dashGut.daten?.grund || ''} gewertet=${dashGut.daten?.gewertet}`)

  const dashBetrug = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'kuechen_dash', ticket: neu.dashBetrug.ticket, score: 9000, runden: 0,
  })
  pruefe('KÜCHEN-DASH: 9.000 Meter in 17 Sekunden — gespeichert, nicht gewertet',
    dashBetrug.daten?.gespeichert === true && dashBetrug.daten?.gewertet === false,
    `gespeichert=${dashBetrug.daten?.gespeichert} gewertet=${dashBetrug.daten?.gewertet}`)
  pruefe('KÜCHEN-DASH: Bestwert bleibt beim plausiblen Lauf', Number(dashBetrug.daten?.beste?.kuechen_dash) === 320,
    JSON.stringify(dashBetrug.daten?.beste))
  pruefe('Neue Games aendern GESAMT nicht', Number(dashBetrug.daten?.gesamt) === 14820 + 19400,
    `${dashBetrug.daten?.gesamt}`)

  const kreuz = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: 'kuechen_dash', ticket: neu.stackBetrug.ticket, score: 10, runden: 0,
  })
  pruefe('Ein KÜCHEN-STACK-Ticket gilt nicht in KÜCHEN-DASH', kreuz.status === 401, `HTTP ${kreuz.status}`)
}

/* ================================================================== */
console.log('\n=== 7c. Game-Lab: sieben Kandidaten ===')

pruefe('Sieben neue Games im Server-Kern', LAB.length === 7, LAB.join(','))
pruefe('Alle Kandidaten bekommen Tickets',
  LAB.every((g) => typeof labTk[g].gut.ticket === 'string' && typeof labTk[g].hart.ticket === 'string'),
  LAB.map((g) => `${g}:${labTk[g].gut.status}`).join(','))

let letzteLabAntwort = null
for (const g of LAB) {
  const r = SPIELE[g]
  const lauf = labLauf(g)
  const gut = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: g, ticket: labTk[g].gut.ticket, score: lauf.score, runden: lauf.runden,
  })
  pruefe(`${g}: plausibler Lauf gespeichert und gewertet`,
    gut.daten?.gespeichert === true && gut.daten?.gewertet === true,
    `HTTP ${gut.status} ${gut.daten?.grund || ''} gewertet=${gut.daten?.gewertet} (${lauf.score}/${lauf.runden})`)
  pruefe(`${g}: Bestwert und Rang kommen zurueck`,
    Number(gut.daten?.beste?.[g]) === lauf.score && Number(gut.daten?.rang?.platz) > 0,
    `best=${gut.daten?.beste?.[g]} platz=${gut.daten?.rang?.platz}`)

  /* Eine Aktion, aber mehr Punkte, als eine Aktion hergeben kann. */
  const betrugPunkte = Math.min(r.hart, (r.maxJeRunde || 0) + 1)
  const betrug = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: g, ticket: labTk[g].betrug.ticket, score: betrugPunkte, runden: 1,
  })
  pruefe(`${g}: Punkte passen nicht zu den Aktionen — gespeichert, nicht gewertet`,
    betrug.daten?.gespeichert === true && betrug.daten?.gewertet === false,
    `gespeichert=${betrug.daten?.gespeichert} gewertet=${betrug.daten?.gewertet}`)

  const hart = await ruf({
    aktion: 'spiel-ende', sitzung: sitzungen.mit, game: g, ticket: labTk[g].hart.ticket, score: r.hart + 1, runden: 99999,
  })
  pruefe(`${g}: ueber der harten Grenze abgewiesen`,
    hart.status === 400 && hart.daten?.grund === 'punkte', `HTTP ${hart.status} ${hart.daten?.grund || ''}`)
  letzteLabAntwort = betrug
}
pruefe('Die Kandidaten aendern GESAMT nicht', Number(letzteLabAntwort?.daten?.gesamt) === 14820 + 19400,
  `${letzteLabAntwort?.daten?.gesamt}`)

const labKreuz = await ruf({
  aktion: 'spiel-ende', sitzung: sitzungen.mit, game: LAB[1], ticket: labTk[LAB[0]].hart.ticket, score: 1, runden: 1,
})
pruefe('Ein Ticket gilt nur fuer sein eigenes Game', labKreuz.status === 401, `HTTP ${labKreuz.status}`)

/* ================================================================== */
console.log('\n=== 8. Rangliste ===')

const liste = await ruf({ aktion: 'rangliste', sitzung: sitzungen.mit })
const listen = liste.daten?.listen || {}
const roh = JSON.stringify(liste.daten)
pruefe('Alle fuenf Listen kommen', Boolean(listen.truhenknacker && listen.goldrausch && listen.kuechen_stack
  && listen.kuechen_dash && listen.gesamt), Object.keys(listen).join(','))
if (stackDashAus) {
  pruefe('Ausgeschaltet: Stack und Dash haben keine eigenen Testpunkte',
    listen.kuechen_stack?.eigenePunkte == null && listen.kuechen_dash?.eigenePunkte == null,
    `${listen.kuechen_stack?.eigenePunkte}/${listen.kuechen_dash?.eigenePunkte}`)
  pruefe('Ausgeschaltet steht so im Schalter', liste.daten?.spieleAktiv?.kuechen_stack === false
    && liste.daten?.spieleAktiv?.kuechen_dash === false, JSON.stringify(liste.daten?.spieleAktiv))
} else {
  pruefe('KÜCHEN-STACK-Liste: eigene Punkte', Number(listen.kuechen_stack?.eigenePunkte) === 1200,
    `${listen.kuechen_stack?.eigenePunkte}`)
  pruefe('KÜCHEN-DASH-Liste: eigene Punkte ohne Betrugslauf', Number(listen.kuechen_dash?.eigenePunkte) === 320,
    `${listen.kuechen_dash?.eigenePunkte}`)
}
pruefe('Spiele-Schalter kommen mit der Rangliste', liste.daten?.spieleAktiv && typeof liste.daten.spieleAktiv === 'object')
pruefe('Eine eigene Liste je Game plus GESAMT',
  Object.keys(SPIELE).every((g) => listen[g]) && Boolean(listen.gesamt), Object.keys(listen).join(','))
pruefe('Spiele-Reihenfolge kommt mit der Rangliste', liste.daten && 'spieleReihenfolge' in liste.daten,
  JSON.stringify(liste.daten?.spieleReihenfolge))
for (const g of LAB) {
  pruefe(`${g}-Liste: eigene Punkte ohne Betrugslauf`, Number(listen[g]?.eigenePunkte) === labLauf(g).score,
    `${listen[g]?.eigenePunkte} statt ${labLauf(g).score}`)
}
pruefe('Der Name mit Einwilligung erscheint', roh.includes(NAME.mit))
pruefe('Der Name ohne Einwilligung erscheint NICHT', !roh.includes(NAME.ohne))
pruefe('Keine E-Mail-Adresse in der Rangliste', !/[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(roh))
pruefe('Keine Deckelnummern in der Rangliste', !/4998|4999|1847/.test(roh))
pruefe('Eigener Platz wird genannt', Number(listen.truhenknacker?.eigenerPlatz) > 0,
  `#${listen.truhenknacker?.eigenerPlatz}`)
pruefe('Eigene Punkte stimmen', Number(listen.truhenknacker?.eigenePunkte) === 14820,
  `${listen.truhenknacker?.eigenePunkte}`)
pruefe('Die unerreichbare Punktzahl steht in keiner Liste', !roh.includes('90000') && !roh.includes('999999999'))
pruefe('Gesamtliste rechnet beide Spiele zusammen',
  Number(listen.gesamt?.eigenePunkte) === 14820 + 19400, `${listen.gesamt?.eigenePunkte}`)
pruefe('Top 20 ist die Obergrenze', (listen.gesamt?.eintraege?.length ?? 0) <= 20,
  `${listen.gesamt?.eintraege?.length} Eintraege`)

const offen = await ruf({ aktion: 'rangliste' })
const rohOffen = JSON.stringify(offen.daten)
pruefe('Rangliste ist auch ohne Sitzung abrufbar', offen.daten?.ok === true)
pruefe('Oeffentliche Rangliste ohne eigenen Platz', offen.daten?.listen?.gesamt?.eigenerPlatz == null)
pruefe('Oeffentliche Rangliste ohne private Daten',
  !/[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(rohOffen) && !/4998|4999|1847/.test(rohOffen)
  && !/email|deckel/i.test(rohOffen))

/* ================================================================== */
console.log('\n=== 9. Zustand ===')

const zustand = await ruf({ aktion: 'zustand', sitzung: sitzungen.mit })
const zRoh = JSON.stringify(zustand.daten)
pruefe('Zustand kennt den Teilnehmer', zustand.daten?.teilnehmer?.deckel === TEST_DECKEL.mit,
  JSON.stringify(zustand.daten?.teilnehmer))
pruefe('Zustand kennt die Bestwerte', Number(zustand.daten?.spiele?.beste?.truhenknacker) === 14820,
  JSON.stringify(zustand.daten?.spiele?.beste))
pruefe('Zustand nennt den Tresorkoenig', Boolean(zustand.daten?.koenig?.instagram),
  JSON.stringify(zustand.daten?.koenig))
pruefe('Zustand gibt die eigene E-Mail nicht heraus', !/videko-test\.invalid/.test(zRoh))

const zOffen = await ruf({ aktion: 'zustand' })
pruefe('Oeffentlicher Zustand ohne Teilnehmerdaten',
  zOffen.daten?.teilnehmer === null && zOffen.daten?.spiele === null)
pruefe('Oeffentlicher Zustand ohne Deckelnummern', !/4998|4999|1847/.test(JSON.stringify(zOffen.daten)))
/* Der Koenig darf Name, Punkte, Platz und die Markierung "bin ich das" tragen.
   Verboten sind E-Mail, Deckelnummer und die Teilnehmer-ID. */
pruefe('Oeffentlicher Zustand nennt vom Koenig nichts Privates',
  zOffen.daten?.koenig == null
  || Object.keys(zOffen.daten.koenig).every((k) => /^(instagram|punkte|platz|ich)$/.test(k)),
  JSON.stringify(zOffen.daten?.koenig))

/* ================================================================== */
console.log('\n=== 9b. Leaderboard-Einwilligung nachtraeglich (2.3) ===')

const einwOhne = await ruf({ aktion: 'leaderboard', ok: false })
pruefe('Einwilligung ohne Sitzung abgewiesen', einwOhne.status === 401, `HTTP ${einwOhne.status}`)
const einwWirr = await ruf({ aktion: 'leaderboard', sitzung: sitzungen.mit, ok: 'ja' })
pruefe('Einwilligung ohne echten Wahrheitswert abgewiesen', einwWirr.status === 400, `HTTP ${einwWirr.status}`)

const vorAus = await ruf({ aktion: 'zustand', sitzung: sitzungen.mit })
const aktiviertVorAus = (await ruf({ aktion: 'zustand' })).daten?.aktiviert
const aus = await ruf({ aktion: 'leaderboard', sitzung: sitzungen.mit, ok: false })
pruefe('OPT-OUT gespeichert', aus.daten?.ok === true && aus.daten?.leaderboardOk === false,
  `HTTP ${aus.status} ${JSON.stringify(aus.daten)}`)
const rohAus = JSON.stringify((await ruf({ aktion: 'rangliste' })).daten)
pruefe('OPT-OUT: Name sofort aus allen oeffentlichen Listen', !rohAus.includes(NAME.mit))
const nachAus = await ruf({ aktion: 'zustand', sitzung: sitzungen.mit })
pruefe('OPT-OUT: Bestwerte unveraendert',
  JSON.stringify(nachAus.daten?.spiele?.beste) === JSON.stringify(vorAus.daten?.spiele?.beste),
  JSON.stringify(nachAus.daten?.spiele?.beste))
pruefe('OPT-OUT: Aktivierung und Teilnehmerzahl unveraendert',
  nachAus.daten?.teilnehmer?.deckel === TEST_DECKEL.mit && (await ruf({ aktion: 'zustand' })).daten?.aktiviert === aktiviertVorAus)
pruefe('OPT-OUT: Zustand meldet nicht oeffentlich', nachAus.daten?.teilnehmer?.leaderboardOk === false,
  JSON.stringify(nachAus.daten?.teilnehmer?.leaderboardOk))

const an = await ruf({ aktion: 'leaderboard', sitzung: sitzungen.ohne, ok: true })
pruefe('OPT-IN spaeter moeglich', an.daten?.ok === true && an.daten?.leaderboardOk === true, `HTTP ${an.status}`)
const rohAn = JSON.stringify((await ruf({ aktion: 'rangliste' })).daten)
pruefe('OPT-IN: Name erscheint jetzt', rohAn.includes(NAME.ohne))
pruefe('OPT-IN: weiterhin keine privaten Daten', !/[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(rohAn) && !/4998|4999|1847/.test(rohAn))
const zurueckAn = await ruf({ aktion: 'leaderboard', sitzung: sitzungen.mit, ok: true })
pruefe('Wieder OPT-IN: Name zurueck', zurueckAn.daten?.leaderboardOk === true
  && JSON.stringify((await ruf({ aktion: 'rangliste' })).daten).includes(NAME.mit))

/* ================================================================== */
console.log('\n=== 10. Verwaltung und Ziehung unveraendert ===')

const adminOhne = await ruf({ aktion: 'stand' }, '/api/terminal-admin')
pruefe('Verwaltung ohne Token abgewiesen', adminOhne.status === 401, `HTTP ${adminOhne.status}`)

const adminFalsch = await ruf({ aktion: 'stand' }, '/api/terminal-admin', { 'x-terminal-admin': 'falsch' })
pruefe('Verwaltung mit falschem Token abgewiesen', adminFalsch.status === 401, `HTTP ${adminFalsch.status}`)

const ziehenOhne = await ruf({ aktion: 'ziehen' }, '/api/terminal-admin')
pruefe('Ziehen ohne Token abgewiesen', ziehenOhne.status === 401, `HTTP ${ziehenOhne.status}`)

if (ADMIN) {
  const kopf = { 'x-terminal-admin': ADMIN }
  const st = await ruf({ aktion: 'stand' }, '/api/terminal-admin', kopf)
  pruefe('Verwaltung antwortet mit Token', st.daten?.ok === true, `HTTP ${st.status}`)
  pruefe('Verwaltung sieht die Testteilnehmer',
    (st.daten?.teilnehmer || []).filter((t) => String(t.instagram_handle || '').startsWith('zz_pruefung')).length === 2,
    `${st.daten?.aktiviert} aktiviert`)

  /* ziehung-status und meldung-status sind schreibende Aktionen: sie setzen den
     Status eines bestimmten Loses bzw. einer bestimmten Meldung. Es gibt gerade
     keine, und eine zu erzeugen waere ein echter Zug in der laufenden Kampagne.
     Geprueft wird daher, dass beide Wege erreichbar sind und eine unvollstaendige
     Anfrage ablehnen, statt irgendetwas zu schreiben. */
  const zs = await ruf({ aktion: 'ziehung-status' }, '/api/terminal-admin', kopf)
  pruefe('Ziehungsstatus lehnt unvollstaendige Anfrage ab',
    zs.status === 400 && zs.daten?.grund === 'felder', `HTTP ${zs.status} ${zs.daten?.grund || ''}`)

  const ms = await ruf({ aktion: 'meldung-status' }, '/api/terminal-admin', kopf)
  pruefe('Meldungsstatus lehnt unvollstaendige Anfrage ab',
    ms.status === 400 && ms.daten?.grund === 'felder', `HTTP ${ms.status} ${ms.daten?.grund || ''}`)

  /* Die Laufliste der Verwaltung. Sie liest nur — hier kann vollstaendig
     geprueft werden, ohne irgendetwas zu veraendern. */
  const sc = await ruf({ aktion: 'scores' }, '/api/terminal-admin', kopf)
  pruefe('Laufliste antwortet', sc.daten?.ok === true && Array.isArray(sc.daten.scores),
    `HTTP ${sc.status}`)
  const meineLaeufe = (sc.daten?.scores || []).filter((z) => String(z.instagram || '').startsWith('zz_pruefung'))
  pruefe('Die Testlaeufe stehen in der Laufliste', meineLaeufe.length >= 6, `${meineLaeufe.length} Laeufe`)
  pruefe('Jeder Lauf bringt mit, was die Moderation braucht',
    meineLaeufe.every((z) => z.id && z.game && Number.isFinite(z.score) && z.status && z.wann),
    JSON.stringify(meineLaeufe[0] || {}).slice(0, 90))
  pruefe('Auch Laeufe ohne Ranglisten-Einwilligung sind moderierbar',
    meineLaeufe.some((z) => z.instagram === NAME.ohne), `${meineLaeufe.map((z) => z.instagram).join(', ')}`)

  const rohLauf = JSON.stringify(sc.daten)
  pruefe('Die Laufliste gibt keine Deckelnummer heraus', !/deckel/i.test(rohLauf))
  pruefe('Die Laufliste gibt keine E-Mail-Adresse heraus',
    !/[\w.+-]+@[\w-]+\.[\w.]{2,}/.test(rohLauf))
  /* Punkt 6 verlangt ausdruecklich, dass Ziehungsdaten getrennt bleiben. Die
     Laufliste liefert deshalb genau neun Felder und kein zehntes. */
  const felder = [...new Set((sc.daten?.scores || []).flatMap((z) => Object.keys(z)))].sort()
  pruefe('Die Laufliste liefert nur die Moderationsfelder',
    felder.join(',') === 'dauerMs,game,id,instagram,notiz,runden,score,status,wann', felder.join(','))

  const nurVerdacht = await ruf({ aktion: 'scores', filter: 'verdacht' }, '/api/terminal-admin', kopf)
  pruefe('Filter auf verdaechtige Laeufe greift',
    (nurVerdacht.daten?.scores || []).every((z) => z.status === 'verdacht'),
    `${(nurVerdacht.daten?.scores || []).length} Treffer`)

  const gesucht = await ruf({ aktion: 'scores', suche: NAME.mit }, '/api/terminal-admin', kopf)
  pruefe('Suche nach einem Teilnehmer greift',
    (gesucht.daten?.scores || []).length > 0
    && (gesucht.daten?.scores || []).every((z) => z.instagram === NAME.mit),
    `${(gesucht.daten?.scores || []).length} Treffer`)

  const nurSpiel = await ruf({ aktion: 'scores', suche: NAME.mit, game: 'goldrausch' }, '/api/terminal-admin', kopf)
  pruefe('Filter auf ein Spiel greift',
    (nurSpiel.daten?.scores || []).every((z) => z.game === 'goldrausch'),
    `${(nurSpiel.daten?.scores || []).length} Treffer`)

  /* Der Statuswechsel wird wirklich ausgefuehrt — aber ausschliesslich an
     einem der eigenen Testlaeufe, und danach wieder zurueckgedreht. An der
     laufenden Kampagne aendert das nichts, und geloescht wird ohnehin nie.
     Gewaehlt ist der schwaechste Lauf, damit selbst ein Abbruch mitten im
     Durchgang keine echte Bestenliste verbiegt. */
  const opfer = (gesucht.daten?.scores || []).find((z) => z.score === 3200)
  if (opfer) {
    const raus = await ruf(
      { aktion: 'score-status', id: opfer.id, status: 'verworfen', suche: NAME.mit },
      '/api/terminal-admin', kopf,
    )
    pruefe('Ein Lauf laesst sich aus der Wertung nehmen',
      (raus.daten?.scores || []).find((z) => z.id === opfer.id)?.status === 'verworfen',
      `HTTP ${raus.status} ${raus.daten?.grund || ''}`)
    pruefe('Der Lauf ist danach noch da — verworfen ist nicht geloescht',
      (raus.daten?.scores || []).some((z) => z.id === opfer.id))

    const zurueck = await ruf(
      { aktion: 'score-status', id: opfer.id, status: 'gueltig', suche: NAME.mit },
      '/api/terminal-admin', kopf,
    )
    pruefe('Derselbe Lauf laesst sich wieder freigeben',
      (zurueck.daten?.scores || []).find((z) => z.id === opfer.id)?.status === 'gueltig',
      `HTTP ${zurueck.status} ${zurueck.daten?.grund || ''}`)
  } else {
    pruefe('Ein Lauf laesst sich aus der Wertung nehmen', false, 'Testlauf 3200 nicht gefunden')
  }

  const ohneId = await ruf({ aktion: 'score-status', status: 'verworfen' }, '/api/terminal-admin', kopf)
  pruefe('Statuswechsel ohne Lauf-Kennung wird abgelehnt',
    ohneId.status === 400 && ohneId.daten?.grund === 'felder', `HTTP ${ohneId.status} ${ohneId.daten?.grund || ''}`)

  const wirrerStatus = await ruf(
    { aktion: 'score-status', id: '00000000-0000-0000-0000-000000000000', status: 'geloescht' },
    '/api/terminal-admin', kopf,
  )
  pruefe('Ein erfundener Status wird abgelehnt',
    wirrerStatus.status === 400 && wirrerStatus.daten?.grund === 'felder',
    `HTTP ${wirrerStatus.status} ${wirrerStatus.daten?.grund || ''}`)

  const scoresOhneToken = await ruf({ aktion: 'scores' }, '/api/terminal-admin')
  pruefe('Laufliste ohne Token abgewiesen', scoresOhneToken.status === 401, `HTTP ${scoresOhneToken.status}`)

  const unbekannt = await ruf({ aktion: 'gibtsnicht' }, '/api/terminal-admin', kopf)
  pruefe('Unbekannte Verwaltungsaktion wird abgelehnt',
    unbekannt.status === 400 && unbekannt.daten?.grund === 'aktion', `HTTP ${unbekannt.status}`)

  const stats = await ruf({ aktion: 'stats' }, '/api/terminal-admin', kopf)
  const sp = stats.daten?.spiele || {}
  pruefe('Statistik je Spiel (alle elf)',
    Object.keys(SPIELE).every((g) => sp[g] && Number.isFinite(sp[g].laeufe)),
    Object.keys(sp).join(','))
  pruefe('Statistik nennt fuer jedes Game die 60-s-Replay-Quote',
    Object.keys(SPIELE).every((g) => sp[g] && 'replay60' in sp[g]),
    Object.keys(SPIELE).filter((g) => !(sp[g] && 'replay60' in sp[g])).join(','))
  pruefe('Kandidaten-Laeufe zaehlen in der Statistik',
    LAB.every((g) => sp[g]?.laeufe >= 1), LAB.map((g) => `${g}:${sp[g]?.laeufe}`).join(','))
  pruefe('Statistik nennt Laeufe, Spieler und Replay-Rate',
    sp.kuechen_stack?.laeufe >= 2 && sp.kuechen_stack?.spieler >= 1 && 'replayRate' in (sp.kuechen_stack || {}),
    JSON.stringify(sp.kuechen_stack || {}).slice(0, 120))
  pruefe('Statistik ohne private Daten', !/[\w.+-]+@[\w-]+\.[\w.]{2,}|deckel|teilnehmer_id/i.test(JSON.stringify(stats.daten)))

  const csv = await ruf({ aktion: 'csv' }, '/api/terminal-admin', kopf)
  pruefe('CSV-Ausgabe funktioniert weiterhin',
    csv.daten?.ok === true && typeof csv.daten.csv === 'string' && csv.daten.csv.length > 0, `HTTP ${csv.status}`)

  /* Die Ziehung selbst wird NICHT ausgeloest: das waere ein echter Zug in der
     laufenden Kampagne. Geprueft ist damit, dass der Weg dorthin steht und das
     Tor verschlossen ist — an der Ziehungslogik hat 2.0 nichts geaendert. */
  console.log('  (die Ziehung wird bewusst nicht ausgeloest — echte Kampagne)')
} else {
  console.log('  (kein TERMINAL_ADMIN_TOKEN in .env.local — Verwaltung nicht geprueft)')
}

/* ================================================================== */
console.log('\n=== 11. Testmodus gegen den echten Server ===')

/* Der Testmodus darf nichts Echtes veraendern. Deshalb wird vorher und
   nachher derselbe oeffentliche Stand gelesen — Teilnehmerzahl, Ziehung,
   Rangliste — und muss identisch sein. */
const oeffentlich = async () => {
  const z = await ruf({ aktion: 'zustand' })
  const r = await ruf({ aktion: 'rangliste' })
  return JSON.stringify({ aktiviert: z.daten?.aktiviert, einstellungen: z.daten?.einstellungen, listen: r.daten?.listen })
}

const ohneToken = await ruf({ aktion: 'testsession' }, '/api/terminal-admin')
pruefe('Testsitzung ohne Admin-Token abgewiesen', ohneToken.status === 401, `HTTP ${ohneToken.status}`)

const falscherBeleg = await ruf({ aktion: 'aktivieren', probe: 'v1.eyJhIjoxfQ.gefaelscht', deckel: 4997,
  instagram: 'zz_x', email: 'x@videko-test.invalid', folgt: true })
pruefe('Gefaelschter Testbeleg oeffnet keinen Testmodus', falscherBeleg.status === 401 && !falscherBeleg.daten?.probe,
  `HTTP ${falscherBeleg.status} ${falscherBeleg.daten?.grund || ''}`)

if (ADMIN) {
  const kopf = { 'x-terminal-admin': ADMIN }
  const vorher = await oeffentlich()
  const standVorher = (await ruf({ aktion: 'stand' }, '/api/terminal-admin', kopf)).daten
  const laeufeVorher = ((await ruf({ aktion: 'scores' }, '/api/terminal-admin', kopf)).daten?.scores || []).length

  const ts = await ruf({ aktion: 'testsession' }, '/api/terminal-admin', kopf)
  let probe = ts.daten?.probe
  pruefe('Testsitzung mit Admin-Token ausgestellt', typeof probe === 'string' && probe.length > 20, `HTTP ${ts.status}`)
  pruefe('Der Testbeleg enthaelt das Admin-Token nicht', typeof probe === 'string' && !probe.includes(ADMIN))

  const z0 = await ruf({ aktion: 'zustand', probe })
  pruefe('Testmodus: zustand als Test gekennzeichnet, noch nicht aktiviert',
    z0.daten?.probe === true && z0.daten.teilnehmer === null, `HTTP ${z0.status}`)

  const akt = await ruf({ aktion: 'aktivieren', probe, deckel: 4997, instagram: 'zz_probe', email: 'probe@videko-test.invalid', folgt: true, leaderboard: true })
  pruefe('Testmodus: Aktivieren liefert nur einen neuen Testbeleg', typeof akt.daten?.probe === 'string' && akt.daten.sitzung === null,
    `HTTP ${akt.status}`)
  probe = akt.daten?.probe || probe

  const z1 = await ruf({ aktion: 'zustand', probe })
  pruefe('Testmodus: aktiviert als @videko_test / Deckel TEST',
    z1.daten?.teilnehmer?.deckel === 'TEST' && z1.daten.teilnehmer.instagram === 'videko_test')
  pruefe('Testmodus: nie in einer oeffentlichen Liste', z1.daten?.spiele?.gelistet === false)

  const st = await ruf({ aktion: 'spiel-start', probe, game: 'goldrausch' })
  pruefe('Testmodus: Spielstart liefert Laufticket', typeof st.daten?.ticket === 'string', `HTTP ${st.status}`)
  const en = await ruf({ aktion: 'spiel-ende', probe, game: 'goldrausch', ticket: st.daten?.ticket, score: 1200, runden: 3 })
  pruefe('Testmodus: Spielende speichert nichts', en.daten?.gespeichert === false && en.daten?.gelistet === false,
    `HTTP ${en.status} ${en.daten?.grund || ''}`)

  const me = await ruf({ aktion: 'melden', probe, deckel: 4997 })
  pruefe('Testmodus: Meldung wird nicht gespeichert', me.daten?.gespeichert === false, `HTTP ${me.status}`)

  const rl = await ruf({ aktion: 'rangliste', probe })
  pruefe('Testmodus: Rangliste gekennzeichnet, ohne Testperson',
    rl.daten?.probe === true && !JSON.stringify(rl.daten).includes('videko_test'))

  const rs = await ruf({ aktion: 'probe-reset', probe })
  const z2 = await ruf({ aktion: 'zustand', probe: rs.daten?.probe })
  pruefe('Testmodus: Reset liefert frische, nicht aktivierte Testsitzung',
    typeof rs.daten?.probe === 'string' && z2.daten?.probe === true && z2.daten.teilnehmer === null)

  const nachher = await oeffentlich()
  const standNachher = (await ruf({ aktion: 'stand' }, '/api/terminal-admin', kopf)).daten
  const laeufeNachher = ((await ruf({ aktion: 'scores' }, '/api/terminal-admin', kopf)).daten?.scores || []).length
  pruefe('Echte Teilnehmerzahl unveraendert', standVorher?.aktiviert === standNachher?.aktiviert,
    `${standVorher?.aktiviert} → ${standNachher?.aktiviert}`)
  pruefe('Keine Zeile fuer Deckel 4997 / zz_probe / videko_test angelegt',
    !(standNachher?.teilnehmer || []).some((x) => /zz_probe|videko_test/.test(String(x.instagram_handle || '')) || String(x.deckel_nummer ?? x.deckel ?? '') === '4997'))
  pruefe('Echte Scores unveraendert', laeufeVorher === laeufeNachher, `${laeufeVorher} → ${laeufeNachher}`)
  pruefe('Oeffentlicher Stand, Ziehung und Rangliste unveraendert', vorher === nachher)
  pruefe('Echte Ziehungen und Meldungen unveraendert',
    JSON.stringify([standVorher?.ziehungen, standVorher?.meldungen, standVorher?.einstellungen])
    === JSON.stringify([standNachher?.ziehungen, standNachher?.meldungen, standNachher?.einstellungen]))
} else {
  console.log('  (kein TERMINAL_ADMIN_TOKEN — Testmodus nur ohne Token geprueft)')
}

/* ================================================================== */
console.log('\n=== 12. Wieder-Login gegen den echten Server ===')

/* Echte Post geht dabei nie raus: alle Adressen enden auf .invalid, und an
   reservierte Domains verschickt der Server grundsaetzlich nichts. Die
   Zugangslinks fuer Deckel 4998 traegt der Lauf selbst ein — als SHA-256,
   genau wie der Server —, weil der Token sonst nur im Postfach stuende. */
const WIEDER_NEUTRAL = 'Wenn zu dieser E-Mail ein aktivierter Deckel gehört, haben wir dir einen Zugangslink geschickt.'
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

/* Die Projektkennung kommt ausschliesslich aus TERMINAL_SUPABASE_URL — nie
   fest verdrahtet. Das Terminal liegt seit dem Umzug in `videko-core-pilot`;
   `buchhaltung` (ALTES_PROJEKT) ist fuer diesen Lauf gesperrt und bleibt
   unantastbar. Fehlt die Variable oder zeigt sie aufs alte Projekt, schreibt
   der Lauf gar nicht — lieber ein fehlgeschlagener Test als eine Zeile in der
   falschen Datenbank. */
const ALTES_PROJEKT = 'tshdfkmpkcpkeufplzda'
const ZIEL_REF = (() => {
  const url = lies('TERMINAL_SUPABASE_URL')
  const ref = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i.exec(url)?.[1] || ''
  if (!ref || ref === ALTES_PROJEKT) return ''
  return ref
})()

function sql(befehl) {
  if (!ZIEL_REF) {
    console.log('  (TERMINAL_SUPABASE_URL fehlt oder zeigt aufs alte Projekt — kein SQL)')
    return false
  }
  const datei = join(tmpdir(), `terminal-live-${process.pid}.sql`)
  writeFileSync(datei, befehl)
  try {
    execSync(`npx supabase db query --linked --project-ref ${ZIEL_REF} -f "${datei}"`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  } finally {
    unlinkSync(datei)
  }
}

const adminKopf = ADMIN ? { 'x-terminal-admin': ADMIN } : null
const adminBild = async () => {
  if (!adminKopf) return null
  const st = (await ruf({ aktion: 'stand' }, '/api/terminal-admin', adminKopf)).daten
  const sc = (await ruf({ aktion: 'scores' }, '/api/terminal-admin', adminKopf)).daten?.scores || []
  const testzeile = (st?.teilnehmer || []).find((x) => String(x.instagram_handle || '') === NAME.mit)
  return JSON.stringify({
    aktiviert: st?.aktiviert,
    teilnehmerZahl: (st?.teilnehmer || []).length,
    testzeile,
    scores: sc.length,
    ziehungen: st?.ziehungen,
    meldungen: st?.meldungen,
    einstellungen: st?.einstellungen,
  })
}
const vorWieder = await oeffentlich()
const adminVorWieder = await adminBild()

const zeitRuf = async (koerper) => {
  const t0 = Date.now()
  const r = await ruf(koerper)
  return { ...r, ms: Date.now() - t0 }
}
const wUnbekannt = await zeitRuf({ aktion: 'wieder-anfordern', email: `niemand.${Date.now()}@videko-test.invalid` })
const wBekannt = await zeitRuf({ aktion: 'wieder-anfordern', email: MAIL.mit })
pruefe('Anfrage: neutraler Satz', wBekannt.status === 200 && wBekannt.daten?.meldung === WIEDER_NEUTRAL,
  `HTTP ${wBekannt.status} ${wBekannt.daten?.grund || ''}`)
pruefe('Unbekannte E-Mail: derselbe Status, dieselbe Antwort',
  wUnbekannt.status === wBekannt.status && JSON.stringify(wUnbekannt.daten) === JSON.stringify(wBekannt.daten))
pruefe('Antwort verraet weder Deckel noch Instagram-Name',
  !JSON.stringify(wBekannt.daten).includes(String(TEST_DECKEL.mit)) && !JSON.stringify(wBekannt.daten).includes(NAME.mit))
pruefe('Beide Wege gleich langsam (keine Zeitmessung moeglich)', wUnbekannt.ms >= 3400 && wBekannt.ms >= 3400,
  `${wUnbekannt.ms} / ${wBekannt.ms} ms`)
pruefe('Kein Testlink ausserhalb des Testmodus', wBekannt.daten?.testLink === undefined)

const wKaputt = await ruf({ aktion: 'wieder-anfordern', email: 'kaputt' })
pruefe('Ungueltige Adresse: 400', wKaputt.status === 400 && wKaputt.daten?.grund === 'felder', `HTTP ${wKaputt.status}`)

/* Zwei Links fuer den Testdeckel: einer gueltig, einer schon abgelaufen. */
const tokenGut = crypto.randomBytes(32).toString('base64url')
const tokenAlt = crypto.randomBytes(32).toString('base64url')
const eintrag = (hash, gueltig) => `insert into public.videko_terminal_wiederherstellung
  (kampagne, teilnehmer_id, token_hash, email_hash, gueltig_bis)
  select kampagne, id, '${hash}', 'live-test', ${gueltig}
  from public.videko_terminal_teilnehmer
  where deckel_nummer = ${TEST_DECKEL.mit} and instagram_handle = '${NAME.mit}';`
const eingetragen = sql(`${eintrag(sha256(tokenGut), "now() + interval '15 minutes'")}\n${eintrag(sha256(tokenAlt), "now() - interval '1 minute'")}`)
pruefe('Testlinks (nur Hash) fuer Deckel 4998 eingetragen', eingetragen)

const ein = await ruf({ aktion: 'wieder-einloesen', token: tokenGut })
pruefe('Gueltiger Link: 200 mit Sitzungsbeleg',
  ein.status === 200 && typeof ein.daten?.sitzung === 'string' && ein.daten.sitzung.startsWith('v1.'),
  `HTTP ${ein.status} ${ein.daten?.grund || ''}`)
pruefe('Gueltiger Link: Deckel und Name des Testteilnehmers',
  ein.daten?.teilnehmer?.deckel === TEST_DECKEL.mit && ein.daten.teilnehmer.instagram === NAME.mit)
pruefe('Gueltiger Link: keine E-Mail in der Antwort', !JSON.stringify(ein.daten).includes('@'))

const zWieder = await ruf({ aktion: 'zustand', sitzung: ein.daten?.sitzung })
pruefe('Session wiederhergestellt: zustand kennt Deckel 4998 samt Bestwert',
  zWieder.daten?.teilnehmer?.deckel === TEST_DECKEL.mit && Number(zWieder.daten?.spiele?.beste?.truhenknacker) === 14820)

const zweimal = await ruf({ aktion: 'wieder-einloesen', token: tokenGut })
pruefe('Zweimal verwendeter Link: 401', zweimal.status === 401 && zweimal.daten?.grund === 'link', `HTTP ${zweimal.status}`)
const abgelaufen = await ruf({ aktion: 'wieder-einloesen', token: tokenAlt })
pruefe('Abgelaufener Link: 401', abgelaufen.status === 401 && abgelaufen.daten?.grund === 'link', `HTTP ${abgelaufen.status}`)
const erfundenerLink = await ruf({ aktion: 'wieder-einloesen', token: crypto.randomBytes(32).toString('base64url') })
pruefe('Ungueltiger Link: 401', erfundenerLink.status === 401 && erfundenerLink.daten?.grund === 'link', `HTTP ${erfundenerLink.status}`)
const kaputterLink = await ruf({ aktion: 'wieder-einloesen', token: 'kurz' })
pruefe('Kaputter Link: 401', kaputterLink.status === 401, `HTTP ${kaputterLink.status}`)
pruefe('Alle Fehlschlaege sehen gleich aus',
  [zweimal, abgelaufen, erfundenerLink, kaputterLink].every((r) => JSON.stringify(r.daten) === JSON.stringify(zweimal.daten)))

/* Rate-Limit: hoechstens fuenf Anfragen je Anschluss in 15 Minuten. Zwei
   sind oben schon gelaufen. */
let bremse = null
for (let i = 0; i < 6 && !bremse; i += 1) {
  const r = await ruf({ aktion: 'wieder-anfordern', email: `flut.${i}.${Date.now()}@videko-test.invalid` })
  if (r.status === 429) bremse = r
}
pruefe('Rate-Limit greift', bremse?.daten?.grund === 'bremse', bremse ? `HTTP ${bremse.status}` : 'kein 429')

pruefe('Oeffentlicher Stand, Ziehung und Rangliste unveraendert', (await oeffentlich()) === vorWieder)
if (adminKopf) {
  const adminNachWieder = await adminBild()
  pruefe('Teilnehmerzahl, Testteilnehmer, Scores, Ziehungen unveraendert', adminNachWieder === adminVorWieder)
} else {
  console.log('  (kein TERMINAL_ADMIN_TOKEN — Verwaltungsstand nicht verglichen)')
}

/* ================================================================== */
console.log('\n=== Aufzuraeumen ===')
console.log(`  Deckel ${TEST_DECKEL.mit} (${NAME.mit}) und Deckel ${TEST_DECKEL.ohne} (${NAME.ohne})`)
console.log('  samt ihren Zeilen in videko_terminal_scores')

const fehl = ergebnisse.filter((e) => !e.ok)
console.log('\n========================================')
console.log(`Gepruft: ${ergebnisse.length} · bestanden: ${ergebnisse.length - fehl.length} · fehlgeschlagen: ${fehl.length}`)
if (fehl.length) {
  console.log('\nFehlgeschlagen:')
  for (const f of fehl) console.log('  · ' + f.name)
  process.exitCode = 1
}
