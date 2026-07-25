/**
 * Lädt die im Design verwendeten Google-Fonts als woff2 herunter und legt sie
 * lokal ab (DSGVO: keine externe Schrift-Einbindung, keine IP-Übertragung an
 * Google beim Seitenaufruf). Erzeugt zusätzlich src/fonts.css mit den passenden
 * @font-face-Regeln.
 *
 * Aufruf:  node scripts/fetch-fonts.mjs
 * Danach:  in styles.css statt des Google-@import  ->  @import './fonts.css';
 *
 * Es wird bewusst nur das latin-Subset geladen. Es deckt das komplette deutsche
 * Alphabet inkl. ä ö ü ß Ä Ö Ü sowie €, Anführungszeichen und Gedankenstriche ab.
 */
import { writeFileSync, mkdirSync } from 'node:fs'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

const OUT = 'src/assets/fonts'
mkdirSync(OUT, { recursive: true })

const JOBS = [
  ['Cormorant Garamond', 'cormorant', [400, 500, 600, 700]],
  ['Inter', 'inter', [300, 400, 500, 600, 700]],
]

let css =
  '/* Selbst gehostete Schriften – DSGVO-konform, keine externe Google-Einbindung.\n' +
  '   Generiert via scripts/fetch-fonts.mjs. Nur latin-Subset (deckt Deutsch ab). */\n\n'

for (const [family, slug, weights] of JOBS) {
  for (const w of weights) {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${w}&display=swap`
    const sheet = await (await fetch(url, { headers: { 'User-Agent': UA } })).text()
    const blocks = sheet.split('/*').map((b) => '/*' + b)
    const latin = blocks.find((b) => b.startsWith('/* latin */'))
    if (!latin) { console.error('KEIN latin-Block:', family, w); process.exitCode = 1; continue }
    const m = latin.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)
    const rangeM = latin.match(/unicode-range:\s*([^;]+);/)
    if (!m) { console.error('KEINE woff2-URL:', family, w); process.exitCode = 1; continue }
    const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer())
    const file = `${slug}-${w}.woff2`
    writeFileSync(`${OUT}/${file}`, buf)
    css +=
      `@font-face {\n` +
      `  font-family: '${family}';\n` +
      `  font-style: normal;\n` +
      `  font-weight: ${w};\n` +
      `  font-display: swap;\n` +
      `  src: url('./assets/fonts/${file}') format('woff2');\n` +
      (rangeM ? `  unicode-range: ${rangeM[1].trim()};\n` : '') +
      `}\n\n`
    console.log('OK', file, buf.length, 'Bytes')
  }
}

writeFileSync('src/fonts.css', css)
console.log('\nsrc/fonts.css geschrieben.')
