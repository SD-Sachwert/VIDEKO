/**
 * KUECHEN-FIT — Test des Spielgefuehls, ohne Browser.
 *
 *   node scripts/spiele/fit-gefuehl-test.mjs
 *
 * Prueft nur die reinen Funktionen aus fit-logik.js: die Bewertung einer
 * Platzierung (PERFECT FIT / GOOD / KNAPP DANEBEN), Combo-Aufbau und
 * Combo-Abbruch, die Zeitgutschrift auf den Geduldsbalken, Start und
 * sauberes Ende des Fiebers, die Einbau-Zone und die langsam steigende
 * Schwierigkeit. Kein React, kein DOM, keine Uhr.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BREITE,
  FIEBER_AB,
  FIEBER_AB_STARK,
  FIEBER_GEDULD,
  FIEBER_MS,
  FIEBER_NACH_MS,
  FIEBER_STARK_MS,
  GEDULD_MAX_MS,
  GEDULD_START_MS,
  GUT_PASSUNG,
  HOEHE,
  HUMOR_PAUSE_MS,
  MAX_JE_TEIL,
  MAX_JE_ZUG,
  MAX_PLATZIERUNG,
  MULT_MAX,
  PERFEKT_PASSUNG,
  PLATZ_PUNKTE,
  STUFE_MAX,
  TEILE,
  ZEIT_BONUS,
  ZEIT_JE_REIHE,
  ZEIT_ZONE,
  ZONE_BREITE_MAX,
  ZONE_BREITE_MIN,
  ZONE_PUNKTE,
  bewerten,
  festsetzen,
  gefuehlPlatzierung,
  gefuehlStart,
  gefuehlTakt,
  gesamtMult,
  leeresFeld,
  loecherUnter,
  neueZone,
  neuesSpiel,
  passungMessen,
  platzPunkte,
  schwierigkeit,
  zoneAnteil,
  zoneSpalten,
  zoneTakt,
  zonenBreite,
  zonenTempo,
} from '../../src/components/spiele/fit-logik.js'

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

/* Feld mit gefuellten Zellen bauen: `voll(y, spalten)` fuellt die genannten
   Spalten der Reihe y. Ohne Spaltenliste die ganze Reihe. */
function feldMit(zeilen = []) {
  const feld = leeresFeld()
  for (const [y, spalten] of zeilen) {
    const liste = spalten ?? [...Array(BREITE).keys()]
    for (const x of liste) feld[y][x] = 1
  }
  return feld
}

/* Hilfe: eine Platzierungskette abspielen und den Zustand zurueckgeben. */
function kette(zustand, arten, extra = {}) {
  let z = zustand
  const ereignisse = []
  for (const art of arten) {
    const r = gefuehlPlatzierung(z, { art, zufall: () => 0.5, ...extra })
    z = r.zustand
    ereignisse.push(r.ereignis)
  }
  return { zustand: z, ereignisse }
}

/* ------------------------------------------------------------------ */
console.log('\nPassung und Loecher')

{
  /* Arbeitsplatte flach auf dem leeren Boden, mittig: alle vier Unterkanten
     liegen an, die Seiten nicht — 4 von 6. */
  const feld = leeresFeld()
  const platte = { typ: 'I', dreh: 0, x: 3, y: HOEHE - 2 }
  const m = passungMessen(feld, platte)
  pruefe('flach auf dem Boden: 4 von 6 Kanten liegen an', m.kanten === 6 && m.beruehrt === 4, `${m.beruehrt}/${m.kanten}`)
  pruefe('auf dem Boden entsteht keine Luecke', loecherUnter(feld, platte) === 0)

  /* Dieselbe Platte in einer 4er-Nische: Boden und beide Seiten liegen an. */
  const nische = feldMit([[HOEHE - 1, [0, 1, 2, 7, 8, 9]], [HOEHE - 2, [0, 1, 2, 7, 8, 9]]])
  const drin = { typ: 'I', dreh: 0, x: 3, y: HOEHE - 2 }
  const m2 = passungMessen(nische, drin)
  pruefe('in der Nische liegen alle 6 Kanten an', m2.passung === 1, String(m2.passung))

  /* Auf einem Vorsprung: unter zwei der vier Spalten bleibt Luft. */
  const stufeFeld = feldMit([[HOEHE - 1, [0, 1]]])
  const oben = { typ: 'I', dreh: 0, x: 0, y: HOEHE - 3 }
  pruefe('Luecken unter dem Teil werden gezaehlt', loecherUnter(stufeFeld, oben) === 2, String(loecherUnter(stufeFeld, oben)))
}

/* ------------------------------------------------------------------ */
console.log('\nBewertung: PERFECT FIT / GOOD / KNAPP DANEBEN')

{
  const nische = feldMit([[HOEHE - 1, [0, 1, 2, 7, 8, 9]], [HOEHE - 2, [0, 1, 2, 7, 8, 9]]])
  const drin = { typ: 'I', dreh: 0, x: 3, y: HOEHE - 2 }
  pruefe('satt eingepasst ist PERFECT FIT', bewerten(nische, drin).art === 'perfekt', bewerten(nische, drin).art)

  const feld = leeresFeld()
  const flach = { typ: 'I', dreh: 0, x: 3, y: HOEHE - 2 }
  const b = bewerten(feld, flach)
  pruefe('sauber, aber ohne Anschluss ist GOOD', b.art === 'gut', `${b.art} bei Passung ${b.passung}`)

  const stufeFeld = feldMit([[HOEHE - 1, [0, 1]]])
  const drueber = { typ: 'I', dreh: 0, x: 0, y: HOEHE - 3 }
  pruefe('zwei neue Luecken sind KNAPP DANEBEN', bewerten(stufeFeld, drueber).art === 'daneben')

  /* Eine einzige Luecke, aber sonst satt: das laesst die Bewertung noch als
     GOOD durchgehen — sie soll nicht kleinlich sein. */
  const einLoch = feldMit([
    [HOEHE - 3, [4, 7]],
    [HOEHE - 2, [4, 7]],
    [HOEHE - 1, [0, 1, 2, 3, 4, 6, 7, 8, 9]],
  ])
  const teilA = { typ: 'O', dreh: 0, x: 5, y: HOEHE - 3 }
  const bA = bewerten(einLoch, teilA)
  pruefe('eine Luecke mit satter Passung bleibt GOOD', bA.art === 'gut' && bA.loecher === 1, `${bA.art}, ${bA.loecher} Loch, Passung ${bA.passung}`)

  /* Der alte Reihen-Perfekt schlaegt immer durch. */
  pruefe('exakt geschlossene Reihe ist immer PERFECT FIT', bewerten(leeresFeld(), flach, { perfekt: true }).art === 'perfekt')

  /* Die voll getroffene Zone hebt eine saubere Platzierung auf PERFECT. */
  const inZone = bewerten(leeresFeld(), flach, { zonenAnteil: 1 })
  pruefe('volle Zone hebt GOOD auf PERFECT FIT', inZone.art === 'perfekt' && inZone.zonenTreffer === true)
  pruefe('halb getroffene Zone hebt nichts', bewerten(leeresFeld(), flach, { zonenAnteil: 0.5 }).art === 'gut')
  pruefe('Zone rettet eine Luecke nicht', bewerten(stufeFeld, drueber, { zonenAnteil: 1 }).art === 'daneben')
  pruefe('Schwellen stehen fest', PERFEKT_PASSUNG === 0.75 && GUT_PASSUNG === 0.45)
}

{
  /* Und dasselbe durch den echten Ablauf: festsetzen liefert die Note mit. */
  const stand = neuesSpiel(zufallMit(7))
  const { ereignis } = festsetzen(stand, 0, 0)
  pruefe('festsetzen liefert eine Note mit', ['perfekt', 'gut', 'daneben'].includes(ereignis.art), String(ereignis.art))
  pruefe('festsetzen liefert Passung und Loecher mit', typeof ereignis.passung === 'number' && typeof ereignis.loecher === 'number')
  pruefe('festsetzen mit voller Zone meldet den Treffer', festsetzen(stand, 0, 1).ereignis.zonenTreffer === true)
}

/* ------------------------------------------------------------------ */
console.log('\nCombo: Aufbau und Abbruch')

{
  const start = gefuehlStart(zufallMit(11))
  pruefe('frischer Zustand hat Combo 0', start.combo === 0 && start.perfektKette === 0 && start.fieber === null)

  const auf = kette(start, ['gut', 'perfekt', 'gut', 'perfekt'])
  pruefe('GOOD und PERFECT bauen die Combo auf', auf.zustand.combo === 4, String(auf.zustand.combo))
  pruefe('Combo-Ereignis zaehlt mit', auf.ereignisse.map((e) => e.combo).join(',') === '1,2,3,4')
  pruefe('nur PERFECT fuehrt die Perfect-Kette', auf.zustand.perfektKette === 1, String(auf.zustand.perfektKette))

  const ab = kette(auf.zustand, ['daneben'])
  pruefe('KNAPP DANEBEN bricht die Combo', ab.zustand.combo === 0 && ab.ereignisse[0].comboAus === true)
  pruefe('die beste Combo bleibt gemerkt', ab.zustand.besteCombo === 4)
  pruefe('KNAPP DANEBEN bringt keine Punkte', ab.ereignisse[0].punkte === 0)

  /* Der Faktor haengt an der Combo-Leiter aus spielgefuehl.js. */
  pruefe('Combo 1 hat Faktor 1', gesamtMult(1, null) === 1)
  pruefe('Combo 3 hat Faktor 1,5', gesamtMult(3, null) === 1.5)
  pruefe('Combo 12 hat Faktor 3', gesamtMult(12, null) === 3)
  pruefe('Combo und Fieber zusammen sind bei 6 gedeckelt', gesamtMult(12, { stufe: 2 }) === MULT_MAX)

  pruefe(
    'PERFECT bringt mehr als GOOD',
    platzPunkte({ art: 'perfekt' }) > platzPunkte({ art: 'gut' }) && platzPunkte({ art: 'gut' }) > 0,
  )
  pruefe(
    'die Zone legt oben drauf',
    platzPunkte({ art: 'perfekt', zonenTreffer: true }) === PLATZ_PUNKTE.perfekt + ZONE_PUNKTE,
  )
  pruefe(
    'die Combo vervielfacht die Platzierung',
    platzPunkte({ art: 'perfekt', combo: 12 }) === PLATZ_PUNKTE.perfekt * 3,
  )
}

/* ------------------------------------------------------------------ */
console.log('\nZeitbonus auf den Geduldsbalken')

{
  const start = gefuehlStart(zufallMit(3))
  pruefe('der Balken startet nicht ganz voll', start.geduldMs === GEDULD_START_MS && GEDULD_START_MS < GEDULD_MAX_MS)

  const p = gefuehlPlatzierung(start, { art: 'perfekt', zufall: () => 0.5 })
  pruefe('PERFECT schenkt Zeit', p.ereignis.zeitBonus === ZEIT_BONUS.perfekt, String(p.ereignis.zeitBonus))
  pruefe('der Balken steigt', p.zustand.geduldMs === GEDULD_START_MS + ZEIT_BONUS.perfekt)

  const g = gefuehlPlatzierung(start, { art: 'gut', zufall: () => 0.5 })
  pruefe('GOOD schenkt weniger Zeit', g.ereignis.zeitBonus === ZEIT_BONUS.gut && ZEIT_BONUS.gut < ZEIT_BONUS.perfekt)

  const d = gefuehlPlatzierung(start, { art: 'daneben', zufall: () => 0.5 })
  pruefe('KNAPP DANEBEN schenkt keine Zeit', d.ereignis.zeitBonus === 0)

  const tief = { ...start, geduldMs: 5000 }
  const r = gefuehlPlatzierung(tief, { art: 'perfekt', reihen: 2, zonenTreffer: true, zufall: () => 0.5 })
  pruefe(
    'Reihen und Zone kommen dazu',
    r.ereignis.zeitBonus === ZEIT_BONUS.perfekt + 2 * ZEIT_JE_REIHE + ZEIT_ZONE,
    String(r.ereignis.zeitBonus),
  )

  /* Der Deckel darf nicht luegen: gemeldet wird, was der Balken schluckt. */
  const fast = { ...start, geduldMs: GEDULD_MAX_MS - 500 }
  const deckel = gefuehlPlatzierung(fast, { art: 'perfekt', zufall: () => 0.5 })
  pruefe('am Deckel wird nur gutgeschrieben, was passt', deckel.zustand.geduldMs === GEDULD_MAX_MS && deckel.ereignis.zeitBonus === 500)

  /* Der Balken sinkt im Takt und meldet sich, wenn er leer ist. */
  const t1 = gefuehlTakt(start, 200, 1)
  pruefe('ohne Fieber sinkt die Geduld 1:1', t1.zustand.geduldMs === GEDULD_START_MS - 200, String(t1.zustand.geduldMs))
  const t9 = gefuehlTakt(start, 200, 9)
  pruefe('in hoeheren Stufen sinkt sie schneller', t9.zustand.geduldMs < t1.zustand.geduldMs)
  pruefe(
    'ein Ausreisser (Tab im Hintergrund) frisst den Balken nicht auf',
    gefuehlTakt(start, 100000, 1).zustand.geduldMs >= GEDULD_START_MS - 250,
  )

  let leer = { ...start, geduldMs: 400 }
  const e1 = gefuehlTakt(leer, 200, 1)
  pruefe('mit Rest meldet der Takt nichts', e1.ereignis.leer === false)
  const e2 = gefuehlTakt(e1.zustand, 250, 1)
  pruefe('leerer Balken meldet sich genau einmal', e2.ereignis.leer === true && e2.zustand.geduldMs === 0)
  pruefe('der Balken geht nicht ins Minus', gefuehlTakt(e2.zustand, 250, 1).zustand.geduldMs === 0)
}

/* ------------------------------------------------------------------ */
console.log('\nFieber: Start, Wirkung, sauberes Ende')

{
  const start = gefuehlStart(zufallMit(5))
  const zwei = kette(start, ['perfekt', 'perfekt'])
  pruefe('zwei PERFECT zuenden noch nichts', zwei.zustand.fieber === null && zwei.ereignisse.every((e) => e.fieberStart === 0))

  const drei = kette(zwei.zustand, ['perfekt'])
  pruefe(`PERFECT x${FIEBER_AB} startet das Fieber`, drei.zustand.fieber?.stufe === 1 && drei.ereignisse[0].fieberStart === 1)
  pruefe('das Fieber laeuft die volle Zeit', drei.zustand.fieber.restMs === FIEBER_MS)
  pruefe('der ausloesende Zug zaehlt schon mit Fieber', drei.ereignisse[0].mult === gesamtMult(3, { stufe: 1 }))

  const vier = kette(drei.zustand, ['perfekt'])
  pruefe('jedes weitere PERFECT verlaengert, deckelt aber', vier.zustand.fieber.restMs === FIEBER_MS)

  const fuenf = kette(vier.zustand, ['perfekt'])
  pruefe(`PERFECT x${FIEBER_AB_STARK} hebt das Fieber auf Stufe 2`, fuenf.zustand.fieber?.stufe === 2 && fuenf.ereignisse[0].fieberStart === 2)
  pruefe('Stufe 2 laeuft laenger', fuenf.zustand.fieber.restMs === FIEBER_STARK_MS && FIEBER_STARK_MS > FIEBER_MS)
  pruefe('Stufe 2 zahlt mehr als Stufe 1', gesamtMult(5, { stufe: 2 }) > gesamtMult(5, { stufe: 1 }))
  pruefe('es wird gezaehlt, wie oft das Fieber kam', fuenf.zustand.fieberZahl === 2)

  /* Im Fieber sinkt die Geduld langsamer. */
  const langsam = gefuehlTakt(fuenf.zustand, 200, 1)
  pruefe(
    'im Fieber sinkt die Geduld langsamer',
    Math.round(fuenf.zustand.geduldMs - langsam.zustand.geduldMs) === Math.round(200 * FIEBER_GEDULD),
  )

  /* Verlaengerung, nachdem ein Teil der Fieberzeit abgelaufen ist. */
  let angebrochen = fuenf.zustand
  for (let i = 0; i < 12; i += 1) angebrochen = gefuehlTakt(angebrochen, 250, 1).zustand
  const nach = kette(angebrochen, ['perfekt'])
  pruefe(
    'ein PERFECT im Fieber schiebt Zeit nach',
    nach.zustand.fieber.restMs === FIEBER_STARK_MS - 3000 + FIEBER_NACH_MS,
    String(nach.zustand.fieber.restMs),
  )

  /* Sauberes Ende: genau ein Ende-Ereignis, danach wieder Faktor 1. */
  let z = fuenf.zustand
  let enden = 0
  for (let i = 0; i < 40; i += 1) {
    const r = gefuehlTakt(z, 250, 1)
    z = r.zustand
    if (r.ereignis.fieberEnde) enden += 1
  }
  pruefe('das Fieber endet genau einmal', enden === 1, `${enden} Enden`)
  pruefe('danach ist das Fieber sauber weg', z.fieber === null)
  pruefe('danach zaehlt wieder der reine Combo-Faktor', gesamtMult(z.combo, z.fieber) === gesamtMult(z.combo, null))
  pruefe('die Combo ueberlebt das Fieberende', z.combo === fuenf.zustand.combo && z.combo === 5)
  const danach = kette(z, ['perfekt'])
  pruefe('nach dem Ende zuendet es nicht von selbst neu', danach.zustand.fieber === null)

  /* Ein DANEBEN bricht die Perfect-Kette, das laufende Fieber laeuft aus. */
  const bruch = kette(fuenf.zustand, ['daneben'])
  pruefe('DANEBEN bricht die Perfect-Kette', bruch.zustand.perfektKette === 0)
  pruefe('das laufende Fieber wird nicht abgewuergt', bruch.zustand.fieber?.stufe === 2)
  const neuDrei = kette(gefuehlStart(zufallMit(5)), ['perfekt', 'daneben', 'perfekt', 'perfekt'])
  pruefe('eine unterbrochene Kette zuendet nicht', neuDrei.zustand.fieber === null && neuDrei.zustand.perfektKette === 2)
}

/* ------------------------------------------------------------------ */
console.log('\nEinbau-Zone')

{
  pruefe('die Zone ist am Anfang am breitesten', zonenBreite(1) === ZONE_BREITE_MAX)
  pruefe('sie wird schmaler, aber nie schmaler als das Minimum', zonenBreite(STUFE_MAX) === ZONE_BREITE_MIN)
  let breiteFallend = true
  for (let s = 2; s <= STUFE_MAX; s += 1) if (zonenBreite(s) > zonenBreite(s - 1)) breiteFallend = false
  pruefe('die Breite nimmt nie zu', breiteFallend)

  pruefe('vor Stufe 6 steht die Zone still', zonenTempo(1) === 0 && zonenTempo(5) === 0)
  pruefe('ab Stufe 6 wandert sie', zonenTempo(6) > 0)
  pruefe('das Tempo ist gedeckelt', zonenTempo(STUFE_MAX) <= 1.6)

  const zone = neueZone(1, zufallMit(9), null)
  pruefe('die Zone liegt vollstaendig im Feld', zone.x >= 0 && zone.x + zone.breite <= BREITE)
  const spalten = zoneSpalten(zone)
  pruefe('die Spalten passen zur Breite', spalten.bis - spalten.von === zone.breite)

  const teilDrin = { typ: 'O', dreh: 0, x: spalten.von, y: HOEHE - 2 }
  pruefe('ein Teil in der Zone zaehlt voll', zoneAnteil(zone, teilDrin) === 1)
  const teilDraussen = { typ: 'O', dreh: 0, x: spalten.bis < BREITE - 1 ? spalten.bis : 0, y: HOEHE - 2 }
  pruefe('ein Teil daneben zaehlt weniger', zoneAnteil(zone, teilDraussen) < 1)

  /* Wandern: die Zone bleibt im Feld und prallt ab. */
  let w = { x: 0, breite: 4, tempo: 1.5, richtung: -1 }
  let immerDrin = true
  let bewegt = false
  for (let i = 0; i < 400; i += 1) {
    const vorher = w.x
    w = zoneTakt(w, 16, 10)
    if (w.x < 0 || w.x + w.breite > BREITE) immerDrin = false
    if (w.x !== vorher) bewegt = true
  }
  pruefe('die wandernde Zone bleibt im Feld', immerDrin)
  pruefe('die wandernde Zone bewegt sich wirklich', bewegt)
  const steht = { x: 2, breite: 5, tempo: 0, richtung: 1 }
  pruefe('eine stehende Zone bleibt liegen', zoneTakt(steht, 500, 1).x === 2)
}

/* ------------------------------------------------------------------ */
console.log('\nSchwierigkeit steigt langsam')

{
  const kurve = [0, 10, 30, 60, 120, 300, 600].map((s) => schwierigkeit(s, 0))
  let monoton = true
  for (let i = 1; i < kurve.length; i += 1) {
    const a = kurve[i - 1]
    const b = kurve[i]
    if (b.stufe < a.stufe) monoton = false
    if (b.fallMs > a.fallMs) monoton = false
    if (b.zonenBreite > a.zonenBreite) monoton = false
    if (b.zonenTempo < a.zonenTempo) monoton = false
    if (b.geduldTempo < a.geduldTempo) monoton = false
  }
  pruefe('alles zieht in eine Richtung an', monoton)
  pruefe('die erste halbe Minute bleibt ruhig', kurve[0].zonenTempo === 0 && kurve[2].zonenTempo === 0)
  pruefe('der Anfang hat die breite Zone', kurve[0].zonenBreite === ZONE_BREITE_MAX)
  pruefe('spaet ist die Zone schmal und in Bewegung', kurve[6].zonenBreite === ZONE_BREITE_MIN && kurve[6].zonenTempo > 0)
  pruefe('die Geduld sinkt nie mehr als 1,6-fach', kurve[6].geduldTempo <= 1.6)
  pruefe('am Anfang sinkt die Geduld einfach', kurve[0].geduldTempo === 1)
  pruefe('auch spaet bleibt die Zone benutzbar', kurve[6].zonenBreite >= 3)

  console.log(`        Stufe/Zone/Tempo/Geduld: ${kurve.map((k) => `${k.stufe}:${k.zonenBreite}:${k.zonenTempo}:${k.geduldTempo}`).join('  ')}`)
}

/* ------------------------------------------------------------------ */
console.log('\nHumor bleibt selten')

{
  let z = gefuehlStart(zufallMit(2))
  /* Fuenf Perfects am Stueck: das Fieber zuendet zweimal, ein Spruch darf
     aber nur einmal kommen — die Pause ist noch nicht um. */
  const lauf = kette(z, ['perfekt', 'perfekt', 'perfekt', 'perfekt', 'perfekt'])
  const spruecheDirekt = lauf.ereignisse.filter((e) => e.spruch).length
  pruefe('in fuenf Zuegen kommt hoechstens ein Spruch', spruecheDirekt <= 1, `${spruecheDirekt} Sprueche`)
  pruefe('ueberhaupt kommt einer', spruecheDirekt === 1)

  /* Nach der Pause darf wieder einer kommen, und es ist ein anderer. */
  let spaeter = lauf.zustand
  for (let i = 0; i < 120; i += 1) spaeter = gefuehlTakt(spaeter, 250, 1).zustand
  pruefe('genug Zeit fuer den naechsten Spruch vergangen', spaeter.zeitMs - spaeter.letzterSpruchMs >= HUMOR_PAUSE_MS)
  const nochmal = kette(spaeter, ['daneben', 'daneben', 'daneben'])
  const zweiter = nochmal.ereignisse.find((e) => e.spruch)?.spruch
  const erster = lauf.ereignisse.find((e) => e.spruch)?.spruch
  pruefe('danach kommt ein Spruch, und ein anderer', !!zweiter && zweiter !== erster, `${erster} / ${zweiter}`)

  /* Ein gewoehnlicher Zug sagt nie etwas. */
  const still = kette(gefuehlStart(zufallMit(4)), ['gut', 'gut', 'gut', 'gut'])
  pruefe('normale Zuege bleiben stumm', still.ereignisse.every((e) => !e.spruch))
}

/* ------------------------------------------------------------------ */
console.log('\nPunktedeckel (Info fuer die Servergrenzen)')

{
  pruefe('die Reihenwertung ist unveraendert', MAX_JE_TEIL === 12000)
  pruefe('die Platzierung allein bleibt unter 1100', MAX_PLATZIERUNG < 1100, String(MAX_PLATZIERUNG))
  pruefe('der Deckel je Zug ist die Summe', MAX_JE_ZUG === MAX_JE_TEIL + MAX_PLATZIERUNG + 34)
  console.log(`        hoechster Zug theoretisch: ${MAX_JE_ZUG} (Reihen ${MAX_JE_TEIL} + Platzierung ${MAX_PLATZIERUNG} + Fall 34)`)
  console.log(`        hoechste Platzierung: (${PLATZ_PUNKTE.perfekt} + ${ZONE_PUNKTE}) x ${MULT_MAX} = ${MAX_PLATZIERUNG}`)
}

/* ------------------------------------------------------------------ */
console.log('\nDauerlauf: nichts laeuft aus dem Ruder')

{
  /* 4000 Takte plus Platzierungen: der Zustand darf nicht wachsen, keine
     Zahl darf NaN werden, nichts darf sich aufschaukeln. */
  let z = gefuehlStart(zufallMit(17))
  const zuf = zufallMit(23)
  let punkte = 0
  let leerGemeldet = 0
  for (let i = 0; i < 4000; i += 1) {
    const r = gefuehlTakt(z, 16, 1 + Math.floor(i / 400))
    z = r.zustand
    if (r.ereignis.leer) leerGemeldet += 1
    if (i % 25 === 0) {
      const w = zuf()
      const art = w < 0.35 ? 'perfekt' : w < 0.8 ? 'gut' : 'daneben'
      const p = gefuehlPlatzierung(z, { art, reihen: w < 0.2 ? 1 : 0, stufe: 1 + Math.floor(i / 400), zufall: zuf })
      z = p.zustand
      punkte += p.ereignis.punkte
    }
  }
  const zahlen = [z.combo, z.geduldMs, z.punkte, z.zone.x, z.zeitMs]
  pruefe('alle Werte bleiben Zahlen', zahlen.every((v) => Number.isFinite(v)), zahlen.join(','))
  pruefe('die Geduld bleibt im Rahmen', z.geduldMs >= 0 && z.geduldMs <= GEDULD_MAX_MS)
  pruefe('die Zone bleibt im Feld', z.zone.x >= 0 && z.zone.x + z.zone.breite <= BREITE)
  pruefe('die Punkte stimmen mit dem Zustand ueberein', z.punkte === punkte)
  const schnitt = Math.round(punkte / 160)
  pruefe('der Schnitt je Platzierung bleibt unter 1200', schnitt < 1200, `${schnitt}/Zug`)
  console.log(`        160 Platzierungen: ${punkte} Platzierungspunkte, ${schnitt}/Zug, ${z.fieberZahl}x Fieber, beste Combo ${z.besteCombo}, ${leerGemeldet} Leermeldungen`)
}

/* -------------------------------------------------------------------- */
/* Taste FALLEN LASSEN und die Teile aus dem ganzen VIDEKO-Universum.     */
/*                                                                       */
/* Was hier folgt, liest Quelltext als Text. Das ist kein Ersatz dafuer,  */
/* das Spiel auf einem Geraet in die Hand zu nehmen — eine Taste kann in  */
/* der Datei richtig stehen und auf 390 px trotzdem unter dem Daumen      */
/* verschwinden. Der Block haelt nur fest, was ohne Browser pruefbar ist: */
/* dass die Taste da ist, gross genug angelegt, am Zeiger haengt und die  */
/* Buehne nicht mitbedient — und dass die Teileliste ueber die Gewerke    */
/* reicht, ohne dass an den gemessenen Formen etwas verrutscht ist.       */
const HIER = dirname(fileURLToPath(import.meta.url))
const WURZEL = resolve(HIER, '../..')
const FIT_JSX = readFileSync(resolve(WURZEL, 'src/components/spiele/KuechenFit.jsx'), 'utf8')
const FIT_CSS = readFileSync(resolve(WURZEL, 'src/components/spiele/fit.css'), 'utf8')

console.log('\nTaste FALLEN LASSEN')
{
  pruefe('die Taste steht im Spiel', /className="trm-fit-drop"/.test(FIT_JSX))
  pruefe('sie traegt den Text FALLEN LASSEN', /FALLEN LASSEN/.test(FIT_JSX))
  pruefe('sie hat eine Beschriftung fuer Screenreader', /aria-label="Teil sofort fallen lassen"/.test(FIT_JSX))

  const block = FIT_JSX.slice(FIT_JSX.indexOf('className="trm-fit-drop"'))
  const taste = block.slice(0, block.indexOf('</button>'))
  pruefe('sie wirft auf pointerdown ab, nicht erst auf click', /onPointerDown=\{[^}]*hartAbsetzen\(\)/s.test(taste))
  pruefe('click greift nur fuer die Tastatur (detail === 0)', /detail === 0/.test(taste))
  const stopps = (taste.match(/stopPropagation\(\)/g) || []).length
  pruefe('sie reicht Zeiger und Tasten nicht an die Buehne durch', stopps >= 4, `${stopps} Stopps`)

  /* Thumb-friendly heisst hier: mindestens 48 px hoch — darunter wird die
     Taste auf dem Handy zur Zielscheibe statt zum Knopf. */
  const hoehe = Number((FIT_CSS.match(/\.trm-fit-drop\s*\{[^}]*min-height:\s*(\d+)px/s) || [])[1])
  pruefe('sie ist mindestens 48 px hoch', hoehe >= 48, `${hoehe}px`)
  const breite = Number((FIT_CSS.match(/\.trm-fit-drop\s*\{[^}]*min-width:\s*min\((\d+)px/s) || [])[1])
  pruefe('sie laeuft breit ueber das Feld', breite >= 240, `${breite}px`)
  pruefe('sie sitzt unten im Bild', /\.trm-fit-drop\s*\{[^}]*bottom:/s.test(FIT_CSS))
  pruefe('der Druck ist spuerbar (scale beim Tippen)', /\.trm-fit-drop:active\s*\{[^}]*scale:\s*0\.9/s.test(FIT_CSS))
  pruefe('sanfter Modus laesst das Nachgeben weg', /prefers-reduced-motion[\s\S]*\.trm-fit-drop:active\s*\{\s*scale:\s*1/.test(FIT_CSS))

  /* Auf dem Desktop faellt das Teil weiter ueber die Buehne: Leertaste und
     Enter stehen in ihrer Liste bekannter Tasten und landen im Zweig, der
     hart absetzt. */
  const bekannt = FIT_JSX.match(/const bekannt = \[([^\]]*)\]/)
  pruefe('die Buehne kennt Leertaste und Enter', !!bekannt && /' '/.test(bekannt[1]) && /'Enter'/.test(bekannt[1]))
  pruefe('sie setzt damit hart ab', /if \(!e\.repeat\) hartAbsetzen\(\)/.test(FIT_JSX))
}

console.log('\nTeile aus dem ganzen VIDEKO-Universum')
{
  const teile = Object.values(TEILE)
  const namen = teile.map((t) => t.name)
  pruefe('jedes Teil hat einen Namen', namen.every((n) => typeof n === 'string' && n.length >= 3))
  pruefe('kein Name doppelt', new Set(namen).size === namen.length)

  /* Kuechen bleiben drin — sie sind der Kern. Sie duerfen die Liste aber
     nicht mehr allein fuellen: Bad, Boden, Wand, Decke, Elektro und PV
     gehoeren genauso ins Bild. */
  const kueche = ['UNTERSCHRANK', 'ECKSCHRANK', 'KOCHINSEL', 'KÜHLKOMBI']
  const weiter = ['STEIGLEITUNG', 'DIELENPAKET', 'SOCKELPROFIL', 'DECKENPROFIL', 'WANDPANEEL', 'WASCHTISCH', 'PV-WINKEL', 'LEITUNGSKREUZ', 'TREPPENLAUF']
  pruefe('die Kueche bleibt vertreten', kueche.every((n) => namen.includes(n)))
  pruefe('andere Gewerke sind dabei', weiter.every((n) => namen.includes(n)), weiter.filter((n) => !namen.includes(n)).join(','))
  pruefe('kein Gewerk stellt die Mehrheit', weiter.length > kueche.length, `${kueche.length} Kueche, ${weiter.length} uebrige`)

  /* Die Umbenennung darf die Balance nicht angefasst haben: Code, Gruppe,
     Kasten und Zellen sind gemessen und bleiben, wie sie waren. */
  const codes = teile.map((t) => t.code)
  pruefe('die Codes sind unveraendert', codes.join(',') === '1,2,3,4,5,6,7,8,10,11,12,13,14', codes.join(','))
  const zellen = teile.map((t) => t.zellen.length)
  pruefe('die Zellenzahlen sind unveraendert', zellen.join(',') === '4,3,4,4,4,4,4,4,5,5,5,5,5', zellen.join(','))
  pruefe('die Kaesten bleiben 2 bis 4 breit', teile.every((t) => t.box >= 2 && t.box <= 4))
  const gruppen = teile.map((t) => t.gruppe)
  pruefe('acht Basisteile', gruppen.filter((g) => g === 'basis').length === 8)
  pruefe('drei komplexe Teile', gruppen.filter((g) => g === 'komplex').length === 3)
  pruefe('zwei Problemteile', gruppen.filter((g) => g === 'problem').length === 2)

  /* Die drei neuen Fronten brauchen jeweils einen eigenen Pinselstrich,
     sonst heissen die Teile anders und sehen gleich aus. */
  for (const griff of ['rohr', 'fuge', 'raster']) {
    pruefe(`Front "${griff}" wird auch gemalt`, new RegExp(`griff === '${griff}'`).test(FIT_JSX))
  }
}

console.log(`\n${gut} ok, ${schlecht} fehlgeschlagen`)
process.exit(schlecht ? 1 : 0)
