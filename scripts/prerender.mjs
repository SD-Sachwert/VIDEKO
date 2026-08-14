/**
 * Prerendering der Kopfdaten nach dem Vite-Build.
 *
 * PROBLEM
 * -------
 * Die Seite ist eine reine Client-App. Vercel lieferte fuer jeden Pfad
 * dieselbe index.html mit den Startseiten-Metadaten aus. Erst React hat Title,
 * Description, Canonical und OG-Tags nachtraeglich gesetzt. Crawler, die kein
 * JavaScript ausfuehren — allen voran die Vorschau-Bots von WhatsApp, Facebook,
 * LinkedIn, Slack und X — sahen deshalb auf JEDER Unterseite die Startseite.
 *
 * LOESUNG
 * -------
 * Die kleinste robuste Variante: kein SSR, keine Framework-Migration. Nach dem
 * Build wird pro bekannter Route eine eigene `dist/<pfad>/index.html`
 * geschrieben. Identisches Markup, identisches JS-Bundle — nur der Kopf ist
 * fest eingebacken. Zusaetzlich entsteht `dist/404.html`, damit unbekannte
 * Pfade von Vercel mit echtem HTTP 404 beantwortet werden koennen (dazu muss
 * der Catch-all-Rewrite in vercel.json weg sein — siehe dort).
 *
 * Da jede bekannte Route als Datei existiert, greift der Dateisystem-Treffer
 * vor dem 404. Deep Links funktionieren unveraendert.
 *
 * DATENHERKUNFT
 * -------------
 * Titel, Description und JSON-LD kommen aus denselben Funktionen, die auch zur
 * Laufzeit greifen (src/data/head.js). Zwei getrennte Implementierungen wuerden
 * unweigerlich auseinanderlaufen.
 *
 * Weil die Datenmodule `import.meta.glob` nutzen und Bilder importieren, laesst
 * sich journal.js/merch.js nicht direkt mit Node importieren. Deshalb baut das
 * Skript scripts/_prerender-data.js einmal als SSR-Bundle mit Vite. Bild-
 * Importe werden dabei auf die gehashten URLs aus dem Client-Manifest
 * umgebogen, damit og:image auf die real ausgelieferte Datei zeigt.
 *
 * Nebenprodukt: sitemap.xml wird aus derselben Routenliste erzeugt.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const TMP = path.join(ROOT, 'node_modules', '.videko-prerender')

const ASSET_RE = /\.(webp|avif|png|jpe?g|gif|svg|mp4|webm|mp3|woff2?|ttf)(\?.*)?$/i

/* ------------------------------------------------------------------ *
 * 1. Manifest lesen — Quellpfad -> ausgelieferte URL
 * ------------------------------------------------------------------ */

const manifestPfad = path.join(DIST, '.vite', 'manifest.json')
if (!fs.existsSync(manifestPfad)) {
  console.error(`✖ ${path.relative(ROOT, manifestPfad)} fehlt. Erst "vite build" laufen lassen (build.manifest: true).`)
  process.exit(1)
}
const MANIFEST = JSON.parse(fs.readFileSync(manifestPfad, 'utf8'))

/** Fallback ueber den Basename, falls ein Asset nicht im Manifest steht. */
const NACH_BASENAME = new Map()
for (const [key, eintrag] of Object.entries(MANIFEST)) {
  if (!eintrag.file) continue
  NACH_BASENAME.set(path.posix.basename(key), `/${eintrag.file}`)
}

/** Assets, zu denen kein Manifest-Eintrag gefunden wurde (Warnung am Ende). */
const fehlendeAssets = new Set()

/** Vite-Standard: alles darunter wird als data:-URI ins Bundle inlined. */
const INLINE_LIMIT = 4096
const MIME = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.avif': 'image/avif', '.svg': 'image/svg+xml',
}

function assetUrl(absPfad) {
  const key = path.relative(ROOT, absPfad).split(path.sep).join('/')
  const treffer = MANIFEST[key]
  if (treffer?.file) return `/${treffer.file}`

  // Kleine Assets stehen nicht im Manifest, weil Vite sie als data:-URI
  // inlined. Genau das hier nachbilden, sonst zeigt ein srcSet-Eintrag auf
  // eine Datei, die es in dist/ gar nicht gibt.
  const ext = path.extname(absPfad).toLowerCase()
  if (MIME[ext] && fs.existsSync(absPfad)) {
    const buf = fs.readFileSync(absPfad)
    if (buf.length < INLINE_LIMIT) return `data:${MIME[ext]};base64,${buf.toString('base64')}`
  }

  const alt = NACH_BASENAME.get(path.posix.basename(key))
  if (alt) return alt
  // Kein Manifest-Eintrag: lieber der Quellpfad als eine erfundene URL. Faellt
  // in der Pruefung unten als kaputtes og:image auf.
  fehlendeAssets.add(key)
  return `/${key}`
}

/* ------------------------------------------------------------------ *
 * 2. Datenmodule per Vite-SSR-Build nach Node holen
 * ------------------------------------------------------------------ */

/** Ersetzt jeden Asset-Import durch die gehashte URL aus dem Manifest. */
const assetStubPlugin = {
  name: 'videko-prerender-asset-stub',
  enforce: 'pre',
  async resolveId(quelle, importer) {
    if (!ASSET_RE.test(quelle)) return null
    const aufgeloest = await this.resolve(quelle, importer, { skipSelf: true })
    if (!aufgeloest) return null
    return `\0videko-asset:${aufgeloest.id.split('?')[0]}`
  },
  load(id) {
    if (!id.startsWith('\0videko-asset:')) return null
    const abs = id.slice('\0videko-asset:'.length)
    return `export default ${JSON.stringify(assetUrl(abs))}`
  },
}

async function ladeDaten() {
  await build({
    configFile: false,
    root: ROOT,
    logLevel: 'error',
    plugins: [assetStubPlugin],
    build: {
      ssr: true,
      outDir: path.relative(ROOT, TMP),
      emptyOutDir: true,
      minify: false,
      rollupOptions: { input: path.join(ROOT, 'scripts', '_prerender-data.js') },
    },
  })
  return import(pathToFileURL(path.join(TMP, '_prerender-data.js')).href)
}

/* ------------------------------------------------------------------ *
 * 3. HTML-Kopf bauen
 * ------------------------------------------------------------------ */

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const meta = (attr, key, wert) => `    <meta ${attr}="${key}" content="${esc(wert)}" />`

/**
 * Preload-Links fuer das LCP-Bild.
 *
 * `imagesrcset`/`imagesizes` muessen mit dem <img> uebereinstimmen, sonst laedt
 * der Browser zwei verschiedene Dateien statt einer.
 */
function preloadHtml(preloads, VARIANTS) {
  const zeilen = []
  for (const p of preloads || []) {
    if (!p?.src) continue
    const meta = VARIANTS.get(p.src)
    const attr = [`rel="preload"`, `as="image"`, `href="${esc(p.src)}"`]
    if (p.responsive !== false && meta?.srcSet) {
      attr.push(`imagesrcset="${esc(meta.srcSet)}"`)
      if (p.sizes) attr.push(`imagesizes="${esc(p.sizes)}"`)
    }
    if (p.media) attr.push(`media="${esc(p.media)}"`)
    attr.push('fetchpriority="high"')
    zeilen.push(`    <link ${attr.join(' ')} />`)
  }
  return zeilen
}

/**
 * Schriftschnitte, die auf jeder Seite schon im ersten Bildschirm stehen.
 *
 * WARUM PRELOAD
 * -------------
 * Belegt per Lighthouse-Trace: Der einzige Layout-Shift der Startseite
 * (CLS 0,128 mobil) entsteht, wenn die Webfonts nachtraeglich einspringen —
 * mit `font-display: optional` faellt derselbe Lauf auf CLS 0. Die Dateien
 * wurden vorher ohnehin geladen, nur erst ~170 ms nach dem CSS, also nach dem
 * ersten Textbild. Der Preload verschiebt sie nach vorne, ohne ein einziges
 * zusaetzliches Byte.
 *
 * `font-display: swap` bleibt bewusst stehen: Die Marken-Typografie soll auch
 * dann erscheinen, wenn der Preload mal nicht rechtzeitig ankommt.
 */
const FONT_PRELOADS = [
  'src/assets/fonts/cormorant-600.woff2', // Ueberschriften
  'src/assets/fonts/inter-400.woff2', // Fliesstext
  'src/assets/fonts/inter-500.woff2', // Kicker, Buttons
  'src/assets/fonts/inter-600.woff2', // Auszeichnungen
]

function fontPreloadHtml() {
  return FONT_PRELOADS.map((quelle) => {
    const treffer = MANIFEST[quelle]
    if (!treffer?.file) {
      fehlendeAssets.add(quelle)
      return null
    }
    // crossorigin ist bei Fonts Pflicht — ohne das Attribut laedt der Browser
    // die Datei ein zweites Mal.
    return `    <link rel="preload" as="font" type="font/woff2" href="/${treffer.file}" crossorigin />`
  }).filter(Boolean)
}

/**
 * Modulepreload fuer den Routen-Chunk.
 *
 * Seit Performance 1.1 wird jede Seite ausser der Startseite per React.lazy
 * nachgeladen (src/App.jsx). Ohne Hinweis im Kopf entdeckt der Browser den
 * Chunk erst, nachdem das Hauptbundle ausgewertet wurde — ein zusaetzlicher
 * Roundtrip mitten in der kritischen Kette, und bis dahin steht im <main> nur
 * der Suspense-Platzhalter.
 *
 * Die Zuordnung Pfad -> Seitenmodul spiegelt die Routen aus App.jsx. Fehlt ein
 * Modul im Manifest, faellt das unten als Warnung auf (statt still zu bleiben).
 */
const SEITEN_MODUL = {
  // '/' fehlt bewusst: Home ist statisch im Startbundle (siehe src/App.jsx).
  '/studio': 'src/pages/Studio.jsx',
  '/leistungen': 'src/pages/Leistungen.jsx',
  '/alles-aus-einer-hand': 'src/pages/AllesAusEinerHand.jsx',
  '/inspiration': 'src/pages/Inspiration.jsx',
  '/vorher-nachher': 'src/pages/VorherNachher.jsx',
  '/journal': 'src/pages/Journal.jsx',
  '/karriere': 'src/pages/Karriere.jsx',
  '/ueber-uns': 'src/pages/UeberUns.jsx',
  '/beratung': 'src/pages/Beratung.jsx',
  '/merch': 'src/pages/Merch.jsx',
  '/vormerkung-bestaetigen': 'src/pages/VormerkungBestaetigen.jsx',
  '/experience': 'src/pages/Experience.jsx',
  '/impressum': 'src/pages/Impressum.jsx',
  '/datenschutz': 'src/pages/Datenschutz.jsx',
  '/versand-lieferung': 'src/pages/VersandLieferung.jsx',
  '/rueckgabe-widerruf': 'src/pages/RueckgabeWiderruf.jsx',
  '/agb': 'src/pages/AGB.jsx',
  '/stylefinder': 'src/pages/Stylefinder.jsx',
  '/showroom': 'src/pages/Showroom.jsx',
  '/planung': 'src/pages/Planung.jsx',
  '/team': 'src/pages/Team.jsx',
  '/404': 'src/pages/NotFound.jsx',
}

/** Alles, was der Einstiegs-Chunk ohnehin schon vorlaedt, nicht doppelt setzen. */
const EINSTIEG_CHUNKS = new Set()
{
  const einstieg = Object.values(MANIFEST).find((e) => e.isEntry)
  const sammle = (eintrag) => {
    if (!eintrag?.file || EINSTIEG_CHUNKS.has(eintrag.file)) return
    EINSTIEG_CHUNKS.add(eintrag.file)
    for (const k of eintrag.imports || []) sammle(MANIFEST[k])
  }
  sammle(einstieg)
}

function modulPfadFuer(pfad) {
  if (SEITEN_MODUL[pfad]) return SEITEN_MODUL[pfad]
  if (pfad.startsWith('/journal/')) return 'src/pages/JournalArticle.jsx'
  if (pfad.startsWith('/merch/')) return 'src/pages/ProductDetail.jsx'
  return null // '/' ist statisch importiert und braucht nichts
}

function routenChunkHtml(pfad) {
  const modul = modulPfadFuer(pfad)
  if (!modul) return []
  const eintrag = MANIFEST[modul]
  if (!eintrag?.file) {
    fehlendeAssets.add(modul)
    return []
  }
  const dateien = []
  const sammle = (e) => {
    if (!e?.file || EINSTIEG_CHUNKS.has(e.file) || dateien.includes(e.file)) return
    dateien.push(e.file)
    for (const k of e.imports || []) sammle(MANIFEST[k])
  }
  sammle(eintrag)
  return dateien.map((f) => `    <link rel="modulepreload" crossorigin href="/${f}" />`)
}

function kopfHtml(head, absUrl, SITE, VARIANTS) {
  const canonical = absUrl(head.canonicalPath)
  const bild = absUrl(head.image || SITE.defaultOgImage)
  const zeilen = [
    ...fontPreloadHtml(),
    ...routenChunkHtml(head.canonicalPath),
    ...preloadHtml(head.preload, VARIANTS),
    `    <title>${esc(head.title)}</title>`,
    meta('name', 'description', head.description),
    meta('name', 'robots', head.noindex ? 'noindex, follow' : 'index, follow'),
    `    <link rel="canonical" href="${esc(canonical)}" />`,
    '',
    meta('property', 'og:site_name', SITE.name),
    meta('property', 'og:locale', SITE.locale),
    meta('property', 'og:type', head.ogType || 'website'),
    meta('property', 'og:url', canonical),
    meta('property', 'og:title', head.title),
    meta('property', 'og:description', head.description),
    meta('property', 'og:image', bild),
  ]
  if (head.imageAlt) zeilen.push(meta('property', 'og:image:alt', head.imageAlt))
  zeilen.push(
    '',
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', head.title),
    meta('name', 'twitter:description', head.description),
    meta('name', 'twitter:image', bild),
  )
  if (head.imageAlt) zeilen.push(meta('name', 'twitter:image:alt', head.imageAlt))

  for (const block of head.jsonLd || []) {
    // </script> im Text wuerde den Block vorzeitig schliessen.
    const json = JSON.stringify(block).replace(/<\//g, '<\\/')
    zeilen.push('', `    <script type="application/ld+json">${json}</script>`)
  }
  return zeilen.join('\n')
}

/* ------------------------------------------------------------------ *
 * 4. Schreiben
 * ------------------------------------------------------------------ */

const MARKER_START = '<!--seo:start-->'
const MARKER_END = '<!--seo:end-->'

function schreibeSeite(vorlage, pfad, head, absUrl, SITE, VARIANTS, dateiname) {
  const html = vorlage.replace(
    new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`),
    () => `${MARKER_START}\n${kopfHtml(head, absUrl, SITE, VARIANTS)}\n    ${MARKER_END}`,
  )
  const ziel = dateiname
    ? path.join(DIST, dateiname)
    : path.join(DIST, pfad === '/' ? '' : pfad.replace(/^\//, ''), 'index.html')
  fs.mkdirSync(path.dirname(ziel), { recursive: true })
  fs.writeFileSync(ziel, html)
  return path.relative(DIST, ziel).split(path.sep).join('/')
}

/* ------------------------------------------------------------------ *
 * 5. Sitemap
 * ------------------------------------------------------------------ */

function schreibeSitemap(pfade, absUrl) {
  const urls = pfade.map((p) => `  <url><loc>${esc(absUrl(p))}</loc></url>`).join('\n')
  fs.writeFileSync(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  )
  return pfade.length
}

/* ------------------------------------------------------------------ *
 * Ablauf
 * ------------------------------------------------------------------ */

const vorlagePfad = path.join(DIST, 'index.html')
const vorlage = fs.readFileSync(vorlagePfad, 'utf8')
if (!vorlage.includes(MARKER_START) || !vorlage.includes(MARKER_END)) {
  console.error(`✖ index.html enthaelt die Marker ${MARKER_START} / ${MARKER_END} nicht.`)
  process.exit(1)
}

const daten = await ladeDaten()
const {
  STATIC_ROUTES, journalArticles, MERCH_PRODUCTS, MERCH_FAMILIES,
  staticRouteHead, journalArticleHead, merchDetailHead, SITE, absUrl, IMAGE_VARIANTS,
} = daten

const geschrieben = []
const sitemapPfade = []

/* statische Routen */
for (const route of STATIC_ROUTES) {
  const head = staticRouteHead(route)
  geschrieben.push(schreibeSeite(vorlage, route.path, head, absUrl, SITE, IMAGE_VARIANTS))
  if (route.inSitemap !== false && !route.noindex) sitemapPfade.push(route.path)
}

/* Journalartikel */
for (const artikel of journalArticles) {
  const head = journalArticleHead(artikel)
  geschrieben.push(schreibeSeite(vorlage, head.canonicalPath, head, absUrl, SITE, IMAGE_VARIANTS))
  sitemapPfade.push(head.canonicalPath)
}

/* Shop: Familienseiten und Einzelprodukte — beide liegen unter /merch/<slug> */
const merchSeiten = [
  ...MERCH_FAMILIES.map((f) => ({
    name: f.label,
    tagline: f.tagline || f.products?.[0]?.tagline || '',
    slug: f.slug,
    image: f.image || f.products?.[0]?.image,
  })),
  ...MERCH_PRODUCTS.map((p) => ({
    name: p.name, tagline: p.tagline || '', slug: p.slug, image: p.image,
  })),
]
const gesehen = new Set()
for (const seite of merchSeiten) {
  if (!seite.slug || gesehen.has(seite.slug)) continue
  gesehen.add(seite.slug)
  const head = merchDetailHead(seite)
  geschrieben.push(schreibeSeite(vorlage, head.canonicalPath, head, absUrl, SITE, IMAGE_VARIANTS))
  sitemapPfade.push(head.canonicalPath)
}

/* 404 — noindex, kein Sitemap-Eintrag */
schreibeSeite(vorlage, '/404', {
  title: 'Seite nicht gefunden | VIDEKO Küchen',
  description: 'Diese Seite gibt es nicht (mehr). Zurück zur Startseite oder direkt zur Beratungsanfrage.',
  canonicalPath: '/404',
  noindex: true,
  ogType: 'website',
  jsonLd: [],
}, absUrl, SITE, IMAGE_VARIANTS, '404.html')

const anzahlSitemap = schreibeSitemap(sitemapPfade, absUrl)

console.log(`✔ Prerender: ${geschrieben.length} Routen + 404.html`)
console.log(`  · statisch ${STATIC_ROUTES.length} · Journal ${journalArticles.length} · Shop ${gesehen.size}`)
console.log(`✔ sitemap.xml: ${anzahlSitemap} URLs`)
if (fehlendeAssets.size) {
  console.warn(`⚠ ${fehlendeAssets.size} Asset(s) ohne Manifest-Eintrag:`)
  for (const a of fehlendeAssets) console.warn(`   ${a}`)
}

fs.rmSync(TMP, { recursive: true, force: true })
