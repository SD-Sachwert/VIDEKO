/**
 * Sammelt alle Bild-Assets, die aus dem Quellcode heraus tatsächlich
 * referenziert werden (statische ES-Imports).
 *
 * Grundlage für scripts/optimize-images.mjs: es wird nur konvertiert, was
 * auch wirklich ausgeliefert wird — nicht der komplette Asset-Ordner.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const SRC = path.join(ROOT, 'src')

const CODE_RE = /\.(jsx?|tsx?|mjs|css)$/
const IMG_RE = /\.(png|jpe?g)$/i

/** Alle Quellcode-Dateien unter src/ */
export function listSourceFiles(dir = SRC, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'assets') continue
      listSourceFiles(p, out)
    } else if (CODE_RE.test(e.name)) {
      out.push(p)
    }
  }
  return out
}

/**
 * Liefert eine Map: absoluter Bildpfad -> Set der Dateien, die ihn importieren.
 * Erfasst `import x from '…png'` ebenso wie `new URL('…png', import.meta.url)`.
 */
export function collectImageRefs() {
  const refs = new Map()
  const files = listSourceFiles()

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8')
    const dir = path.dirname(file)
    // beide Quote-Varianten, Import wie auch new URL(...)
    for (const m of code.matchAll(/['"](\.{1,2}\/[^'"]+?\.(?:png|jpe?g))['"]/gi)) {
      const rel = m[1]
      const abs = path.resolve(dir, rel)
      if (!fs.existsSync(abs)) continue
      if (!refs.has(abs)) refs.set(abs, new Set())
      refs.get(abs).add(file)
    }
  }
  return refs
}

export { IMG_RE }
