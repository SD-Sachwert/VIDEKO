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
 */

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
  }
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
export function festsetzen(stand, sekunden = 0) {
  const teil = stand.aktuell
  const { feld: geraeumt, vorher, reihen, perfekt } = einrasten(stand.feld, teil)
  const anzahl = reihen.length
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
    },
  }
}
