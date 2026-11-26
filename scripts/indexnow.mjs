// IndexNow: meldet geaenderte URLs an Bing, Yandex, Seznam, Naver
// (Google nutzt IndexNow nicht – dort gilt die Sitemap in der Search Console).
//
// Aufruf:  node scripts/indexnow.mjs            -> URLs mit lastmod von heute
//          node scripts/indexnow.mjs 2026-11-01 -> URLs mit lastmod ab Datum
//          node scripts/indexnow.mjs alle       -> alle Sitemap-URLs
//          DRY=1 node scripts/indexnow.mjs ...  -> nur anzeigen, nichts senden
//
// Liest die LIVE-Sitemap, also erst nach dem Deploy ausfuehren.
// Der Schluessel ist kein Geheimnis: IndexNow verlangt, dass er oeffentlich
// unter https://<host>/<key>.txt liegt (siehe public/).
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HOST = 'videko-kuechen.de'
const ORIGIN = `https://${HOST}`
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const keyFile = readdirSync(PUBLIC).find((n) => /^[a-f0-9]{32}\.txt$/.test(n))
if (!keyFile) {
  console.error('IndexNow: keine Schluesseldatei (32 Hex-Zeichen .txt) in public/ gefunden.')
  process.exit(1)
}
const key = readFileSync(join(PUBLIC, keyFile), 'utf8').trim()

const arg = process.argv[2] || new Date().toISOString().slice(0, 10)
const alle = arg === 'alle'
if (!alle && !/^\d{4}-\d{2}-\d{2}$/.test(arg)) {
  console.error(`IndexNow: unbekanntes Argument "${arg}" (erwartet JJJJ-MM-TT oder "alle").`)
  process.exit(1)
}

// Schluessel muss live erreichbar sein, sonst lehnt IndexNow ab (403).
const keyRes = await fetch(`${ORIGIN}/${keyFile}`)
if (!keyRes.ok || (await keyRes.text()).trim() !== key) {
  console.error(`IndexNow: ${ORIGIN}/${keyFile} liefert ${keyRes.status} oder falschen Inhalt – erst deployen.`)
  process.exit(1)
}

const xml = await (await fetch(`${ORIGIN}/sitemap.xml`)).text()
const eintraege = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: m[1].match(/<loc>([^<]+)<\/loc>/)?.[1],
  lastmod: m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
}))
const urls = eintraege
  .filter((e) => e.loc && (alle || (e.lastmod && e.lastmod.slice(0, 10) >= arg)))
  .map((e) => e.loc)

console.log(`IndexNow: ${urls.length} von ${eintraege.length} Sitemap-URLs ${alle ? '(alle)' : `mit lastmod >= ${arg}`}`)
for (const u of urls) console.log('  ' + u)
if (urls.length === 0) process.exit(0)
if (process.env.DRY) {
  console.log('IndexNow: DRY – nichts gesendet.')
  process.exit(0)
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${ORIGIN}/${keyFile}`, urlList: urls }),
})
// 200 = angenommen, 202 = angenommen, Schluesselpruefung laeuft noch
console.log(`IndexNow: Antwort ${res.status} ${res.statusText}`)
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text())
  process.exit(1)
}
