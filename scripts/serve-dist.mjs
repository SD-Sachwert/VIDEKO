/**
 * Minimaler statischer Server ueber dist/ — bewusst OHNE SPA-Fallback.
 *
 * Bildet nach, was Vercel nach dem Entfernen des Catch-all-Rewrites tut:
 * Dateisystem-Treffer -> 200, sonst dist/404.html mit HTTP 404. Damit laesst
 * sich lokal pruefen, was ein Crawler ohne JavaScript wirklich sieht.
 *
 *   node scripts/serve-dist.mjs 4173
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.argv[2] || 4173)

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
}

http.createServer((req, res) => {
  const pfad = decodeURIComponent(req.url.split('?')[0])
  const kandidaten = [
    path.join(DIST, pfad),
    path.join(DIST, pfad, 'index.html'),
    path.join(DIST, `${pfad}.html`),
  ]
  for (const k of kandidaten) {
    if (!k.startsWith(DIST)) break
    if (fs.existsSync(k) && fs.statSync(k).isFile()) {
      res.writeHead(200, { 'content-type': TYPEN[path.extname(k)] || 'application/octet-stream' })
      return res.end(fs.readFileSync(k))
    }
  }
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
  res.end(fs.readFileSync(path.join(DIST, '404.html')))
}).listen(PORT, () => console.log(`dist/ auf http://localhost:${PORT} (ohne SPA-Fallback)`))
