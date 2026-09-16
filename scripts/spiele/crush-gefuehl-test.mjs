/**
 * Kuechen-Crush — Game Feel 2.0: die Uhr als zweite Waehrung.
 *
 *   node scripts/spiele/crush-gefuehl-test.mjs
 *
 * Der bestehende crush-logik-test.mjs prueft weiter Punkte, Sonderteile und
 * Kaskaden. Hier geht es nur um das, was mit Game Feel 2.0 dazugekommen ist:
 * Zeitboni je Treffer, der Kombo-Zuschlag, Kuehlschrank-Frost, die
 * Mega-Kombinationen und vor allem das Zusammenspiel mit der Rundenuhr —
 * letzte Kaskade laeuft fertig, Deckel haelt, kein Endlosloop.
 *
 * Die Uhr aus src/components/spiel-lauf.js ist hier als kleines Modell
 * nachgebaut (gleiche Rechnung, ohne React und ohne echte Zeit).
 */

import {
  BREITE,
  DECKEL_MS,
  FROST_AB_KOMBO,
  FROST_MS,
  HOEHE,
  OFEN_RADIUS,
  OFEN_RADIUS_WUCHT,
  SPANNUNG_MS,
  START_MS,
  TEMPO_STUFE_MAX,
  WIRKSAM,
  ZEIT_DREI,
  ZEIT_FUENF,
  ZEIT_JE_KOMBO,
  ZEIT_KOMBO_MAX,
  ZEIT_TEMPO_ANTEIL,
  ZEIT_VIER,
  ZUG_ZEIT_MAX,
  alleZuege,
  aufloesungMs,
  hatTreffer,
  istFinale,
  istWirksam,
  kopie,
  neuesSpiel,
  serieWeiter,
  tauschGueltig,
  tauschen,
  zufallMitSaat,
  zugPunkte,
  zugZeit,
} from '../../src/components/spiele/crush-logik.js'

let gut = 0
let schlecht = 0
function pruefe(name, ok, info = '') {
  if (ok) gut += 1
  else schlecht += 1
  console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${info ? ` — ${info}` : ''}`)
}

/* ------------------------------------------------------------------ */
/* Hilfen                                                              */
/* ------------------------------------------------------------------ */

/* Gleiches Grundmuster wie im Logiktest: nur Typ 2..6, nirgends drei
   gleiche. Typ 1 setzen die Tests gezielt. */
const grundTyp = (x, y) => 2 + ((x + 2 * y) % 5)

function standAus(setzen = {}, saat = 7) {
  const stand = { feld: [], naechsteId: 0, zufall: zufallMitSaat(saat) }
  for (let y = 0; y < HOEHE; y += 1) {
    const reihe = []
    for (let x = 0; x < BREITE; x += 1) {
      const vorgabe = setzen[`${x},${y}`]
      const typ = vorgabe ? vorgabe.typ : grundTyp(x, y)
      stand.naechsteId += 1
      reihe.push({ id: stand.naechsteId, typ, spezial: vorgabe?.spezial || null })
    }
    stand.feld.push(reihe)
  }
  return stand
}

const eins = { typ: 1 }

/** Ein Schritt, wie ihn `tauschen` liefert — nur die Felder, die zugZeit liest. */
const schritt = (anzahl, kombo = 1, extra = {}) => ({ anzahl, kombo, booster: 0, bomben: 0, frost: 0, ...extra })

/**
 * Die Rundenuhr aus spiel-lauf.js als Modell. `verbraucht` ist die
 * vergangene Zeit, `rest` das, was die Anzeige zeigt. Der Bonus rechnet
 * genau wie dort: er darf das Ende nie ueber DECKEL_MS hinaus schieben,
 * und aus einer bereits abgelaufenen Uhr wird ab jetzt gerechnet.
 */
function neueUhr(start = START_MS, deckel = DECKEL_MS) {
  return { verbraucht: 0, rest: start, deckel, gegeben: 0, verfallen: 0 }
}

function uhrLaufen(uhr, ms) {
  uhr.verbraucht += ms
  uhr.rest = Math.max(0, uhr.rest - ms)
}

function uhrBonus(uhr, ms) {
  if (!(ms > 0) || uhr.deckel <= 0) return 0
  const ende = Math.max(uhr.verbraucht + uhr.rest, uhr.verbraucht)
  const moeglich = Math.max(0, uhr.deckel - ende)
  const wirkt = Math.min(ms, moeglich)
  if (wirkt <= 0) {
    uhr.verfallen += ms
    return 0
  }
  uhr.rest = ende + wirkt - uhr.verbraucht
  uhr.gegeben += wirkt
  uhr.verfallen += ms - wirkt
  return wirkt
}

/* ------------------------------------------------------------------ */
/* Rundenlaenge und Deckel                                             */
/* ------------------------------------------------------------------ */

{
  pruefe('Startzeit liegt im gewuenschten Fenster 45–60 s', START_MS >= 45000 && START_MS <= 60000, `${START_MS} ms`)
  pruefe('Sicherheitsobergrenze liegt bei 90–120 s', DECKEL_MS >= 90000 && DECKEL_MS <= 120000, `${DECKEL_MS} ms`)
  pruefe('Deckel liegt ueber der Startzeit', DECKEL_MS > START_MS)
  pruefe('Spannungsphase beginnt vor dem Ende', SPANNUNG_MS > 0 && SPANNUNG_MS < START_MS, `${SPANNUNG_MS} ms`)
}

/* ------------------------------------------------------------------ */
/* Zeitbonus je Treffer                                                */
/* ------------------------------------------------------------------ */

{
  const drei = zugZeit([schritt(3)])
  const vier = zugZeit([schritt(3, 1, { booster: 1 })])
  const fuenf = zugZeit([schritt(4, 1, { bomben: 1 })])
  pruefe('Dreier gibt ZEIT_DREI', drei.summe === ZEIT_DREI, `${drei.summe}`)
  pruefe('Vierer gibt ZEIT_VIER', vier.summe === ZEIT_VIER, `${vier.summe}`)
  pruefe('Fuenfer gibt ZEIT_FUENF', fuenf.summe === ZEIT_FUENF, `${fuenf.summe}`)
  pruefe('Mehr Steine geben nie weniger Zeit', drei.summe < vier.summe && vier.summe < fuenf.summe)
  pruefe('Dreier bleibt im Rahmen 0,5–1 s', ZEIT_DREI >= 500 && ZEIT_DREI <= 1000, `${ZEIT_DREI}`)
  pruefe('Zweier (kein Treffer) gibt nichts', zugZeit([schritt(2)]).summe === 0)
  pruefe('Leerer Zug gibt nichts', zugZeit([]).summe === 0 && zugZeit(null).summe === 0)
}

{
  /* Ein echter Vierer aus dem Feld: drei Steine weg, einer wird Booster.
     Der Zeitbonus muss trotzdem der Vierer-Bonus sein. */
  const st = standAus({ '0,0': eins, '1,0': eins, '3,0': eins, '2,1': eins })
  const e = tauschen(st, [2, 0], [2, 1])
  const s1 = e.schritte[0]
  const z = zugZeit([s1])
  pruefe('Echter Vierer: nur drei Steine weg, aber Vierer-Zeit', s1.anzahl === 3 && s1.booster === 1 && z.summe === ZEIT_VIER, `${s1.anzahl} weg / ${z.summe} ms`)
}

{
  /* Und ein echter Fuenfer: vier Steine weg, einer wird Bombe. */
  const st = standAus({ '0,0': eins, '1,0': eins, '3,0': eins, '4,0': eins, '2,1': eins })
  const e = tauschen(st, [2, 0], [2, 1])
  const s1 = e.schritte[0]
  const z = zugZeit([s1])
  pruefe('Echter Fuenfer: vier Steine weg, aber Fuenfer-Zeit', s1.anzahl === 4 && s1.bomben === 1 && z.summe === ZEIT_FUENF, `${s1.anzahl} weg / ${z.summe} ms`)
}

/* ------------------------------------------------------------------ */
/* Kombo verlaengert mehr                                              */
/* ------------------------------------------------------------------ */

{
  const werte = []
  for (let k = 1; k <= 12; k += 1) werte.push(zugZeit([schritt(3, k)]).summe)
  let steigt = true
  for (let i = 1; i < werte.length; i += 1) if (werte[i] < werte[i - 1]) steigt = false
  pruefe('Zeitbonus faellt mit steigender Kombo nie', steigt, werte.join(' '))
  pruefe('Kombo 2 gibt mehr als Kombo 1', werte[1] > werte[0], `${werte[1]} > ${werte[0]}`)
  pruefe('Kombo 3 gibt genau ZEIT_DREI + 2×ZEIT_JE_KOMBO', werte[2] === ZEIT_DREI + 2 * ZEIT_JE_KOMBO, `${werte[2]}`)
  pruefe('Kombo-Zuschlag ist bei ZEIT_KOMBO_MAX gedeckelt', werte[11] === ZEIT_DREI + ZEIT_KOMBO_MAX, `${werte[11]}`)
  pruefe('Ohne Treffer kein Kombo-Zuschlag', zugZeit([schritt(0, 9)]).summe === 0)
}

{
  /* Eine Kaskade ist deutlich mehr wert als ein einzelner Treffer — und sie
     kostet nur einen Zug. Drei getrennte Zuege waeren zwar in der Summe
     aehnlich, brauchen aber die dreifache Zeit. */
  const kette = zugZeit([schritt(3, 1), schritt(3, 2), schritt(3, 3)]).summe
  const einzeln = zugZeit([schritt(3, 1)]).summe
  pruefe('Kaskade gibt viel mehr Zeit als ein Einzeltreffer', kette >= einzeln * 2.5, `${kette} gegen ${einzeln}`)
}

{
  /* Der Treffer-Bonus wird je Zug nur einmal gezahlt — sonst liefe auch
     blindes Spiel dauerhaft am Deckel. Es zaehlt der beste Treffer. */
  const vieleDreier = zugZeit([schritt(3), schritt(3), schritt(3)]).summe
  const einDreier = zugZeit([schritt(3)]).summe
  pruefe('Treffer-Bonus wird je Zug nur einmal gezahlt', vieleDreier < 3 * einDreier, `${vieleDreier} statt ${3 * einDreier}`)
  const spaetFuenf = zugZeit([schritt(3, 1), schritt(4, 2, { bomben: 1 })])
  pruefe('Es zaehlt der beste Treffer, auch spaet in der Kaskade', spaetFuenf.summe === ZEIT_FUENF + ZEIT_JE_KOMBO, `${spaetFuenf.summe}`)
  pruefe('Der Grundbonus haengt am besten Schritt', spaetFuenf.jeSchritt[1] > spaetFuenf.jeSchritt[0], spaetFuenf.jeSchritt.join(' / '))
}

/* ------------------------------------------------------------------ */
/* Tempo                                                               */
/* ------------------------------------------------------------------ */

{
  const ohne = zugZeit([schritt(3)]).summe
  const mit = zugZeit([schritt(3)], { tempoStufe: TEMPO_STUFE_MAX }).summe
  const erwartet = Math.round((ZEIT_DREI * (1 + ZEIT_TEMPO_ANTEIL * TEMPO_STUFE_MAX)) / 10) * 10
  pruefe('Tempostufe erhoeht den Zeitbonus', mit > ohne && mit === erwartet, `${ohne} → ${mit}`)
  pruefe('Tempostufe ist nach oben begrenzt', zugZeit([schritt(3)], { tempoStufe: 99 }).summe === mit)
  pruefe('Negative Tempostufe wirkt wie Stufe 0', zugZeit([schritt(3)], { tempoStufe: -5 }).summe === ohne)
  pruefe('Zeitbonus ist immer auf 10 ms gerundet', [ohne, mit].every((v) => v % 10 === 0), `${ohne} / ${mit}`)
}

/* ------------------------------------------------------------------ */
/* Kuehlschrank (Frost)                                                */
/* ------------------------------------------------------------------ */

{
  const z = zugZeit([schritt(0, 1, { frost: 1 })])
  pruefe('Kuehlschrank gibt FROST_MS', z.summe === FROST_MS && z.jeFrost[0] === FROST_MS, `${z.summe}`)
  const zwei = zugZeit([schritt(3, 1, { frost: 2 })])
  pruefe('Zwei Kuehlschraenke zaehlen doppelt, Treffer kommt dazu', zwei.summe === ZEIT_DREI + 2 * FROST_MS, `${zwei.summe}`)
  pruefe('Frost wird getrennt ausgewiesen', zwei.jeFrost[0] === 2 * FROST_MS && zwei.jeSchritt[0] === zwei.summe)
  pruefe('Kuehlschrank ist kein tauschbares Sonderteil', !WIRKSAM.includes('frost') && !istWirksam({ spezial: 'frost' }))
  pruefe('Kuehlschrank entsteht erst ab einer echten Kette', FROST_AB_KOMBO >= 3, `ab Kombo ${FROST_AB_KOMBO}`)
}

{
  /* Ein Kuehlschrank im Raeumbereich eines Reihen-Blasters. Typ 3 ist der
     Typ, den (5,3) ohnehin haette — der Kuehlschrank erzeugt also keinen
     zusaetzlichen Treffer. */
  const st = standAus({
    '0,3': { typ: 1, spezial: 'reihe' },
    '1,3': eins,
    '2,4': eins,
    '5,3': { typ: grundTyp(5, 3), spezial: 'frost' },
  })
  pruefe('Frost-Aufbau: Vorbedingung ohne Linie', !hatTreffer(st.feld))
  const e = tauschen(st, [2, 3], [2, 4])
  const s1 = e.schritte[0]
  pruefe('Geraeumter Kuehlschrank wird gezaehlt', s1.frost === 1, `frost ${s1.frost}`)
  pruefe('Kuehlschrank hinterlaesst einen Frost-Effekt', s1.effekte.some((f) => f.art === 'frost' && f.x === 5 && f.y === 3), JSON.stringify(s1.effekte))
  pruefe('Kuehlschrank zuendet selbst nichts', s1.anzahl === BREITE, `${s1.anzahl} weg`)
  pruefe('Der Zug gibt Reihen- und Frost-Zeit', zugZeit([s1]).jeFrost[0] === FROST_MS)
}

/* ------------------------------------------------------------------ */
/* Special-Kombinationen                                               */
/* ------------------------------------------------------------------ */

{
  for (const art of WIRKSAM) pruefe(`istWirksam erkennt ${art}`, istWirksam({ spezial: art }))
  pruefe('istWirksam lehnt gewoehnliche Steine ab', !istWirksam({ spezial: null }) && !istWirksam(null))
}

{
  /* Reihe + Spalte nebeneinander: ohne Linie tauschbar, ergibt das Kreuz. */
  const st = standAus({ '2,3': { typ: 1, spezial: 'reihe' }, '3,3': { typ: 1, spezial: 'spalte' } })
  pruefe('Mega: Reihe + Spalte ist auch ohne Linie tauschbar', !hatTreffer(st.feld) && tauschGueltig(st.feld, [2, 3], [3, 3]))
  const e = tauschen(st, [2, 3], [3, 3])
  const s1 = e.schritte[0]
  pruefe('Mega: Effekt mega vorhanden', s1.effekte.some((f) => f.art === 'mega'), JSON.stringify(s1.effekte.map((f) => f.art)))
  pruefe('Mega Reihe + Spalte raeumt Reihe und Spalte', s1.anzahl === BREITE + HOEHE - 1, `${s1.anzahl} statt ${BREITE + HOEHE - 1}`)
  pruefe('Mega Reihe + Spalte ist nicht "stark"', !s1.effekte.find((f) => f.art === 'mega')?.stark)
}

{
  /* Gleiches auf Gleiches zuendet mit Wucht: drei Reihen statt einer. */
  const st = standAus({ '2,3': { typ: 1, spezial: 'reihe' }, '3,3': { typ: 1, spezial: 'reihe' } })
  const e = tauschen(st, [2, 3], [3, 3])
  const s1 = e.schritte[0]
  pruefe('Mega gleich auf gleich ist stark', s1.effekte.find((f) => f.art === 'mega')?.stark === true)
  pruefe('Starke Reihe raeumt drei Reihen', s1.anzahl === 3 * BREITE, `${s1.anzahl} statt ${3 * BREITE}`)
}

{
  /* Zwei Backoefen: 5×5 statt 3×3. */
  const st = standAus({ '2,3': { typ: 1, spezial: 'ofen' }, '3,3': { typ: 1, spezial: 'ofen' } })
  const e = tauschen(st, [2, 3], [3, 3])
  const s1 = e.schritte[0]
  const oefen = s1.effekte.filter((f) => f.art === 'ofen')
  pruefe('Mega: zwei Backoefen zuenden beide', oefen.length === 2)
  pruefe('Mega: Backofen mit Wucht hat den grossen Radius', oefen.every((f) => f.stark && f.r === OFEN_RADIUS_WUCHT), JSON.stringify(oefen.map((f) => f.r)))
  pruefe('Backofen-Radien sind sauber gestaffelt', OFEN_RADIUS_WUCHT > OFEN_RADIUS && OFEN_RADIUS === 1)
}

{
  /* Zwei Bomben bleiben das Vollfeld — der bestehende Sonderweg. */
  const st = standAus({ '3,3': { typ: 0, spezial: 'bombe' }, '3,4': { typ: 0, spezial: 'bombe' } })
  const e = tauschen(st, [3, 3], [3, 4])
  const s1 = e.schritte[0]
  pruefe('Bombe + Bombe raeumt weiter das ganze Feld', s1.anzahl === BREITE * HOEHE && s1.effekte[0]?.art === 'feld')
  pruefe('Vollfeld gibt Fuenfer-Zeit', zugZeit([s1]).jeSchritt[0] >= ZEIT_FUENF)
}

{
  /* Ein Kuehlschrank neben einem Blaster ist KEIN Mega-Tausch. */
  const st = standAus({ '2,3': { typ: 1, spezial: 'reihe' }, '3,3': { typ: grundTyp(3, 3), spezial: 'frost' } })
  pruefe('Kuehlschrank + Blaster ist kein gueltiger Tausch', !tauschGueltig(st.feld, [2, 3], [3, 3]))
}

/* ------------------------------------------------------------------ */
/* Deckel je Zug                                                       */
/* ------------------------------------------------------------------ */

{
  const viele = []
  for (let i = 0; i < 40; i += 1) viele.push(schritt(6, 8))
  const z = zugZeit(viele)
  pruefe('Ein einzelner Zug ist bei ZUG_ZEIT_MAX gedeckelt', z.summe === ZUG_ZEIT_MAX && z.gedeckelt, `${z.summe}`)
  pruefe('jeSchritt summiert sich genau auf summe', z.jeSchritt.reduce((a, b) => a + b, 0) === z.summe)
  pruefe('Kein Schritt ist negativ', z.jeSchritt.every((v) => v >= 0))
  const frostViel = zugZeit([schritt(0, 1, { frost: 20 })])
  pruefe('Auch reiner Frost wird gedeckelt', frostViel.summe === ZUG_ZEIT_MAX && frostViel.jeFrost[0] === ZUG_ZEIT_MAX)
}

/* ------------------------------------------------------------------ */
/* Die Uhr: Bonus, Deckel, letzte Kaskade                              */
/* ------------------------------------------------------------------ */

{
  const uhr = neueUhr()
  uhrLaufen(uhr, 10000)
  const gegeben = uhrBonus(uhr, 2000)
  pruefe('Zeitbonus landet voll auf der Uhr', gegeben === 2000 && uhr.rest === START_MS - 10000 + 2000, `${uhr.rest}`)
}

{
  const uhr = neueUhr()
  let summe = 0
  for (let i = 0; i < 200; i += 1) summe += uhrBonus(uhr, 5000)
  pruefe('Die Uhr kommt nie ueber den Deckel', uhr.verbraucht + uhr.rest <= DECKEL_MS, `${uhr.verbraucht + uhr.rest}`)
  pruefe('Ueber dem Deckel gibt es nichts mehr', summe === DECKEL_MS - START_MS && uhrBonus(uhr, 5000) === 0, `${summe}`)
  pruefe('Verfallene Zeit wird nicht heimlich gutgeschrieben', uhr.verfallen > 0)
}

{
  const uhr = neueUhr()
  pruefe('Negativer oder leerer Bonus tut nichts', uhrBonus(uhr, 0) === 0 && uhrBonus(uhr, -500) === 0 && uhr.rest === START_MS)
  const ohneDeckel = neueUhr(START_MS, 0)
  pruefe('Ohne Deckel gibt es gar keinen Bonus', uhrBonus(ohneDeckel, 2000) === 0 && ohneDeckel.rest === START_MS)
}

{
  /* Die Uhr faellt waehrend einer Kaskade auf null. Die Kette wird zu Ende
     gerechnet; weil dabei Zeit zurueckkommt, laeuft die Runde weiter. */
  const uhr = neueUhr()
  uhrLaufen(uhr, START_MS - 300)
  const schritte = [schritt(3, 1), schritt(4, 2, { booster: 1 }), schritt(5, 3)]
  const zeit = zugZeit(schritte)
  let abgelaufen = false
  for (let i = 0; i < schritte.length; i += 1) {
    /* Der erste Schritt allein dauert laenger als die Restzeit. */
    uhrLaufen(uhr, 400)
    if (uhr.rest === 0) abgelaufen = true
    uhrBonus(uhr, zeit.jeSchritt[i])
  }
  pruefe('Die Uhr war waehrend der Kaskade wirklich bei null', abgelaufen)
  pruefe('Nach der Kaskade laeuft die Runde weiter', uhr.rest > 0, `${uhr.rest} ms uebrig`)
  pruefe('Die Kaskade wurde vollstaendig verrechnet', uhr.gegeben === zeit.summe, `${uhr.gegeben} / ${zeit.summe}`)
}

{
  /* Gegenprobe: eine Kaskade ohne Zeitbonus verlaengert nichts. */
  const uhr = neueUhr()
  uhrLaufen(uhr, START_MS)
  uhrBonus(uhr, zugZeit([schritt(2, 1)]).summe)
  pruefe('Kaskade ohne Treffer verlaengert die Runde nicht', uhr.rest === 0)
}

{
  /* Und am Deckel: die letzte Kaskade laeuft, aber sie schiebt nicht mehr. */
  const uhr = neueUhr()
  uhr.rest = 400
  uhr.verbraucht = DECKEL_MS - 400
  const zeit = zugZeit([schritt(5, 4), schritt(5, 5)])
  let gegeben = 0
  for (const ms of zeit.jeSchritt) gegeben += uhrBonus(uhr, ms)
  uhrLaufen(uhr, 400)
  pruefe('Am Deckel gibt die letzte Kaskade keine Zeit mehr', gegeben === 0 && uhr.rest === 0, `${gegeben}`)
}

/* ------------------------------------------------------------------ */
/* Ganze Runden: kein Endlosloop, Fenster fuer die Servergrenzen       */
/* ------------------------------------------------------------------ */

/* Harte Notbremse. Greift sie, ist etwas grundsaetzlich falsch — deshalb
   ist sie selbst eine Zusicherung und keine stille Rettung. */
const ZUEGE_GRENZE = 5000

/* Wie lange die Runde nach dem Abpfiff hoechstens noch nachlaeuft, damit
   eine Kaskade fertig wird. Wert aus src/components/spiel-lauf.js. */
const NACHSPIEL_MAX_MS = 8000

/**
 * Ein kompletter Lauf mit Uhr. `guete` sagt, wie gut gespielt wird: 'best'
 * nimmt immer den Zug mit den meisten Grundpunkten, 'zufall' greift blind
 * zu — so sieht man, ob ein schwacher Spieler wirklich bei der Startzeit
 * bleibt. Nach der Freigabe wird `pause()` ms gewartet. Zeit kommt Schritt
 * fuer Schritt zurueck, genau wie in der Komponente; eine angefangene
 * Aufloesung wird immer zu Ende gerechnet.
 */
function lauf(saat, pause, guete = 'best') {
  const zufall = zufallMitSaat(saat)
  const st = neuesSpiel(zufall)
  const uhr = neueUhr()
  let stufe = 0
  let punkte = 0
  let runden = 0
  let maxZug = 0
  let erstes = true
  let notbremse = false
  for (;;) {
    if (runden >= ZUEGE_GRENZE) {
      notbremse = true
      break
    }
    const warte = Math.round(pause(zufall))
    uhrLaufen(uhr, warte)
    if (uhr.rest <= 0) break
    const zuege = alleZuege(st.feld)
    if (!zuege.length) break
    let best = zuege[Math.min(zuege.length - 1, Math.floor(zufall() * zuege.length))]
    if (guete === 'best') {
      let bestWert = -1
      for (const [a, b] of zuege) {
        const probe = { feld: kopie(st.feld), naechsteId: st.naechsteId, zufall: zufallMitSaat(saat + runden) }
        const w = tauschen(probe, a, b).punkte
        if (w > bestWert) {
          bestWert = w
          best = [a, b]
        }
      }
    }
    const e = tauschen(st, best[0], best[1])
    if (!e.gueltig) break
    stufe = erstes ? 0 : serieWeiter(stufe, warte)
    erstes = false
    runden += 1
    const z = zugPunkte(e.schritte, { tempoStufe: stufe, finale: istFinale(uhr.rest) })
    const t = zugZeit(e.schritte, { tempoStufe: stufe })
    punkte += z.summe
    maxZug = Math.max(maxZug, z.summe)
    /* Die Aufloesung laeuft, egal wie die Uhr steht — und gibt dabei Zeit. */
    const dauer = aufloesungMs(e)
    for (let i = 0; i < e.schritte.length; i += 1) {
      uhrLaufen(uhr, Math.round(dauer / e.schritte.length))
      uhrBonus(uhr, t.jeSchritt[i])
    }
  }
  return { punkte, runden, maxZug, dauer: uhr.verbraucht, gegeben: uhr.gegeben, notbremse }
}

function profil(name, pause, laeufe, guete = 'best') {
  const erg = []
  for (let i = 0; i < laeufe; i += 1) erg.push(lauf(1000 + i * 7919, pause, guete))
  const p = erg.map((r) => r.punkte).sort((a, b) => a - b)
  const d = erg.map((r) => r.dauer)
  const schnitt = Math.round(p.reduce((a, b) => a + b, 0) / p.length)
  const max = p[p.length - 1]
  const p90 = p[Math.floor(p.length * 0.9)]
  const maxRunden = Math.max(...erg.map((x) => x.runden))
  const maxZug = Math.max(...erg.map((x) => x.maxZug))
  const maxDauer = Math.max(...d)
  /* Der Median sagt mehr ueber das Spielgefuehl als der Ausreisser nach oben:
     ein einzelner Glueckslauf darf den Deckel streifen, der Normalfall nicht. */
  const sortiert = [...d].sort((a, b) => a - b)
  const medianDauer = sortiert[Math.floor(sortiert.length / 2)]
  console.log(
    `     ${name.padEnd(26)} Schnitt ${String(schnitt).padStart(6)}  P90 ${String(p90).padStart(6)}  Max ${String(max).padStart(6)}  ` +
      `Dauer ${(Math.min(...d) / 1000).toFixed(1)}/${(medianDauer / 1000).toFixed(1)}/${(maxDauer / 1000).toFixed(1)} s (min/mittel/max)  ` +
      `Zuege bis ${maxRunden}  bester Zug ${maxZug}`,
  )
  return { schnitt, max, p90, maxRunden, maxZug, maxDauer, medianDauer, erg }
}

{
  const gleich = (von, bis) => (z) => von + z() * (bis - von)
  /* Fuenf Spielweisen. "schwach" heisst nicht nur langsam, sondern vor allem
     blind: der Zug wird zufaellig aus den gueltigen gewaehlt, ohne Blick auf
     Kaskaden oder Sonderteile — genau das macht einen schwachen Match-3-
     Spieler aus. "mittel" spielt ebenso blind, aber zuegiger. Ab "gut" wird
     jeweils der punktbeste Zug gesucht. */
  const schwach = profil('schwach, blind 3–6 s', gleich(3000, 6000), 30, 'zufall')
  const mittel = profil('mittel, blind 1,5–3 s', gleich(1500, 3000), 30, 'zufall')
  const gutSpiel = profil('gut, beste Zuege 1,2–2,5 s', gleich(1200, 2500), 30)
  const sehrGut = profil('sehr gut 450–700 ms', gleich(450, 700), 30)
  const bot = profil('Bot ohne Pause (Extrem)', () => 0, 20)
  const alle = [...schwach.erg, ...mittel.erg, ...gutSpiel.erg, ...sehrGut.erg, ...bot.erg]
  const decke = DECKEL_MS + NACHSPIEL_MAX_MS

  pruefe('Kein Lauf braucht die Notbremse', alle.every((r) => !r.notbremse))
  pruefe('Jeder Lauf endet', alle.every((r) => r.runden > 0 && r.dauer > 0))
  pruefe('Kein Lauf ueberschreitet Deckel plus Nachspiel', alle.every((r) => r.dauer <= decke), `${Math.max(...alle.map((r) => r.dauer))} von ${decke} ms`)
  pruefe('Kein Lauf bekommt mehr Zeit als der Deckel hergibt', alle.every((r) => r.gegeben <= DECKEL_MS - START_MS), `${Math.max(...alle.map((r) => r.gegeben))}`)
  /* Gemessen wird der Normalfall, nicht der Ausreisser: ein einzelner
     Glueckslauf darf auch blind mal laenger werden, die Regel ist es nicht. */
  pruefe('Schwache Laeufe bleiben im Startfenster', schwach.medianDauer < START_MS + 20000, `${(schwach.medianDauer / 1000).toFixed(1)} s`)
  pruefe('Auch der beste schwache Lauf bleibt unter der Haelfte des Deckels', schwach.maxDauer < START_MS + 40000, `${(schwach.maxDauer / 1000).toFixed(1)} s`)
  pruefe('Gute Laeufe verlaengern die Runde deutlich', sehrGut.medianDauer > schwach.medianDauer + 25000, `${(sehrGut.medianDauer / 1000).toFixed(1)} s gegen ${(schwach.medianDauer / 1000).toFixed(1)} s`)
  pruefe('Koennen schlaegt Blindspielen', gutSpiel.schnitt > schwach.schnitt * 2, `${gutSpiel.schnitt} / ${schwach.schnitt}`)
  pruefe('Schnelles Spiel lohnt sich mehr als langsames', sehrGut.schnitt > gutSpiel.schnitt * 1.4, `${sehrGut.schnitt} / ${gutSpiel.schnitt}`)

  /* Die Zahlen, aus denen §10 spaeter die Servergrenzen ableitet. Hier nur
     festhalten, nicht setzen — api/_terminal-kern.js bleibt unberuehrt. */
  console.log('')
  console.log('     Fenster fuer die Servergrenzen (kuechen_crush):')
  console.log(`       Startzeit ${START_MS} ms, Deckel ${DECKEL_MS} ms`)
  console.log(`       schwacher Spieler:  Max ${schwach.max} Punkte, Dauer bis ${(schwach.maxDauer / 1000).toFixed(1)} s`)
  console.log(`       sehr guter Mensch: Max ${sehrGut.max} Punkte, Dauer bis ${(sehrGut.maxDauer / 1000).toFixed(1)} s, bester Zug ${sehrGut.maxZug}`)
  console.log(`       Bot ohne Pause:    Max ${bot.max} Punkte, Dauer bis ${(bot.maxDauer / 1000).toFixed(1)} s, bester Zug ${bot.maxZug}, Zuege bis ${bot.maxRunden}`)
  console.log(`       ms je Zug minimal: ${Math.round(bot.maxDauer / bot.maxRunden)}`)
}

console.log(`\nKuechen-Crush Game Feel: ${gut} OK, ${schlecht} Fehler`)
if (schlecht) process.exit(1)
