/**
 * VIDEKO JUMP — Logiktest ohne Browser.
 *
 *   node scripts/spiele/jump-logik-test.mjs
 *
 * Prueft Erreichbarkeit des Plattengenerators, messbare Abwechslung,
 * Eingabelogik (Finger, Tasten, Neigung), Sonderplatten und die Wertung
 * gegen die Servergrenzen.
 */
import {
  ABSCHNITTE,
  BREITE_MIN,
  BROECKEL_HAELT,
  DY_GRENZE,
  MAX_JE_LANDUNG,
  NEIGUNG_AUS,
  NEIGUNG_EIN,
  SCHWERE,
  SPRUNG_HOEHE,
  eingabeAus,
  erreichbar,
  neigungGrad,
  neigungRichtung,
  neuesSpiel,
  plattenErzeugen,
  ringAbstand,
  schritt,
  seiteVon,
  yOben,
  yUnten,
  zerbrechlich,
  zufallMit,
} from '../../src/components/spiele/jump-logik.js'

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

const SEEDS = [1, 7, 42, 1234, 99991, 2147483000]
const ANZAHL = 2000

/* ------------------------------------------------------------------ */
console.log('\nErreichbarkeit')
for (const seed of SEEDS) {
  const platten = plattenErzeugen(seed, ANZAHL)
  const kette = platten.filter((p) => p.kette)
  let anker = kette[0]
  let fehler = null
  let zweiBrueche = 0
  let hoechsteDy = 0
  for (let i = 1; i < kette.length; i += 1) {
    const p = kette[i]
    const dy = yOben(p) - yUnten(anker)
    hoechsteDy = Math.max(hoechsteDy, dy)
    if (!fehler && (dy > DY_GRENZE + 1e-9 || !erreichbar(anker, p))) fehler = `Glied ${i} (${p.art}) dy=${dy.toFixed(3)}`
    if (zerbrechlich(p.art) && zerbrechlich(kette[i - 1].art)) zweiBrueche += 1
    if (!zerbrechlich(p.art)) anker = p
  }
  pruefe(`Seed ${seed}: ${kette.length - 1} Kettenglieder vom Anker erreichbar`, kette.length - 1 === ANZAHL && !fehler, fehler || `${kette.length - 1}`)
  pruefe(`Seed ${seed}: groesster Ankerabstand ${hoechsteDy.toFixed(3)} <= ${DY_GRENZE.toFixed(3)} < Sprunghoehe`, hoechsteDy <= DY_GRENZE + 1e-9 && DY_GRENZE < SPRUNG_HOEHE)
  pruefe(`Seed ${seed}: nie zwei zerbrechliche Kettenglieder hintereinander`, zweiBrueche === 0, `${zweiBrueche}`)

  const kaputt = platten.filter(
    (p) =>
      p.b < BREITE_MIN - 1e-9 ||
      p.x - p.b / 2 < -1e-9 ||
      p.x + p.b / 2 > 1 + 1e-9 ||
      (p.art === 'bewegt' && (p.xMin > p.xMax || p.xMin < p.b / 2 - 1e-9 || p.xMax > 1 - p.b / 2 + 1e-9 || !p.v)) ||
      (p.art === 'lift' && (p.yMin > p.y || p.y > p.yMax || !p.v)),
  )
  pruefe(`Seed ${seed}: alle ${platten.length} Platten liegen im Feld, Bahnen gueltig`, kaputt.length === 0, `${kaputt.length} kaputt`)
  let steigt = true
  for (let i = 1; i < kette.length; i += 1) if (yUnten(kette[i]) <= yOben(kette[i - 1])) steigt = false
  pruefe(`Seed ${seed}: Kette steigt streng`, steigt)
}

/* Ein einfacher Bot folgt der Kette: kommt er mit echter Physik hoch? */
console.log('\nBot mit echter Physik')
function botLauf(seed, schritteMax = 120 * 240) {
  const stand = neuesSpiel(seed)
  let letzte = stand.platten[0]
  let punkteMax = 0
  for (let n = 0; n < schritteMax && !stand.vorbei; n += 1) {
    const s = stand.spieler
    const ziel = stand.platten
      .filter((p) => p.kette && !p.weg && yUnten(p) > letzte.y + 0.005)
      .sort((a, b) => a.y - b.y)[0]
    let richtung = 0
    if (ziel && s.y < ziel.y + SPRUNG_HOEHE) {
      const d = ringAbstand(s.x, ziel.x)
      const bremsweg = (s.vx * s.vx) / (2 * 8)
      if (Math.abs(d) > ziel.b * 0.2) richtung = Math.sign(d)
      if (Math.sign(s.vx) === Math.sign(d) && Math.abs(d) < bremsweg + 0.01) richtung = 0
    }
    for (const e of schritt(stand, richtung)) {
      if (e.art === 'landung') {
        /* Auch Zusatzplatten zaehlen: das naechste Ziel liegt immer darueber. */
        if (!e.platte.weg && e.platte.y > letzte.y - 1e-9) letzte = e.platte
        punkteMax = Math.max(punkteMax, e.punkte)
      }
    }
  }
  return { hoehe: stand.hoehe, runden: stand.runden, punkte: stand.punkte, punkteMax, zeit: stand.zeit, vorbei: stand.vorbei }
}
const botErgebnisse = SEEDS.map((s) => botLauf(s))
const hoch = botErgebnisse.filter((r) => r.hoehe >= 250).length
pruefe(
  `Bot erreicht in mindestens 4 von ${SEEDS.length} Laeufen HOEHE 250`,
  hoch >= 4,
  botErgebnisse.map((r) => r.hoehe).join(', '),
)
for (const [i, r] of botErgebnisse.entries()) {
  console.log(`        Seed ${SEEDS[i]}: HOEHE ${r.hoehe}, ${r.runden} Runden, ${r.punkte} Punkte, ${r.zeit.toFixed(0)} s`)
  pruefe(`Seed ${SEEDS[i]}: Punkte je Runde <= 400 (Server maxJeRunde)`, r.runden === 0 || r.punkte / r.runden <= 400, `${(r.punkte / Math.max(1, r.runden)).toFixed(0)}`)
  pruefe(`Seed ${SEEDS[i]}: keine Landung ueber MAX_JE_LANDUNG`, r.punkteMax <= MAX_JE_LANDUNG, `${r.punkteMax}`)
}
pruefe(`MAX_JE_LANDUNG ${MAX_JE_LANDUNG} <= 400`, MAX_JE_LANDUNG <= 400)

/* ------------------------------------------------------------------ */
console.log('\nAbwechslung')
const alleArten = new Map()
const alleAbschnitte = new Set()
for (const seed of SEEDS) {
  const kette = plattenErzeugen(seed, ANZAHL).filter((p) => p.kette && p.art !== 'boden')
  const arten = new Map()
  for (const p of kette) {
    arten.set(p.art, (arten.get(p.art) || 0) + 1)
    alleArten.set(p.art, (alleArten.get(p.art) || 0) + 1)
    alleAbschnitte.add(p.abschnitt)
  }
  pruefe(`Seed ${seed}: mindestens 6 Plattenarten in der Kette`, arten.size >= 6, [...arten.keys()].join(','))
  const haeufigste = Math.max(...arten.values()) / kette.length
  pruefe(`Seed ${seed}: keine Art ueber 70 %`, haeufigste <= 0.7, `${(haeufigste * 100).toFixed(0)} %`)

  const breiten = kette.map((p) => p.b)
  const b0 = Math.min(...breiten)
  const b1 = Math.max(...breiten)
  pruefe(`Seed ${seed}: Breiten streuen (schmalste ${b0.toFixed(3)}, breiteste ${b1.toFixed(3)})`, b1 / b0 >= 2.5)

  const dys = kette.slice(1).map((p, i) => p.y - kette[i].y)
  const dxs = kette.slice(1).map((p, i) => ringAbstand(kette[i].x, p.x))
  let schlimmste = 0
  for (let periode = 1; periode <= 60; periode += 1) {
    let gleich = 0
    for (let i = 0; i + periode < dys.length; i += 1) {
      if (Math.abs(dys[i] - dys[i + periode]) < 0.01 && Math.abs(dxs[i] - dxs[i + periode]) < 0.01 && kette[i].art === kette[i + periode].art) gleich += 1
    }
    schlimmste = Math.max(schlimmste, gleich / (dys.length - periode))
  }
  pruefe(`Seed ${seed}: kein wiederkehrendes Muster (Periode 1–60, hoechste Uebereinstimmung ${(schlimmste * 100).toFixed(1)} %)`, schlimmste < 0.05)
  const dyStreuung = Math.sqrt(dys.reduce((n, d) => n + (d - dys.reduce((a, b) => a + b, 0) / dys.length) ** 2, 0) / dys.length)
  pruefe(`Seed ${seed}: Abstandsrhythmus schwankt (Streuung ${dyStreuung.toFixed(3)})`, dyStreuung >= 0.04)
}
pruefe(`alle Rhythmus-Abschnitte kommen vor`, ABSCHNITTE.every((a) => alleAbschnitte.has(a)), [...alleAbschnitte].join(','))
pruefe(
  `alle Plattenarten kommen vor`,
  ['normal', 'bewegt', 'lift', 'glas', 'broeckel', 'gold'].every((a) => alleArten.has(a)),
  [...alleArten.entries()].map(([a, n]) => `${a}:${n}`).join(' '),
)
const herde = SEEDS.flatMap((s) => plattenErzeugen(s, 600)).filter((p) => p.art === 'herd').length
pruefe(`Herdplatten entstehen als Zusatz`, herde > 0, `${herde}`)
{
  const a = plattenErzeugen(5, 200).map((p) => `${p.art}${p.x.toFixed(3)}`).join()
  const b = plattenErzeugen(5, 200).map((p) => `${p.art}${p.x.toFixed(3)}`).join()
  const c = plattenErzeugen(6, 200).map((p) => `${p.art}${p.x.toFixed(3)}`).join()
  pruefe('gleicher Seed gibt dieselbe Welt (Zufall injizierbar)', a === b)
  pruefe('anderer Seed gibt eine andere Welt', a !== c)
}
{
  const z = zufallMit(3)
  const werte = Array.from({ length: 5000 }, z)
  const mittel = werte.reduce((n, v) => n + v, 0) / werte.length
  pruefe('Zufall liegt in [0, 1) und ist gleichmaessig', werte.every((v) => v >= 0 && v < 1) && Math.abs(mittel - 0.5) < 0.02)
}

/* ------------------------------------------------------------------ */
console.log('\nEingabe')
pruefe('ohne Eingabe: 0, touch', JSON.stringify(eingabeAus({})) === JSON.stringify({ richtung: 0, quelle: 'touch' }))
pruefe('ein Finger links: -1', eingabeAus({ finger: [-1] }).richtung === -1)
pruefe('zwei Finger, zuletzt rechts: 1', eingabeAus({ finger: [-1, 1] }).richtung === 1)
pruefe('zwei Finger, zuletzt links: -1', eingabeAus({ finger: [1, -1] }).richtung === -1)
pruefe('Finger aus der Pause (0) lenkt nicht, auch nicht per Neigung', eingabeAus({ finger: [0], neigung: 1, neigungAktiv: true }).richtung === 0)
pruefe('Finger mit Map-Werten (Reihenfolge des Aufsetzens)', eingabeAus({ finger: new Map([[3, 1], [9, -1]]).values() }).richtung === -1)
pruefe('Tasten: links', eingabeAus({ links: true }).richtung === -1)
pruefe('Tasten: beide heben sich auf', eingabeAus({ links: true, rechts: true }).richtung === 0)
pruefe('Neigung aktiv ohne Finger: Quelle neigung', JSON.stringify(eingabeAus({ neigung: 1, neigungAktiv: true })) === JSON.stringify({ richtung: 1, quelle: 'neigung' }))
pruefe('Neigung inaktiv wird ignoriert', eingabeAus({ neigung: 1, neigungAktiv: false }).richtung === 0)
pruefe('Touch schlaegt Neigung', JSON.stringify(eingabeAus({ finger: [-1], neigung: 1, neigungAktiv: true })) === JSON.stringify({ richtung: -1, quelle: 'touch' }))
pruefe('Tasten schlagen Neigung', eingabeAus({ rechts: true, neigung: -1, neigungAktiv: true }).richtung === 1)
pruefe('Neigung ohne Richtung: 0, Quelle neigung', eingabeAus({ neigung: 0, neigungAktiv: true }).quelle === 'neigung')
pruefe('Seite: links der Mitte', seiteVon(100, 50, 200) === -1)
pruefe('Seite: genau Mitte ist rechts', seiteVon(150, 50, 200) === 1)
pruefe('Seite: rechts', seiteVon(240, 50, 200) === 1)
pruefe('Neigung Hochformat nutzt gamma', neigungGrad(40, 12, 0) === 12)
pruefe('Neigung Querformat 90 nutzt -beta', neigungGrad(20, 5, 90) === -20)
pruefe('Neigung Querformat 270 nutzt beta', neigungGrad(20, 5, 270) === 20)
pruefe('Neigung ohne Daten: null', neigungGrad(null, null, 0) === null)
pruefe('Totzone: kleine Neigung lenkt nicht', neigungRichtung(NEIGUNG_EIN - 1, 0) === 0)
pruefe('ab Schwelle rechts', neigungRichtung(NEIGUNG_EIN, 0) === 1)
pruefe('ab Schwelle links', neigungRichtung(-NEIGUNG_EIN - 2, 0) === -1)
pruefe('Hysterese haelt die Richtung', neigungRichtung(NEIGUNG_AUS + 0.5, 1) === 1)
pruefe('Hysterese laesst unter AUS los', neigungRichtung(NEIGUNG_AUS - 0.5, 1) === 0)
pruefe('Richtungswechsel ueber Null braucht volle Schwelle', neigungRichtung(-(NEIGUNG_AUS + 0.5), 1) === 0)
pruefe('NaN lenkt nicht', neigungRichtung(Number.NaN, 1) === 0)

/* ------------------------------------------------------------------ */
console.log('\nSonderplatten')
function testStand(platte) {
  const stand = neuesSpiel(1)
  stand.erzeugen = false
  stand.platten = [{ id: 1, yAlt: platte.y, yMin: platte.y, yMax: platte.y, xMin: 0, xMax: 1, v: 0, kette: true, beruehrt: false, risse: 0, weg: false, fallV: 0, heiss: false, ...platte }]
  stand.spieler = { x: 0.5, y: platte.y + 0.05, vx: 0, vy: 0 }
  return stand
}
function landungen(stand, sekunden) {
  const liste = []
  for (let i = 0; i < sekunden * 120; i += 1) for (const e of schritt(stand, 0)) if (e.art === 'landung') liste.push(e)
  return liste
}
{
  const stand = testStand({ art: 'broeckel', x: 0.5, y: 1, b: 0.3 })
  const l = landungen(stand, 3)
  pruefe(`Broeckelplatte traegt ${BROECKEL_HAELT} Landungen, dann faellt sie`, l.length === BROECKEL_HAELT && stand.platten[0].weg, `${l.length} Landungen`)
  pruefe('Broeckelplatte zaehlt nur einmal als Runde', stand.runden === 1)
}
{
  const stand = testStand({ art: 'glas', x: 0.5, y: 1, b: 0.3 })
  const l = landungen(stand, 3)
  pruefe('Glas bricht bei der ersten Landung', l.length === 1 && stand.platten[0].weg)
}
{
  const stand = testStand({ art: 'lift', x: 0.5, y: 1, yMin: 1, yMax: 1.08, b: 0.3, v: 0.12 })
  const l = landungen(stand, 4)
  const p = stand.platten[0]
  pruefe('Lift faehrt in seiner Bahn und traegt', l.length >= 3 && p.y >= p.yMin - 1e-9 && p.y <= p.yMax + 1e-9, `${l.length} Landungen, y=${p.y.toFixed(3)}`)
}
{
  const stand = testStand({ art: 'herd', x: 0.5, y: 1, b: 0.3 })
  let heiss = 0
  for (let i = 0; i < 120; i += 1) for (const e of schritt(stand, 0)) if (e.art === 'heiss') heiss += 1
  pruefe('Herd laesst durchfallen und meldet heiss', heiss === 1 && stand.spieler.y < 0.5)
}
pruefe('Schwerkraft und Sprung wie bisher', SCHWERE === 3.4 && SPRUNG_HOEHE === 0.42)

console.log(`\n${gut} ok, ${schlecht} fehlgeschlagen`)
process.exit(schlecht ? 1 : 0)
