/**
 * KUECHEN-CRUSH — die reine Spiellogik.
 *
 * Kein React, kein DOM, keine Uhr. Hier steht, was ein Tausch bewirkt: welche
 * Steine verschwinden, was nachfaellt, welche Sonderteile entstehen und was
 * es bringt. Die Komponente spielt das Ergebnis nur Schritt fuer Schritt ab.
 * So laesst sich alles in Node pruefen und mit Bots ueber viele Laeufe
 * simulieren — die Servergrenzen kommen aus dieser Datei.
 *
 * DAS FELD
 * --------
 * 7 Spalten × 8 Reihen, `feld[y][x]`, Reihe 0 oben. Eine Zelle ist ein Stein
 * `{ id, typ, spezial }` oder null (nur kurz, waehrend geraeumt wird).
 * `typ` 1..6 ist der Kuechengegenstand, die Bombe hat `typ` 0 und passt zu
 * nichts. `spezial` ist null, 'reihe', 'spalte' oder 'bombe'. Die `id`
 * bleibt am Stein, solange er lebt — daran haengt die Animation.
 *
 * SONDERTEILE
 * -----------
 * Vier in einer Linie: BOOSTER. Er behaelt seinen Typ und raeumt beim
 * Abraeumen seine Reihe (aus einer waagerechten Vier) oder Spalte (aus einer
 * senkrechten). Fuenf in einer Linie oder eine L/T-Form: VIDEKO-BOMBE. Sie
 * wird mit einem beliebigen Nachbarn getauscht und raeumt alle Steine von
 * dessen Typ; zwei Bomben raeumen das ganze Feld.
 *
 * WERTUNG
 * -------
 * Je Schritt: geraeumte Steine × 30 × Kaskadenfaktor (1, 2, 3, 5, 8, 12 —
 * danach bleibt es bei 12), dazu 150 je entstandenem Booster und 400 je
 * entstandener Bombe. Dann zwei Faktoren fuer den ganzen Zug:
 *
 *   TEMPO   Wer innerhalb von SERIE_MS nach dem Freiwerden wieder tauscht,
 *           steigt eine Tempostufe: ×1 → ×1,2 → ×1,4 → ×1,6.
 *           Langsamer Zug oder Fehltausch: zurueck auf ×1.
 *   FINALE  Die letzten 5 Sekunden zaehlen doppelt (FINALE ×2).
 *
 * Ein Zug bringt hoechstens ZUG_PUNKTE_MAX — auch zwei Bomben im Finale mit
 * voller Tempostufe nicht mehr. Die Servergrenze maxJeRunde liegt darueber.
 */

export const BREITE = 7
export const HOEHE = 8
export const TYPEN = 6

export const PUNKTE_JE_STEIN = 30
export const BOOSTER_BONUS = 150
export const BOMBE_BONUS = 400
export const KASKADE_FAKTOREN = [1, 2, 3, 5, 8, 12]
export const KOMBO_MAX = KASKADE_FAKTOREN[KASKADE_FAKTOREN.length - 1]
export const TEMPO_FAKTOREN = [1, 1.2, 1.4, 1.6]
export const TEMPO_STUFE_MAX = TEMPO_FAKTOREN.length - 1
export const SERIE_MS = 900
export const FINALE_MS = 5000
export const FINALE_FAKTOR = 2
export const ZUG_PUNKTE_MAX = 4000
/* Alte Namen, damit nichts bricht, das noch darauf zeigt. */
export const ENDSPURT_MS = FINALE_MS
export const ENDSPURT_FAKTOR = FINALE_FAKTOR

/* Taktung. Die Komponente haelt die Eingabe waehrend der Aufloesung
   gesperrt und gibt sie frei, sobald der letzte Fall fast liegt
   (FREI_FRUEH_MS vor dessen Ende) — die Logik ist da laengst fertig.
   SPERRE_MS ist die Mindestzeit zwischen zwei gueltigen Tauschen, auch
   ohne Animation. Sie ist die Servergrenze msJeRunde (300): selbst ein
   Bot kommt nicht schneller durch. */
export const TAUSCH_MS = 110
export const MARK_MS = 80
export const FALL_MS = 110
/* Schritte mit Zuendung oder neuer Bombe stehen einen Hauch laenger. */
export const EFFEKT_MS = 70
export const SCHRITT_MS = MARK_MS + FALL_MS
export const FREI_FRUEH_MS = 60
/* Weniger Bewegung: nichts gleitet, aber der Takt bleibt gleich. Sonst
   waere ein Lauf mit reduzierter Bewegung schneller als jeder andere. */
export const SANFT_TAUSCH_MS = TAUSCH_MS
export const SANFT_MARK_MS = SCHRITT_MS
export const SANFT_FALL_MS = 0
export const MISCHEN_MS = 220
export const SPERRE_MS = 300

/* Sicherung gegen endlose Ketten. Kommt praktisch nie vor. */
const KETTE_GRENZE = 60

/* ------------------------------------------------------------------ */
/* Zufall                                                              */
/* ------------------------------------------------------------------ */

/** Kleiner, reproduzierbarer Zufall fuer Tests und Simulation. */
export function zufallMitSaat(saat = 1) {
  let a = saat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const zieheTyp = (zufall) => 1 + Math.floor(zufall() * TYPEN)

/* ------------------------------------------------------------------ */
/* Hilfen                                                              */
/* ------------------------------------------------------------------ */

export const schluessel = (x, y) => `${x},${y}`

export function kopie(feld) {
  return feld.map((reihe) => reihe.slice())
}

export function benachbart(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1
}

export function imFeld(x, y) {
  return x >= 0 && y >= 0 && x < BREITE && y < HOEHE
}

/** Das Feld mit zwei getauschten Zellen, als neue Kopie. */
export function vertauscht(feld, a, b) {
  const neu = kopie(feld)
  const t = neu[a[1]][a[0]]
  neu[a[1]][a[0]] = neu[b[1]][b[0]]
  neu[b[1]][b[0]] = t
  return neu
}

function steinNeu(stand, typ, spezial = null) {
  stand.naechsteId += 1
  return { id: stand.naechsteId, typ, spezial }
}

const passt = (s, typ) => !!s && s.typ > 0 && s.typ === typ

/* ------------------------------------------------------------------ */
/* Treffer                                                             */
/* ------------------------------------------------------------------ */

/** Alle waagerechten und senkrechten Linien ab drei gleichen Steinen. */
export function findeLaeufe(feld) {
  const laeufe = []
  for (let y = 0; y < HOEHE; y += 1) {
    let x = 0
    while (x < BREITE) {
      const s = feld[y][x]
      let bis = x + 1
      if (s && s.typ > 0) while (bis < BREITE && passt(feld[y][bis], s.typ)) bis += 1
      if (s && s.typ > 0 && bis - x >= 3) {
        const zellen = []
        for (let i = x; i < bis; i += 1) zellen.push([i, y])
        laeufe.push({ richtung: 'h', typ: s.typ, zellen })
      }
      x = bis
    }
  }
  for (let x = 0; x < BREITE; x += 1) {
    let y = 0
    while (y < HOEHE) {
      const s = feld[y][x]
      let bis = y + 1
      if (s && s.typ > 0) while (bis < HOEHE && passt(feld[bis][x], s.typ)) bis += 1
      if (s && s.typ > 0 && bis - y >= 3) {
        const zellen = []
        for (let i = y; i < bis; i += 1) zellen.push([x, i])
        laeufe.push({ richtung: 'v', typ: s.typ, zellen })
      }
      y = bis
    }
  }
  return laeufe
}

/**
 * Linien, die sich eine Zelle teilen, gehoeren zu einer Gruppe (L und T).
 * Jede Gruppe wird genau einmal gewertet.
 */
export function findeGruppen(feld) {
  const laeufe = findeLaeufe(feld)
  const eltern = laeufe.map((_, i) => i)
  const wurzel = (i) => {
    while (eltern[i] !== i) {
      eltern[i] = eltern[eltern[i]]
      i = eltern[i]
    }
    return i
  }
  const besitzer = new Map()
  laeufe.forEach((lauf, i) => {
    for (const [x, y] of lauf.zellen) {
      const k = schluessel(x, y)
      if (besitzer.has(k)) eltern[wurzel(i)] = wurzel(besitzer.get(k))
      else besitzer.set(k, i)
    }
  })
  const nachWurzel = new Map()
  laeufe.forEach((lauf, i) => {
    const w = wurzel(i)
    if (!nachWurzel.has(w)) nachWurzel.set(w, { laeufe: [], zellen: new Map() })
    const g = nachWurzel.get(w)
    g.laeufe.push(lauf)
    for (const [x, y] of lauf.zellen) g.zellen.set(schluessel(x, y), [x, y])
  })
  return [...nachWurzel.values()]
}

/** Gibt es an dieser Stelle eine Linie von mindestens drei? */
function linieDurch(feld, x, y) {
  const s = feld[y][x]
  if (!s || s.typ <= 0) return false
  let n = 1
  for (let i = x - 1; i >= 0 && passt(feld[y][i], s.typ); i -= 1) n += 1
  for (let i = x + 1; i < BREITE && passt(feld[y][i], s.typ); i += 1) n += 1
  if (n >= 3) return true
  n = 1
  for (let i = y - 1; i >= 0 && passt(feld[i][x], s.typ); i -= 1) n += 1
  for (let i = y + 1; i < HOEHE && passt(feld[i][x], s.typ); i += 1) n += 1
  return n >= 3
}

export function hatTreffer(feld) {
  for (let y = 0; y < HOEHE; y += 1) {
    for (let x = 0; x < BREITE; x += 1) if (linieDurch(feld, x, y)) return true
  }
  return false
}

/** Ist dieser Tausch gueltig? Bombe dabei oder mindestens eine Linie danach. */
export function tauschGueltig(feld, a, b) {
  if (!benachbart(a, b) || !imFeld(...a) || !imFeld(...b)) return false
  const sa = feld[a[1]][a[0]]
  const sb = feld[b[1]][b[0]]
  if (!sa || !sb) return false
  if (sa.spezial === 'bombe' || sb.spezial === 'bombe') return true
  if (sa.typ === sb.typ) return false
  feld[a[1]][a[0]] = sb
  feld[b[1]][b[0]] = sa
  const ok = linieDurch(feld, a[0], a[1]) || linieDurch(feld, b[0], b[1])
  feld[a[1]][a[0]] = sa
  feld[b[1]][b[0]] = sb
  return ok
}

/** Alle gueltigen Tausche, jeder genau einmal (nach rechts oder unten). */
export function alleZuege(feld) {
  const zuege = []
  for (let y = 0; y < HOEHE; y += 1) {
    for (let x = 0; x < BREITE; x += 1) {
      if (x + 1 < BREITE && tauschGueltig(feld, [x, y], [x + 1, y])) zuege.push([[x, y], [x + 1, y]])
      if (y + 1 < HOEHE && tauschGueltig(feld, [x, y], [x, y + 1])) zuege.push([[x, y], [x, y + 1]])
    }
  }
  return zuege
}

export function ersterZug(feld) {
  for (let y = 0; y < HOEHE; y += 1) {
    for (let x = 0; x < BREITE; x += 1) {
      if (x + 1 < BREITE && tauschGueltig(feld, [x, y], [x + 1, y])) return [[x, y], [x + 1, y]]
      if (y + 1 < HOEHE && tauschGueltig(feld, [x, y], [x, y + 1])) return [[x, y], [x, y + 1]]
    }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Feld anlegen und mischen                                            */
/* ------------------------------------------------------------------ */

/** Ein Feld ohne Linien und mit mindestens einem Zug. */
export function neuesSpiel(zufall = Math.random) {
  const stand = { feld: [], naechsteId: 0, zufall }
  for (let versuch = 0; versuch < 200; versuch += 1) {
    const feld = []
    for (let y = 0; y < HOEHE; y += 1) {
      const reihe = []
      for (let x = 0; x < BREITE; x += 1) {
        const verboten = new Set()
        if (x >= 2 && reihe[x - 1].typ === reihe[x - 2].typ) verboten.add(reihe[x - 1].typ)
        if (y >= 2 && feld[y - 1][x].typ === feld[y - 2][x].typ) verboten.add(feld[y - 1][x].typ)
        let typ = zieheTyp(zufall)
        while (verboten.has(typ)) typ = zieheTyp(zufall)
        reihe.push(steinNeu(stand, typ))
      }
      feld.push(reihe)
    }
    if (ersterZug(feld)) {
      stand.feld = feld
      return stand
    }
  }
  throw new Error('Kein spielbares Feld gefunden')
}

/**
 * Keine Zuege mehr: dieselben Steine neu verteilen, bis keine Linie liegt
 * und ein Zug moeglich ist. Die Sonderteile bleiben erhalten.
 */
export function mischen(stand) {
  const steine = stand.feld.flat().filter(Boolean)
  for (let versuch = 0; versuch < 400; versuch += 1) {
    for (let i = steine.length - 1; i > 0; i -= 1) {
      const j = Math.floor(stand.zufall() * (i + 1))
      const t = steine[i]
      steine[i] = steine[j]
      steine[j] = t
    }
    const feld = []
    for (let y = 0; y < HOEHE; y += 1) feld.push(steine.slice(y * BREITE, (y + 1) * BREITE))
    if (!hatTreffer(feld) && ersterZug(feld)) {
      stand.feld = feld
      return feld
    }
  }
  /* Rueckfall, praktisch nie noetig: ein frisches Feld mit fortlaufenden Ids. */
  const frisch = neuesSpiel(stand.zufall)
  for (const reihe of frisch.feld) {
    for (let x = 0; x < BREITE; x += 1) reihe[x] = steinNeu(stand, reihe[x].typ)
  }
  stand.feld = frisch.feld
  return stand.feld
}

/* ------------------------------------------------------------------ */
/* Raeumen, Fallen, Nachfuellen                                        */
/* ------------------------------------------------------------------ */

function haeufigsterTyp(feld, ausser) {
  const zahl = new Array(TYPEN + 1).fill(0)
  for (let y = 0; y < HOEHE; y += 1) {
    for (let x = 0; x < BREITE; x += 1) {
      const s = feld[y][x]
      if (s && s.typ > 0 && !ausser.has(schluessel(x, y))) zahl[s.typ] += 1
    }
  }
  let best = 1
  for (let t = 2; t <= TYPEN; t += 1) if (zahl[t] > zahl[best]) best = t
  return best
}

/**
 * Die Raeumung ausweiten: Booster im Raeumbereich zuenden ihre Reihe oder
 * Spalte, eine getroffene Bombe den haeufigsten Typ. Frisch entstandene
 * Sonderteile (`geschuetzt`) bleiben stehen.
 */
function ausweiten(feld, raeumen, geschuetzt, schonGezuendet = null) {
  const offen = [...raeumen.values()]
  let booster = 0
  let bomben = 0
  const effekte = []
  const dazu = (x, y) => {
    const k = schluessel(x, y)
    if (raeumen.has(k) || geschuetzt.has(k) || !feld[y][x]) return
    raeumen.set(k, [x, y])
    offen.push([x, y])
  }
  while (offen.length) {
    const [x, y] = offen.pop()
    const s = feld[y][x]
    if (!s || !s.spezial) continue
    /* Die getauschte Bombe hat schon gewirkt, sie zuendet nicht ein zweites Mal. */
    if (schonGezuendet && schonGezuendet.has(schluessel(x, y))) continue
    if (s.spezial === 'reihe') {
      booster += 1
      effekte.push({ art: 'reihe', x, y })
      for (let i = 0; i < BREITE; i += 1) dazu(i, y)
    } else if (s.spezial === 'spalte') {
      booster += 1
      effekte.push({ art: 'spalte', x, y })
      for (let i = 0; i < HOEHE; i += 1) dazu(x, i)
    } else if (s.spezial === 'bombe') {
      bomben += 1
      const typ = haeufigsterTyp(feld, raeumen)
      effekte.push({ art: 'bombe', x, y, typ })
      for (let yy = 0; yy < HOEHE; yy += 1) {
        for (let xx = 0; xx < BREITE; xx += 1) if (feld[yy][xx]?.typ === typ) dazu(xx, yy)
      }
    }
  }
  return { booster, bomben, effekte }
}

/** Schwerkraft und Nachschub. Liefert, wie weit neue Steine von oben fallen. */
function fallenLassen(stand, feld) {
  const neuVon = {}
  for (let x = 0; x < BREITE; x += 1) {
    let ziel = HOEHE - 1
    for (let y = HOEHE - 1; y >= 0; y -= 1) {
      const s = feld[y][x]
      if (s) {
        feld[y][x] = null
        feld[ziel][x] = s
        ziel -= 1
      }
    }
    const fehlen = ziel + 1
    for (let y = ziel; y >= 0; y -= 1) {
      const s = steinNeu(stand, zieheTyp(stand.zufall))
      feld[y][x] = s
      neuVon[s.id] = fehlen
    }
  }
  return neuVon
}

/** Wo in einer Gruppe das Sonderteil entsteht. */
function sonderPlatz(feld, gruppe, bewegt, kreuz) {
  const frei = ([x, y]) => !feld[y][x].spezial
  for (const p of bewegt) {
    if (gruppe.zellen.has(schluessel(p[0], p[1])) && frei(p)) return p
  }
  if (kreuz) {
    const zaehler = new Map()
    for (const lauf of gruppe.laeufe) {
      for (const [x, y] of lauf.zellen) {
        const k = schluessel(x, y)
        zaehler.set(k, (zaehler.get(k) || 0) + 1)
      }
    }
    for (const [k, n] of zaehler) {
      if (n > 1 && frei(gruppe.zellen.get(k))) return gruppe.zellen.get(k)
    }
  }
  const laengste = gruppe.laeufe.reduce((a, b) => (b.zellen.length > a.zellen.length ? b : a))
  const mitte = laengste.zellen[Math.floor((laengste.zellen.length - 1) / 2)]
  if (frei(mitte)) return mitte
  return laengste.zellen.find(frei) || null
}

/**
 * Einen Schritt werten: welche Zellen gehen, welche Sonderteile entstehen.
 * `bombenRaeumung` ist die Raeumung aus einem Bombentausch (nur Schritt 1).
 */
function schrittPlanen(feld, bewegt, bombenRaeumung) {
  const raeumen = new Map()
  const geschuetzt = new Set()
  const neuSpezial = []
  let gezuendetBomben = 0
  const effekte = []

  if (bombenRaeumung) {
    for (const [k, p] of bombenRaeumung) raeumen.set(k, p)
    gezuendetBomben = bombenRaeumung.bomben
    effekte.push(...bombenRaeumung.effekte)
  } else {
    for (const gruppe of findeGruppen(feld)) {
      const laengste = Math.max(...gruppe.laeufe.map((l) => l.zellen.length))
      const kreuz = gruppe.laeufe.some((l) => l.richtung === 'h') && gruppe.laeufe.some((l) => l.richtung === 'v')
      let art = null
      if (laengste >= 5 || kreuz) art = 'bombe'
      else if (laengste === 4) art = gruppe.laeufe[0].richtung === 'h' ? 'reihe' : 'spalte'
      const platz = art ? sonderPlatz(feld, gruppe, bewegt, kreuz) : null
      for (const [k, p] of gruppe.zellen) {
        if (platz && k === schluessel(platz[0], platz[1])) continue
        raeumen.set(k, p)
      }
      if (platz) {
        const k = schluessel(platz[0], platz[1])
        raeumen.delete(k)
        geschuetzt.add(k)
        neuSpezial.push({
          platz,
          art,
          /* Wie der Treffer aussah: 4, 5 (oder laenger) oder 'kreuz' fuer L/T. */
          form: laengste >= 5 ? laengste : kreuz ? 'kreuz' : laengste,
          id: feld[platz[1]][platz[0]].id,
          typ: feld[platz[1]][platz[0]].typ,
        })
      }
    }
  }
  if (!raeumen.size && !neuSpezial.length) return null
  const zuendung = ausweiten(feld, raeumen, geschuetzt, bombenRaeumung ? bombenRaeumung.gezuendet : null)
  effekte.push(...zuendung.effekte)
  return {
    raeumen,
    neuSpezial,
    effekte,
    gezuendetBooster: zuendung.booster,
    gezuendetBomben: gezuendetBomben + zuendung.bomben,
  }
}

/* ------------------------------------------------------------------ */
/* Wertung                                                             */
/* ------------------------------------------------------------------ */

/** Kaskadenfaktor fuer Schritt `kombo` (1 = der Tausch selbst). */
export function kaskadeFaktor(kombo) {
  const i = Math.max(1, Math.floor(kombo)) - 1
  return KASKADE_FAKTOREN[Math.min(i, KASKADE_FAKTOREN.length - 1)]
}

export function tempoFaktor(stufe) {
  return TEMPO_FAKTOREN[Math.max(0, Math.min(TEMPO_STUFE_MAX, Math.floor(stufe) || 0))]
}

/**
 * Die Tempostufe fuer den naechsten gueltigen Tausch. `msSeitFrei` ist die
 * Zeit, seit die Eingabe nach dem letzten Zug wieder frei ist.
 */
export function serieWeiter(stufe, msSeitFrei) {
  if (!(msSeitFrei >= 0) || msSeitFrei > SERIE_MS) return 0
  return Math.min(TEMPO_STUFE_MAX, (stufe || 0) + 1)
}

/** Laeuft das Finale? Nur solange noch Zeit bleibt. */
export function istFinale(restMs) {
  return restMs > 0 && restMs <= FINALE_MS
}

/** Der Multiplikator, den die Anzeige zeigt (ohne Finale). */
export function multiplikator(kombo, tempoStufe) {
  return Math.round(kaskadeFaktor(kombo) * tempoFaktor(tempoStufe) * 100) / 100
}

export function schrittPunkte(anzahl, kombo, booster, bomben) {
  return anzahl * PUNKTE_JE_STEIN * kaskadeFaktor(kombo) + booster * BOOSTER_BONUS + bomben * BOMBE_BONUS
}

/** Die Punkte mit Finale, wie die Komponente sie vergibt. */
export function mitEndspurt(punkte, endspurt) {
  return endspurt ? Math.round(punkte * FINALE_FAKTOR) : punkte
}

/**
 * Was ein ganzer Zug bringt: jeder Schritt mit Tempo und Finale, die Summe
 * gedeckelt auf ZUG_PUNKTE_MAX. `jeSchritt` summiert sich genau zu `summe`,
 * damit die Komponente schrittweise vergeben kann.
 */
export function zugPunkte(schritte, { tempoStufe = 0, finale = false } = {}) {
  const tempo = tempoFaktor(tempoStufe)
  const fin = finale ? FINALE_FAKTOR : 1
  const jeSchritt = []
  const multi = []
  let summe = 0
  let gedeckelt = false
  for (const s of schritte || []) {
    const basis = Number.isFinite(s.punkte) ? s.punkte : schrittPunkte(s.anzahl || 0, s.kombo || 1, s.booster || 0, s.bomben || 0)
    let wert = Math.round(basis * tempo * fin)
    if (summe + wert > ZUG_PUNKTE_MAX) {
      wert = ZUG_PUNKTE_MAX - summe
      gedeckelt = true
    }
    jeSchritt.push(wert)
    multi.push(multiplikator(s.kombo || 1, tempoStufe))
    summe += wert
  }
  return { jeSchritt, multi, summe, gedeckelt }
}

/** Wie lange ein Kaskadenschritt steht (Markieren + Fallen). */
export function schrittDauerMs(schritt) {
  const effekt = schritt && (schritt.effekte?.length || schritt.bomben) ? EFFEKT_MS : 0
  return SCHRITT_MS + effekt
}

/**
 * Der Tausch. Veraendert `stand` nur, wenn er gueltig ist.
 *
 * Rueckgabe bei gueltigem Tausch:
 *   getauscht    Feld direkt nach dem Tausch
 *   schritte[]   je Kaskadenschritt: vorher (Feld), weg (Ids), neuSpezial,
 *                nachher (Feld nach Fallen), neuVon (Id → Reihen), kombo,
 *                anzahl, booster, bomben (entstanden), gezuendetBooster,
 *                gezuendetBomben, punkte
 *   gemischt     Feld nach dem Mischen oder null
 *   punkte       Summe ohne Endspurt
 */
export function tauschen(stand, a, b) {
  if (!tauschGueltig(stand.feld, a, b)) return { gueltig: false }

  const sa = stand.feld[a[1]][a[0]]
  const sb = stand.feld[b[1]][b[0]]
  const getauscht = vertauscht(stand.feld, a, b)
  let feld = getauscht
  let bombenRaeumung = null

  if (sa.spezial === 'bombe' || sb.spezial === 'bombe') {
    bombenRaeumung = new Map()
    bombenRaeumung.gezuendet = new Set([a, b].filter((p) => getauscht[p[1]][p[0]].spezial === 'bombe').map((p) => schluessel(...p)))
    if (sa.spezial === 'bombe' && sb.spezial === 'bombe') {
      for (let y = 0; y < HOEHE; y += 1) {
        for (let x = 0; x < BREITE; x += 1) bombenRaeumung.set(schluessel(x, y), [x, y])
      }
      bombenRaeumung.bomben = 2
      bombenRaeumung.effekte = [{ art: 'feld', x: b[0], y: b[1] }]
    } else {
      const partner = sa.spezial === 'bombe' ? sb : sa
      /* Die Bombe selbst steht jetzt auf der Zelle des Partners und umgekehrt. */
      const bombePlatz = sa.spezial === 'bombe' ? b : a
      bombenRaeumung.set(schluessel(...bombePlatz), bombePlatz)
      for (let y = 0; y < HOEHE; y += 1) {
        for (let x = 0; x < BREITE; x += 1) {
          if (feld[y][x].typ === partner.typ) bombenRaeumung.set(schluessel(x, y), [x, y])
        }
      }
      bombenRaeumung.bomben = 1
      bombenRaeumung.effekte = [{ art: 'bombe', x: bombePlatz[0], y: bombePlatz[1], typ: partner.typ }]
    }
  }

  const schritte = []
  let punkte = 0
  let bewegt = [b, a]
  for (let kombo = 1; kombo <= KETTE_GRENZE; kombo += 1) {
    const plan = schrittPlanen(feld, bewegt, kombo === 1 ? bombenRaeumung : null)
    if (!plan) break
    const vorher = feld
    const nachher = kopie(feld)
    const weg = []
    for (const [x, y] of plan.raeumen.values()) {
      weg.push(nachher[y][x].id)
      nachher[y][x] = null
    }
    let booster = 0
    let bomben = 0
    for (const n of plan.neuSpezial) {
      const [x, y] = n.platz
      nachher[y][x] = { id: n.id, typ: n.art === 'bombe' ? 0 : n.typ, spezial: n.art }
      if (n.art === 'bombe') bomben += 1
      else booster += 1
    }
    const neuVon = fallenLassen(stand, nachher)
    const wert = schrittPunkte(weg.length, kombo, booster, bomben)
    punkte += wert
    schritte.push({
      kombo,
      vorher,
      weg,
      neuSpezial: plan.neuSpezial.map((n) => ({ id: n.id, art: n.art, form: n.form, platz: n.platz })),
      effekte: plan.effekte,
      nachher,
      neuVon,
      anzahl: weg.length,
      booster,
      bomben,
      gezuendetBooster: plan.gezuendetBooster,
      gezuendetBomben: plan.gezuendetBomben,
      punkte: wert,
    })
    feld = nachher
    bewegt = []
  }

  stand.feld = feld
  const gemischt = ersterZug(feld) ? null : mischen(stand)
  return { gueltig: true, getauscht, schritte, gemischt, punkte, feld: stand.feld }
}

/**
 * Wie lange die Eingabe nach einem gueltigen Tausch gesperrt ist. Gleich
 * fuer volle und reduzierte Bewegung — der Takt ist Gameplay, nicht Effekt.
 * Die Komponente plant die Freigabe genau mit diesem Wert.
 */
export function aufloesungMs(ergebnis) {
  if (!ergebnis?.gueltig) return 0
  let t = TAUSCH_MS
  for (const s of ergebnis.schritte) t += schrittDauerMs(s)
  if (ergebnis.gemischt) t += MISCHEN_MS
  else if (ergebnis.schritte.length) t -= FREI_FRUEH_MS
  return Math.max(SPERRE_MS, t)
}
