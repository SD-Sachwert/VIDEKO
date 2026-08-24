/**
 * Statisches Prerendering (SSG) nach dem Vite-Build.
 *
 * PROBLEM
 * -------
 * Die Seite ist eine reine Client-App. Vercel lieferte fuer jeden Pfad
 * dieselbe index.html mit den Startseiten-Metadaten aus. Erst React hat Title,
 * Description, Canonical und OG-Tags nachtraeglich gesetzt. Crawler, die kein
 * JavaScript ausfuehren — allen voran die Vorschau-Bots von WhatsApp, Facebook,
 * LinkedIn, Slack und X — sahen deshalb auf JEDER Unterseite die Startseite.
 *
 * LOESUNG (Stufe 1, 14.08.2026): eigener Kopf pro Route
 * ----------------------------------------------------
 * Nach dem Build wird pro bekannter Route eine eigene `dist/<pfad>/index.html`
 * geschrieben. Identisches Markup, identisches JS-Bundle — nur der Kopf war
 * fest eingebacken. Zusaetzlich entsteht `dist/404.html`, damit unbekannte
 * Pfade von Vercel mit echtem HTTP 404 beantwortet werden koennen.
 *
 * LOESUNG (Stufe 2, 24.08.2026): auch der Body
 * --------------------------------------------
 * Der Kopf allein reichte nicht. Ein `curl` auf jede der 85 URLs lieferte
 * unveraendert
 *
 *     <body>
 *       <div id="root"></div>
 *     </body>
 *
 * — 33 Zeichen, keine Ueberschrift, kein Text, kein einziges <a href>. Damit
 * existierte fuer alles, was kein JavaScript ausfuehrt, weder Inhalt noch
 * interne Verlinkung; die Auffindbarkeit haing komplett an der sitemap.xml.
 *
 * Deshalb rendert dieses Skript die App jetzt zusaetzlich einmal pro Route in
 * Node (src/entry-server.jsx) und schreibt das Ergebnis in `#root`. Der Client
 * uebernimmt das Markup per `hydrateRoot` (src/main.jsx), statt es zu
 * verwerfen. Weiterhin kein Framework-Wechsel, kein Data Router, kein Next.js:
 * dieselbe App, dieselben Routen, nur einmal zusaetzlich im Build ausgefuehrt.
 *
 * Dafuer musste der Catch-all-Rewrite `/((?!api/).*) -> /index.html` aus
 * vercel.json entfernt werden. Da jede bekannte Route als eigene Datei
 * existiert, greift der Dateisystem-Treffer vorher — Deep Links antworten
 * unveraendert mit HTTP 200, nur eben mit dem richtigen Kopf. Alles Unbekannte
 * faellt auf dist/404.html. Die Funktionen unter /api/ bleiben unberuehrt.
 *
 * Diese Erlaeuterung steht hier und nicht in vercel.json: Vercel validiert die
 * Datei gegen https://openapi.vercel.sh/vercel.json, und dieses Schema setzt
 * `additionalProperties: false`. Ein Kommentar-Key wie `"//"` laesst deshalb
 * JEDEN Deployment-Build fehlschlagen ("Deployment failed", 14.08.2026).
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

// Manifest, Asset-Aufloesung und der Vite-SSR-Build liegen in einem eigenen
// Modul, weil scripts/pruefe-ssg.mjs exakt dieselben Routendaten braucht.
import {
  ROOT, DIST, MANIFEST, fehlendeAssets, ladeModule, raeumeTmp,
} from './_prerender-bundle.mjs'

/* ------------------------------------------------------------------ *
 * 1. HTML-Kopf bauen
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
  '/kuechen-nach-mass': 'src/pages/KuechenNachMass.jsx',
  '/arbeitsplatten': 'src/pages/Arbeitsplatten.jsx',
  '/kuechenmontage-wuerzburg': 'src/pages/KuechenmontageWuerzburg.jsx',
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
    // data-seo-id: stabile Kennung, damit Seo.jsx den Block nach der Hydration
    // aktualisiert statt einen zweiten danebenzuhaengen.
    zeilen.push('', `    <script type="application/ld+json" data-seo-id="${esc(ldSlotId(block))}">${json}</script>`)
  }
  return zeilen.join('\n')
}

/* ------------------------------------------------------------------ *
 * 2. Schreiben
 * ------------------------------------------------------------------ */

const MARKER_START = '<!--seo:start-->'
const MARKER_END = '<!--seo:end-->'

/**
 * Der Wurzelknoten aus index.html — hier kommt das Markup hinein.
 *
 * Der Ausdruck greift absichtlich auch dann, wenn in `#root` bereits Markup
 * steht. dist/index.html dient gleichzeitig als Vorlage UND als Startseite;
 * ohne diese Toleranz waere ein zweiter Lauf von `node scripts/prerender.mjs`
 * ohne vorheriges `vite build` nicht moeglich. Das schliessende `</div>` wird
 * ueber das unmittelbar folgende `</body>` identifiziert — im gerenderten
 * Inhalt kommt kein `</body>` vor.
 */
const WURZEL_RE = /(<div id="root">)[\s\S]*?(<\/div>\s*<\/body>)/

function schreibeSeite(vorlage, pfad, head, absUrl, SITE, VARIANTS, koerper, dateiname) {
  let html = vorlage.replace(
    new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`),
    () => `${MARKER_START}\n${kopfHtml(head, absUrl, SITE, VARIANTS)}\n    ${MARKER_END}`,
  )
  // Funktion als Ersatz, nicht String: im Markup kommen `$&`-Sequenzen vor
  // (z. B. in URLs), die String.replace sonst als Rueckverweis auslegen wuerde.
  html = html.replace(WURZEL_RE, (_, auf, zu) => `${auf}${koerper || ''}${zu}`)
  const ziel = dateiname
    ? path.join(DIST, dateiname)
    : path.join(DIST, pfad === '/' ? '' : pfad.replace(/^\//, ''), 'index.html')
  fs.mkdirSync(path.dirname(ziel), { recursive: true })
  fs.writeFileSync(ziel, html)
  return path.relative(DIST, ziel).split(path.sep).join('/')
}

/* ------------------------------------------------------------------ *
 * 3. Sitemap
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
if (!WURZEL_RE.test(vorlage)) {
  console.error('✖ index.html enthaelt kein <div id="root"> vor </body> — Body-Prerendering nicht moeglich.')
  process.exit(1)
}

const { daten, server } = await ladeModule()
const {
  STATIC_ROUTES, journalArticles, MERCH_PRODUCTS, MERCH_FAMILIES,
  staticRouteHead, journalArticleHead, merchDetailHead, merchCanonicalSlug,
  ldSlotId, SITE, absUrl, IMAGE_VARIANTS,
} = daten

/**
 * Routen, deren Body bewusst NICHT vorgerendert wird.
 *
 * `/experience` verzweigt in src/pages/Experience.jsx:19-22 die GANZE Seite an
 * `window.matchMedia`: Desktop bekommt die WebGL-Ansicht, Mobil/Reduced-Motion
 * die Bildstrecke. Das sind zwei voellig verschiedene DOM-Baeume. Der Build
 * kennt die Viewportbreite nicht und koennte deshalb nur einen von beiden
 * schreiben — die jeweils andere Geraeteklasse saehe erst die falsche Variante
 * und dann, nach der Hydration, einen kompletten Austausch des Teilbaums. Ein
 * sichtbares Umspringen der Seite waere schlimmer als der heutige Zustand.
 * Der Kopf (Title, Description, Canonical, JSON-LD) wird weiterhin gesetzt.
 */
const OHNE_KOERPER = new Set(['/experience'])

/**
 * Optionaler Filter fuer die Einfuehrung in Stufen.
 *
 *   VIDEKO_SSG_ROUTEN="/,/planung,/studio" node scripts/prerender.mjs
 *
 * rendert nur diese Bodys vor; alle uebrigen Seiten behalten voruebergehend das
 * bisherige Verhalten (nur Kopf). Ohne die Variable wird alles gerendert.
 */
const NUR_ROUTEN = process.env.VIDEKO_SSG_ROUTEN
  ? new Set(process.env.VIDEKO_SSG_ROUTEN.split(',').map((r) => r.trim()).filter(Boolean))
  : null

/** Routen, bei denen das Rendern fehlgeschlagen ist (Abbruch am Ende). */
const renderFehler = []

async function koerperFuer(pfad) {
  if (OHNE_KOERPER.has(pfad)) return null
  if (NUR_ROUTEN && !NUR_ROUTEN.has(pfad)) return null
  try {
    return await server.rendereRoute(pfad)
  } catch (fehler) {
    renderFehler.push({ pfad, fehler: fehler?.message || String(fehler) })
    return null
  }
}

const geschrieben = []
const sitemapPfade = []
let mitKoerper = 0

/* statische Routen */
for (const route of STATIC_ROUTES) {
  const head = staticRouteHead(route)
  const koerper = await koerperFuer(route.path)
  if (koerper) mitKoerper += 1
  geschrieben.push(schreibeSeite(vorlage, route.path, head, absUrl, SITE, IMAGE_VARIANTS, koerper))
  if (route.inSitemap !== false && !route.noindex) sitemapPfade.push(route.path)
}

/* Journalartikel */
for (const artikel of journalArticles) {
  const head = journalArticleHead(artikel)
  const koerper = await koerperFuer(head.canonicalPath)
  if (koerper) mitKoerper += 1
  geschrieben.push(schreibeSeite(vorlage, head.canonicalPath, head, absUrl, SITE, IMAGE_VARIANTS, koerper))
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
  // Achtung: geschrieben wird unter dem EIGENEN Pfad. `head.canonicalPath`
  // zeigt bei Farbvarianten auf die fuehrende Seite der Gruppe (merch.js) —
  // als Zieldatei waere das die falsche Adresse.
  const pfad = `/merch/${seite.slug}`
  const kanonisch = merchCanonicalSlug(seite.slug)
  const head = merchDetailHead({ ...seite, canonicalSlug: kanonisch })
  const koerper = await koerperFuer(pfad)
  if (koerper) mitKoerper += 1
  geschrieben.push(schreibeSeite(vorlage, pfad, head, absUrl, SITE, IMAGE_VARIANTS, koerper))
  // Nur kanonische Seiten in die Sitemap. Die Farbvarianten bleiben crawlbar
  // und verlinkt, konkurrieren aber nicht mit ihrer eigenen Hauptseite.
  if (kanonisch === seite.slug) sitemapPfade.push(pfad)
}

/* 404 — noindex, kein Sitemap-Eintrag.
   Der Body kommt aus der Catch-all-Route in App.jsx, rendert also dieselbe
   NotFound-Seite, die auch ein Klick im Browser zeigen wuerde. */
{
  const koerper = await koerperFuer('/404')
  if (koerper) mitKoerper += 1
  schreibeSeite(vorlage, '/404', {
    title: 'Seite nicht gefunden | VIDEKO Küchen',
    description: 'Diese Seite gibt es nicht (mehr). Zurück zur Startseite oder direkt zur Beratungsanfrage.',
    canonicalPath: '/404',
    noindex: true,
    ogType: 'website',
    jsonLd: [],
  }, absUrl, SITE, IMAGE_VARIANTS, koerper, '404.html')
}

const anzahlSitemap = schreibeSitemap(sitemapPfade, absUrl)

console.log(`✔ Prerender: ${geschrieben.length} Routen + 404.html`)
console.log(`  · statisch ${STATIC_ROUTES.length} · Journal ${journalArticles.length} · Shop ${gesehen.size}`)
console.log(`✔ Body gerendert: ${mitKoerper} von ${geschrieben.length + 1} Seiten`)
if (OHNE_KOERPER.size) {
  console.log(`  · bewusst nur Kopf: ${[...OHNE_KOERPER].join(', ')}`)
}
console.log(`✔ sitemap.xml: ${anzahlSitemap} URLs`)
if (fehlendeAssets.size) {
  console.warn(`⚠ ${fehlendeAssets.size} Asset(s) ohne Manifest-Eintrag:`)
  for (const a of fehlendeAssets) console.warn(`   ${a}`)
}

raeumeTmp()

// Ein stiller Fehlschlag waere hier besonders teuer: die Seite ginge dann
// einfach wieder ohne Inhalt live. Deshalb Build abbrechen.
if (renderFehler.length) {
  console.error(`✖ ${renderFehler.length} Route(n) liessen sich nicht rendern:`)
  for (const f of renderFehler) console.error(`   ${f.pfad}: ${f.fehler}`)
  process.exit(1)
}
