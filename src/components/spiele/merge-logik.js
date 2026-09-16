/**
 * KUECHEN-MERGE — die reine Spiellogik.
 *
 * Kein React, kein DOM, keine echte Uhr: nur Koerper, Stoesse und Wertung.
 * Die Komponente fuehrt Zeit, Finger und Bild. Hier wird entschieden, was
 * sich beruehrt, was verschmilzt und wann die Kueche ueberlaeuft. So laesst
 * sich alles in Node pruefen und mit Bots ueber viele Laeufe simulieren —
 * die Servergrenzen kommen aus genau dieser Datei.
 *
 * DIE WELT
 * --------
 * Ein Behaelter 100 × 140 Einheiten, y waechst nach unten, 0 ist die
 * Oberkante. Die Komponente skaliert das nur auf Pixel. Alle Koerper sind
 * Kreise: Kreise stapeln sich ohne Kanten stabil, und bei runden Emblemen
 * sieht man den Unterschied zur echten Form nicht.
 *
 * WARUM POSITIONSBASIERT
 * ----------------------
 * Jeder feste Schritt (120 Hz) sagt erst die Lage voraus, schiebt dann
 * ueberlappende Kreise in mehreren Durchgaengen auseinander und leitet die
 * Geschwindigkeit aus der tatsaechlichen Bewegung ab. Das federt nicht
 * nach (Restitution praktisch null) und kann nicht explodieren.
 *
 * RUHE STATT ZITTERN
 * ------------------
 * Hohe Stapel druecken die unteren Teile in jedem Schritt ein Stueck
 * ineinander; der Loeser schiebt sie zurueck, und das wuerde als feines
 * Zittern sichtbar. Dagegen hilft dreierlei: mehr Durchgaenge, die Paare
 * von unten nach oben (die Last wandert in einem Durchgang durch den
 * Stapel), und eine Ruhedaempfung — ein gestuetztes Teil unterhalb von
 * RUHE_TEMPO verliert den Rest seines Tempos schnell.
 *
 * ROLLEN
 * ------
 * Kreise rollen, statt zu rutschen: jedes Teil fuehrt einen Winkel, der sich
 * aus dem Weg entlang der Stuetze ergibt (Weg / Radius). Die Komponente dreht
 * das Emblem damit. Die Rollreibung bremst den Weg auf Boden und Stapel, so
 * dass ein Teil vom Gipfel eines anderen herunterrollt und dann liegen bleibt.
 *
 * WARUM DER NEUE KOERPER WAECHST
 * ------------------------------
 * Verschmelzen zwei Teile, sitzt das groessere sofort in Nachbarn. Wuerde
 * es in voller Groesse erscheinen, schoebe der Loeser die Nachbarn in einem
 * Schritt weg und machte daraus Tempo. Deshalb waechst der Radius ueber
 * WACHS_S vom alten auf den neuen Wert — die Nachbarn weichen sanft aus.
 *
 * KOMBO
 * -----
 * Jede Verschmelzung binnen KOMBO_S nach der vorigen erhoeht die Kombo, egal
 * ob sie aus einer Kettenreaktion oder aus dem naechsten, schnell gezielten
 * Abwurf kommt. Das Fenster ist sichtbar und laeuft ab — "den naechsten
 * Merge schaffe ich noch". Damit schnelles Draufloswerfen nicht explodiert,
 * ist der Faktor klein (+25 % je Stufe, hoechstens ×2) und die Punkte je
 * Abwurf haben eine Decke (ABWURF_MAX).
 *
 * CHAIN — die Kettenreaktion in sich
 * ----------------------------------
 * Die Kombo zaehlt ueber Abwuerfe hinweg (Fenster KOMBO_S). Die Chain ist
 * enger: nur Verschmelzungen, die binnen CHAIN_S aufeinander folgen, also
 * echte Kettenreaktionen aus einem einzigen Abwurf. Drei Stufen tiefer
 * durchgerutscht ist etwas anderes als dreimal gut gezielt, und nur die
 * Chain darf richtig eskalieren.
 *
 * SPEZIALTEILE
 * ------------
 * Ein guter Merge macht das ENTSTEHENDE Teil zum Spezialteil — es kommt kein
 * zusaetzlicher Koerper dazu, der Stapel bleibt also berechenbar. Das
 * Spezialteil zuendet erst, wenn es selbst wieder verschmilzt:
 *   bombe  — raeumt alles im Umkreis ab
 *   blitz  — raeumt eine ganze waagerechte Zeile ab
 *   ofen   — raeumt ein Rechteck ab (breiter als hoch)
 *   gold   — Punkte-Multiplikator fuer GOLD_S Sekunden
 *   frost  — bremst den Fall fuer FROST_S Sekunden
 * Zuendet eine Bombe ins Leere, gibt es nichts: Abraeumen wird bezahlt,
 * nicht der Knall.
 *
 * FIEBER
 * ------
 * Ein Abwurf, der mindestens eine Verschmelzung bringt, ist eine gelandete
 * Kombo. FIEBER_COMBOS davon hintereinander ohne Fehlwurf zuenden das
 * Fieber: FIEBER_S Sekunden mehr Punkte und mehr Spezialteile. Ein Fehlwurf
 * (ein Abwurf ohne jede Verschmelzung) setzt die Ladung zurueck. Das Fieber
 * endet allein ueber die Uhr und raeumt sich dabei selbst auf.
 */

export const BREITE = 100
export const HOEHE = 140

/* Oberhalb dieser Linie darf nichts dauerhaft liegen. Das groesste
   Startteil passt beim Zielen noch ganz darueber. */
export const LINIE_Y = 27
export const SPAWN_Y = 13.5

export const SCHRITT_S = 1 / 120
export const SCHWERKRAFT = 900
export const ITERATIONEN = 10
/* Wie viel Tempo je Schritt erhalten bleibt. Knapp unter 1: Luftwiderstand
   genug gegen Restbewegung, zu wenig, um den Fall traege wirken zu lassen. */
export const DAEMPFUNG = 0.997
export const REIBUNG = 0.1
export const REIBUNG_BODEN = 0.08
/* Unterhalb dieses Tempos (Einheiten/s) gilt ein gestuetztes Teil als ruhend
   und behaelt je Schritt nur RUHE_REST seines Tempos. */
export const RUHE_TEMPO = 6
export const RUHE_REST = 0.6
export const MAX_TEMPO = 520
/* Beruehren heisst: hoechstens so viel Luft zwischen den Raendern. */
export const MERGE_SPIEL = 0.35
export const WACHS_S = 0.14

/* Ueberlauf: ein Teil zaehlt erst nach GNADE_S (frisch Abgeworfenes und
   gerade Verschmolzenes faellt noch), dann muss es UEBER_S am Stueck ueber
   der Linie liegen. */
export const GNADE_S = 1
export const UEBER_S = 1.5
export const WARN_ABSTAND = 8
/* Ab diesem Fuellstand (0 … 1 ueber die Warnzone) gilt die Kueche als kritisch. */
export const KRITISCH_AB = 0.6

/* Mindestabstand zweier Abwuerfe in echter Zeit. Der Server verlangt je
   Abwurf eine Mindestdauer ab Ticketausgabe; die Komponente zaehlt ab dem
   spaeteren Zeitpunkt von letztem Abwurf und Ticketankunft. */
export const ABWURF_MS = 450

export const KOMBO_S = 1.6
export const KOMBO_MAX = 5
export const KOMBO_ANTEIL = 0.25
export const TRAUM_PUNKTE = 1400
/* Mehr bringt ein einzelner Abwurf samt aller Folgeverschmelzungen nie. */
export const ABWURF_MAX = 3000
/* Ab dieser Stufe (0-basiert) gilt eine Verschmelzung als gross. */
export const GROSS_AB = 6

/* ------------------------------------------------------------------ *
 * Chain, Fieber, Gold, Frost
 * ------------------------------------------------------------------ */

/* Fenster einer Kettenreaktion. Deutlich enger als KOMBO_S: was laenger
   braucht, ist ein neuer Abwurf und keine Kette mehr. */
export const CHAIN_S = 0.22
export const CHAIN_MAX = 6
export const CHAIN_ANTEIL = 0.3
/* Ab dieser Chain ist es keine Kette mehr, sondern ein Unfall. Nur fuer den Text. */
export const CHAIN_ESKALIERT = 4

export const FIEBER_COMBOS = 5
export const FIEBER_S = 8
export const FIEBER_MULT = 1.5
/* Im Fieber sind Spezialteile wahrscheinlicher. */
export const FIEBER_CHANCE = 1.7
export const SPEZIAL_CHANCE_MAX = 0.85

export const GOLD_S = 6
export const GOLD_MULT = 2
export const FROST_S = 2.6
export const FROST_ANTEIL = 0.34

/* Alle Faktoren zusammen sind gedeckelt, sonst entscheidet ein einziger
   Glueckslauf das Ranking (und der Server haelt es fuer Betrug). */
export const FAKTOR_MAX = 6

/* ------------------------------------------------------------------ *
 * Spezialteile
 * ------------------------------------------------------------------ */

export const SPEZIAL = {
  bombe: { wort: 'BOMBE', ruf: 'BOOM', grund: 70, form: 'kreis', r: 26 },
  blitz: { wort: 'ZEILENBLITZ', ruf: 'ZEILE WEG', grund: 90, form: 'zeile', h: 26 },
  ofen: { wort: 'GROSSOFEN', ruf: 'DURCHGEGART', grund: 130, form: 'feld', b: 46, h: 34 },
  gold: { wort: 'GOLDSTÜCK', ruf: `GOLD ×${GOLD_MULT}`, grund: 160, form: 'gold' },
  frost: { wort: 'FROSTER', ruf: 'EINGEFROREN', grund: 70, form: 'frost' },
}
export const SPEZIAL_NAMEN = Object.keys(SPEZIAL)
/* Anteil der Basispunkte, den ein abgeraeumtes Teil einbringt. */
export const SPEZIAL_ANTEIL = 0.45

/*
 * Wer wird was? Von selten nach haeufig geprueft, der erste Treffer gewinnt.
 * `abStufe` ist die Stufe des NEUEN Teils; `abKette`/`abChain` sind zwei
 * Wege zum selben Ziel — eine lange Kombo oder eine echte Kettenreaktion.
 */
export const SPEZIAL_REGELN = [
  { key: 'ofen', abStufe: 6, abKette: 5, abChain: 3, chance: 0.22 },
  { key: 'blitz', abStufe: 4, abKette: 4, abChain: 2, chance: 0.24 },
  { key: 'gold', abStufe: 3, abKette: 4, abChain: 3, chance: 0.18 },
  { key: 'frost', abStufe: 5, abKette: 1, abChain: 1, chance: 0.16 },
  { key: 'bombe', abStufe: 3, abKette: 2, abChain: 1, chance: 0.22 },
]

/* ------------------------------------------------------------------ *
 * Trockener Humor
 * ------------------------------------------------------------------ *
 *
 * Sparsam: nur zu einem echten Anlass und hoechstens alle SPRUCH_PAUSE
 * Sekunden. Ein Witz, den man jeden Zug hoert, ist eine Statusleiste.
 */
export const SPRUCH_PAUSE = 16

export const SPRUECHE = {
  chain: ['ORDNUNG WAR GESTERN.', "JETZT RÄUMT'S AUF.", 'KÜCHENCHAOS.', 'DAS WAR NICHT GEPLANT.'],
  spezial: ['DIE KÜCHE REGELT DAS.', 'GEHT DOCH.', 'EINBAU LÄUFT.'],
  fieber: ['ALLES BRENNT. GUT SO.', 'JETZT WIRD GEKOCHT.'],
  traum: ['FERTIG GEPLANT.', 'DAS NENNT MAN KÜCHE.'],
}

/* Zehn Stufen, klein nach gross. Die Radien wachsen erst schnell (die
   kleinen Teile sollen sich deutlich unterscheiden), dann langsamer (sonst
   passt die Kuecheninsel nicht mehr in den Behaelter). */
export const STUFEN = [
  { name: 'KAFFEETASSE', r: 4.6 },
  { name: 'TOASTER', r: 6.3 },
  { name: 'WASSERKOCHER', r: 8.1 },
  { name: 'MIKROWELLE', r: 10 },
  { name: 'KAFFEEMASCHINE', r: 12 },
  { name: 'BACKOFEN', r: 14.4 },
  { name: 'SPÜLMASCHINE', r: 16.9 },
  { name: 'KÜHLSCHRANK', r: 19.7 },
  { name: 'HOCHSCHRANK', r: 22.8 },
  { name: 'KÜCHENINSEL', r: 26.3 },
]
export const STUFEN_ANZAHL = STUFEN.length
export const OBERSTE = STUFEN_ANZAHL - 1

/* Abgeworfen werden nur die fuenf kleinsten Teile, meist die kleinen. */
export const SPAWN_GEWICHTE = [34, 27, 20, 12, 7]

/** Punkte fuer ein neues Teil der Stufe (0-basiert): Dreieckszahl × 10. */
export function basisPunkte(stufe) {
  const n = stufe + 1
  return ((n * (n + 1)) / 2) * 10
}

/** Faktor einer Kombo: jede weitere Verschmelzung im Fenster +25 %, gedeckelt. */
export function komboFaktor(kette) {
  return 1 + KOMBO_ANTEIL * (Math.min(Math.max(1, kette), KOMBO_MAX) - 1)
}

/** Die Kombo nach einer Verschmelzung zur Zeit `zeit` (Sekunden). */
export function komboWeiter(kette, letzterMerge, zeit) {
  if (!(kette > 0) || letzterMerge == null || zeit - letzterMerge > KOMBO_S) return 1
  return kette + 1
}

/** Faktor einer Kettenreaktion: je Glied +30 %, gedeckelt bei CHAIN_MAX. */
export function chainFaktor(chain) {
  return 1 + CHAIN_ANTEIL * (Math.min(Math.max(1, chain), CHAIN_MAX) - 1)
}

/** Die Chain nach einer Verschmelzung zur Zeit `zeit` (Sekunden). */
export function chainWeiter(chain, letzterMerge, zeit) {
  if (!(chain > 0) || letzterMerge == null || zeit - letzterMerge > CHAIN_S) return 1
  return chain + 1
}

/** Laeuft das Fieber gerade? */
export function fieberAktiv(stand) {
  return !!stand.fieber && stand.zeit < stand.fieberBis
}

/** Laeuft der Gold-Multiplikator gerade? */
export function goldAktiv(stand) {
  return stand.goldBis > stand.zeit
}

/** Faellt gerade alles in Zeitlupe? */
export function frostAktiv(stand) {
  return stand.frostBis > stand.zeit
}

/**
 * Der Faktor, mit dem ALLE Punkte dieses Augenblicks multipliziert werden:
 * Kombo × Chain × Fieber × Gold, hart bei FAKTOR_MAX gedeckelt.
 * Ohne alles ist er exakt 1 — daran haengt die Wertung der schlichten
 * Verschmelzung, und die soll berechenbar bleiben.
 */
export function gesamtFaktor(stand, kette, chain) {
  let f = komboFaktor(kette) * chainFaktor(chain)
  if (fieberAktiv(stand)) f *= FIEBER_MULT
  if (goldAktiv(stand)) f *= GOLD_MULT
  return Math.min(FAKTOR_MAX, f)
}

/**
 * Welches Spezialteil wird aus diesem Merge? `null`, wenn keines.
 * Rein: alles, was entscheidet, kommt als Argument herein, der Zufall auch.
 */
export function spezialWaehlen(stufe, kette, chain, fieber, zufall = Math.random) {
  for (const regel of SPEZIAL_REGELN) {
    if (stufe < regel.abStufe) continue
    if (kette < regel.abKette && chain < regel.abChain) continue
    const chance = Math.min(SPEZIAL_CHANCE_MAX, regel.chance * (fieber ? FIEBER_CHANCE : 1))
    if (zufall() < chance) return regel.key
  }
  return null
}

/**
 * Welche liegenden Teile raeumt ein Spezialteil ab? Rein und ohne
 * Seitenwirkung, damit der Test das Feld selbst stellen kann.
 * `gold` und `frost` raeumen nichts ab — die wirken ueber die Uhr.
 */
export function spezialTreffer(key, x, y, koerper) {
  const satz = SPEZIAL[key]
  if (!satz) return []
  if (satz.form === 'kreis') {
    return koerper.filter((k) => (k.x - x) * (k.x - x) + (k.y - y) * (k.y - y) <= satz.r * satz.r)
  }
  if (satz.form === 'zeile') {
    return koerper.filter((k) => Math.abs(k.y - y) <= satz.h / 2)
  }
  if (satz.form === 'feld') {
    return koerper.filter((k) => Math.abs(k.x - x) <= satz.b / 2 && Math.abs(k.y - y) <= satz.h / 2)
  }
  return []
}

/**
 * Ein Spruch zum Anlass — oder null. Sparsam ueber SPRUCH_PAUSE gedrosselt,
 * damit der Humor trocken bleibt und nicht zur Dauerbeschallung wird.
 * Merkt sich die Sperre im Stand, ruft sich also nur einmal je Anlass auf.
 */
export function spruchHolen(stand, anlass) {
  const liste = SPRUECHE[anlass]
  if (!liste || !liste.length) return null
  if (stand.zeit < stand.spruchBis) return null
  stand.spruchBis = stand.zeit + SPRUCH_PAUSE
  const w = stand.zufall ? stand.zufall() : Math.random()
  return liste[Math.min(liste.length - 1, Math.floor(w * liste.length))]
}

export function zufallsStufe(zufall = Math.random) {
  const summe = SPAWN_GEWICHTE.reduce((a, b) => a + b, 0)
  let wurf = zufall() * summe
  for (let i = 0; i < SPAWN_GEWICHTE.length; i += 1) {
    wurf -= SPAWN_GEWICHTE[i]
    if (wurf < 0) return i
  }
  return 0
}

export function neuesSpiel(zufall = Math.random) {
  return {
    koerper: [],
    aktuell: zufallsStufe(zufall),
    naechstes: zufallsStufe(zufall),
    zeit: 0,
    nr: 0,
    kette: 0,
    chain: 0,
    chainMax: 0,
    letzterMerge: null,
    komboBis: 0,
    hoechste: -1,
    abwuerfe: 0,
    abwurfMerges: 0,
    fieber: false,
    fieberBis: 0,
    fieberLadung: 0,
    fieberZahl: 0,
    goldBis: 0,
    frostBis: 0,
    spruchBis: 0,
    punkte: 0,
    abwurfPunkte: 0,
    gefahr: 0,
    fuellung: 0,
    warnung: false,
    kritisch: false,
    vorbei: false,
    zufall,
  }
}

/** Was gerade gehalten wird und was danach kommt. */
export function vorschau(stand) {
  return { aktuell: stand.aktuell, naechstes: stand.naechstes }
}

/** Zielposition so klemmen, dass das Teil nicht in der Wand steckt. */
export function klemmeX(stufe, x) {
  const r = STUFEN[stufe].r
  return Math.min(BREITE - r, Math.max(r, Number.isFinite(x) ? x : BREITE / 2))
}

function koerperBauen(stand, stufe, x, y, r0) {
  stand.nr += 1
  const rZiel = STUFEN[stufe].r
  return {
    id: stand.nr,
    stufe,
    x,
    y,
    px: x,
    py: y,
    vx: 0,
    vy: 0,
    r: r0 ?? rZiel,
    rZiel,
    m: rZiel * rZiel,
    winkel: 0,
    stuetze: false,
    geboren: stand.zeit,
    ueber: 0,
    spezial: null,
  }
}

/**
 * Das gehaltene Teil fallen lassen. Gibt den neuen Koerper zurueck; das
 * naechste Teil rueckt nach (genau das, was vorschau() zeigte). Die
 * Mindestzeit prueft die Komponente.
 */
export function abwerfen(stand, x) {
  if (stand.vorbei) return null
  const stufe = stand.aktuell
  /* Fehlwurf: der vorige Abwurf hat nichts verschmolzen — die Fieberladung
     faellt zurueck auf null. Genau das meint "fuenf Kombos ohne Fehler". */
  if (stand.abwuerfe > 0 && stand.abwurfMerges === 0) stand.fieberLadung = 0
  stand.abwurfMerges = 0
  const k = koerperBauen(stand, stufe, klemmeX(stufe, x), SPAWN_Y)
  stand.koerper.push(k)
  stand.aktuell = stand.naechstes
  stand.naechstes = zufallsStufe(stand.zufall)
  stand.abwuerfe += 1
  stand.abwurfPunkte = 0
  if (stufe > stand.hoechste) stand.hoechste = stufe
  return k
}

/**
 * Wo kaeme ein Teil beim senkrechten Fall zuerst auf? Mittelpunkt-y des
 * ersten Kontakts. Fuer die Hilfslinie und fuer den Bot.
 */
export function landeY(stand, stufe, x) {
  const r = STUFEN[stufe].r
  const cx = klemmeX(stufe, x)
  let y = HOEHE - r
  let getroffen = null
  for (const k of stand.koerper) {
    const summe = r + k.r
    const dx = Math.abs(k.x - cx)
    if (dx >= summe) continue
    const kontakt = k.y - Math.sqrt(summe * summe - dx * dx)
    if (kontakt < y) {
      y = kontakt
      getroffen = k
    }
  }
  return { y, getroffen }
}

/**
 * Zwei Kreise auseinanderschieben, gewichtet nach Masse. Gibt die
 * Ueberlappung zurueck (0, wenn sie sich nicht beruehren). Liegt einer
 * ueber dem anderen, ist der untere seine Stuetze.
 */
export function trennen(a, b, reibung = 0) {
  let dx = b.x - a.x
  let dy = b.y - a.y
  const summe = a.r + b.r
  if (dx > summe || dx < -summe || dy > summe || dy < -summe) return 0
  const d2 = dx * dx + dy * dy
  if (d2 >= summe * summe) return 0
  let d = Math.sqrt(d2)
  if (d < 1e-6) {
    /* Genau uebereinander: eine feste Richtung statt Division durch null. */
    dx = 0
    dy = 1
    d = 1e-6
  } else {
    dx /= d
    dy /= d
  }
  const ueber = summe - d
  const wa = b.m / (a.m + b.m)
  const wb = a.m / (a.m + b.m)
  a.x -= dx * ueber * wa
  a.y -= dy * ueber * wa
  b.x += dx * ueber * wb
  b.y += dy * ueber * wb
  /* Die Normale zeigt von a nach b; zeigt sie deutlich nach unten, stuetzt b a. */
  if (dy > 0.3) a.stuetze = true
  else if (dy < -0.3) b.stuetze = true
  if (reibung) {
    /* Reibung: gegenseitiges Gleiten entlang der Tangente teilweise zuruecknehmen. */
    const tx = -dy
    const ty = dx
    const rel = (a.x - a.px - (b.x - b.px)) * tx + (a.y - a.py - (b.y - b.py)) * ty
    const c = rel * reibung
    a.x -= tx * c * wa
    a.y -= ty * c * wa
    b.x += tx * c * wb
    b.y += ty * c * wb
  }
  return ueber
}

function waende(k) {
  if (k.x < k.r) k.x = k.r
  else if (k.x > BREITE - k.r) k.x = BREITE - k.r
  if (k.y > HOEHE - k.r) {
    k.y = HOEHE - k.r
    k.x -= (k.x - k.px) * REIBUNG_BODEN
    k.stuetze = true
  }
  /* Kein Deckel, aber auch kein Flug ins Unendliche. */
  if (k.y < -60) k.y = -60
}

/** Punkte gutschreiben, gedeckelt je Abwurf. Gibt die tatsaechlich vergebenen zurueck. */
function gutschreiben(stand, roh) {
  const frei = Math.max(0, ABWURF_MAX - stand.abwurfPunkte)
  const punkte = Math.max(0, Math.min(frei, Math.round(roh)))
  stand.abwurfPunkte += punkte
  stand.punkte += punkte
  return punkte
}

/** Eine gelandete Kombo mehr — und vielleicht zuendet dabei das Fieber. */
function fieberLaden(stand, ereignisse) {
  if (fieberAktiv(stand)) return
  stand.fieberLadung += 1
  if (stand.fieberLadung < FIEBER_COMBOS) return
  stand.fieberLadung = 0
  stand.fieber = true
  stand.fieberBis = stand.zeit + FIEBER_S
  stand.fieberZahl += 1
  ereignisse.push({ art: 'fieber', bis: stand.fieberBis, dauer: FIEBER_S, spruch: spruchHolen(stand, 'fieber') })
}

/* Mehr Zuendungen in einem einzigen Schritt gibt es nicht — eine harte
   Bremse gegen Kettenreaktionen, die sich selbst aufschaukeln. */
const ZUENDUNGEN_MAX = 8

/**
 * Spezialteile zuenden. Raeumt liegende Teile ab (nie die eben erst
 * entstandenen), zahlt nur fuer das, was wirklich weg ist, und laesst
 * abgeraeumte Spezialteile ihrerseits zuenden.
 */
function spezialZuenden(stand, keys, x, y, liste, weg, neu, faktor, kette, chain, ereignisse) {
  const schlange = keys.map((key) => ({ key, x, y }))
  let zahl = 0
  while (schlange.length && zahl < ZUENDUNGEN_MAX) {
    const { key, x: zx, y: zy } = schlange.shift()
    zahl += 1
    const satz = SPEZIAL[key]
    if (!satz) continue
    if (satz.form === 'gold') {
      stand.goldBis = Math.max(stand.goldBis, stand.zeit + GOLD_S)
    } else if (satz.form === 'frost') {
      stand.frostBis = Math.max(stand.frostBis, stand.zeit + FROST_S)
    }
    let roh = 0
    let getroffen = []
    if (satz.form === 'kreis' || satz.form === 'zeile' || satz.form === 'feld') {
      const offen = liste.filter((k) => !weg.has(k.id))
      getroffen = spezialTreffer(key, zx, zy, offen)
      if (getroffen.length) {
        let summe = satz.grund
        for (const k of getroffen) {
          weg.add(k.id)
          summe += basisPunkte(k.stufe) * SPEZIAL_ANTEIL
          if (k.spezial) schlange.push({ key: k.spezial, x: k.x, y: k.y })
        }
        roh = summe * faktor
      }
      /* Zuendet die Bombe ins Leere, gibt es nichts. Abraeumen wird bezahlt. */
    } else {
      roh = satz.grund * faktor
    }
    const punkte = gutschreiben(stand, roh)
    ereignisse.push({
      art: 'spezial',
      spezial: key,
      wort: satz.wort,
      ruf: satz.ruf,
      form: satz.form,
      x: zx,
      y: zy,
      r: satz.r ?? 0,
      b: satz.b ?? 0,
      h: satz.h ?? 0,
      weite: satz.form === 'zeile' ? BREITE : 0,
      abgeraeumt: getroffen.length,
      punkte,
      kette,
      chain,
      faktor,
      gross: getroffen.length >= 3 || satz.form === 'gold',
      spruch: getroffen.length >= 4 ? spruchHolen(stand, 'spezial') : null,
    })
  }
}

/**
 * Ein fester Schritt: Schwerkraft, Stoesse, Verschmelzen, Ueberlauf.
 * Gibt die Ereignisse dieses Schritts zurueck (meist keine).
 */
export function schritt(stand) {
  const ereignisse = []
  if (stand.vorbei) return ereignisse
  const h = SCHRITT_S
  const liste = stand.koerper
  const n = liste.length
  stand.zeit += h

  /* Uhren zuerst: abgelaufene Zustaende raeumen sich hier selbst auf, damit
     kein Fieber und kein Gold haengen bleibt, wenn niemand hinschaut. */
  if (stand.fieber && stand.zeit >= stand.fieberBis) {
    stand.fieber = false
    stand.fieberBis = 0
    ereignisse.push({ art: 'fieber-ende' })
  }
  if (stand.goldBis && stand.zeit >= stand.goldBis) stand.goldBis = 0
  if (stand.frostBis && stand.zeit >= stand.frostBis) stand.frostBis = 0

  /* Frost bremst nur den Fall, nicht die Loesung — die Physik bleibt stabil. */
  const g = stand.frostBis > stand.zeit ? SCHWERKRAFT * FROST_ANTEIL : SCHWERKRAFT

  for (let i = 0; i < n; i += 1) {
    const k = liste[i]
    k.px = k.x
    k.py = k.y
    k.stuetze = false
    k.vy += g * h
    k.x += k.vx * h
    k.y += k.vy * h
    if (k.r < k.rZiel) {
      const alt = STUFEN[Math.max(0, k.stufe - 1)].r
      k.r = Math.min(k.rZiel, k.r + ((k.rZiel - alt) * h) / WACHS_S)
    }
  }

  /* Von unten nach oben: die Last des Stapels wandert in einem Durchgang durch. */
  const reihe = n > 1 ? liste.slice().sort((a, b) => b.y - a.y) : liste
  for (let it = 0; it < ITERATIONEN; it += 1) {
    const reibung = it >= ITERATIONEN - 2 ? REIBUNG / 2 : 0
    for (let i = 0; i < n; i += 1) {
      const a = reihe[i]
      for (let j = i + 1; j < n; j += 1) trennen(a, reihe[j], reibung)
    }
    for (let i = 0; i < n; i += 1) waende(reihe[i])
  }

  for (let i = 0; i < n; i += 1) {
    const k = liste[i]
    let vx = ((k.x - k.px) / h) * DAEMPFUNG
    let vy = ((k.y - k.py) / h) * DAEMPFUNG
    const tempo = Math.hypot(vx, vy)
    if (tempo > MAX_TEMPO) {
      vx *= MAX_TEMPO / tempo
      vy *= MAX_TEMPO / tempo
    } else if (k.stuetze && tempo < RUHE_TEMPO && k.r >= k.rZiel) {
      vx *= RUHE_REST
      vy *= RUHE_REST
    }
    k.vx = vx
    k.vy = vy
    /* Rollen: waagerechter Weg auf einer Stuetze dreht das Teil. */
    if (k.stuetze) k.winkel += (k.x - k.px) / k.r
  }

  /* Kombo abgelaufen? */
  if (stand.kette > 0 && stand.zeit > stand.komboBis) stand.kette = 0
  /* Die Chain ist enger und faellt frueher zurueck. */
  if (stand.chain > 0 && (stand.letzterMerge == null || stand.zeit - stand.letzterMerge > CHAIN_S)) stand.chain = 0

  /* Verschmelzen: jedes Teil hoechstens einmal je Schritt. */
  const weg = new Set()
  const neu = []
  for (let i = 0; i < n; i += 1) {
    const a = liste[i]
    if (weg.has(a.id)) continue
    for (let j = i + 1; j < n; j += 1) {
      const b = liste[j]
      if (b.stufe !== a.stufe || weg.has(b.id)) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const grenze = a.r + b.r + MERGE_SPIEL
      if (dx * dx + dy * dy > grenze * grenze) continue
      weg.add(a.id)
      weg.add(b.id)
      /* Beruehrpunkt: bei gleich grossen Kreisen die Mitte, sonst nach Radius. */
      const anteil = a.r / (a.r + b.r)
      const x = a.x + dx * anteil
      const y = a.y + dy * anteil
      const kette = komboWeiter(stand.kette, stand.letzterMerge, stand.zeit)
      const chain = chainWeiter(stand.chain, stand.letzterMerge, stand.zeit)
      stand.kette = kette
      stand.chain = chain
      if (chain > stand.chainMax) stand.chainMax = chain
      stand.letzterMerge = stand.zeit
      stand.komboBis = stand.zeit + KOMBO_S
      /* Erste Verschmelzung dieses Abwurfs: eine gelandete Kombo. */
      stand.abwurfMerges += 1
      if (stand.abwurfMerges === 1 && stand.abwuerfe > 0) fieberLaden(stand, ereignisse)
      const faktor = gesamtFaktor(stand, kette, chain)
      if (a.stufe === OBERSTE) {
        const punkte = gutschreiben(stand, TRAUM_PUNKTE * faktor)
        ereignisse.push({
          art: 'traum', stufe: OBERSTE + 1, x, y, punkte, kette, chain, faktor,
          gross: true, neuHoechste: false, spruch: spruchHolen(stand, 'traum'),
        })
      } else {
        const stufe = a.stufe + 1
        const k = koerperBauen(stand, stufe, x, y, Math.max(a.r, b.r))
        k.vx = (a.vx + b.vx) / 2
        k.vy = (a.vy + b.vy) / 2
        k.px = x - k.vx * h
        k.py = y - k.vy * h
        k.winkel = (a.winkel + b.winkel) / 2
        neu.push(k)
        const punkte = gutschreiben(stand, basisPunkte(stufe) * faktor)
        const neuHoechste = stufe > stand.hoechste
        if (neuHoechste) stand.hoechste = stufe
        ereignisse.push({
          art: 'merge', stufe, x, y, punkte, kette, chain, faktor,
          gross: stufe >= GROSS_AB, neuHoechste,
          eskaliert: chain >= CHAIN_ESKALIERT,
          spruch: chain >= CHAIN_ESKALIERT ? spruchHolen(stand, 'chain') : null,
        })
        /* Aus einem guten Merge wird ein Spezialteil — kein zusaetzlicher
           Koerper, nur eine Eigenschaft des eben entstandenen. */
        const key = spezialWaehlen(stufe, kette, chain, fieberAktiv(stand), stand.zufall || Math.random)
        if (key) {
          k.spezial = key
          ereignisse.push({ art: 'spezial-geboren', spezial: key, wort: SPEZIAL[key].wort, stufe, x, y, kette, chain, faktor })
        }
      }
      /* Zuendet hier ein Spezialteil? Erst jetzt, wo es selbst verschmilzt. */
      if (a.spezial || b.spezial) {
        const zuender = []
        if (a.spezial) zuender.push(a.spezial)
        if (b.spezial) zuender.push(b.spezial)
        spezialZuenden(stand, zuender, x, y, liste, weg, neu, faktor, kette, chain, ereignisse)
      }
      break
    }
  }
  if (weg.size) stand.koerper = liste.filter((k) => !weg.has(k.id)).concat(neu)

  /* Ueberlauf, Fuellstand und Warnung. */
  let ueberMax = 0
  let fuellung = 0
  for (const k of stand.koerper) {
    if (stand.zeit - k.geboren < GNADE_S) {
      k.ueber = 0
      continue
    }
    const oben = k.y - k.r
    if (oben < LINIE_Y) k.ueber += h
    else k.ueber = 0
    const f = (LINIE_Y + WARN_ABSTAND - oben) / WARN_ABSTAND
    if (f > fuellung) fuellung = f
    if (k.ueber > ueberMax) ueberMax = k.ueber
  }
  stand.fuellung = Math.max(0, Math.min(1, fuellung))
  stand.gefahr = Math.min(1, ueberMax / UEBER_S)
  stand.warnung = stand.fuellung > 0
  stand.kritisch = stand.gefahr > 0 || stand.fuellung >= KRITISCH_AB
  if (ueberMax >= UEBER_S) {
    stand.vorbei = true
    ereignisse.push({ art: 'vorbei' })
  }
  return ereignisse
}

/** Mehrere Schritte am Stueck, fuer Tests und Bots. */
export function simulieren(stand, sekunden) {
  const alle = []
  const schritte = Math.round(sekunden / SCHRITT_S)
  for (let i = 0; i < schritte && !stand.vorbei; i += 1) {
    const e = schritt(stand)
    if (e.length) alle.push(...e)
  }
  return alle
}
