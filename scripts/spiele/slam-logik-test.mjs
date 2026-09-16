/**
 * VIDEKO SLAM — Test der Spiellogik, ohne Browser.
 *
 *   node scripts/spiele/slam-logik-test.mjs
 *
 * Prueft die reinen Funktionen aus slam-logik.js: den Objektkatalog, die
 * Schwierigkeitskurven, Wertung und Combo, die vier Speziale samt Osterei,
 * das saubere Ablaufen der Fronten — und laesst am Ende Bots laufen, damit
 * die Servergrenzen in api/_terminal-kern.js an gemessenen Zahlen haengen
 * und nicht an einem Bauchgefuehl. Kein React, kein DOM, keine Uhr.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  BASIS_PUNKTE,
  CHAOS_FAKTOR,
  CHAOS_MS,
  ENTE_PUNKTE,
  FRONTEN_MAX,
  FRONTEN_MIN,
  FRONTEN_STUFE,
  FROST_MS,
  GOLD_PUNKTE,
  GUTE,
  MAX_JE_TREFFER,
  MIST_STUFE,
  OBJEKTE,
  SCHLECHTE,
  SELTEN,
  SERIE_MELDEN,
  SICHT_STUFE,
  SPEZIALE,
  SPIELZEIT_MS,
  SPRUECHE,
  STRAFE_MS,
  STUFEN_MS,
  STUFE_MAX,
  TAKT_STUFE,
  TEMPO_SCHNELL,
  TEMPO_SCHNELL_MS,
  TEMPO_ZUEGIG,
  TEMPO_ZUEGIG_MS,
  WIRKUNG,
  chaosAktiv,
  faktorFuer,
  frostAktiv,
  frontenFuer,
  meldungFuer,
  mistAnteilFuer,
  offeneFronten,
  punkteFuer,
  schlagen,
  sichtFuer,
  spielStart,
  spruch,
  stufeFuer,
  takt,
  taktFuer,
  tempoBonus,
  zufallMitSaat,
} from '../../src/components/spiele/slam-logik.js'

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

/* ------------------------------------------------------------------ */
console.log('\nObjektkatalog: VIDEKO-Universum, keine fremden Marken')
{
  pruefe('jedes Objekt hat Id, Name, Art und Bild', OBJEKTE.every((o) => o.id && o.name && o.art && o.bild))
  const ids = OBJEKTE.map((o) => o.id)
  pruefe('keine Id doppelt', new Set(ids).size === ids.length)
  pruefe('genug gute Sachen', GUTE.length >= 10, `${GUTE.length}`)
  pruefe('genug Mist', SCHLECHTE.length >= 6, `${SCHLECHTE.length}`)
  pruefe('fuenf Speziale', SPEZIALE.length === 5, `${SPEZIALE.length}`)

  const wirkungen = SPEZIALE.map((o) => o.wirkung).sort()
  pruefe('die vier Wirkungen plus Ente sind da', wirkungen.join(',') === 'chaos,ente,frost,gold,hitze', wirkungen.join(','))
  pruefe('nur Speziale haben eine Wirkung', OBJEKTE.every((o) => (o.art === 'spezial') === Boolean(o.wirkung)))

  /* Der Auftrag nennt ausdruecklich: VD-Symbol, Werkzeug, PV, Leuchte,
     Wasserhahn, Designstuhl, Waschbecken, Kochmuetze, Schluessel, Gold. */
  const namen = OBJEKTE.map((o) => o.name).join(' ')
  for (const wort of ['PV-MODUL', 'LEUCHTE', 'WASSERHAHN', 'DESIGNSTUHL', 'WASCHTISCH', 'KOCHMÜTZE', 'SCHLÜSSEL', 'GOLD']) {
    pruefe(`"${wort}" ist im Katalog`, namen.includes(wort))
  }
  for (const wort of ['KLOBÜRSTE', 'ZIEGEL', 'SCHUH', 'KABELSALAT', 'TOAST', 'MÜLLSACK', 'SÄGE']) {
    pruefe(`Mist "${wort}" ist im Katalog`, namen.includes(wort))
  }
  pruefe('die Gummiente ist das Osterei', SPEZIALE.some((o) => o.wirkung === WIRKUNG.ente && /ENTE/.test(o.name)))

  /* Keine fremde Firma im Spiel — VIDEKO bleibt die einzige Marke. */
  const fremd = ['QUOOKER', 'BOSCH', 'SIEMENS', 'MIELE', 'IKEA', 'NOBILIA', 'AEG', 'NEFF', 'BLANCO', 'GROHE', 'HANSGROHE']
  pruefe('keine fremde Marke im Katalog', !fremd.some((m) => namen.toUpperCase().includes(m)), namen)
  pruefe('VIDEKO steht als Dachmarke drin', namen.includes('VIDEKO'))

  /* Die Sprueche tragen den Ton, nicht die Information: kurz, gross, keiner
     doppelt, und sie laufen sauber reihum. */
  for (const [gruppe, liste] of Object.entries(SPRUECHE)) {
    pruefe(`Sprueche "${gruppe}" sind kurz`, liste.every((s) => s.length <= 40), liste.join(' | '))
    pruefe(`Sprueche "${gruppe}" sind laut`, liste.every((s) => s === s.toUpperCase()))
    pruefe(`Sprueche "${gruppe}" ohne Dubletten`, new Set(liste).size === liste.length)
    pruefe(`Sprueche "${gruppe}" laufen reihum`, spruch(gruppe, liste.length) === liste[0] && spruch(gruppe, 1) === liste[1 % liste.length])
  }
  pruefe('ein unbekannter Spruchtopf gibt leer zurueck', spruch('gibtsnicht', 3) === '')
  pruefe('negative Zaehler kippen den Spruch nicht', typeof spruch('fehler', -5) === 'string')
}

/* ------------------------------------------------------------------ */
console.log('\nRundenlaenge und Schwierigkeit')
{
  pruefe('die Runde liegt zwischen 45 und 60 Sekunden', SPIELZEIT_MS >= 45000 && SPIELZEIT_MS <= 60000, `${SPIELZEIT_MS} ms`)
  pruefe('die Stufen reichen ueber die Runde', STUFEN_MS * (STUFE_MAX - 1) < SPIELZEIT_MS, `${STUFEN_MS * (STUFE_MAX - 1)} ms`)
  pruefe('die letzte Stufe wird erreicht', stufeFuer(SPIELZEIT_MS - 1) === STUFE_MAX)
  pruefe('Stufe 1 ab der ersten Millisekunde', stufeFuer(0) === 1 && stufeFuer(-99) === 1)
  pruefe('die Stufe bleibt bei STUFE_MAX stehen', stufeFuer(SPIELZEIT_MS * 10) === STUFE_MAX)
  pruefe('kaputte Zeit gibt Stufe 1', stufeFuer(NaN) === 1)

  for (const [name, tabelle] of [['Fronten', FRONTEN_STUFE], ['Takt', TAKT_STUFE], ['Sicht', SICHT_STUFE], ['Mist', MIST_STUFE]]) {
    pruefe(`Tabelle ${name} hat einen Wert je Stufe`, tabelle.length === STUFE_MAX, `${tabelle.length}`)
  }
  pruefe('6 bis 9 Fronten, nie mehr', FRONTEN_STUFE.every((n) => n >= FRONTEN_MIN && n <= FRONTEN_MAX))
  pruefe('die Fronten werden nie weniger', FRONTEN_STUFE.every((n, i) => i === 0 || n >= FRONTEN_STUFE[i - 1]))
  pruefe('der Takt wird nur schneller', TAKT_STUFE.every((n, i) => i === 0 || n < TAKT_STUFE[i - 1]))
  pruefe('die Sichtzeit wird nur kuerzer', SICHT_STUFE.every((n, i) => i === 0 || n < SICHT_STUFE[i - 1]))
  pruefe('der Mistanteil steigt nur', MIST_STUFE.every((n, i) => i === 0 || n > MIST_STUFE[i - 1]))
  pruefe('Mist bleibt in der Minderheit', MIST_STUFE.every((n) => n < 0.5), MIST_STUFE.join(','))
  pruefe('auch auf Stufe 5 reicht die Zeit zum Sehen', sichtFuer(STUFE_MAX) >= 800, `${sichtFuer(STUFE_MAX)} ms`)
  pruefe('es kommt nie mehr als eine Sache je Sichtfenster je Front', taktFuer(STUFE_MAX) * frontenFuer(STUFE_MAX) > sichtFuer(STUFE_MAX))
  pruefe('ausserhalb der Tabelle wird geklemmt', taktFuer(0) === TAKT_STUFE[0] && taktFuer(99) === TAKT_STUFE[STUFE_MAX - 1])
  pruefe('mistAnteilFuer klemmt ebenso', mistAnteilFuer(0) === MIST_STUFE[0] && mistAnteilFuer(99) === MIST_STUFE[STUFE_MAX - 1])
}

/* ------------------------------------------------------------------ */
console.log('\nWertung: Combo, Tempo, Decke')
{
  pruefe('ohne Combo der einfache Faktor', faktorFuer(0) === 1 && faktorFuer(2) === 1)
  pruefe('die Faktoren steigen mit der Serie', faktorFuer(3) === 1.5 && faktorFuer(6) === 2 && faktorFuer(10) === 2.5 && faktorFuer(15) === 3)
  pruefe('ueber 15 bleibt es bei 3', faktorFuer(400) === 3)
  pruefe('ein schneller Schlag bringt Tempo', tempoBonus(TEMPO_SCHNELL_MS - 1) === TEMPO_SCHNELL)
  pruefe('ein zuegiger bringt weniger', tempoBonus(TEMPO_ZUEGIG_MS - 1) === TEMPO_ZUEGIG)
  pruefe('ein langsamer bringt nichts', tempoBonus(TEMPO_ZUEGIG_MS) === 0)
  pruefe('kaputte Zeit bringt nichts', tempoBonus(NaN) === 0 && tempoBonus(-4) === 0)
  pruefe('der erste Treffer bringt die Basis', punkteFuer(1, 9999) === BASIS_PUNKTE)
  pruefe('Chaos verdoppelt', punkteFuer(1, 9999, true) === BASIS_PUNKTE * CHAOS_FAKTOR)
  const hoechst = punkteFuer(99, 0, true)
  pruefe('nichts geht ueber die Decke', hoechst <= MAX_JE_TREFFER, `${hoechst}`)
  /* Der beste normale Treffer bleibt deutlich unter der Decke — die Decke ist
     fuer Gold in der Chaos-Phase da, nicht fuer den Alltag. */
  pruefe('ein normaler Treffer bleibt klar unter der Decke', hoechst < MAX_JE_TREFFER * 0.9, `${hoechst}`)
  pruefe('Gold im Chaos laeuft in die Decke', Math.min(MAX_JE_TREFFER, GOLD_PUNKTE * CHAOS_FAKTOR) === MAX_JE_TREFFER)
  pruefe('die Serienmeldungen sind aufsteigend', SERIE_MELDEN.every((n, i) => i === 0 || n > SERIE_MELDEN[i - 1]))
}

/* ------------------------------------------------------------------ */
console.log('\nFeld: kommen, stehen, ablaufen')
{
  let z = spielStart(zufallMitSaat(7))
  pruefe('das Feld startet leer', z.fronten.every((f) => f === null))
  pruefe('es gibt immer FRONTEN_MAX Plaetze', z.fronten.length === FRONTEN_MAX)
  pruefe('bespielt werden zu Beginn FRONTEN_MIN', offeneFronten(z) === FRONTEN_MIN)

  let kam = 0
  for (let i = 0; i < 200; i += 1) {
    const r = takt(z, 16)
    z = r.zustand
    kam += r.ereignisse.filter((e) => e.art === 'kommt').length
  }
  pruefe('nach drei Sekunden steht etwas auf dem Feld', kam > 0, `${kam} Erscheinungen`)
  pruefe('nichts steht ausserhalb der offenen Fronten', z.fronten.slice(offeneFronten(z)).every((f) => f === null))
  pruefe('kein Platz ist doppelt belegt', new Set(z.fronten.filter(Boolean).map((e) => e.nr)).size === z.fronten.filter(Boolean).length)

  /* Alles laeuft irgendwann ab — und nur was wirklich ablaeuft, zaehlt als
     verpasst. */
  const vorher = z.verpasst
  const wegs = []
  for (let i = 0; i < 400; i += 1) {
    const r = takt(z, 16)
    z = r.zustand
    for (const e of r.ereignisse) if (e.art === 'weg') wegs.push(e)
  }
  pruefe('Stehengelassenes verschwindet wieder', wegs.length > 0, `${wegs.length} abgelaufen`)
  pruefe('durchgelassenes Gut zaehlt als verpasst', z.verpasst > vorher)
  pruefe('jedes "weg" sagt, ob es abgelaufen ist', wegs.every((e) => typeof e.abgelaufen === 'boolean'))
  pruefe('jedes "weg" nennt Platz und Eintrag', wegs.every((e) => Number.isInteger(e.platz) && e.eintrag && e.eintrag.nr))
  pruefe('was von selbst geht, war auch wirklich abgelaufen', wegs.every((e) => e.abgelaufen))
  const gutWeg = wegs.filter((e) => e.abgelaufen && e.eintrag.art === 'gut').length
  pruefe('genau das durchgelassene Gute ist gezaehlt', z.verpasst - vorher === gutWeg, `${z.verpasst - vorher} vs ${gutWeg}`)

  /* Ein zu grosser Zeitsprung (Tab im Hintergrund) darf das Feld nicht
     fluten: der Schritt wird geklemmt. */
  const sprung = takt(z, 60000)
  pruefe('ein Zeitsprung wird geklemmt', sprung.zustand.zeitMs - z.zeitMs <= 250, `${sprung.zustand.zeitMs - z.zeitMs} ms`)
  pruefe('und erzeugt keine Flut', sprung.ereignisse.filter((e) => e.art === 'kommt').length <= FRONTEN_MAX)
  pruefe('ein Takt ohne Zeit aendert die Uhr nicht', takt(z, 0).zustand.zeitMs === z.zeitMs)
}

/* ------------------------------------------------------------------ */
console.log('\nSchlagen: Treffer, Mist, ins Leere')
{
  const bauen = (objekt, zeitMs = 5000, umbau = {}) => {
    const z = { ...spielStart(zufallMitSaat(3)), zeitMs, ...umbau }
    z.fronten = z.fronten.slice()
    z.fronten[0] = { nr: 1, id: objekt.id, art: objekt.art, wirkung: objekt.wirkung || null, name: objekt.name, bild: objekt.bild, abMs: zeitMs - 200, bisMs: zeitMs + 800 }
    return z
  }

  const leer = schlagen(spielStart(zufallMitSaat(3)), 2)
  pruefe('ins Leere schlagen kostet nichts', leer.ereignis.art === 'leer' && leer.ereignis.punkte === 0)
  pruefe('und bricht die Serie nicht', leer.zustand.combo === spielStart(zufallMitSaat(3)).combo)

  const treffer = schlagen(bauen(GUTE[0]), 0)
  pruefe('ein gutes Teil bringt Punkte', treffer.ereignis.art === 'treffer' && treffer.ereignis.punkte > 0)
  pruefe('und baut die Serie auf', treffer.zustand.combo === 1 && treffer.zustand.besteCombo === 1)
  pruefe('die Front ist danach frei', treffer.zustand.fronten[0] === null)
  pruefe('der Schlag ist gezaehlt', treffer.zustand.schlaege === 1 && treffer.zustand.treffer === 1)
  pruefe('die Reaktionszeit steht im Ereignis', treffer.ereignis.reaktionMs === 200)

  const mist = schlagen({ ...bauen(SCHLECHTE[0]), combo: 7 }, 0)
  pruefe('Mist bringt keine Punkte', mist.ereignis.art === 'mist' && mist.ereignis.punkte === 0)
  pruefe('Mist kostet Zeit', mist.ereignis.strafeMs === STRAFE_MS && mist.zustand.strafeMs === STRAFE_MS)
  pruefe('Mist bricht die Serie', mist.zustand.combo === 0 && mist.ereignis.comboVorher === 7)
  pruefe('Mist zaehlt als Fehler, nicht als Treffer', mist.zustand.fehler === 1 && mist.zustand.treffer === 0)

  const gold = SPEZIALE.find((o) => o.wirkung === WIRKUNG.gold)
  const g = schlagen(bauen(gold), 0)
  pruefe('Gold zahlt sein Paket', g.ereignis.art === 'gold' && g.ereignis.punkte === GOLD_PUNKTE)
  pruefe('Gold zaehlt zur Serie', g.zustand.combo === 1 && g.zustand.gold === 1)

  const frost = SPEZIALE.find((o) => o.wirkung === WIRKUNG.frost)
  const fz = bauen(frost)
  fz.fronten = fz.fronten.slice()
  fz.fronten[1] = { nr: 2, id: GUTE[1].id, art: 'gut', wirkung: null, name: GUTE[1].name, bild: GUTE[1].bild, abMs: 4800, bisMs: 5800 }
  const f = schlagen(fz, 0)
  pruefe('Frost friert das Feld ein', f.ereignis.art === 'frost' && frostAktiv(f.zustand))
  pruefe('Frost haelt FROST_MS', f.zustand.frostBis === fz.zeitMs + FROST_MS)
  pruefe('Frost verlaengert auch, was schon steht', f.zustand.fronten[1].bisMs > 5800)
  pruefe('Frost selbst bringt keine Punkte', f.ereignis.punkte === 0)

  const hitze = SPEZIALE.find((o) => o.wirkung === WIRKUNG.hitze)
  const hz = bauen(hitze)
  hz.fronten = hz.fronten.slice()
  hz.fronten[1] = { nr: 2, id: SCHLECHTE[0].id, art: 'schlecht', wirkung: null, name: 'X', bild: 'x', abMs: 4800, bisMs: 5800 }
  hz.fronten[2] = { nr: 3, id: SCHLECHTE[1].id, art: 'schlecht', wirkung: null, name: 'Y', bild: 'y', abMs: 4800, bisMs: 5800 }
  hz.fronten[3] = { nr: 4, id: GUTE[2].id, art: 'gut', wirkung: null, name: 'Z', bild: 'z', abMs: 4800, bisMs: 5800 }
  const h = schlagen(hz, 0)
  pruefe('Hitze raeumt allen Mist', h.ereignis.art === 'hitze' && h.ereignis.weg === 2)
  pruefe('Hitze laesst Gutes stehen', h.zustand.fronten[3] !== null)
  pruefe('Hitze zahlt fuer das Geraeumte', h.ereignis.punkte > 0)

  const chaos = SPEZIALE.find((o) => o.wirkung === WIRKUNG.chaos)
  const c = schlagen(bauen(chaos), 0)
  pruefe('Chaos startet die Phase', c.ereignis.art === 'chaos' && chaosAktiv(c.zustand))
  pruefe('Chaos haelt CHAOS_MS', c.zustand.chaosBis === 5000 + CHAOS_MS)
  const imChaos = schlagen({ ...bauen(GUTE[0]), chaosBis: 99999 }, 0)
  pruefe('im Chaos zaehlt ein Treffer doppelt', imChaos.ereignis.punkte === treffer.ereignis.punkte * CHAOS_FAKTOR)

  const ente = SPEZIALE.find((o) => o.wirkung === WIRKUNG.ente)
  const e = schlagen({ ...bauen(ente), combo: 4 }, 0)
  pruefe('die Ente kostet nichts', e.ereignis.art === 'ente' && e.zustand.strafeMs === 0)
  pruefe('die Ente bricht die Serie nicht', e.zustand.combo === 4)
  pruefe('die Ente gibt ein kleines Trinkgeld', e.ereignis.punkte === ENTE_PUNKTE)
}

/* ------------------------------------------------------------------ */
console.log('\nMeldungen')
{
  const arten = new Set()
  for (const ereignis of [
    { art: 'mist', strafeMs: STRAFE_MS },
    { art: 'gold', punkte: GOLD_PUNKTE },
    { art: 'frost' },
    { art: 'hitze', weg: 3 },
    { art: 'chaos' },
    { art: 'ente' },
    { art: 'treffer', punkte: 150, reaktionMs: 200, serie: 0 },
    { art: 'treffer', punkte: 150, reaktionMs: 900, serie: 10 },
  ]) {
    const m = meldungFuer(ereignis, 1)
    pruefe(`"${ereignis.art}" hat eine Meldung`, Boolean(m && m.art && m.text))
    if (m) arten.add(m.art)
  }
  pruefe('ein leerer Schlag meldet nichts', meldungFuer({ art: 'leer' }) === null)
  pruefe('die Meldungsarten passen zu den Rufklassen', [...arten].every((a) => ['treffer', 'gut', 'gold', 'perfekt', 'verkantet'].includes(a)), [...arten].join(','))
  pruefe('der Mist sagt, was er kostet', meldungFuer({ art: 'mist' }, 0).text.includes('1,5') || meldungFuer({ art: 'mist' }, 0).text.includes('1.5'))
  pruefe('und traegt einen trockenen Satz', SPRUECHE.fehler.includes(meldungFuer({ art: 'mist' }, 0).klein))
}

/* ------------------------------------------------------------------ */
console.log('\nSeltenheit: die Speziale bleiben selten')
{
  let z
  const zahl = {}
  let kommt = 0
  for (let runde = 0; runde < 40; runde += 1) {
    z = spielStart(zufallMitSaat(100 + runde))
    for (let i = 0; i < SPIELZEIT_MS / 16; i += 1) {
      const r = takt(z, 16)
      z = r.zustand
      for (const e of r.ereignisse) {
        if (e.art !== 'kommt') continue
        kommt += 1
        zahl[e.eintrag.art] = (zahl[e.eintrag.art] || 0) + 1
        if (e.eintrag.wirkung) zahl[e.eintrag.wirkung] = (zahl[e.eintrag.wirkung] || 0) + 1
      }
      /* Das Feld leerschlagen, damit Nachschub kommt. */
      for (let p = 0; p < FRONTEN_MAX; p += 1) if (z.fronten[p]) z = schlagen(z, p).zustand
    }
  }
  const anteil = (k) => (zahl[k] || 0) / kommt
  pruefe('ueberwiegend kommt Gutes', anteil('gut') > 0.5, `${(anteil('gut') * 100).toFixed(1)} %`)
  pruefe('Mist bleibt darunter', anteil('schlecht') < anteil('gut'), `${(anteil('schlecht') * 100).toFixed(1)} %`)
  pruefe('Speziale bleiben unter einem Zehntel', anteil('spezial') < 0.1, `${(anteil('spezial') * 100).toFixed(1)} %`)
  for (const wirkung of Object.keys(SELTEN)) {
    pruefe(`"${wirkung}" kommt ueberhaupt vor`, (zahl[wirkung] || 0) > 0, `${zahl[wirkung] || 0}x`)
  }
  pruefe('die Ente ist das seltenste Stueck', anteil('ente') <= anteil('gold'), `Ente ${(anteil('ente') * 100).toFixed(2)} %, Gold ${(anteil('gold') * 100).toFixed(2)} %`)
  console.log(`        ${kommt} Erscheinungen: ${(anteil('gut') * 100).toFixed(1)} % gut, ${(anteil('schlecht') * 100).toFixed(1)} % Mist, ${(anteil('spezial') * 100).toFixed(1)} % Spezial`)
}

/* ------------------------------------------------------------------ */
console.log('\nBots: was ist ueberhaupt erreichbar (Grundlage der Servergrenzen)')
{
  /**
   * Ein Bot spielt eine volle Runde. `reaktionMs` ist die Zeit, die er
   * braucht, bis er auf etwas Neues schlaegt; `fehlerQuote` der Anteil der
   * Mistteile, auf die er trotzdem draufhaut. Der perfekte Bot ist kein
   * Mensch — er sieht alles sofort und trifft nie daneben. Genau deshalb
   * taugt sein Ergebnis als Obergrenze.
   */
  function botLauf(saat, { reaktionMs = 0, fehlerQuote = 0, faul = 0 } = {}) {
    let z = spielStart(zufallMitSaat(saat))
    const zuf = zufallMitSaat(saat * 7 + 1)
    let strafe = 0
    while (z.zeitMs < SPIELZEIT_MS - strafe) {
      z = takt(z, 16).zustand
      for (let p = 0; p < FRONTEN_MAX; p += 1) {
        const e = z.fronten[p]
        if (!e) continue
        if (z.zeitMs - e.abMs < reaktionMs) continue
        if (e.art === 'schlecht' && zuf() >= fehlerQuote) continue
        if (e.art === 'gut' && zuf() < faul) continue
        const r = schlagen(z, p)
        z = r.zustand
        if (r.ereignis.strafeMs) strafe += r.ereignis.strafeMs
      }
    }
    /* Der Server rechnet in "Runden": das ist hier die Zahl der Schlaege, die
       der Client meldet. Daraus fallen die beiden Grenzen msJeRunde (wie kurz
       eine Runde hoechstens dauern darf) und maxJeRunde (wie viel eine Runde
       hoechstens einbringen darf). */
    const schlaege = z.schlaege
    return {
      punkte: z.punkte,
      schlaege,
      besteCombo: z.besteCombo,
      fehler: z.fehler,
      verpasst: z.verpasst,
      msJeSchlag: schlaege ? SPIELZEIT_MS / schlaege : Infinity,
      jeSchlag: schlaege ? z.punkte / schlaege : 0,
    }
  }

  let bester = null
  let hoechsterSchnitt = 0
  let kuerzesterTakt = Infinity
  let meisteSchlaege = 0
  for (let saat = 1; saat <= 60; saat += 1) {
    const lauf = botLauf(saat)
    if (!bester || lauf.punkte > bester.punkte) bester = lauf
    hoechsterSchnitt = Math.max(hoechsterSchnitt, lauf.jeSchlag)
    kuerzesterTakt = Math.min(kuerzesterTakt, lauf.msJeSchlag)
    meisteSchlaege = Math.max(meisteSchlaege, lauf.schlaege)
  }
  const mensch = botLauf(5, { reaktionMs: 420, fehlerQuote: 0.12, faul: 0.18 })
  const schwach = botLauf(9, { reaktionMs: 700, fehlerQuote: 0.3, faul: 0.4 })

  console.log(`        perfekter Bot:  ${bester.punkte} Punkte aus ${bester.schlaege} Schlaegen, beste Serie ${bester.besteCombo}`)
  console.log(`        guter Mensch:   ${mensch.punkte} Punkte aus ${mensch.schlaege} Schlaegen, ${mensch.fehler} Fehler, ${mensch.verpasst} verpasst`)
  console.log(`        schwach:        ${schwach.punkte} Punkte aus ${schwach.schlaege} Schlaegen, ${schwach.fehler} Fehler, ${schwach.verpasst} verpasst`)
  console.log(`        Messwerte fuer den Server: max ${meisteSchlaege} Schlaege, kuerzester Schnitt ${Math.round(kuerzesterTakt)} ms/Schlag, hoechster Schnitt ${Math.round(hoechsterSchnitt)} Punkte/Schlag`)

  pruefe('der beste Bot bleibt unter der Punktdecke mal Schlaegen', bester.punkte <= bester.schlaege * MAX_JE_TREFFER)
  pruefe('ein guter Mensch bleibt klar unter dem Bot', mensch.punkte < bester.punkte, `${mensch.punkte} vs ${bester.punkte}`)
  pruefe('ein schwacher Lauf lohnt sich trotzdem', schwach.punkte > 0, `${schwach.punkte}`)
  pruefe('der perfekte Bot greift nie daneben', bester.fehler === 0, `${bester.fehler} Fehler`)
  pruefe('der perfekte Bot laesst nichts durch', bester.verpasst === 0, `${bester.verpasst} verpasst`)
  pruefe('wer danebengreift, verliert die Serie und damit Punkte', mensch.fehler > 0 && mensch.jeSchlag < bester.jeSchlag, `${Math.round(mensch.jeSchlag)} vs ${Math.round(bester.jeSchlag)}`)

  /* Die Servergrenzen sollen an diesen Messwerten haengen und nicht an einer
     Schaetzung. Deshalb wird die Zeile aus api/_terminal-kern.js hier als Text
     gelesen und gegen den Bot gehalten: ein ehrlicher Ausnahmelauf darf nie in
     den Verdacht laufen, ein erfundener Wert aber schon. */
  console.log('\nServergrenzen in api/_terminal-kern.js')
  const KERN = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../api/_terminal-kern.js'), 'utf8')
  const zeile = KERN.match(/videko_slam:\s*\{([^}]*)\}/)
  pruefe('die Zeile videko_slam steht im Katalog', Boolean(zeile))
  if (zeile) {
    const zahl = (name) => Number((zeile[1].match(new RegExp(`${name}:\\s*(\\d+)`)) || [])[1])
    const regeln = {
      dauerMs: zahl('dauerMs'),
      plausibel: zahl('plausibel'),
      hart: zahl('hart'),
      msJeRunde: zahl('msJeRunde'),
      maxJeRunde: zahl('maxJeRunde'),
    }
    pruefe('alle Grenzen sind gesetzt', Object.values(regeln).every((v) => Number.isFinite(v) && v > 0), JSON.stringify(regeln))
    pruefe('die Serverdauer ist die Spielzeit', regeln.dauerMs === SPIELZEIT_MS, `${regeln.dauerMs}`)
    pruefe('der beste Bot bleibt unter plausibel', bester.punkte < regeln.plausibel, `${bester.punkte} vs ${regeln.plausibel}`)
    pruefe('plausibel liegt trotzdem nicht im Leeren', regeln.plausibel < bester.punkte * 3, `${regeln.plausibel}`)
    pruefe('hart liegt ueber plausibel', regeln.hart > regeln.plausibel)
    pruefe('msJeRunde flaggt den schnellsten Bot nicht', regeln.msJeRunde * meisteSchlaege < SPIELZEIT_MS, `${regeln.msJeRunde} × ${meisteSchlaege}`)
    pruefe('msJeRunde hat Luft nach unten', regeln.msJeRunde < kuerzesterTakt / 2, `${regeln.msJeRunde} vs ${Math.round(kuerzesterTakt)}`)
    pruefe('maxJeRunde traegt die Punktdecke der Logik', regeln.maxJeRunde >= MAX_JE_TREFFER, `${regeln.maxJeRunde}`)
    pruefe('maxJeRunde flaggt den besten Schnitt nicht', regeln.maxJeRunde > hoechsterSchnitt, `${regeln.maxJeRunde} vs ${Math.round(hoechsterSchnitt)}`)
    /* Zeitstrafen kuerzen die Runde — auch die kuerzest moegliche Runde muss
       ueber der Haelfte von dauerMs bleiben, sonst faellt ein ehrlich
       verpatzter Lauf in den Dauerverdacht. */
    pruefe('auch eine voll verpatzte Runde bleibt ueber der Dauerschwelle', SPIELZEIT_MS - 10000 > regeln.dauerMs * 0.5, `${SPIELZEIT_MS - 10000} ms`)
  }
}

/* ------------------------------------------------------------------ */
console.log('\nDauerlauf: nichts laeuft aus dem Ruder')
{
  let z = spielStart(zufallMitSaat(31))
  const zuf = zufallMitSaat(41)
  for (let i = 0; i < 12000; i += 1) {
    z = takt(z, 16).zustand
    if (zuf() < 0.25) z = schlagen(z, Math.floor(zuf() * FRONTEN_MAX)).zustand
  }
  const zahlen = [z.punkte, z.combo, z.zeitMs, z.naechsteMs, z.treffer, z.fehler, z.verpasst]
  pruefe('alle Werte bleiben Zahlen', zahlen.every((v) => Number.isFinite(v)), zahlen.join(','))
  pruefe('die Punkte werden nie negativ', z.punkte >= 0)
  pruefe('das Feld bleibt so gross, wie es war', z.fronten.length === FRONTEN_MAX)
  pruefe('der Nachschubzeiger bleibt an der Uhr', z.naechsteMs >= z.zeitMs - 250 && z.naechsteMs <= z.zeitMs + 5000, `${Math.round(z.naechsteMs - z.zeitMs)} ms`)
  pruefe('die beste Serie ist nie kleiner als die aktuelle', z.besteCombo >= z.combo)
  console.log(`        ${Math.round(z.zeitMs / 1000)} s Dauerlauf: ${z.punkte} Punkte, ${z.treffer} Treffer, ${z.fehler} Fehler, ${z.verpasst} verpasst, beste Serie ${z.besteCombo}`)
}

console.log(`\n${gut} ok, ${schlecht} fehlgeschlagen`)
process.exit(schlecht ? 1 : 0)
