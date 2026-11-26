// SEO-Monitor: prueft die LIVE-Seite auf die Dinge, die still kaputtgehen koennen.
//
// Aufruf:  node scripts/seo-monitor.mjs          -> Bericht, Exit 1 bei Fehlern
//          JSON=1 node scripts/seo-monitor.mjs   -> Bericht zusaetzlich als JSON
//
// Laeuft woechentlich per GitHub Action (.github/workflows/seo-monitor.yml).
// Schlaegt der Lauf fehl, verschickt GitHub automatisch eine Mail an die
// Repo-Beobachter – das ist der Alarm. Keine Kosten, keine Zugangsdaten.
//
// Geprueft wird:
//  - jede Sitemap-URL: Status 200, <title>, meta description, canonical = URL,
//    kein noindex, keine alte Mobilnummer
//  - Startseite: JSON-LD-Telefon = offizielle Nummer
//  - robots.txt verweist auf die Sitemap
//  - IndexNow-Schluesseldatei ist erreichbar
//  - Suchbegriff -> Zielseite (SUCHBEGRIFFE): jede Zielseite steht in der Sitemap
//    und traegt alle Kernwoerter des Begriffs in <title>, description oder <h1>
// Was hier NICHT geht (braucht Logins): Search-Console-Klicks/Indexierung,
// Bing Webmaster, Google-Unternehmensprofil. Siehe docs/SEO-MONITORING.md.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ORIGIN = 'https://videko-kuechen.de'
const TELEFON_OFFIZIELL = '+4993129764861'
// Alte Mobilnummer: nur als SHA-256 der Ziffern 160xxxxxxx hinterlegt, damit sie
// nicht im oeffentlichen Repo steht. Erkannt werden 0160…, +49 160…, 49160… in
// allen Schreibweisen mit Leerzeichen, Schraegstrich, Bindestrich oder Punkt.
const ALTE_NUMMER_SHA256 = '7feec87cd054cc78589ab488f9238b015c111b6845f50447fc889f18111b39ff'
const enthaeltAlteNummer = (text) => {
  const kompakt = text.replace(/[\s\/.\-()]/g, '')
  for (const t of kompakt.matchAll(/(?:\+49|0049|49|0)(160\d{7})(?!\d)/g))
    if (createHash('sha256').update(t[1]).digest('hex') === ALTE_NUMMER_SHA256) return true
  return false
}

const fehler = []
const hinweise = []
const fehlt = (url, was) => fehler.push(`${url}: ${was}`)

// Suchbegriff -> Seite, die dafuer ranken soll. "woerter" muessen alle (klein
// geschrieben) in title + description + h1 der Live-Seite vorkommen. Neue
// Begriffe hier eintragen und in docs/SEO-MONITORING.md dokumentieren.
const SUCHBEGRIFFE = [
  { begriff: 'Schüller Küchen Würzburg', pfad: '/marken/schueller', woerter: ['schüller', 'küchen', 'würzburg'] },
  { begriff: 'next125 Würzburg', pfad: '/marken/next125', woerter: ['next125', 'würzburg'] },
  { begriff: 'nobilia Würzburg', pfad: '/marken/nobilia', woerter: ['nobilia', 'würzburg'] },
  { begriff: 'IMPULS Küchen Würzburg', pfad: '/marken/impuls', woerter: ['impuls', 'küchen', 'würzburg'] },
  { begriff: 'BORA Würzburg', pfad: '/marken/bora', woerter: ['bora', 'würzburg'] },
  { begriff: 'Miele Würzburg', pfad: '/marken/miele', woerter: ['miele', 'würzburg'] },
  { begriff: 'Quooker Würzburg', pfad: '/marken/quooker', woerter: ['quooker', 'würzburg'] },
  { begriff: 'Küchenmarken Würzburg', pfad: '/marken', woerter: ['küchenmarken', 'würzburg'] },
  { begriff: 'Küchen für Bauträger Würzburg', pfad: '/kuechen-fuer-bautraeger', woerter: ['küchen', 'bauträger', 'würzburg'] },
  { begriff: 'Küchen Immobilieninvestoren Würzburg', pfad: '/kuechen-fuer-immobilieninvestoren', woerter: ['küchen', 'immobilieninvestoren', 'würzburg'] },
  { begriff: 'Küchen für Bauträger deutschlandweit', pfad: '/kuechen-fuer-bautraeger', woerter: ['bauträger', 'deutschlandweit'] },
  { begriff: 'Küchen für Immobilieninvestoren deutschlandweit', pfad: '/kuechen-fuer-immobilieninvestoren', woerter: ['immobilieninvestoren', 'deutschlandweit'] },
  { begriff: 'Küchenstudio Eröffnung Würzburg', pfad: '/studio', woerter: ['küchenstudio', 'eröffnung', 'würzburg'] },
  { begriff: 'Küchenmontage Würzburg', pfad: '/kuechenmontage-wuerzburg', woerter: ['küchenmontage', 'würzburg'] },
]
const seitenText = new Map()
const entities = (t) => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")

async function hole(url) {
  const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'VIDEKO-SEO-Monitor' } })
  return { status: res.status, text: res.status === 200 ? await res.text() : '' }
}

// Sitemap
const sm = await hole(`${ORIGIN}/sitemap.xml`)
if (sm.status !== 200) {
  console.error(`sitemap.xml liefert ${sm.status} – Abbruch.`)
  process.exit(1)
}
const urls = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

// Seiten pruefen (je 6 parallel, damit es schnell geht und nicht drueckt)
const ergebnisse = []
for (let i = 0; i < urls.length; i += 6) {
  await Promise.all(urls.slice(i, i + 6).map(async (url) => {
    const { status, text } = await hole(url)
    ergebnisse.push({ url, status })
    if (status !== 200) return fehlt(url, `Status ${status}`)
    if (!/<title>[^<]{5,}<\/title>/.test(text)) fehlt(url, 'kein <title>')
    if (!/<meta name="description" content="[^"]{30,}"/.test(text)) fehlt(url, 'keine meta description')
    const canon = text.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    if (!canon) fehlt(url, 'kein canonical')
    else if (canon.replace(/\/$/, '') !== url.replace(/\/$/, '')) fehlt(url, `canonical zeigt auf ${canon}`)
    if (/<meta name="robots" content="[^"]*noindex/.test(text)) fehlt(url, 'noindex, steht aber in der Sitemap')
    if (enthaeltAlteNummer(text)) fehlt(url, 'alte Mobilnummer im HTML')
    const kern = [
      text.match(/<title>([^<]*)<\/title>/)?.[1],
      text.match(/<meta name="description" content="([^"]*)"/)?.[1],
      text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, ' '),
    ].filter(Boolean).join(' ')
    seitenText.set(new URL(url).pathname.replace(/\/$/, '') || '/', entities(kern).toLowerCase())
  }))
}

// Suchbegriffe: Zielseite vorhanden und thematisch eindeutig
let begriffeOk = 0
for (const b of SUCHBEGRIFFE) {
  const kern = seitenText.get(b.pfad)
  if (kern === undefined) { fehlt(b.pfad, `Zielseite fuer "${b.begriff}" nicht in der Sitemap oder nicht 200`); continue }
  const fehlend = b.woerter.filter((w) => !kern.includes(w))
  if (fehlend.length) fehlt(b.pfad, `"${b.begriff}": ${fehlend.join(', ')} fehlt in title/description/h1`)
  else begriffeOk++
}

// Startseite: strukturierte Daten
const home = await hole(`${ORIGIN}/`)
const tel = [...home.text.matchAll(/"telephone":"([^"]+)"/g)].map((m) => m[1])
if (tel.length === 0) fehlt('/', 'kein telephone im JSON-LD')
for (const t of tel) if (t.replace(/\s/g, '') !== TELEFON_OFFIZIELL) fehlt('/', `JSON-LD-Telefon ${t} statt ${TELEFON_OFFIZIELL}`)

// robots.txt
const robots = await hole(`${ORIGIN}/robots.txt`)
if (robots.status !== 200) fehlt('/robots.txt', `Status ${robots.status}`)
else if (!robots.text.includes(`${ORIGIN}/sitemap.xml`)) fehlt('/robots.txt', 'verweist nicht auf die Sitemap')

// IndexNow-Schluessel
try {
  const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
  const keyFile = readdirSync(pub).find((n) => /^[a-f0-9]{32}\.txt$/.test(n))
  const key = readFileSync(join(pub, keyFile), 'utf8').trim()
  const k = await hole(`${ORIGIN}/${keyFile}`)
  if (k.status !== 200 || k.text.trim() !== key) fehlt(`/${keyFile}`, `IndexNow-Schluessel liefert ${k.status} oder falschen Inhalt`)
} catch {
  hinweise.push('IndexNow-Schluessel lokal nicht gefunden – Pruefung uebersprungen')
}

const ohneLastmod = (sm.text.match(/<url>/g) || []).length - (sm.text.match(/<lastmod>/g) || []).length
if (ohneLastmod > 0) hinweise.push(`${ohneLastmod} Sitemap-URLs ohne <lastmod>`)

console.log(`SEO-Monitor ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`)
console.log(`Sitemap-URLs: ${urls.length} · 200: ${ergebnisse.filter((e) => e.status === 200).length} · JSON-LD-Telefon: ${tel.join(', ') || '–'}`)
console.log(`Suchbegriffe mit passender Zielseite: ${begriffeOk}/${SUCHBEGRIFFE.length}`)
for (const h of hinweise) console.log(`Hinweis: ${h}`)
if (fehler.length) {
  console.log(`\n${fehler.length} Fehler:`)
  for (const f of fehler) console.log(`  ✕ ${f}`)
} else console.log('Keine Fehler.')
if (process.env.JSON) console.log(JSON.stringify({ urls: urls.length, fehler, hinweise }, null, 2))
process.exit(fehler.length ? 1 : 0)
