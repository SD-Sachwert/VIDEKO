/**
 * Schreibt Bild-Referenzen im Quellcode von .png/.jpg auf .webp um —
 * aber ausschliesslich dort, wo scripts/optimize-images.mjs tatsaechlich eine
 * WebP-Datei erzeugt hat.
 *
 * Einmalige Migration, idempotent: ein zweiter Lauf findet nichts mehr.
 * Aufruf:  node scripts/rewrite-image-imports.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { listSourceFiles, ROOT } from './lib/image-refs.mjs'

const DRY = process.argv.includes('--dry')

let changedFiles = 0
let changedRefs = 0
const misses = []

for (const file of listSourceFiles()) {
  const code = fs.readFileSync(file, 'utf8')
  const dir = path.dirname(file)

  const next = code.replace(/(['"])(\.{1,2}\/[^'"]+?)\.(png|jpe?g)\1/gi, (full, q, base) => {
    const abs = path.resolve(dir, base + '.webp')
    if (!fs.existsSync(abs)) {
      misses.push(`${path.relative(ROOT, file)} -> ${base}`)
      return full
    }
    changedRefs++
    return `${q}${base}.webp${q}`
  })

  if (next !== code) {
    changedFiles++
    if (!DRY) fs.writeFileSync(file, next)
  }
}

console.log(`${DRY ? '[dry-run] ' : ''}${changedRefs} Referenzen in ${changedFiles} Dateien umgeschrieben.`)
if (misses.length) {
  console.log(`\n${misses.length} Referenz(en) ohne WebP-Pendant (unveraendert gelassen):`)
  misses.forEach((m) => console.log('  -', m))
}
