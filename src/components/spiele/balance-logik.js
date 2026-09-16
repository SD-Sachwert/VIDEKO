/**
 * KUECHEN-BALANCE — die Rechnung ohne Bild.
 *
 * Hier steht alles, was entscheidet: welche Teile es gibt, in welcher
 * Reihenfolge sie kommen, ob ein Turm haelt und wie viele Punkte ein Teil
 * bringt. Kein React, kein DOM, keine Uhr — damit ein Node-Skript tausende
 * ehrliche Laeufe durchrechnen kann, bevor der Server Grenzen bekommt.
 *
 * DAS MODELL
 * ----------
 * Kein Starrkoerper-Physiksystem. Jedes Teil liegt auf dem Teil darunter
 * (das unterste auf dem Sockel). Fuer jede Auflage wird geprueft, ob der
 * gemeinsame Schwerpunkt ALLER Teile darueber noch ueber der Auflageflaeche
 * liegt. Liegt er ausserhalb, kippt der Turm ab genau dieser Ebene. Das ist
 * die Regel, die jeder aus dem Alltag kennt — und genau deshalb lesbar.
 *
 * Damit es nicht nur Geometrie ist, wird die Auflage mit der Hoehe knapper
 * (`schrumpf`), und jedes Absetzen bringt einen kleinen zufaelligen Stoss
 * (`stoss`). Schwere Teile, die schief landen, druecken zusaetzlich zur
 * Seite. Leichte und rutschige Teile (Karton) rutschen an der Kante ein
 * Stueck nach aussen. Ein Turm am Rand haelt oft noch — sichtbar wackelnd —
 * und faellt dann beim naechsten Teil. Das ist der Spass.
 *
 * EINHEITEN
 * ---------
 * Das Feld ist FELD_BREITE Einheiten breit, x = 0 ist die Mitte, y = 0 ist
 * die Oberkante des Sockels. Die Komponente rechnet das in Pixel um.
 */

export const FELD_BREITE = 10
export const SOCKEL_BREITE = 5.2
/* Weniger Ueberlappung als das zaehlt als daneben: sonst balanciert ein
   Kuehlschrank auf einer Kante von drei Millimetern. */
export const MIN_UEBERLAPP = 0.12

/* Zeiten. Die Komponente haelt sie ein, die Simulation rechnet mit ihnen. */
export const SPERRE_MS = 550
export const FALL_MS = 240
export const CRASH_MS = 600

/* Punkte */
export const PUNKTE_TEIL = 100
export const PUNKTE_HOEHE = 5
export const HOEHE_BONUS_BIS = 40
export const PUNKTE_PERFEKT = 100
export const SERIE_MAX = 3
export const PUNKTE_RISKANT = 75
export const RISKANT_NORM = 0.3
export const KNAPP_NORM = 0.15
/* Das Maximum je Teil: Grundwert + voller Hoehenbonus + PERFECT ×3.
   RISKANT schliesst PERFECT aus und liegt darunter. */
export const MAX_JE_TEIL = PUNKTE_TEIL + PUNKTE_HOEHE * HOEHE_BONUS_BIS + PUNKTE_PERFEKT * SERIE_MAX

/* Rutschen und Aufprall */
export const RUTSCH_GRENZE = 0.45
export const RUTSCH_WEG = 1.1
export const RUTSCH_MAX = 0.7
export const RUTSCH_REST = 0.2 // so viel eigene Standsicherheit bleibt nach dem Rutschen
export const IMPULS_MAX = 0.14

/**
 * Die Teile. w/h in Einheiten, m als Gewicht, cx als Versatz des
 * Schwerpunkts in Anteilen der Breite (die Spuele ist auf der Beckenseite
 * schwerer). `drehbar`: ein Tipp legt das Teil quer.
 */
export const TEILE = {
  kuehlschrank: { name: 'Kühlschrank', w: 1.8, h: 3.4, m: 8, cx: 0, drehbar: true },
  backofen: { name: 'Backofen', w: 1.9, h: 1.8, m: 6, cx: 0 },
  unterschrank: { name: 'Unterschrank', w: 2.4, h: 2.0, m: 4, cx: 0 },
  haengeschrank: { name: 'Hängeschrank', w: 2.6, h: 1.3, m: 2.5, cx: 0, drehbar: true },
  arbeitsplatte: { name: 'Arbeitsplatte', w: 5.2, h: 0.4, m: 2, cx: 0 },
  spuele: { name: 'Spüle', w: 3.0, h: 1.9, m: 4.5, cx: 0.22 },
  waschmaschine: { name: 'Waschmaschine', w: 1.8, h: 2.0, m: 7, cx: 0 },
  karton: { name: 'Karton', w: 1.6, h: 1.3, m: 0.8, cx: 0, rutschig: true },
  hochschrank: { name: 'Hochschrank', w: 1.8, h: 4.2, m: 6, cx: 0, drehbar: true },
  kuecheninsel: { name: 'Kücheninsel', w: 4.4, h: 2.0, m: 9, cx: 0 },
}

export const ARTEN = Object.keys(TEILE)

/* Die ersten drei Teile kommen aus dieser Liste: breit, gutmuetig, ohne
   Schwerpunkt-Tricks. Wer das Spiel zum ersten Mal sieht, soll erst
   stapeln lernen und nicht mit einem Karton unter einem Kuehlschrank
   anfangen. */
const FREUNDLICH = ['unterschrank', 'kuecheninsel', 'waschmaschine', 'backofen']

export function klemmen(wert, min, max) {
  return wert < min ? min : wert > max ? max : wert
}

/** Reproduzierbarer Zufall (mulberry32) — fuer die Simulation. */
export function zufallsQuelle(saat = 1) {
  let a = saat >>> 0
  return function zufall() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mischen(liste, rng) {
  const kopie = [...liste]
  for (let i = kopie.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = kopie[i]
    kopie[i] = kopie[j]
    kopie[j] = tmp
  }
  return kopie
}

/**
 * Die Reihenfolge der Teile. Ein Beutel mit allen zehn Arten, gemischt,
 * dann der naechste — so kommt kein Teil dreimal hintereinander und keins
 * bleibt ewig aus. An der Beutelgrenze wird ein Doppel vermieden.
 */
export function neueFolge(rng = Math.random) {
  let beutel = mischen(FREUNDLICH, rng).slice(0, 3)
  let letzte = null
  return function naechstes() {
    if (!beutel.length) {
      beutel = mischen(ARTEN, rng)
      if (beutel[0] === letzte) {
        beutel[0] = beutel[1]
        beutel[1] = letzte
      }
    }
    const art = beutel.shift()
    letzte = art
    return { art, quer: false, spiegel: art === 'spuele' && rng() < 0.5 ? -1 : 1 }
  }
}

/** Masse eines Teils in seiner aktuellen Lage. */
export function masse(teil) {
  const t = TEILE[teil.art]
  const quer = Boolean(teil.quer && t.drehbar)
  return {
    w: quer ? t.h : t.w,
    h: quer ? t.w : t.h,
    m: t.m,
    cx: quer ? 0 : t.cx * t.w * (teil.spiegel || 1),
    rutschig: Boolean(t.rutschig),
  }
}

/** Wohin sich ein Teil der Breite w bewegen darf. */
export function bereich(w) {
  const halb = Math.max(0, FELD_BREITE / 2 - w / 2)
  return [-halb, halb]
}

export function oberkante(turm) {
  const oben = turm[turm.length - 1]
  return oben ? oben.y + oben.h : 0
}

/**
 * Wo ein neues Teil auftaucht: seitlich versetzt zur Turmspitze. Ohne
 * Ziehen gibt es also kein PERFECT — ein reiner Tipp setzt nichts mittig.
 */
export function startX(turm, w, rng = Math.random) {
  const oben = turm[turm.length - 1]
  const basis = oben ? oben.x : 0
  const [lo, hi] = bereich(w)
  let seite = rng() < 0.5 ? -1 : 1
  const weit = 1.6 + rng() * 1.4
  let x = klemmen(basis + seite * weit, lo, hi)
  if (Math.abs(x - basis) < 0.9) {
    seite *= -1
    x = klemmen(basis + seite * weit, lo, hi)
  }
  return x
}

/**
 * Die Schwierigkeit zur Hoehe (Anzahl stehender Teile).
 * - schrumpf: so viel Auflage fehlt an jeder Kante (Einheiten)
 * - stoss: groesster zufaelliger Schubs je Absetzen (Einheiten)
 * - perfektTol: Abstand zur Mitte, der noch PERFECT ist
 * - schwankAmp/schwankTempo: das schwebende Teil pendelt ab Hoehe 8
 * Die ersten drei Teile sind frei von Schrumpf und Stoss.
 */
export function schwierigkeit(hoehe) {
  const leicht = hoehe < 4
  return {
    schrumpf: leicht ? 0 : Math.min(0.2, (hoehe - 3) * 0.0035),
    stoss: leicht ? 0 : Math.min(0.2, (hoehe - 3) * 0.0035),
    /* Kulanz: so weit darf der Schwerpunkt ueber die Kante, bevor es kippt.
       Gegen die Summe kleiner Fehler, die sonst den unteren Turm umwirft,
       obwohl jedes einzelne Teil ordentlich stand. Schrumpft mit der Hoehe. */
    kulanz: Math.max(0.08, 0.35 - hoehe * 0.006),
    perfektTol: hoehe < 5 ? 0.2 : Math.max(0.1, 0.16 - hoehe * 0.0015),
    schwankAmp: hoehe < 8 ? 0 : Math.min(0.9, (hoehe - 7) * 0.04),
    schwankTempo: 0.45 + Math.min(0.6, hoehe * 0.01),
  }
}

function auflage(unten, x, w) {
  const uL = unten ? unten.x - unten.w / 2 : -SOCKEL_BREITE / 2
  const uR = unten ? unten.x + unten.w / 2 : SOCKEL_BREITE / 2
  const L = Math.max(x - w / 2, uL)
  const R = Math.min(x + w / 2, uR)
  return { L, R, breite: R - L, mitte: (L + R) / 2 }
}

/**
 * Standfestigkeit jeder Ebene. Ebene k ist die Auflage von Teil k auf
 * Teil k-1 (bzw. dem Sockel). Von oben nach unten summiert, damit es O(n)
 * bleibt. `stoss` verschiebt alle Schwerpunkte, `impuls` nur die obersten
 * zwei Ebenen (der Aufprall).
 *
 * Je Ebene: L/R/mitte der Auflage, X Schwerpunkt, rand (Einheiten bis zur
 * naeheren Kante, nach Schrumpf), norm (rand / halbe Auflage), risiko
 * (0 mittig … 1 an der Kante), seite (+1 rechts), kippt.
 */
export function stabilitaet(turm, schrumpf = 0, stoss = 0, impuls = 0, kulanz = 0) {
  const n = turm.length
  const ebenen = new Array(n)
  let summeM = 0
  let moment = 0
  for (let k = n - 1; k >= 0; k -= 1) {
    const p = turm[k]
    summeM += p.m
    moment += p.m * (p.x + p.cx)
    const a = auflage(k ? turm[k - 1] : null, p.x, p.w)
    const halb = Math.max(0.001, a.breite / 2)
    const X = moment / summeM + stoss + (k >= n - 2 ? impuls : 0)
    /* Schmale Auflagen verlieren hoechstens die Haelfte — sonst waere ein
       Karton ab Hoehe 30 ein sicheres Ende, egal wie genau man zielt. */
    const knapp = Math.min(schrumpf, halb * 0.5)
    const rand = Math.min(X - a.L, a.R - X) - knapp
    const norm = rand / halb
    ebenen[k] = {
      L: a.L,
      R: a.R,
      mitte: a.mitte,
      X,
      rand,
      norm,
      risiko: 1 - klemmen(norm, 0, 1),
      seite: X >= a.mitte ? 1 : -1,
      kippt: rand < -kulanz,
    }
  }
  return ebenen
}

/** Punkte fuer ein stehendes Teil. Nie mehr als MAX_JE_TEIL. */
export function punkteFuer({ hoehe, stufe = 0, riskant = false }) {
  const wert =
    PUNKTE_TEIL +
    PUNKTE_HOEHE * Math.min(hoehe, HOEHE_BONUS_BIS) +
    PUNKTE_PERFEKT * Math.min(stufe, SERIE_MAX) +
    (riskant && !stufe ? PUNKTE_RISKANT : 0)
  return Math.min(MAX_JE_TEIL, wert)
}

/**
 * Ein Teil absetzen. `xRoh` ist die Mitte des Teils in Turm-Koordinaten.
 * Gibt entweder { ok: true, turm, serie, punkte, … } zurueck oder
 * { ok: false, grund: 'daneben' | 'kippt', kippEbene, seite, … }.
 * Veraendert nichts, was hereinkommt.
 */
export function absetzen({ turm, serie = 0 }, teil, xRoh, rng = Math.random) {
  const n = turm.length
  const d = schwierigkeit(n)
  const g = masse(teil)
  const oben = n ? turm[n - 1] : null
  const zielMitte = oben ? oben.x : 0
  const y = oberkante(turm)

  let x = xRoh
  let a = auflage(oben, x, g.w)
  if (a.breite <= MIN_UEBERLAPP) {
    return { ok: false, grund: 'daneben', kippEbene: n, seite: x < zielMitte ? -1 : 1, x, y, gerutscht: 0 }
  }

  const nahDran = Math.abs(x - zielMitte) <= d.perfektTol

  /* Leichtes und Rutschiges gleitet an der Kante nach aussen. */
  let gerutscht = 0
  if (g.rutschig || g.m <= 1) {
    const eigen = 1 - Math.abs(x + g.cx - a.mitte) / (a.breite / 2)
    if (eigen < RUTSCH_GRENZE) {
      const seite = x + g.cx >= a.mitte ? 1 : -1
      /* Rutschen verschlechtert die Lage, wirft das Teil aber nie allein
         vom Turm: es gleitet nur, solange sein eigener Schwerpunkt noch
         deutlich auf der Auflage liegt. Sonst endet ein Lauf durch
         Glatteis statt durch schlechtes Zielen. */
      const weg = Math.min(RUTSCH_MAX, (RUTSCH_GRENZE - eigen) * RUTSCH_WEG)
      for (let schritt = 0.02; schritt <= weg + 1e-9; schritt += 0.02) {
        const probe = auflage(oben, x + seite * schritt, g.w)
        if (probe.breite <= MIN_UEBERLAPP * 2) break
        const rest = 1 - Math.abs(x + seite * schritt + g.cx - probe.mitte) / (probe.breite / 2)
        if (rest < RUTSCH_REST) break
        gerutscht = seite * schritt
      }
      x += gerutscht
      a = auflage(oben, x, g.w)
    }
  }

  const neu = {
    nr: n,
    art: teil.art,
    quer: Boolean(teil.quer && TEILE[teil.art].drehbar),
    spiegel: teil.spiegel || 1,
    x,
    y,
    w: g.w,
    h: g.h,
    m: g.m,
    cx: g.cx,
  }
  const neuTurm = [...turm, neu]

  const stoss = (rng() * 2 - 1) * d.stoss
  const versatz = klemmen((x + g.cx - a.mitte) / (a.breite / 2), -1, 1)
  const impuls = IMPULS_MAX * (g.m / 9) * versatz
  const ebenen = stabilitaet(neuTurm, d.schrumpf, stoss, impuls, d.kulanz)

  for (let k = 0; k <= n; k += 1) {
    if (ebenen[k].kippt) {
      return { ok: false, grund: 'kippt', kippEbene: k, seite: ebenen[k].seite, neu, ebenen, x, y, gerutscht }
    }
  }

  const perfekt = nahDran && Math.abs(gerutscht) < 0.04
  const riskant = !perfekt && ebenen[n].norm < RISKANT_NORM
  let minNorm = Infinity
  for (let k = 0; k <= n; k += 1) if (ebenen[k].norm < minNorm) minNorm = ebenen[k].norm
  const neueSerie = perfekt ? serie + 1 : 0
  const stufe = perfekt ? Math.min(SERIE_MAX, neueSerie) : 0

  return {
    ok: true,
    turm: neuTurm,
    neu,
    serie: neueSerie,
    stufe,
    perfekt,
    riskant,
    knapp: minNorm < KNAPP_NORM,
    gerutscht,
    punkte: punkteFuer({ hoehe: n + 1, stufe, riskant }),
    ebenen,
    stoss,
  }
}
