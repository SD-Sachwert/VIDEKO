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

import { PRACTICE_STANDARD, TEXTE, probeRangSatz } from '../src/data/terminal.js'

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
     nur Punktwerte, absteigend. */
  const liste = [30000, 24000, 18000, 12000, 9000]

  const oben = probeRangSatz('da', liste, 31000)
  pruefe('Bester Wert: Platz 1', oben?.art === 'platz' && oben.text.includes('PLATZ 1.'), oben?.text)

  const mitte = probeRangSatz('da', liste, 12430)
  pruefe(
    'Mittendrin: der Platz wird abgezaehlt, nicht geschaetzt',
    mitte?.art === 'platz' && mitte.text.includes('PLATZ 4.'),
    mitte?.text,
  )
  pruefe(
    'Die Punktzahl steht in deutscher Schreibweise im Satz',
    mitte?.text.includes('12.430'),
    mitte?.text,
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
    probeRangSatz('da', [100, 90], 1)?.text.includes('TOP 2'),
    probeRangSatz('da', [100, 90], 1)?.text,
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
    !/NaN/.test(probeRangSatz('da', [100], undefined)?.text ?? ''),
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
  pruefe('Der Weg weiter heisst „JETZT RICHTIG MITSPIELEN"', TEXTE.g.practiceEchtCta === 'JETZT RICHTIG MITSPIELEN')
  pruefe(
    'Die Vergleichssaetze tragen beide Platzhalter',
    TEXTE.g.practiceRang.includes('{punkte}') &&
      TEXTE.g.practiceRang.includes('{platz}') &&
      TEXTE.g.practiceRangKnapp.includes('{top}'),
  )
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
  pruefe(
    'Das Probespiel bekommt keine Sitzung und keinen Ergebnisweg',
    /<ProbeBauteil sitzung=\{null\} best=\{null\} onErgebnis=\{null\} \/>/.test(seite),
  )
  pruefe('Es laeuft im Practice-Kontext', /<PracticeKontext\.Provider value=\{probeWeg\}>/.test(seite))
  pruefe(
    'Welches Spiel, sagt der Server — mit PRACTICE_STANDARD als Rueckfall',
    /kennzahlen\?\.guestPracticeGame \?\? PRACTICE_STANDARD/.test(seite),
  )
  pruefe('Der Standard ist Kuechen-Merge', PRACTICE_STANDARD === 'kuechen_merge', PRACTICE_STANDARD)
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
  pruefe(
    'Die vier stillen Varianten des Vergleichssatzes sind gestaltet',
    ["[data-art='knapp']", "[data-art='leer']", "[data-art='laedt']", "[data-art='fehler']"].every((v) =>
      css.includes(`.trm-spiel__probe-rang${v}`),
    ),
  )
  pruefe('Die zwei Wege stehen erst auf breiten Schirmen nebeneinander', /@media \(min-width: 620px\) \{\s*\.trm-wege \{/.test(css))
}

console.log(`\n${ok} OK, ${fehler} Fehler`)
if (fehler) process.exit(1)
