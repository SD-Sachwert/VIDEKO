/**
 * KUECHEN-TINDER — Logiktest ohne Browser.
 *
 *   node scripts/spiele/tinder-logik-test.mjs
 *
 * Prueft Kartenpool, Aufgabenfolge, Schwierigkeitskurve und Wertung.
 * Zum Schluss simuliert er einen sehr guten ehrlichen Lauf und Extremfaelle
 * gegen die Servergrenzen (nur Info, kein Fehler).
 */
import { BILDER } from '../../src/components/spiele/tinder-karten.js'
import {
  ABSTAND_MS,
  AUFGABE_SPERRE_MS,
  AUFGABEN_TYPEN,
  KARTEN,
  KARTEN_MAX,
  KARTEN_MIN,
  MAX_JE_ANTWORT,
  SPIELZEIT_MS,
  STRAFE_MS,
  TEMPO_SCHNELL,
  antwortWerten,
  faktorFuer,
  meldungFuer,
  naechsteAufgabe,
  punkteFuer,
  rundeErzeugen,
  stufeFuer,
  zufallMitSaat,
} from '../../src/components/spiele/tinder-logik.js'

let gut = 0
let schlecht = 0
function pruefe(name, ok, info = '') {
  if (ok) {
    gut += 1
  } else {
    schlecht += 1
    console.log(`  FEHLER  ${name}${info ? ` — ${info}` : ''}`)
  }
}

/* ------------------------------------------------------------------ */
/* Kartenpool                                                          */
/* ------------------------------------------------------------------ */

const PFLICHT_TYPEN = ['modern', 'landhaus', 'schwarzgold', 'platte', 'griff', 'armatur', 'fehler', 'nicht', 'kombi', 'wissen']
const typKeys = AUFGABEN_TYPEN.map((t) => t.key)
pruefe('zehn Aufgabentypen', AUFGABEN_TYPEN.length === 10, String(AUFGABEN_TYPEN.length))
for (const key of PFLICHT_TYPEN) pruefe(`Typ ${key} vorhanden`, typKeys.includes(key))
for (const t of AUFGABEN_TYPEN) pruefe(`Typ ${t.key} hat Titel`, typeof t.titel === 'string' && t.titel.length > 3)

pruefe('mindestens 120 Karten', KARTEN.length >= 120, String(KARTEN.length))
const ids = new Set(KARTEN.map((k) => k.id))
pruefe('Karten-IDs eindeutig', ids.size === KARTEN.length)

for (const key of typKeys) {
  const karten = KARTEN.filter((k) => k.typ === key)
  pruefe(`${key}: mindestens 12 Karten`, karten.length >= 12, String(karten.length))
  pruefe(`${key}: JA-Karten`, karten.some((k) => k.ja === true))
  pruefe(`${key}: NEIN-Karten`, karten.some((k) => k.ja === false))
  for (const s of [1, 2, 3]) pruefe(`${key}: Stufe ${s} vorhanden`, karten.some((k) => k.stufe === s))
}

let kartenFehler = 0
for (const k of KARTEN) {
  const ok =
    typeof k.id === 'string' &&
    typKeys.includes(k.typ) &&
    typeof k.ja === 'boolean' &&
    [1, 2, 3].includes(k.stufe) &&
    typeof k.name === 'string' &&
    k.name.length > 1 &&
    Array.isArray(k.fakten) &&
    typeof k.warum === 'string' &&
    k.warum.length >= 10 &&
    k.warum.length <= 110 &&
    BILDER.includes(k.bild) &&
    (k.farben === undefined || (Array.isArray(k.farben) && k.farben.every((f) => /^#[0-9a-f]{6}$/i.test(f.f) && f.t)))
  if (!ok) {
    kartenFehler += 1
    pruefe(`Karte ${k.id} gueltig`, false, JSON.stringify(k).slice(0, 120))
  }
}
pruefe('alle Karten mit Loesung, Typ, Stufe, Erklaerung, Bild', kartenFehler === 0, `${kartenFehler} ungueltig`)

/* ------------------------------------------------------------------ */
/* Aufgabenfolge                                                       */
/* ------------------------------------------------------------------ */

function simuliereFolge(saat, anzahl, antwortVon = (k) => k.ja) {
  let z = rundeErzeugen(zufallMitSaat(saat))
  const eintraege = [z.aktuell]
  const ereignisse = []
  for (let i = 1; i < anzahl; i += 1) {
    const e = antwortWerten(z, antwortVon(z.aktuell.karte, i), 700)
    ereignisse.push(e)
    z = e.zustand
    eintraege.push(z.aktuell)
  }
  return { eintraege, ereignisse, z }
}

let direkteWiederholung = 0
let kartenWiederholung = 0
let blockFalsch = 0
let gleicheZuLang = 0
let steigtNicht = 0
let wenigTypen = 0
const alleTypenGesehen = new Set()
for (let saat = 1; saat <= 200; saat += 1) {
  const { eintraege } = simuliereFolge(saat, 40)
  const gesehen = new Set()
  const typen = new Set()
  let blockLaenge = 0
  let lauf = 1
  for (let i = 0; i < eintraege.length; i += 1) {
    const e = eintraege[i]
    typen.add(e.typ)
    alleTypenGesehen.add(e.typ)
    if (gesehen.has(e.karte.id)) kartenWiederholung += 1
    gesehen.add(e.karte.id)
    if (e.karte.typ !== e.typ) blockFalsch += 1
    if (i > 0) {
      const vor = eintraege[i - 1]
      if (e.neu) {
        if (e.typ === vor.typ) direkteWiederholung += 1
        if (blockLaenge < KARTEN_MIN || blockLaenge > KARTEN_MAX) blockFalsch += 1
        blockLaenge = 0
      } else if (e.typ !== vor.typ) {
        blockFalsch += 1
      }
      lauf = e.karte.ja === vor.karte.ja ? lauf + 1 : 1
      if (lauf > 3) gleicheZuLang += 1
    } else if (!e.neu) {
      blockFalsch += 1
    }
    blockLaenge += 1
  }
  if (typen.size < 5) wenigTypen += 1
  const mittel = (von, bis) => eintraege.slice(von, bis).reduce((s, e) => s + e.stufe, 0) / (bis - von)
  if (!(mittel(0, 6) < mittel(6, 14) && mittel(6, 14) < mittel(14, 30))) steigtNicht += 1
}
pruefe('Runde bringt mehrere Typen (>= 5 in 40 Karten)', wenigTypen === 0, `${wenigTypen} Laeufe mit weniger`)
pruefe('kein Typ direkt doppelt', direkteWiederholung === 0, String(direkteWiederholung))
pruefe('keine Kartenwiederholung je Runde', kartenWiederholung === 0, String(kartenWiederholung))
pruefe('Bloecke 4–6 Karten, Karte passt zum Typ', blockFalsch === 0, String(blockFalsch))
pruefe('hoechstens 3 gleiche Antworten in Folge', gleicheZuLang === 0, String(gleicheZuLang))
pruefe('Schwierigkeit steigt (Mittel je Abschnitt)', steigtNicht === 0, `${steigtNicht} Laeufe ohne Anstieg`)
pruefe('ueber viele Runden kommt jeder Typ vor', alleTypenGesehen.size === 10, String(alleTypenGesehen.size))
pruefe('stufeFuer steigt monoton', [0, 5, 6, 13, 14, 40].map(stufeFuer).join() === '1,1,2,2,3,3')

{
  const { eintraege } = simuliereFolge(7, 20)
  pruefe('erste Karte ist Stufe 1', eintraege[0].stufe === 1)
  pruefe('Karte 20 ist Stufe 3', eintraege[19].stufe === 3, String(eintraege[19].stufe))
}

{
  /* Pool erschoepfen: kein Absturz, Typwechsel bleibt. */
  const { eintraege } = simuliereFolge(3, KARTEN.length + 30)
  let doppelt = 0
  for (let i = 1; i < eintraege.length; i += 1) if (eintraege[i].neu && eintraege[i].typ === eintraege[i - 1].typ) doppelt += 1
  const ersteRunde = new Set(eintraege.slice(0, KARTEN.length).map((e) => e.karte.id))
  pruefe('ganzer Pool ohne Absturz und ohne Typdoppel', doppelt === 0 && eintraege.length === KARTEN.length + 30, String(doppelt))
  pruefe('erst nach erschoepftem Pool Wiederholung', ersteRunde.size >= KARTEN.length - 12, String(ersteRunde.size))
}

{
  const z = rundeErzeugen(zufallMitSaat(9))
  const a = naechsteAufgabe(z)
  pruefe('naechsteAufgabe liefert Typ mit Titel', a && typeof a.titel === 'string')
}

{
  const a = simuliereFolge(42, 30).eintraege.map((e) => e.karte.id).join()
  const b = simuliereFolge(42, 30).eintraege.map((e) => e.karte.id).join()
  const c = simuliereFolge(43, 30).eintraege.map((e) => e.karte.id).join()
  pruefe('gleiche Saat, gleiche Folge', a === b)
  pruefe('andere Saat, andere Folge', a !== c)
}

/* ------------------------------------------------------------------ */
/* Wertung                                                             */
/* ------------------------------------------------------------------ */

{
  let z = rundeErzeugen(zufallMitSaat(11))
  const combos = []
  const punkte = []
  for (let i = 0; i < 16; i += 1) {
    const karte = z.aktuell.karte
    const e = antwortWerten(z, karte.ja, 2000)
    combos.push(e.combo)
    punkte.push(e.punkte)
    pruefe(`richtig ${i + 1}: Punkte = punkteFuer`, e.punkte === punkteFuer(e.combo, 2000, karte.stufe), `${e.punkte}`)
    pruefe(`richtig ${i + 1}: keine Strafe`, e.strafeMs === 0 && e.richtig)
    z = e.zustand
  }
  pruefe('Combo zaehlt 1..16', combos.join() === Array.from({ length: 16 }, (_, i) => i + 1).join(), combos.join())
  pruefe('Combo-Faktoren 1 / 1,5 / 2 / 2,5 / 3', [1, 2, 3, 5, 6, 9, 10, 14, 15, 40].map(faktorFuer).join() === '1,1,1.5,1.5,2,2,2.5,2.5,3,3')
  pruefe('Punkte steigen mit der Combo', punkte[15] > punkte[0], `${punkte[0]} → ${punkte[15]}`)
  pruefe('Zustand summiert Punkte', z.punkte === punkte.reduce((s, p) => s + p, 0))
  pruefe('beste Combo 16', z.besteCombo === 16)

  const karte = z.aktuell.karte
  const falsch = antwortWerten(z, !karte.ja, 300)
  pruefe('falsch: 0 Punkte', falsch.punkte === 0)
  pruefe('falsch: combo 0', falsch.combo === 0 && falsch.zustand.combo === 0)
  pruefe('falsch: Strafe 2 s', falsch.strafeMs === STRAFE_MS && STRAFE_MS === 2000)
  pruefe('falsch: Combo-Verlust gemeldet', falsch.comboVerloren && falsch.comboVorher === 16)
  pruefe('falsch: Erklaerung mitgeliefert', falsch.warum === karte.warum && falsch.loesung === karte.ja)
  pruefe('falsch: Meldung nennt verlorene Combo', meldungFuer(falsch).text.includes('16'))
  pruefe('falsch: Runde und Strafe gezaehlt', falsch.zustand.runden === 17 && falsch.zustand.strafeMs === 2000 && falsch.zustand.falsche === 1)

  const danach = antwortWerten(falsch.zustand, falsch.zustand.aktuell.karte.ja, 2000)
  pruefe('nach Fehler startet Combo bei 1', danach.combo === 1 && danach.faktor === 1)
}

pruefe('Tempobonus schnell', punkteFuer(1, 500, 1) === 80 + TEMPO_SCHNELL)
pruefe('Tempobonus zuegig', punkteFuer(1, 1200, 1) === 100)
pruefe('kein Tempobonus langsam', punkteFuer(1, 3000, 1) === 80)
pruefe('Stufenbonus', punkteFuer(1, 3000, 3) === 100 && punkteFuer(1, 3000, 2) === 90)
pruefe('Combo 6: 160 Basis', punkteFuer(6, 3000, 1) === 160)
pruefe('ungueltige Zeit gibt keinen Bonus', punkteFuer(1, -5, 1) === 80 && punkteFuer(1, NaN, 1) === 80)

{
  let maxGesehen = 0
  for (let combo = 0; combo <= 200; combo += 1) {
    for (const ms of [0, 1, 400, 899, 900, 1499, 5000]) {
      for (const s of [1, 2, 3]) maxGesehen = Math.max(maxGesehen, punkteFuer(combo, ms, s))
    }
  }
  pruefe('Punktdecke je Antwort eingehalten', maxGesehen <= MAX_JE_ANTWORT, String(maxGesehen))
  pruefe('Punktdecke unter Server-maxJeRunde 340', MAX_JE_ANTWORT <= 340)
}

{
  const { ereignisse } = simuliereFolge(5, 60)
  pruefe('Simulation: jede Antwort unter Decke', ereignisse.every((e) => e.punkte <= MAX_JE_ANTWORT))
}

/* ------------------------------------------------------------------ */
/* Server-Simulation (Info)                                            */
/* ------------------------------------------------------------------ */

const SERVER_JETZT = { dauerMs: 30000, msJeRunde: 200, maxJeRunde: 340, plausibel: 12000, hart: 26000 }
const SERVER_NEU = { dauerMs: 30000, msJeRunde: 450, maxJeRunde: 330, plausibel: 10000, hart: 16000 }
const STRAFE_DECKEL_MS = 10000
const LATENZ_MS = 250

function spiele(saat, { reaktion, trefferQuote }) {
  const zufall = zufallMitSaat(saat)
  let z = rundeErzeugen(zufallMitSaat(saat * 7 + 1))
  let uhr = z.aktuell.neu ? AUFGABE_SPERRE_MS : 0
  let ende = SPIELZEIT_MS
  let strafe = 0
  while (true) {
    const ms = reaktion(zufall)
    if (uhr + ms >= ende) break
    uhr += ms
    const karte = z.aktuell.karte
    const richtig = zufall() < trefferQuote
    const e = antwortWerten(z, richtig ? karte.ja : !karte.ja, ms)
    if (e.strafeMs) {
      const wirkt = Math.min(e.strafeMs, STRAFE_DECKEL_MS - strafe)
      strafe += wirkt
      ende -= wirkt
    }
    z = e.zustand
    uhr += ABSTAND_MS + (z.aktuell.neu ? AUFGABE_SPERRE_MS : 0)
    if (uhr >= ende) break
  }
  const dauer = Math.max(uhr, ende) + LATENZ_MS
  return { punkte: z.punkte, runden: z.runden, dauer, falsche: z.falsche, besteCombo: z.besteCombo }
}

function verdacht(r, s) {
  const gruende = []
  if (r.dauer < s.dauerMs * 0.5) gruende.push('dauer')
  if (r.dauer < r.runden * s.msJeRunde) gruende.push('dauer/runde')
  if (r.punkte > r.runden * s.maxJeRunde) gruende.push('runden')
  if (r.punkte > s.hart) gruende.push('hart')
  else if (r.punkte > s.plausibel) gruende.push('plausibel')
  return gruende.join('+') || 'ok'
}

function bericht(name, profil, laeufe = 300) {
  const ergebnisse = Array.from({ length: laeufe }, (_, i) => spiele(i + 1, profil))
  ergebnisse.sort((a, b) => a.punkte - b.punkte)
  const q = (p) => ergebnisse[Math.min(ergebnisse.length - 1, Math.floor(p * ergebnisse.length))]
  const max = ergebnisse[ergebnisse.length - 1]
  const schnitt = ergebnisse.reduce((s, r) => s + r.punkte, 0) / ergebnisse.length
  const jeRunde = Math.max(...ergebnisse.map((r) => r.punkte / r.runden))
  const minMsJeRunde = Math.min(...ergebnisse.map((r) => r.dauer / r.runden))
  console.log(`  ${name}`)
  console.log(`    Punkte  Schnitt ${Math.round(schnitt)}  Median ${q(0.5).punkte}  P95 ${q(0.95).punkte}  Max ${max.punkte}`)
  console.log(`    Runden  bis ${Math.max(...ergebnisse.map((r) => r.runden))}  Punkte/Runde bis ${Math.round(jeRunde)}  ms/Runde ab ${Math.round(minMsJeRunde)}`)
  console.log(`    Dauer   ab ${Math.min(...ergebnisse.map((r) => r.dauer))} ms  (Max-Lauf: ${max.runden} Runden, ${max.falsche} falsch, Combo ${max.besteCombo})`)
  const zaehle = (s) => {
    const m = {}
    for (const r of ergebnisse) {
      const v = verdacht(r, s)
      m[v] = (m[v] || 0) + 1
    }
    return JSON.stringify(m)
  }
  console.log(`    Server jetzt ${zaehle(SERVER_JETZT)}   Vorschlag ${zaehle(SERVER_NEU)}`)
  return { max, schnitt }
}

console.log('\nServer-Simulation (Info, kein Fehler)')
const gleich = (von, bis) => (zufall) => von + zufall() * (bis - von)
const ehrlich = bericht('sehr guter ehrlicher Lauf (600–900 ms, 95 % richtig)', { reaktion: gleich(600, 900), trefferQuote: 0.95 })
bericht('Top-Mensch (450–650 ms, 98 % richtig)', { reaktion: gleich(450, 650), trefferQuote: 0.98 })
const bot = bericht('Extremfall Bot (0 ms, 100 % richtig)', { reaktion: () => 0, trefferQuote: 1 })
bericht('Extremfall Rater (0 ms, 50 % richtig)', { reaktion: () => 0, trefferQuote: 0.5 })
pruefe('Info: Bot liegt ueber ehrlichem Maximum', bot.max.punkte >= ehrlich.max.punkte)

console.log(`\n${gut} ok, ${schlecht} fehlgeschlagen`)
if (schlecht) process.exit(1)
