/**
 * KUECHEN-FIT — Logiktest ohne Browser.
 *
 *   node scripts/spiele/fit-logik-test.mjs
 *
 * Prueft Schwierigkeitskurve, Kombo- und Perfect-Fit-Wertung, den
 * Teilegenerator mit injizierbarem Zufall, Drehungen, Nachschub und einen
 * vollen Ablauf. Ein einfacher Bot misst zum Schluss Punkte je Teil gegen
 * die Servergrenzen (nur Info, kein Fehler).
 */
import {
  BASIS_TYPEN,
  BREITE,
  FORMEN,
  HOEHE,
  KOMPLEX_TYPEN,
  MAX_JE_TEIL,
  MUELL_CODE,
  PROBLEM_TYPEN,
  TEILE,
  TYPEN,
  drehen,
  einrasten,
  erzeugeZiehung,
  fallTiefe,
  festsetzen,
  geist,
  leeresFeld,
  nachschub,
  neuesSpiel,
  passt,
  schwierigkeit,
  spawnen,
  wertung,
} from '../../src/components/spiele/fit-logik.js'
/* Die Servergrenzen werden gelesen, nicht abgeschrieben: so kann der Test
   nicht stillschweigend an der echten Pruefung vorbeilaufen. */
import { SPIELE } from '../../api/_terminal-kern.js'

const SERVER = SPIELE.kuechen_fit

let gut = 0
let schlecht = 0
function pruefe(name, ok, info = '') {
  if (ok) {
    gut += 1
    console.log(`  ok    ${name}`)
  } else {
    schlecht += 1
    console.log(`  FEHLT ${name}${info ? ` — ${info}` : ''}`)
  }
}

function zufallMit(startwert) {
  let a = startwert >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ */
console.log('\nSchwierigkeit')
const kurve = [0, 20, 40, 60].map((s) => ({ s, ...schwierigkeit(s) }))
for (const k of kurve) {
  console.log(`        ${String(k.s).padStart(2)} s: Stufe ${k.stufe}, fall ${k.fallMs} ms, lock ${k.lockMs} ms, komplex ${k.komplexAnteil}, problem ${k.problemChance}, nachschub alle ${k.nachschubAlle || '–'}`)
}
const streng = (feld, auf) =>
  kurve.every((k, i) => i === 0 || (auf ? k[feld] > kurve[i - 1][feld] : k[feld] < kurve[i - 1][feld]))
pruefe('Stufe steigt streng bei 0/20/40/60 s', streng('stufe', true), kurve.map((k) => k.stufe).join('/'))
pruefe('Fallzeit sinkt streng bei 0/20/40/60 s', streng('fallMs', false), kurve.map((k) => k.fallMs).join('/'))
pruefe('Einrastzeit sinkt streng bei 0/20/40/60 s', streng('lockMs', false), kurve.map((k) => k.lockMs).join('/'))
pruefe('Komplexanteil steigt streng bei 0/20/40/60 s', streng('komplexAnteil', true))
pruefe('Problemchance steigt bei 20/40/60 s', kurve[2].problemChance > kurve[1].problemChance && kurve[3].problemChance > kurve[2].problemChance)
pruefe('0 s ist leicht: Stufe 1, >= 700 ms, keine Sonderteile, kein Nachschub', kurve[0].stufe === 1 && kurve[0].fallMs >= 700 && kurve[0].komplexAnteil === 0 && kurve[0].problemChance === 0 && kurve[0].nachschubAlle === 0)
pruefe('bis 9,9 s bleibt es Stufe 1', schwierigkeit(9.9).stufe === 1)
pruefe('bei 60 s ist es deutlich schneller (Fallzeit <= 30 % vom Start)', kurve[3].fallMs <= kurve[0].fallMs * 0.3)
pruefe('bei 60 s drueckt Nachschub', kurve[3].nachschubAlle > 0)
{
  let ok = true
  let vorher = schwierigkeit(0)
  for (let s = 1; s <= 600; s += 1) {
    const d = schwierigkeit(s)
    if (d.stufe < vorher.stufe || d.fallMs > vorher.fallMs || d.lockMs > vorher.lockMs || d.komplexAnteil < vorher.komplexAnteil || d.problemChance < vorher.problemChance) ok = false
    vorher = d
  }
  pruefe('Kurve ist monoton bis 600 s', ok)
  pruefe('Deckel: Stufe 20, Fallzeit >= 90 ms, Sonderteile <= 42 %', vorher.stufe === 20 && vorher.fallMs >= 90 && vorher.komplexAnteil + vorher.problemChance <= 0.42)
}
pruefe('viele Reihen heben die Stufe auch frueh', schwierigkeit(0, 24).stufe === 4)
pruefe('ungueltige Zeit wird wie 0 behandelt', schwierigkeit(Number.NaN).stufe === 1 && schwierigkeit(-5).stufe === 1)

/* ------------------------------------------------------------------ */
console.log('\nWertung')
const reihen = [1, 2, 3, 4].map((n) => wertung({ anzahl: n, perfekt: false, level: 1, kette: 0 }))
pruefe('1–4 Reihen: 100 / 300 / 600 / 1000', reihen.join('/') === '100/300/600/1000', reihen.join('/'))
pruefe('mehr Reihen auf einmal bringen je Reihe mehr', reihen.every((p, i) => i === 0 || p / (i + 1) > reihen[i - 1] / i))
pruefe('Levelfaktor: 4 Reihen in Level 3 = 3000', wertung({ anzahl: 4, perfekt: false, level: 3, kette: 0 }) === 3000)
pruefe('Faktor endet bei 5', wertung({ anzahl: 1, perfekt: false, level: 9, kette: 0 }) === 500)
pruefe('ohne Reihe keine Punkte, auch nicht mit Kette oder perfekt', wertung({ anzahl: 0, perfekt: true, level: 5, kette: 4 }) === 0)
pruefe('Kette: zweites Teil in Folge +150', wertung({ anzahl: 1, perfekt: false, level: 1, kette: 2 }) === 250)
pruefe('Kette gedeckelt bei 10 Gliedern', wertung({ anzahl: 1, perfekt: false, level: 1, kette: 30 }) === 100 + 750)
const perfekt = [1, 2, 3, 4].map((n) => wertung({ anzahl: n, perfekt: true, level: 1, kette: 0 }) - reihen[n - 1])
pruefe('Perfect-Fit-Bonus 500 / 750 / 1000 / 1250', perfekt.join('/') === '500/750/1000/1250', perfekt.join('/'))
pruefe('Perfect Fit bei einer Reihe verdreifacht+ die Reihe', wertung({ anzahl: 1, perfekt: true, level: 1, kette: 0 }) === 600)
pruefe(`MAX_JE_TEIL ist ${MAX_JE_TEIL}`, MAX_JE_TEIL === (1000 + 1250) * 5 + 750)
{
  /* Echter Perfect Fit: Luecke der Breite 4 in der untersten Reihe mit I schliessen. */
  const feld = leeresFeld()
  for (let x = 0; x < BREITE; x += 1) if (x < 3 || x > 6) feld[HOEHE - 1][x] = 1
  const teil = { typ: 'I', dreh: 0, x: 3, y: HOEHE - 2 }
  const r = einrasten(feld, teil)
  pruefe('einrasten erkennt Perfect Fit', r.perfekt && r.reihen.length === 1 && r.feld[HOEHE - 1].every((c) => c === 0))
  const halb = einrasten(feld, { typ: 'L', dreh: 2, x: 3, y: HOEHE - 3 })
  pruefe('Teil, das stehen bleibt, ist kein Perfect Fit', !halb.perfekt)
}
{
  const feld = leeresFeld()
  for (let y = HOEHE - 4; y < HOEHE; y += 1) for (let x = 1; x < BREITE; x += 1) feld[y][x] = 1
  const teil = { typ: 'I', dreh: 1, x: -2, y: HOEHE - 4 }
  const lage = FORMEN.I[1].map(([x, y]) => [teil.x + x, teil.y + y])
  const passend = lage.every(([x]) => x === 0)
  const r = passend ? einrasten(feld, teil) : { reihen: [], perfekt: false }
  pruefe('senkrechte Arbeitsplatte raeumt 4 Reihen perfekt', r.reihen.length === 4 && r.perfekt, JSON.stringify(lage))
}

/* ------------------------------------------------------------------ */
console.log('\nTeile und Generator')
pruefe('13 Teile: 8 Basis, 3 komplex, 2 Problem', TYPEN.length === 13 && BASIS_TYPEN.length === 8 && KOMPLEX_TYPEN.length === 3 && PROBLEM_TYPEN.length === 2)
pruefe('Codes eindeutig und nicht Altbestand', new Set(TYPEN.map((t) => TEILE[t].code)).size === 13 && TYPEN.every((t) => TEILE[t].code !== MUELL_CODE))
{
  let ok = true
  for (const t of TYPEN) {
    for (const lage of FORMEN[t]) {
      if (lage.length !== TEILE[t].zellen.length) ok = false
      if (lage.some(([x, y]) => x < 0 || y < 0 || x >= TEILE[t].box || y >= TEILE[t].box)) ok = false
      if (new Set(lage.map(([x, y]) => `${x},${y}`)).size !== lage.length) ok = false
    }
    const vier = FORMEN[t][3].map(([x, y]) => [TEILE[t].box - 1 - y, x])
    const norm = (l) => l.map(([x, y]) => `${x},${y}`).sort().join(' ')
    if (norm(vier) !== norm(FORMEN[t][0])) ok = false
  }
  pruefe('alle Drehlagen bleiben in der Box und schliessen den Kreis', ok)
  pruefe('jedes Teil erscheint im leeren Feld und laesst sich drehen', TYPEN.every((t) => {
    const s = spawnen(leeresFeld(), t)
    return s && (t === 'O' || drehen(leeresFeld(), { ...s, y: 5 }, 1))
  }))
}
{
  const ziehen = erzeugeZiehung(zufallMit(11))
  let ok = true
  for (let b = 0; b < 50; b += 1) {
    const beutel = Array.from({ length: 8 }, () => ziehen())
    if (beutel.slice().sort().join() !== BASIS_TYPEN.slice().sort().join()) ok = false
  }
  pruefe('ohne Schwierigkeit: 8er-Beutel mit den vertrauten Teilen', ok)
  const a = erzeugeZiehung(zufallMit(4))
  const b = erzeugeZiehung(zufallMit(4))
  const c = erzeugeZiehung(zufallMit(5))
  const folge = (z) => Array.from({ length: 64 }, () => z(schwierigkeit(60))).join('')
  const fa = folge(a)
  pruefe('gleicher Zufall, gleiche Folge', fa === folge(b))
  pruefe('anderer Zufall, andere Folge', fa !== folge(c))
}
for (const sek of [0, 30, 60, 120]) {
  const schw = schwierigkeit(sek)
  const ziehen = erzeugeZiehung(zufallMit(100 + sek))
  const N = 20000
  let komplex = 0
  let problem = 0
  let doppelt = 0
  let vorher = null
  for (let i = 0; i < N; i += 1) {
    const t = ziehen(schw)
    const g = TEILE[t].gruppe
    if (g === 'komplex') komplex += 1
    if (g === 'problem') {
      problem += 1
      if (vorher === 'problem') doppelt += 1
    }
    vorher = g
  }
  const k = komplex / N
  const p = problem / N
  const erwartetP = schw.problemChance * (1 - schw.problemChance)
  pruefe(
    `${sek} s: Sonderteile in plausibler Rate (komplex ${(k * 100).toFixed(1)} %, problem ${(p * 100).toFixed(1)} %)`,
    Math.abs(p - erwartetP) < 0.012 && k >= schw.komplexAnteil * 0.85 - 0.005 && k <= schw.komplexAnteil + schw.problemChance + 0.01,
  )
  pruefe(`${sek} s: nie zwei Problemteile hintereinander`, doppelt === 0, `${doppelt}`)
  if (sek === 0) pruefe('0 s: nur die vertrauten acht Teile', komplex === 0 && problem === 0)
}

/* ------------------------------------------------------------------ */
console.log('\nNachschub und Ablauf')
{
  const feld = leeresFeld()
  feld[HOEHE - 1][0] = 3
  const n = nachschub(feld, zufallMit(3), 2)
  const unten = n.feld[HOEHE - 1]
  pruefe('Nachschub schiebt eine Altbestand-Reihe mit 2 Luecken ein', unten.filter((c) => c === 0).length === 2 && unten.filter((c) => c === MUELL_CODE).length === BREITE - 2)
  pruefe('alles rutscht eine Reihe hoch', n.feld[HOEHE - 2][0] === 3 && n.feld.length === HOEHE && !n.ueberlauf)
  const voll = leeresFeld()
  voll[0][4] = 1
  pruefe('liegt oben etwas, laeuft die Kueche ueber', nachschub(voll, zufallMit(1), 1).ueberlauf)
}
{
  let stand = neuesSpiel(zufallMit(9))
  pruefe('neues Spiel beginnt in Stufe 1 mit einem Basisteil', stand.stufe === 1 && TEILE[stand.aktuell.typ].gruppe === 'basis' && TEILE[stand.naechstes].gruppe === 'basis')
  let nachschubGesehen = 0
  let stufeAuf = 0
  let sek = 0
  for (let i = 0; i < 400 && !stand.vorbei; i += 1) {
    stand = { ...stand, aktuell: geist(stand.feld, stand.aktuell) }
    sek += 5
    const { stand: neu, ereignis } = festsetzen(stand, sek)
    if (ereignis.nachschub) nachschubGesehen += 1
    if (ereignis.stufeAuf) stufeAuf += 1
    stand = neu
  }
  pruefe('ohne Steuerung endet der Lauf irgendwann', stand.vorbei)
  pruefe('Ablauf meldet Stufenwechsel', stufeAuf > 0 && stand.stufe > 1, `Stufe ${stand.stufe}`)
  const s2 = neuesSpiel(zufallMit(9))
  const r = festsetzen({ ...s2, aktuell: geist(s2.feld, s2.aktuell) }, 0)
  pruefe('festsetzen veraendert den alten Stand nicht', s2.stuecke === 0 && s2.feld.every((row) => row.every((c) => c === 0)) && r.stand.stuecke === 1)
  void nachschubGesehen
}

/* ------------------------------------------------------------------ */
/* Bot: probiert alle Lagen und Spalten, bewertet das Feld heuristisch.  */
/* Nur Info fuer die Servergrenzen.                                     */
/* ------------------------------------------------------------------ */
function feldWert(feld, reihenWeg) {
  const hoehen = new Array(BREITE).fill(0)
  let loecher = 0
  for (let x = 0; x < BREITE; x += 1) {
    let dach = false
    for (let y = 0; y < HOEHE; y += 1) {
      if (feld[y][x]) {
        if (!dach) hoehen[x] = HOEHE - y
        dach = true
      } else if (dach) loecher += 1
    }
  }
  const summe = hoehen.reduce((a, b) => a + b, 0)
  let buckel = 0
  for (let x = 1; x < BREITE; x += 1) buckel += Math.abs(hoehen[x] - hoehen[x - 1])
  const max = Math.max(...hoehen)
  return -0.51 * summe + 0.76 * reihenWeg - 0.36 * loecher - 0.18 * buckel - (max > HOEHE - 5 ? 5 * (max - HOEHE + 5) : 0)
}

function botLauf(seed, sekJeTeil, maxSek = 540) {
  let stand = neuesSpiel(zufallMit(seed))
  let sek = 0
  let maxTeil = 0
  let fall = 0
  while (!stand.vorbei && sek < maxSek) {
    let bestes = null
    for (let dreh = 0; dreh < 4; dreh += 1) {
      for (let x = -3; x < BREITE; x += 1) {
        const t = { ...stand.aktuell, dreh, x, y: stand.aktuell.y }
        if (!passt(stand.feld, t)) continue
        const g = { ...t, y: t.y + fallTiefe(stand.feld, t) }
        const e = einrasten(stand.feld, g)
        const w = feldWert(e.feld, e.reihen.length) + (e.perfekt ? 0.3 : 0)
        if (!bestes || w > bestes.w) bestes = { w, g }
      }
    }
    if (!bestes) break
    sek += sekJeTeil
    const zellen = bestes.g.y - stand.aktuell.y
    const fallP = Math.max(0, zellen) * 2
    fall += fallP
    const { stand: neu, ereignis } = festsetzen({ ...stand, aktuell: bestes.g }, sek)
    maxTeil = Math.max(maxTeil, ereignis.punkte + fallP)
    stand = neu
  }
  return { punkte: stand.punkte + fall, runden: stand.stuecke, sek, reihen: stand.reihen, perfekte: stand.perfekte, maxTeil, stufe: stand.stufe, vorbei: stand.vorbei }
}

console.log(
  `\nBot (gegen die Servergrenzen: ${SERVER.msJeRunde} ms/Runde, ${SERVER.maxJeRunde}/Runde, ` +
    `plausibel ${SERVER.plausibel}, hart ${SERVER.hart})`,
)
const laeufe = []
for (const sekJeTeil of [0.6, 1.0, 1.5]) {
  for (const seed of [1, 2, 3, 4, 5]) {
    const r = botLauf(seed, sekJeTeil)
    laeufe.push(r)
    console.log(
      `        ${sekJeTeil.toFixed(1)} s/Teil, Seed ${seed}: ${r.punkte} Punkte, ${r.runden} Teile, ${r.reihen} Reihen, ${r.perfekte} perfekt, ${r.sek.toFixed(0)} s, Stufe ${r.stufe}, ${(r.punkte / Math.max(1, r.runden)).toFixed(0)}/Teil, bestes Teil ${r.maxTeil}${r.vorbei ? '' : ' (Zeitende)'}`,
    )
  }
}
const schnitt = Math.max(...laeufe.map((r) => r.punkte / Math.max(1, r.runden)))
console.log(`        hoechster Schnitt je Teil: ${schnitt.toFixed(0)}, hoechster Lauf: ${Math.max(...laeufe.map((r) => r.punkte))}`)
pruefe('Bot kommt ueber die ersten 20 Teile hinaus (Anfang bleibt spielbar)', laeufe.every((r) => r.runden > 20))

/* Die Serverpruefungen aus laufVerdacht gegen den besten Bot-Lauf. Faellt eine
   davon, wuerde ein ehrlicher Ausnahmelauf als Verdachtsfall aus der Rangliste
   fliegen — und das waere schlimmer als ein durchgerutschter Betrueger. */
const besterLauf = laeufe.reduce((a, b) => (b.punkte > a.punkte ? b : a))
pruefe(
  `Server: Schnitt je Teil unter maxJeRunde ${SERVER.maxJeRunde}`,
  laeufe.every((r) => r.punkte / Math.max(1, r.runden) < SERVER.maxJeRunde),
  schnitt.toFixed(0),
)
pruefe(
  `Server: Teile brauchen mindestens msJeRunde ${SERVER.msJeRunde}`,
  laeufe.every((r) => (r.sek * 1000) / Math.max(1, r.runden) >= SERVER.msJeRunde),
  laeufe.map((r) => Math.round((r.sek * 1000) / Math.max(1, r.runden))).join(','),
)
pruefe(
  `Server: bester Bot-Lauf unter plausibel ${SERVER.plausibel}`,
  besterLauf.punkte <= SERVER.plausibel,
  `${besterLauf.punkte}`,
)
/* Der teuerste denkbare Einzelzug muss in wenige Runden passen — sonst steht
   ein kurzer Lauf mit einem grossen Abraeumer sofort unter Verdacht. */
pruefe(
  `Server: bestes Teil ${Math.max(...laeufe.map((r) => r.maxTeil))} passt in drei Runden Decke`,
  Math.max(...laeufe.map((r) => r.maxTeil)) <= SERVER.maxJeRunde * 3,
  `${SERVER.maxJeRunde * 3}`,
)

console.log(`\n${gut} ok, ${schlecht} fehlgeschlagen`)
process.exit(schlecht ? 1 : 0)
