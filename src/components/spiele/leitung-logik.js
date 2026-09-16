/**
 * LEITUNGSFINDER — die reine Spiellogik.
 *
 * Kein React, kein DOM, keine Uhr: nur Wand, Leitungen und Wertung. Die
 * Komponente fuehrt Zeit und Finger, hier wird entschieden, was unter der
 * Fliese liegt und was ein Bohrloch bringt. So laesst sich alles in Node
 * pruefen und mit Bots ueber viele Laeufe simulieren — die Servergrenzen
 * kommen aus genau dieser Datei.
 *
 * DIE WAND
 * --------
 * 8 Spalten × 10 Reihen, als flache Liste (Index = y * SPALTEN + x). Jede
 * Zelle hat einen Zustand (verdeckt, offen, markiert), eine Zahl (Leitungen
 * unter den acht Nachbarn) und vielleicht eine Leitung. Die Leitungen werden
 * erst beim ersten Bohrloch verlegt: so ist der erste Tipp jeder Wand immer
 * sicher und immer eine 0, die eine Flaeche aufreisst.
 *
 * Die Groesse bleibt fest: auf 320 px Breite sind 8 Spalten das Maximum fuer
 * treffsichere Fliesen. Schwerer wird eine Wand ueber die Zahl der Leitungen
 * (wandParameter) — und ab Wand 3 liegt auch Abwasser in der Wand.
 *
 * OHNE RATEN
 * ----------
 * Eine endlose Runde, die an einem Muenzwurf endet, fuehlt sich unfair an.
 * Deshalb wird jede Wand vor dem Ausliefern mit demselben Loeser geprueft,
 * den ein aufmerksamer Mensch im Kopf hat (einzelne Zahl, zwei Zahlen im
 * Vergleich, Restzaehler). Nur Waende, die sich vom ersten Loch aus ganz
 * ohne Raten loesen lassen, werden genommen. Findet sich in VERSUCHE Anlaeufen
 * keine, gilt die Wand mit dem groessten loesbaren Anteil — das ist selten
 * und nur in den dichten Waenden.
 *
 * SERIE
 * -----
 * Wer zuegig bohrt, baut eine Serie auf: jede sichere Bohrung binnen
 * SERIE_MS nach der vorigen zaehlt weiter. Alle SERIE_SCHRITT Bohrungen gibt
 * es +10 % auf die Fliesenpunkte, hoechstens +50 %. Die Serie ist der Grund,
 * nicht zu lange zu gruebeln — und genau das macht das naechste Feld riskant.
 *
 * Folge fuer die Wertung: ein perfekter Spieler stirbt nie. Die Runde endet
 * dann mit der Uhr des Laufs (9 Minuten), und die Punkte haengen am Tempo.
 * Genau dafuer gibt es die Mindestzeit je Bohrung (TAKT_MS) und die Decke je
 * Bohrung (BOHRUNG_MAX).
 */

export const SPALTEN = 8
export const REIHEN = 10
export const FELDER = SPALTEN * REIHEN

export const VERDECKT = 0
export const OFFEN = 1
export const FLAGGE = 2

/* Die drei Leitungsarten, in dieser Reihenfolge verteilt. */
export const ARTEN = ['wasser', 'strom', 'abwasser']

/* Schwierigkeit — alle Stellschrauben an einer Stelle. Wand 1 hat 10
   Leitungen (12,5 %), jede Wand eine mehr, ab Wand 9 bleibt es bei 18
   (22,5 %). Dichter wird eine ratefreie 8×10-Wand kaum noch zuverlaessig. */
export const ANZAHL_START = 10
export const ANZAHL_MAX = 18
export const ABWASSER_AB = 3

/* Wertung. */
export const PUNKTE_JE_FELD = 10
export const WAND_BONUS = 400
/* Der Wandfaktor endet bei 8. Wer lange durchhaelt, soll vorn liegen —
   aber nicht quadratisch in eine andere Groessenordnung wachsen. */
export const FAKTOR_MAX = 8

/* Serie: Zeitfenster zwischen zwei Bohrungen, Schrittweite, Deckel. */
export const SERIE_MS = 2200
export const SERIE_SCHRITT = 2
export const SERIE_STUFEN = 5
export const SERIE_ANTEIL = 0.1

/* Mehr bringt eine einzelne Bohrung nie. Eine Flut ueber die halbe Wand 8
   mit voller Serie plus Wandbonus liegt knapp darunter; groesser wird es nur
   in Waenden, die ein Mensch nie so zu sehen bekommt. */
export const BOHRUNG_MAX = 4800

/* Mindestabstand je gezaehlter Bohrung, aufsummiert ab Ticketankunft. Der
   Server verlangt 90 ms je Runde; 110 ms laesst Luft fuer Uhrenrauschen. */
export const TAKT_MS = 110
/* So viele Bohrungen duerfen vor dem Ticket passieren. Eine reicht: der
   erste Tipp ist sicher und kann die Runde nicht beenden. */
export const VORSCHUSS = 1
export const LANG_MS = 350
export const VERSUCHE = 250

/* Nachbarn einmal vorab, fuer jede Zelle. */
export const NACHBARN = Array.from({ length: FELDER }, (_, i) => {
  const x = i % SPALTEN
  const y = Math.floor(i / SPALTEN)
  const liste = []
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < SPALTEN && ny >= 0 && ny < REIHEN) liste.push(ny * SPALTEN + nx)
    }
  }
  return liste
})

export const index = (x, y) => y * SPALTEN + x
export const lage = (i) => [i % SPALTEN, Math.floor(i / SPALTEN)]

export function faktorFuer(nr) {
  return Math.min(Math.max(1, nr), FAKTOR_MAX)
}

/**
 * Wie schwer ist Wand nr? Groesse, Leitungen gesamt und je Art. Alle Werte
 * steigen mit nr oder bleiben gleich, nie sinken sie: kommt Abwasser dazu,
 * waechst die Gesamtzahl im selben Schritt mit.
 */
export function wandParameter(nr) {
  const n = Math.max(1, Math.floor(Number(nr)) || 1)
  const anzahl = Math.min(ANZAHL_MAX, ANZAHL_START + n - 1)
  const stufe = Math.min(n, ANZAHL_MAX - ANZAHL_START + 1)
  const abwasser = stufe < ABWASSER_AB ? 0 : Math.floor((stufe - 1) / 2)
  const rest = anzahl - abwasser
  return {
    nr: n,
    spalten: SPALTEN,
    reihen: REIHEN,
    anzahl,
    wasser: Math.ceil(rest / 2),
    strom: Math.floor(rest / 2),
    abwasser,
    faktor: faktorFuer(n),
  }
}

export function leitungenFuer(nr) {
  return wandParameter(nr).anzahl
}

/** Eine frische, noch unverlegte Wand. */
export function neueWand(nr = 1) {
  const p = wandParameter(nr)
  return {
    nr: p.nr,
    anzahl: p.anzahl,
    arten: { wasser: p.wasser, strom: p.strom, abwasser: p.abwasser },
    angelegt: false,
    leitung: new Array(FELDER).fill(0),
    art: new Array(FELDER).fill(''),
    zahl: new Array(FELDER).fill(0),
    zustand: new Array(FELDER).fill(VERDECKT),
    offen: 0,
    markiert: 0,
    getroffen: -1,
    frei: false,
  }
}

/** Sichere Fliesen, die noch zu bohren sind. */
export function restFuer(wand) {
  return FELDER - wand.anzahl - wand.offen
}

/** Zufaellige Verlegung mit freiem 3×3 um das erste Loch. */
function verlegen(anzahl, start, zufall) {
  const sperre = new Set([start, ...NACHBARN[start]])
  const kandidaten = []
  for (let i = 0; i < FELDER; i += 1) if (!sperre.has(i)) kandidaten.push(i)
  const leitung = new Array(FELDER).fill(0)
  for (let k = 0; k < anzahl && kandidaten.length; k += 1) {
    const j = Math.floor(zufall() * kandidaten.length)
    leitung[kandidaten[j]] = 1
    kandidaten[j] = kandidaten[kandidaten.length - 1]
    kandidaten.pop()
  }
  return leitung
}

function zahlenFuer(leitung) {
  return NACHBARN.map((liste) => liste.reduce((s, n) => s + leitung[n], 0))
}

/**
 * Die Arten auf die verlegten Leitungen verteilen: genau so viele je Art,
 * wie wandParameter sagt, die Reihenfolge zufaellig.
 */
export function artenVerteilen(leitung, arten, zufall = Math.random) {
  const orte = []
  for (let i = 0; i < leitung.length; i += 1) if (leitung[i]) orte.push(i)
  for (let i = orte.length - 1; i > 0; i -= 1) {
    const j = Math.floor(zufall() * (i + 1))
    ;[orte[i], orte[j]] = [orte[j], orte[i]]
  }
  const art = new Array(leitung.length).fill('')
  let k = 0
  for (const name of ARTEN) {
    for (let n = 0; n < (arten[name] || 0) && k < orte.length; n += 1) art[orte[k++]] = name
  }
  /* Sollte die Verlegung mehr Leitungen haben als verteilt: Wasser. */
  while (k < orte.length) art[orte[k++]] = 'wasser'
  return art
}

/**
 * Flutfuellung ab `start`: oeffnet die Zelle und breitet sich ueber Nullen
 * aus. Markierungen auf sicheren Zellen raeumt die Flut mit ab — sonst
 * haenge die Wand an einer falschen Markierung fest. Veraendert `zustand`
 * und gibt die neu geoeffneten Indizes zurueck.
 */
function fluten(zustand, zahl, leitung, start) {
  const neu = []
  const stapel = [start]
  while (stapel.length) {
    const i = stapel.pop()
    if (zustand[i] === OFFEN || leitung[i]) continue
    zustand[i] = OFFEN
    neu.push(i)
    if (zahl[i] === 0) {
      for (const n of NACHBARN[i]) if (zustand[n] !== OFFEN) stapel.push(n)
    }
  }
  return neu
}

/**
 * Was laesst sich aus dem Sichtbaren sicher folgern? Nutzt nur offene Zahlen
 * und die Gesamtzahl der Leitungen, nie die Markierungen des Spielers.
 * Regeln: eine Zahl allein, zwei ueberlappende Zahlen, Restzaehler.
 * `bekannt` (Set) sind schon gefolgerte Leitungen, wird ergaenzt.
 */
export function ableiten(zustand, zahl, anzahl, bekannt = new Set()) {
  const leitung = bekannt
  const sicher = new Set()
  let weiter = true
  while (weiter) {
    weiter = false
    const bedingungen = []
    for (let i = 0; i < FELDER; i += 1) {
      if (zustand[i] !== OFFEN || zahl[i] === 0) continue
      const zellen = []
      let rest = zahl[i]
      for (const n of NACHBARN[i]) {
        if (zustand[n] === OFFEN || sicher.has(n)) continue
        if (leitung.has(n)) rest -= 1
        else zellen.push(n)
      }
      if (zellen.length) bedingungen.push({ i, zellen, rest })
    }

    const setzen = (zellen, istLeitung) => {
      for (const z of zellen) {
        if (istLeitung ? leitung.has(z) : sicher.has(z)) continue
        if (istLeitung) leitung.add(z)
        else sicher.add(z)
        weiter = true
      }
    }

    for (const b of bedingungen) {
      if (b.rest === 0) setzen(b.zellen, false)
      else if (b.rest === b.zellen.length) setzen(b.zellen, true)
    }
    if (weiter) continue

    /* Zwei Zahlen im Vergleich (das 1-2-Muster und Verwandte). */
    for (const a of bedingungen) {
      const [ax, ay] = lage(a.i)
      for (const b of bedingungen) {
        if (a === b) continue
        const [bx, by] = lage(b.i)
        if (Math.abs(ax - bx) > 2 || Math.abs(ay - by) > 2) continue
        const gemeinsam = a.zellen.filter((z) => b.zellen.includes(z))
        if (!gemeinsam.length) continue
        const nurA = a.zellen.length - gemeinsam.length
        const nurB = b.zellen.filter((z) => !a.zellen.includes(z))
        if (!nurB.length) continue
        /* In der Ueberlappung liegen mindestens a.rest - nurA Leitungen,
           hoechstens min(a.rest, |gemeinsam|). */
        const mindestens = Math.max(0, a.rest - nurA)
        const hoechstens = Math.min(a.rest, gemeinsam.length)
        if (b.rest - mindestens <= 0) setzen(nurB, false)
        else if (b.rest - hoechstens === nurB.length) setzen(nurB, true)
      }
      if (weiter) break
    }
    if (weiter) continue

    /* Restzaehler: alle Leitungen gefunden, oder jede Unbekannte ist eine. */
    const unbekannt = []
    for (let i = 0; i < FELDER; i += 1) {
      if (zustand[i] !== OFFEN && !leitung.has(i) && !sicher.has(i)) unbekannt.push(i)
    }
    const offenRest = anzahl - leitung.size
    if (unbekannt.length && offenRest === 0) setzen(unbekannt, false)
    else if (unbekannt.length && offenRest === unbekannt.length) setzen(unbekannt, true)
  }
  return { sicher: [...sicher].filter((i) => zustand[i] !== OFFEN), leitung }
}

/** Wie viele sichere Zellen der Loeser vom ersten Loch aus oeffnen kann. */
export function loesbarerAnteil(leitung, start, anzahl) {
  const zahl = zahlenFuer(leitung)
  const zustand = new Array(FELDER).fill(VERDECKT)
  let offen = fluten(zustand, zahl, leitung, start).length
  const bekannt = new Set()
  const ziel = FELDER - anzahl
  while (offen < ziel) {
    const { sicher } = ableiten(zustand, zahl, anzahl, bekannt)
    if (!sicher.length) break
    for (const i of sicher) offen += fluten(zustand, zahl, leitung, i).length
  }
  return offen / ziel
}

/**
 * Leitungen verlegen, so dass das erste Loch sicher und die Wand ohne Raten
 * loesbar ist. `zufall` ist injizierbar: mit demselben Zufall entsteht
 * dieselbe Wand.
 */
export function anlegen(wand, start, zufall = Math.random) {
  let beste = null
  let besterAnteil = -1
  for (let v = 0; v < VERSUCHE; v += 1) {
    const leitung = verlegen(wand.anzahl, start, zufall)
    const anteil = loesbarerAnteil(leitung, start, wand.anzahl)
    if (anteil > besterAnteil) {
      beste = leitung
      besterAnteil = anteil
    }
    if (anteil >= 1) break
  }
  const arten = wand.arten || wandParameter(wand.nr)
  const art = artenVerteilen(beste, arten, zufall)
  return { ...wand, angelegt: true, leitung: beste, art, zahl: zahlenFuer(beste), ohneRaten: besterAnteil >= 1 }
}

/** Eine Wand erzeugen und sofort ab `start` verlegen — fuer Tests und Bots. */
export function wandErzeugen(nr, start = index(3, 4), zufall = Math.random) {
  return anlegen(neueWand(nr), start, zufall)
}

/* ------------------------------------------------------------------ */
/* Serie                                                               */
/* ------------------------------------------------------------------ */

/**
 * Die Serie nach einer sicheren Bohrung. `abstandMs` ist die Zeit seit der
 * vorigen gezaehlten Bohrung (null: keine vorige oder Serie abgerissen).
 */
export function serieWeiter(serie, abstandMs) {
  if (!(serie > 0) || abstandMs == null || !(abstandMs <= SERIE_MS)) return 1
  return serie + 1
}

/** Stufe 0 … SERIE_STUFEN: +1 alle SERIE_SCHRITT Bohrungen ab der zweiten. */
export function serieStufe(serie) {
  if (!(serie > 1)) return 0
  return Math.min(SERIE_STUFEN, Math.floor((serie - 1) / SERIE_SCHRITT))
}

export function serieFaktor(serie) {
  return 1 + SERIE_ANTEIL * serieStufe(serie)
}

/* ------------------------------------------------------------------ */
/* Wertung und Zuege                                                   */
/* ------------------------------------------------------------------ */

export function punkteFuer(nr, neu, frei, serie = 1) {
  const f = faktorFuer(nr)
  const fliesen = Math.round(neu * PUNKTE_JE_FELD * f * serieFaktor(serie))
  return Math.min(BOHRUNG_MAX, fliesen + (frei ? WAND_BONUS * f : 0))
}

/**
 * Bohren an Index i. Gibt die neue Wand und das Ereignis.
 * art: 'nichts' (verdeckt geht nicht, markiert, offen, vorbei),
 *      'offen' (neu Zellen geoeffnet, Punkte, vielleicht frei),
 *      'leitung' (getroffen, Runde vorbei; `leitung` nennt die Art).
 * `serie` ist die Serie inklusive dieser Bohrung (siehe serieWeiter).
 */
export function bohren(wand, i, zufall = Math.random, serie = 1) {
  if (wand.frei || wand.getroffen >= 0 || i < 0 || i >= FELDER || wand.zustand[i] !== VERDECKT) {
    return { wand, ereignis: { art: 'nichts' } }
  }
  const w = wand.angelegt ? wand : anlegen(wand, i, zufall)
  if (w.leitung[i]) {
    return { wand: { ...w, getroffen: i }, ereignis: { art: 'leitung', index: i, leitung: w.art[i] } }
  }
  const zustand = w.zustand.slice()
  const neu = fluten(zustand, w.zahl, w.leitung, i)
  const offen = w.offen + neu.length
  const markiert = zustand.reduce((s, z) => s + (z === FLAGGE ? 1 : 0), 0)
  const frei = offen === FELDER - w.anzahl
  const punkte = punkteFuer(w.nr, neu.length, frei, serie)
  return {
    wand: { ...w, zustand, offen, markiert, frei },
    ereignis: {
      art: 'offen',
      neu: neu.length,
      zellen: neu,
      punkte,
      frei,
      bonus: frei ? WAND_BONUS * faktorFuer(w.nr) : 0,
      serie,
      serieStufe: serieStufe(serie),
      rest: FELDER - w.anzahl - offen,
    },
  }
}

/** Markierung an i umschalten. null, wenn dort nichts zu markieren ist. */
export function markieren(wand, i) {
  if (wand.frei || wand.getroffen >= 0 || i < 0 || i >= FELDER) return null
  const z = wand.zustand[i]
  if (z === OFFEN) return null
  const zustand = wand.zustand.slice()
  zustand[i] = z === FLAGGE ? VERDECKT : FLAGGE
  return {
    wand: { ...wand, zustand, markiert: wand.markiert + (z === FLAGGE ? -1 : 1) },
    gesetzt: z !== FLAGGE,
  }
}

/**
 * Darf jetzt gebohrt werden? Siehe TAKT_MS. Die k-te gezaehlte Bohrung
 * kommt fruehestens k × TAKT_MS nach der Ticketankunft. Ohne Ticket duerfen
 * VORSCHUSS Bohrungen durch.
 * Gibt 0 (sofort), die Wartezeit in ms oder -1 (auf das Ticket warten).
 */
export function bohrFreigabe({ jetzt, ticketSeit, runden }) {
  const k = runden + 1
  if (!ticketSeit) return k <= VORSCHUSS ? 0 : -1
  return Math.max(0, ticketSeit + k * TAKT_MS - jetzt)
}
