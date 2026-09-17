/**
 * VIDEKO JUMP — Game-Feel-Test ohne Browser.
 *
 *   node scripts/spiele/jump-gefuehl-test.mjs
 *
 * Prueft, was beim Umbau dazugekommen ist: echtes Markenzeichen als Figur,
 * fliegende Bauteile aus allen Gewerken, der toedliche Treffer und die
 * Schuerze, die fuenf Kraefte, die Kombo-Leiter und die langsam steigende
 * Schwierigkeit.
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
  GEGNER_MUSTER,
  MAGNET_DAUER,
  MAGNET_R,
  MAX_JE_LANDUNG,
  MUETZE_DAUER,
  MUETZE_MULT,
  MULT_MAX,
  SUPERKOCH_ANTEIL,
  SUPERKOCH_DAUER,
  SUPERKOCH_MULT,
  TAKT,
  TREFFER_V,
  TURBO_DAUER,
  TURBO_V,
  UNVERWUNDBAR,
  WELLEN,
  comboFaktor,
  hoeheVon,
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

/**
 * Ein Teil an eine Stelle haengen — mit allen Feldern, die sein Muster
 * braucht. Eine Klappe wird dabei bewusst weit offen gesetzt, sonst waere
 * sie schmal und der Test wuerde am Zufall der Klappenstellung haengen.
 */
function gegnerSetzen(stand, art, x, y, v = 0) {
  const muster = GEGNER_MUSTER[art] || 'zieht'
  const g = {
    id: (stand.naechsteId += 1),
    art,
    muster,
    x,
    y,
    b: GEGNER_BREITE[art] || 0.13,
    v,
    dreh: 0,
    weg: false,
    mitte: x,
    weite: 0,
    phase: 0,
    zyklus: 2,
    offen: 0.6,
    auf: 1,
  }
  if (muster === 'klappt') g.phase = (g.zyklus * g.offen) / 2
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
  const zeichnungen = quelle.match(/ctx\.drawImage\(logo,[^)]*\)/g) || []
  pruefe('Logo wird per drawImage gemalt', zeichnungen.length > 0, zeichnungen.join(' | '))
  /* Jeder Aufruf muss dieselbe Zahl fuer Breite und Hoehe verwenden — egal
     welche. Die Figur nimmt `koerper`, die Superkoch-Kraft nimmt `r * 1.9`.
     Verzerrt waere beides erst, wenn die letzten zwei Masse sich
     unterscheiden. */
  const schief = zeichnungen.filter((z) => {
    const masse = z.slice(z.indexOf(',') + 1, -1).split(',').map((t) => t.trim())
    return masse.length !== 4 || masse[2] !== masse[3]
  })
  pruefe(
    'Logo wird ueberall gleichmaessig skaliert (Breite = Hoehe)',
    zeichnungen.length > 0 && schief.length === 0,
    schief.join(' | '),
  )
  /* Die falsche Favicon-Vorlage darf nirgends auftauchen. */
  pruefe('kein Griff zur fremden favicon.svg', !quelle.includes('favicon.svg'))
  pruefe('Kochmuetze liegt als eigenes Teil darueber', quelle.includes('function muetzeMalen('))
}

/* ------------------------------------------------------------------ */
console.log('\nFliegende Bauteile aus allen Gewerken')
{
  pruefe('vierzehn Teile als Gegner', GEGNER_ARTEN.length === 14, GEGNER_ARTEN.join(', '))
  /* VIDEKO ist mehr als Kueche: Ausbau, Boden, Wand, Decke, Elektro, PV,
     Licht, Immobilien. Das muss man an den Gegnern sehen. */
  const gewerke = ['werkzeugkiste', 'farbrolle', 'kabeltrommel', 'pvmodul', 'bodenpaket', 'leuchte', 'maklerschild', 'deckenring']
  pruefe(
    'nicht nur Kueche: andere Gewerke sind dabei',
    gewerke.filter((a) => GEGNER_ARTEN.includes(a)).length >= 6,
    gewerke.filter((a) => GEGNER_ARTEN.includes(a)).join(', '),
  )
  pruefe('keine Art doppelt', new Set(GEGNER_ARTEN).size === GEGNER_ARTEN.length)
  pruefe(
    'jedes Teil hat eine Breite',
    GEGNER_ARTEN.every((a) => typeof GEGNER_BREITE[a] === 'number' && GEGNER_BREITE[a] > 0),
  )
  pruefe(
    'kein Teil ist breiter als ein Drittel der Welt (Weg bleibt offen)',
    GEGNER_ARTEN.every((a) => GEGNER_BREITE[a] <= 0.34),
  )
  pruefe('die Teile sind Baustellenteile, keine Waffen', GEGNER_ARTEN.every((a) => !/waffe|messer|klinge|pistole/.test(a)))
  pruefe(
    'jedes Teil hat ein Bewegungsmuster',
    GEGNER_ARTEN.every((a) => ['zieht', 'schwer', 'pendelt', 'klappt'].includes(GEGNER_MUSTER[a])),
  )
  pruefe(
    'alle vier Muster kommen vor (man erkennt das Teil an der Bewegung)',
    new Set(GEGNER_ARTEN.map((a) => GEGNER_MUSTER[a])).size === 4,
  )

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
console.log('\nEin Treffer kostet den Lauf')
{
  const stand = ruhigerStand()
  const g = gegnerSetzen(stand, 'kuehlschrank', 0.5, stand.spieler.y + FIGUR_H / 2)
  stand.spieler.vy = 1.2
  stand.combo = 4
  const ereignisse = schritt(stand, 0)
  const treffer = ereignisse.find((e) => e.art === 'treffer')
  pruefe('Treffer wird gemeldet', !!treffer)
  pruefe('Treffer ist als toedlich gekennzeichnet', treffer?.toedlich === true)
  pruefe('getroffenes Teil ist weg', g.weg === true)
  pruefe('Lauf ist vorbei', stand.vorbei === true)
  const aus = ereignisse.find((e) => e.art === 'absturz')
  pruefe('Ende wird als Absturz gemeldet', !!aus)
  pruefe('Ende weiss, dass es ein Gegner war', aus?.durchGegner === true)
  pruefe('Kombo faellt auf 0', stand.combo === 0)
  pruefe('Figur wird nach unten geworfen (Impact)', stand.spieler.vy <= TREFFER_V + 1e-9, String(stand.spieler.vy))
  pruefe('Trefferzaehler steigt', stand.treffer === 1)
  pruefe('kurz unverwundbar', stand.unverwundbarBis >= stand.zeit + UNVERWUNDBAR - TAKT)

  /* Nach dem Ende ist wirklich Schluss: kein zweiter Treffer, keine
     weiteren Ereignisse, keine Punkte mehr. */
  gegnerSetzen(stand, 'werkzeugkiste', stand.spieler.x, stand.spieler.y + FIGUR_H / 2)
  pruefe('danach kommen keine Ereignisse mehr', schritt(stand, 0).length === 0)
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
console.log('\nDie fuenf Kraefte')
{
  pruefe('genau fuenf Kraefte', GABE_ARTEN.length === 5, GABE_ARTEN.join(', '))
  pruefe(
    'Muetze, Schuerze, Turbo, Magnet, Superkoch',
    ['muetze', 'schuerze', 'turbo', 'magnet', 'superkoch'].every((a) => GABE_ARTEN.includes(a)),
  )

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
  /* Im Turbo raeumt die Figur Bauteile beiseite. */
  gegnerSetzen(c, 'leuchte', c.spieler.x, c.spieler.y + FIGUR_H / 2)
  const turboWeg = schritt(c, 0)
  pruefe('im Turbo kein Treffer', !turboWeg.some((e) => e.art === 'treffer'))
  pruefe('im Turbo wird das Teil beiseitegeraeumt', turboWeg.some((e) => e.art === 'wegfegen'))
  pruefe('der Turbo ueberlebt das', c.vorbei === false)
  /* Danach faellt sie wieder normal. */
  c.turboBis = 0
  const vy = c.spieler.vy
  schritt(c, 0)
  pruefe('nach dem Turbo wirkt die Schwerkraft wieder', c.spieler.vy < vy)

  /* Magnet: zieht Kraefte heran, die sonst knapp verfehlt worden waeren. */
  const m = ruhigerStand()
  m.magnetBis = m.zeit + MAGNET_DAUER
  const fern = gabeSetzen(m, 'muetze', m.spieler.x + MAGNET_R * 0.8, m.spieler.y + FIGUR_H / 2)
  pruefe('Magnet laeuft sieben Sekunden', MAGNET_DAUER === 7)
  pruefe('Magnetreichweite ist begrenzt', MAGNET_R > 0 && MAGNET_R < 0.3, String(MAGNET_R))
  const weitWeg = Math.abs(fern.x - m.spieler.x)
  schritt(m, 0)
  pruefe('Magnet zieht die Kraft heran', Math.abs(fern.x - m.spieler.x) < weitWeg)
  let gezogen = false
  for (let n = 0; n < 60 && !gezogen; n += 1) gezogen = schritt(m, 0).some((e) => e.art === 'gabe')
  pruefe('herangezogene Kraft landet auch wirklich', gezogen)

  /* Ohne Magnet bleibt dieselbe Kraft liegen. */
  const o = ruhigerStand()
  const liegt = gabeSetzen(o, 'muetze', o.spieler.x + MAGNET_R * 0.8, o.spieler.y + FIGUR_H / 2)
  const xVorher = liegt.x
  for (let n = 0; n < 60; n += 1) schritt(o, 0)
  pruefe('ohne Magnet bleibt die Kraft liegen', liegt.weg === false && liegt.x === xVorher)

  /* Superkoch: die seltenste Kraft. Unverwundbar und dreifach. */
  const sk = ruhigerStand()
  gabeSetzen(sk, 'superkoch', sk.spieler.x, sk.spieler.y + FIGUR_H / 2)
  schritt(sk, 0)
  pruefe('Superkoch laeuft SUPERKOCH_DAUER lang', Math.abs(sk.superBis - sk.zeit - SUPERKOCH_DAUER) < 1e-9)
  pruefe('Superkoch dauert fuenf Sekunden', SUPERKOCH_DAUER === 5)
  pruefe('Superkoch zaehlt dreifach', SUPERKOCH_MULT === 3)
  pruefe('Superkoch bleibt unter der Decke', Math.min(MULT_MAX, comboFaktor(99) * SUPERKOCH_MULT) === MULT_MAX)
  pruefe('Superkoch ist selten', SUPERKOCH_ANTEIL > 0 && SUPERKOCH_ANTEIL <= 0.1, String(SUPERKOCH_ANTEIL))
  sk.unverwundbarBis = 0
  gegnerSetzen(sk, 'backofen', sk.spieler.x, sk.spieler.y + FIGUR_H / 2)
  const skE = schritt(sk, 0)
  pruefe('als Superkoch kein Treffer', !skE.some((e) => e.art === 'treffer'))
  pruefe('als Superkoch wird weggeraeumt', skE.some((e) => e.art === 'wegfegen'))
  pruefe('als Superkoch laeuft der Lauf weiter', sk.vorbei === false)
  /* Nach Ablauf trifft dasselbe Teil wieder toedlich. */
  sk.superBis = 0
  sk.unverwundbarBis = 0
  gegnerSetzen(sk, 'backofen', sk.spieler.x, sk.spieler.y + FIGUR_H / 2)
  pruefe('nach dem Superkoch trifft es wieder', schritt(sk, 0).some((e) => e.art === 'treffer'))

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
  pruefe('Stufen bei 3, 5, 8, 12', COMBO_AB.join(',') === '3,5,8,12')
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
    /* Sanft mitziehen: kein Spiel, sondern ein Generator-Durchlauf. Die
       Figur bleibt dabei unverwundbar — sonst waere hier der erste
       Treffer zu messen und nicht der Generator. */
    stand.spieler.y += 0.02
    if (stand.spieler.vy < 0) stand.spieler.vy = 0
    stand.unverwundbarBis = stand.zeit + 1
    schritt(stand, 0)
    gaben += stand.gaben.length
    gegner += stand.gegner.length
    for (const g of stand.gegner) arten.add(g.art)
  }
  pruefe('fliegende Teile entstehen im Lauf', gegner > 0)
  pruefe('Kraefte entstehen im Lauf', gaben > 0)
  pruefe('viele Teilesorten kommen vor', arten.size >= 8, [...arten].join(', '))
  pruefe('nur bekannte Teilesorten', [...arten].every((a) => GEGNER_ARTEN.includes(a)))
  pruefe('Teile bleiben im Feld', [...stand.gegner].every((g) => g.x >= 0 && g.x < 1))
  pruefe('Teileliste laeuft nicht voll (Aufraeumen wirkt)', stand.gegner.length <= 40, String(stand.gegner.length))
  pruefe('Kraefteliste laeuft nicht voll', stand.gaben.length <= 20, String(stand.gaben.length))
  pruefe('Plattenliste laeuft nicht voll', stand.platten.length <= 400, String(stand.platten.length))
  /* Gezogen wird die Figur von aussen, sie landet dabei kaum — die
     erreichte HOEHE steht darum an ihrer Position, nicht an der
     gewerteten Bestmarke. */
  pruefe('HOEHE wurde wirklich erreicht', hoeheVon(stand.spieler.y) > GEGNER_AB_HOEHE, String(Math.round(hoeheVon(stand.spieler.y))))
  pruefe('Lauf lief bis zum Ende durch', stand.vorbei === false)
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

  /* Treffer duerfen die Figur nicht in eine Endlosschleife werfen: der
     Schritt muss auch nach zweitausend Treffern noch zurueckkommen. Die
     Schuerze wird dabei jedes Mal neu aufgezogen — nur so laesst sich der
     toedliche Treffer zweitausendmal hintereinander ausloesen. */
  const b = ruhigerStand()
  let n = 0
  while (n < 2000) {
    n += 1
    b.unverwundbarBis = 0
    b.schutz = true
    b.spieler.vy = 2
    gegnerSetzen(b, GEGNER_ARTEN[n % GEGNER_ARTEN.length], b.spieler.x, b.spieler.y + FIGUR_H / 2)
    schritt(b, 0)
  }
  pruefe('2000 Treffer ohne Haenger', b.treffer === 2000, String(b.treffer))
  pruefe('kein Treffer hat den Lauf beendet (Schuerze hielt)', b.vorbei === false)
  pruefe('Gegnerliste bleibt endlich', b.gegner.filter((g) => !g.weg).length === 0)
}

/* ------------------------------------------------------------------ */
/* Die Darstellungsschicht laesst sich ohne Browser nicht ausfuehren.
   Nachweisbar ist aber, dass die Versprechen aus §2-§5 wirklich im
   Quelltext stehen und zu den Listen der Logik passen — dafuer wird
   VidekoJump.jsx als Text gelesen. Das ersetzt keinen Blick aufs Geraet,
   verhindert aber, dass eine Zusage still wieder herausfaellt. */
console.log('\nDarstellung haelt, was die Logik anbietet (§2-§5)')
{
  const jsx = readFileSync(resolve(WURZEL, 'src/components/spiele/VidekoJump.jsx'), 'utf8')
  const css = readFileSync(resolve(WURZEL, 'src/components/spiele/jump.css'), 'utf8')

  /** Ein Objektliteral aus dem Quelltext schneiden (Klammern zaehlen). */
  function block(name) {
    const start = jsx.indexOf(`const ${name} = {`)
    if (start < 0) return ''
    let tiefe = 0
    for (let i = jsx.indexOf('{', start); i < jsx.length; i += 1) {
      if (jsx[i] === '{') tiefe += 1
      else if (jsx[i] === '}') {
        tiefe -= 1
        if (tiefe === 0) return jsx.slice(start, i + 1)
      }
    }
    return ''
  }
  const schluessel = (name, muster) => [...block(name).matchAll(muster)].map((t) => t[1])
  const fehlt = (liste, haben) => liste.filter((a) => !haben.includes(a))

  /* §2 Steuerung: Daumen zieht, Neigung ist nur die Kuer. */
  pruefe('Steuerung liest die Fingerachse analog (zeigerAchse)', jsx.includes('zeigerAchse('))
  pruefe('Neigung laeuft ueber neigungAchse und tiefpass',
    jsx.includes('neigungAchse(') && jsx.includes('tiefpass('))
  pruefe('alte Zweiseiten-Steuerung ist raus (seiteVon, neigungRichtung)',
    !jsx.includes('seiteVon') && !jsx.includes('neigungRichtung'))
  pruefe('Null 0 wird aus mehreren Proben kalibriert',
    jsx.includes('NEIGUNG_PROBEN') && /n\.null0 = n\.summe \/ n\.proben/.test(jsx))
  pruefe('Buehne startet auf Touch', /data-steuerung="touch"/.test(jsx))
  /* 0 ist eine gueltige Achse: der Zug darf nicht per Wahrheitswert pruefen. */
  pruefe('Ziehen prueft has() statt Wahrheitswert (0 bleibt gueltig)',
    /finger\.has\(e\.pointerId\) \|\| finger\.get\(e\.pointerId\) === null/.test(jsx))

  /* §3 Treffer: toedlich, ausser die Schuerze faengt ihn. */
  pruefe('Schuerze meldet ihre Rettung', jsx.includes('SCHÜRZE GERETTET.'))
  pruefe('alter weicher Schuerzentext ist weg', !jsx.includes('SCHÜRZE HÄLT'))
  pruefe('toedlicher Treffer merkt sich seinen Satz',
    /if \(e\.toedlich\) bildRef\.current\.endeText = text/.test(jsx))
  pruefe('das Ende zeigt diesen Satz', /bildRef\.current\.endeText \|\| 'ABGESTÜRZT'/.test(jsx))

  /* §4 Rote Platte: Boost, Bonus, Funken, fliegende Muetze. */
  pruefe('kein totes heiss-Ereignis mehr', !jsx.includes("e.art === 'heiss'"))
  pruefe('Boostlandung feiert mit HEISS und Bonuszahl', /melden\('gold', `HEISS! \+\$\{HERD_BONUS\}`\)/.test(jsx))
  pruefe('Rauch steigt auf (negative Schwere)', /schwere: -\d/.test(jsx))
  pruefe('Muetze fliegt nach dem Boost', jsx.includes('BOOST_FLUG_MS') && /flugSeit < BOOST_FLUG_MS/.test(jsx))
  pruefe('rote Platte zeigt Pfeile nach oben', jsx.includes("ctx.lineCap = 'round'"))

  /* §5 Kraefte und Wellen: jede Sorte der Logik hat ihre Anzeige. */
  const gabeWorte = schluessel('SPRUCH_GABE', /(\w+):\s*'/g)
  pruefe('jede Kraft hat einen Ruf', fehlt(GABE_ARTEN, gabeWorte).length === 0, fehlt(GABE_ARTEN, gabeWorte).join(', '))
  pruefe('keine Kraft im Text, die es nicht gibt', fehlt(gabeWorte, GABE_ARTEN).length === 0, fehlt(gabeWorte, GABE_ARTEN).join(', '))

  const wellenWorte = schluessel('SPRUCH_WELLE', /(\w+):\s*\{/g)
  pruefe('jede Welle hat Titel und Satz', fehlt(WELLEN, wellenWorte).length === 0, fehlt(WELLEN, wellenWorte).join(', '))
  pruefe('keine Welle im Text, die es nicht gibt', fehlt(wellenWorte, WELLEN).length === 0, fehlt(wellenWorte, WELLEN).join(', '))
  pruefe('Wellen zeigen wirklich Titel und Satz',
    /titel:/.test(block('SPRUCH_WELLE')) && /satz:/.test(block('SPRUCH_WELLE')))

  /* §1d.1 Jedes Gewerk hat seinen eigenen trockenen Abgang. */
  const trefferWorte = schluessel('SPRUCH_TREFFER', /(\w+):\s*'/g)
  pruefe('jedes Teil hat einen eigenen Spruch', fehlt(GEGNER_ARTEN, trefferWorte).length === 0, fehlt(GEGNER_ARTEN, trefferWorte).join(', '))
  pruefe('kein Spruch fuer ein Teil, das es nicht gibt', fehlt(trefferWorte, GEGNER_ARTEN).length === 0, fehlt(trefferWorte, GEGNER_ARTEN).join(', '))
  const trefferSaetze = [...block('SPRUCH_TREFFER').matchAll(/\w+:\s*'([^']*)'/g)].map((t) => t[1])
  pruefe('alle Abgaenge sind verschieden formuliert',
    new Set(trefferSaetze).size === trefferSaetze.length, String(trefferSaetze.length))

  /* Anzeige der beiden neuen Kraefte — Chip im JSX, Farbe im CSS. */
  pruefe('Magnet und Superkoch haben eigene Chips',
    /data-art="magnet"/.test(jsx) && /data-art="superkoch"/.test(jsx))
  pruefe('beide Chips sind im CSS gestaltet',
    css.includes("data-art='magnet'") && css.includes("data-art='superkoch'"))
  pruefe('der helle Superkoch-Chip steht bei reduzierter Bewegung still',
    /data-sanft='1'\] \.trm-jump-kraft\[data-art='superkoch'\]/.test(css))
  pruefe('Kraefte lesen dieselben Felder wie die Logik',
    jsx.includes('stand.magnetBis') && jsx.includes('stand.superBis'))
  pruefe('Magnetreichweite wird mit MAGNET_R gezeichnet', jsx.includes('MAGNET_R *'))
  pruefe('drehende Teile drehen nach Liste der Logik', /GEGNER_DREH\[g\.art\]/.test(jsx))
}

console.log(`\n${gut} ok, ${schlecht} fehlgeschlagen\n`)
process.exit(schlecht ? 1 : 0)
