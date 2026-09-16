/**
 * KUECHEN-FIT — die reine Spiellogik.
 *
 * Kein React, kein DOM, keine Uhr: nur Feld, Teile, Tempo und Wertung. Die
 * Komponente fuehrt Zeit und Eingabe, hier wird entschieden, was passt, wie
 * schnell es faellt und was es bringt. So laesst sich alles in Node pruefen
 * (scripts/spiele/fit-logik-test.mjs) und mit einem Bot simulieren.
 *
 * DAS FELD
 * --------
 * 10 Spalten × 18 Reihen, Reihe 0 oben. Eine Zelle ist 0 (frei) oder der
 * Code des Teils, das dort eingerastet ist — der Code bestimmt spaeter Ton
 * und Griff der Schrankfront. Code 9 ist Altbestand (Nachschubreihe).
 *
 * PERFECT FIT
 * -----------
 * Ein Teil passt perfekt, wenn JEDE seiner Zellen in einer Reihe liegt, die
 * durch genau dieses Einrasten abgeraeumt wird. Es bleibt also nichts von
 * ihm liegen: es hat eine Luecke exakt geschlossen.
 *
 * SCHWIERIGKEIT
 * -------------
 * `schwierigkeit(sekunden, reihen)` ist die eine Quelle fuer das Tempo:
 *   stufe       = max(1 + floor(sekunden / 10), 1 + floor(reihen / 8)), hoechstens 20
 *   fallMs      = max(90, round(800 × 0,8^(stufe − 1)))
 *   lockMs      = max(250, 450 − 20 × (stufe − 1))
 *   komplex     = 0 in Stufe 1, dann min(0,30, 0,04 + 0,03 × (stufe − 1))
 *   problem     = 0 in Stufe 1–2, dann min(0,12, 0,015 × (stufe − 2))
 *   nachschub   = ab Stufe 4 alle max(7, round(16 − 1,5 × (stufe − 4))) Teile
 *                 eine Altbestand-Reihe von unten, ab Stufe 7 mit zwei Luecken
 * Die ersten 10 Sekunden sind also das alte, ruhige Spiel mit den acht
 * vertrauten Teilen; ab 10 s kommen Fuenfer-Teile, ab 20 s Problemteile,
 * ab 30 s drueckt Nachschub von unten.
 *
 * DAS SPIELGEFUEHL (zweiter Teil dieser Datei)
 * --------------------------------------------
 * Ab hier liegt alles, was aus einem gesetzten Teil ein Erlebnis macht, und
 * zwar ebenfalls ohne React und ohne DOM: die Bewertung jeder Platzierung
 * (PERFECT FIT / GOOD / KNAPP DANEBEN), Combo, Fieber, der spielinterne
 * Geduldsbalken und die Einbau-Zone. Der Zustand ist ein schlichtes Objekt,
 * die Funktionen geben immer einen neuen Zustand plus ein Ereignis zurueck —
 * genau wie `festsetzen`. Die Komponente entscheidet nur, WANN sie ruft, und
 * malt das Ergebnis; geprueft wird das alles in
 * scripts/spiele/fit-gefuehl-test.mjs.
 *
 * WICHTIG: Die Geduld ist der spielinterne Balken, NICHT die Rundenuhr aus
 * useSpielLauf. Kuechen-Fit bleibt ein Endlosspiel: die Runde endet durch
 * Scheitern (Kueche voll oder Geduld leer), nicht durch die globale Uhr.
 */

import { comboMult } from './spielgefuehl.js'

export const BREITE = 10
export const HOEHE = 18

/* Acht vertraute Kuechenteile, drei Fuenfer-Module und zwei Problemteile. */
export const TEILE = {
  O: { code: 1, name: 'UNTERSCHRANK', gruppe: 'basis', box: 2, zellen: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  K: { code: 2, name: 'HOCHSCHRANK', gruppe: 'basis', box: 3, zellen: [[1, 0], [1, 1], [1, 2]] },
  I: { code: 3, name: 'ARBEITSPLATTE', gruppe: 'basis', box: 4, zellen: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  L: { code: 4, name: 'ECKSCHRANK', gruppe: 'basis', box: 3, zellen: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  J: { code: 5, name: 'ECKSCHRANK', gruppe: 'basis', box: 3, zellen: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  T: { code: 6, name: 'KOCHINSEL', gruppe: 'basis', box: 3, zellen: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  S: { code: 7, name: 'INSELMODUL', gruppe: 'basis', box: 3, zellen: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  Z: { code: 8, name: 'INSELMODUL', gruppe: 'basis', box: 3, zellen: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  U: { code: 10, name: 'SPÜLENZEILE', gruppe: 'komplex', box: 3, zellen: [[0, 1], [2, 1], [0, 2], [1, 2], [2, 2]] },
  P: { code: 11, name: 'KÜHLKOMBI', gruppe: 'komplex', box: 3, zellen: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]] },
  V: { code: 12, name: 'WINKELZEILE', gruppe: 'komplex', box: 3, zellen: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
  X: { code: 13, name: 'SÄULENKREUZ', gruppe: 'problem', box: 3, zellen: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
  W: { code: 14, name: 'TREPPENREGAL', gruppe: 'problem', box: 3, zellen: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]] },
}

export const TYPEN = Object.keys(TEILE)
export const BASIS_TYPEN = TYPEN.filter((t) => TEILE[t].gruppe === 'basis')
export const KOMPLEX_TYPEN = TYPEN.filter((t) => TEILE[t].gruppe === 'komplex')
export const PROBLEM_TYPEN = TYPEN.filter((t) => TEILE[t].gruppe === 'problem')
export const TYP_NACH_CODE = Object.fromEntries(TYPEN.map((t) => [TEILE[t].code, t]))
export const MUELL_CODE = 9

/* Wertung — alle Stellschrauben an einer Stelle. Mehr Reihen auf einmal
   bringen je Reihe mehr: 100, 150, 200, 250 je Reihe. */
export const REIHEN_PUNKTE = [0, 100, 300, 600, 1000]
/* PERFECT FIT: 500 fuer eine Reihe, je weitere Reihe 250 mehr. */
export const PERFEKT_PUNKTE = 500
export const PERFEKT_JE_REIHE = 250
export const KETTE_PUNKTE = 75
export const KETTE_MAX = 10
export const HART_JE_ZELLE = 2
export const SANFT_JE_ZELLE = 1
export const REIHEN_JE_LEVEL = 8
/* Der Punktefaktor endet bei 5 und haengt nur an abgeraeumten Reihen. */
export const FAKTOR_MAX = 5

/* Tempo. */
export const STUFE_S = 10
export const STUFE_MAX = 20
export const FALL_START_MS = 800
export const FALL_MIN_MS = 90
export const FALL_KURVE = 0.8
export const LOCK_START_MS = 450
export const LOCK_MIN_MS = 250
/* Alter Name, bleibt fuer Stufe 1. */
export const LOCK_MS = LOCK_START_MS
export const LOCK_RESETS = 15
/* Mindestzeit vom Erscheinen bis zum Einrasten. Der Server verlangt
   150 ms je Teil; 200 ms laesst Luft fuer Uhrenrauschen. */
export const SPERRE_MS = 200

/* Alle vier Drehlagen vorab. Im Uhrzeigersinn in der eigenen Box:
   (x, y) -> (box-1-y, x). Das Unterschrank-Quadrat bleibt, wie es ist. */
function lagenFuer(typ) {
  const { box, zellen } = TEILE[typ]
  const lagen = [zellen]
  for (let i = 1; i < 4; i += 1) {
    const vorher = lagen[i - 1]
    lagen.push(typ === 'O' ? vorher : vorher.map(([x, y]) => [box - 1 - y, x]))
  }
  return lagen
}

export const FORMEN = Object.fromEntries(TYPEN.map((t) => [t, lagenFuer(t)]))

/* Einfache Wandtritte: erst seitlich, dann einen nach oben. Die lange
   Arbeitsplatte darf zwei Spalten ausweichen. */
const TRITTE = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]]
const TRITTE_LANG = [...TRITTE, [-2, 0], [2, 0]]

const klemmen = (v, a, b) => Math.min(b, Math.max(a, v))

export function leeresFeld() {
  return Array.from({ length: HOEHE }, () => new Array(BREITE).fill(0))
}

export function zellenVon(teil) {
  return FORMEN[teil.typ][teil.dreh].map(([x, y]) => [teil.x + x, teil.y + y])
}

export function passt(feld, teil) {
  for (const [x, y] of zellenVon(teil)) {
    if (x < 0 || x >= BREITE || y < 0 || y >= HOEHE) return false
    if (feld[y][x]) return false
  }
  return true
}

/** Neues Teil oben mittig. Ohne Platz gibt es null — das ist das Spielende. */
export function spawnen(feld, typ) {
  const { box } = TEILE[typ]
  const minY = Math.min(...FORMEN[typ][0].map(([, y]) => y))
  const teil = { typ, dreh: 0, x: Math.floor((BREITE - box) / 2), y: -minY }
  return passt(feld, teil) ? teil : null
}

export function verschieben(feld, teil, dx, dy) {
  const neu = { ...teil, x: teil.x + dx, y: teil.y + dy }
  return passt(feld, neu) ? neu : null
}

/** Drehen mit Wandtritt. richtung 1 = Uhrzeigersinn, -1 = dagegen. */
export function drehen(feld, teil, richtung = 1) {
  if (teil.typ === 'O') return null
  const dreh = (teil.dreh + (richtung > 0 ? 1 : 3)) % 4
  const tritte = teil.typ === 'I' ? TRITTE_LANG : TRITTE
  for (const [dx, dy] of tritte) {
    const neu = { ...teil, dreh, x: teil.x + dx, y: teil.y + dy }
    if (passt(feld, neu)) return neu
  }
  return null
}

/** Wie weit das Teil noch fallen kann. */
export function fallTiefe(feld, teil) {
  let n = 0
  while (passt(feld, { ...teil, y: teil.y + n + 1 })) n += 1
  return n
}

export function geist(feld, teil) {
  return { ...teil, y: teil.y + fallTiefe(feld, teil) }
}

/**
 * Teil ins Feld schreiben und volle Reihen raeumen.
 * `vorher` ist das Feld mit dem Teil, aber vor dem Raeumen — fuer das
 * goldene Aufblitzen der Reihen.
 */
export function einrasten(feld, teil) {
  const vorher = feld.map((r) => r.slice())
  const code = TEILE[teil.typ].code
  const zellen = zellenVon(teil)
  for (const [x, y] of zellen) vorher[y][x] = code
  const reihen = []
  for (let y = 0; y < HOEHE; y += 1) {
    if (vorher[y].every((c) => c)) reihen.push(y)
  }
  const perfekt = reihen.length > 0 && zellen.every(([, y]) => reihen.includes(y))
  let nachher = vorher
  if (reihen.length) {
    const bleiben = vorher.filter((_, y) => !reihen.includes(y))
    nachher = [...Array.from({ length: reihen.length }, () => new Array(BREITE).fill(0)), ...bleiben.map((r) => r.slice())]
  }
  return { feld: nachher, vorher, reihen, perfekt }
}

/**
 * Eine Altbestand-Reihe von unten einschieben. Alles rutscht eine Reihe
 * hoch; liegt oben schon etwas, laeuft die Kueche ueber.
 */
export function nachschub(feld, zufall = Math.random, loecher = 1) {
  const zeile = new Array(BREITE).fill(MUELL_CODE)
  const n = klemmen(Math.floor(loecher), 1, BREITE - 1)
  let frei = 0
  while (frei < n) {
    const x = Math.min(BREITE - 1, Math.floor(zufall() * BREITE))
    if (zeile[x]) {
      zeile[x] = 0
      frei += 1
    }
  }
  const ueberlauf = feld[0].some((c) => c)
  return { feld: [...feld.slice(1).map((r) => r.slice()), zeile], ueberlauf }
}

export function levelFuer(reihenGesamt) {
  return 1 + Math.floor(reihenGesamt / REIHEN_JE_LEVEL)
}

export function faktorFuer(level) {
  return Math.min(level, FAKTOR_MAX)
}

/** Schwerkraft je Stufe: von 800 ms je Zelle geometrisch hinunter auf 90 ms. */
export function fallMs(stufe) {
  return Math.max(FALL_MIN_MS, Math.round(FALL_START_MS * FALL_KURVE ** (Math.max(1, stufe) - 1)))
}

/**
 * Alles, was den Druck ausmacht, fuer eine gespielte Zeit (Pausen nicht
 * mitgezaehlt) und die bisher abgeraeumten Reihen. Formeln siehe oben.
 */
export function schwierigkeit(sekunden = 0, reihen = 0) {
  const t = Number.isFinite(sekunden) ? Math.max(0, sekunden) : 0
  const zeitStufe = 1 + Math.floor(t / STUFE_S)
  const stufe = Math.min(STUFE_MAX, Math.max(zeitStufe, levelFuer(Math.max(0, reihen || 0))))
  const n = stufe - 1
  const runden3 = (v) => Math.round(v * 1000) / 1000
  return {
    stufe,
    fallMs: fallMs(stufe),
    lockMs: Math.max(LOCK_MIN_MS, LOCK_START_MS - 20 * n),
    komplexAnteil: n === 0 ? 0 : runden3(Math.min(0.3, 0.04 + 0.03 * n)),
    problemChance: n < 2 ? 0 : runden3(Math.min(0.12, 0.015 * (n - 1))),
    nachschubAlle: n < 3 ? 0 : Math.max(7, Math.round(16 - 1.5 * (n - 3))),
    nachschubLoecher: n < 6 ? 1 : 2,
    /* Die Einbau-Zone: erst breit und still, spaeter schmaler und in
       Bewegung. Das ist der zweite, ruhigere Schwierigkeitsarm — er nimmt
       niemandem etwas weg, er macht den Bonus nur schwerer verdienbar. */
    zonenBreite: zonenBreite(stufe),
    zonenTempo: zonenTempo(stufe),
    /* Wie schnell die Geduld sinkt. 1,0 am Anfang, hoechstens 1,6. */
    geduldTempo: geduldTempo(stufe),
  }
}

/* ------------------------------------------------------------------ */
/* Einbau-Zone: der markierte Bereich, in den das Teil soll            */
/* ------------------------------------------------------------------ */

export const ZONE_BREITE_MAX = 5
export const ZONE_BREITE_MIN = 3
export const ZONE_TEMPO_AB = 6
export const ZONE_TEMPO_MAX = 1.6

/** Breite der Zone in Spalten: 5 bis Stufe 4, dann alle 4 Stufen eine weniger. */
export function zonenBreite(stufe = 1) {
  const n = Math.max(0, Math.min(STUFE_MAX, stufe) - 1)
  return Math.max(ZONE_BREITE_MIN, ZONE_BREITE_MAX - Math.floor(n / 4))
}

/** Wanderung der Zone in Spalten je Sekunde. Vor Stufe 6 steht sie still. */
export function zonenTempo(stufe = 1) {
  const s = Math.max(1, Math.min(STUFE_MAX, stufe))
  if (s < ZONE_TEMPO_AB) return 0
  return Math.round(Math.min(ZONE_TEMPO_MAX, 0.5 + 0.12 * (s - ZONE_TEMPO_AB)) * 1000) / 1000
}

/**
 * Punkte fuer ein eingerastetes Teil (ohne Fallpunkte).
 * Reihen und PERFECT FIT zaehlen mit dem Levelfaktor; die Kette (mehrere
 * Teile hintereinander, die jeweils abraeumen) gibt ab dem zweiten Teil
 * 75 je Glied, gedeckelt.
 */
export function wertung({ anzahl, perfekt, level, kette }) {
  const f = faktorFuer(level)
  const n = Math.min(4, Math.max(0, anzahl))
  let punkte = REIHEN_PUNKTE[n] * f
  if (perfekt && n > 0) punkte += (PERFEKT_PUNKTE + PERFEKT_JE_REIHE * (n - 1)) * f
  if (n > 0 && kette >= 2) punkte += KETTE_PUNKTE * Math.min(kette, KETTE_MAX)
  return punkte
}

/** Die hoechste denkbare Punktzahl eines einzelnen Teils (ohne Fallpunkte). */
export const MAX_JE_TEIL = wertung({ anzahl: 4, perfekt: true, level: FAKTOR_MAX, kette: KETTE_MAX })

export function fallPunkte(zellen, hart) {
  return Math.max(0, zellen) * (hart ? HART_JE_ZELLE : SANFT_JE_ZELLE)
}

/**
 * Ziehung: die acht vertrauten Teile gemischt in einem Beutel, erst wenn er
 * leer ist, kommt der naechste. Mit Schwierigkeit (`ziehen(schw)`) wird
 * vorher gewuerfelt, ob stattdessen ein Fuenfer- oder Problemteil kommt.
 * Zwei Problemteile folgen nie direkt aufeinander.
 */
export function erzeugeZiehung(zufall = Math.random) {
  let beutel = []
  let letztesProblem = false
  const eins = (liste) => liste[Math.min(liste.length - 1, Math.floor(zufall() * liste.length))]
  return function ziehen(schw = null) {
    const pc = schw?.problemChance || 0
    const ka = schw?.komplexAnteil || 0
    if (pc > 0 || ka > 0) {
      const w = zufall()
      if (!letztesProblem && w < pc) {
        letztesProblem = true
        return eins(PROBLEM_TYPEN)
      }
      if (w < pc + ka) {
        letztesProblem = false
        return eins(KOMPLEX_TYPEN)
      }
    }
    letztesProblem = false
    if (!beutel.length) {
      beutel = BASIS_TYPEN.slice()
      for (let i = beutel.length - 1; i > 0; i -= 1) {
        const j = Math.floor(zufall() * (i + 1))
        ;[beutel[i], beutel[j]] = [beutel[j], beutel[i]]
      }
    }
    return beutel.pop()
  }
}

/** Ein frischer Spielstand. */
export function neuesSpiel(zufall = Math.random) {
  const ziehen = erzeugeZiehung(zufall)
  const feld = leeresFeld()
  const erstes = ziehen()
  return {
    feld,
    aktuell: spawnen(feld, erstes),
    naechstes: ziehen(),
    ziehen,
    zufall,
    reihen: 0,
    level: 1,
    stufe: 1,
    kette: 0,
    punkte: 0,
    stuecke: 0,
    perfekte: 0,
    vorbei: false,
  }
}

/**
 * Das aktuelle Teil dort einrasten, wo es steht, werten, bei Bedarf
 * Nachschub einschieben und das naechste holen. `sekunden` ist die bisher
 * gespielte Zeit. Gibt den neuen Stand und das Ereignis fuer Anzeige und
 * Wertung. Der Stand wird nicht veraendert — ausser der Ziehung, die ihren
 * Beutel im Closure fuehrt.
 */
export function festsetzen(stand, sekunden = 0, zonenAnteil = 0) {
  const teil = stand.aktuell
  const { feld: geraeumt, vorher, reihen, perfekt } = einrasten(stand.feld, teil)
  const anzahl = reihen.length
  /* Bewertet wird gegen das Feld VOR dem Einrasten (`einrasten` kopiert, der
     alte Stand bleibt heil) — danach laege das Teil schon drin und jede
     Kante beruehrte sich selbst. */
  const bewertung = bewerten(stand.feld, teil, { perfekt, zonenAnteil })
  const kette = anzahl ? stand.kette + 1 : 0
  const punkte = wertung({ anzahl, perfekt, level: stand.level, kette })
  const reihenGesamt = stand.reihen + anzahl
  const level = levelFuer(reihenGesamt)
  const stuecke = stand.stuecke + 1
  const schw = schwierigkeit(sekunden, reihenGesamt)

  let feld = geraeumt
  let neueReihe = false
  let ueberlauf = false
  if (schw.nachschubAlle && stuecke % schw.nachschubAlle === 0) {
    const n = nachschub(feld, stand.zufall || Math.random, schw.nachschubLoecher)
    feld = n.feld
    ueberlauf = n.ueberlauf
    neueReihe = true
  }

  const aktuell = ueberlauf ? null : spawnen(feld, stand.naechstes)
  const vorherStufe = stand.stufe || 1
  const neu = {
    ...stand,
    feld,
    aktuell,
    naechstes: aktuell ? stand.ziehen(schw) : stand.naechstes,
    reihen: reihenGesamt,
    level,
    stufe: Math.max(vorherStufe, schw.stufe),
    kette,
    punkte: stand.punkte + punkte,
    stuecke,
    perfekte: stand.perfekte + (perfekt ? 1 : 0),
    vorbei: !aktuell,
  }
  return {
    stand: neu,
    ereignis: {
      reihen,
      anzahl,
      perfekt,
      kette,
      punkte,
      vorher,
      levelAuf: level > stand.level,
      level,
      stufe: neu.stufe,
      stufeAuf: neu.stufe > vorherStufe,
      nachschub: neueReihe,
      vorbei: !aktuell,
      /* Bewertung der Platzierung fuer das Spielgefuehl. */
      art: bewertung.art,
      passung: bewertung.passung,
      loecher: bewertung.loecher,
      zonenAnteil: bewertung.zonenAnteil,
      zonenTreffer: bewertung.zonenTreffer,
    },
  }
}

/* ================================================================== */
/* SPIELGEFUEHL — Bewertung, Combo, Fieber, Geduld                     */
/* ================================================================== */

/**
 * BEWERTUNG EINER PLATZIERUNG
 * ---------------------------
 * Drei Stufen, damit man ohne Handbuch sieht, ob es gut war:
 *
 *   PERFECT FIT    keine neue Luecke UND (Reihe exakt geschlossen ODER die
 *                  Zone voll getroffen ODER mindestens 75 % der Unter- und
 *                  Seitenkanten liegen an)
 *   GOOD           keine neue Luecke, oder hoechstens eine und trotzdem
 *                  noch halbwegs satt angelegt (>= 45 %)
 *   KNAPP DANEBEN  alles andere — es bleibt Luft unter dem Schrank
 *
 * `passung` zaehlt nur Unterkante und Seitenkanten. Die Oberkante bleibt
 * absichtlich draussen: oben liegt nach dem Fallen nie etwas an, sie wuerde
 * jede Bewertung nur nach unten ziehen.
 */
export const PERFEKT_PASSUNG = 0.75
export const GUT_PASSUNG = 0.45

/** Anteil der anliegenden Unter- und Seitenkanten (0 … 1). */
export function passungMessen(feld, teil) {
  const zellen = zellenVon(teil)
  const eigen = new Set(zellen.map(([x, y]) => `${x}|${y}`))
  let kanten = 0
  let beruehrt = 0
  for (const [x, y] of zellen) {
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx
      const ny = y + dy
      if (eigen.has(`${nx}|${ny}`)) continue
      kanten += 1
      if (nx < 0 || nx >= BREITE || ny >= HOEHE) beruehrt += 1
      else if (ny >= 0 && feld[ny][nx]) beruehrt += 1
    }
  }
  return { kanten, beruehrt, passung: kanten ? Math.round((beruehrt / kanten) * 1000) / 1000 : 1 }
}

/** Frisch entstandene Luecken: leere Zellen direkt unter dem Teil. */
export function loecherUnter(feld, teil) {
  const tiefste = new Map()
  for (const [x, y] of zellenVon(teil)) {
    if (!tiefste.has(x) || y > tiefste.get(x)) tiefste.set(x, y)
  }
  let n = 0
  for (const [x, y] of tiefste) {
    for (let k = y + 1; k < HOEHE; k += 1) {
      if (feld[k][x]) break
      n += 1
    }
  }
  return n
}

/**
 * Die eigentliche Note. `feld` ist das Feld OHNE das Teil, `perfekt` der
 * alte Reihen-Perfekt aus `einrasten`, `zonenAnteil` der Anteil der Zellen,
 * der in der Einbau-Zone liegt.
 */
export function bewerten(feld, teil, { perfekt = false, zonenAnteil = 0 } = {}) {
  const { passung } = passungMessen(feld, teil)
  const loecher = loecherUnter(feld, teil)
  const anteil = Math.max(0, Math.min(1, zonenAnteil || 0))
  const zonenTreffer = anteil >= 1
  let art = 'daneben'
  if (loecher === 0 && (perfekt || zonenTreffer || passung >= PERFEKT_PASSUNG)) art = 'perfekt'
  else if (loecher === 0) art = 'gut'
  else if (loecher <= 1 && passung >= GUT_PASSUNG) art = 'gut'
  return { art, passung, loecher, zonenAnteil: anteil, zonenTreffer }
}

/* ------------------------------------------------------------------ */
/* Die Zone als Zustand                                                */
/* ------------------------------------------------------------------ */

/** Eine neue Zone wuerfeln. `alt` verhindert, dass sie zweimal gleich liegt. */
export function neueZone(stufe = 1, zufall = Math.random, alt = null) {
  const breite = zonenBreite(stufe)
  const spanne = BREITE - breite
  let x = Math.min(spanne, Math.floor(zufall() * (spanne + 1)))
  if (alt && spanne > 0 && Math.round(alt.x) === x) {
    x = (x + 1 + Math.floor(zufall() * spanne)) % (spanne + 1)
  }
  return { x, breite, tempo: zonenTempo(stufe), richtung: zufall() < 0.5 ? -1 : 1 }
}

/** Die Zone wandern lassen. Sie prallt an den Raendern ab. */
export function zoneTakt(zone, dtMs = 0) {
  if (!zone || !zone.tempo) return zone
  const spanne = BREITE - zone.breite
  if (spanne <= 0) return zone
  const dt = Math.max(0, Math.min(250, dtMs || 0))
  let x = zone.x + zone.richtung * zone.tempo * (dt / 1000)
  let richtung = zone.richtung
  if (x < 0) {
    x = -x
    richtung = 1
  } else if (x > spanne) {
    x = 2 * spanne - x
    richtung = -1
  }
  return { ...zone, x: Math.min(spanne, Math.max(0, x)), richtung }
}

/** Die belegten Spalten der Zone, auf ganze Spalten gerundet. */
export function zoneSpalten(zone) {
  if (!zone) return { von: 0, bis: 0 }
  const von = Math.max(0, Math.min(BREITE - zone.breite, Math.round(zone.x)))
  return { von, bis: von + zone.breite }
}

/** Anteil der Teilzellen, die in der Zone liegen (0 … 1). */
export function zoneAnteil(zone, teil) {
  if (!zone) return 0
  const { von, bis } = zoneSpalten(zone)
  const zellen = zellenVon(teil)
  if (!zellen.length) return 0
  let drin = 0
  for (const [x] of zellen) if (x >= von && x < bis) drin += 1
  return drin / zellen.length
}

/* ------------------------------------------------------------------ */
/* Punkte, Zeit, Fieber — die Stellschrauben                           */
/* ------------------------------------------------------------------ */

/* Punkte fuer die Platzierung selbst, zusaetzlich zur Reihenwertung.
   Das ist der neue Strom: auch ohne abgeraeumte Reihe bringt sauberes
   Einpassen etwas, und Combo und Fieber vervielfachen es. */
export const PLATZ_PUNKTE = { perfekt: 120, gut: 40, daneben: 0 }
export const ZONE_PUNKTE = 60

/* Fieber: ab drei Perfects am Stueck, ab fuenf wird es stark. */
export const FIEBER_AB = 3
export const FIEBER_AB_STARK = 5
export const FIEBER_MS = 6000
export const FIEBER_STARK_MS = 9000
/* Jedes weitere Perfect im Fieber schenkt etwas Restzeit dazu. */
export const FIEBER_NACH_MS = 1500
export const FIEBER_MULT = [1, 1.6, 2]
/* Im Fieber sinkt die Geduld nur noch mit 40 %. */
export const FIEBER_GEDULD = 0.4
/* Combo (bis 3,0) mal Fieber (bis 2,0) — mehr kann nicht zusammenkommen. */
export const MULT_MAX = 6

/* Der Geduldsbalken. Das ist NICHT die Rundenuhr aus useSpielLauf. */
export const GEDULD_MAX_MS = 30000
export const GEDULD_START_MS = 22000
export const GEDULD_TEMPO_MAX = 1.6
/* Zeitgutschrift je Platzierung, je abgeraeumter Reihe und fuer die Zone. */
export const ZEIT_BONUS = { perfekt: 4000, gut: 1500, daneben: 0 }
export const ZEIT_JE_REIHE = 2000
export const ZEIT_ZONE = 1200

export function fieberMult(fieber) {
  return FIEBER_MULT[fieber?.stufe || 0] ?? 1
}

/** Wie schnell die Geduld sinkt: 1,0 in Stufe 1, gedeckelt bei 1,6. */
export function geduldTempo(stufe = 1) {
  const n = Math.max(0, Math.min(STUFE_MAX, stufe) - 1)
  return Math.round(Math.min(GEDULD_TEMPO_MAX, 1 + 0.03 * n) * 1000) / 1000
}

/** Der Gesamtfaktor aus Combo und Fieber, gedeckelt. */
export function gesamtMult(combo = 0, fieber = null) {
  return Math.min(MULT_MAX, comboMult(combo) * fieberMult(fieber))
}

/** Punkte der Platzierung (ohne Reihenwertung, ohne Fallpunkte). */
export function platzPunkte({ art = 'daneben', zonenTreffer = false, combo = 0, fieber = null } = {}) {
  const basis = (PLATZ_PUNKTE[art] || 0) + (zonenTreffer && art !== 'daneben' ? ZONE_PUNKTE : 0)
  if (!basis) return 0
  return Math.round(basis * gesamtMult(combo, fieber))
}

/** Die hoechste Platzierungspunktzahl: PERFECT in der Zone, Combo 12+, starkes Fieber. */
export const MAX_PLATZIERUNG = platzPunkte({
  art: 'perfekt',
  zonenTreffer: true,
  combo: 12,
  fieber: { stufe: 2 },
})
/** Und alles zusammen, was ein einzelner Zug hergeben kann. */
export const MAX_JE_ZUG = MAX_JE_TEIL + MAX_PLATZIERUNG + fallPunkte(HOEHE - 1, true)

/* ------------------------------------------------------------------ */
/* Trockener Humor — selten, nie nach jedem Zug                        */
/* ------------------------------------------------------------------ */

export const HUMOR_PAUSE_MS = 25000
export const SPRUECHE = {
  fieber: ['MASS GENOMMEN. AUSNAHMSWEISE.', 'MONTAGE SAGT DANKE.', 'PASST, WACKELT NICHT, HAT LUFT.'],
  combo: ['DER KUNDE HAT NICHTS GESAGT. GUTES ZEICHEN.', 'AUFMASS IST KEIN GEFÜHL.'],
  daneben: ['DAS RICHTEN WIR BEIM AUFBAU.', 'ZWEI MILLIMETER. SIEHT KEINER.', 'DAFÜR GIBT ES KEINE BLENDE.'],
  stufe: ['SILIKON KASCHIERT VIEL. NICHT DAS.', 'NÄCHSTE ZEILE, GLEICHE GESCHICHTE.'],
}
export const SPRUCH_ANLAESSE = Object.keys(SPRUECHE)

/**
 * Einen Spruch holen — oder null. Es gibt nur einen, wenn seit dem letzten
 * mindestens HUMOR_PAUSE_MS gespielte Zeit vergangen ist. Die Auswahl laeuft
 * reihum, damit derselbe Satz nicht zweimal hintereinander kommt.
 */
export function spruchFuer(zustand, anlass, zeitMs = 0) {
  const liste = SPRUECHE[anlass]
  if (!liste || !liste.length) return null
  if (zeitMs - (zustand?.letzterSpruchMs ?? -Infinity) < HUMOR_PAUSE_MS) return null
  return liste[(zustand?.spruchNr || 0) % liste.length]
}

/* ------------------------------------------------------------------ */
/* Der Gefuehls-Zustand                                                */
/* ------------------------------------------------------------------ */

/** Frischer Gefuehls-Zustand zum Rundenstart. */
export function gefuehlStart(zufall = Math.random) {
  return {
    combo: 0,
    besteCombo: 0,
    perfektKette: 0,
    besteKette: 0,
    perfekte: 0,
    danebenKette: 0,
    fieber: null,
    fieberZahl: 0,
    geduldMs: GEDULD_START_MS,
    zone: neueZone(1, zufall, null),
    zonenTreffer: 0,
    zeitMs: 0,
    letzterSpruchMs: -HUMOR_PAUSE_MS,
    spruchNr: 0,
    punkte: 0,
  }
}

/**
 * Ein Bildschirmtakt: Geduld sinkt, Fieber laeuft ab, die Zone wandert.
 * `dtMs` ist die vergangene Zeit; Pausen zaehlen nicht mit, weil die
 * Komponente dann gar nicht erst ruft. Gibt den neuen Zustand und ein
 * Ereignis mit `leer` (Geduld aufgebraucht) und `fieberEnde`.
 */
export function gefuehlTakt(zustand, dtMs = 0, stufe = 1) {
  const dt = Math.max(0, Math.min(250, dtMs || 0))
  const tempo = geduldTempo(stufe) * (zustand.fieber ? FIEBER_GEDULD : 1)
  const geduldMs = Math.max(0, zustand.geduldMs - dt * tempo)
  let fieber = zustand.fieber
  let fieberEnde = false
  if (fieber) {
    const restMs = fieber.restMs - dt
    if (restMs <= 0) {
      fieber = null
      fieberEnde = true
    } else {
      fieber = { ...fieber, restMs }
    }
  }
  return {
    zustand: {
      ...zustand,
      geduldMs,
      fieber,
      zone: zoneTakt(zustand.zone, dt, stufe),
      zeitMs: zustand.zeitMs + dt,
    },
    ereignis: {
      leer: geduldMs <= 0,
      fieberEnde,
      geduldAnteil: Math.max(0, Math.min(1, geduldMs / GEDULD_MAX_MS)),
    },
  }
}

/**
 * Eine Platzierung verbuchen: Combo fortschreiben oder abbrechen, Fieber
 * zuenden, Zeit gutschreiben, Punkte rechnen, neue Zone wuerfeln.
 *
 * Erwartet die Note aus `bewerten` (bzw. aus dem Ereignis von `festsetzen`).
 * Gibt den neuen Zustand und ein Ereignis fuer Anzeige und Punktevergabe.
 */
export function gefuehlPlatzierung(zustand, eingabe = {}) {
  const art = eingabe.art || 'daneben'
  const reihen = Math.max(0, eingabe.reihen || 0)
  const zonenTreffer = !!eingabe.zonenTreffer && art !== 'daneben'
  const stufe = Math.max(1, eingabe.stufe || 1)
  const zufall = eingabe.zufall || Math.random
  const getroffen = art !== 'daneben'

  const combo = getroffen ? zustand.combo + 1 : 0
  const comboAus = !getroffen && zustand.combo > 0
  const perfektKette = art === 'perfekt' ? zustand.perfektKette + 1 : 0
  const danebenKette = getroffen ? 0 : zustand.danebenKette + 1

  /* Fieber: genau beim dritten und beim fuenften Perfect am Stueck. Der
     ausloesende Zug zaehlt schon mit dem neuen Faktor — sonst faende
     niemand den Moment. */
  let fieber = zustand.fieber
  let fieberStart = 0
  if (art === 'perfekt') {
    if (perfektKette === FIEBER_AB) {
      fieber = { stufe: 1, restMs: FIEBER_MS, gesamtMs: FIEBER_MS }
      fieberStart = 1
    } else if (perfektKette === FIEBER_AB_STARK) {
      fieber = { stufe: 2, restMs: FIEBER_STARK_MS, gesamtMs: FIEBER_STARK_MS }
      fieberStart = 2
    } else if (fieber) {
      fieber = { ...fieber, restMs: Math.min(fieber.gesamtMs, fieber.restMs + FIEBER_NACH_MS) }
    }
  }

  const punkte = platzPunkte({ art, zonenTreffer, combo, fieber })
  const zeitWunsch = (ZEIT_BONUS[art] || 0) + ZEIT_JE_REIHE * reihen + (zonenTreffer ? ZEIT_ZONE : 0)
  const geduldMs = Math.min(GEDULD_MAX_MS, zustand.geduldMs + zeitWunsch)
  /* Was der Balken wirklich geschluckt hat — der Deckel darf nicht luegen. */
  const zeitBonus = Math.round(geduldMs - zustand.geduldMs)

  /* Humor: hoechstens alle 25 s, und nur zu diesen vier Anlaessen. */
  const anlass = fieberStart
    ? 'fieber'
    : eingabe.stufeAuf
      ? 'stufe'
      : danebenKette >= 3
        ? 'daneben'
        : combo === 8
          ? 'combo'
          : null
  const spruch = anlass ? spruchFuer(zustand, anlass, zustand.zeitMs) : null

  return {
    zustand: {
      ...zustand,
      combo,
      besteCombo: Math.max(zustand.besteCombo, combo),
      perfektKette,
      besteKette: Math.max(zustand.besteKette, perfektKette),
      perfekte: zustand.perfekte + (art === 'perfekt' ? 1 : 0),
      danebenKette,
      fieber,
      fieberZahl: zustand.fieberZahl + (fieberStart ? 1 : 0),
      geduldMs,
      zone: neueZone(stufe, zufall, zustand.zone),
      zonenTreffer: zustand.zonenTreffer + (zonenTreffer ? 1 : 0),
      punkte: zustand.punkte + punkte,
      letzterSpruchMs: spruch ? zustand.zeitMs : zustand.letzterSpruchMs,
      spruchNr: zustand.spruchNr + (spruch ? 1 : 0),
    },
    ereignis: {
      art,
      punkte,
      zeitBonus,
      combo,
      comboAus,
      comboAuf: getroffen,
      perfektKette,
      fieberStart,
      fieberStufe: fieber?.stufe || 0,
      mult: gesamtMult(combo, fieber),
      zonenTreffer,
      geduldAnteil: Math.max(0, Math.min(1, geduldMs / GEDULD_MAX_MS)),
      spruch,
    },
  }
}
