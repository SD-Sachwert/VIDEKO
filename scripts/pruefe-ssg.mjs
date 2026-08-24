/**
 * Abnahmepruefung fuer das statische Prerendering.
 *
 * Ein erfolgreicher Build sagt nichts darueber aus, was tatsaechlich in den
 * Dateien steht. Dieses Skript startet deshalb einen kleinen Server ueber
 * `dist/` — mit derselben Aufloesung wie Vercel (`trailingSlash: false`,
 * Dateisystem-Treffer zuerst, sonst 404.html mit echtem Status 404) — und ruft
 * jede bekannte Route per HTTP ab. Geprueft wird ausschliesslich das
 * ausgelieferte HTML, ohne JavaScript.
 *
 * Aufruf:  npm run pruefe:ssg      (setzt einen Lauf von scripts/prerender.mjs voraus)
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

import { DIST, ladeModule, raeumeTmp } from './_prerender-bundle.mjs'

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('✖ dist/ fehlt. Bitte zuerst "npm run build" ausfuehren.')
  process.exit(1)
}

// Dieselbe Datenquelle wie scripts/prerender.mjs — sonst pruefte das Skript
// gegen seine eigenen Annahmen statt gegen die echten Routen.
const { daten } = await ladeModule()
const {
  STATIC_ROUTES, journalArticles, MERCH_PRODUCTS, MERCH_FAMILIES,
  staticRouteHead, journalArticleHead, merchDetailHead, absUrl,
} = daten

/* ------------------------------------------------------------------ */
/* Erwartungsliste — aus denselben Quellen wie der Prerender           */
/* ------------------------------------------------------------------ */

/**
 * Routen, deren Ausgabe bewusst nur aus dem Kopf besteht. Muss mit
 * OHNE_KOERPER in scripts/prerender.mjs uebereinstimmen.
 */
const OHNE_KOERPER = new Set(['/experience'])

const routen = []
for (const route of STATIC_ROUTES) {
  const head = staticRouteHead(route)
  routen.push({
    pfad: route.path,
    head,
    inSitemap: route.inSitemap !== false && !route.noindex,
    art: 'statisch',
  })
}
for (const artikel of journalArticles) {
  const head = journalArticleHead(artikel)
  routen.push({ pfad: head.canonicalPath, head, inSitemap: true, art: 'journal' })
}
const merchSeiten = [
  ...MERCH_FAMILIES.map((f) => ({
    name: f.label,
    tagline: f.tagline || f.products?.[0]?.tagline || '',
    slug: f.slug,
    image: f.image || f.products?.[0]?.image,
  })),
  ...MERCH_PRODUCTS.map((p) => ({ name: p.name, tagline: p.tagline || '', slug: p.slug, image: p.image })),
]
const gesehen = new Set()
for (const seite of merchSeiten) {
  if (!seite.slug || gesehen.has(seite.slug)) continue
  gesehen.add(seite.slug)
  const head = merchDetailHead(seite)
  routen.push({ pfad: head.canonicalPath, head, inSitemap: true, art: 'merch' })
}

/* ------------------------------------------------------------------ */
/* Server: dieselbe Aufloesung wie Vercel                              */
/* ------------------------------------------------------------------ */

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
}

function loese(pfad) {
  const rein = decodeURIComponent(pfad.split('?')[0])
  if (rein.includes('..')) return null
  const direkt = path.join(DIST, rein)
  if (fs.existsSync(direkt) && fs.statSync(direkt).isFile()) return direkt
  const index = path.join(direkt, 'index.html')
  if (fs.existsSync(index)) return index
  return null
}

const server = http.createServer((req, res) => {
  const datei = loese(req.url)
  if (datei) {
    res.writeHead(200, { 'content-type': TYPEN[path.extname(datei)] || 'application/octet-stream' })
    res.end(fs.readFileSync(datei))
    return
  }
  const not = path.join(DIST, '404.html')
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
  res.end(fs.existsSync(not) ? fs.readFileSync(not) : 'not found')
})

const port = await new Promise((r) => server.listen(0, '127.0.0.1', () => r(server.address().port)))
const basis = `http://127.0.0.1:${port}`

/* ------------------------------------------------------------------ */
/* Pruefungen                                                          */
/* ------------------------------------------------------------------ */

const sitemapXml = fs.existsSync(path.join(DIST, 'sitemap.xml'))
  ? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8')
  : ''

const WURZEL_RE = /<div id="root">([\s\S]*?)<\/div>\s*<\/body>/

/** Der Kopf wird escaped geschrieben — zum Vergleich zurueckverwandeln. */
const entschaerft = (s) => String(s)
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
const TAGS_RAUS = /<(script|style|template)[^>]*>[\s\S]*?<\/\1>|<[^>]+>/g

const ergebnisse = []

for (const r of routen) {
  const soll = r.head
  const url = basis + r.pfad
  const res = await fetch(url, { redirect: 'manual' })
  const html = await res.text()
  const f = []   // blockierend: das Prerendering stimmt nicht
  const w = []   // Hinweis: Datenluecke, unabhaengig vom Prerendering

  // 1 Datei vorhanden
  const relativ = r.pfad === '/' ? 'index.html' : path.join(r.pfad.slice(1), 'index.html')
  if (!fs.existsSync(path.join(DIST, relativ))) f.push('Datei fehlt')

  // 2 HTTP-Status
  if (res.status !== 200) f.push(`Status ${res.status}`)

  // 3/4 Body ist mehr als das leere #root
  const wurzel = (html.match(WURZEL_RE) || [])[1] ?? null
  const sollKoerper = !OHNE_KOERPER.has(r.pfad)
  const hatKoerper = !!wurzel && wurzel.trim().length > 0
  if (sollKoerper && !hatKoerper) f.push('#root leer')

  // 6 sichtbarer Text
  const text = (wurzel || '').replace(TAGS_RAUS, ' ').replace(/\s+/g, ' ').trim()
  if (sollKoerper && text.length < 200) f.push(`nur ${text.length} Zeichen Text`)

  // 5 H1
  const h1 = ((wurzel || '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]
  const h1Text = h1 ? h1.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : ''
  if (sollKoerper && !h1Text) f.push('kein H1')

  // 7 interne Links
  const links = [...(wurzel || '').matchAll(/<a\b[^>]*href="(\/[^"]*)"/g)].map((m) => m[1])
  if (sollKoerper && links.length === 0) f.push('keine internen Links')

  // 8 Titel
  const title = entschaerft((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim()
  if (title !== (soll.title || '').trim()) f.push(`Titel abweichend: "${title}"`)

  // 9 Description
  // Fehlt das Tag ganz, ist der Kopf kaputt. Steht es leer da, fehlt in den
  // Quelldaten der Text (src/data/head.js zieht ihn dort direkt durch) — das
  // ist eine Inhaltsluecke, kein Prerender-Fehler.
  const descTag = html.match(/<meta name="description" content="([^"]*)"/)
  const desc = descTag ? descTag[1] : null
  if (desc === null) f.push('description-Tag fehlt')
  else if (!desc.trim()) w.push('Description leer (fehlt in den Quelldaten)')

  // 10 Canonical
  const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || ''
  const canonSoll = absUrl(soll.canonicalPath || r.pfad)
  if (canon !== canonSoll) f.push(`Canonical ${canon || '—'}`)

  // 11 kein unbeabsichtigtes noindex
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || ''
  const noindex = /noindex/.test(robots)
  if (noindex !== !!soll.noindex) f.push(noindex ? 'unerwartetes noindex' : 'noindex fehlt')

  // 12 JSON-LD
  const ld = (html.match(/<script type="application\/ld\+json"/g) || []).length
  const ldSoll = (soll.jsonLd || []).length
  if (ld < ldSoll) f.push(`JSON-LD ${ld}/${ldSoll}`)

  // 13 Sitemap
  const inSitemap = sitemapXml.includes(`<loc>${canonSoll}</loc>`)
  if (r.inSitemap && !inSitemap) f.push('fehlt in sitemap.xml')
  if (!r.inSitemap && inSitemap) f.push('faelschlich in sitemap.xml')

  ergebnisse.push({
    pfad: r.pfad, art: r.art, status: res.status, bytes: html.length,
    koerper: hatKoerper, textLen: text.length, h1: h1Text, links, ld, sollKoerper,
    fehler: f, hinweise: w,
  })
}

/* 404-Verhalten fuer unbekannte Pfade */
const unbekannt = []
for (const p of ['/gibt-es-nicht', '/journal/gibt-es-nicht', '/merch/gibt-es-nicht']) {
  const res = await fetch(basis + p)
  const html = await res.text()
  unbekannt.push({ p, status: res.status, noindex: /noindex/.test(html), koerper: WURZEL_RE.test(html) })
}

server.close()
raeumeTmp()

/* ------------------------------------------------------------------ */
/* Ausgabe                                                             */
/* ------------------------------------------------------------------ */

const ja = (b) => (b ? 'ja' : 'nein')

console.log('| Route | HTML Body | Text | H1 | Links | Hydrierbar | Status |')
console.log('| --- | --- | --- | --- | --- | --- | --- |')
for (const e of ergebnisse) {
  const status = e.fehler.length
    ? `FEHLER: ${e.fehler.join('; ')}`
    : e.hinweise.length
      ? `ok · Hinweis: ${e.hinweise.join('; ')}`
      : (e.sollKoerper ? 'ok' : 'ok (bewusst nur Kopf)')
  const body = e.sollKoerper ? ja(e.koerper) : 'bewusst nein'
  const h1 = e.h1 ? 'ja' : (e.sollKoerper ? 'nein' : '—')
  console.log(`| ${e.pfad} | ${body} | ${e.textLen} | ${h1} | ${e.links.length} | ${e.sollKoerper ? ja(e.koerper) : '—'} | ${status} |`)
}

const kaputt = ergebnisse.filter((e) => e.fehler.length)
const hinweise = ergebnisse.filter((e) => e.hinweise.length)
console.log('')
console.log(`Geprueft: ${ergebnisse.length} Routen · in Ordnung: ${ergebnisse.length - kaputt.length} · beanstandet: ${kaputt.length}`)
console.log(`Mit gerendertem Body: ${ergebnisse.filter((e) => e.koerper).length} · bewusst nur Kopf: ${[...OHNE_KOERPER].join(', ')}`)
if (hinweise.length) {
  console.log(`Hinweise (keine Prerender-Fehler): ${hinweise.length}`)
  for (const h of hinweise) console.log(`   ${h.pfad}: ${h.hinweise.join('; ')}`)
}
for (const u of unbekannt) {
  console.log(`404-Test ${u.p}: HTTP ${u.status}${u.status === 404 ? '' : '  ← erwartet 404'}, noindex ${ja(u.noindex)}, Body ${ja(u.koerper)}`)
}

if (kaputt.length) process.exit(1)
