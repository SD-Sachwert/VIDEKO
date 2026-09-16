/**
 * Leitungsfinder — reine Logiktests, ohne Browser.
 *
 *   node scripts/spiele/leitung-logik-test.mjs
 *
 * Prueft wandParameter, die Wand-Erzeugung mit injiziertem Zufall, loest
 * mehrere Waende hintereinander per Bot, die Serie und die Punktdecke je
 * Bohrung gegen die Servergrenzen (api/_terminal-kern.js, nur gelesen).
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  ANZAHL_MAX,
  ARTEN,
  BOHRUNG_MAX,
  FELDER,
  GESCHAFFT_SPRUECHE,
  NACHBARN,
  OFFEN,
  SERIE_MS,
  SERIE_STUFEN,
  TAKT_MS,
  VERDECKT,
  ableiten,
  bohrFreigabe,
  bohren,
  geschafftSpruch,
  index,
  markieren,
  neueWand,
  punkteFuer,
  restFuer,
  serieFaktor,
  serieStufe,
  serieWeiter,
  wandErzeugen,
  wandParameter,
} from '../../src/components/spiele/leitung-logik.js'
import { SPIELE } from '../../api/_terminal-kern.js'

const HIER = dirname(fileURLToPath(import.meta.url))
const WURZEL = resolve(HIER, '../..')

/* Servergrenzen fuer leitungsfinder. Gelesen statt abgeschrieben: eine Kopie
   veraltet still, und dann prueft der Test gegen eine Grenze, die es nicht
   mehr gibt. */
const SERVER = SPIELE.leitungsfinder

let gut = 0
let schlecht = 0
function pruefe(name, ok, info = '') {
  if (ok) gut += 1
  else schlecht += 1
  console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${info ? ` — ${info}` : ''}`)
}

function zufallAus(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/* wandParameter                                                       */
/* ------------------------------------------------------------------ */

{
  let monoton = true
  let summen = true
  let steigt = true
  let vorher = null
  for (let nr = 1; nr <= 30; nr += 1) {
    const p = wandParameter(nr)
    if (p.wasser + p.strom + p.abwasser !== p.anzahl) summen = false
    if (p.spalten * p.reihen !== FELDER) summen = false
    if (vorher) {
      for (const k of ['anzahl', 'wasser', 'strom', 'abwasser', 'faktor']) if (p[k] < vorher[k]) monoton = false
      if (p.anzahl < ANZAHL_MAX && p.anzahl <= vorher.anzahl) steigt = false
    }
    vorher = p
  }
  pruefe('wandParameter: alle Werte monoton steigend (Wand 1–30)', monoton)
  pruefe('wandParameter: Arten summieren sich zur Anzahl', summen)
  pruefe('wandParameter: jede Wand bis zur Obergrenze hat mehr Leitungen', steigt, `Wand 1: ${wandParameter(1).anzahl}, Wand 9: ${wandParameter(9).anzahl}`)
  pruefe('wandParameter: Abwasser erst ab Wand 3', wandParameter(2).abwasser === 0 && wandParameter(3).abwasser > 0)
  pruefe('wandParameter: Wasser und Strom ab Wand 1', wandParameter(1).wasser > 0 && wandParameter(1).strom > 0)
  pruefe('wandParameter: unsinnige Eingaben fallen auf Wand 1', wandParameter(0).nr === 1 && wandParameter('x').nr === 1)
}

/* ------------------------------------------------------------------ */
/* Wand-Erzeugung                                                      */
/* ------------------------------------------------------------------ */

{
  const start = index(2, 6)
  const a = wandErzeugen(7, start, zufallAus(42))
  const b = wandErzeugen(7, start, zufallAus(42))
  const c = wandErzeugen(7, start, zufallAus(43))
  pruefe('Erzeugung: gleicher Zufall ergibt dieselbe Wand', a.leitung.join('') === b.leitung.join('') && a.art.join() === b.art.join())
  pruefe('Erzeugung: anderer Zufall ergibt eine andere Wand', a.leitung.join('') !== c.leitung.join(''))
  const frei = [start, ...NACHBARN[start]].every((i) => !a.leitung[i])
  pruefe('Erzeugung: erstes Loch und Nachbarn frei', frei)
  const p = wandParameter(7)
  const zaehlen = (w, art) => w.art.filter((x) => x === art).length
  pruefe(
    'Erzeugung: Leitungen je Art wie wandParameter',
    a.leitung.reduce((s, x) => s + x, 0) === p.anzahl && ARTEN.every((art) => zaehlen(a, art) === p[art]),
    `wasser ${zaehlen(a, 'wasser')}, strom ${zaehlen(a, 'strom')}, abwasser ${zaehlen(a, 'abwasser')}`,
  )
  pruefe('Erzeugung: Art nur auf Leitungen', a.art.every((x, i) => Boolean(x) === Boolean(a.leitung[i])))
}

/* ------------------------------------------------------------------ */
/* Bot: mehrere Waende hintereinander loesen                           */
/* ------------------------------------------------------------------ */

/**
 * Loest eine Wand wie ein aufmerksamer Mensch: nur sicher gefolgerte Fliesen.
 * Findet der Loeser nichts, bohrt der Bot eine sichere Fliese mit Wissen
 * (gezaehlt als "geraten"). Gibt Bohrungen, Punkte und Ereignisse zurueck.
 */
function wandLoesen(nr, zufall, serieStart, mitSerie) {
  let wand = neueWand(nr)
  let serie = serieStart
  const ereignisse = []
  let geraten = 0
  let treffer = 0
  const naechsteSerie = () => (mitSerie ? serieWeiter(serie, 400) : 1)
  const start = index(Math.floor(zufall() * 8), Math.floor(zufall() * 10))
  const zug = (i) => {
    const s = naechsteSerie()
    const { wand: neu, ereignis } = bohren(wand, i, zufall, s)
    if (ereignis.art === 'nichts') return
    wand = neu
    if (ereignis.art === 'leitung') {
      treffer += 1
      return
    }
    serie = s
    ereignisse.push(ereignis)
  }
  zug(start)
  const bekannt = new Set()
  let sicherheit = 0
  while (!wand.frei && !treffer && sicherheit < 500) {
    sicherheit += 1
    const { sicher } = ableiten(wand.zustand, wand.zahl, wand.anzahl, bekannt)
    if (sicher.length) {
      for (const i of sicher) if (!wand.frei && wand.zustand[i] === VERDECKT) zug(i)
    } else {
      const kandidat = wand.zustand.findIndex((z, i) => z === VERDECKT && !wand.leitung[i])
      if (kandidat < 0) break
      geraten += 1
      zug(kandidat)
    }
  }
  return { wand, ereignisse, geraten, treffer, serie, ohneRaten: wand.ohneRaten }
}

const WAENDE = 12
const SEEDS = [1, 2, 3, 4, 5, 6]
{
  const t0 = Date.now()
  let alleFrei = true
  let keineTreffer = true
  let artenStimmen = true
  let abwasserGesehen = false
  let geratenSumme = 0
  let ohneRatenAnzahl = 0
  let waendeGesamt = 0
  let maxEreignis = 0
  let deckeGehalten = true
  let schwierigkeitSteigt = true
  let restStimmt = true
  const bohrungenJeWand = Array(WAENDE + 1).fill(0)
  let laufMaxSchnitt = 0
  let laufPunkte = 0
  let laufBohrungen = 0

  for (const seed of SEEDS) {
    const zufall = zufallAus(seed)
    let serie = 0
    let vorherAnzahl = 0
    let punkte = 0
    let bohrungen = 0
    for (let nr = 1; nr <= WAENDE; nr += 1) {
      const erg = wandLoesen(nr, zufall, serie, true)
      serie = erg.serie
      waendeGesamt += 1
      if (!erg.wand.frei) alleFrei = false
      if (erg.treffer) keineTreffer = false
      geratenSumme += erg.geraten
      if (erg.ohneRaten) ohneRatenAnzahl += 1
      const p = wandParameter(nr)
      for (const art of ARTEN) if (erg.wand.art.filter((x) => x === art).length !== p[art]) artenStimmen = false
      if (p.abwasser > 0 && erg.wand.art.includes('abwasser')) abwasserGesehen = true
      if (erg.wand.anzahl < vorherAnzahl) schwierigkeitSteigt = false
      vorherAnzahl = erg.wand.anzahl
      if (restFuer(erg.wand) !== 0) restStimmt = false
      for (const e of erg.ereignisse) {
        maxEreignis = Math.max(maxEreignis, e.punkte)
        if (e.punkte > BOHRUNG_MAX) deckeGehalten = false
        punkte += e.punkte
        bohrungen += 1
      }
      bohrungenJeWand[nr] += erg.ereignisse.length
      /* Laufende Serverpruefung: Punkte nie ueber Runden × maxJeRunde. */
      laufMaxSchnitt = Math.max(laufMaxSchnitt, punkte / Math.max(1, bohrungen))
      if (punkte > bohrungen * SERVER.maxJeRunde) deckeGehalten = false
    }
    laufPunkte += punkte
    laufBohrungen += bohrungen
  }

  pruefe(`Bot: ${WAENDE} Waende × ${SEEDS.length} Seeds geloest`, alleFrei && keineTreffer, `${waendeGesamt} Waende, ${Date.now() - t0} ms`)
  pruefe('Bot: kein Treffer, solange nur sicher gefolgert wird', keineTreffer)
  pruefe('Bot: Schwierigkeit steigt von Wand zu Wand', schwierigkeitSteigt)
  pruefe('Bot: Arten in jeder Wand wie geplant verteilt, Abwasser kommt vor', artenStimmen && abwasserGesehen)
  pruefe('Bot: Rest sicherer Fliesen am Ende 0', restStimmt)
  pruefe(
    'Bot: Waende ueberwiegend ohne Raten loesbar',
    ohneRatenAnzahl >= waendeGesamt * 0.8,
    `${ohneRatenAnzahl}/${waendeGesamt} ohne Raten, ${geratenSumme} Rateschritte gesamt`,
  )
  pruefe(`Punktdecke: keine Bohrung ueber ${BOHRUNG_MAX}`, deckeGehalten, `groesste Bohrung ${maxEreignis}`)
  pruefe(
    `Punktdecke: Schnitt je Bohrung unter Server-maxJeRunde ${SERVER.maxJeRunde}`,
    laufMaxSchnitt <= SERVER.maxJeRunde,
    `hoechster laufender Schnitt ${laufMaxSchnitt.toFixed(0)}, gesamt ${(laufPunkte / laufBohrungen).toFixed(0)} je Bohrung`,
  )
  const schnitt = bohrungenJeWand.slice(1).map((n) => (n / SEEDS.length).toFixed(1))
  console.log(`     Bohrungen je Wand (Schnitt): ${schnitt.join(' ')}`)
}

/* ------------------------------------------------------------------ */
/* Serie                                                               */
/* ------------------------------------------------------------------ */

{
  pruefe('Serie: Beginn bei 1', serieWeiter(0, null) === 1 && serieWeiter(0, 100) === 1)
  pruefe('Serie: schnelle Bohrung zaehlt weiter', serieWeiter(4, SERIE_MS) === 5)
  pruefe('Serie: zu langsam reisst ab', serieWeiter(9, SERIE_MS + 1) === 1)
  pruefe('Serie: Stufen 0 bei 1–2, dann steigend', serieStufe(1) === 0 && serieStufe(2) === 0 && serieStufe(3) === 1 && serieStufe(5) === 2)
  pruefe('Serie: Stufe gedeckelt', serieStufe(1000) === SERIE_STUFEN && serieFaktor(1000) === 1 + 0.1 * SERIE_STUFEN)
  pruefe('Serie: Punkte mit Serie hoeher', punkteFuer(4, 10, false, 11) > punkteFuer(4, 10, false, 1))
  pruefe('Serie: Wandbonus nicht von der Serie vervielfacht', punkteFuer(4, 0, true, 11) === punkteFuer(4, 0, true, 1))
  let s = 0
  let maxStufe = 0
  for (let k = 0; k < 20; k += 1) {
    s = serieWeiter(s, 300)
    maxStufe = Math.max(maxStufe, serieStufe(s))
  }
  pruefe('Serie: 20 schnelle Bohrungen erreichen die hoechste Stufe', maxStufe === SERIE_STUFEN, `Serie ${s}`)
}

/* ------------------------------------------------------------------ */
/* Einzelne Zuege                                                      */
/* ------------------------------------------------------------------ */

{
  const z = zufallAus(7)
  let wand = neueWand(3)
  const erst = bohren(wand, index(3, 4), z, 1)
  pruefe('Bohren: erster Tipp oeffnet sicher', erst.ereignis.art === 'offen' && erst.ereignis.neu > 0)
  wand = erst.wand
  const leitungI = wand.leitung.findIndex((x) => x === 1)
  const treffer = bohren(wand, leitungI, z, 2)
  pruefe('Bohren: Treffer nennt die Leitungsart', treffer.ereignis.art === 'leitung' && ARTEN.includes(treffer.ereignis.leitung))
  pruefe('Bohren: offene Fliese tut nichts', bohren(wand, index(3, 4), z).ereignis.art === 'nichts')
  const verdeckt = wand.zustand.findIndex((x) => x !== OFFEN)
  const m = markieren(wand, verdeckt)
  pruefe('Markieren: setzt und blockiert das Bohren', m?.gesetzt === true && bohren(m.wand, verdeckt, z).ereignis.art === 'nichts')
  pruefe('Punkte: extremer Einzelwert haelt die Decke', punkteFuer(99, FELDER, true, 999) === BOHRUNG_MAX)
}

/* ------------------------------------------------------------------ */
/* Tempo gegen den Server                                              */
/* ------------------------------------------------------------------ */

{
  /* Ehrlicher schneller Spieler: tippt ohne Pause, jede Bohrung geht so
     frueh wie bohrFreigabe erlaubt. Die Dauer ab Ticket darf nie unter
     runden × msJeRunde liegen. */
  const ticketSeit = 1_000_000
  let jetzt = ticketSeit - 400
  let runden = 0
  let verdaechtig = false
  for (let k = 0; k < 2000; k += 1) {
    const w = bohrFreigabe({ jetzt, ticketSeit, runden })
    if (w > 0) jetzt += w
    runden += 1
    if (jetzt - ticketSeit < runden * SERVER.msJeRunde) verdaechtig = true
    jetzt += 5
  }
  pruefe('Takt: schnellster ehrlicher Spieler nie unter msJeRunde', !verdaechtig && TAKT_MS >= SERVER.msJeRunde)
  pruefe('Takt: ohne Ticket nur die erste Bohrung', bohrFreigabe({ jetzt: 0, ticketSeit: 0, runden: 0 }) === 0 && bohrFreigabe({ jetzt: 0, ticketSeit: 0, runden: 1 }) === -1)
}

{
  /* Hochrechnung fuer die Servergrenzen: ein sehr guter Mensch (1,1 s je
     Bohrung, 0,75 s Wandwechsel) und ein Takt-Bot (110 ms je Bohrung), beide
     mit voller Serie, 9 Minuten lang ueber den Bot-Schnitt je Wand. */
  const hochrechnen = (msJeBohrung) => {
    const zufall = zufallAus(99)
    let zeit = 0
    let punkte = 0
    let bohrungen = 0
    let nr = 1
    let serie = 0
    while (zeit < 540000 && nr < 400) {
      const erg = wandLoesen(Math.min(nr, 12), zufall, serie, true)
      serie = erg.serie
      for (const e of erg.ereignisse) {
        if (zeit >= 540000) break
        zeit += msJeBohrung
        bohrungen += 1
        punkte += e.punkte
      }
      zeit += 750
      nr += 1
    }
    return { punkte: Math.round(punkte), bohrungen, waende: nr - 1 }
  }
  const mensch = hochrechnen(1100)
  const flink = hochrechnen(550)
  const bot = hochrechnen(TAKT_MS)
  console.log(`     Hochrechnung 9 min, sehr guter Mensch: ${mensch.punkte} Punkte, ${mensch.waende} Waende, ${mensch.bohrungen} Bohrungen`)
  console.log(`     Hochrechnung 9 min, extrem flink 0,55 s: ${flink.punkte} Punkte, ${flink.waende} Waende, ${flink.bohrungen} Bohrungen`)
  console.log(`     Hochrechnung 9 min, Takt-Bot:          ${bot.punkte} Punkte, ${bot.waende} Waende, ${bot.bohrungen} Bohrungen`)
  pruefe('Hochrechnung: sehr guter Mensch unter plausibel', mensch.punkte <= SERVER.plausibel, `${mensch.punkte} / ${SERVER.plausibel}`)
}

/* ------------------------------------------------------------------ */
/* Finger und Abschluss (Auftrag §12)                                  */
/*                                                                      */
/* Die Regeln hier lassen sich ohne Browser pruefen: die Spruchliste    */
/* direkt, das Bild ueber den Quelltext. Das ersetzt KEINEN Blick auf   */
/* ein Geraet — es haelt nur fest, dass eine spaetere Aenderung die     */
/* Zusage nicht still wieder ausbaut.                                   */
/* ------------------------------------------------------------------ */

{
  pruefe('Genug Sprueche fuer eine Runde ohne Wiederholung', GESCHAFFT_SPRUECHE.length >= 4, `${GESCHAFFT_SPRUECHE.length} Saetze`)
  pruefe('Sprueche sind kurz genug fuer eine Zeile', GESCHAFFT_SPRUECHE.every((s) => s.length <= 32))
  pruefe('Sprueche sind in Versalien', GESCHAFFT_SPRUECHE.every((s) => s === s.toUpperCase()))
  pruefe('Keine Doppelung in der Liste', new Set(GESCHAFFT_SPRUECHE).size === GESCHAFFT_SPRUECHE.length)

  let reihum = true
  let nieZweimal = true
  for (let n = 0; n < 40; n += 1) {
    if (geschafftSpruch(n) !== GESCHAFFT_SPRUECHE[n % GESCHAFFT_SPRUECHE.length]) reihum = false
    if (n > 0 && geschafftSpruch(n) === geschafftSpruch(n - 1)) nieZweimal = false
  }
  pruefe('Sprueche laufen reihum', reihum)
  pruefe('Nie zweimal derselbe Satz hintereinander', nieZweimal)
  pruefe('Unsinnige Zaehler stuerzen nicht ab', typeof geschafftSpruch(-3) === 'string' && typeof geschafftSpruch(2.7) === 'string')
}

{
  const jsx = readFileSync(resolve(WURZEL, 'src/components/spiele/Leitungsfinder.jsx'), 'utf8')
  const css = readFileSync(resolve(WURZEL, 'src/components/spiele/leitung.css'), 'utf8')

  /* Touch-Feedback: der Druck ist eigener Zustand, wird beim Aufsetzen
     gesetzt und auf jedem Weg wieder geloescht — sonst klebt eine Fliese. */
  pruefe('Druckzustand vorhanden', /const \[druck, setDruck\] = useState\(-1\)/.test(jsx))
  pruefe('Druck wird beim Aufsetzen gesetzt', /setDruck\(i\)/.test(jsx))
  pruefe('Druck wird beim Loslassen geloescht', /const fingerLoesen = \(f\) => \{[\s\S]*?setDruck\(-1\)/.test(jsx))
  pruefe('Druck wird auch beim Verwerfen geloescht', (jsx.match(/setDruck\(-1\)/g) || []).length >= 3)
  pruefe('Fliese traegt data-druck', /data-druck=\{druck === i \? '1' : undefined\}/.test(jsx))
  pruefe('Jede Fliese antwortet, nicht nur die verdeckte', !/zustand\[i\] !== OFFEN && spielbar\(\)\) \{[\s\S]{0,80}setDruck/.test(jsx))

  pruefe('CSS kennt den Druckzustand', /\.trm-leitung-zelle\[data-druck='1'\]/.test(css))
  const druckRegel = css.slice(css.indexOf(".trm-leitung-zelle[data-druck='1']"))
  pruefe('Der Druck kommt ohne Verzoegerung an', /transition: none/.test(druckRegel.slice(0, 200)))
  pruefe('Die Fliese sinkt sichtbar ein', /scale: 0\.9/.test(druckRegel.slice(0, 200)))
  pruefe('Das Zurueckfedern ist weich', /\.trm-leitung-zelle \{\s*transition: scale/.test(css))

  /* Abschluss: mehr Funken, zweite Welle, Goldstreif, trockener Satz. */
  pruefe('Funkenwurf traegt weiter als vorher', /anzahl: 20, art: 'gold', weite: 96/.test(jsx))
  pruefe('Zweite, hellere Welle', /anzahl: 8, art: 'creme', weite: 128/.test(jsx))
  pruefe('Kein Beben im ruhigen Spiel', !/domRuetteln/.test(jsx))
  pruefe('Der zweite Ton umgeht die Klangbremse', /spaeter\(\(\) => klang\('kraft', 1\.5\), 90\)/.test(jsx))
  pruefe('Spruch haengt am Schild', /geschafftSpruch\(waendeRef\.current\)/.test(jsx) && /trm-leitung-geschafft-spruch/.test(jsx))
  pruefe('Spruchzeiger startet jeden Lauf neu', /waendeRef\.current = 0/.test(jsx))
  pruefe('Goldstreif haengt an data-geschafft', /\[data-geschafft='1'\] \.trm-leitung-wand::after/.test(css))
  pruefe('Streif braucht einen Bezugspunkt', /\.trm-leitung-wand \{\s*position: relative/.test(css))
  pruefe('Streif laeuft einmal durch', /@keyframes trm-leitung-streif/.test(css) && !/trm-leitung-streif[^;]*infinite/.test(css))

  /* Weniger Bewegung: der Streif verschwindet ganz (er waere sonst ein
     schiefer Balken), die Rueckmeldung am Finger bleibt. */
  const sanft = css.slice(css.indexOf("[data-sanft='1'] .trm-leitung-wand::after"))
  pruefe('Streif faellt bei wenig Bewegung weg', /display: none/.test(sanft.slice(0, 120)))
  pruefe('Auch reduced-motion kennt den Streif', /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.trm-leitung-wand::after \{\s*display: none/.test(css))
  pruefe('Druck bleibt bei wenig Bewegung sichtbar', /\[data-sanft='1'\] \.trm-leitung-zelle\[data-druck='1'\] \{\s*scale: 1/.test(css))
}

console.log(`\nLeitungsfinder-Logik: ${gut} OK, ${schlecht} Fehler`)
if (schlecht) process.exit(1)
