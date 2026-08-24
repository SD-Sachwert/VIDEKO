/**
 * Gemeinsamer Unterbau fuer scripts/prerender.mjs und scripts/pruefe-ssg.mjs.
 *
 * Beide brauchen dieselben Routendaten wie die laufende App (src/data/*).
 * Diese Module nutzen `import.meta.glob` und importieren Bilder, lassen sich
 * also nicht direkt mit Node laden. Deshalb baut dieses Modul sie einmal als
 * SSR-Bundle mit Vite — zusammen mit src/entry-server.jsx, das die App fuer
 * das Body-Rendering bereitstellt.
 *
 * Es liegt bewusst getrennt, damit Prerender und Abnahmepruefung garantiert
 * dieselbe Datenbasis sehen. Zwei Kopien wuerden auseinanderlaufen und die
 * Pruefung wertlos machen.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DIST = path.join(ROOT, 'dist')
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
export const MANIFEST = JSON.parse(fs.readFileSync(manifestPfad, 'utf8'))

/** Fallback ueber den Basename, falls ein Asset nicht im Manifest steht. */
const NACH_BASENAME = new Map()
for (const [key, eintrag] of Object.entries(MANIFEST)) {
  if (!eintrag.file) continue
  NACH_BASENAME.set(path.posix.basename(key), `/${eintrag.file}`)
}

/** Assets, zu denen kein Manifest-Eintrag gefunden wurde (Warnung am Ende). */
export const fehlendeAssets = new Set()

/** Vite-Standard: alles darunter wird als data:-URI ins Bundle inlined. */
const INLINE_LIMIT = 4096
const MIME = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.avif': 'image/avif', '.svg': 'image/svg+xml',
}

export function assetUrl(absPfad) {
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

/**
 * Baut beide Node-Entries in einem Durchgang:
 *   `_prerender-data` — Metadaten, Routenliste, Bildvarianten
 *   `entry-server`    — die React-App selbst, fuer das Body-Rendering
 *
 * Der React-Plugin ist noetig, seit hier auch .jsx-Dateien durchlaufen; ohne
 * ihn scheitert der Build an der ersten JSX-Zeile. `configFile: false` bleibt,
 * damit dieser Build nicht versehentlich die Client-Optionen aus
 * vite.config.js erbt.
 */
export async function ladeModule() {
  await build({
    configFile: false,
    root: ROOT,
    logLevel: 'error',
    plugins: [assetStubPlugin, react()],
    build: {
      ssr: true,
      outDir: path.relative(ROOT, TMP),
      emptyOutDir: true,
      minify: false,
      rollupOptions: {
        input: {
          '_prerender-data': path.join(ROOT, 'scripts', '_prerender-data.js'),
          'entry-server': path.join(ROOT, 'src', 'entry-server.jsx'),
        },
      },
    },
  })
  const laden = (name) => import(pathToFileURL(path.join(TMP, `${name}.js`)).href)
  return { daten: await laden('_prerender-data'), server: await laden('entry-server') }
}
/** Das temporaere SSR-Bundle wieder entfernen. */
export function raeumeTmp() {
  fs.rmSync(TMP, { recursive: true, force: true })
}
