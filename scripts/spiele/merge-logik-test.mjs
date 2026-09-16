/*
 * Reine Node-Tests fuer die Kuechen-Merge-Logik.
 * Aufruf: node scripts/spiele/merge-logik-test.mjs
 */
import {
  ABWURF_MAX,
  ABWURF_MS,
  BREITE,
  HOEHE,
  KOMBO_MAX,
  KOMBO_S,
  LINIE_Y,
  OBERSTE,
  STUFEN,
  TRAUM_PUNKTE,
  UEBER_S,
  abwerfen,
  basisPunkte,
  komboFaktor,
  komboWeiter,
  landeY,
  neuesSpiel,
  schritt,
  simulieren,
  vorschau,
  zufallsStufe,
} from '../../src/components/spiele/merge-logik.js'

let ok = 0
let fehler = 0
function pruefe(name, bedingung, info = '') {
  if (bedingung) {
    ok += 1
    console.log(`OK     ${name}`)
  } else {
    fehler += 1
    console.log(`FEHLER ${name}${info ? ` — ${info}` : ''}`)
  }
}

/** Deterministischer Zufall (mulberry32). */
function saat(s) {
  let a = s >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ein Koerper, direkt gelegt (wie abwerfen, aber mit freier Stufe und Lage). */
function legen(stand, stufe, x, y) {
  stand.nr += 1
  const r = STUFEN[stufe].r
  const k = { id: stand.nr, stufe, x, y, px: x, py: y, vx: 0, vy: 0, r, rZiel: r, m: r * r, winkel: 0, stuetze: false, geboren: stand.zeit, ueber: 0 }
  stand.koerper.push(k)
  return k
}

/* ---------------------------------------------------------------- */
console.log('\n— Grundwerte')
pruefe('Stufen: 10, oberste = 9', STUFEN.length === 10 && OBERSTE === 9)
pruefe('Radien steigen streng', STUFEN.every((s, i) => i === 0 || s.r > STUFEN[i - 1].r))
pruefe('Oberste Stufe passt in den Behaelter', STUFEN[OBERSTE].r * 2 < BREITE)
pruefe('basisPunkte: Dreieckszahl × 10', basisPunkte(0) === 10 && basisPunkte(1) === 30 && basisPunkte(9) === 550)
pruefe('ABWURF_MS >= 400 (Server msJeRunde)', ABWURF_MS >= 400, `ABWURF_MS=${ABWURF_MS}`)
pruefe('komboFaktor: 1, +25 %, gedeckelt', komboFaktor(0) === 1 && komboFaktor(1) === 1 && komboFaktor(2) === 1.25 && komboFaktor(KOMBO_MAX) === komboFaktor(KOMBO_MAX + 7))
pruefe('komboWeiter: im Fenster +1, danach 1', komboWeiter(2, 1, 1 + KOMBO_S - 0.01) === 3 && komboWeiter(2, 1, 1 + KOMBO_S + 0.01) === 1 && komboWeiter(0, null, 5) === 1)
{
  const z = saat(7)
  const zaehler = [0, 0, 0, 0, 0, 0]
  for (let i = 0; i < 5000; i += 1) zaehler[zufallsStufe(z)] += 1
  pruefe('Abwurfstufen nur 0..4, kleine haeufiger', zaehler[5] === 0 && zaehler[0] > zaehler[2] && zaehler[2] > zaehler[4], zaehler.join('/'))
}

/* ---------------------------------------------------------------- */
console.log('\n— Kaskade bis zur obersten Stufe')
{
  const stand = neuesSpiel(saat(1))
  let kaskadeOk = true
  const ketten = []
  for (let stufe = 0; stufe < OBERSTE; stufe += 1) {
    const r = STUFEN[stufe].r
    stand.koerper = []
    legen(stand, stufe, BREITE / 2 - r, HOEHE - r)
    legen(stand, stufe, BREITE / 2 + r, HOEHE - r)
    const ev = simulieren(stand, 0.4).filter((e) => e.art === 'merge')
    if (!(ev.length === 1 && ev[0].stufe === stufe + 1 && stand.koerper.length === 1 && stand.koerper[0].stufe === stufe + 1)) {
      kaskadeOk = false
      console.log(`       Stufe ${stufe}: ${JSON.stringify(ev)} koerper=${stand.koerper.length}`)
    }
    ketten.push(ev[0]?.kette)
  }
  pruefe('Jede Stufe 0..8 verschmilzt zu genau einer naechsten', kaskadeOk)
  pruefe('hoechste = oberste Stufe erreicht', stand.hoechste === OBERSTE, `hoechste=${stand.hoechste}`)
  pruefe('Kette steigt im Fenster und bleibt bei KOMBO_MAX gedeckelt im Faktor', ketten[0] === 1 && ketten[1] === 2 && ketten[8] === 9, ketten.join(','))

  /* Zwei oberste werden zur Traumkueche und verschwinden. */
  const r = STUFEN[OBERSTE].r
  stand.koerper = []
  legen(stand, OBERSTE, BREITE / 2 - r, HOEHE - r)
  legen(stand, OBERSTE, BREITE / 2 + r, HOEHE - r)
  const vorher = stand.punkte
  stand.abwurfPunkte = 0
  const ev = simulieren(stand, 0.4)
  const traum = ev.find((e) => e.art === 'traum')
  pruefe('Zwei oberste: Traum-Ereignis, Behaelter leer', traum && stand.koerper.length === 0 && traum.gross)
  pruefe('Traumpunkte = TRAUM_PUNKTE × Faktor', traum && traum.punkte === Math.round(TRAUM_PUNKTE * traum.faktor) && stand.punkte - vorher === traum.punkte, JSON.stringify(traum))
}

/* ---------------------------------------------------------------- */
console.log('\n— Kombo-Punkte')
{
  const stand = neuesSpiel(saat(2))
  let punkteOk = true
  let summe = 0
  const r0 = STUFEN[0].r
  for (let i = 0; i < 7; i += 1) {
    stand.koerper = []
    stand.abwurfPunkte = 0 // jede Verschmelzung zaehlt wie ein eigener Abwurf
    legen(stand, 0, 20, HOEHE - r0)
    legen(stand, 0, 20 + 2 * r0, HOEHE - r0)
    const ev = simulieren(stand, 0.3).filter((e) => e.art === 'merge')
    const e = ev[0]
    if (!e || e.kette !== i + 1 || e.punkte !== Math.round(basisPunkte(1) * komboFaktor(i + 1))) {
      punkteOk = false
      console.log(`       Merge ${i}: ${JSON.stringify(e)}`)
    }
    summe += e ? e.punkte : 0
  }
  pruefe('Punkte = basisPunkte × komboFaktor(kette)', punkteOk)
  pruefe('stand.punkte = Summe der Ereignisse', stand.punkte === summe, `${stand.punkte} vs ${summe}`)
  pruefe('Kette ist im Stand sichtbar', stand.kette === 7 && stand.komboBis > stand.zeit)

  simulieren(stand, KOMBO_S + 0.2)
  pruefe('Nach KOMBO_S ohne Verschmelzung: Kette 0', stand.kette === 0, `kette=${stand.kette}`)
  stand.koerper = []
  legen(stand, 0, 20, HOEHE - r0)
  legen(stand, 0, 20 + 2 * r0, HOEHE - r0)
  const e = simulieren(stand, 0.3).find((x) => x.art === 'merge')
  pruefe('Danach beginnt die Kette wieder bei 1', e && e.kette === 1 && e.faktor === 1)
}

/* ---------------------------------------------------------------- */
console.log('\n— Deckel je Abwurf')
{
  const stand = neuesSpiel(saat(3))
  stand.abwurfPunkte = 0
  const r = STUFEN[OBERSTE].r
  let gesamt = 0
  for (let i = 0; i < 4; i += 1) {
    stand.koerper = []
    legen(stand, OBERSTE, BREITE / 2 - r, HOEHE - r)
    legen(stand, OBERSTE, BREITE / 2 + r, HOEHE - r)
    for (const ev of simulieren(stand, 0.3)) gesamt += ev.punkte || 0
  }
  pruefe('Ohne neuen Abwurf nie mehr als ABWURF_MAX', stand.abwurfPunkte === ABWURF_MAX && gesamt === ABWURF_MAX, `abwurfPunkte=${stand.abwurfPunkte} gesamt=${gesamt}`)
  abwerfen(stand, BREITE / 2)
  pruefe('abwerfen setzt den Deckel zurueck', stand.abwurfPunkte === 0)
}

/* ---------------------------------------------------------------- */
console.log('\n— Vorschau')
{
  const stand = neuesSpiel(saat(4))
  let gleich = true
  for (let i = 0; i < 50; i += 1) {
    const v = vorschau(stand)
    const k = abwerfen(stand, 10 + ((i * 37) % 80))
    if (stand.aktuell !== v.naechstes || k.stufe !== v.aktuell) gleich = false
    simulieren(stand, 0.5)
    if (stand.vorbei) break
    /* Das gezeigte Naechste ist genau das, was als naechstes faellt. */
    const zuVor = vorschau(stand)
    const k2 = abwerfen(stand, 50)
    if (k2 && k2.stufe !== zuVor.aktuell) gleich = false
    simulieren(stand, 0.5)
    if (stand.vorbei) break
  }
  pruefe('vorschau().naechstes ist das tatsaechlich naechste Teil', gleich)
}

/* ---------------------------------------------------------------- */
console.log('\n— Stabiler Stapel')
{
  const stand = neuesSpiel(saat(5))
  /* Unterschiedliche Stufen nebeneinander, damit nichts verschmilzt. */
  const reihe = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4]
  let x = 6
  for (const s of reihe) {
    const r = STUFEN[s].r
    if (x + r > BREITE) x = 6
    legen(stand, s, x + r, 60)
    x += 2 * r + 1
  }
  /* Der Haufen darf erst zusammenfallen und dabei auch verschmelzen;
     danach muss er ruhig liegen bleiben. */
  simulieren(stand, 15)
  const tempo = Math.max(...stand.koerper.map((k) => Math.hypot(k.vx, k.vy)))
  let ueberlappung = 0
  for (let i = 0; i < stand.koerper.length; i += 1) {
    for (let j = i + 1; j < stand.koerper.length; j += 1) {
      const a = stand.koerper[i]
      const b = stand.koerper[j]
      ueberlappung = Math.max(ueberlappung, a.r + b.r - Math.hypot(a.x - b.x, a.y - b.y))
    }
  }
  const drin = stand.koerper.every((k) => k.x >= k.r - 0.01 && k.x <= BREITE - k.r + 0.01 && k.y <= HOEHE - k.r + 0.01)
  pruefe('Nach 15 s in Ruhe (Tempo < 0.5)', tempo < 0.5, `tempo=${tempo.toFixed(2)}`)
  pruefe('Ueberlappung < 1 Einheit', ueberlappung < 1, `max=${ueberlappung.toFixed(3)}`)
  pruefe('Alle Teile im Behaelter, nicht vorbei', drin && !stand.vorbei)
  const lage = stand.koerper.map((k) => [k.x, k.y])
  simulieren(stand, 3)
  const drift = Math.max(...stand.koerper.map((k, i) => Math.hypot(k.x - lage[i][0], k.y - lage[i][1])))
  pruefe('Kein Kriechen: Drift in 3 s < 0.5', drift < 0.5, `drift=${drift.toFixed(3)}`)
}

/* ---------------------------------------------------------------- */
console.log('\n— Warnung, kritisch, Ueberlauf')
{
  const stand = neuesSpiel(saat(6))
  const r = STUFEN[8].r
  /* Ein Turm, der ueber die Linie ragt: unten zwei Hochschraenke, oben einer drauf. */
  legen(stand, 7, STUFEN[7].r, HOEHE - STUFEN[7].r)
  legen(stand, 6, BREITE - STUFEN[6].r, HOEHE - STUFEN[6].r)
  simulieren(stand, 0.2)
  pruefe('Flach: keine Warnung', !stand.warnung && !stand.kritisch && stand.fuellung === 0)
  const hoch = legen(stand, 8, BREITE / 2, LINIE_Y + 4 - r)
  hoch.geboren = -10 // Gnadenzeit schon vorbei
  /* Festhalten ueber der Linie, um den Zustand gezielt zu pruefen. */
  let warnGesehen = false
  let kritischGesehen = false
  let vorbeiNach = null
  for (let i = 0; i < 400 && !stand.vorbei; i += 1) {
    hoch.x = BREITE / 2
    hoch.y = LINIE_Y + 2 - r
    hoch.px = hoch.x
    hoch.py = hoch.y
    hoch.vx = 0
    hoch.vy = 0
    const ev = schritt(stand)
    hoch.y = LINIE_Y + 2 - r
    if (stand.warnung) warnGesehen = true
    if (stand.kritisch) kritischGesehen = true
    if (ev.some((e) => e.art === 'vorbei')) vorbeiNach = (i + 1) / 120
  }
  pruefe('Teil ueber der Linie: warnung und kritisch', warnGesehen && kritischGesehen)
  pruefe('Nach UEBER_S ueber der Linie: vorbei', stand.vorbei && vorbeiNach != null && Math.abs(vorbeiNach - UEBER_S) < 0.05, `nach ${vorbeiNach}s`)
  pruefe('Nach vorbei: abwerfen tut nichts', abwerfen(stand, 50) === null)
}

/* ---------------------------------------------------------------- */
console.log('\n— Bot-Laeufe (Deckel, Summen, Hochrechnung)')
{
  function botLauf(seed, sekundenJeAbwurf, maxAbwuerfe = 1400) {
    const z = saat(seed)
    const stand = neuesSpiel(z)
    let maxJeAbwurf = 0
    let summeEv = 0
    let aktuell = 0
    const dauerS = 540
    while (!stand.vorbei && stand.abwuerfe < maxAbwuerfe && stand.zeit < dauerS) {
      /* Gierig: dorthin, wo ein gleiches Teil zuerst getroffen wird, sonst zufaellig. */
      let bestX = 5 + z() * 90
      let bestY = -Infinity
      for (let x = 4; x <= 96; x += 3) {
        const { y, getroffen } = landeY(stand, stand.aktuell, x)
        const wert = (getroffen && getroffen.stufe === stand.aktuell ? 1000 : 0) + y
        if (wert > bestY) {
          bestY = wert
          bestX = x
        }
      }
      abwerfen(stand, bestX)
      aktuell = 0
      for (const e of simulieren(stand, sekundenJeAbwurf)) {
        if (e.punkte) {
          aktuell += e.punkte
          summeEv += e.punkte
        }
      }
      maxJeAbwurf = Math.max(maxJeAbwurf, aktuell)
    }
    return { stand, maxJeAbwurf, summeEv }
  }

  let deckelOk = true
  let summenOk = true
  const zeilen = []
  for (const [seed, takt] of [[11, 0.45], [12, 0.45], [13, 0.8], [14, 1.2], [15, 1.2], [16, 2]]) {
    const { stand, maxJeAbwurf, summeEv } = botLauf(seed, takt)
    if (maxJeAbwurf > ABWURF_MAX) deckelOk = false
    if (stand.punkte !== summeEv) summenOk = false
    const jeAbwurf = stand.abwuerfe ? stand.punkte / stand.abwuerfe : 0
    zeilen.push(`takt ${takt}s: ${stand.abwuerfe} Abwuerfe, ${stand.punkte} Punkte, ${jeAbwurf.toFixed(0)}/Abwurf, max ${maxJeAbwurf}, ${stand.zeit.toFixed(0)} s, vorbei=${stand.vorbei}`)
  }
  zeilen.forEach((z) => console.log(`       ${z}`))
  pruefe('Bot: kein Abwurf bringt mehr als ABWURF_MAX', deckelOk)
  pruefe('Bot: stand.punkte = Summe der Ereignisse', summenOk)
  const schnitt = zeilen.map((z) => Number(z.match(/, (\d+)\/Abwurf/)[1]))
  pruefe('Bot: Schnitt je Abwurf unter Server-maxJeRunde 450', schnitt.every((s) => s < 450), schnitt.join(','))
}

console.log(`\n${ok} OK, ${fehler} Fehler`)
if (fehler) process.exit(1)
