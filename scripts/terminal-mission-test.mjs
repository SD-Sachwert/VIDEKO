/**
 * Follower-Mission: Stufen, naechste Schwelle, Differenz, MEGA-PREIS.
 *
 * Reiner Logiktest ohne Netz, ohne Browser, ohne Datenbank. Geprueft wird
 * genau das, was auf der Seite steht — gerechnet aus der echten Followerzahl.
 * Feste Saetze wie „noch 439" darf es nirgends geben; hier faellt auf, wenn
 * doch einer eingezogen ist.
 *
 *   node scripts/terminal-mission-test.mjs
 */

import {
  MEGA_LEER,
  MEGA_MEILENSTEIN,
  MEILENSTEINE,
  MEILENSTEIN_LEER,
  TEXTE,
  fuelle,
  missionStand,
  zahl,
} from '../src/data/terminal.js'

let fehler = 0
let gesamt = 0
function pruefe(name, ok, info = '') {
  gesamt += 1
  if (!ok) fehler += 1
  console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${info ? ` — ${info}` : ''}`)
}

const M = TEXTE.c.mission

/* Der Satz, der auf der Karte unter der Zahl steht. Dieselbe Herleitung wie
   in der Mission-Komponente, damit der Test den Text prueft und nicht nur
   die Rohwerte. */
function fehltSatz(follower, gewinne) {
  const stand = missionStand(follower, gewinne)
  return stand.naechste
    ? fuelle(stand.megaNaechste ? M.fehltMega : M.fehlt, { fehlt: zahl(stand.fehlt) })
    : M.alle
}

/* 1. Die Reihe selbst */
pruefe('Stufen: 1500 bis 5000 in 500er-Schritten',
  JSON.stringify(MEILENSTEINE) === JSON.stringify([1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]),
  JSON.stringify(MEILENSTEINE))
pruefe('Stufen: keine Schwelle unter 1500 mehr',
  !MEILENSTEINE.some((z) => z < 1500), JSON.stringify(MEILENSTEINE.filter((z) => z < 1500)))
pruefe('Stufen: MEGA_MEILENSTEIN ist die letzte',
  MEGA_MEILENSTEIN === 5000 && MEILENSTEINE[MEILENSTEINE.length - 1] === MEGA_MEILENSTEIN,
  String(MEGA_MEILENSTEIN))

/* 2. Die acht Faelle aus dem Auftrag */
{
  const s = missionStand(1061)
  pruefe('1061: acht Stufen, keine frei', s.stufen.length === 8 && s.stufen.every((st) => !st.frei),
    `${s.stufen.length} Stufen, ${s.stufen.filter((st) => st.frei).length} frei`)
  pruefe('1061: naechste Stufe 1500, es fehlen 439',
    s.naechste?.ziel === 1500 && s.fehlt === 439, `${s.naechste?.ziel} / ${s.fehlt}`)
  pruefe('1061: Satz nennt Zusatzgewinn, nicht MEGA',
    fehltSatz(1061) === 'Noch 439 bis zum nächsten Zusatzgewinn.', fehltSatz(1061))
}
{
  const s = missionStand(1499)
  pruefe('1499: noch 1 bis 1500', s.naechste?.ziel === 1500 && s.fehlt === 1, String(s.fehlt))
  pruefe('1499: Satz sagt „Noch 1"', fehltSatz(1499) === 'Noch 1 bis zum nächsten Zusatzgewinn.', fehltSatz(1499))
}
{
  const s = missionStand(1500)
  pruefe('1500: erste Stufe frei, naechste 2000, es fehlen 500',
    s.stufen[0].frei === true && s.naechste?.ziel === 2000 && s.fehlt === 500,
    `frei=${s.stufen[0].frei} naechste=${s.naechste?.ziel} fehlt=${s.fehlt}`)
  pruefe('1500: genau eine Stufe freigeschaltet',
    s.stufen.filter((st) => st.frei).length === 1, String(s.stufen.filter((st) => st.frei).length))
}
{
  const s = missionStand(1999)
  pruefe('1999: noch 1 bis 2000', s.naechste?.ziel === 2000 && s.fehlt === 1, String(s.fehlt))
}
{
  const s = missionStand(4500)
  pruefe('4500: naechste Stufe ist der MEGA-PREIS, es fehlen 500',
    s.naechste?.ziel === 5000 && s.megaNaechste === true && s.fehlt === 500,
    `${s.naechste?.ziel} / ${s.fehlt}`)
  pruefe('4500: Satz wechselt auf MEGA-PREIS',
    fehltSatz(4500) === 'Noch 500 bis zum MEGA-PREIS.', fehltSatz(4500))
  pruefe('4500: sieben Stufen frei, MEGA noch nicht',
    s.stufen.filter((st) => st.frei).length === 7 && s.megaFrei === false,
    `${s.stufen.filter((st) => st.frei).length} frei, megaFrei=${s.megaFrei}`)
}
{
  const s = missionStand(4999)
  pruefe('4999: noch 1 bis zum MEGA-PREIS', s.fehlt === 1 && s.megaNaechste === true, String(s.fehlt))
  pruefe('4999: Satz sagt „Noch 1 bis zum MEGA-PREIS."',
    fehltSatz(4999) === 'Noch 1 bis zum MEGA-PREIS.', fehltSatz(4999))
}
{
  const s = missionStand(5000)
  pruefe('5000: alles frei, keine naechste Stufe',
    s.megaFrei === true && s.naechste === null && s.stufen.every((st) => st.frei),
    `megaFrei=${s.megaFrei} naechste=${s.naechste}`)
  pruefe('5000: Satz meldet MEGA-PREIS FREIGESCHALTET',
    fehltSatz(5000) === 'MEGA-PREIS FREIGESCHALTET.', fehltSatz(5000))
}
{
  const s = missionStand(5200)
  pruefe('5200: weiterhin freigeschaltet, Differenz 0 statt negativ',
    s.megaFrei === true && s.naechste === null && s.fehlt === 0 && s.anteil === 1,
    `fehlt=${s.fehlt} anteil=${s.anteil}`)
  pruefe('5200: kein negativer Wert in der ganzen Rechnung',
    s.fehlt >= 0 && s.anteil >= 0 && s.follower === 5200, JSON.stringify({ fehlt: s.fehlt, anteil: s.anteil }))
}

/* 3. Der Balken laeuft nie aus dem Rahmen */
for (const wert of [0, 750, 1061, 1499, 1500, 2499, 4999, 5000, 99999]) {
  const s = missionStand(wert)
  if (s.anteil < 0 || s.anteil > 1 || s.fehlt < 0) {
    pruefe(`Balken bei ${wert} bleibt zwischen 0 und 1`, false, `anteil=${s.anteil} fehlt=${s.fehlt}`)
  }
}
pruefe('Balken: Anteil bei allen Stichproben zwischen 0 und 1, Differenz nie negativ', true)

/* 4. Unsinnige Eingaben kippen die Karte nicht */
for (const [wert, name] of [[null, 'null'], [undefined, 'undefined'], ['', 'leerer Text'], [Number.NaN, 'NaN'], [-500, 'negativ']]) {
  const s = missionStand(wert)
  pruefe(`Eingabe ${name}: faellt auf 0 zurueck, naechste Stufe 1500`,
    s.follower === 0 && s.naechste?.ziel === 1500 && s.fehlt === 1500,
    `${s.follower} / ${s.naechste?.ziel} / ${s.fehlt}`)
}

/* 5. Preise werden nicht erfunden */
{
  const s = missionStand(1061)
  pruefe('Ohne gepflegten Preis heisst jede Stufe schlicht ZUSATZGEWINN',
    s.stufen.filter((st) => !st.mega).every((st) => st.gewinn === MEILENSTEIN_LEER && st.benannt === false),
    MEILENSTEIN_LEER)
  pruefe('Ohne gepflegten Preis heisst die letzte Stufe MEGA-PREIS',
    s.stufen[7].gewinn === MEGA_LEER && s.stufen[7].mega === true && s.stufen[7].benannt === false,
    MEGA_LEER)
  const mitPreis = missionStand(1061, { 2000: 'Testpreis', 5000: 'Mega-Testpreis' })
  pruefe('Gepflegte Preise werden uebernommen und als benannt markiert',
    mitPreis.stufen[1].gewinn === 'Testpreis' && mitPreis.stufen[1].benannt === true
    && mitPreis.stufen[7].gewinn === 'Mega-Testpreis' && mitPreis.stufen[7].benannt === true)
  const leerText = missionStand(1061, { 2000: '   ' })
  pruefe('Ein Feld mit nur Leerzeichen gilt als nicht gepflegt',
    leerText.stufen[1].gewinn === MEILENSTEIN_LEER && leerText.stufen[1].benannt === false)
}

/* 6. Keine alte Schwelle mehr im Text */
{
  const texte = JSON.stringify(M) + JSON.stringify(TEXTE.c.followerNotiz) + JSON.stringify(TEXTE.c.followerNotizMega)
  pruefe('Mission-Texte enthalten keine feste Zahl 1.000, 1.250 oder 439',
    !/1\.?000|1\.?250|439/.test(texte), texte.slice(0, 120))
  pruefe('Die Taktzeile nennt die 500er-Schritte', M.takt.includes('500'), M.takt)
}

console.log(`\n${gesamt - fehler}/${gesamt} Pruefungen bestanden`)
process.exit(fehler ? 1 : 0)
