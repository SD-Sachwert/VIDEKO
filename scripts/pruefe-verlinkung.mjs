/**
 * Interne Verlinkung im ausgelieferten HTML (K2).
 *
 * Der Ausgangsbefund lautete: 0 `<a href>` im initialen HTML. Ursache war
 * nicht die Navigation, sondern der leere Body — React Routers `<Link>`
 * erzeugt sehr wohl echte Anker, sie standen nur nirgends in der Datei.
 * Seit dem Body-Prerendering (scripts/prerender.mjs) stehen sie drin.
 *
 * Dieses Skript misst deshalb den Ist-Zustand, ohne irgendetwas umzubauen:
 *   · wie viele interne <a href> jede Seite ausliefert
 *   · welche internen URLs ueberhaupt verlinkt werden
 *   · welche bekannten Routen KEINEN einzigen eingehenden Link haben
 *   · welche Seiten nur ueber Header/Footer erreichbar sind, also keinen
 *     einzigen Link aus einem Inhaltsbereich bekommen
 *
 * Gelesen wird ausschliesslich dist/ — also genau das, was ein Crawler ohne
 * JavaScript sieht.
 *
 * Aufruf:  npm run pruefe:links      (setzt "npm run build" voraus)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('✖ dist/ fehlt. Bitte zuerst "npm run build" ausfuehren.')
  process.exit(1)
}

/** Alle dist/**\/index.html einsammeln und in Routen zurueckuebersetzen. */
function seiten(verzeichnis = DIST, praefix = '') {
  const raus = []
  for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
    if (eintrag.isDirectory()) {
      if (eintrag.name === 'assets' || eintrag.name.startsWith('.')) continue
      raus.push(...seiten(path.join(verzeichnis, eintrag.name), `${praefix}/${eintrag.name}`))
    } else if (eintrag.name === 'index.html') {
      raus.push({ pfad: praefix || '/', datei: path.join(verzeichnis, eintrag.name) })
    }
  }
  return raus
}

const WURZEL_RE = /<div id="root">([\s\S]*?)<\/div>\s*<\/body>/
const A_RE = /<a\b[^>]*href="(\/[^"]*)"/g

/**
 * Kopf- und Fussbereich abtrennen. Ein Link, den jede Seite ohnehin traegt,
 * sagt nichts ueber die inhaltliche Verlinkung aus — genau darum geht es bei
 * der Frage nach verwaisten Seiten.
 */
function zerlege(wurzel) {
  const headerEnde = wurzel.indexOf('</header>')
  const footerStart = wurzel.indexOf('<footer')
  const rahmen = [
    headerEnde >= 0 ? wurzel.slice(0, headerEnde) : '',
    footerStart >= 0 ? wurzel.slice(footerStart) : '',
  ].join('')
  const inhalt = wurzel.slice(
    headerEnde >= 0 ? headerEnde : 0,
    footerStart >= 0 ? footerStart : wurzel.length,
  )
  return { rahmen, inhalt }
}

const alle = seiten().sort((a, b) => a.pfad.localeCompare(b.pfad))
const bekannt = new Set(alle.map((s) => s.pfad))

const proSeite = []
/** Ziel -> Menge der Seiten, die dorthin verlinken */
const eingehend = new Map()
/** Ziel -> Menge der Seiten, die aus dem Inhaltsbereich dorthin verlinken */
const eingehendInhalt = new Map()

const merke = (karte, ziel, quelle) => {
  if (!karte.has(ziel)) karte.set(ziel, new Set())
  karte.get(ziel).add(quelle)
}

const normiere = (href) => href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/'

for (const s of alle) {
  const html = fs.readFileSync(s.datei, 'utf8')
  const wurzel = (html.match(WURZEL_RE) || [])[1] || ''
  const { rahmen, inhalt } = zerlege(wurzel)

  const sammle = (teil) => [...teil.matchAll(A_RE)].map((m) => normiere(m[1]))
  const rahmenZiele = sammle(rahmen)
  const inhaltZiele = sammle(inhalt)
  const alleZiele = [...rahmenZiele, ...inhaltZiele]

  for (const z of new Set(alleZiele)) if (z !== s.pfad) merke(eingehend, z, s.pfad)
  for (const z of new Set(inhaltZiele)) if (z !== s.pfad) merke(eingehendInhalt, z, s.pfad)

  proSeite.push({
    pfad: s.pfad,
    gesamt: alleZiele.length,
    rahmen: rahmenZiele.length,
    inhalt: inhaltZiele.length,
    zieleInhalt: new Set(inhaltZiele.filter((z) => z !== s.pfad)),
  })
}

/* Erreichbarkeit ab '/' ueber alle internen Links */
const erreichbar = new Set(['/'])
const stapel = ['/']
const zieleVon = new Map(proSeite.map((p) => [p.pfad, new Set()]))
for (const s of alle) {
  const html = fs.readFileSync(s.datei, 'utf8')
  const wurzel = (html.match(WURZEL_RE) || [])[1] || ''
  for (const m of wurzel.matchAll(A_RE)) zieleVon.get(s.pfad)?.add(normiere(m[1]))
}
while (stapel.length) {
  const jetzt = stapel.pop()
  for (const z of zieleVon.get(jetzt) || []) {
    if (bekannt.has(z) && !erreichbar.has(z)) { erreichbar.add(z); stapel.push(z) }
  }
}

/* ------------------------------------------------------------------ */
/* Ausgabe                                                             */
/* ------------------------------------------------------------------ */

console.log('| Route | <a href> gesamt | davon Header/Footer | davon Inhalt | eingehend gesamt | eingehend aus Inhalt |')
console.log('| --- | --- | --- | --- | --- | --- |')
for (const p of proSeite) {
  console.log(`| ${p.pfad} | ${p.gesamt} | ${p.rahmen} | ${p.inhalt} | ${eingehend.get(p.pfad)?.size ?? 0} | ${eingehendInhalt.get(p.pfad)?.size ?? 0} |`)
}

const ohneEingehend = proSeite.filter((p) => p.pfad !== '/' && !(eingehend.get(p.pfad)?.size))
const nurRahmen = proSeite.filter((p) => p.pfad !== '/' && (eingehend.get(p.pfad)?.size) && !(eingehendInhalt.get(p.pfad)?.size))
const nichtErreichbar = [...bekannt].filter((p) => !erreichbar.has(p)).sort()

console.log('')
console.log(`Seiten in dist/: ${alle.length} · von "/" erreichbar: ${erreichbar.size}`)
console.log(`Interne <a href> insgesamt: ${proSeite.reduce((n, p) => n + p.gesamt, 0)}`)
console.log('')
console.log(`Ohne EINEN eingehenden internen Link (${ohneEingehend.length}):`)
for (const p of ohneEingehend) console.log(`   ${p.pfad}`)
console.log('')
console.log(`Nur ueber Header/Footer verlinkt, kein Link aus einem Inhaltsbereich (${nurRahmen.length}):`)
for (const p of nurRahmen) console.log(`   ${p.pfad}  (eingehend: ${eingehend.get(p.pfad).size})`)
console.log('')
console.log(`Ab "/" ueber interne Links NICHT erreichbar (${nichtErreichbar.length}):`)
for (const p of nichtErreichbar) console.log(`   ${p}`)

for (const beobachtet of ['/team', '/experience']) {
  const ein = eingehend.get(beobachtet)
  const einInhalt = eingehendInhalt.get(beobachtet)
  console.log('')
  console.log(`${beobachtet}: ${ein?.size ?? 0} eingehende Seiten, davon ${einInhalt?.size ?? 0} aus einem Inhaltsbereich`)
  if (einInhalt?.size) console.log(`   Quellen: ${[...einInhalt].join(', ')}`)
}
