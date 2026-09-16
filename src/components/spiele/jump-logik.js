/**
 * VIDEKO JUMP — die reine Spiellogik.
 *
 * Kein React, kein DOM, keine Uhr: nur Welt, Figur, Platten, Eingabe und
 * Wertung. Die Komponente fuehrt Zeit, Finger und Bild; hier wird
 * entschieden, wer wo landet und was es bringt. So laesst sich alles in Node
 * pruefen (scripts/spiele/jump-logik-test.mjs) und mit Bots simulieren.
 *
 * DIE WELT
 * --------
 * Alles rechnet in Weltbreiten: die Kueche ist genau 1 breit, egal ob das
 * Handy 320 oder 430 Pixel hat. y waechst nach oben, die Startplatte liegt
 * bei 0. Links raus heisst rechts rein — die Figur laeuft ueber den Rand,
 * die Platten nicht. 1 Weltbreite nach oben sind 10 HOEHE.
 *
 * FESTER TAKT
 * -----------
 * Ein Schritt ist 1/120 s. Die Komponente sammelt echte Zeit und rechnet
 * so viele Schritte, wie hineinpassen.
 *
 * WARUM JEDE PLATTE ERREICHBAR IST
 * --------------------------------
 * Die Platten entstehen als Kette: jede Kettenplatte liegt mit ihrer
 * hoechsten Stellung hoechstens DY_GRENZE (0,8 Sprunghoehen) ueber der
 * tiefsten Stellung der vorigen festen Kettenplatte (dem Anker). Bis zur
 * Landung auf dieser Hoehe bleiben mindestens 0,72 s — genug, um aus dem
 * Stand 0,70 Weltbreiten seitlich zu laufen. Weil die Figur ueber den Rand
 * laeuft, ist keine Platte weiter als 0,5 entfernt: jede Position ist
 * erreichbar, auch jede Stellung einer beweglichen Platte oder eines Lifts.
 * Zerbrechliche Platten (Glas, Broeckel) sind nie Anker: faellt man nach
 * ihrem Bruch zurueck, erreicht man das naechste Glied vom Anker aus.
 * Zusatzplatten liegen nur zwischen zwei Kettengliedern.
 *
 * WENIGER VORHERSEHBAR
 * --------------------
 * Die Kette laeuft in Abschnitten mit eigenem Rhythmus (frei, Treppe,
 * Zickzack, weite Spruenge, dichte Kleinplatten), zufaellig lang und nie
 * zweimal derselbe hintereinander. Breiten wechseln zwischen schmal, normal
 * und breit.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Eine Runde ist die erste Landung auf einer Platte. Punkte gibt es nur
 * dort: 10 je gewonnener HOEHE, dazu Goldplatte und Meilenstein. Eine
 * Landung bringt nie mehr als MAX_JE_LANDUNG.
 */

/* Physik — alles in Weltbreiten und Sekunden. */
export const TAKT = 1 / 120
export const SCHWERE = 3.4
export const SPRUNG_HOEHE = 0.42
export const ABSPRUNG = Math.sqrt(2 * SCHWERE * SPRUNG_HOEHE)
/* Goldplatte: 1,45-fache Absprunggeschwindigkeit, also gut doppelte Hoehe. */
export const GOLD_FAKTOR = 1.45
export const VX_MAX = 1.05
export const BESCHLEUNIGUNG = 10
export const BREMSE = 8
/* Halbe Breite der Fuesse. */
export const FUSS = 0.034
export const FIGUR_B = 0.085
export const FIGUR_H = 0.1
export const PLATTE_DICKE = 0.03

/* Kamera: sie folgt nur nach oben. */
export const SICHT_MIN = 1.45
export const KAMERA_HALT = 0.95
export const TOT_UNTER = 0.06
export const VORLAUF = 3.2
export const WEG_UNTER = 0.4

/* Wertung. */
export const HOEHE_JE_EINHEIT = 10
export const PUNKTE_JE_HOEHE = 10
export const GOLD_BONUS = 150
export const MEILENSTEIN = 100
export const MEILENSTEIN_BONUS = 100
export const GOLD_ABSTAND = 1.3

/* Mindestzeit zwischen zwei gezaehlten Runden in der Komponente. */
export const SPERRE_MS = 200

/* Die harte Grenze fuer den Abstand zweier Kettenglieder. */
export const DY_GRENZE = 0.8 * SPRUNG_HOEHE
/* Zerbrechliche Kettenglieder lassen darueber noch sichtbaren Abstand. */
export const DY_GLAS = DY_GRENZE - 0.09
/* Kleinster Abstand zweier Kettenglieder. */
export const DY_KLEIN = 0.08

/* Lift: faehrt senkrecht zwischen yMin und yMax. */
export const LIFT_HUB_MIN = 0.04
export const LIFT_HUB_MAX = 0.1
/* Broeckelplatte: traegt so viele Landungen. */
export const BROECKEL_HAELT = 2
/* Keine Platte wird schmaler. */
export const BREITE_MIN = 0.075

/* Ab dieser HOEHE ist die volle Schwierigkeit erreicht. */
export const VOLL_BEI = 600

/* ------------------------------------------------------------------ */
/* Kombo, Kraefte und fliegende Kuechenteile                            */
/* ------------------------------------------------------------------ */

/**
 * KNAPP. Wer mit der aeussersten Fussspitze aufkommt, hat es knapp
 * geschafft — und bekommt dafuer die Kombo. Gemessen wird der Abstand der
 * Figurmitte zur Plattenmitte im Verhaeltnis zur groesstmoeglichen Auflage.
 */
export const KNAPP_ANTEIL = 0.62

/**
 * Dieselbe Kombo-Leiter wie in spielgefuehl.js (HEISS, KUECHENCHEF,
 * KUECHE ESKALIERT, KOMPLETT GESTOERT). Hier stehen nur die Zahlen: die
 * Logik kennt kein DOM und darf die Anzeige nicht importieren.
 */
export const COMBO_AB = [3, 5, 8, 10]
export const COMBO_MULT = [1.5, 1.8, 2.2, 2.5]

/** Der Kombo-Multiplikator fuer einen Stand. 1, solange keine Stufe erreicht ist. */
export function comboFaktor(combo) {
  let f = 1
  for (let i = 0; i < COMBO_AB.length; i += 1) if (combo >= COMBO_AB[i]) f = COMBO_MULT[i]
  return f
}

/* Kraefte. Die goldene Kochmuetze verdoppelt, Kombo und Muetze zusammen
   sind bei MULT_MAX gedeckelt — sonst waere keine Obergrenze mehr zu
   rechnen und der Server muesste jede Zahl glauben. */
export const MUETZE_MULT = 2
export const MUETZE_DAUER = 5
export const MULT_MAX = 4

/** Wie lange der Turbo traegt und wie schnell er steigt. */
export const TURBO_DAUER = 1.6
export const TURBO_V = 1.5

/** Nach einem Treffer kurz unverwundbar, sonst schlaegt dasselbe Teil zweimal. */
export const UNVERWUNDBAR = 0.9
/** Ein Treffer wirft nach unten — er toetet nicht. Sterben kann man nur durch Fallen. */
export const TREFFER_V = -0.55

export const GABE_ARTEN = ['muetze', 'schuerze', 'turbo']
export const GABE_R = 0.05
export const GABE_AB_HOEHE = 40
/* So viele Weltbreiten liegen mindestens zwischen zwei Kraeften. */
export const GABE_ABSTAND = 2.2

/** Was durch die Kueche fliegt. Alles Kuecheninventar, nichts Gefaehrliches. */
export const GEGNER_ARTEN = ['backofen', 'kuehlschrank', 'spuelmaschine', 'topf', 'pfanne', 'karton', 'haube', 'spuelbecken']
export const GEGNER_BREITE = {
  backofen: 0.16,
  kuehlschrank: 0.13,
  spuelmaschine: 0.15,
  topf: 0.1,
  pfanne: 0.12,
  karton: 0.12,
  haube: 0.16,
  spuelbecken: 0.14,
}
export const GEGNER_AB_HOEHE = 60
export const GEGNER_H = 0.075
export const GEGNER_ABSTAND = 1.1

/* Neigung: ab NEIGUNG_EIN Grad lenkt es, unter NEIGUNG_AUS nicht mehr. */
export const NEIGUNG_EIN = 7
export const NEIGUNG_AUS = 3.5
export const NEIGUNG_WARTEN_MS = 1500

const klemmen = (v, a, b) => Math.min(b, Math.max(a, v))

/** Gleichmaessiger Zufall mit Startwert, damit Tests und Bots wiederholbar sind. */
export function zufallMit(startwert) {
  let a = startwert >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** x in [0, 1) — die Kueche ist ein Ring. */
export const umbrechen = (x) => ((x % 1) + 1) % 1

/** Kuerzester Abstand auf dem Ring, mit Vorzeichen: von a nach b. */
export function ringAbstand(a, b) {
  let d = umbrechen(b - a)
  if (d > 0.5) d -= 1
  return d
}

/** HOEHE fuer eine Welthoehe. */
export const hoeheVon = (y) => Math.max(0, Math.floor(y * HOEHE_JE_EINHEIT + 1e-6))

/** 0 am Start, 1 ab VOLL_BEI. */
export const stufe = (hoehe) => klemmen(hoehe / VOLL_BEI, 0, 1)

/* ------------------------------------------------------------------ */
/* Eingabe — reine Funktionen, die Komponente reicht nur Werte durch    */
/* ------------------------------------------------------------------ */

/** Welche Spielfeldhaelfte: -1 links, 1 rechts. */
export function seiteVon(clientX, links, breite) {
  return clientX < links + breite / 2 ? -1 : 1
}

/**
 * Seitliche Neigung in Grad, passend zur Bildschirmlage. Positiv heisst:
 * nach rechts gekippt. null, wenn der Sensor nichts liefert.
 */
export function neigungGrad(beta, gamma, winkel = 0) {
  const w = ((Math.round(Number(winkel) || 0) % 360) + 360) % 360
  let grad
  if (w === 90) grad = Number.isFinite(beta) ? -beta : null
  else if (w === 270) grad = Number.isFinite(beta) ? beta : null
  else if (w === 180) grad = Number.isFinite(gamma) ? -gamma : null
  else grad = Number.isFinite(gamma) ? gamma : null
  return grad === null ? null : klemmen(grad, -90, 90)
}

/** Richtung aus der Neigung, mit Hysterese gegen Flattern an der Schwelle. */
export function neigungRichtung(grad, vorher = 0, ein = NEIGUNG_EIN, aus = NEIGUNG_AUS) {
  if (!Number.isFinite(grad)) return 0
  if (vorher !== 0 && Math.sign(grad) === vorher && Math.abs(grad) >= aus) return vorher
  if (Math.abs(grad) >= ein) return grad > 0 ? 1 : -1
  return 0
}

/**
 * Die wirksame Richtung. Finger in Reihenfolge des Aufsetzens: der zuletzt
 * aufgesetzte, noch liegende Finger gewinnt (0 = dieser Finger lenkt nicht,
 * etwa weil er die Pause beendet hat). Danach Tasten, zuletzt Neigung.
 * Touch hat also immer Vorrang vor der Neigung.
 */
export function eingabeAus({ finger = [], links = false, rechts = false, neigung = 0, neigungAktiv = false } = {}) {
  let letzter = null
  for (const f of finger) letzter = f
  if (letzter !== null) return { richtung: Math.sign(letzter) || 0, quelle: 'touch' }
  if (links || rechts) return { richtung: (rechts ? 1 : 0) - (links ? 1 : 0), quelle: 'touch' }
  if (neigungAktiv) return { richtung: Math.sign(neigung) || 0, quelle: 'neigung' }
  return { richtung: 0, quelle: 'touch' }
}

/* ------------------------------------------------------------------ */
/* Platten                                                             */
/* ------------------------------------------------------------------ */

/** Welche Plattenarten es gibt. */
export const ARTEN = ['boden', 'normal', 'bewegt', 'lift', 'glas', 'broeckel', 'gold', 'herd']
/** Welche Rhythmus-Abschnitte es gibt. */
export const ABSCHNITTE = ['frei', 'treppe', 'zickzack', 'weit', 'dicht']

export const zerbrechlich = (art) => art === 'glas' || art === 'broeckel'
/** Tiefste und hoechste Stellung einer Platte. */
export const yUnten = (p) => (p.art === 'lift' ? p.yMin : p.y)
export const yOben = (p) => (p.art === 'lift' ? p.yMax : p.y)

/**
 * Alle Stellschrauben der Schwierigkeit fuer eine HOEHE.
 */
export function regeln(hoehe) {
  const s = stufe(hoehe)
  return {
    dyMin: 0.1 + 0.1 * s,
    dyMax: Math.min(DY_GRENZE, 0.2 + 0.13 * s),
    dyWeit: Math.min(DY_GRENZE, 0.27 + 0.07 * s),
    breite: 0.24 - 0.09 * s,
    schmal: hoehe < 40 ? 0.04 : 0.1 + 0.2 * s,
    breit: 0.16 - 0.08 * s,
    streuung: 0.28 + 0.22 * s,
    bewegt: hoehe < 30 ? 0 : 0.08 + 0.22 * s,
    tempo: 0.12 + 0.28 * s,
    lift: hoehe < 90 ? 0 : 0.03 + 0.09 * s,
    glas: hoehe < 50 ? 0 : 0.04 + 0.08 * s,
    broeckel: hoehe < 35 ? 0 : 0.05 + 0.09 * s,
    gold: hoehe < 20 ? 0 : 0.07,
    herd: hoehe < 80 ? 0 : 0.06 + 0.16 * s,
    extra: 0.45 - 0.35 * s,
    /* Kraefte werden nach oben hin seltener: oben sind sie mehr wert. */
    gabe: hoehe < GABE_AB_HOEHE ? 0 : 0.17 - 0.06 * s,
    /* Fliegende Kuechenteile: langsam mehr, aber nie so viele, dass der Weg
       zu ist. Das Tempo waechst mit, die Dichte nur wenig. */
    gegner: hoehe < GEGNER_AB_HOEHE ? 0 : 0.1 + 0.16 * s,
    gegnerTempo: 0.2 + 0.34 * s,
  }
}

const LAENGEN = { frei: [3, 6], treppe: [4, 7], zickzack: [3, 6], weit: [2, 4], dicht: [3, 5] }

/** Naechster Rhythmus-Abschnitt: gewichtet, nie derselbe wie eben. */
export function abschnittWaehlen(zufall, hoehe, vorher = null) {
  const gewichte = [
    ['frei', 3],
    ['treppe', 2],
    ['zickzack', hoehe < 15 ? 0 : 2],
    ['weit', hoehe < 25 ? 0 : 1.5],
    ['dicht', hoehe < 60 ? 0 : 1.5],
  ].filter(([a, g]) => g > 0 && a !== vorher)
  const summe = gewichte.reduce((n, [, g]) => n + g, 0)
  let w = zufall() * summe
  let art = gewichte[gewichte.length - 1][0]
  for (const [a, g] of gewichte) {
    if (w < g) {
      art = a
      break
    }
    w -= g
  }
  const [lo, hi] = LAENGEN[art]
  return {
    art,
    rest: lo + Math.floor(zufall() * (hi - lo + 1)),
    seite: zufall() < 0.5 ? -1 : 1,
    schritt: 0.1 + zufall() * 0.12,
  }
}

function platteNeu(stand, felder) {
  stand.naechsteId += 1
  const p = {
    id: stand.naechsteId,
    art: 'normal',
    x: 0.5,
    y: 0,
    yAlt: 0,
    yMin: 0,
    yMax: 0,
    b: 0.2,
    v: 0,
    xMin: 0,
    xMax: 1,
    kette: false,
    abschnitt: null,
    beruehrt: false,
    risse: 0,
    weg: false,
    fallV: 0,
    heiss: false,
    ...felder,
  }
  p.yAlt = p.y
  return p
}

/** Kleinster und groesster Mittelpunkt, den eine Platte je einnimmt. */
function spanne(p) {
  return p.art === 'bewegt' ? [p.xMin, p.xMax] : [p.x, p.x]
}

/** Liegen zwei Platten so nah, dass sie sich optisch ueberdecken koennten? */
function stoert(a, b) {
  const senkrecht = Math.max(yUnten(b) - yOben(a), yUnten(a) - yOben(b), 0)
  if (senkrecht >= 0.075) return false
  const [a0, a1] = spanne(a)
  const [b0, b1] = spanne(b)
  const luecke = Math.max(b0 - a1, a0 - b1, 0)
  return luecke < (a.b + b.b) / 2 + 0.03
}

/** Breite nach Klasse: schmal, normal oder breit. */
function breiteWaehlen(z, r, abschnitt) {
  const w = z()
  const schmal = r.schmal * (abschnitt === 'dicht' ? 2.2 : 1)
  const breit = r.breit * (abschnitt === 'weit' ? 2.5 : abschnitt === 'dicht' ? 0 : 1)
  let faktor
  if (w < schmal) faktor = 0.58 + 0.08 * z()
  else if (w < schmal + breit) faktor = 1.35 + 0.15 * z()
  else faktor = 0.88 + 0.24 * z()
  return klemmen(r.breite * faktor, BREITE_MIN, 0.4)
}

/**
 * Das naechste Kettenglied und die Zusatzplatten darunter. Die Kette ist
 * der garantierte Weg nach oben, siehe WARUM JEDE PLATTE ERREICHBAR IST.
 */
export function kettenGlied(stand) {
  const z = stand.zufall
  const letzte = stand.kette
  const basis = yOben(letzte)
  const hoehe = hoeheVon(basis)
  const r = regeln(hoehe)

  if (!stand.abschnitt || stand.abschnitt.rest <= 0) {
    stand.abschnitt = abschnittWaehlen(z, hoehe, stand.abschnitt?.art)
  }
  const ab = stand.abschnitt
  ab.rest -= 1

  const anker = stand.anker || letzte
  /* Wie viel senkrechter Weg vom Anker bis zur Oberkante des neuen Glieds bleibt. */
  const vorbelastung = basis - yUnten(anker)
  const dyErlaubt = DY_GRENZE - vorbelastung

  let dyWunsch
  if (ab.art === 'treppe') dyWunsch = r.dyMin * (0.85 + 0.3 * z())
  else if (ab.art === 'zickzack') dyWunsch = r.dyMin + (0.3 + 0.5 * z()) * (r.dyMax - r.dyMin)
  else if (ab.art === 'weit') dyWunsch = r.dyMax + z() * (r.dyWeit - r.dyMax)
  else if (ab.art === 'dicht') dyWunsch = DY_KLEIN + z() * 0.06
  else dyWunsch = r.dyMin + z() * (r.dyMax - r.dyMin)
  const dy = Math.max(Math.min(DY_KLEIN, dyErlaubt), Math.min(dyErlaubt, dyWunsch))

  const y = basis + dy
  const b = breiteWaehlen(z, r, ab.art)
  const halb = b / 2
  let xRoh
  if (ab.art === 'treppe') {
    xRoh = letzte.x + ab.seite * ab.schritt * (0.8 + 0.4 * z())
  } else if (ab.art === 'zickzack') {
    ab.seite = -ab.seite
    xRoh = letzte.x + ab.seite * (0.26 + 0.2 * z())
  } else if (ab.art === 'weit') {
    xRoh = letzte.x + (z() * 2 - 1) * r.streuung * 0.6
  } else if (ab.art === 'dicht') {
    xRoh = letzte.x + (z() * 2 - 1) * 0.35
  } else {
    xRoh = letzte.x + (z() * 2 - 1) * r.streuung
  }
  const x = klemmen(umbrechen(xRoh), halb, 1 - halb)

  const neu = platteNeu(stand, { x, y, b, kette: true, abschnitt: ab.art })
  const kannBrechen = !zerbrechlich(letzte.art) && dy + vorbelastung <= DY_GLAS
  const liftRaum = dyErlaubt - dy
  if (r.gold && ab.art !== 'dicht' && z() < r.gold && y - stand.letztesGold >= GOLD_ABSTAND) {
    neu.art = 'gold'
    stand.letztesGold = y
  } else {
    const w = z()
    let grenze = 0
    if (kannBrechen && w < (grenze += r.glas)) {
      neu.art = 'glas'
    } else if (kannBrechen && w < (grenze += r.broeckel)) {
      neu.art = 'broeckel'
    } else if (liftRaum >= LIFT_HUB_MIN && w < (grenze += r.lift)) {
      neu.art = 'lift'
      const hub = Math.min(liftRaum, LIFT_HUB_MIN + z() * (LIFT_HUB_MAX - LIFT_HUB_MIN))
      neu.yMin = y
      neu.yMax = y + hub
      neu.y = y + z() * hub
      neu.yAlt = neu.y
      neu.v = (0.08 + 0.1 * z()) * (z() < 0.5 ? -1 : 1)
    } else if (w < grenze + r.bewegt * (ab.art === 'zickzack' ? 0.6 : 1)) {
      neu.art = 'bewegt'
      const weite = 0.08 + z() * 0.32
      neu.xMin = Math.max(halb, x - weite)
      neu.xMax = Math.min(1 - halb, x + weite)
      if (neu.xMax - neu.xMin < 0.08) {
        neu.xMin = halb
        neu.xMax = 1 - halb
      }
      neu.v = r.tempo * (0.6 + 0.8 * z()) * (z() < 0.5 ? -1 : 1)
    }
  }
  stand.platten.push(neu)
  stand.kette = neu
  if (!zerbrechlich(neu.art)) stand.anker = neu

  /* Zusatzplatten nur zwischen den beiden Kettengliedern. */
  const zusatz = (art) => {
    if (dy < 0.12) return
    const yz = basis + 0.05 + z() * (dy - 0.09)
    const bz = breiteWaehlen(z, r, 'frei')
    const xz = klemmen(z(), bz / 2, 1 - bz / 2)
    const kandidat = { art, x: xz, y: yz, b: bz }
    const nah = stand.platten.filter((p) => !p.weg && Math.abs(p.y - yz) < 0.2)
    if (nah.some((p) => stoert(p, kandidat))) return
    stand.platten.push(platteNeu(stand, kandidat))
  }
  if (z() < r.extra) {
    const w = z()
    zusatz(r.glas && w < r.glas ? 'glas' : r.broeckel && w < r.glas + r.broeckel ? 'broeckel' : 'normal')
  }
  if (r.herd && z() < r.herd * (ab.art === 'zickzack' ? 1.4 : 1)) zusatz('herd')

  gabeVielleicht(stand, basis, dy, hoehe, r)
  gegnerVielleicht(stand, basis, dy, hoehe, r)
}

/**
 * Eine Kraft in die Luecke zwischen zwei Kettengliedern. Sie haengt frei,
 * man holt sie im Vorbeifliegen — nie ein Umweg, der nach unten fuehrt.
 */
function gabeVielleicht(stand, basis, dy, hoehe, r) {
  if (!r.gabe || dy < 0.12) return
  const z = stand.zufall
  if (z() >= r.gabe) return
  const y = basis + dy * 0.5
  if (y - stand.letzteGabe < GABE_ABSTAND) return
  const w = z()
  const art = w < 0.42 ? 'muetze' : w < 0.78 ? 'schuerze' : 'turbo'
  stand.naechsteId += 1
  stand.gaben.push({ id: stand.naechsteId, art, x: klemmen(z(), GABE_R, 1 - GABE_R), y, weg: false })
  stand.letzteGabe = y
}

/**
 * Ein fliegendes Kuechenteil zwischen zwei Gliedern. Es zieht waagerecht
 * durch den Ring, ist schmal und immer sichtbar unterwegs: ausweichen geht
 * seitlich, und wer getroffen wird, faellt — er stirbt nicht.
 */
function gegnerVielleicht(stand, basis, dy, hoehe, r) {
  if (!r.gegner || dy < 0.14) return
  const z = stand.zufall
  if (z() >= r.gegner) return
  const y = basis + dy * (0.35 + 0.3 * z())
  if (y - stand.letzterGegner < GEGNER_ABSTAND) return
  const art = GEGNER_ARTEN[Math.floor(z() * GEGNER_ARTEN.length) % GEGNER_ARTEN.length]
  stand.naechsteId += 1
  stand.gegner.push({
    id: stand.naechsteId,
    art,
    x: z(),
    y,
    b: GEGNER_BREITE[art] || 0.13,
    v: r.gegnerTempo * (0.7 + 0.6 * z()) * (z() < 0.5 ? -1 : 1),
    dreh: 0,
    weg: false,
  })
  stand.letzterGegner = y
}

/** Platten bis ueber den Bildrand nachlegen, alte unter dem Rand vergessen. */
export function nachfuellen(stand) {
  while (yOben(stand.kette) < stand.kamera + VORLAUF) kettenGlied(stand)
  const grenze = stand.kamera - WEG_UNTER
  if (stand.platten.length && stand.platten[0].y < grenze) {
    stand.platten = stand.platten.filter((p) => p.y >= grenze || (p.weg && p.y > grenze - 2))
  }
  /* Eingesammeltes und Weggeflogenes darf nicht im Speicher liegen bleiben. */
  if (stand.gaben.length && stand.gaben[0].y < grenze) stand.gaben = stand.gaben.filter((g) => g.y >= grenze && !g.weg)
  if (stand.gegner.length && stand.gegner[0].y < grenze) stand.gegner = stand.gegner.filter((g) => g.y >= grenze && !g.weg)
}

function standNeu(startwert) {
  const stand = {
    zufall: zufallMit(startwert),
    naechsteId: 0,
    platten: [],
    kette: null,
    anker: null,
    abschnitt: null,
    letztesGold: -10,
    gaben: [],
    gegner: [],
    letzteGabe: -10,
    letzterGegner: -10,
    spieler: { x: 0.5, y: 0, vx: 0, vy: ABSPRUNG },
    kamera: -0.2,
    hoehe: 0,
    punkte: 0,
    runden: 0,
    zeit: 0,
    /* Kombo und Kraefte. `muetzeBis`/`turboBis`/`unverwundbarBis` zaehlen in
       stand.zeit, nicht in echter Uhrzeit — die Logik kennt keine Uhr. */
    combo: 0,
    comboBest: 0,
    knapp: 0,
    muetzeBis: 0,
    turboBis: 0,
    unverwundbarBis: 0,
    schutz: false,
    treffer: 0,
    vorbei: false,
    erzeugen: true,
  }
  const boden = platteNeu(stand, { art: 'boden', x: 0.5, y: 0, b: 1, kette: true, beruehrt: true })
  stand.platten.push(boden)
  stand.kette = boden
  stand.anker = boden
  return stand
}

/** Ein frischer Lauf. Die Figur steht auf der Startplatte und springt sofort. */
export function neuesSpiel(startwert = 1) {
  const stand = standNeu(startwert)
  nachfuellen(stand)
  return stand
}

/**
 * Nur fuer Tests und Auswertung: `anzahl` Kettenglieder am Stueck erzeugen,
 * ohne dass alte Platten vergessen werden.
 */
export function plattenErzeugen(startwert, anzahl) {
  const stand = standNeu(startwert)
  let n = 0
  while (n < anzahl) {
    kettenGlied(stand)
    n += 1
  }
  return stand.platten
}

/** Beruehren sich Fuesse und Platte? Auf dem Ring gemessen. */
export function ueberlappt(p, x) {
  if (p.art === 'boden') return true
  return Math.abs(ringAbstand(p.x, x)) <= p.b / 2 + FUSS
}

/** Wie lange es dauert, bis die Figur im Fallen auf dy ueber dem Absprung ist. Sonst -1. */
export function flugzeitBis(dy, v = ABSPRUNG) {
  const d = v * v - 2 * SCHWERE * dy
  if (d < 0) return -1
  return (v + Math.sqrt(d)) / SCHWERE
}

/** Wie weit die Figur aus dem Stand in t Sekunden seitlich kommt. */
export function reichweite(t) {
  const anlauf = VX_MAX / BESCHLEUNIGUNG
  if (t <= anlauf) return 0.5 * BESCHLEUNIGUNG * t * t
  return 0.5 * VX_MAX * anlauf + VX_MAX * (t - anlauf)
}

/**
 * Kommt man von Platte `von` sicher auf Platte `nach`? Ungunstigster Fall:
 * `von` in tiefster, `nach` in hoechster Stellung, Absprung am falschen
 * Ende, Figur ohne Schwung.
 */
export function erreichbar(von, nach) {
  const dy = yOben(nach) - yUnten(von)
  if (dy > SPRUNG_HOEHE * 0.98) return false
  const t = flugzeitBis(Math.max(0, dy), von.art === 'gold' ? ABSPRUNG * GOLD_FAKTOR : ABSPRUNG)
  if (t < 0) return false
  const noetig = 0.5 - (von.art === 'boden' ? 0.5 : von.b / 2) - nach.b / 2
  return reichweite(t) >= Math.max(0, noetig)
}

/** Trifft ein fliegendes Kuechenteil die Figur? Auf dem Ring gemessen. */
export function trifft(g, s) {
  if (Math.abs(ringAbstand(g.x, s.x)) > g.b / 2 + FIGUR_B / 2) return false
  const oben = s.y + FIGUR_H
  return !(oben < g.y - GEGNER_H / 2 || s.y > g.y + GEGNER_H / 2)
}

/**
 * Ein fester Schritt. `richtung` ist -1, 0 oder 1. Gibt die Ereignisse
 * dieses Schritts zurueck: landung, durchflug, heiss, gabe, schutz,
 * treffer, absturz.
 */
export function schritt(stand, richtung = 0) {
  const ereignisse = []
  if (stand.vorbei) return ereignisse
  const dt = TAKT
  stand.zeit += dt

  for (const p of stand.platten) {
    p.yAlt = p.y
    if (p.weg) {
      p.fallV -= SCHWERE * dt
      p.y += p.fallV * dt
    } else if (p.art === 'bewegt') {
      p.x += p.v * dt
      if (p.x > p.xMax) {
        p.x = 2 * p.xMax - p.x
        p.v = -Math.abs(p.v)
      } else if (p.x < p.xMin) {
        p.x = 2 * p.xMin - p.x
        p.v = Math.abs(p.v)
      }
    } else if (p.art === 'lift') {
      p.y += p.v * dt
      if (p.y > p.yMax) {
        p.y = 2 * p.yMax - p.y
        p.v = -Math.abs(p.v)
      } else if (p.y < p.yMin) {
        p.y = 2 * p.yMin - p.y
        p.v = Math.abs(p.v)
      }
    }
  }

  /* Fliegende Kuechenteile ziehen waagerecht durch den Ring. Getroffenes
     bleibt kurz zum Ansehen liegen und wird dann weggeraeumt (§15). */
  let aufraeumen = false
  for (const g of stand.gegner) {
    if (g.weg) {
      if (stand.zeit > g.wegBis) aufraeumen = true
      continue
    }
    g.x = umbrechen(g.x + g.v * dt)
    g.dreh += g.v * dt * 6
  }
  for (const gb of stand.gaben) if (gb.weg && stand.zeit > gb.wegBis) aufraeumen = true
  if (aufraeumen) {
    stand.gegner = stand.gegner.filter((g) => !g.weg || stand.zeit <= g.wegBis)
    stand.gaben = stand.gaben.filter((g) => !g.weg || stand.zeit <= g.wegBis)
  }

  const s = stand.spieler
  const ziel = richtung * VX_MAX
  if (richtung !== 0) {
    const kraft = Math.sign(ziel - s.vx) !== Math.sign(s.vx) && s.vx !== 0 ? BESCHLEUNIGUNG + BREMSE : BESCHLEUNIGUNG
    const d = ziel - s.vx
    s.vx += Math.sign(d) * Math.min(Math.abs(d), kraft * dt)
  } else {
    s.vx -= Math.sign(s.vx) * Math.min(Math.abs(s.vx), BREMSE * dt)
  }
  s.x = umbrechen(s.x + s.vx * dt)

  const vorher = s.y
  const turbo = stand.turboBis > stand.zeit
  if (turbo) {
    /* Turbo traegt mit fester Geschwindigkeit nach oben — keine Schwerkraft,
       aber auch kein Sprung ins Nichts: danach faellt die Figur normal. */
    s.vy = TURBO_V
    s.y += s.vy * dt
  } else {
    s.vy -= SCHWERE * dt
    s.y += s.vy * dt
  }

  if (turbo) {
    /* Was auf dem Weg nach oben durchflogen wird, zaehlt einzeln. So bleibt
       die Punktzahl je Runde genauso gedeckelt wie bei einer Landung. */
    const durch = stand.platten
      .filter((p) => p.kette && !p.weg && !p.beruehrt && p.art !== 'herd' && p.y > vorher && p.y <= s.y)
      .sort((a, b) => a.y - b.y)
    for (const p of durch) {
      const e = { art: 'durchflug', platte: p, neu: false, punkte: 0, gold: false, meilenstein: 0, hoehe: stand.hoehe }
      werten(stand, p, e, false)
      ereignisse.push(e)
    }
  } else if (s.vy <= 0) {
    let treffer = null
    for (const p of stand.platten) {
      if (p.weg || p.art === 'herd') continue
      /* yAlt: ein Lift darf nicht durch die Fuesse hindurchfahren. */
      if (vorher >= Math.min(p.yAlt, p.y) && s.y <= p.y && ueberlappt(p, s.x) && (!treffer || p.y > treffer.y)) treffer = p
    }
    for (const p of stand.platten) {
      if (p.art !== 'herd' || p.heiss) continue
      if (treffer && p.y < treffer.y) continue
      if (vorher >= p.y && s.y <= p.y && ueberlappt(p, s.x)) {
        p.heiss = true
        ereignisse.push({ art: 'heiss', platte: p })
      }
    }
    if (treffer) ereignisse.push(landen(stand, treffer))
  }

  /* Kraefte einsammeln. Sie liegen frei in der Luft, man nimmt sie im
     Vorbeifliegen mit — auch waehrend des Turbos. */
  for (const gb of stand.gaben) {
    if (gb.weg) continue
    if (Math.abs(ringAbstand(gb.x, s.x)) > GABE_R + FIGUR_B / 2) continue
    if (Math.abs(gb.y - (s.y + FIGUR_H / 2)) > GABE_R + FIGUR_H / 2) continue
    gb.weg = true
    gb.wegBis = stand.zeit + 0.5
    if (gb.art === 'muetze') stand.muetzeBis = stand.zeit + MUETZE_DAUER
    else if (gb.art === 'schuerze') stand.schutz = true
    else stand.turboBis = stand.zeit + TURBO_DAUER
    ereignisse.push({ art: 'gabe', gabe: gb, gart: gb.art })
  }

  /* Treffer. Im Turbo raeumt die Figur alles beiseite, und nach einem
     Treffer ist sie kurz unverwundbar — sonst schlaegt dasselbe Teil
     zweimal. Ein Treffer toetet nie: er wirft nur nach unten. */
  if (!turbo && stand.unverwundbarBis <= stand.zeit) {
    for (const g of stand.gegner) {
      if (g.weg || !trifft(g, s)) continue
      g.weg = true
      g.wegBis = stand.zeit + 0.5
      stand.unverwundbarBis = stand.zeit + UNVERWUNDBAR
      if (stand.schutz) {
        stand.schutz = false
        ereignisse.push({ art: 'schutz', gegner: g })
      } else {
        stand.combo = 0
        stand.treffer += 1
        s.vy = Math.min(s.vy, TREFFER_V)
        ereignisse.push({ art: 'treffer', gegner: g })
      }
      break
    }
  }

  if (stand.erzeugen) {
    if (s.y > stand.kamera + KAMERA_HALT) stand.kamera = s.y - KAMERA_HALT
    nachfuellen(stand)
    if (s.y < stand.kamera - TOT_UNTER) {
      stand.vorbei = true
      ereignisse.push({ art: 'absturz' })
    }
  }
  return ereignisse
}

/** Landung: abspringen, zerbrechen, werten. */
function landen(stand, p) {
  const s = stand.spieler
  s.y = p.y
  s.vy = p.art === 'gold' ? ABSPRUNG * GOLD_FAKTOR : ABSPRUNG
  const ereignis = { art: 'landung', platte: p, neu: false, punkte: 0, gold: false, meilenstein: 0, hoehe: stand.hoehe }
  if (p.art === 'glas') {
    p.weg = true
    p.fallV = 0
    ereignis.zerbrochen = true
  } else if (p.art === 'broeckel') {
    p.risse += 1
    ereignis.riss = true
    if (p.risse >= BROECKEL_HAELT) {
      p.weg = true
      p.fallV = 0
      ereignis.zerbrochen = true
    }
  }
  if (p.beruehrt) return ereignis
  werten(stand, p, ereignis, true)
  return ereignis
}

/**
 * Eine neue Platte werten. Wird von der Landung und vom Turbo-Durchflug
 * benutzt, damit beide Wege dieselbe Punktobergrenze haben.
 * `knappPruefen` ist im Turbo aus: dort steuert niemand, also gibt es dort
 * auch keine Kombo zu verdienen.
 */
function werten(stand, p, ereignis, knappPruefen) {
  const s = stand.spieler
  p.beruehrt = true
  ereignis.neu = true
  stand.runden += 1

  /* KNAPP: mit der aeussersten Fussspitze aufgekommen. Der Boden zaehlt
     nicht — auf ihm kann man gar nicht danebentreten. */
  if (knappPruefen) {
    const rand = Math.abs(ringAbstand(p.x, s.x))
    if (p.art !== 'boden' && rand >= (p.b / 2 + FUSS) * KNAPP_ANTEIL) {
      stand.combo += 1
      stand.knapp += 1
      if (stand.combo > stand.comboBest) stand.comboBest = stand.combo
      ereignis.knapp = true
      if (COMBO_AB.includes(stand.combo)) ereignis.comboStufe = stand.combo
    } else {
      stand.combo = 0
    }
  }
  ereignis.combo = stand.combo

  const muetze = stand.muetzeBis > stand.zeit
  const mult = Math.min(MULT_MAX, comboFaktor(stand.combo) * (muetze ? MUETZE_MULT : 1))
  ereignis.mult = mult
  ereignis.muetze = muetze

  const hoehe = hoeheVon(p.y)
  /* Was der Multiplikator hebt, und was nicht: der Meilenstein ist eine
     feste Wegmarke und bleibt fest — sonst waere keine Obergrenze mehr
     zu rechnen. */
  let punkte = 0
  let fest = 0
  if (hoehe > stand.hoehe) {
    punkte += (hoehe - stand.hoehe) * PUNKTE_JE_HOEHE
    const stufen = Math.floor(hoehe / MEILENSTEIN) - Math.floor(stand.hoehe / MEILENSTEIN)
    if (stufen > 0) {
      fest += stufen * MEILENSTEIN_BONUS
      ereignis.meilenstein = Math.floor(hoehe / MEILENSTEIN) * MEILENSTEIN
    }
    stand.hoehe = hoehe
  }
  if (p.art === 'gold') {
    punkte += GOLD_BONUS
    ereignis.gold = true
  }
  const gesamt = Math.round(punkte * mult) + fest
  stand.punkte += gesamt
  ereignis.punkte = gesamt
  ereignis.hoehe = stand.hoehe
}

/**
 * Die hoechste denkbare Punktzahl einer einzigen Landung — fuer Tests und
 * fuer die Plausibilitaetsgrenze des Servers. Hoehenpunkte und Goldbonus
 * gehen mal dem groesstmoeglichen Multiplikator, der feste Meilenstein
 * kommt unveraendert obendrauf.
 */
export const MAX_JE_LANDUNG =
  ((Math.ceil(SPRUNG_HOEHE * GOLD_FAKTOR * GOLD_FAKTOR * HOEHE_JE_EINHEIT) + 1) * PUNKTE_JE_HOEHE + GOLD_BONUS) *
    MULT_MAX +
  MEILENSTEIN_BONUS
