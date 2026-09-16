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
 * WAS EIN LAUF BEENDET
 * --------------------
 * Zwei Dinge: unter den Bildrand fallen — oder ein fliegendes Baustellenteil
 * treffen. Letzteres war frueher nur ein Stoss nach unten; ein Hindernis,
 * das nichts kostet, liest aber niemand als Hindernis. Die Schutzschuerze
 * faengt genau einen Treffer ab und zerspringt dabei.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Eine Runde ist die erste Landung auf einer Platte. Punkte gibt es nur
 * dort: 10 je gewonnener HOEHE, dazu Gold- oder Boostplatte und Meilenstein.
 * Eine Landung bringt nie mehr als MAX_JE_LANDUNG.
 */

/* Physik — alles in Weltbreiten und Sekunden. */
export const TAKT = 1 / 120
export const SCHWERE = 3.4
export const SPRUNG_HOEHE = 0.42
export const ABSPRUNG = Math.sqrt(2 * SCHWERE * SPRUNG_HOEHE)
/* Goldplatte: 1,45-fache Absprunggeschwindigkeit, also gut doppelte Hoehe. */
export const GOLD_FAKTOR = 1.45
/* Boostplatte (die rot gluehende): 1,75-fach, also die zweieinhalbfache
   Hoehe eines normalen Sprungs. Sie traegt hoeher als Gold — genau darum
   gluehen die Pfeile darauf nach oben. Frueher fiel man hier durch. */
export const HERD_FAKTOR = 1.75
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
/* Die Boostplatte zahlt zusaetzlich zur Hoehe, die sie verschenkt. */
export const HERD_BONUS = 120
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
/**
 * Ein Treffer wirft die Figur nach unten UND beendet den Lauf. Frueher war
 * er nur ein Stoss — das hat niemand als Gefahr gelesen, und ein Hindernis,
 * das nichts kostet, ist kein Hindernis. Wer eine Schutzschuerze traegt,
 * ueberlebt genau einen Treffer; die Schuerze zerspringt dabei.
 */
export const TREFFER_V = -0.55

export const GABE_ARTEN = ['muetze', 'schuerze', 'turbo', 'magnet', 'superkoch']
export const GABE_R = 0.05
export const GABE_AB_HOEHE = 40
/* So viele Weltbreiten liegen mindestens zwischen zwei Kraeften. */
export const GABE_ABSTAND = 2.2

/** Magnet: zieht Kraefte in der Naehe an, statt sie treffen zu muessen. */
export const MAGNET_DAUER = 7
export const MAGNET_R = 0.24
export const MAGNET_V = 1.3

/**
 * VIDEKO SUPERKOCH — die seltenste Kraft. Fuenf Sekunden unverwundbar,
 * Gegner werden beiseitegeraeumt, und alles zaehlt dreifach. Der Deckel
 * MULT_MAX gilt weiter, sonst waere keine Obergrenze mehr zu rechnen.
 */
export const SUPERKOCH_DAUER = 5
export const SUPERKOCH_MULT = 3
/** Anteil aller Kraefte, der Superkoch ist. Bewusst klein. */
export const SUPERKOCH_ANTEIL = 0.05

/**
 * Was durch die Baustelle fliegt. VIDEKO baut nicht nur Kuechen, also fliegt
 * hier auch nicht nur Kuecheninventar: Bad, Boden, Licht, Elektro, PV,
 * Spanndecke, Immobilie. `muster` sagt, wie sich ein Teil bewegt — jede Art
 * soll sich anders anfuehlen, sonst ist es nur eine andere Zeichnung:
 *   zieht    waagerecht durch den Ring, gleichmaessig
 *   schwer   dasselbe, aber deutlich langsamer und breiter
 *   pendelt  schwingt um eine Mitte und wird an den Enden langsam
 *   klappt   haengt still und schlaegt in Schueben auf (Tuer, Klappe)
 */
export const GEGNER_ARTEN = [
  'backofen',
  'kuehlschrank',
  'pfanne',
  'karton',
  'werkzeugkiste',
  'farbrolle',
  'kabeltrommel',
  'pvmodul',
  'bodenpaket',
  'waschbecken',
  'leuchte',
  'maklerschild',
  'deckenring',
  'schranktuer',
]
export const GEGNER_BREITE = {
  backofen: 0.16,
  kuehlschrank: 0.15,
  pfanne: 0.12,
  karton: 0.12,
  werkzeugkiste: 0.13,
  farbrolle: 0.1,
  kabeltrommel: 0.12,
  pvmodul: 0.17,
  bodenpaket: 0.15,
  waschbecken: 0.14,
  leuchte: 0.11,
  maklerschild: 0.13,
  deckenring: 0.16,
  schranktuer: 0.14,
}
export const GEGNER_MUSTER = {
  backofen: 'klappt',
  kuehlschrank: 'schwer',
  pfanne: 'zieht',
  karton: 'zieht',
  werkzeugkiste: 'schwer',
  farbrolle: 'zieht',
  kabeltrommel: 'zieht',
  pvmodul: 'pendelt',
  bodenpaket: 'schwer',
  waschbecken: 'pendelt',
  leuchte: 'pendelt',
  maklerschild: 'pendelt',
  deckenring: 'zieht',
  schranktuer: 'klappt',
}
/** Wie schnell sich ein Teil dabei dreht. Die Pfanne trudelt am wildesten. */
export const GEGNER_DREH = { pfanne: 3, farbrolle: 2.4, kabeltrommel: 2, deckenring: 1.8, karton: 1.3 }
/** Das langsame Tempo der schweren Teile, als Anteil des normalen. */
export const GEGNER_SCHWER = 0.55
/**
 * Seit Gegner toeten, duerfen sie erst spaeter kommen, seltener stehen und
 * nie so dicht an einer Platte haengen, dass man beim Landen hineinfaellt.
 */
export const GEGNER_AB_HOEHE = 80
export const GEGNER_H = 0.075
export const GEGNER_ABSTAND = 1.5
/** So gross muss die Luecke zwischen zwei Kettengliedern sein, damit dort
    ueberhaupt ein Gegner haengen darf — sonst bleibt keine Reaktionszeit. */
export const GEGNER_FREI = 0.18

/* ------------------------------------------------------------------ */
/* Seltene Ereignisse — die Baustelle eskaliert kurz                    */
/* ------------------------------------------------------------------ */

/**
 * Vier Wellen, die den Generator fuer ein paar Kettenglieder umstellen.
 * Sie sind selten, kurz und angekuendigt: der Reiz liegt darin, dass man
 * sie erkennt, nicht darin, dass sie ueberraschen.
 *   stampede    eine Reihe schwerer Teile, alle in dieselbe Richtung
 *   ofenalarm   mehrere Boostplatten hintereinander
 *   goldrausch  die Kette wird zu Gold
 *   kuechenchef ein geschenkter Doppel-Multiplikator beim Eintritt
 */
export const WELLEN = ['stampede', 'ofenalarm', 'goldrausch', 'kuechenchef']
export const WELLE_AB_HOEHE = 120
export const WELLE_CHANCE = 0.055
/** So viele Weltbreiten liegen mindestens zwischen zwei Wellen. */
export const WELLE_ABSTAND = 7
/** So viele Kettenglieder traegt eine Welle. */
export const WELLE_GLIEDER = 5
/** Wie lange der geschenkte Multiplikator des KUECHENCHEF-MODUS haelt. */
export const CHEF_DAUER = 8

/* Neigung: ab NEIGUNG_EIN Grad lenkt es, unter NEIGUNG_AUS nicht mehr.
   Die beiden Schwellen gehoeren zur alten Schaltlogik (neigungRichtung).
   Sie bleiben erhalten, weil sie weiter als Totzone taugen. */
export const NEIGUNG_EIN = 7
export const NEIGUNG_AUS = 3.5
export const NEIGUNG_WARTEN_MS = 1500

/**
 * Neigung als Achse statt als Schalter. Vorher gab der Sensor nur links,
 * rechts oder nichts — daher das Gefuehl, das Handy zu kippen und die Figur
 * schiesse los. Jetzt: Totzone bis NEIGUNG_TOT, danach linear bis
 * NEIGUNG_VOLL, gedeckelt bei NEIGUNG_MAX (Neigung bleibt also immer eine
 * Spur langsamer als der Daumen). NEIGUNG_GLAETTE ist der Tiefpass gegen
 * das Zittern in der Hand.
 */
export const NEIGUNG_TOT = 2.5
export const NEIGUNG_VOLL = 16
export const NEIGUNG_MAX = 0.92
export const NEIGUNG_GLAETTE = 0.22

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
 * Die Daumensteuerung. Das ganze Feld ist ein waagerechter Regler: wo der
 * Finger liegt, dahin zieht es, und zwar so stark, wie er von der Mitte weg
 * liegt. Am Rand voller Ausschlag, in der Mitte Ruhe, dazwischen linear.
 *
 * Das ist absichtlich kein Wischen, sondern eine Position: Wischen braucht
 * einen Startpunkt, und wer beim Fallen umgreift, hat ihn verloren. Eine
 * Position kann man dagegen blind halten — links tippen heisst links, und
 * den Daumen langsam zur Mitte ziehen heisst langsamer. Kein Nachlauf,
 * keine Traegheit, nichts, das erst einrasten muesste.
 */
export const ZEIGER_TOT = 0.05
export const ZEIGER_VOLL = 0.3

export function zeigerAchse(clientX, links, breite) {
  if (!(breite > 0) || !Number.isFinite(clientX)) return 0
  const rel = klemmen((clientX - (links + breite / 2)) / breite, -0.5, 0.5)
  const weg = Math.abs(rel)
  if (weg <= ZEIGER_TOT) return 0
  const a = Math.min(1, (weg - ZEIGER_TOT) / (ZEIGER_VOLL - ZEIGER_TOT))
  return rel < 0 ? -a : a
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
 * Neigung als weiche Achse. `null0` ist der beim Einschalten gemessene
 * Neutralpunkt: kaum jemand haelt das Handy flach, und ohne Kalibrierung
 * driftet die Figur, sobald man nur sitzt. Wer still haelt, bleibt in der
 * Totzone und steht still — genau das war vorher das Problem.
 */
export function neigungAchse(grad, null0 = 0, tot = NEIGUNG_TOT, voll = NEIGUNG_VOLL) {
  if (!Number.isFinite(grad)) return 0
  const g = grad - (Number.isFinite(null0) ? null0 : 0)
  const weg = Math.abs(g)
  if (weg <= tot) return 0
  const a = Math.min(1, (weg - tot) / Math.max(0.001, voll - tot)) * NEIGUNG_MAX
  return g < 0 ? -a : a
}

/** Tiefpass: der neue Messwert zieht nur anteilig nach. Gegen Handzittern. */
export function tiefpass(alt, neu, anteil = NEIGUNG_GLAETTE) {
  if (!Number.isFinite(neu)) return Number.isFinite(alt) ? alt : 0
  if (!Number.isFinite(alt)) return neu
  return alt + (neu - alt) * klemmen(anteil, 0, 1)
}

/**
 * Die wirksame Richtung, jetzt als Achse zwischen -1 und 1 statt als
 * Schalter. Finger in Reihenfolge des Aufsetzens: der zuletzt aufgesetzte,
 * noch liegende Finger gewinnt (0 = dieser Finger lenkt nicht, etwa weil er
 * die Pause beendet hat). Danach Tasten — die kennen nur ganz oder gar
 * nicht —, zuletzt Neigung. Touch hat also immer Vorrang vor der Neigung.
 */
export function eingabeAus({ finger = [], links = false, rechts = false, neigung = 0, neigungAktiv = false } = {}) {
  let letzter = null
  for (const f of finger) letzter = f
  if (letzter !== null) return { richtung: Number.isFinite(letzter) ? klemmen(letzter, -1, 1) : 0, quelle: 'touch' }
  if (links || rechts) return { richtung: (rechts ? 1 : 0) - (links ? 1 : 0), quelle: 'touch' }
  if (neigungAktiv) return { richtung: Number.isFinite(neigung) ? klemmen(neigung, -1, 1) : 0, quelle: 'neigung' }
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
    /* Fliegende Baustellenteile: langsam mehr, aber nie so viele, dass der
       Weg zu ist. Das Tempo waechst mit, die Dichte nur wenig. Seit ein
       Treffer toetet, ist die Dichte bewusst niedriger als vorher. */
    gegner: hoehe < GEGNER_AB_HOEHE ? 0 : 0.08 + 0.12 * s,
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

  const welle = welleVielleicht(stand, basis, hoehe)

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
  if (welle === 'goldrausch') {
    /* Im GOLDRAUSCH ist die Kette selbst aus Gold. Der Mindestabstand
       zwischen zwei Goldplatten faellt hier bewusst weg — das ist der
       ganze Witz der Welle. */
    neu.art = 'gold'
    stand.letztesGold = y
  } else if (r.gold && ab.art !== 'dicht' && z() < r.gold && y - stand.letztesGold >= GOLD_ABSTAND) {
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
  if (welle === 'ofenalarm' || (r.herd && z() < r.herd * (ab.art === 'zickzack' ? 1.4 : 1))) zusatz('herd')

  gabeVielleicht(stand, basis, dy, hoehe, r)
  gegnerVielleicht(stand, basis, dy, hoehe, r, welle === 'stampede')
}

/**
 * Faengt hier eine Welle an? Nur weit oben, nur selten, nie zwei dicht
 * hintereinander — und immer mit Anfang und Ende in Welthoehen, damit die
 * Komponente sie genau dann ansagen kann, wenn die Figur hineinlaeuft und
 * nicht schon, wenn der Generator sie drei Bildschirme weiter oben baut.
 */
function welleVielleicht(stand, basis, hoehe) {
  if (stand.welleRest > 0) {
    stand.welleRest -= 1
    return stand.welleArt
  }
  stand.welleArt = null
  if (hoehe < WELLE_AB_HOEHE) return null
  const z = stand.zufall
  if (z() >= WELLE_CHANCE) return null
  if (basis - stand.letzteWelle < WELLE_ABSTAND) return null
  const art = WELLEN[Math.floor(z() * WELLEN.length) % WELLEN.length]
  if (art === 'stampede') stand.stampedeSeite = z() < 0.5 ? -1 : 1
  stand.welleArt = art
  stand.welleRest = WELLE_GLIEDER - 1
  stand.letzteWelle = basis
  stand.wellen.push({ art, vonY: basis, gemeldet: false })
  return art
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
  /* Die Schuerze ist die haeufigste Kraft, seit ein Treffer toetet: sie ist
     die einzige zweite Chance, die es im Spiel gibt. Der Superkoch ist die
     seltenste — er soll ein Ereignis sein, keine Ausstattung. */
  const w = z()
  let art = 'turbo'
  if (w < SUPERKOCH_ANTEIL) art = 'superkoch'
  else if (w < 0.42) art = 'schuerze'
  else if (w < 0.68) art = 'muetze'
  else if (w < 0.86) art = 'magnet'
  stand.naechsteId += 1
  stand.gaben.push({ id: stand.naechsteId, art, x: klemmen(z(), GABE_R, 1 - GABE_R), y, weg: false })
  stand.letzteGabe = y
}

/**
 * Ein fliegendes Baustellenteil zwischen zwei Gliedern. Seit ein Treffer
 * toetet, haengt es nie direkt ueber oder unter einer Platte: es sitzt
 * genau in der Mitte der Luecke, in einer Luecke, die gross genug ist. So
 * bleibt immer Zeit, seitlich vorbeizulaufen — und weil die Kueche ein Ring
 * ist, gibt es diesen Weg auch immer.
 *
 * In der STAMPEDE (`erzwingen`) ist es keine Auswahl mehr: dann kommt eine
 * Reihe schwerer Teile, und die kommen alle aus derselben Richtung.
 */
function gegnerVielleicht(stand, basis, dy, hoehe, r, erzwingen = false) {
  if (dy < GEGNER_FREI) return
  if (!erzwingen && !r.gegner) return
  const z = stand.zufall
  if (!erzwingen && z() >= r.gegner) return
  const y = basis + dy * (0.4 + 0.2 * z())
  if (!erzwingen && y - stand.letzterGegner < GEGNER_ABSTAND) return
  const art = erzwingen
    ? 'kuehlschrank'
    : GEGNER_ARTEN[Math.floor(z() * GEGNER_ARTEN.length) % GEGNER_ARTEN.length]
  const muster = GEGNER_MUSTER[art] || 'zieht'
  const tempo = r.gegnerTempo * (0.7 + 0.6 * z()) * (muster === 'schwer' ? GEGNER_SCHWER : 1)
  /* Die Stampede zieht als Rudel: eine Richtung fuer die ganze Welle. */
  const seite = erzwingen ? stand.stampedeSeite : z() < 0.5 ? -1 : 1
  stand.naechsteId += 1
  const g = {
    id: stand.naechsteId,
    art,
    muster,
    x: z(),
    y,
    b: GEGNER_BREITE[art] || 0.13,
    v: tempo * seite,
    dreh: 0,
    weg: false,
    /* Nur fuer pendelt und klappt: Bahn, Phase und Klappenstellung. */
    mitte: 0,
    weite: 0,
    phase: 0,
    zyklus: 0,
    offen: 0,
    auf: 0,
  }
  if (muster === 'pendelt') {
    g.mitte = g.x
    g.weite = 0.1 + z() * 0.16
    g.phase = z() * Math.PI * 2
  } else if (muster === 'klappt') {
    g.zyklus = 1.6 + z() * 1.2
    g.offen = 0.5 + z() * 0.3
    g.phase = z() * g.zyklus
  }
  stand.gegner.push(g)
  stand.letzterGegner = y
}

/**
 * Wie breit ein Teil gerade wirklich ist. Nur Klappen aendern das: eine
 * geschlossene Ofentuer ist ein schmaler Streifen, eine aufgeschlagene
 * nimmt die volle Breite. Man sieht also, wann sie gefaehrlich ist.
 */
export function breiteJetzt(g) {
  if (g.muster !== 'klappt') return g.b
  return g.b * (0.34 + 0.66 * klemmen(g.auf || 0, 0, 1))
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
  /* Angesagte Wellen sind erledigt und muessen nicht liegen bleiben. */
  if (stand.wellen.length > 6) stand.wellen = stand.wellen.filter((w) => !w.gemeldet)
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
    /* Seltene Wellen: `welleArt`/`welleRest` steuern den Generator,
       `wellen` merkt sich, wo eine anfaengt, damit die Komponente sie erst
       ansagt, wenn die Figur dort ankommt. */
    wellen: [],
    welleArt: null,
    welleRest: 0,
    letzteWelle: -20,
    stampedeSeite: 1,
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
    magnetBis: 0,
    superBis: 0,
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

/**
 * Trifft ein fliegendes Baustellenteil die Figur? Auf dem Ring gemessen.
 * Gerechnet wird mit der Breite, die das Teil gerade hat: eine geschlossene
 * Ofentuer ist schmal und harmlos, eine aufgeschlagene nicht.
 */
export function trifft(g, s) {
  if (Math.abs(ringAbstand(g.x, s.x)) > breiteJetzt(g) / 2 + FIGUR_B / 2) return false
  const oben = s.y + FIGUR_H
  return !(oben < g.y - GEGNER_H / 2 || s.y > g.y + GEGNER_H / 2)
}

/**
 * Ein fester Schritt. `richtung` ist eine Achse zwischen -1 und 1. Gibt die
 * Ereignisse dieses Schritts zurueck: landung (mit `boost`, wenn es die rote
 * Platte war), durchflug, gabe, schutz, wegfegen, welle, treffer, absturz.
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

  /* Die fliegenden Baustellenteile. Jedes Muster bewegt sich anders, damit
     man an der Bewegung erkennt, womit man es zu tun hat, bevor man die
     Zeichnung entziffert hat. Getroffenes bleibt kurz zum Ansehen liegen
     und wird dann weggeraeumt. */
  let aufraeumen = false
  for (const g of stand.gegner) {
    if (g.weg) {
      if (stand.zeit > g.wegBis) aufraeumen = true
      continue
    }
    if (g.muster === 'pendelt') {
      /* Schwingt um seine Mitte und wird an den Umkehrpunkten langsam —
         dort steht es kurz still und laesst sich passieren. */
      g.phase += Math.abs(g.v) * dt * 2
      g.x = umbrechen(g.mitte + Math.sin(g.phase) * g.weite)
      g.dreh = Math.cos(g.phase) * 0.35
    } else if (g.muster === 'klappt') {
      /* Haengt still und schlaegt in Schueben auf. `auf` geht von 0 (zu,
         schmal, harmlos) auf 1 (weit offen, volle Breite) und zurueck. */
      g.phase = (g.phase + dt) % g.zyklus
      const anteil = g.phase / g.zyklus
      g.auf = anteil < g.offen ? Math.sin((anteil / g.offen) * Math.PI) : 0
    } else {
      g.x = umbrechen(g.x + g.v * dt)
      g.dreh += g.v * dt * 6 * (GEGNER_DREH[g.art] || 1)
    }
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
      .filter((p) => p.kette && !p.weg && !p.beruehrt && p.y > vorher && p.y <= s.y)
      .sort((a, b) => a.y - b.y)
    for (const p of durch) {
      const e = { art: 'durchflug', platte: p, neu: false, punkte: 0, gold: false, meilenstein: 0, hoehe: stand.hoehe }
      werten(stand, p, e, false)
      ereignisse.push(e)
    }
  } else if (s.vy <= 0) {
    let treffer = null
    for (const p of stand.platten) {
      if (p.weg) continue
      /* yAlt: ein Lift darf nicht durch die Fuesse hindurchfahren. */
      if (vorher >= Math.min(p.yAlt, p.y) && s.y <= p.y && ueberlappt(p, s.x) && (!treffer || p.y > treffer.y)) treffer = p
    }
    if (treffer) ereignisse.push(landen(stand, treffer))
  }

  /* Magnet: was in Reichweite haengt, kommt von selbst. Er nimmt keinen
     Umweg ab, den es nicht gibt — er spart das millimetergenaue Zielen
     waehrend eines Sprungs, und genau das nervt am Sammeln. */
  if (stand.magnetBis > stand.zeit) {
    for (const gb of stand.gaben) {
      if (gb.weg) continue
      const dx = ringAbstand(gb.x, s.x)
      const dy = s.y + FIGUR_H / 2 - gb.y
      const d = Math.hypot(dx, dy)
      if (d > MAGNET_R || d < 1e-6) continue
      const zug = Math.min(d, MAGNET_V * dt)
      gb.x = umbrechen(gb.x + (dx / d) * zug)
      gb.y += (dy / d) * zug
    }
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
    else if (gb.art === 'magnet') stand.magnetBis = stand.zeit + MAGNET_DAUER
    else if (gb.art === 'superkoch') stand.superBis = stand.zeit + SUPERKOCH_DAUER
    else stand.turboBis = stand.zeit + TURBO_DAUER
    ereignisse.push({ art: 'gabe', gabe: gb, gart: gb.art })
  }

  /* Treffer. Im Turbo und als Superkoch raeumt die Figur alles beiseite.
     Sonst kostet ein Treffer den Lauf — es sei denn, die Schutzschuerze
     faengt ihn ab; die haelt genau einen. Nach einem abgefangenen Treffer
     ist die Figur kurz unverwundbar, sonst schlaegt dasselbe Teil zweimal. */
  const unverwundbar = turbo || stand.superBis > stand.zeit
  if (unverwundbar) {
    for (const g of stand.gegner) {
      if (g.weg || !trifft(g, s)) continue
      g.weg = true
      g.wegBis = stand.zeit + 0.5
      ereignisse.push({ art: 'wegfegen', gegner: g })
    }
  } else if (stand.unverwundbarBis <= stand.zeit) {
    for (const g of stand.gegner) {
      if (g.weg || !trifft(g, s)) continue
      g.weg = true
      g.wegBis = stand.zeit + 0.5
      stand.unverwundbarBis = stand.zeit + UNVERWUNDBAR
      stand.treffer += 1
      if (stand.schutz) {
        stand.schutz = false
        ereignisse.push({ art: 'schutz', gegner: g })
      } else {
        stand.combo = 0
        s.vy = Math.min(s.vy, TREFFER_V)
        stand.vorbei = true
        ereignisse.push({ art: 'treffer', gegner: g, toedlich: true })
        ereignisse.push({ art: 'absturz', durchGegner: true })
      }
      break
    }
  }

  /* Wellen ansagen, sobald die Figur hineinlaeuft — nicht schon, wenn der
     Generator sie drei Bildschirme weiter oben gebaut hat. */
  for (const w of stand.wellen) {
    if (w.gemeldet || s.y < w.vonY) continue
    w.gemeldet = true
    if (w.art === 'kuechenchef') stand.muetzeBis = Math.max(stand.muetzeBis, stand.zeit + CHEF_DAUER)
    ereignisse.push({ art: 'welle', welle: w.art })
  }

  if (stand.erzeugen && !stand.vorbei) {
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
  /* Die rote Platte ist eine Boostplatte. Frueher fiel man hier durch und
     bekam nur ein "HEISS!" zu sehen — niemand konnte daraus lesen, wozu sie
     gut ist. Jetzt schleudert sie hoeher als Gold, jedes Mal. */
  const boost = p.art === 'herd'
  s.vy = boost ? ABSPRUNG * HERD_FAKTOR : p.art === 'gold' ? ABSPRUNG * GOLD_FAKTOR : ABSPRUNG
  if (boost) p.heiss = true
  const ereignis = {
    art: 'landung',
    platte: p,
    neu: false,
    punkte: 0,
    gold: false,
    boost,
    meilenstein: 0,
    hoehe: stand.hoehe,
  }
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
  const superkoch = stand.superBis > stand.zeit
  const mult = Math.min(
    MULT_MAX,
    comboFaktor(stand.combo) * (muetze ? MUETZE_MULT : 1) * (superkoch ? SUPERKOCH_MULT : 1),
  )
  ereignis.mult = mult
  ereignis.muetze = muetze
  ereignis.superkoch = superkoch

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
  } else if (p.art === 'herd') {
    punkte += HERD_BONUS
    ereignis.boost = true
  }
  const gesamt = Math.round(punkte * mult) + fest
  stand.punkte += gesamt
  ereignis.punkte = gesamt
  ereignis.hoehe = stand.hoehe
}

/**
 * Die hoechste denkbare Punktzahl einer einzigen Landung — fuer Tests und
 * fuer die Plausibilitaetsgrenze des Servers. Hoehenpunkte und Plattenbonus
 * gehen mal dem groesstmoeglichen Multiplikator, der feste Meilenstein
 * kommt unveraendert obendrauf.
 *
 * Der weiteste Sprung kommt jetzt von der Boostplatte, nicht mehr von Gold;
 * und weil eine Platte immer genau eine Art hat, kann auch nur einer der
 * beiden Boni anfallen — darum `Math.max` und nicht die Summe.
 */
export const MAX_JE_LANDUNG =
  ((Math.ceil(SPRUNG_HOEHE * Math.max(GOLD_FAKTOR, HERD_FAKTOR) ** 2 * HOEHE_JE_EINHEIT) + 1) * PUNKTE_JE_HOEHE +
    Math.max(GOLD_BONUS, HERD_BONUS)) *
    MULT_MAX +
  MEILENSTEIN_BONUS
