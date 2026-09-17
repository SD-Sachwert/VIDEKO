/**
 * VIDEKO JUMP — Logiktest ohne Browser.
 *
 *   node scripts/spiele/jump-logik-test.mjs
 *
 * Prueft Erreichbarkeit des Plattengenerators, messbare Abwechslung,
 * Eingabelogik (Finger, Tasten, Neigung), Sonderplatten, die sechs Welten,
 * die Sammelobjekte und die Wertung gegen die Servergrenzen.
 */
import {
  ABSCHNITTE,
  ARTEN,
  BEUTE_MAX,
  BREITE_MIN,
  BROECKEL_HAELT,
  COMBO_AB,
  DY_GRENZE,
  ENTE_ANTEIL,
  FIGUR_B,
  FIGUR_H,
  GEGNER_AB_HOEHE,
  GEGNER_ARTEN,
  GEGNER_H,
  GEGNER_MUSTER,
  HERD_BONUS,
  MAX_JE_LANDUNG,
  NEIGUNG_AUS,
  NEIGUNG_EIN,
  NEIGUNG_MAX,
  NEIGUNG_TOT,
  NEIGUNG_VOLL,
  PLATTE_MAGNET_DAUER,
  SCHWERE,
  SPRUNG_HOEHE,
  STUECK_AB_HOEHE,
  STUECK_ARTEN,
  STUECK_WERT,
  TELEPORT_MIN,
  VX_MAX,
  WELLEN,
  WELTEN,
  WELT_GEGNER,
  ZEIGER_VOLL,
  breiteJetzt,
  eingabeAus,
  erreichbar,
  hoeheVon,
  kettenGlied,
  neigungAchse,
  neigungGrad,
  neigungRichtung,
  neuesSpiel,
  plattenErzeugen,
  regeln,
  ringAbstand,
  schritt,
  seiteVon,
  tiefpass,
  umbrechen,
  weltIndexVon,
  weltVon,
  yOben,
  yUnten,
  zeigerAchse,
  zerbrechlich,
  zufallMit,
} from '../../src/components/spiele/jump-logik.js'
import { SPIELE } from '../../api/_terminal-kern.js'

/* Die Servergrenze wird nicht abgeschrieben, sondern gelesen: so kann der
   Test nicht stillschweigend an der echten Pruefung vorbeilaufen. */
const SERVER_MAX = SPIELE.videko_jump.maxJeRunde

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

/**
 * Ein einfacher Bot folgt der Kette: kommt er mit echter Physik hoch?
 *
 * Seit ein fliegendes Teil toetet, braucht auch der Bot ein Minimum an
 * Selbsterhaltung — sonst misst der Test nicht mehr, ob der Generator einen
 * Weg nach oben laesst, sondern nur, wie lange ein blinder Bot ueberlebt.
 * Dazu kommt die rote Boostplatte: sie wirft die Figur ueber mehrere
 * Kettenglieder hinweg, und wer dann weiter auf das naechste Glied zielt,
 * faellt an allem vorbei. Der Bot kann darum dreierlei:
 *
 *   1. zielen — das naechste Kettenglied ueber der letzten Landung,
 *   2. nach einem Boost umzielen — im Fall das hoechste Glied, das seitlich
 *      noch zu schaffen ist,
 *   3. ausweichen — `gefahr` schaut einen halben Flug voraus; wird es eng
 *      (unter DRINGEND Sekunden), laeuft er kurz stur zur Seite weg, sonst
 *      laeuft er wenigstens nicht selbst in das Teil hinein.
 *
 * Die drei Zahlen sind gemessen, nicht geraten: mit ihnen kommt derselbe
 * schlichte Bot ueber 16 Seeds auf einen Median von rund 320 — die Fassung
 * ohne toedliche Gegner lag bei rund 400. Der Weg nach oben ist also noch
 * da, er kostet jetzt Aufmerksamkeit.
 */
console.log('\nBot mit echter Physik')
const VORAUS = 0.5
const VORAUS_TAKT = 0.04
const AUSWEICH_LUFT = 0.06
const DRINGEND = 0.2
const AUSWEICH_HALT = 0.1
/** Wo ein Gegner in `t` Sekunden steht — je Bewegungsmuster. */
function gegnerXbei(g, t) {
  if (g.muster === 'pendelt') return umbrechen(g.mitte + Math.sin(g.phase + Math.abs(g.v) * t * 2) * g.weite)
  if (g.muster === 'klappt') return g.x
  return umbrechen(g.x + g.v * t)
}
/** Naechster Treffer auf der aktuellen Flugbahn: wann, und wohin weicht man aus? */
function gefahr(stand) {
  const s = stand.spieler
  let frueheste = Infinity
  let weg = 0
  for (const g of stand.gegner) {
    if (g.weg) continue
    /* Eine Klappe kann bis zum Treffpunkt aufgehen: volle Breite annehmen. */
    const halb = (g.muster === 'klappt' ? g.b : breiteJetzt(g)) / 2 + FIGUR_B / 2 + AUSWEICH_LUFT
    for (let t = 0; t <= VORAUS + 1e-9; t += VORAUS_TAKT) {
      const fy = s.y + s.vy * t - (SCHWERE / 2) * t * t
      if (fy + FIGUR_H < g.y - GEGNER_H / 2 || fy > g.y + GEGNER_H / 2) continue
      const d = ringAbstand(umbrechen(s.x + s.vx * t), gegnerXbei(g, t))
      if (Math.abs(d) > halb) continue
      if (t < frueheste) {
        frueheste = t
        weg = d >= 0 ? -1 : 1
      }
      break
    }
  }
  return { zeit: frueheste, weg }
}
/* Was in den Laeufen ueberhaupt vorbeikam — fuer die Gegnerprobe weiter unten. */
const gesehen = { arten: new Map(), muster: new Set(), tiefster: Infinity }
function botLauf(seed, schritteMax = 120 * 240) {
  const stand = neuesSpiel(seed)
  const gezaehlt = new Set()
  let letzte = stand.platten[0]
  let punkteMax = 0
  let halten = 0
  let haltenBis = -1
  let ende = 'Zeitlimit'
  for (let n = 0; n < schritteMax && !stand.vorbei; n += 1) {
    const s = stand.spieler
    const kandidaten = stand.platten
      .filter((p) => p.kette && !p.weg && yUnten(p) > letzte.y + 0.005)
      .sort((a, b) => a.y - b.y)
    let ziel = kandidaten[0]
    if (ziel && s.vy < 0 && s.y > ziel.y + SPRUNG_HOEHE) {
      for (let i = kandidaten.length - 1; i >= 0; i -= 1) {
        const p = kandidaten[i]
        const dy = s.y - p.y
        if (dy <= 0) continue
        const fallzeit = (s.vy + Math.sqrt(Math.max(0, s.vy * s.vy + 2 * SCHWERE * dy))) / SCHWERE
        if (Math.abs(ringAbstand(s.x, p.x)) <= VX_MAX * fallzeit + p.b / 2) {
          ziel = p
          break
        }
      }
    }
    let richtung = 0
    if (ziel && (s.vy < 0 || s.y < ziel.y + SPRUNG_HOEHE)) {
      const d = ringAbstand(s.x, ziel.x)
      const bremsweg = (s.vx * s.vx) / (2 * 8)
      if (Math.abs(d) > ziel.b * 0.2) richtung = Math.sign(d)
      if (Math.sign(s.vx) === Math.sign(d) && Math.abs(d) < bremsweg + 0.01) richtung = 0
    }
    for (const gg of stand.gegner) {
      if (gezaehlt.has(gg)) continue
      gezaehlt.add(gg)
      gesehen.arten.set(gg.art, (gesehen.arten.get(gg.art) || 0) + 1)
      gesehen.muster.add(gg.muster)
      gesehen.tiefster = Math.min(gesehen.tiefster, hoeheVon(gg.y))
    }
    const g = gefahr(stand)
    if (g.weg && g.zeit <= DRINGEND) {
      halten = g.weg
      haltenBis = stand.zeit + AUSWEICH_HALT
    } else if (g.weg && richtung === -g.weg) {
      /* Noch Zeit: nicht fliehen, aber auch nicht selbst hineinlaufen. */
      richtung = 0
    }
    if (stand.zeit < haltenBis) richtung = halten
    for (const e of schritt(stand, richtung)) {
      if (e.art === 'landung') {
        /* Auch Zusatzplatten zaehlen: das naechste Ziel liegt immer darueber. */
        if (!e.platte.weg && e.platte.y > letzte.y - 1e-9) letzte = e.platte
        punkteMax = Math.max(punkteMax, e.punkte)
      }
      if (e.art === 'treffer') ende = 'Gegner'
      else if (e.art === 'absturz' && ende !== 'Gegner') ende = 'Absturz'
    }
  }
  return { hoehe: stand.hoehe, runden: stand.runden, punkte: stand.punkte, punkteMax, zeit: stand.zeit, ende }
}
/* Mehr Seeds als bei der Geometrie: Gegner und Boost streuen das Ergebnis, und
   eine Quote ueber sechs Laeufe waere mehr Muenzwurf als Messung. */
const BOT_SEEDS = [...SEEDS, 3, 19, 77, 512, 8191, 60013, 123457, 777777, 20260916, 1048583]
const botErgebnisse = BOT_SEEDS.map((s) => botLauf(s))
const hoehen = botErgebnisse.map((r) => r.hoehe).sort((a, b) => a - b)
const median = hoehen[Math.floor(hoehen.length / 2)]
const hoch = botErgebnisse.filter((r) => r.hoehe >= 250).length
pruefe(
  `Bot erreicht in mindestens 8 von ${BOT_SEEDS.length} Laeufen HOEHE 250`,
  hoch >= 8,
  botErgebnisse.map((r) => r.hoehe).join(', '),
)
pruefe(`Median der Botlaeufe >= 250 — ${median}`, median >= 250)
/* Gegner sollen gefaehrlich sein, aber nicht die Hauptursache: wer aufpasst,
   stirbt ueberwiegend an der eigenen Landung, nicht an einem Ueberfall. */
const gegnertode = botErgebnisse.filter((r) => r.ende === 'Gegner').length
pruefe(
  `Hoechstens ${Math.floor(BOT_SEEDS.length / 4)} von ${BOT_SEEDS.length} Laeufen enden am Gegner`,
  gegnertode <= Math.floor(BOT_SEEDS.length / 4),
  `${gegnertode}`,
)
for (const [i, r] of botErgebnisse.entries()) {
  console.log(`        Seed ${BOT_SEEDS[i]}: HOEHE ${r.hoehe}, ${r.runden} Runden, ${r.punkte} Punkte, ${r.zeit.toFixed(0)} s, Ende: ${r.ende}`)
  pruefe(`Seed ${BOT_SEEDS[i]}: Punkte je Runde <= ${SERVER_MAX} (Server maxJeRunde)`, r.runden === 0 || r.punkte / r.runden <= SERVER_MAX, `${(r.punkte / Math.max(1, r.runden)).toFixed(0)}`)
  pruefe(`Seed ${BOT_SEEDS[i]}: keine Landung ueber MAX_JE_LANDUNG`, r.punkteMax <= MAX_JE_LANDUNG, `${r.punkteMax}`)
}
pruefe(`MAX_JE_LANDUNG ${MAX_JE_LANDUNG} <= ${SERVER_MAX} (Server maxJeRunde)`, MAX_JE_LANDUNG <= SERVER_MAX)

/* ------------------------------------------------------------------ */
/* Die Gegner kommen aus allen Gewerken — Kueche, Bad, Boden, Wand, Licht,
   Elektro, PV, Immobilie. Geprueft wird an dem, was in den Botlaeufen oben
   tatsaechlich vorbeigeflogen ist, nicht an der Konstantenliste. */
console.log('\nGegner')
pruefe(
  `mindestens 10 der ${GEGNER_ARTEN.length} Gegnerarten kamen vor`,
  gesehen.arten.size >= 10,
  [...gesehen.arten.keys()].join(','),
)
pruefe('nur bekannte Gegnerarten', [...gesehen.arten.keys()].every((a) => GEGNER_ARTEN.includes(a)))
pruefe(
  'alle vier Bewegungsmuster kamen vor',
  ['zieht', 'schwer', 'pendelt', 'klappt'].every((m) => gesehen.muster.has(m)),
  [...gesehen.muster].join(','),
)
pruefe('jede Art hat ein Muster hinterlegt', GEGNER_ARTEN.every((a) => GEGNER_MUSTER[a]))
/* Die ersten Meter gehoeren dem Spieler: vorher fliegt nichts. */
pruefe(
  `kein Gegner unter HOEHE ${GEGNER_AB_HOEHE} — tiefster ${gesehen.tiefster}`,
  gesehen.tiefster >= GEGNER_AB_HOEHE,
)

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
pruefe('Finger halb ausgelenkt lenkt halb', eingabeAus({ finger: [-0.5] }).richtung === -0.5)
pruefe('Finger jenseits von 1 wird geklemmt', eingabeAus({ finger: [3.2] }).richtung === 1)
pruefe('Neigung kommt analog durch', eingabeAus({ neigung: -0.4, neigungAktiv: true }).richtung === -0.4)

/* Daumensteuerung: das Feld ist ein Regler, keine zwei Knoepfe. */
pruefe('Zeiger in der Mitte: Ruhe', zeigerAchse(150, 50, 200) === 0)
pruefe('Zeiger knapp neben der Mitte: noch Totzone', zeigerAchse(150 + 200 * 0.03, 50, 200) === 0)
pruefe('Zeiger am linken Rand: voller Ausschlag links', zeigerAchse(50, 50, 200) === -1)
pruefe('Zeiger am rechten Rand: voller Ausschlag rechts', zeigerAchse(250, 50, 200) === 1)
pruefe(`Zeiger ab ${ZEIGER_VOLL} Feldbreite bereits voll`, zeigerAchse(150 + 200 * ZEIGER_VOLL, 50, 200) === 1)
{
  const a = zeigerAchse(150 + 200 * 0.12, 50, 200)
  const b = zeigerAchse(150 + 200 * 0.2, 50, 200)
  pruefe(`Zeiger steigt dazwischen linear (${a.toFixed(2)} < ${b.toFixed(2)} < 1)`, a > 0 && a < b && b < 1)
}
pruefe('Zeiger ohne Feldbreite: 0', zeigerAchse(150, 50, 0) === 0)
pruefe('Zeiger mit NaN: 0', zeigerAchse(Number.NaN, 50, 200) === 0)

/* Neigung als Achse, mit Neutralpunkt statt Schalter. */
pruefe('Neigungsachse: stilles Handy driftet nicht', neigungAchse(0) === 0)
pruefe('Neigungsachse: Totzone', neigungAchse(NEIGUNG_TOT - 0.1) === 0)
pruefe(`Neigungsachse: voll bei ${NEIGUNG_VOLL} Grad, gedeckelt auf ${NEIGUNG_MAX}`, neigungAchse(NEIGUNG_VOLL) === NEIGUNG_MAX && neigungAchse(90) === NEIGUNG_MAX)
pruefe('Neigungsachse: links ist negativ', neigungAchse(-NEIGUNG_VOLL) === -NEIGUNG_MAX)
pruefe('Neigungsachse: Neutralpunkt verschiebt die Totzone', neigungAchse(20, 20) === 0 && neigungAchse(0, 20) !== 0)
pruefe('Neigungsachse: NaN lenkt nicht', neigungAchse(Number.NaN) === 0)
pruefe('Tiefpass zieht nur anteilig nach', tiefpass(0, 1, 0.25) === 0.25)
pruefe('Tiefpass laeuft gegen den Zielwert', Math.abs(Array.from({ length: 40 }).reduce((v) => tiefpass(v, 1, 0.25), 0) - 1) < 0.001)
pruefe('Tiefpass haelt bei NaN den alten Wert', tiefpass(0.4, Number.NaN) === 0.4)
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
  /* Die rote Platte war frueher ein Loch mit Warnschild. Jetzt traegt sie —
     und zwar hoeher als Gold, sonst waere der Unterschied nicht zu sehen. */
  const stand = testStand({ art: 'herd', x: 0.5, y: 1, b: 0.3 })
  const l = landungen(stand, 3)
  const hochGenug = Math.max(...l.map((e) => e.platte.y)) === 1
  pruefe('Boostplatte traegt statt durchfallen zu lassen', l.length >= 2 && hochGenug, `${l.length} Landungen`)
  pruefe('Boostplatte meldet boost', l.every((e) => e.boost === true))
  pruefe(`Boostplatte zahlt HERD_BONUS ${HERD_BONUS} einmal`, l[0].punkte >= HERD_BONUS && l[1].punkte === 0, `${l.map((e) => e.punkte).join(', ')}`)
}
{
  /* Der Boost muss hoeher tragen als Gold — sonst ist die rote Platte nur
     eine andere Farbe. Gemessen am Scheitelpunkt ueber der Platte. */
  const gipfel = (art) => {
    const stand = testStand({ art, x: 0.5, y: 1, b: 0.3 })
    let max = 0
    for (let i = 0; i < 300; i += 1) {
      schritt(stand, 0)
      max = Math.max(max, stand.spieler.y)
    }
    return max - 1
  }
  const normal = gipfel('normal')
  const gold = gipfel('gold')
  const boost = gipfel('herd')
  pruefe(
    `Boost ${boost.toFixed(2)} > Gold ${gold.toFixed(2)} > normal ${normal.toFixed(2)}`,
    boost > gold + 0.05 && gold > normal + 0.05,
  )
}
{
  /* Ein Gegner muss toeten. Vorher war er ein Stoss nach unten, und ein
     Hindernis ohne Preis ist keins. */
  const stand = testStand({ art: 'normal', x: 0.5, y: 1, b: 0.3 })
  stand.gegner = [{ id: 99, art: 'pfanne', muster: 'zieht', x: 0.5, y: 1.05, b: 0.12, v: 0, dreh: 0, weg: false, mitte: 0, weite: 0, phase: 0, zyklus: 0, offen: 0, auf: 0 }]
  let toedlich = 0
  for (let i = 0; i < 60; i += 1) for (const e of schritt(stand, 0)) if (e.art === 'treffer' && e.toedlich) toedlich += 1
  pruefe('Treffer ohne Schutz beendet den Lauf', toedlich === 1 && stand.vorbei === true)
}
{
  /* Mit Schuerze ueberlebt man genau einen Treffer. */
  const stand = testStand({ art: 'normal', x: 0.5, y: 1, b: 0.3 })
  stand.schutz = true
  stand.gegner = [{ id: 99, art: 'pfanne', muster: 'zieht', x: 0.5, y: 1.05, b: 0.12, v: 0, dreh: 0, weg: false, mitte: 0, weite: 0, phase: 0, zyklus: 0, offen: 0, auf: 0 }]
  let gerettet = 0
  for (let i = 0; i < 60; i += 1) for (const e of schritt(stand, 0)) if (e.art === 'schutz') gerettet += 1
  pruefe('Schutzschuerze faengt genau einen Treffer ab', gerettet === 1 && !stand.vorbei && stand.schutz === false)
}
{
  /* Eine geschlossene Klappe ist ein schmaler Streifen, eine offene nicht. */
  const tuer = { art: 'backofen', muster: 'klappt', b: 0.16, auf: 0 }
  const zu = breiteJetzt(tuer)
  tuer.auf = 1
  const offen = breiteJetzt(tuer)
  pruefe(`Klappe waechst beim Aufschlagen (${zu.toFixed(3)} auf ${offen.toFixed(3)})`, offen > zu * 2 && offen === tuer.b)
  pruefe('andere Muster behalten ihre Breite', breiteJetzt({ art: 'pfanne', muster: 'zieht', b: 0.12 }) === 0.12)
}
pruefe('Schwerkraft und Sprung wie bisher', SCHWERE === 3.4 && SPRUNG_HOEHE === 0.42)

console.log('\nWelten')
{
  const steigend = WELTEN.every((w, i) => i === 0 || w.ab > WELTEN[i - 1].ab)
  pruefe(`${WELTEN.length} Welten mit streng steigenden Schwellen`, WELTEN.length === 6 && steigend)
  pruefe('die erste Welt faengt bei 0 an', WELTEN[0].ab === 0)
  /* Der SHOWROOM muss laenger halten, als der erste Gegner braucht — sonst
     hat man die erste Welt nie ohne fliegenden Kuehlschrank gesehen. */
  pruefe(
    `SHOWROOM traegt ueber GEGNER_AB_HOEHE hinaus (${WELTEN[1].ab} > ${GEGNER_AB_HOEHE})`,
    WELTEN[1].ab > GEGNER_AB_HOEHE,
  )
  let monoton = true
  let letzter = -1
  for (let h = 0; h <= 1200; h += 1) {
    const i = weltIndexVon(h)
    if (i < letzter) monoton = false
    letzter = i
  }
  pruefe(
    'weltIndexVon steigt nie zurueck und erreicht die letzte Welt',
    monoton && weltIndexVon(0) === 0 && weltIndexVon(1200) === WELTEN.length - 1,
  )
  pruefe(
    'weltVon passt zu weltIndexVon',
    weltVon(0).key === WELTEN[0].key && weltVon(1200).key === WELTEN[WELTEN.length - 1].key,
  )
  pruefe(
    'jede Welt hat Titel und eigenes Inventar',
    WELTEN.every((w) => !!w.titel && Array.isArray(WELT_GEGNER[w.key]) && WELT_GEGNER[w.key].length >= 3),
  )
  const ausWelten = new Set(Object.values(WELT_GEGNER).flat())
  pruefe(
    'jede Gegnerart kommt in mindestens einer Welt vor',
    GEGNER_ARTEN.every((a) => ausWelten.has(a)),
    GEGNER_ARTEN.filter((a) => !ausWelten.has(a)).join(','),
  )
  pruefe('keine Welt nennt eine unbekannte Gegnerart', [...ausWelten].every((a) => GEGNER_ARTEN.includes(a)))
}
{
  /* Angesagt wird nur aufwaerts: wer zurueckfaellt, hoert die Welt nicht
     ein zweites Mal. */
  const stand = neuesSpiel(1)
  stand.erzeugen = false
  stand.platten = []
  const gesehen = []
  for (const h of [0, 50, 140, 140, 300, 100, 300, 800]) {
    stand.hoehe = h
    for (const e of schritt(stand, 0)) if (e.art === 'welt') gesehen.push(e.welt)
  }
  pruefe(
    'Weltwechsel wird je Welt genau einmal angesagt, Rueckfall zaehlt nicht',
    gesehen.join(',') === 'baustelle,bad,immobilien',
    gesehen.join(',') || 'nichts',
  )
}

console.log('\nSammelobjekte')
{
  pruefe(
    'jede Sammelart hat einen Wert',
    STUECK_ARTEN.every((a) => Number.isFinite(STUECK_WERT[a]) && STUECK_WERT[a] > 0),
  )
  pruefe(
    `kein Einzelstueck sprengt den Deckel (${BEUTE_MAX})`,
    STUECK_ARTEN.every((a) => STUECK_WERT[a] <= BEUTE_MAX),
  )
  pruefe(
    'die Badeente ist die Ausnahme und ist es wert',
    ENTE_ANTEIL < 0.02 && STUECK_WERT.ente > STUECK_WERT.muenze * 3,
  )
}
{
  /* Einsammeln darf KEINE Runde erzeugen. Der Server rechnet
     dauerMs < runden * msJeRunde — eine geschenkte Runde je Muenze wuerde
     einen ehrlichen Lauf als Betrug lesen lassen. */
  const stand = testStand({ art: 'normal', x: 0.5, y: 1, b: 0.3 })
  stand.stuecke = [
    { id: 90, art: 'muenze', x: 0.5, y: 1.05, weg: false, wegBis: 0 },
    { id: 91, art: 'schluessel', x: 0.5, y: 1.06, weg: false, wegBis: 0 },
  ]
  const vorher = stand.runden
  let eingesammelt = 0
  for (let i = 0; i < 12; i += 1) for (const e of schritt(stand, 0)) if (e.art === 'stueck') eingesammelt += 1
  pruefe('Kleinkram wird im Vorbeifliegen eingesammelt', eingesammelt === 2 && stand.stuecke.every((s) => s.weg))
  pruefe('Einsammeln erzeugt keine Runde', stand.runden === vorher, `${vorher} auf ${stand.runden}`)
  pruefe(
    'der Wert liegt als Beute bereit',
    stand.beute === STUECK_WERT.muenze + STUECK_WERT.schluessel,
    `${stand.beute}`,
  )
}
{
  /* Ausgezahlt wird bei der Landung, gedeckelt — der Rest kommt spaeter. */
  const stand = testStand({ art: 'normal', x: 0.5, y: 1, b: 0.3 })
  stand.beute = BEUTE_MAX + 55
  const l = landungen(stand, 2)
  pruefe('Beute wird bei der Landung gedeckelt ausgezahlt', l[0]?.beute === BEUTE_MAX, `${l[0]?.beute}`)
  pruefe('der Rest geht nicht verloren', stand.beute === 55, `${stand.beute}`)
}

console.log('\nFeder, Magnetplatte und Teleport')
{
  const gipfel = (art) => {
    const stand = testStand({ art, x: 0.5, y: 1, b: 0.3 })
    let max = 0
    for (let i = 0; i < 300; i += 1) {
      schritt(stand, 0)
      max = Math.max(max, stand.spieler.y)
    }
    return max - 1
  }
  const feder = gipfel('feder')
  const normal = gipfel('normal')
  const herd = gipfel('herd')
  pruefe(
    `Feder traegt wie die Boostplatte (${feder.toFixed(2)} zu ${herd.toFixed(2)}, normal ${normal.toFixed(2)})`,
    Math.abs(feder - herd) < 0.01 && feder > normal + 0.05,
  )
  const punkteFuer = (art) => landungen(testStand({ art, x: 0.5, y: 1, b: 0.3 }), 2)[0]?.punkte ?? -1
  pruefe('Feder gibt Hoehe, aber keinen Plattenbonus', punkteFuer('feder') === punkteFuer('normal'))
  pruefe('die Boostplatte schon', punkteFuer('herd') === punkteFuer('normal') + HERD_BONUS)
}
{
  const stand = testStand({ art: 'magnetplatte', x: 0.5, y: 1, b: 0.3 })
  const l = landungen(stand, 0.5)
  pruefe(
    'Magnetplatte schaltet den Magneten ein',
    l[0]?.magnet === true && stand.magnetBis > stand.zeit + PLATTE_MAGNET_DAUER - 0.5,
  )
}
{
  const stand = testStand({ art: 'teleport', x: 0.5, y: 1, b: 0.3, zielX: 0.85 })
  const e = landungen(stand, 0.5)[0]
  pruefe(
    'Teleport versetzt quer durch den Ring',
    !!e?.teleport && Math.abs(ringAbstand(e.teleport.vonX, e.teleport.nachX)) >= TELEPORT_MIN,
    JSON.stringify(e?.teleport ?? null),
  )
  pruefe('danach ist man kurz unverwundbar', stand.unverwundbarBis > stand.zeit)
  pruefe(
    'und steht ohne Seitwaertsschwung da',
    Math.abs(ringAbstand(stand.spieler.x, 0.85)) < 1e-9 && stand.spieler.vx === 0,
    `${stand.spieler.x} / ${stand.spieler.vx}`,
  )
}
{
  /* Was der Generator ueber viele Seeds wirklich baut. */
  const sammel = new Map()
  const plattenArten = new Set()
  const teleports = []
  const wellenArten = new Set()
  for (const seed of [...SEEDS, 3, 19, 77, 512, 8191, 60013]) {
    const stand = neuesSpiel(seed)
    for (let i = 0; i < 900; i += 1) kettenGlied(stand)
    for (const s of stand.stuecke) sammel.set(s.art, (sammel.get(s.art) || 0) + 1)
    for (const p of stand.platten) {
      plattenArten.add(p.art)
      if (p.art === 'teleport') teleports.push(p)
    }
    for (const w of stand.wellen) wellenArten.add(w.art)
  }
  const gesamt = [...sammel.values()].reduce((a, b) => a + b, 0)
  pruefe('alle drei Sammelarten kommen vor', STUECK_ARTEN.every((a) => sammel.has(a)), [...sammel.keys()].join(','))
  pruefe(
    `Muenzen sind die Regel (${Math.round(((sammel.get('muenze') || 0) / gesamt) * 100)} % von ${gesamt})`,
    (sammel.get('muenze') || 0) / gesamt > 0.7,
  )
  pruefe(
    `Enten bleiben eine Ueberraschung (${sammel.get('ente') || 0} von ${gesamt})`,
    (sammel.get('ente') || 0) / gesamt < 0.03,
  )
  pruefe(
    'Feder, Magnetplatte und Teleport werden auch wirklich gebaut',
    ['feder', 'magnetplatte', 'teleport'].every((a) => plattenArten.has(a)),
    [...plattenArten].join(','),
  )
  pruefe('keine unbekannte Plattenart', [...plattenArten].every((a) => ARTEN.includes(a)))
  pruefe(
    `jede Teleportplatte versetzt mindestens ${TELEPORT_MIN} (${teleports.length} geprueft)`,
    teleports.length > 0 && teleports.every((p) => Math.abs(ringAbstand(p.x, p.zielX)) >= TELEPORT_MIN - 1e-9),
  )
  pruefe(`${WELLEN.length} Wellen, keine doppelt`, WELLEN.length === 8 && new Set(WELLEN).size === 8)
  pruefe(
    'jede Welle kommt vor',
    WELLEN.every((w) => wellenArten.has(w)),
    WELLEN.filter((w) => !wellenArten.has(w)).join(','),
  )
}

console.log('\nSchwierigkeitskurve')
{
  /* Die ersten rund zehn Sekunden (bis HOEHE 45) steht der Turm still.
     Man soll Erfolg haben, bevor man Regeln lernt. */
  pruefe(
    'bis HOEHE 45 bewegt sich keine Platte',
    regeln(0).bewegt === 0 && regeln(44).bewegt === 0 && regeln(45).bewegt > 0,
  )
  pruefe(
    'und bis dahin bricht nichts weg',
    regeln(44).glas === 0 && regeln(44).broeckel === 0 && regeln(50).broeckel > 0 && regeln(70).glas > 0,
  )
  pruefe('Gold ist die erste Abwechslung', regeln(0).gold === 0 && regeln(20).gold > 0)
  pruefe('Kleinkram liegt fast von Anfang an herum', regeln(0).stueck === 0 && regeln(STUECK_AB_HOEHE).stueck > 0)
  pruefe(
    'Gegner kommen erst deutlich spaeter',
    regeln(GEGNER_AB_HOEHE - 1).gegner === 0 && regeln(GEGNER_AB_HOEHE).gegner > 0,
  )
  pruefe(
    'die Sonderplatten staffeln sich nach oben',
    regeln(59).feder === 0 &&
      regeln(60).feder > 0 &&
      regeln(109).magnetplatte === 0 &&
      regeln(110).magnetplatte > 0 &&
      regeln(159).teleport === 0 &&
      regeln(160).teleport > 0,
  )
  /* Die Sonderarten duerfen die Kette nie ganz auffressen — sonst gibt es
     ganz oben keine normale Platte mehr. */
  let voll = 0
  for (let h = 0; h <= 1500; h += 10) {
    const r = regeln(h)
    voll = Math.max(voll, r.glas + r.broeckel + r.lift + r.bewegt + r.feder + r.magnetplatte + r.teleport)
  }
  pruefe(`Sonderarten fressen die Kette nie ganz auf (hoechstens ${Math.round(voll * 100)} %)`, voll < 0.9)
  /* Entscheidender als die Summe: worauf man nicht stehenbleiben kann.
     Glas und Broeckel duerfen auch ganz oben die Minderheit bleiben. */
  let muerbe = 0
  for (let h = 0; h <= 1500; h += 10) muerbe = Math.max(muerbe, regeln(h).glas + regeln(h).broeckel)
  pruefe(`muerbe Platten bleiben die Minderheit (hoechstens ${Math.round(muerbe * 100)} %)`, muerbe < 0.35)
  pruefe('Kombo-Leiter nach Vorgabe: 3 / 5 / 8 / 12', COMBO_AB.join(',') === '3,5,8,12')
}

console.log(`\n${gut} ok, ${schlecht} fehlgeschlagen`)
process.exit(schlecht ? 1 : 0)
