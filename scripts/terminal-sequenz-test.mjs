/**
 * Die beiden Inszenierungen des Terminals.
 *
 * INTRO — der Ersteinstieg auf /terminal. Er soll einmal pro Sitzung laufen,
 * also einmal pro Tab. Bis 2.3 lag der Merkzettel zusaetzlich in
 * localStorage; wer die Seite einmal gesehen hatte, sah die Ankunft nie
 * wieder. Genau das darf nicht zurueckkommen.
 *
 * ACCESS GRANTED — die Sequenz nach dem richtigen Code. Sie hat ein festes
 * Drehbuch: goldene Adern, das vibrierende Schloss, der Schlag, „DU HAST
 * ZUGANG.", eine halbe Sekunde Stille, „DAS SCHLOSS IST OFFEN." Hier wird
 * geprueft, dass die Zeiten im Stylesheet dieses Drehbuch wirklich ergeben,
 * dass die Seite so lange wartet und dass das Sicherheitsnetz im index.html
 * spaeter zuschlaegt als die Sequenz endet.
 *
 * Ohne Browser laesst sich das Aussehen nicht pruefen — die Zeiten, die
 * Reihenfolge der Schichten und die Ruecksicht auf abbestellte Bewegung
 * aber schon.
 *
 *   node scripts/terminal-sequenz-test.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

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
/* Ein Browser-Speicher zum Mitschreiben                             */
/* ---------------------------------------------------------------- */
function speicher() {
  const inhalt = new Map()
  return {
    inhalt,
    get length() {
      return inhalt.size
    },
    key: (i) => [...inhalt.keys()][i] ?? null,
    getItem: (k) => (inhalt.has(k) ? inhalt.get(k) : null),
    setItem: (k, v) => inhalt.set(k, String(v)),
    removeItem: (k) => inhalt.delete(k),
  }
}

const sitzung = speicher()
const dauerhaft = speicher()
globalThis.window = { sessionStorage: sitzung, localStorage: dauerhaft }

const { SPEICHER_INTRO, introGesehen, introMerken } = await import('../src/data/terminal-api.js')

/* ---------------------------------------------------------------- */
console.log('\n— INTRO: einmal pro Sitzung, nicht einmal pro Browser')
{
  sitzung.inhalt.clear()
  dauerhaft.inhalt.clear()

  pruefe('Frischer Tab: die Sequenz ist noch nicht gelaufen', introGesehen() === false)

  introMerken()
  pruefe('Nach dem Merken gilt sie als gelaufen', introGesehen() === true)
  pruefe('Der Merkzettel liegt in sessionStorage', sitzung.getItem(SPEICHER_INTRO) === '1')
  pruefe(
    'In localStorage landet dabei NICHTS',
    dauerhaft.inhalt.size === 0,
    [...dauerhaft.inhalt.keys()].join(','),
  )

  /* Der neue Tab: sessionStorage ist leer, localStorage nicht. */
  sitzung.inhalt.clear()
  dauerhaft.setItem(SPEICHER_INTRO, '1')
  pruefe(
    'Ein alter Eintrag aus 2.3 unterdrueckt die Sequenz nicht mehr',
    introGesehen() === false,
  )
}

/* ---------------------------------------------------------------- */
console.log('\n— INTRO: der Torwaechter im index.html')
{
  const html = lies('index.html')
  pruefe('Der Sitzungszettel entscheidet', /s\.getItem\('videko\.terminal\.intro'\)/.test(html))
  pruefe(
    'Der dauerhafte Intro-Zettel wird nicht mehr gelesen',
    !/l\.getItem\('videko\.terminal\.intro'\)/.test(html),
  )
  pruefe(
    'Wer angemeldet ist oder den Code hat, sieht sie weiterhin nicht',
    /l\.getItem\('videko\.terminal\.sitzung'\)/.test(html) &&
      /l\.getItem\('videko\.terminal\.zugang'\)/.test(html),
  )
  pruefe('Wer sie noch einmal sehen will, darf', /videko\.terminal\.introWunsch/.test(html))
  pruefe('Ein Zugangslink ueberspringt sie', /location\.hash\.indexOf\('#wieder='\)/.test(html))
}

/* ---------------------------------------------------------------- */
console.log('\n— ACCESS GRANTED: die Schichten in ihrer Reihenfolge')
{
  const seite = lies('src/pages/Terminal.jsx')
  const anfang = seite.lastIndexOf('className="', seite.indexOf('trm-buehne__rauch'))
  const gewaehrt = seite.slice(anfang, seite.indexOf('trm-buehne__weich', anfang))
  /* Je Schicht zaehlt der letzte Klassenname — die Variante, falls es eine
     gibt, sonst die Grundform. */
  const folge = [...gewaehrt.matchAll(/className="(trm-buehne__[^"]+)"/g)].map((m) =>
    m[1].trim().split(/\s+/).pop().replace('trm-buehne__', ''),
  )
  const erwartet = [
    'rauch',
    'adern',
    'adern--zwei',
    'strich',
    'strich--zwei',
    'schloss',
    'blitz',
    'funken',
    'funken--zwei',
    'wort',
    'wort--zwei',
    'wort--drei',
  ]
  pruefe('Rauch, Adern, Schloss, Blitz, Funken, Wort — in dieser Folge', folge.join(',') === erwartet.join(','), folge.join(','))

  pruefe('Die goldenen Adern sind da', /className="trm-buehne__adern"/.test(seite))
  pruefe('Es gibt eine zweite Ader auf der anderen Seite', /trm-buehne__adern trm-buehne__adern--zwei/.test(seite))
  pruefe('Das Schloss vibriert als eigene Schicht', /className="trm-buehne__schloss"/.test(seite))
  pruefe(
    'Alle Zierschichten sind fuer Screenreader unsichtbar',
    !/className="trm-buehne__(adern|schloss)[^"]*"(?![^>]*aria-hidden)/.test(seite),
  )
  pruefe('Der dritte Satz wird gerendert', /trm-buehne__wort--drei/.test(seite))
  pruefe(
    'Angesagt wird nur der erste Satz — die Wiederholungen nicht',
    /trm-buehne__wort--drei" aria-hidden="true"/.test(seite) &&
      /trm-buehne__wort--zwei" aria-hidden="true"/.test(seite),
  )
}

/* ---------------------------------------------------------------- */
console.log('\n— ACCESS GRANTED: die Worte')
{
  const { TEXTE } = await import('../src/data/terminal.js')
  pruefe('Der Nachsatz steht in den Texten', TEXTE.z.offen === 'DAS SCHLOSS IST OFFEN.', String(TEXTE.z.offen))
  pruefe('Der zweite Satz bleibt „DU HAST ZUGANG."', TEXTE.z.titel === 'DU HAST ZUGANG.', String(TEXTE.z.titel))
  pruefe('Und der erste ist der Systemspruch', typeof TEXTE.z.gewaehrt === 'string' && TEXTE.z.gewaehrt.length > 0)
}

/* ---------------------------------------------------------------- */
console.log('\n— ACCESS GRANTED: das Drehbuch stimmt zeitlich')
{
  const css = lies('src/terminal.css')
  const seite = lies('src/pages/Terminal.jsx')

  /* Aus einer Regel die Animationszeiten holen: Dauer und Verzoegerung. */
  function takt(klasse) {
    const start = css.indexOf(`${klasse} {`)
    if (start < 0) return null
    const block = css.slice(start, css.indexOf('}', start))
    const treffer = block.match(/animation:[^;]*?(\d+)ms[^;]*?(\d+)ms/)
    if (!treffer) return null
    return { dauer: Number(treffer[1]), start: Number(treffer[2]) }
  }

  const adern = takt('.trm-buehne__adern')
  const schloss = takt('.trm-buehne__schloss')
  const blitz = takt('.trm-buehne__blitz')
  const zwei = takt('.trm-buehne__wort--zwei')
  const drei = takt('.trm-buehne__wort--drei')

  pruefe('Alle fuenf Schichten haben eine Zeit', [adern, schloss, blitz, zwei, drei].every(Boolean))
  pruefe('Die Adern laufen ab 600 ms los', adern.start === 600, JSON.stringify(adern))
  pruefe('Das Schloss vibriert ab 1400 ms', schloss.start === 1400, JSON.stringify(schloss))
  pruefe(
    'Der Blitz faellt in das Zittern, und das Schloss geht kurz danach auf',
    blitz.start > schloss.start &&
      blitz.start < schloss.start + schloss.dauer &&
      schloss.start + schloss.dauer <= blitz.start + 200,
    `Schloss ${schloss.start}–${schloss.start + schloss.dauer}, Blitz ${blitz.start}`,
  )
  {
    const von = css.indexOf('@keyframes trm-buehne-schloss')
    const bild = von < 0 ? '' : css.slice(von, von + 700)
    pruefe(
      'Das Schloss zittert wirklich hin und her',
      bild.includes('translateX(-2px)') && bild.includes('translateX(2px)'),
    )
    pruefe('Und geht am Ende auf, statt stehen zu bleiben', /100% \{\s*transform: scale\(1\.35\);\s*opacity: 0;/.test(bild))
  }
  pruefe('„DU HAST ZUGANG." kommt ab 2400 ms', zwei.start === 2400, JSON.stringify(zwei))

  const pause = drei.start - (zwei.start + zwei.dauer)
  pruefe('Danach steht der Satz eine halbe Sekunde allein', pause === 500, `${pause} ms`)
  pruefe('Erst dann kommt „DAS SCHLOSS IST OFFEN."', drei.start === 3900, JSON.stringify(drei))

  const ende = drei.start + drei.dauer
  const inSeite = seite.match(/const BUEHNE_MS = \{ gewaehrt: (\d+)/)
  pruefe('Die Seite wartet genau bis zum Ende der Sequenz', Number(inSeite?.[1]) === ende, `${inSeite?.[1]} vs ${ende}`)

  const netz = lies('index.html').match(/\}, (\d+)\)/)
  pruefe(
    'Das Sicherheitsnetz im index.html greift erst danach',
    Number(netz?.[1]) > ende,
    `${netz?.[1]} vs ${ende}`,
  )

  const sanft = seite.match(/const BUEHNE_SANFT_MS = \{ gewaehrt: (\d+)/)
  pruefe('Ohne Bewegung ist sie deutlich kuerzer', Number(sanft?.[1]) < ende / 3, `${sanft?.[1]} vs ${ende}`)
}

/* ---------------------------------------------------------------- */
console.log('\n— ACCESS GRANTED: wer Bewegung abbestellt hat')
{
  const css = lies('src/terminal.css')
  const start = css.indexOf('@media (prefers-reduced-motion: reduce) {')
  const block = css.slice(start, start + 900)
  for (const klasse of ['.trm-buehne__adern', '.trm-buehne__schloss', '.trm-buehne__wort--drei', '.trm-buehne__wort--zwei', '.trm-buehne__rauch']) {
    pruefe(`${klasse} bewegt sich dann nicht`, block.includes(`${klasse},`) || block.includes(`${klasse} {`))
  }
  pruefe('Der erste Satz bleibt trotzdem sichtbar', /\.trm-buehne__wort \{\s*animation: trm-wort-sanft/.test(block))
}

console.log(`\n${ok} OK, ${fehler} Fehler`)
if (fehler) process.exit(1)
