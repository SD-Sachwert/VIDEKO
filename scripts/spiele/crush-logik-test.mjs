/**
 * Kuechen-Crush — reine Logiktests, ohne Browser.
 *
 *   node scripts/spiele/crush-logik-test.mjs
 *
 * Prueft Sonderteile (4er Booster, 5er/L Bombe), Zuendungen, Kaskaden- und
 * Tempo-Multiplikator, das Finale, die Punktdecke je Zug und simuliert
 * ganze 40-s-Laeufe per Bot gegen die Servergrenzen (api/_terminal-kern.js,
 * nur gelesen).
 */

import {
  BREITE,
  FINALE_FAKTOR,
  FINALE_MS,
  HOEHE,
  KOMBO_MAX,
  PUNKTE_JE_STEIN,
  SERIE_MS,
  SPERRE_MS,
  TEMPO_STUFE_MAX,
  ZUG_PUNKTE_MAX,
  alleZuege,
  aufloesungMs,
  ersterZug,
  hatTreffer,
  istFinale,
  kaskadeFaktor,
  kopie,
  mitEndspurt,
  multiplikator,
  neuesSpiel,
  schrittPunkte,
  serieWeiter,
  tauschGueltig,
  tauschen,
  tempoFaktor,
  zufallMitSaat,
  zugPunkte,
} from '../../src/components/spiele/crush-logik.js'

/* Servergrenzen fuer kuechen_crush, abgeschrieben aus api/_terminal-kern.js
   (Stand heute). VORSCHLAG sind die Werte, die nach dem Tuning gelten sollen:
   Tempo-Serie, staerkere Kaskade und FINALE ×2 heben gute Laeufe an. */
const SERVER_HEUTE = { dauerMs: 40000, msJeRunde: 300, maxJeRunde: 5000, plausibel: 55000, hart: 90000 }
const SERVER = { ...SERVER_HEUTE, plausibel: 80000, hart: 140000 }

let gut = 0
let schlecht = 0
function pruefe(name, ok, info = '') {
  if (ok) gut += 1
  else schlecht += 1
  console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${info ? ` — ${info}` : ''}`)
}

/* ------------------------------------------------------------------ */
/* Hilfen: ein Feld von Hand bauen                                     */
/* ------------------------------------------------------------------ */

/* Grundmuster nur aus Typ 2..6, nirgends drei gleiche. Typ 1 setzen die
   Tests gezielt. */
const grundTyp = (x, y) => 2 + ((x + 2 * y) % 5)

function standAus(setzen = {}, saat = 7) {
  const stand = { feld: [], naechsteId: 0, zufall: zufallMitSaat(saat) }
  for (let y = 0; y < HOEHE; y += 1) {
    const reihe = []
    for (let x = 0; x < BREITE; x += 1) {
      const vorgabe = setzen[`${x},${y}`]
      const typ = vorgabe ? vorgabe.typ : grundTyp(x, y)
      stand.naechsteId += 1
      reihe.push({ id: stand.naechsteId, typ, spezial: vorgabe?.spezial || null })
    }
    stand.feld.push(reihe)
  }
  return stand
}

const eins = { typ: 1 }
const idsReihe = (feld, y) => feld[y].map((s) => s.id)
const idsSpalte = (feld, x) => feld.map((r) => r[x].id)
const enthaeltAlle = (liste, ids) => ids.every((id) => liste.includes(id))

/* ------------------------------------------------------------------ */
/* Grundlagen                                                          */
/* ------------------------------------------------------------------ */

{
  let ok = true
  for (let s = 1; s <= 30; s += 1) {
    const st = neuesSpiel(zufallMitSaat(s))
    if (hatTreffer(st.feld) || !ersterZug(st.feld)) ok = false
  }
  pruefe('neuesSpiel: 30 Felder ohne Linie, jedes mit Zug', ok)
  const probe = standAus()
  pruefe('Testfeld: Grundmuster ohne Linie', !hatTreffer(probe.feld))
}

/* ------------------------------------------------------------------ */
/* 4er → Booster, 5er/L → Bombe                                        */
/* ------------------------------------------------------------------ */

{
  /* Reihe 0: 1 1 _ 1, darunter bei (2,1) eine 1. Tausch (2,0)↔(2,1). */
  const st = standAus({ '0,0': eins, '1,0': eins, '3,0': eins, '2,1': eins })
  pruefe('4er waagerecht: Vorbedingung ohne Linie, Tausch gueltig', !hatTreffer(st.feld) && tauschGueltig(st.feld, [2, 0], [2, 1]))
  const e = tauschen(st, [2, 0], [2, 1])
  const s1 = e.schritte[0]
  const neu = s1.neuSpezial[0]
  pruefe('4er waagerecht erzeugt Booster reihe', s1.booster === 1 && neu?.art === 'reihe' && neu?.form === 4, JSON.stringify(neu))
  pruefe('4er: Booster liegt auf der getauschten Zelle', neu?.platz?.[0] === 2 && neu?.platz?.[1] === 0)
  pruefe('4er: drei Steine weg, Punkte 3×30 + 150', s1.anzahl === 3 && s1.punkte === 3 * PUNKTE_JE_STEIN + 150, `${s1.anzahl} / ${s1.punkte}`)
  pruefe('4er: Booster steht nach dem Schritt im Feld', s1.nachher.flat().some((s) => s.id === neu.id && s.spezial === 'reihe'))
}

{
  /* Spalte 0: 1 1 _ 1 senkrecht, bei (1,2) eine 1. Tausch (0,2)↔(1,2). */
  const st = standAus({ '0,0': eins, '0,1': eins, '0,3': eins, '1,2': eins })
  const e = tauschen(st, [0, 2], [1, 2])
  const neu = e.schritte[0]?.neuSpezial[0]
  pruefe('4er senkrecht erzeugt Booster spalte', e.gueltig && neu?.art === 'spalte' && neu?.form === 4, JSON.stringify(neu))
}

{
  /* Reihe 0: 1 1 _ 1 1, bei (2,1) eine 1. */
  const st = standAus({ '0,0': eins, '1,0': eins, '3,0': eins, '4,0': eins, '2,1': eins })
  pruefe('5er: Vorbedingung ohne Linie', !hatTreffer(st.feld))
  const e = tauschen(st, [2, 0], [2, 1])
  const s1 = e.schritte[0]
  const neu = s1.neuSpezial[0]
  pruefe('5er erzeugt VIDEKO-Bombe', s1.bomben === 1 && neu?.art === 'bombe' && neu?.form === 5, JSON.stringify(neu))
  pruefe('5er: Bombe hat Typ 0 und passt zu nichts', s1.nachher.flat().some((s) => s.id === neu.id && s.typ === 0))
  pruefe('5er: vier Steine weg, Punkte 4×30 + 400', s1.punkte === 4 * PUNKTE_JE_STEIN + 400, String(s1.punkte))
}

{
  /* L-Form: Reihe 2 x0..x2 = 1 nach Tausch, Spalte 2 y2..y4 = 1. Tausch (2,2)↔(3,2). */
  const st = standAus({ '0,2': eins, '1,2': eins, '3,2': eins, '2,3': eins, '2,4': eins })
  pruefe('L-Form: Vorbedingung ohne Linie', !hatTreffer(st.feld))
  const e = tauschen(st, [2, 2], [3, 2])
  const neu = e.schritte[0]?.neuSpezial[0]
  pruefe('L-Form erzeugt Bombe (form kreuz)', e.gueltig && neu?.art === 'bombe' && neu?.form === 'kreuz', JSON.stringify(neu))
}

/* ------------------------------------------------------------------ */
/* Zuendungen                                                          */
/* ------------------------------------------------------------------ */

{
  /* Reihe 3: Booster(1) 1 _ , bei (2,4) eine 1. Tausch (2,3)↔(2,4). */
  const st = standAus({ '0,3': { typ: 1, spezial: 'reihe' }, '1,3': eins, '2,4': eins })
  pruefe('Reihen-Booster: Vorbedingung ohne Linie', !hatTreffer(st.feld))
  const vorher = kopie(st.feld)
  const e = tauschen(st, [2, 3], [2, 4])
  const s1 = e.schritte[0]
  const erwartet = idsReihe(s1.vorher, 3)
  pruefe('Reihen-Booster raeumt die ganze Reihe', s1.anzahl === BREITE && enthaeltAlle(s1.weg, erwartet), `${s1.anzahl} weg`)
  pruefe('Reihen-Booster: sonst nichts geraeumt', s1.weg.length === BREITE)
  pruefe('Reihen-Booster: Effekt reihe an (0,3)', s1.gezuendetBooster === 1 && s1.effekte.some((f) => f.art === 'reihe' && f.x === 0 && f.y === 3), JSON.stringify(s1.effekte))
  pruefe('Reihen-Booster: Feld davor unveraendert gelassen', vorher[3][0].spezial === 'reihe')
}

{
  /* Spalte 4: Booster(1) oben bei (4,0), (4,1) = 1, bei (3,2) eine 1. Tausch (4,2)↔(3,2). */
  const st = standAus({ '4,0': { typ: 1, spezial: 'spalte' }, '4,1': eins, '3,2': eins })
  pruefe('Spalten-Booster: Vorbedingung ohne Linie', !hatTreffer(st.feld))
  const e = tauschen(st, [4, 2], [3, 2])
  const s1 = e.schritte[0]
  pruefe('Spalten-Booster raeumt die ganze Spalte', s1.anzahl === HOEHE && enthaeltAlle(s1.weg, idsSpalte(s1.vorher, 4)), `${s1.anzahl} weg`)
  pruefe('Spalten-Booster: Effekt spalte', s1.effekte.some((f) => f.art === 'spalte' && f.x === 4))
}

{
  /* Kreuz: Reihen-Booster in einer Linie, die einen Spalten-Booster mitnimmt. */
  const st = standAus({
    '0,5': { typ: 1, spezial: 'reihe' },
    '1,5': { typ: 1, spezial: 'spalte' },
    '2,6': eins,
  })
  const e = tauschen(st, [2, 5], [2, 6])
  const s1 = e.schritte[0]
  const erwartet = new Set([...idsReihe(s1.vorher, 5), ...idsSpalte(s1.vorher, 1)])
  pruefe('Kreuz (Reihe + Spalte) raeumt Reihe und Spalte', s1.anzahl === erwartet.size && enthaeltAlle(s1.weg, [...erwartet]), `${s1.anzahl} / ${erwartet.size}`)
  pruefe('Kreuz: zwei Effekte', s1.effekte.filter((f) => f.art === 'reihe' || f.art === 'spalte').length === 2)
}

{
  /* Bombe bei (3,3), Nachbar (4,3) Typ grundTyp(4,3). */
  const st = standAus({ '3,3': { typ: 0, spezial: 'bombe' } })
  const partnerTyp = st.feld[3][4].typ
  const erwartet = st.feld.flat().filter((s) => s.typ === partnerTyp).map((s) => s.id)
  const bombeId = st.feld[3][3].id
  const e = tauschen(st, [3, 3], [4, 3])
  const s1 = e.schritte[0]
  pruefe('Bombe raeumt alle Steine vom Typ des Partners', enthaeltAlle(s1.weg, erwartet) && s1.weg.includes(bombeId), `${s1.anzahl} weg, erwartet ${erwartet.length + 1}`)
  pruefe('Bombe: genau Partner-Typ + Bombe', s1.anzahl === erwartet.length + 1)
  pruefe('Bombe: Effekt bombe mit Typ', s1.effekte.some((f) => f.art === 'bombe' && f.typ === partnerTyp && f.x === 4 && f.y === 3), JSON.stringify(s1.effekte))
}

{
  const st = standAus({ '3,3': { typ: 0, spezial: 'bombe' }, '3,4': { typ: 0, spezial: 'bombe' } })
  const e = tauschen(st, [3, 3], [3, 4])
  pruefe('Zwei Bomben raeumen das ganze Feld', e.schritte[0].anzahl === BREITE * HOEHE && e.schritte[0].effekte[0]?.art === 'feld')
}

/* ------------------------------------------------------------------ */
/* Kaskade, Tempo, Combo-Punkte                                        */
/* ------------------------------------------------------------------ */

{
  let steigt = true
  for (let k = 2; k <= 10; k += 1) if (kaskadeFaktor(k) < kaskadeFaktor(k - 1)) steigt = false
  pruefe('Kaskadenfaktor steigt nie ab', steigt)
  pruefe('Kaskadenfaktor 1, 2, 3, 5, 8, 12', [1, 2, 3, 4, 5, 6].map(kaskadeFaktor).join() === '1,2,3,5,8,12')
  pruefe('Kaskadenfaktor gedeckelt', kaskadeFaktor(40) === KOMBO_MAX && kaskadeFaktor(7) === KOMBO_MAX)
  pruefe('Kaskade staerker als linear ab Schritt 4', kaskadeFaktor(4) > 4 && kaskadeFaktor(5) > 5)
}

{
  /* Eine echte Kaskade suchen und nachrechnen. */
  let gefunden = null
  for (let saat = 1; saat < 400 && !gefunden; saat += 1) {
    const st = neuesSpiel(zufallMitSaat(saat))
    for (const [a, b] of alleZuege(st.feld)) {
      const probe = { feld: kopie(st.feld), naechsteId: st.naechsteId, zufall: zufallMitSaat(saat * 31) }
      const e = tauschen(probe, a, b)
      if (e.schritte.length >= 3) {
        gefunden = e
        break
      }
    }
  }
  pruefe('Kaskade mit mindestens drei Schritten gefunden', !!gefunden)
  if (gefunden) {
    const ok = gefunden.schritte.every((s, i) => s.kombo === i + 1 && s.punkte === schrittPunkte(s.anzahl, s.kombo, s.booster, s.bomben))
    const s2 = gefunden.schritte[1]
    pruefe('Kaskade: kombo zaehlt 1, 2, 3 …, Punkte je Schritt stimmen', ok)
    pruefe('Kaskade: Schritt 2 zaehlt doppelt', s2.punkte === s2.anzahl * PUNKTE_JE_STEIN * 2 + s2.booster * 150 + s2.bomben * 400)
    const m = zugPunkte(gefunden.schritte, { tempoStufe: 0 }).multi
    pruefe('Kaskaden-Multiplikator steigt je Schritt', m.every((v, i) => i === 0 || v > m[i - 1]), m.join(' → '))
  }
}

{
  pruefe('Tempo: schneller Folgezug steigt eine Stufe', serieWeiter(0, 400) === 1 && serieWeiter(2, SERIE_MS) === 3)
  pruefe('Tempo: gedeckelt auf die hoechste Stufe', serieWeiter(TEMPO_STUFE_MAX, 100) === TEMPO_STUFE_MAX)
  pruefe('Tempo: langsamer Zug setzt zurueck', serieWeiter(3, SERIE_MS + 1) === 0 && serieWeiter(3, Infinity) === 0)
  pruefe('Tempo: Faktoren 1 … 1,6', tempoFaktor(0) === 1 && tempoFaktor(TEMPO_STUFE_MAX) === 1.6 && tempoFaktor(99) === 1.6)
  pruefe('Multiplikator = Kaskade × Tempo', multiplikator(3, 2) === 4.2 && multiplikator(1, 0) === 1 && multiplikator(2, 3) === 3.2)

  const schritte = [
    { kombo: 1, anzahl: 3, booster: 0, bomben: 0, punkte: schrittPunkte(3, 1, 0, 0) },
    { kombo: 2, anzahl: 4, booster: 1, bomben: 0, punkte: schrittPunkte(4, 2, 1, 0) },
  ]
  const basis = schritte[0].punkte + schritte[1].punkte
  const ohne = zugPunkte(schritte)
  const tempo = zugPunkte(schritte, { tempoStufe: 2 })
  const fin = zugPunkte(schritte, { tempoStufe: 2, finale: true })
  pruefe('Combo-Punkte: ohne Tempo = Basis', ohne.summe === basis, `${ohne.summe} / ${basis}`)
  pruefe('Combo-Punkte: Tempostufe 2 zahlt ×1,4', tempo.summe === Math.round(90 * 1.4) + Math.round(390 * 1.4), String(tempo.summe))
  pruefe('Combo-Punkte: Finale verdoppelt obendrauf', fin.summe === 2 * tempo.summe, `${fin.summe}`)
  pruefe('Combo-Punkte: jeSchritt summiert sich zur Summe', fin.jeSchritt.reduce((a, b) => a + b, 0) === fin.summe)
}

/* ------------------------------------------------------------------ */
/* Punktdecke je Zug                                                   */
/* ------------------------------------------------------------------ */

{
  const riesig = Array.from({ length: 12 }, (_, i) => ({ kombo: i + 1, anzahl: 56, booster: 3, bomben: 2, punkte: schrittPunkte(56, i + 1, 3, 2) }))
  const z = zugPunkte(riesig, { tempoStufe: TEMPO_STUFE_MAX, finale: true })
  pruefe('Punktdecke: Extremzug genau ZUG_PUNKTE_MAX', z.summe === ZUG_PUNKTE_MAX && z.gedeckelt, String(z.summe))
  pruefe('Punktdecke: kein Schritt negativ, Summe stimmt', z.jeSchritt.every((v) => v >= 0) && z.jeSchritt.reduce((a, b) => a + b, 0) === z.summe)
  pruefe('Punktdecke liegt unter Server maxJeRunde', ZUG_PUNKTE_MAX < SERVER.maxJeRunde)

  const st = standAus({ '3,3': { typ: 0, spezial: 'bombe' }, '3,4': { typ: 0, spezial: 'bombe' } })
  const e = tauschen(st, [3, 3], [3, 4])
  const echt = zugPunkte(e.schritte, { tempoStufe: TEMPO_STUFE_MAX, finale: true })
  pruefe('Punktdecke: zwei Bomben im Finale mit vollem Tempo gedeckelt', echt.summe <= ZUG_PUNKTE_MAX && echt.gedeckelt, `${echt.summe} (Basis ${e.punkte})`)
}

/* ------------------------------------------------------------------ */
/* Finale                                                              */
/* ------------------------------------------------------------------ */

{
  pruefe('Finale: 5000 ms Rest ist Finale', istFinale(FINALE_MS) && istFinale(1))
  pruefe('Finale: 5001 ms Rest und 0 ms nicht', !istFinale(FINALE_MS + 1) && !istFinale(0))
  pruefe('Finale: Faktor 2', FINALE_FAKTOR === 2 && mitEndspurt(135, true) === 270 && mitEndspurt(135, false) === 135)
}

/* ------------------------------------------------------------------ */
/* Takt                                                                */
/* ------------------------------------------------------------------ */

{
  /* Ein Zug mit genau einem schlichten Schritt, ohne Mischen. */
  const einfach = { gueltig: true, schritte: [{ kombo: 1, anzahl: 3, effekte: [], bomben: 0 }], gemischt: null }
  const ms = aufloesungMs(einfach)
  pruefe('Takt: Sperre nie unter Server msJeRunde', SPERRE_MS >= SERVER.msJeRunde && ms >= SERVER.msJeRunde, `${ms} ms`)
  pruefe('Takt: einfacher Zug schneller als vorher (370 ms)', ms < 370, `${ms} ms`)
  const mitBombe = { gueltig: true, schritte: [{ kombo: 1, anzahl: 13, effekte: [{ art: 'bombe' }], bomben: 0 }], gemischt: null }
  pruefe('Takt: Zuendung steht etwas laenger', aufloesungMs(mitBombe) >= ms)
  pruefe('Takt: ungueltiger Tausch sperrt nicht', aufloesungMs({ gueltig: false }) === 0)
  let dreiSchritte = null
  for (let saat = 1; saat < 300 && !dreiSchritte; saat += 1) {
    const s = neuesSpiel(zufallMitSaat(saat))
    for (const [a, b] of alleZuege(s.feld)) {
      const p = { feld: kopie(s.feld), naechsteId: s.naechsteId, zufall: zufallMitSaat(saat) }
      const r = tauschen(p, a, b)
      if (r.schritte.length === 3 && !r.gemischt && !r.schritte.some((x) => x.effekte.length || x.bomben)) {
        dreiSchritte = r
        break
      }
    }
  }
  if (dreiSchritte) {
    const alt = 150 + 3 * 220
    pruefe('Takt: Kaskade mit drei Schritten deutlich flotter', aufloesungMs(dreiSchritte) <= alt * 0.8, `${aufloesungMs(dreiSchritte)} ms statt ${alt} ms`)
  }
}

/* ------------------------------------------------------------------ */
/* Simulation ganzer Laeufe                                            */
/* ------------------------------------------------------------------ */

/**
 * Ein 40-s-Lauf. Der Bot nimmt den Zug mit den meisten Grundpunkten
 * (probeweise auf einer Kopie ausgewertet) und wartet `pause()` ms nach der
 * Freigabe. Punkte zaehlen voll, auch wenn die Aufloesung das Ende ueberragt
 * — die Hochrechnung liegt damit eher zu hoch.
 */
function lauf(saat, pause) {
  const zufall = zufallMitSaat(saat)
  const st = neuesSpiel(zufall)
  let t = 0
  let stufe = 0
  let punkte = 0
  let runden = 0
  let maxZug = 0
  let erstes = true
  for (;;) {
    const warte = pause(zufall)
    t += warte
    if (t >= SERVER.dauerMs) break
    const zuege = alleZuege(st.feld)
    let best = zuege[0]
    let bestWert = -1
    for (const [a, b] of zuege) {
      const probe = { feld: kopie(st.feld), naechsteId: st.naechsteId, zufall: zufallMitSaat(saat + runden) }
      const w = tauschen(probe, a, b).punkte
      if (w > bestWert) {
        bestWert = w
        best = [a, b]
      }
    }
    const e = tauschen(st, best[0], best[1])
    if (!e.gueltig) break
    stufe = erstes ? 0 : serieWeiter(stufe, warte)
    erstes = false
    runden += 1
    const z = zugPunkte(e.schritte, { tempoStufe: stufe, finale: istFinale(SERVER.dauerMs - t) })
    punkte += z.summe
    maxZug = Math.max(maxZug, z.summe)
    t += aufloesungMs(e)
  }
  return { punkte, runden, maxZug }
}

function profil(name, pause, laeufe) {
  const erg = []
  for (let i = 0; i < laeufe; i += 1) erg.push(lauf(1000 + i * 7919, pause))
  const p = erg.map((r) => r.punkte).sort((a, b) => a - b)
  const r = erg.map((x) => x.runden)
  const schnitt = Math.round(p.reduce((a, b) => a + b, 0) / p.length)
  const max = p[p.length - 1]
  const p90 = p[Math.floor(p.length * 0.9)]
  const maxRunden = Math.max(...r)
  const maxZug = Math.max(...erg.map((x) => x.maxZug))
  console.log(
    `     ${name.padEnd(26)} Schnitt ${String(schnitt).padStart(6)}  P90 ${String(p90).padStart(6)}  Max ${String(max).padStart(6)}  ` +
      `Runden ${Math.min(...r)}–${maxRunden}  ms/Runde min ${Math.round(SERVER.dauerMs / maxRunden)}  bester Zug ${maxZug}`,
  )
  return { schnitt, max, p90, maxRunden, maxZug }
}

{
  const gleich = (von, bis) => (z) => von + z() * (bis - von)
  const normal = profil('normal 1,2–2,5 s', gleich(1200, 2500), 40)
  const sehrGut = profil('sehr gut 450–700 ms', gleich(450, 700), 40)
  const bot = profil('Bot ohne Pause (Extrem)', () => 0, 25)

  pruefe('Simulation: sehr gut > normal (Tempo lohnt sich)', sehrGut.schnitt > normal.schnitt * 1.4, `${sehrGut.schnitt} / ${normal.schnitt}`)
  pruefe('Simulation: sehr guter Lauf nie ueber msJeRunde', SERVER.dauerMs / sehrGut.maxRunden >= SERVER.msJeRunde)
  pruefe('Simulation: Bot ohne Pause nie ueber msJeRunde', SERVER.dauerMs / bot.maxRunden >= SERVER.msJeRunde, `${bot.maxRunden} Runden`)
  pruefe('Simulation: kein Zug ueber maxJeRunde', bot.maxZug <= SERVER.maxJeRunde && sehrGut.maxZug <= SERVER.maxJeRunde)
  pruefe(`Simulation: sehr guter Mensch unter plausibel-Vorschlag (${SERVER.plausibel})`, sehrGut.max <= SERVER.plausibel, `${sehrGut.max}`)
  pruefe(`Simulation: Bot ohne Pause unter hart-Vorschlag (${SERVER.hart})`, bot.max <= SERVER.hart, `${bot.max}`)
  pruefe('Simulation: normaler Lauf unter heutigem plausibel', normal.max <= SERVER_HEUTE.plausibel, `${normal.max}`)
  console.log(
    `     Info heute: sehr gut Max ${sehrGut.max} ${sehrGut.max > SERVER_HEUTE.plausibel ? '>' : '<='} plausibel ${SERVER_HEUTE.plausibel}, ` +
      `Bot Max ${bot.max} ${bot.max > SERVER_HEUTE.hart ? '>' : '<='} hart ${SERVER_HEUTE.hart}`,
  )
}

console.log(`\nKuechen-Crush-Logik: ${gut} OK, ${schlecht} Fehler`)
if (schlecht) process.exit(1)
