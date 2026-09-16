/**
 * VIDEKO SLAM — Spiellogik ohne React.
 *
 * Reine Funktionen mit injizierbarem Zufall, getestet in
 * scripts/spiele/slam-logik-test.mjs.
 *
 * ABLAUF
 * ------
 * Vor dem Spieler steht eine Wand aus Fronten. Hinter jeder kann etwas
 * hochkommen: Sachen, die ins Haus gehoeren, und Sachen, die in den
 * Container gehoeren. Wer das Richtige schlaegt, bekommt Punkte; wer den
 * Mist schlaegt, verliert Zeit. Wer Gutes durchlaufen laesst, verliert die
 * Serie. Eine Runde dauert SPIELZEIT_MS und braucht keine Erklaerung, die
 * laenger ist als dieser Absatz.
 *
 * SCHWIERIGKEIT
 * -------------
 * Mit der Zeit steigt die Stufe (STUFEN_MS). Mit ihr kommen mehr Fronten
 * ins Spiel, die Sachen kommen schneller und bleiben kuerzer stehen, und
 * der Anteil an Mist waechst. Nichts davon springt: jede Kurve ist eine
 * Tabelle mit einem Wert je Stufe, damit sich Balance ohne Rechnen aendern
 * laesst.
 *
 * SPEZIALE
 * --------
 * VIDEKO GOLD gibt ein Punktepaket. KÜHLSCHRANK friert das Feld ein (alles
 * bleibt laenger stehen, Nachschub kommt langsamer). BACKOFEN raeumt in dem
 * Moment jeden Mist vom Feld. BAUSTELLEN-CHAOS startet eine kurze Phase, in
 * der alle Fronten gleichzeitig besetzt werden und jeder Treffer doppelt
 * zaehlt. Die GUMMIENTE ist ein Osterei: sie kostet nichts.
 *
 * WERTUNG
 * -------
 * Treffer: BASIS × Combo-Faktor + Tempobonus, in der Chaos-Phase verdoppelt,
 * gedeckelt auf MAX_JE_TREFFER. Mist: 0 Punkte, Combo 0, STRAFE_MS Zeit weg.
 * Durchgelassenes Gut: Combo 0, sonst nichts — Wegsehen kostet keine Zeit.
 */

import { GUTE, OBJEKTE, OBJEKT_NACH_ID, SCHLECHTE, SPEZIALE, SPRUECHE, WIRKUNG, spruch } from './slam-objekte.js'

export { GUTE, OBJEKTE, OBJEKT_NACH_ID, SCHLECHTE, SPEZIALE, SPRUECHE, WIRKUNG, spruch }

/** Rundenlaenge. Liegt im Fenster 45–60 s, das der Auftrag vorgibt. */
export const SPIELZEIT_MS = 50000
/** Alle so viele Millisekunden eine Stufe hoeher, bis STUFE_MAX. */
export const STUFEN_MS = 9000
export const STUFE_MAX = 5

/** Fronten je Stufe (Index 0 = Stufe 1). Nie weniger als 6, nie mehr als 9. */
export const FRONTEN_STUFE = [6, 6, 7, 8, 9]
export const FRONTEN_MIN = 6
export const FRONTEN_MAX = 9

/** Abstand zwischen zwei Erscheinungen je Stufe. */
export const TAKT_STUFE = [760, 660, 570, 490, 420]
/** Wie lange etwas stehen bleibt, je Stufe. */
export const SICHT_STUFE = [1600, 1450, 1250, 1080, 940]
/** Anteil Mist an allem, was kommt, je Stufe. */
export const MIST_STUFE = [0.22, 0.28, 0.33, 0.38, 0.44]

/** Wie oft ein Spezialobjekt statt des normalen Nachschubs kommt. */
export const SELTEN = {
  gold: 0.035,
  frost: 0.03,
  hitze: 0.03,
  chaos: 0.022,
  ente: 0.012,
}
/** Mindestabstand zwischen zwei Spezialen — sonst ballen sie sich. */
export const SPEZIAL_PAUSE_MS = 4000

/** Frost: so viel laenger bleibt alles stehen, so lange haelt es an. */
export const FROST_MS = 4500
export const FROST_SICHT = 1.9
export const FROST_TAKT = 1.6
/** Chaos: so lange, so oft Nachschub, so viel Punkte. */
export const CHAOS_MS = 5000
export const CHAOS_TAKT = 0.45
export const CHAOS_FAKTOR = 2

export const BASIS_PUNKTE = 100
export const GOLD_PUNKTE = 500
export const ENTE_PUNKTE = 50
export const HITZE_JE_MIST = 40
/** Combo-Stufen: ab dieser Combo gilt der Faktor. */
export const COMBO_STUFEN = [
  { ab: 15, faktor: 3 },
  { ab: 10, faktor: 2.5 },
  { ab: 6, faktor: 2 },
  { ab: 3, faktor: 1.5 },
  { ab: 0, faktor: 1 },
]
export const TEMPO_SCHNELL_MS = 360
export const TEMPO_ZUEGIG_MS = 620
export const TEMPO_SCHNELL = 40
export const TEMPO_ZUEGIG = 20
/** Punktdecke je Schlag. Liegt unter maxJeRunde des Servers. */
export const MAX_JE_TREFFER = 900
/** Zeitstrafe fuer einen geschlagenen Mist. */
export const STRAFE_MS = 1500
/** Ab dieser Serie meldet das Spiel sie einmal. */
export const SERIE_MELDEN = [5, 10, 15, 20]

/* ------------------------------------------------------------------ */
/* Zufall                                                              */
/* ------------------------------------------------------------------ */

/** Deterministischer Zufall (mulberry32) fuer Tests und Wiederholungen. */
export function zufallMitSaat(saat = 1) {
  let a = saat >>> 0
  return function zufall() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/* Kurven                                                              */
/* ------------------------------------------------------------------ */

const ausTabelle = (tabelle, stufe) => tabelle[Math.min(tabelle.length, Math.max(1, stufe)) - 1]

/** Stufe nach verstrichener Zeit (1 … STUFE_MAX). */
export function stufeFuer(msSeitStart) {
  const ms = Number.isFinite(msSeitStart) ? Math.max(0, msSeitStart) : 0
  return Math.min(STUFE_MAX, 1 + Math.floor(ms / STUFEN_MS))
}

export const frontenFuer = (stufe) => ausTabelle(FRONTEN_STUFE, stufe)
export const taktFuer = (stufe) => ausTabelle(TAKT_STUFE, stufe)
export const sichtFuer = (stufe) => ausTabelle(SICHT_STUFE, stufe)
export const mistAnteilFuer = (stufe) => ausTabelle(MIST_STUFE, stufe)

/** Faktor zur Combo, die dieser Treffer mitzaehlt (1 = erster Treffer). */
export function faktorFuer(combo) {
  for (const s of COMBO_STUFEN) if (combo >= s.ab) return s.faktor
  return 1
}

/** Tempobonus fuer `zeitMs` zwischen Erscheinen und Schlag. */
export function tempoBonus(zeitMs) {
  if (!Number.isFinite(zeitMs) || zeitMs < 0) return 0
  if (zeitMs < TEMPO_SCHNELL_MS) return TEMPO_SCHNELL
  if (zeitMs < TEMPO_ZUEGIG_MS) return TEMPO_ZUEGIG
  return 0
}

/** Punkte fuer einen sauberen Treffer, gedeckelt. */
export function punkteFuer(combo, zeitMs, chaos = false) {
  const roh = Math.round(BASIS_PUNKTE * faktorFuer(combo)) + tempoBonus(zeitMs)
  return Math.min(MAX_JE_TREFFER, chaos ? roh * CHAOS_FAKTOR : roh)
}

/* ------------------------------------------------------------------ */
/* Zustand                                                             */
/* ------------------------------------------------------------------ */

/**
 * Ein frisches Feld. `fronten` hat immer FRONTEN_MAX Plaetze; wie viele davon
 * bespielt werden, entscheidet die Stufe — so wandert nichts, wenn das Feld
 * mitten in der Runde waechst.
 */
export function spielStart(zufall = Math.random) {
  return {
    zufall,
    zeitMs: 0,
    stufe: 1,
    fronten: Array.from({ length: FRONTEN_MAX }, () => null),
    naechsteMs: 500,
    lfdNr: 0,
    frostBis: 0,
    chaosBis: 0,
    letztesSpezialMs: -SPEZIAL_PAUSE_MS,
    combo: 0,
    besteCombo: 0,
    punkte: 0,
    treffer: 0,
    fehler: 0,
    verpasst: 0,
    schlaege: 0,
    strafeMs: 0,
    gold: 0,
    chaosZahl: 0,
    frostZahl: 0,
    enten: 0,
  }
}

export const frostAktiv = (z) => z.frostBis > z.zeitMs
export const chaosAktiv = (z) => z.chaosBis > z.zeitMs

/** Wie viele Fronten gerade bespielt werden. */
export const offeneFronten = (z) => frontenFuer(z.stufe)

function objektZiehen(z) {
  const r = z.zufall()
  /* Speziale kommen nur, wenn die letzte Seltenheit lange genug her ist —
     sonst treffen sich Gold, Frost und Chaos im selben Takt. */
  if (z.zeitMs - z.letztesSpezialMs >= SPEZIAL_PAUSE_MS) {
    let grenze = 0
    for (const [wirkung, anteil] of Object.entries(SELTEN)) {
      grenze += anteil
      if (r < grenze) {
        const treffer = SPEZIALE.find((o) => o.wirkung === wirkung)
        if (treffer) return treffer
      }
    }
  }
  const mist = z.zufall() < mistAnteilFuer(z.stufe)
  const liste = mist ? SCHLECHTE : GUTE
  return liste[Math.floor(z.zufall() * liste.length) % liste.length]
}

function platzWaehlen(z) {
  const offen = offeneFronten(z)
  const frei = []
  for (let i = 0; i < offen; i += 1) if (!z.fronten[i]) frei.push(i)
  if (!frei.length) return -1
  return frei[Math.floor(z.zufall() * frei.length) % frei.length]
}

function setzen(z, platz, objekt) {
  z.lfdNr += 1
  const dauer = Math.round(sichtFuer(z.stufe) * (frostAktiv(z) ? FROST_SICHT : 1))
  const eintrag = {
    nr: z.lfdNr,
    id: objekt.id,
    art: objekt.art,
    wirkung: objekt.wirkung || null,
    name: objekt.name,
    bild: objekt.bild,
    abMs: z.zeitMs,
    bisMs: z.zeitMs + dauer,
  }
  const fronten = z.fronten.slice()
  fronten[platz] = eintrag
  z.fronten = fronten
  if (objekt.art === 'spezial') z.letztesSpezialMs = z.zeitMs
  return eintrag
}

/**
 * Einen Zeitschritt rechnen. Gibt `{ zustand, ereignisse }`; `ereignisse` ist
 * eine Liste aus `{ art: 'kommt' | 'weg', platz, eintrag }` — 'weg' heisst
 * abgelaufen, nicht geschlagen. Ein durchgelassenes Gut setzt die Combo auf 0
 * und zaehlt als `verpasst`.
 */
export function takt(zustand, dtMs) {
  const z = { ...zustand }
  const schritt = Number.isFinite(dtMs) && dtMs > 0 ? Math.min(dtMs, 250) : 0
  z.zeitMs += schritt
  z.stufe = stufeFuer(z.zeitMs)
  const ereignisse = []

  /* Abgelaufenes zuerst: was weg ist, macht Platz fuer Neues. */
  const offen = offeneFronten(z)
  let fronten = z.fronten
  for (let i = 0; i < fronten.length; i += 1) {
    const e = fronten[i]
    if (!e) continue
    /* Faellt eine Front aus dem Spiel (kleinere Stufe gibt es nicht, aber der
       Zustand soll auch dann stimmen), raeumt sie sich leise. */
    const abgelaufen = e.bisMs <= z.zeitMs
    if (!abgelaufen && i < offen) continue
    if (fronten === z.fronten) fronten = z.fronten.slice()
    fronten[i] = null
    ereignisse.push({ art: 'weg', platz: i, eintrag: e, abgelaufen })
    /* Nur wirklich Durchgelassenes bricht die Serie. Eine Front, die aus dem
       Spiel faellt, raeumt sich leise — dafuer kann niemand etwas. */
    if (abgelaufen && e.art === 'gut') {
      z.verpasst += 1
      z.combo = 0
    }
  }
  z.fronten = fronten

  /* Nachschub. In der Chaos-Phase kommt er im Kurztakt, im Frost langsamer. */
  const chaos = chaosAktiv(z)
  let takte = 0
  while (z.zeitMs >= z.naechsteMs && takte < FRONTEN_MAX) {
    takte += 1
    const platz = platzWaehlen(z)
    if (platz >= 0) {
      const objekt = objektZiehen(z)
      ereignisse.push({ art: 'kommt', platz, eintrag: setzen(z, platz, objekt) })
    }
    let abstand = taktFuer(z.stufe)
    if (chaos) abstand *= CHAOS_TAKT
    else if (frostAktiv(z)) abstand *= FROST_TAKT
    z.naechsteMs += Math.max(90, Math.round(abstand))
  }

  return { zustand: z, ereignisse }
}

/**
 * Auf eine Front schlagen. Gibt `{ zustand, ereignis }`. `ereignis.art` ist
 * 'treffer' | 'mist' | 'gold' | 'frost' | 'hitze' | 'chaos' | 'ente' |
 * 'leer' — 'leer' heisst: da war nichts, das kostet nichts.
 */
export function schlagen(zustand, platz) {
  const z = { ...zustand }
  const eintrag = z.fronten[platz]
  if (!eintrag || platz >= offeneFronten(z)) {
    return { zustand: z, ereignis: { art: 'leer', platz, punkte: 0 } }
  }
  const fronten = z.fronten.slice()
  fronten[platz] = null
  z.fronten = fronten
  z.schlaege += 1
  const reaktionMs = Math.max(0, z.zeitMs - eintrag.abMs)
  const chaos = chaosAktiv(z)

  if (eintrag.art === 'schlecht') {
    z.fehler += 1
    const comboVorher = z.combo
    z.combo = 0
    z.strafeMs += STRAFE_MS
    return {
      zustand: z,
      ereignis: { art: 'mist', platz, eintrag, punkte: 0, strafeMs: STRAFE_MS, comboVorher },
    }
  }

  if (eintrag.art === 'spezial') {
    if (eintrag.wirkung === WIRKUNG.ente) {
      z.enten += 1
      z.punkte += ENTE_PUNKTE
      return { zustand: z, ereignis: { art: 'ente', platz, eintrag, punkte: ENTE_PUNKTE } }
    }
    if (eintrag.wirkung === WIRKUNG.gold) {
      z.gold += 1
      z.treffer += 1
      z.combo += 1
      z.besteCombo = Math.max(z.besteCombo, z.combo)
      const punkte = Math.min(MAX_JE_TREFFER, chaos ? GOLD_PUNKTE * CHAOS_FAKTOR : GOLD_PUNKTE)
      z.punkte += punkte
      return { zustand: z, ereignis: { art: 'gold', platz, eintrag, punkte, combo: z.combo } }
    }
    if (eintrag.wirkung === WIRKUNG.frost) {
      z.frostZahl += 1
      z.frostBis = z.zeitMs + FROST_MS
      /* Was schon steht, bleibt ab jetzt ebenfalls laenger. */
      z.fronten = z.fronten.map((e) => (e ? { ...e, bisMs: e.bisMs + Math.round(sichtFuer(z.stufe) * (FROST_SICHT - 1)) } : e))
      return { zustand: z, ereignis: { art: 'frost', platz, eintrag, punkte: 0, bisMs: z.frostBis } }
    }
    if (eintrag.wirkung === WIRKUNG.hitze) {
      let weg = 0
      z.fronten = z.fronten.map((e) => {
        if (e && e.art === 'schlecht') {
          weg += 1
          return null
        }
        return e
      })
      const punkte = Math.min(MAX_JE_TREFFER, weg * HITZE_JE_MIST * (chaos ? CHAOS_FAKTOR : 1))
      z.punkte += punkte
      return { zustand: z, ereignis: { art: 'hitze', platz, eintrag, punkte, weg } }
    }
    if (eintrag.wirkung === WIRKUNG.chaos) {
      z.chaosZahl += 1
      z.chaosBis = z.zeitMs + CHAOS_MS
      return { zustand: z, ereignis: { art: 'chaos', platz, eintrag, punkte: 0, bisMs: z.chaosBis } }
    }
  }

  z.treffer += 1
  z.combo += 1
  z.besteCombo = Math.max(z.besteCombo, z.combo)
  const punkte = punkteFuer(z.combo, reaktionMs, chaos)
  z.punkte += punkte
  const serie = SERIE_MELDEN.includes(z.combo) ? z.combo : 0
  return {
    zustand: z,
    ereignis: { art: 'treffer', platz, eintrag, punkte, combo: z.combo, reaktionMs, serie, chaos },
  }
}

/**
 * Welche Meldung ein Ereignis bekommt: `{ art, text }` fuer die Klassen
 * `trm-spiel__ruf--<art>`. `n` zaehlt die Sprueche reihum weiter.
 */
export function meldungFuer(ereignis, n = 0) {
  switch (ereignis.art) {
    case 'mist':
      return { art: 'verkantet', text: `−${STRAFE_MS / 1000} s`, klein: spruch('fehler', n) }
    case 'gold':
      return { art: 'perfekt', text: `VIDEKO GOLD +${ereignis.punkte}` }
    case 'frost':
      return { art: 'gold', text: 'EINGEFROREN' }
    case 'hitze':
      return { art: 'gold', text: ereignis.weg ? `DURCHGEHEIZT · ${ereignis.weg} WEG` : 'DURCHGEHEIZT' }
    case 'chaos':
      return { art: 'perfekt', text: 'BAUSTELLE ESKALIERT.' }
    case 'ente':
      return { art: 'gut', text: 'QUAK.' }
    case 'treffer':
      if (ereignis.serie) return { art: 'perfekt', text: `SERIE ×${ereignis.serie}`, klein: spruch('serie', n) }
      return { art: ereignis.reaktionMs < TEMPO_SCHNELL_MS ? 'gut' : 'treffer', text: `+${ereignis.punkte}` }
    default:
      return null
  }
}
