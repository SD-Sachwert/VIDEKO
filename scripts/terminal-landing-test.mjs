/**
 * Das Probespiel auf der Landing Page und der Vergleich danach.
 *
 * Zwei Dinge sollen hier fest sitzen, weil beide Versprechen an den Leser
 * sind und nicht bloss Gestaltung:
 *
 *   1. Die Probrunde zaehlt nicht. Kein Konto, kein Ticket, kein Score, kein
 *      Los — und die Seite sagt das auch, bevor jemand fragt.
 *   2. Der Satz danach erfindet keine Zahl. Ein Platz wird nur genannt, wenn
 *      er sich aus der veroeffentlichten Rangliste exakt abzaehlen laesst.
 *
 * Der erste Teil laeuft gegen die reine Rechnung aus src/data/terminal.js,
 * der zweite liest den Quelltext der Seite: ob das Probespiel wirklich ohne
 * Sitzung und ohne Ergebnisweg eingehaengt ist, laesst sich ohne Browser nur
 * dort nachsehen.
 *
 *   node scripts/terminal-landing-test.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  PRACTICE_STANDARD,
  PROBE_MINDEST,
  PROBE_MITTE,
  PROBE_SPITZE,
  TEXTE,
  probeListeAus,
  probeRangSatz,
} from '../src/data/terminal.js'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..')
const lies = (p) => readFileSync(join(wurzel, p), 'utf8')

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

/* ---------------------------------------------------------------- */
console.log('\n— Der Satz nach der Probrunde: nur abzaehlbare Plaetze')
{
  /* Eine veroeffentlichte Liste, wie sie der Server ohne Sitzung liefert:
     nur Punktwerte, absteigend. Fuenf Eintraege — das ist genau die
     Schwelle, ab der ein Platz ueberhaupt genannt werden darf. */
  const liste = [30000, 24000, 18000, 12000, 9000]
  pruefe('Die Testliste erreicht die Schwelle gerade so', liste.length === PROBE_MINDEST)

  const oben = probeRangSatz('da', liste, 31000)
  pruefe('Bester Wert: Platz 1', oben?.art === 'platz' && oben.text.includes('PLATZ 1.'), oben?.text)
  pruefe('Platz 1 ist kein Zufall der Formel', probeRangSatz('da', liste, 999999)?.text.includes('PLATZ 1.'))

  const mitte = probeRangSatz('da', liste, 12430)
  pruefe(
    'Mittendrin: der Platz wird abgezaehlt, nicht geschaetzt',
    mitte?.art === 'platz' && mitte.text.includes('PLATZ 4.'),
    mitte?.text,
  )
  /* Die Punktzahl steht seit dem Funnel-Umbau nicht mehr im Platzsatz: sie
     steht direkt darueber als grosse Zahl, und zweimal dieselbe Zahl in
     zwei Zeilen las sich wie ein Formular. Im knappen Satz bleibt sie, weil
     es dort keinen Platz gibt, an dem man sich festhalten koennte. */
  pruefe(
    'Der Platzsatz wiederholt die Punktzahl nicht',
    !mitte?.text.includes('12.430'),
    mitte?.text,
  )
  pruefe(
    'Im knappen Satz steht die Punktzahl in deutscher Schreibweise',
    probeRangSatz('da', liste, 1234)?.text.includes('1.234'),
    probeRangSatz('da', liste, 1234)?.text,
  )

  /* Platz 1 bekommt einen eigenen Satz — „PLATZ 1" mit derselben Formel wie
     Platz 7 waere die schwaechste Stelle des ganzen Trichters. */
  pruefe(
    'Platz 1 hat einen eigenen Wortlaut',
    oben?.text === TEXTE.g.practiceRangEins,
    oben?.text,
  )
  pruefe('Und nennt keinen Abstand zur Spitze', oben?.zusatz == null, String(oben?.zusatz))

  /* Der Abstand zur Spitze: nur echte Arithmetik gegen die Liste, die
     wirklich kam. 18.000 ist der dritte Wert, 12.430 der eigene — es fehlen
     18.000 - 12.430 + 1 = 5.571 Punkte. */
  pruefe(
    'Ausserhalb der Top 3 kommt der echte Abstand dazu',
    mitte?.zusatz?.includes('5.571') && mitte.zusatz.includes(`TOP ${PROBE_SPITZE}`),
    mitte?.zusatz,
  )
  pruefe(
    'Innerhalb der Top 3 gibt es keinen Abstand zu nennen',
    probeRangSatz('da', liste, 25000)?.zusatz == null,
    String(probeRangSatz('da', liste, 25000)?.zusatz),
  )
  /* Weiter hinten ist die Top 3 kein Ziel mehr, sondern eine Absage.
     Dann wird die naechste Marke genannt, die in der Liste wirklich
     steht — die Top 10. Zwoelf Eintraege: 12.000 bis 1.000 in
     Tausenderschritten, der zehnte Wert ist 3.000. */
  const lang = Array.from({ length: 12 }, (_, i) => 12000 - i * 1000)
  const hinten = probeRangSatz('da', lang, 2500)
  pruefe(
    'Hinter Platz 10 zaehlt der Abstand zur Top 10, nicht zur Top 3',
    hinten?.zusatz?.includes(`TOP ${PROBE_MITTE}`) && hinten.zusatz.includes('501'),
    hinten?.zusatz,
  )
  const dazwischen = probeRangSatz('da', lang, 5000)
  pruefe(
    'Innerhalb der Top 10 zaehlt wieder die Spitze',
    dazwischen?.zusatz?.includes(`TOP ${PROBE_SPITZE}`) && dazwischen.zusatz.includes('5.001'),
    dazwischen?.zusatz,
  )
  pruefe(
    'Ohne zehn veroeffentlichte Eintraege wird keine Top 10 behauptet',
    !/TOP 10/.test(probeRangSatz('da', liste, 1)?.zusatz ?? ''),
    probeRangSatz('da', liste, 1)?.zusatz,
  )

  const gleich = probeRangSatz('da', liste, 9000)
  pruefe(
    'Gleichstand mit dem letzten Eintrag zaehlt noch als dessen Platz',
    gleich?.art === 'platz' && gleich.text.includes('PLATZ 5.'),
    gleich?.text,
  )

  const drunter = probeRangSatz('da', liste, 8999)
  pruefe(
    'Unter allen Eintraegen wird KEIN Platz genannt',
    drunter?.art === 'knapp' && !drunter.text.includes('PLATZ'),
    drunter?.text,
  )
  pruefe(
    'Stattdessen die Laenge der Liste, die wirklich da war',
    drunter?.text.includes('TOP 5'),
    drunter?.text,
  )
  pruefe(
    'Die Laenge ist nicht fest verdrahtet',
    probeRangSatz('da', [600, 500, 400, 300, 200, 100], 50)?.text.includes('TOP 6'),
    probeRangSatz('da', [600, 500, 400, 300, 200, 100], 50)?.text,
  )
  pruefe(
    'Eine volle Zwanzigerliste sagt TOP 20',
    probeRangSatz(
      'da',
      Array.from({ length: 20 }, (_, i) => 1000 - i),
      1,
    )?.text.includes('TOP 20'),
  )
}

/* ---------------------------------------------------------------- */
console.log('\n— Die junge Rangliste: lieber kein Platz als ein leerer Platz')
{
  /* Der Anlass: bei drei offiziellen Scores machte ein Probelauf von 60
     Punkten „PLATZ 3“. Rechnerisch stimmt das, und trotzdem steht da
     eine Auszeichnung fuer eine leere Liste. Bis PROBE_MINDEST wird
     deshalb kein Platz genannt — weder ein guter noch ein knapper. */
  for (const n of [1, 2, 3, 4]) {
    const kurz = Array.from({ length: n }, (_, i) => 1000 - i * 10)
    const oben = probeRangSatz('da', kurz, 99999)
    const unten = probeRangSatz('da', kurz, 1)
    pruefe(`${n} Eintraege: kein Platz, egal wie gut gespielt wurde`, oben?.art === 'jung', oben?.text)
    pruefe(`${n} Eintraege: auch kein knapper Satz`, unten?.art === 'jung', unten?.text)
    for (const satz of [oben, unten]) {
      const ganz = `${satz.text} ${satz.zusatz ?? ''}`
      pruefe(`${n} Eintraege: keine Zahl im Satz`, !/[0-9]/.test(ganz), ganz)
      pruefe(`${n} Eintraege: das Wort PLATZ faellt nicht`, !/PLATZ/.test(ganz), ganz)
      pruefe(`${n} Eintraege: und keine TOP N`, !/TOP/.test(ganz), ganz)
    }
  }

  /* Ab der Schwelle zaehlt wieder die echte Rangliste. */
  const gerade = Array.from({ length: PROBE_MINDEST }, (_, i) => 1000 - i * 10)
  pruefe(
    `Ab ${PROBE_MINDEST} Eintraegen wird der Platz wieder genannt`,
    probeRangSatz('da', gerade, 975)?.text.includes('PLATZ 4.'),
    probeRangSatz('da', gerade, 975)?.text,
  )

  /* Der junge Satz ist eine Einladung, keine Entschuldigung. */
  pruefe(
    'Der junge Satz nennt die Bestenliste beim Namen',
    TEXTE.g.practiceRangJung === 'DIE BESTENLISTE FÜLLT SICH GERADE.',
    TEXTE.g.practiceRangJung,
  )
  pruefe(
    'Und sagt, was jetzt moeglich ist',
    TEXTE.g.practiceRangJungBis === 'JETZT KANNST DU DICH NOCH GANZ VORNE FESTSETZEN.',
    TEXTE.g.practiceRangJungBis,
  )
  pruefe(
    'Beide kommen ohne Platzhalter aus',
    !/[{]/.test(TEXTE.g.practiceRangJung) && !/[{]/.test(TEXTE.g.practiceRangJungBis),
  )

  /* Null Eintraege sind etwas anderes als wenige: da ist wirklich noch
     niemand, und der erste Platz steht offen. */
  pruefe(
    'Ohne jeden Eintrag bleibt es bei der Einladung auf Platz 1',
    probeRangSatz('leer', [], 60)?.text === TEXTE.g.practiceRangLeer,
    probeRangSatz('leer', [], 60)?.text,
  )
}

/* ---------------------------------------------------------------- */
console.log('\n— Der Satz, wenn es nichts zu vergleichen gibt')
{
  pruefe('Waehrend des Abrufs: Hinweis statt Zahl', probeRangSatz('laedt', [], 5000)?.art === 'laedt')
  pruefe('Nach einem Fehler: Hinweis statt Zahl', probeRangSatz('fehler', [], 5000)?.art === 'fehler')
  pruefe('Ohne veroeffentlichte Liste: Hinweis statt Zahl', probeRangSatz('leer', [], 5000)?.art === 'leer')
  pruefe('Vor dem Abruf kommt gar nichts', probeRangSatz('ruht', [], 5000) === null)
  pruefe('Leere Liste trotz Stand „da" sagt lieber nichts', probeRangSatz('da', [], 5000) === null)
  pruefe('Kein Array, kein Satz', probeRangSatz('da', null, 5000) === null)
  for (const stand of ['laedt', 'fehler', 'leer']) {
    const satz = probeRangSatz(stand, [], 5000)
    pruefe(`Stand „${stand}" nennt weder Platz noch Punktzahl`, !/\d/.test(satz.text), satz.text)
  }
  pruefe(
    'Ohne Punktzahl wird mit 0 gerechnet, nicht mit NaN',
    !/NaN/.test(probeRangSatz('da', [100, 90, 80, 70, 60], undefined)?.text ?? ''),
  )
}

/* ---------------------------------------------------------------- */
console.log('\n— Die Serverantwort auspacken: genau die Form, die wirklich kommt')
{
  /* Diese Pruefungen gibt es, weil der Fehler schon einmal live stand und
     hier trotzdem alles gruen war: der Testaufbau lieferte je Spiel ein
     flaches Array, der echte Server liefert ein Objekt mit `eintraege`.
     Also wird hier die Serverform nachgebaut — Feld fuer Feld so, wie
     listeBauen() in api/_terminal-kern.js sie zusammensetzt. */
  const serverform = {
    ok: true,
    listen: {
      kuechen_merge: {
        eintraege: [
          { platz: 1, instagram: 'a_name', punkte: 8450, ich: false },
          { platz: 2, instagram: 'b_name', punkte: 6100, ich: false },
          { platz: 3, instagram: 'c_name', punkte: 5200, ich: false },
          { platz: 4, instagram: 'd_name', punkte: 3300, ich: false },
          { platz: 5, instagram: 'e_name', punkte: 1500, ich: false },
        ],
        eigenerPlatz: null,
        eigenePunkte: null,
        gelistet: false,
      },
    },
  }

  const raus = probeListeAus(serverform, 'kuechen_merge')
  pruefe('Die echte Serverform wird gelesen, nicht verworfen', Array.isArray(raus), JSON.stringify(raus))
  pruefe(
    'Es kommen die Punktwerte heraus, absteigend',
    JSON.stringify(raus) === '[8450,6100,5200,3300,1500]',
    JSON.stringify(raus),
  )

  /* Und der Satz danach muss daraus wirklich einen Platz machen — das war
     der sichtbare Schaden: „noch keine oeffentliche Rangliste", obwohl eine
     da war. */
  const satz = probeRangSatz('da', raus, 25955)
  pruefe('Aus der Serverform entsteht ein echter Platz', satz?.art === 'platz', satz?.text)

  /* Die flache Form darf weiterhin durchgehen: aeltere Antworten und die
     Tests, die damit rechnen, sollen nicht brechen. */
  const flach = probeListeAus({ ok: true, listen: { kuechen_merge: [{ punkte: 300 }, { punkte: 900 }] } }, 'kuechen_merge')
  pruefe('Die flache Form wird weiterhin angenommen', JSON.stringify(flach) === '[900,300]', JSON.stringify(flach))

  /* Und alles, was keine Liste ist, muss `null` sein — das ist etwas anderes
     als eine leere Liste und wird auf der Seite auch anders gesagt. */
  pruefe('Ohne ok kommt null', probeListeAus({ ok: false, listen: { kuechen_merge: { eintraege: [] } } }, 'kuechen_merge') === null)
  pruefe('Ohne Antwort kommt null', probeListeAus(null, 'kuechen_merge') === null)
  pruefe('Unbekanntes Spiel gibt null', probeListeAus(serverform, 'gibt_es_nicht') === null)
  pruefe(
    'Leere eintraege geben eine leere Liste, nicht null',
    JSON.stringify(probeListeAus({ ok: true, listen: { x: { eintraege: [] } } }, 'x')) === '[]',
  )
  pruefe(
    'Kaputte Eintraege fallen raus statt NaN zu erzeugen',
    JSON.stringify(probeListeAus({ ok: true, listen: { x: { eintraege: [{ punkte: 'abc' }, { punkte: 0 }, { punkte: 50 }] } } }, 'x')) === '[50]',
  )
}

/* ---------------------------------------------------------------- */
console.log('\n— Die Texte sagen vorher, dass nichts gezaehlt wird')
{
  const notiz = TEXTE.a.probeNotiz ?? ''
  pruefe('Es gibt einen Hinweis unter dem Probespiel', notiz.length > 0)
  pruefe('Er nennt: kein offizieller Score', /kein offizieller Score/i.test(notiz), notiz)
  pruefe('Er nennt: keine Teilnahme', /keine Teilnahme/i.test(notiz), notiz)
  pruefe('Er nennt: kein Los', /kein Los/i.test(notiz), notiz)
  pruefe('Der Abschnitt hat Titel und Unterzeile', !!TEXTE.a.probeTitel && !!TEXTE.a.probeSub)

  /* Der Kopf der Landing Page: erst spielen, dann reden. Der Knopf verspricht
     nichts, was er nicht haelt — „SOFORT" heisst ohne Zwischenschritt, und
     direkt darunter steht, dass keine Anmeldung noetig ist. */
  pruefe('Die Ueberschrift stellt das Spielen vor das Erklaeren', TEXTE.a.probeTitel === 'ERST SPIELEN. DANN REDEN WIR.', TEXTE.a.probeTitel)
  pruefe('Der Knopf heisst „SOFORT SPIELEN"', TEXTE.a.probeCta === 'SOFORT SPIELEN', TEXTE.a.probeCta)
  pruefe('Darunter steht, dass keine Anmeldung noetig ist', /Keine Anmeldung/i.test(TEXTE.a.probeSub), TEXTE.a.probeSub)

  /* Nach der Probrunde: der Knopf macht aus dem Vorschau-Score einen echten.
     Die drei Zeilen darunter sagen, wie — und dass der Probe-Score selbst
     nicht mitwandert. */
  pruefe('Der Weg weiter heisst „SCORE OFFIZIELL MACHEN"', TEXTE.g.practiceEchtCta === 'SCORE OFFIZIELL MACHEN', TEXTE.g.practiceEchtCta)
  pruefe('Die Unterzeile nennt den Kanal und die Anmeldung', /@videko\.kuechen/.test(TEXTE.g.practiceEchtSub), TEXTE.g.practiceEchtSub)
  pruefe('Die dritte Zeile nennt Einladungen, Rankings und Preise', /3 Freunde/.test(TEXTE.g.practiceEchtDrei) && /Preise/.test(TEXTE.g.practiceEchtDrei), TEXTE.g.practiceEchtDrei)

  /* §17: der Probe-Score wird nicht uebernommen. Das muss dastehen, bevor
     jemand auf den Knopf drueckt — sonst ist die Enttaeuschung danach. */
  pruefe(
    'Es steht da, dass danach ein neuer offizieller Lauf kommt',
    /Vorschau/i.test(TEXTE.g.practiceEchtNeu) && /offizieller Run/i.test(TEXTE.g.practiceEchtNeu),
    TEXTE.g.practiceEchtNeu,
  )

  pruefe(
    'Die Vergleichssaetze tragen ihre Platzhalter',
    TEXTE.g.practiceRang.includes('{platz}') &&
      TEXTE.g.practiceRangKnapp.includes('{punkte}') &&
      TEXTE.g.practiceRangKnapp.includes('{top}') &&
      TEXTE.g.practiceRangBis.includes('{fehlt}') &&
      TEXTE.g.practiceRangBis.includes('{top}'),
  )
  pruefe('Platz 1 und die leere Liste kommen ohne Platzhalter aus', !/\{/.test(TEXTE.g.practiceRangEins) && !/\{/.test(TEXTE.g.practiceRangLeer))
  pruefe('Die leere Liste ist eine Einladung, keine Fehlermeldung', TEXTE.g.practiceRangLeer === 'DER ERSTE PLATZ WARTET NOCH.', TEXTE.g.practiceRangLeer)
  pruefe(
    'Die zwei Wege hinein sind benannt: Deckel und Einladung',
    !!TEXTE.a.deckelTitel && !!TEXTE.a.deckelText && !!TEXTE.a.einladungTitel && !!TEXTE.a.einladungText,
  )
  pruefe('Die Deckelzahl steht als Platzhalter, nicht als Zahl im Satz', TEXTE.a.deckelText.includes('{gesamt}'))
}

/* ---------------------------------------------------------------- */
console.log('\n— Die Seite haengt das Probespiel ohne Konto ein')
{
  const seite = lies('src/pages/Terminal.jsx')

  pruefe('Es gibt einen Probe-Abschnitt', /className=\{`trm-probespiel /.test(seite))

  /* Die Reihenfolge ist der halbe Trichter: wer auf der Seite landet, soll
     etwas zu tun haben, bevor er etwas zu lesen bekommt. Das Probespiel
     steht darum vor dem Codefeld und vor den zwei Wegen. */
  const wo = (k) => seite.indexOf(k)
  pruefe(
    'Das Probespiel steht vor dem Codefeld',
    wo('`trm-probespiel ') > 0 && wo('`trm-probespiel ') < wo('`trm-code '),
    `${wo('`trm-probespiel ')} < ${wo('`trm-code ')}`,
  )
  pruefe(
    'Und vor den zwei Wegen',
    wo('`trm-probespiel ') < wo('`trm-wege '),
    `${wo('`trm-probespiel ')} < ${wo('`trm-wege ')}`,
  )
  pruefe(
    'Das Probespiel bekommt keine Sitzung und keinen Ergebnisweg',
    /<ProbeBauteil sitzung=\{null\} best=\{null\} onErgebnis=\{null\} \/>/.test(seite),
  )
  pruefe('Es laeuft im Practice-Kontext', /<PracticeKontext\.Provider value=\{probeWeg\}>/.test(seite))
  pruefe(
    'Welches Spiel, sagt der Server — mit PRACTICE_STANDARD als Rueckfall',
    /kennzahlen\?\.guestPracticeGame \?\? PRACTICE_STANDARD/.test(seite),
  )
  /* Seit dem Funnel-Umbau ist VIDEKO Jump das oeffentliche Probespiel:
     es laeuft ohne Erklaerung los und ist nach einer Minute vorbei.
     Kuechen-Merge bleibt Hauptgame, ist aber nicht mehr der Koeder. */
  pruefe('Der Standard ist VIDEKO Jump', PRACTICE_STANDARD === 'videko_jump', PRACTICE_STANDARD)
  pruefe('Die Rangliste wird ohne Sitzung gelesen', /ranglisteHolen\(null\)/.test(seite))
  pruefe(
    'Und nur einmal — der Merkzettel verhindert jeden weiteren Abruf',
    /if \(probeGeholtRef\.current\) return\s+probeGeholtRef\.current = true/.test(seite),
  )
  pruefe('Der Abruf haengt am Rundenende, nicht am Seitenaufbau', /onEnde: probeRangHolen/.test(seite))
  pruefe('Der Hinweis steht wirklich im Abschnitt', /trm-probespiel__notiz">\{TEXTE\.a\.probeNotiz\}/.test(seite))
  pruefe('Die zwei Wege stehen als eigener Block auf der Seite', /className=\{`trm-wege /.test(seite))

  /* Ein Name, den es schon gibt, bringt fremde Regeln mit. `trm-probe`
     gehoert der Testmodus-Leiste; unter diesem Namen lag der Abschnitt
     quer ueber den halben Schirm. Darum: kein Klassenname aus dem
     Probespiel darf zweimal vergeben sein. */
  const labor = lies('src/components/TerminalLabor.jsx')
  const laborKlassen = new Set(
    [...labor.matchAll(/className="([^"]+)"/g)].flatMap((m) => m[1].trim().split(/\s+/)),
  )
  const doppelt = ['trm-probespiel', 'trm-probespiel__titel', 'trm-probespiel__sub', 'trm-probespiel__notiz', 'trm-wege', 'trm-weg'].filter(
    (k) => laborKlassen.has(k),
  )
  pruefe('Keiner der neuen Klassennamen ist schon anderswo vergeben', doppelt.length === 0, doppelt.join(','))

  /* Icons, die es nicht gibt, rendern stillschweigend nichts. */
  const rahmen = lies('src/components/TerminalRahmen.jsx')
  const ikonen = new Set([...rahmen.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]))
  const benutzt = [...seite.matchAll(/<Ikon name="(\w+)"/g)].map((m) => m[1])
  const unbekannt = benutzt.filter((n) => !ikonen.has(n))
  pruefe('Jedes benutzte Icon gibt es auch', unbekannt.length === 0, unbekannt.join(','))
}

/* ---------------------------------------------------------------- */
console.log('\n— Die Spielkarte meldet nur echte Probrunden')
{
  const karte = lies('src/components/SpielKarte.jsx')
  pruefe(
    'Gemeldet wird erst, wenn eine Probrunde wirklich vorbei ist',
    /const practiceEnde = practice && phase === 'vorbei'/.test(karte),
  )
  pruefe('Ohne Kontext bleibt der Practice Mode, wie er war', /practiceWeg\?\.rangSatz\?\.\(punkte\) \?\? null/.test(karte))
  pruefe('Der Vergleichssatz wird ausgegeben', /className="trm-spiel__probe-rang"/.test(karte))
  pruefe('Er wird Screenreadern als Statusmeldung gereicht', /trm-spiel__probe-rang" data-art=\{probeRang\.art\} role="status"/.test(karte))
}

/* ---------------------------------------------------------------- */
console.log('\n— Zu jeder Klasse gibt es auch Gestaltung')
{
  const css = lies('src/terminal.css')
  for (const klasse of [
    '.trm-probespiel',
    '.trm-probespiel__titel',
    '.trm-probespiel__sub',
    '.trm-probespiel__notiz',
    '.trm-wege',
    '.trm-weg',
    '.trm-weg__text',
    '.trm-spiel__probe-rang',
  ]) {
    pruefe(`${klasse} ist gestaltet`, css.includes(`${klasse} {`))
  }
  /* `leer` gehoert nicht mehr dazu: „DER ERSTE PLATZ WARTET NOCH." ist die
     beste Nachricht, die der Satz haben kann, und bleibt laut. Leise sind
     nur die Zustaende, in denen wirklich nichts da ist. */
  pruefe(
    'Die stillen Varianten des Vergleichssatzes sind gestaltet',
    ["[data-art='knapp']", "[data-art='laedt']", "[data-art='fehler']"].every((v) =>
      css.includes(`.trm-spiel__probe-rang${v}`),
    ),
  )
  for (const klasse of ['.trm-spiel__probe-bis', '.trm-spiel__probe-sub', '.trm-spiel__probe-drei', '.trm-spiel__probe-neu', '.trm-probespiel__spiel']) {
    pruefe(`${klasse} ist gestaltet`, css.includes(`${klasse} {`))
  }
  pruefe('Die zwei Wege stehen erst auf breiten Schirmen nebeneinander', /@media \(min-width: 620px\) \{\s*\.trm-wege \{/.test(css))
}

/* ---------------------------------------------------------------- */
console.log('\n— Sicherheit: die Probrunde fasst den Server nicht an')
{
  /* Das Probespiel laeuft ohne Konto auf einer oeffentlichen Seite. Es darf
     deshalb keinen Lauf eroeffnen, keinen Punktestand abgeben und keine
     Teilnehmerzeile ausloesen — sonst waere der Trichter ein Einfallstor.
     Geprueft wird am Quelltext: spiel-lauf.js hat genau drei Stellen, an
     denen ein Lauf den Server erreicht, und alle drei sind hier benannt. */
  const lauf = lies('src/components/spiel-lauf.js')

  pruefe(
    'Der Probemodus kommt aus dem Kontext, nicht aus einer Eigenschaft',
    /const practice = useContext\(PracticeKontext\) != null/.test(lauf),
  )

  /* 1. Kein Punktestand. spielBeenden ist der einzige Weg zur Score-API. */
  pruefe(
    'Am Rundenende wird in der Probrunde nur angezeigt, nichts abgegeben',
    /if \(practice\) \{\s*setAntwort\(\{ ok: true, practice: true \}\)\s*setPhase\('vorbei'\)\s*return\s*\}/.test(lauf),
  )
  const abzweig = lauf.indexOf('setAntwort({ ok: true, practice: true })')
  const abgaben = [...lauf.matchAll(/spielBeenden\(/g)].map((m) => m.index)
  pruefe('Es gibt ueberhaupt Abgabestellen zu pruefen', abgaben.length > 0, String(abgaben.length))
  pruefe(
    'Jede Abgabe steht hinter dieser Abzweigung, keine davor',
    abzweig > 0 && abgaben.every((i) => i > abzweig),
  )

  /* 2. Kein Ticket. Das Ticket ist der Laufschein des Servers; in der
     Probrunde wird er lokal erfunden oder bleibt schlicht leer. */
  pruefe(
    'Im Sofortstart wird das Ticket lokal gesetzt statt beim Server geholt',
    /ticketWartenRef\.current = Promise\.resolve\('practice'\)/.test(lauf),
  )
  pruefe(
    'Im getakteten Start bleibt das Ticket leer',
    /if \(practice\) \{\s*ticketRef\.current = null\s*\} else \{/.test(lauf),
  )
  const starts = [...lauf.matchAll(/spielStarten\(/g)].map((m) => m.index)
  pruefe('Es gibt ueberhaupt Startstellen zu pruefen', starts.length > 0, String(starts.length))
  starts.forEach((stelle, nr) => {
    /* Jeder Aufruf muss in einem Zweig liegen, der vorher auf practice
       geprueft hat — der Absatz davor entscheidet das. */
    pruefe(
      `spielStarten #${nr + 1} liegt hinter einer Probe-Abzweigung`,
      /if \(practice\) \{/.test(lauf.slice(Math.max(0, stelle - 600), stelle)),
    )
  })

  /* 3. Keine Teilnehmerzeile. Die entsteht serverseitig am Eintritt — und
     der Probe-Abschnitt reicht bewusst keine Sitzung herein. */
  const seite = lies('src/pages/Terminal.jsx')
  pruefe(
    'Ohne Sitzung keine Teilnehmerzeile: das Probespiel bekommt keine',
    /<ProbeBauteil sitzung=\{null\} best=\{null\} onErgebnis=\{null\} \/>/.test(seite),
  )
  pruefe(
    'Und keinen Ergebnisweg, ueber den ein Punktestand abfließen koennte',
    !/<ProbeBauteil[^>]*onErgebnis=\{(?!null\})/.test(seite),
  )

  /* 4. Gelesen wird nur: die Rangliste, und die ist oeffentlich. */
  const holen = seite.indexOf('const probeRangHolen')
  const block = seite.slice(holen, seite.indexOf('const rangSatzRechnen'))
  pruefe('Der Trichterblock wurde gefunden', holen > 0 && block.length > 0)
  pruefe(
    'Nach der Probrunde wird nur die Rangliste gelesen',
    /ranglisteHolen\(null\)/.test(block) && !/spielBeenden\(|spielStarten\(/.test(block),
  )
}

console.log(`\n${ok} OK, ${fehler} Fehler`)
if (fehler) process.exit(1)
