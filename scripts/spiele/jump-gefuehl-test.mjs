/**
 * VIDEKO JUMP — Game-Feel-Test ohne Browser.
 *
 *   node scripts/spiele/jump-gefuehl-test.mjs
 *
 * Prueft, was beim Umbau dazugekommen ist: echtes Markenzeichen als Figur,
 * fliegende Kuechenteile, Treffer und Schuerze, die drei Kraefte, die
 * Kombo-Leiter und die langsam steigende Schwierigkeit.
 *
 * Der alte Logiktest (jump-logik-test.mjs) bleibt unangetastet und
 * unverduennt; dieser hier kommt nur obendrauf.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  COMBO_AB,
  COMBO_MULT,
  FIGUR_B,
  FIGUR_H,
  GABE_ABSTAND,
  GABE_AB_HOEHE,
  GABE_ARTEN,
  GABE_R,
  GEGNER_ABSTAND,
  GEGNER_ARTEN,
  GEGNER_AB_HOEHE,
  GEGNER_BREITE,
  GEGNER_H,
  MAX_JE_LANDUNG,
  MUETZE_DAUER,
  MUETZE_MULT,
  MULT_MAX,
  TAKT,
  TREFFER_V,
  TURBO_DAUER,
  TURBO_V,
  UNVERWUNDBAR,
  comboFaktor,
  neuesSpiel,
  regeln,
  schritt,
  trifft,
} from '../../src/components/spiele/jump-logik.js'

const HIER = dirname(fileURLToPath(import.meta.url))
const WURZEL = resolve(HIER, '../..')

let gut = 0
let schlecht = 0
function pruefe(name, ok, info = '') {
  if (ok) {
    gut += 1
    console.log(`  ok    ${name}`)
  } else {
    schlecht += 1
    console.log(`  FEHLT ${name}${info ? ` — ${info}` : ''}`)
  }
}

/** Die Figur an eine Stelle setzen, ohne den Weltgenerator zu stoeren. */
function ruhigerStand(seed = 5) {
  const stand = neuesSpiel(seed)
  /* Kein Nachwachsen, keine Kamera, kein Absturz: so bleibt der Test
     auf das beschraenkt, was er wirklich messen will. */
  stand.erzeugen = false
  stand.platten = []
  stand.gaben = []
  stand.gegner = []
  return stand
}

function gabeSetzen(stand, art, x, y) {
  const gb = { id: (stand.naechsteId += 1), art, x, y, weg: false }
  stand.gaben.push(gb)
  return gb
}

function gegnerSetzen(stand, art, x, y, v = 0) {
  const g = { id: (stand.naechsteId += 1), art, x, y, b: GEGNER_BREITE[art], v, dreh: 0, weg: false }
  stand.gegner.push(g)
  return g
}

/* ------------------------------------------------------------------ */
console.log('\nEchtes Markenzeichen als Figur (§1, §12)')
{
  const quelle = readFileSync(resolve(WURZEL, 'src/components/spiele/VidekoJump.jsx'), 'utf8')
  const treffer = quelle.match(/const LOGO_QUELLE = '([^']+)'/)
  pruefe('VidekoJump.jsx benennt eine Logo-Datei', !!treffer)

  const pfad = treffer ? treffer[1] : ''
  pruefe('Logo liegt unter /favicon-512.png', pfad === '/favicon-512.png', `gefunden: ${pfad || '—'}`)

  const datei = resolve(WURZEL, 'public', pfad.replace(/^\//, ''))
  pruefe('Datei ist wirklich im Repo', pfad ? existsSync(datei) : false, datei)

  /* PNG-Kopf lesen: Signatur und IHDR-Groesse. Kein Bildmodul noetig. */
  if (pfad && existsSync(datei)) {
    const roh = readFileSync(datei)
    const png = roh.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
    pruefe('Datei ist ein echtes PNG', png)
    const breite = roh.readUInt32BE(16)
    const hoehe = roh.readUInt32BE(20)
    pruefe('Logo ist quadratisch (wird nur gleichmaessig skaliert)', breite === hoehe, `${breite}x${hoehe}`)
    pruefe('Logo ist gross genug fuer Retina', breite >= 256, `${breite} px`)
  }

  /* Das Logo darf nur gleichmaessig skaliert werden. drawImage mit vier
     Massen ist erlaubt, solange Breite und Hoehe dieselbe Groesse sind. */
  const zeichnung = quelle.match(/ctx\.drawImage\(logo,[^)]*\)/)
  pruefe('Logo wird per drawImage gemalt', !!zeichnung, zeichnung ? zeichnung[0] : '')
  pruefe(
    'Logo wird gleichmaessig skaliert (koerper x koerper)',
    !!zeichnung && /koerper,\s*koerper\s*\)/.test(zeichnung[0]),
    zeichnung ? zeichnung[0] : '',
  )
  /* Die falsche Favicon-Vorlage darf nirgends auftauchen. */
  pruefe('kein Griff zur fremden favicon.svg', !quelle.includes('favicon.svg'))
  pruefe('Kochmuetze liegt als eigenes Teil darueber', quelle.includes('function muetzeMalen('))
}

/* ------------------------------------------------------------------ */
console.log('\nFliegende Kuechenteile')
{
  pruefe('acht Kuechenteile als Gegner', GEGNER_ARTEN.length === 8, GEGNER_ARTEN.join(', '))
  pruefe(
    'jedes Teil hat eine Breite',
    GEGNER_ARTEN.every((a) => typeof GEGNER_BREITE[a] === 'number' && GEGNER_BREITE[a] > 0),
  )
  pruefe(
    'kein Teil ist breiter als ein Drittel der Welt (Weg bleibt offen)',
    GEGNER_ARTEN.every((a) => GEGNER_BREITE[a] <= 0.34),
  )
  pruefe('die Kuechenteile sind Kuechenteile, keine Waffen', GEGNER_ARTEN.every((a) => !/waffe|messer|klinge|pistole/.test(a)))

  /* Treffer-Erkennung: mittig getroffen ja, deutlich daneben nein. */
  const s = { x: 0.5, y: 1 }
  const mitte = { x: 0.5, y: 1 + FIGUR_H / 2, b: 0.16 }
  pruefe('Teil auf Figurhoehe trifft', trifft(mitte, s))
  pruefe('Teil weit darueber trifft nicht', !trifft({ ...mitte, y: 1 + FIGUR_H + GEGNER_H }, s))
  pruefe('Teil weit daneben trifft nicht', !trifft({ ...mitte, x: 0.5 + 0.3 }, s))
  pruefe(
    'Treffer misst auf dem Ring (Welt ist rund)',
    trifft({ ...mitte, x: 0.02 }, { x: 0.99, y: 1 }),
  )
  pruefe('Figurmasse sind gesetzt', FIGUR_B > 0 && FIGUR_H > 0)
}

/* ------------------------------------------------------------------ */
console.log('\nTreffer wirft nach unten, toetet aber nicht')
{
  const stand = ruhigerStand()
  const g = gegnerSetzen(stand, 'kuehlschrank', 0.5, stand.spieler.y + FIGUR_H / 2)
  stand.spieler.vy = 1.2
  stand.combo = 4
  const ereignisse = schritt(stand, 0)
  const treffer = ereignisse.find((e) => e.art === 'treffer')
  pruefe('Treffer wird gemeldet', !!treffer)
  pruefe('getroffenes Teil ist weg', g.weg === true)
  pruefe('Runde laeuft weiter (kein Tod)', stand.vorbei === false)
  pruefe('Kombo faellt auf 0', stand.combo === 0)
  pruefe('Figur wird nach unten geworfen', stand.spieler.vy <= TREFFER_V + 1e-9, String(stand.spieler.vy))
  pruefe('Trefferzaehler steigt', stand.treffer === 1)
  pruefe('kurz unverwundbar', stand.unverwundbarBis >= stand.zeit + UNVERWUNDBAR - TAKT)

  /* Zweites Teil darf im Schutzfenster nicht sofort nachtreten. */
  gegnerSetzen(stand, 'topf', stand.spieler.x, stand.spieler.y + FIGUR_H / 2)
  const zweite = schritt(stand, 0)
  pruefe('im Unverwundbarkeitsfenster kein zweiter Treffer', !zweite.some((e) => e.art === 'treffer'))
  pruefe('Trefferzaehler bleibt bei 1', stand.treffer === 1)
}

/* ------------------------------------------------------------------ */
console.log('\nSchutzschuerze faengt genau einen Treffer')
{
  const stand = ruhigerStand()
  stand.schutz = true
  stand.combo = 3
  gegnerSetzen(stand, 'pfanne', 0.5, stand.spieler.y + FIGUR_H / 2)
  const ereignisse = schritt(stand, 0)
  pruefe('Schuerze meldet sich', ereignisse.some((e) => e.art === 'schutz'))
  pruefe('kein Treffer-Ereignis', !ereignisse.some((e) => e.art === 'treffer'))
  pruefe('Kombo bleibt stehen', stand.combo === 3)
  pruefe('Schuerze ist aufgebraucht', stand.schutz === false)
  pruefe('kein Rueckstoss', stand.spieler.vy > TREFFER_V)

  /* Nach Ablauf der Unverwundbarkeit trifft das naechste Teil normal. */
  stand.unverwundbarBis = 0
  gegnerSetzen(stand, 'backofen', stand.spieler.x, stand.spieler.y + FIGUR_H / 2)
  pruefe('danach trifft das naechste Teil wirklich', schritt(stand, 0).some((e) => e.art === 'treffer'))
}

/* ------------------------------------------------------------------ */
console.log('\nDie drei Kraefte')
{
  pruefe('genau drei Kraefte', GABE_ARTEN.length === 3, GABE_ARTEN.join(', '))
  pruefe('Muetze, Schuerze, Turbo', ['muetze', 'schuerze', 'turbo'].every((a) => GABE_ARTEN.includes(a)))

  /* Goldene Kochmuetze. */
  const a = ruhigerStand()
  gabeSetzen(a, 'muetze', a.spieler.x, a.spieler.y + FIGUR_H / 2)
  const eA = schritt(a, 0)
  pruefe('Muetze wird eingesammelt', eA.some((e) => e.art === 'gabe' && e.gart === 'muetze'))
  pruefe('Muetze laeuft MUETZE_DAUER lang', Math.abs(a.muetzeBis - a.zeit - MUETZE_DAUER) < 1e-9)
  pruefe('Muetze dauert fuenf Sekunden', MUETZE_DAUER === 5)
  pruefe('Muetze verdoppelt', MUETZE_MULT === 2)

  /* Schutzschuerze. */
  const b = ruhigerStand()
  gabeSetzen(b, 'schuerze', b.spieler.x, b.spieler.y + FIGUR_H / 2)
  schritt(b, 0)
  pruefe('Schuerze setzt den Schutz', b.schutz === true)

  /* Turbo. */
  const c = ruhigerStand()
  gabeSetzen(c, 'turbo', c.spieler.x, c.spieler.y + FIGUR_H / 2)
  schritt(c, 0)
  pruefe('Turbo laeuft TURBO_DAUER lang', Math.abs(c.turboBis - c.zeit - TURBO_DAUER) < 1e-9)
  const vorher = c.spieler.y
  schritt(c, 0)
  pruefe('Turbo traegt nach oben', c.spieler.y > vorher)
  pruefe('Turbo faehrt mit fester Geschwindigkeit', Math.abs(c.spieler.vy - TURBO_V) < 1e-9)
  /* Im Turbo raeumt die Figur Kuechenteile beiseite. */
  gegnerSetzen(c, 'haube', c.spieler.x, c.spieler.y + FIGUR_H / 2)
  pruefe('im Turbo kein Treffer', !schritt(c, 0).some((e) => e.art === 'treffer'))
  /* Danach faellt sie wieder normal. */
  c.turboBis = 0
  const vy = c.spieler.vy
  schritt(c, 0)
  pruefe('nach dem Turbo wirkt die Schwerkraft wieder', c.spieler.vy < vy)

  /* Eine Kraft wird nur einmal genommen. */
  const d = ruhigerStand()
  gabeSetzen(d, 'muetze', d.spieler.x, d.spieler.y + FIGUR_H / 2)
  const ersteZahl = schritt(d, 0).filter((e) => e.art === 'gabe').length
  const zweiteZahl = schritt(d, 0).filter((e) => e.art === 'gabe').length
  pruefe('Kraft wird genau einmal eingesammelt', ersteZahl === 1 && zweiteZahl === 0)

  /* Weit daneben wird nichts eingesammelt. */
  const e = ruhigerStand()
  gabeSetzen(e, 'turbo', e.spieler.x + 0.3, e.spieler.y + FIGUR_H / 2)
  pruefe('Kraft weit daneben bleibt liegen', !schritt(e, 0).some((x) => x.art === 'gabe'))
  pruefe('Kraefte haben einen Radius', GABE_R > 0 && GABE_R < 0.2)
}

/* ------------------------------------------------------------------ */
console.log('\nKombo-Leiter')
{
  pruefe('vier Stufen', COMBO_AB.length === 4, COMBO_AB.join(', '))
  pruefe('Stufen bei 3, 5, 8, 10', COMBO_AB.join(',') === '3,5,8,10')
  pruefe('jede Stufe hat einen Faktor', COMBO_MULT.length === COMBO_AB.length)
  pruefe('Faktoren steigen streng', COMBO_MULT.every((m, i) => i === 0 || m > COMBO_MULT[i - 1]))
  pruefe('ohne Kombo kein Aufschlag', comboFaktor(0) === 1 && comboFaktor(2) === 1)
  pruefe(`ab ${COMBO_AB[0]} greift der Aufschlag`, comboFaktor(COMBO_AB[0]) === COMBO_MULT[0])
  pruefe('hoechste Stufe haelt auch darueber', comboFaktor(99) === COMBO_MULT[COMBO_MULT.length - 1])
  pruefe(
    'Kombo und Muetze zusammen bleiben unter der Decke',
    Math.min(MULT_MAX, comboFaktor(99) * MUETZE_MULT) === MULT_MAX,
  )
  pruefe('Decke ist gesetzt', MULT_MAX === 4)
  pruefe('MAX_JE_LANDUNG ist eine Zahl > 0', Number.isFinite(MAX_JE_LANDUNG) && MAX_JE_LANDUNG > 0, String(MAX_JE_LANDUNG))

  /* Die Anzeigewoerter duerfen nicht von der Leiter abweichen. */
  const quelle = readFileSync(resolve(WURZEL, 'src/components/spiele/VidekoJump.jsx'), 'utf8')
  pruefe('Anzeigewoerter haengen an COMBO_AB, nicht an festen Zahlen', /SPRUCH_STUFE\s*=\s*Object\.fromEntries\(\s*COMBO_AB/.test(quelle))
}

/* ------------------------------------------------------------------ */
console.log('\nSchwierigkeit steigt langsam')
{
  const start = regeln(0)
  pruefe('ganz unten keine Kraefte', start.gabe === 0)
  pruefe('ganz unten keine fliegenden Teile', start.gegner === 0)
  pruefe(`Kraefte erst ab HOEHE ${GABE_AB_HOEHE}`, regeln(GABE_AB_HOEHE - 1).gabe === 0 && regeln(GABE_AB_HOEHE).gabe > 0)
  pruefe(
    `Teile erst ab HOEHE ${GEGNER_AB_HOEHE}`,
    regeln(GEGNER_AB_HOEHE - 1).gegner === 0 && regeln(GEGNER_AB_HOEHE).gegner > 0,
  )
  pruefe('Kraefte kommen vor den Gegnern', GABE_AB_HOEHE < GEGNER_AB_HOEHE)

  const hoehen = [60, 120, 250, 500, 1000, 3000]
  const tempi = hoehen.map((h) => regeln(h).gegnerTempo)
  pruefe('Tempo der Teile steigt monoton', tempi.every((t, i) => i === 0 || t >= tempi[i - 1]), tempi.map((t) => t.toFixed(2)).join(' → '))
  pruefe('Tempo bleibt beherrschbar', tempi[tempi.length - 1] <= 0.6, tempi[tempi.length - 1].toFixed(2))
  const dichten = hoehen.map((h) => regeln(h).gegner)
  pruefe('Dichte der Teile steigt monoton', dichten.every((d, i) => i === 0 || d >= dichten[i - 1]))
  pruefe('Dichte bleibt unter 30 %', dichten.every((d) => d <= 0.3), dichten[dichten.length - 1].toFixed(2))
  pruefe('Kraefte werden nach oben seltener, verschwinden aber nicht', regeln(3000).gabe > 0 && regeln(3000).gabe < regeln(60).gabe)
  pruefe('Mindestabstaende sind gesetzt', GABE_ABSTAND > 0 && GEGNER_ABSTAND > 0)
}

/* ------------------------------------------------------------------ */
console.log('\nEcht gespielt: Teile und Kraefte tauchen auf und raeumen sich ab')
{
  /* Ein Lauf mit erzwungenem Aufstieg: die Figur wird nach oben gesetzt,
     damit der Generator die oberen Abschnitte wirklich liefert. */
  const stand = neuesSpiel(4242)
  let gaben = 0
  let gegner = 0
  const arten = new Set()
  let n = 0
  while (n < 12000 && !stand.vorbei) {
    n += 1
    /* Sanft mitziehen: kein Spiel, sondern ein Generator-Durchlauf. */
    stand.spieler.y += 0.02
    if (stand.spieler.vy < 0) stand.spieler.vy = 0
    schritt(stand, 0)
    gaben += stand.gaben.length
    gegner += stand.gegner.length
    for (const g of stand.gegner) arten.add(g.art)
  }
  pruefe('fliegende Teile entstehen im Lauf', gegner > 0)
  pruefe('Kraefte entstehen im Lauf', gaben > 0)
  pruefe('mehrere Teilesorten kommen vor', arten.size >= 4, [...arten].join(', '))
  pruefe('Teile bleiben im Feld', [...stand.gegner].every((g) => g.x >= 0 && g.x < 1))
  pruefe('Teileliste laeuft nicht voll (Aufraeumen wirkt)', stand.gegner.length <= 40, String(stand.gegner.length))
  pruefe('Kraefteliste laeuft nicht voll', stand.gaben.length <= 20, String(stand.gaben.length))
  pruefe('Plattenliste laeuft nicht voll', stand.platten.length <= 400, String(stand.platten.length))
  pruefe('HOEHE wurde wirklich erreicht', stand.hoehe > GEGNER_AB_HOEHE, String(stand.hoehe))
}

/* ------------------------------------------------------------------ */
console.log('\nDas Ende kommt sauber')
{
  /* Die Figur faellt unter die Kamera: genau ein Absturz, danach Ruhe. */
  const stand = neuesSpiel(77)
  for (let n = 0; n < 200; n += 1) schritt(stand, 0)
  stand.spieler.y = stand.kamera - 5
  stand.spieler.vy = -4
  const ereignisse = schritt(stand, 0)
  pruefe('Absturz wird genau einmal gemeldet', ereignisse.filter((e) => e.art === 'absturz').length === 1)
  pruefe('Lauf ist vorbei', stand.vorbei === true)
  pruefe('danach kommen keine Ereignisse mehr', schritt(stand, 0).length === 0)
  const punkte = stand.punkte
  schritt(stand, 0)
  pruefe('danach kommen keine Punkte mehr', stand.punkte === punkte)

  /* Ein Treffer darf die Figur nicht in eine Endlosschleife werfen: der
     Schritt muss auch nach hundert Treffern noch zurueckkommen. */
  const b = ruhigerStand()
  let n = 0
  while (n < 2000) {
    n += 1
    b.unverwundbarBis = 0
    b.spieler.vy = 2
    gegnerSetzen(b, GEGNER_ARTEN[n % GEGNER_ARTEN.length], b.spieler.x, b.spieler.y + FIGUR_H / 2)
    schritt(b, 0)
  }
  pruefe('2000 Treffer ohne Haenger', b.treffer === 2000, String(b.treffer))
  pruefe('Gegnerliste bleibt endlich', b.gegner.filter((g) => !g.weg).length === 0)
}

console.log(`\n${gut} ok, ${schlecht} fehlgeschlagen\n`)
process.exit(schlecht ? 1 : 0)
