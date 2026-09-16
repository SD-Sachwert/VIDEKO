/*
 * Reine Node-Tests fuer das Spielgefuehl von Kuechen-Merge:
 * Chains, Spezialteile, Fieber, Sprueche und die Wertung.
 * Kein React, kein DOM — nur die Logik aus merge-logik.js.
 * Aufruf: node scripts/spiele/merge-gefuehl-test.mjs
 */
import {
  ABWURF_MAX,
  CHAIN_ANTEIL,
  CHAIN_ESKALIERT,
  CHAIN_MAX,
  CHAIN_S,
  FAKTOR_MAX,
  FIEBER_COMBOS,
  FIEBER_MULT,
  FIEBER_S,
  FROST_S,
  GOLD_MULT,
  GOLD_S,
  HOEHE,
  KOMBO_MAX,
  KOMBO_S,
  SPEZIAL,
  SPEZIAL_ANTEIL,
  SPRUCH_PAUSE,
  SPRUECHE,
  STUFEN,
  TRAUM_PUNKTE,
  abwerfen,
  basisPunkte,
  chainFaktor,
  chainWeiter,
  fieberAktiv,
  frostAktiv,
  gesamtFaktor,
  goldAktiv,
  komboFaktor,
  neuesSpiel,
  schritt,
  simulieren,
  spezialTreffer,
  spezialWaehlen,
  spruchHolen,
} from '../../src/components/spiele/merge-logik.js'

let ok = 0
let fehler = 0
function pruefe(name, bedingung, info = '') {
  if (bedingung) {
    ok += 1
    console.log(`OK     ${name}`)
  } else {
    fehler += 1
    console.log(`FEHLER ${name}${info ? ` — ${info}` : ''}`)
  }
}

/** Deterministischer Zufall (mulberry32). */
function saat(s) {
  let a = s >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ein Koerper, direkt gelegt (wie abwerfen, aber mit freier Stufe und Lage). */
function legen(stand, stufe, x, y) {
  stand.nr += 1
  const r = STUFEN[stufe].r
  const k = { id: stand.nr, stufe, x, y, px: x, py: y, vx: 0, vy: 0, r, rZiel: r, m: r * r, winkel: 0, stuetze: false, geboren: stand.zeit, ueber: 0, spezial: null }
  stand.koerper.push(k)
  return k
}

/** Ein Paar Stufe-0-Teile, das sich im naechsten Schritt beruehrt. */
function paarLegen(stand, stufe = 0, x = 50, y = HOEHE - STUFEN[stufe].r) {
  const r = STUFEN[stufe].r
  return [legen(stand, stufe, x - r, y), legen(stand, stufe, x + r, y)]
}

/** Ein sauberer Tisch: nur dieses eine Paar, sonst nichts. */
function nurEinPaar(stand, stufe = 0) {
  stand.koerper = []
  return paarLegen(stand, stufe)
}

/* ---------------------------------------------------------------- */
console.log('\n— Chain: reine Rechenwerte')
pruefe('chainFaktor: 1 ohne Kette, +30 % je Glied', chainFaktor(0) === 1 && chainFaktor(1) === 1 && Math.abs(chainFaktor(2) - (1 + CHAIN_ANTEIL)) < 1e-9)
pruefe('chainFaktor gedeckelt bei CHAIN_MAX', chainFaktor(CHAIN_MAX) === chainFaktor(CHAIN_MAX + 9), `${chainFaktor(CHAIN_MAX)}`)
pruefe('chainWeiter: im Fenster +1, danach zurueck auf 1', chainWeiter(2, 1, 1 + CHAIN_S - 0.01) === 3 && chainWeiter(2, 1, 1 + CHAIN_S + 0.01) === 1 && chainWeiter(0, null, 5) === 1)
pruefe('Chain-Fenster ist enger als das Kombo-Fenster', CHAIN_S < KOMBO_S, `${CHAIN_S} < ${KOMBO_S}`)
pruefe('CHAIN_ESKALIERT liegt im erreichbaren Bereich', CHAIN_ESKALIERT >= 2 && CHAIN_ESKALIERT <= CHAIN_MAX, `${CHAIN_ESKALIERT}/${CHAIN_MAX}`)

/* ---------------------------------------------------------------- */
console.log('\n— Normaler Clear: nichts eskaliert von allein')
{
  const stand = neuesSpiel(saat(101))
  stand.zufall = () => 1 // kein Spezialteil, kein Rauschen
  nurEinPaar(stand)
  const ev = simulieren(stand, 0.3)
  const merges = ev.filter((e) => e.art === 'merge')
  const e = merges[0]
  pruefe('Genau eine Verschmelzung, genau ein Teil bleibt', merges.length === 1 && stand.koerper.length === 1 && stand.koerper[0].stufe === 1)
  pruefe('Schlichter Clear: kette 1, chain 1, faktor 1', e && e.kette === 1 && e.chain === 1 && e.faktor === 1, JSON.stringify(e))
  pruefe('Schlichter Clear zahlt genau basisPunkte', e && e.punkte === basisPunkte(1), `${e && e.punkte} vs ${basisPunkte(1)}`)
  pruefe('Schlichter Clear eskaliert nicht und spricht nicht', e && e.eskaliert === false && e.spruch === null)
  pruefe('Schlichter Clear zuendet kein Fieber', !ev.some((x) => x.art === 'fieber') && !fieberAktiv(stand))
  pruefe('Ereignis traegt Ort und Stufe fuer die Anzeige', e && Number.isFinite(e.x) && Number.isFinite(e.y) && e.stufe === 1)
}

/* ---------------------------------------------------------------- */
console.log('\n— Kettenreaktion: vier Merges in einem Schritt')
{
  const stand = neuesSpiel(saat(102))
  stand.zufall = () => 1
  const r = STUFEN[0].r
  for (let i = 0; i < 8; i += 1) legen(stand, 0, 18 + i * 2 * r, HOEHE - r)
  const ev = schritt(stand)
  const merges = ev.filter((e) => e.art === 'merge')
  const chains = merges.map((e) => e.chain)
  const punkte = merges.map((e) => e.punkte)
  pruefe('Acht Gleiche in Reihe: vier Verschmelzungen in EINEM Schritt', merges.length === 4, `${merges.length}`)
  pruefe('Chain zaehlt 1,2,3,4 hoch', chains.join(',') === '1,2,3,4', chains.join(','))
  pruefe('stand.chain und stand.chainMax sind gesetzt', stand.chain === 4 && stand.chainMax === 4, `chain=${stand.chain} max=${stand.chainMax}`)
  pruefe('Punkte steigen mit jedem Kettenglied streng', punkte.every((p, i) => i === 0 || p > punkte[i - 1]), punkte.join(','))
  pruefe('Erst ab CHAIN_ESKALIERT ist eskaliert wahr', merges.filter((e) => e.eskaliert).length === 4 - CHAIN_ESKALIERT + 1 && merges[3].eskaliert === true, merges.map((e) => e.eskaliert).join(','))
  pruefe('Die Eskalation bringt einen Spruch mit', typeof merges[3].spruch === 'string' && SPRUECHE.chain.includes(merges[3].spruch), String(merges[3].spruch))
  pruefe('Viertes Glied bringt deutlich mehr als das erste', punkte[3] > punkte[0] * 2, `${punkte[0]} -> ${punkte[3]}`)

  /* Die Chain faellt frueher zurueck als die Kombo. */
  simulieren(stand, CHAIN_S + 0.08)
  pruefe('Nach CHAIN_S ohne Merge: chain 0, kette laeuft weiter', stand.chain === 0 && stand.kette > 0, `chain=${stand.chain} kette=${stand.kette}`)
}

/* ---------------------------------------------------------------- */
console.log('\n— Wertung: mit Combo und Chain deutlich mehr als ohne')
{
  const schlicht = neuesSpiel(saat(103))
  schlicht.zufall = () => 1
  nurEinPaar(schlicht)
  const einzeln = simulieren(schlicht, 0.3).find((e) => e.art === 'merge')

  const kette = neuesSpiel(saat(104))
  kette.zufall = () => 1
  const r = STUFEN[0].r
  for (let i = 0; i < 8; i += 1) legen(kette, 0, 18 + i * 2 * r, HOEHE - r)
  const gekettet = schritt(kette).filter((e) => e.art === 'merge')
  const bester = gekettet[gekettet.length - 1]

  pruefe('Gleiche Stufe, gleiche Basis — nur der Faktor trennt', einzeln.stufe === bester.stufe)
  pruefe('Combo+Chain schlaegt den schlichten Clear', bester.punkte > einzeln.punkte, `${einzeln.punkte} vs ${bester.punkte}`)
  pruefe('Die Kette bringt in Summe mehr als vier schlichte Clears', gekettet.reduce((s, e) => s + e.punkte, 0) > 4 * einzeln.punkte, `${gekettet.reduce((s, e) => s + e.punkte, 0)} vs ${4 * einzeln.punkte}`)

  /* Der Gesamtfaktor rein durchgerechnet. */
  const ruhig = { zeit: 0, fieber: false, fieberBis: 0, goldBis: 0, frostBis: 0 }
  const heiss = { zeit: 0, fieber: true, fieberBis: 99, goldBis: 99, frostBis: 0 }
  pruefe('gesamtFaktor ohne alles ist exakt 1', gesamtFaktor(ruhig, 1, 1) === 1)
  pruefe('Fieber multipliziert mit FIEBER_MULT', gesamtFaktor({ ...ruhig, fieber: true, fieberBis: 99 }, 1, 1) === FIEBER_MULT)
  pruefe('Gold multipliziert mit GOLD_MULT', gesamtFaktor({ ...ruhig, goldBis: 99 }, 1, 1) === GOLD_MULT)
  pruefe('Alles zusammen wird bei FAKTOR_MAX hart gedeckelt', gesamtFaktor(heiss, KOMBO_MAX + 5, CHAIN_MAX + 5) === FAKTOR_MAX, `${gesamtFaktor(heiss, KOMBO_MAX + 5, CHAIN_MAX + 5)}`)
  pruefe('Roher Faktor waere ohne Deckel groesser als FAKTOR_MAX', komboFaktor(KOMBO_MAX) * chainFaktor(CHAIN_MAX) * FIEBER_MULT * GOLD_MULT > FAKTOR_MAX)
  pruefe('Der Abwurfdeckel greift vor dem Faktordeckel', TRAUM_PUNKTE * FAKTOR_MAX > ABWURF_MAX, `${TRAUM_PUNKTE * FAKTOR_MAX} vs ${ABWURF_MAX}`)
}

/* ---------------------------------------------------------------- */
console.log('\n— Spezialteile: Entstehen')
{
  pruefe('Kein Spezialteil aus einem kleinen Teil', spezialWaehlen(0, 9, 9, true, () => 0) === null && spezialWaehlen(2, 9, 9, true, () => 0) === null)
  pruefe('Kein Spezialteil, wenn der Wurf danebengeht', spezialWaehlen(8, 9, 9, true, () => 1) === null)
  pruefe('Hohe Stufe + lange Kombo: GROSSOFEN gewinnt zuerst', spezialWaehlen(6, 5, 3, false, () => 0) === 'ofen')
  pruefe('Lange Kombo ab Stufe 4: ZEILENBLITZ', spezialWaehlen(4, 4, 1, false, () => 0) === 'blitz')
  pruefe('Kurze Kette ab Stufe 3: BOMBE', spezialWaehlen(3, 1, 1, false, () => 0) === 'bombe')
  pruefe('Eine echte Chain oeffnet dieselbe Tuer wie eine lange Kombo', spezialWaehlen(4, 1, 2, false, () => 0) === 'blitz')
  /* Genau zwischen Grundchance und Fieberchance: nur im Fieber ein Treffer. */
  const dazwischen = () => 0.3
  pruefe('Fieber hebt die Chance ueber die Schwelle', spezialWaehlen(3, 1, 1, false, dazwischen) === null && spezialWaehlen(3, 1, 1, true, dazwischen) === 'bombe')
  {
    const z1 = saat(31)
    const z2 = saat(31)
    let ohne = 0
    let mit = 0
    for (let i = 0; i < 6000; i += 1) {
      if (spezialWaehlen(6, 5, 3, false, z1)) ohne += 1
      if (spezialWaehlen(6, 5, 3, true, z2)) mit += 1
    }
    pruefe('Im Fieber fallen messbar mehr Spezialteile', mit > ohne * 1.2, `ohne=${ohne} mit=${mit}`)
  }

  /* Ende zu Ende: ein Merge setzt die Eigenschaft, ohne neuen Koerper. */
  const stand = neuesSpiel(saat(105))
  stand.zufall = () => 0 // erste passende Regel gewinnt
  nurEinPaar(stand, 2)
  const ev = schritt(stand)
  const geboren = ev.find((e) => e.art === 'spezial-geboren')
  pruefe('Merge erzeugt ein spezial-geboren-Ereignis', !!geboren && geboren.spezial === 'bombe' && geboren.wort === SPEZIAL.bombe.wort, JSON.stringify(geboren))
  pruefe('Die Geburt haengt am neuen Teil, nicht an einem Extra-Koerper', stand.koerper.length === 1 && stand.koerper[0].spezial === 'bombe', `${stand.koerper.length}`)
  pruefe('Die Geburt selbst zahlt nichts', geboren && geboren.punkte === undefined)
}

/* ---------------------------------------------------------------- */
console.log('\n— Spezialteile: Wirkbereiche (rein)')
{
  /* Vier Zeugen, die die drei Formen sauber auseinanderhalten. */
  const feld = [
    { id: 1, x: 50, y: 100, stufe: 1 }, // genau im Treffpunkt
    { id: 2, x: 50, y: 118, stufe: 1 }, // 18 tiefer: im Kreis, aber unter dem Kasten
    { id: 3, x: 90, y: 100, stufe: 1 }, // 40 daneben: nur in der Zeile
    { id: 4, x: 50, y: 10, stufe: 1 }, // weit oben: nirgends
    { id: 5, x: 72, y: 116, stufe: 1 }, // schraeg: im Kasten, aber knapp ausserhalb des Kreises
  ]
  const bombe = spezialTreffer('bombe', 50, 100, feld).map((k) => k.id)
  const blitz = spezialTreffer('blitz', 50, 100, feld).map((k) => k.id)
  const ofen = spezialTreffer('ofen', 50, 100, feld).map((k) => k.id)
  pruefe('BOMBE raeumt einen Kreis um den Treffpunkt', bombe.join(',') === '1,2', bombe.join(','))
  pruefe('ZEILENBLITZ raeumt die ganze Zeile ueber die Breite', blitz.join(',') === '1,3', blitz.join(','))
  pruefe('GROSSOFEN raeumt einen Kasten, nicht den Kreis', ofen.join(',') === '1,5', ofen.join(','))
  pruefe('GOLDSTUECK und FROSTER raeumen nichts ab', spezialTreffer('gold', 50, 100, feld).length === 0 && spezialTreffer('frost', 50, 100, feld).length === 0)
  pruefe('Unbekannter Schluessel raeumt nichts ab', spezialTreffer('quatsch', 50, 100, feld).length === 0)
}

/* ---------------------------------------------------------------- */
console.log('\n— Spezialteile: Zuenden')
{
  const stand = neuesSpiel(saat(106))
  stand.zufall = () => 1 // keine Nachzuechtung, die Zaehlung soll klar bleiben
  const [a] = paarLegen(stand, 0, 50, 130)
  a.spezial = 'bombe'
  legen(stand, 2, 26, 130)
  legen(stand, 2, 74, 130)
  const ev = schritt(stand)
  const knall = ev.find((e) => e.art === 'spezial')
  const erwartet = Math.round(SPEZIAL.bombe.grund + 2 * basisPunkte(2) * SPEZIAL_ANTEIL)
  pruefe('Ein Spezialteil zuendet erst, wenn es selbst verschmilzt', !!knall && knall.spezial === 'bombe', JSON.stringify(knall))
  pruefe('Die Bombe raeumt beide Nachbarn ab', knall && knall.abgeraeumt === 2, `${knall && knall.abgeraeumt}`)
  pruefe('Abgeraeumte Teile sind wirklich weg', stand.koerper.length === 1 && stand.koerper[0].stufe === 1, `${stand.koerper.length}`)
  pruefe('Zuendung zahlt Grundwert plus Anteil der Beute', knall && knall.punkte === erwartet, `${knall && knall.punkte} vs ${erwartet}`)
  pruefe('Das Ereignis traegt Form und Groesse fuer die Darstellung', knall && knall.form === 'kreis' && knall.r === SPEZIAL.bombe.r && typeof knall.ruf === 'string')
}
{
  const stand = neuesSpiel(saat(107))
  stand.zufall = () => 1
  const [a] = paarLegen(stand, 0, 50, 130)
  a.spezial = 'bombe'
  const knall = schritt(stand).find((e) => e.art === 'spezial')
  pruefe('Bombe ins Leere: nichts abgeraeumt, nichts bezahlt', !!knall && knall.abgeraeumt === 0 && knall.punkte === 0, JSON.stringify(knall))
}
{
  const stand = neuesSpiel(saat(108))
  stand.zufall = () => 1
  const [a] = paarLegen(stand, 0, 50, 130)
  a.spezial = 'gold'
  const knall = schritt(stand).find((e) => e.art === 'spezial')
  pruefe('GOLDSTUECK zahlt seinen Grundwert', !!knall && knall.punkte === SPEZIAL.gold.grund, JSON.stringify(knall))
  pruefe('GOLDSTUECK startet den Multiplikator', goldAktiv(stand) && gesamtFaktor(stand, 1, 1) === GOLD_MULT)
  simulieren(stand, GOLD_S + 0.1)
  pruefe('Gold laeuft von allein wieder ab', !goldAktiv(stand) && stand.goldBis === 0 && gesamtFaktor(stand, 1, 1) === 1, `goldBis=${stand.goldBis}`)
}
{
  const stand = neuesSpiel(saat(109))
  stand.zufall = () => 1
  const [a] = paarLegen(stand, 0, 50, 130)
  a.spezial = 'frost'
  const knall = schritt(stand).find((e) => e.art === 'spezial')
  pruefe('FROSTER zuendet und friert das Feld ein', !!knall && knall.spezial === 'frost' && frostAktiv(stand))
  simulieren(stand, FROST_S + 0.1)
  pruefe('Frost taut von allein wieder auf', !frostAktiv(stand) && stand.frostBis === 0, `frostBis=${stand.frostBis}`)
}

/* ---------------------------------------------------------------- */
console.log('\n— Fieber: Zuendung, Wirkung, sauberes Ende')

/**
 * Ein echter Abwurf, der genau eine Verschmelzung landet. Die 0.3 s Pause
 * liegen ueber CHAIN_S: jede Kombo steht fuer sich, es entsteht also keine
 * Kettenreaktion, die das Ergebnis verwaessert.
 */
function guterAbwurf(stand) {
  stand.koerper = []
  abwerfen(stand, 50)
  stand.koerper.pop() // das geworfene Teil steht hier nur im Weg
  paarLegen(stand, 0, 50, HOEHE - STUFEN[0].r)
  return simulieren(stand, 0.3)
}

/** Ein Abwurf, der nichts trifft. */
function fehlwurf(stand) {
  stand.koerper = []
  abwerfen(stand, 50)
  return simulieren(stand, 0.3)
}

{
  const stand = neuesSpiel(saat(110))
  stand.zufall = () => 1
  let frueh = false
  let zuendung = null
  for (let i = 0; i < FIEBER_COMBOS; i += 1) {
    const ev = guterAbwurf(stand)
    const f = ev.find((e) => e.art === 'fieber')
    if (f && i < FIEBER_COMBOS - 1) frueh = true
    if (f) zuendung = f
  }
  pruefe('Vor FIEBER_COMBOS Kombos brennt nichts', !frueh)
  pruefe(`Nach ${FIEBER_COMBOS} Kombos ohne Fehler zuendet das Fieber`, !!zuendung && fieberAktiv(stand) && stand.fieberZahl === 1, JSON.stringify(zuendung))
  pruefe('Das Fieber-Ereignis nennt Dauer und Ende', zuendung && zuendung.dauer === FIEBER_S && zuendung.bis > stand.zeit - 0.2)
  pruefe('Das Fieber bringt einen Spruch mit', typeof zuendung.spruch === 'string' && SPRUECHE.fieber.includes(zuendung.spruch), String(zuendung.spruch))
  pruefe('Die Ladung ist beim Zuenden zurueckgesetzt', stand.fieberLadung === 0)
  pruefe('Im Fieber zaehlt jeder Punkt mehr', gesamtFaktor(stand, 1, 1) === FIEBER_MULT)

  const enden = simulieren(stand, FIEBER_S + 0.2).filter((e) => e.art === 'fieber-ende')
  pruefe('Nach FIEBER_S kommt genau ein fieber-ende', enden.length === 1, `${enden.length}`)
  pruefe('Danach ist der Zustand sauber leer', stand.fieber === false && stand.fieberBis === 0 && !fieberAktiv(stand), `fieber=${stand.fieber} bis=${stand.fieberBis}`)
  pruefe('Danach rechnet der Faktor wieder normal', gesamtFaktor(stand, 1, 1) === 1)

  /* Kein Klemmen: das Fieber laesst sich danach erneut zuenden. */
  for (let i = 0; i < FIEBER_COMBOS; i += 1) guterAbwurf(stand)
  pruefe('Das Fieber laesst sich ein zweites Mal zuenden', fieberAktiv(stand) && stand.fieberZahl === 2, `zahl=${stand.fieberZahl}`)
  simulieren(stand, FIEBER_S + 0.2)
  pruefe('Und endet auch beim zweiten Mal sauber', !fieberAktiv(stand) && stand.fieberBis === 0)
}
{
  const stand = neuesSpiel(saat(111))
  stand.zufall = () => 1
  for (let i = 0; i < FIEBER_COMBOS - 1; i += 1) guterAbwurf(stand)
  pruefe('Kurz vor dem Fieber brennt es noch nicht', !fieberAktiv(stand) && stand.fieberLadung === FIEBER_COMBOS - 1, `ladung=${stand.fieberLadung}`)
  fehlwurf(stand)
  guterAbwurf(stand) // dieses abwerfen sieht den Fehlwurf und loescht die Ladung
  pruefe('Ein Fehlwurf loescht die Ladung', stand.fieberLadung === 1 && !fieberAktiv(stand), `ladung=${stand.fieberLadung}`)
  for (let i = 0; i < FIEBER_COMBOS - 2; i += 1) guterAbwurf(stand)
  pruefe('Nach dem Fehler braucht es wieder die volle Zahl', !fieberAktiv(stand) && stand.fieberLadung === FIEBER_COMBOS - 1, `ladung=${stand.fieberLadung}`)
  guterAbwurf(stand)
  pruefe('Dann brennt es wieder', fieberAktiv(stand))
}

/* ---------------------------------------------------------------- */
console.log('\n— Sprueche: trocken und sparsam')
{
  pruefe('Alle Anlaesse haben Text', ['chain', 'spezial', 'fieber', 'traum'].every((a) => Array.isArray(SPRUECHE[a]) && SPRUECHE[a].length > 0))
  const stand = neuesSpiel(saat(112))
  const erster = spruchHolen(stand, 'chain')
  const sofort = spruchHolen(stand, 'chain')
  pruefe('Erster Spruch kommt, der zweite sofort danach nicht', typeof erster === 'string' && sofort === null, `${erster} / ${sofort}`)
  stand.zeit = stand.spruchBis - 0.01
  pruefe('Auch kurz vor Ablauf der Pause bleibt es still', spruchHolen(stand, 'fieber') === null)
  stand.zeit = stand.spruchBis + 0.01
  pruefe(`Nach SPRUCH_PAUSE (${SPRUCH_PAUSE}s) darf wieder geredet werden`, typeof spruchHolen(stand, 'fieber') === 'string')
  pruefe('Unbekannter Anlass bleibt stumm', spruchHolen(stand, 'gibtsnicht') === null)
}

console.log(`\n${ok} OK, ${fehler} Fehler`)
if (fehler) process.exit(1)
