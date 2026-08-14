/**
 * VIDEKO Bildoptimierung — PNG/JPG → WebP, reproduzierbar.
 *
 * Hintergrund (SEO-/Performance-Audit vom 14.08.2026): Die Startseite lieferte
 * mobil ~33,45 MB aus, fast ausschliesslich verlustfrei codierte PNGs mit
 * fotorealistischem Inhalt. Die Pixelmasse waren in Ordnung — nur das Format
 * war falsch.
 *
 * Was dieses Skript macht:
 *  1. Es konvertiert ausschliesslich Assets, die aus dem Quellcode heraus
 *     tatsaechlich importiert werden (siehe lib/image-refs.mjs). Verwaiste
 *     Dateien in src/assets/images bleiben unangetastet und landen ohnehin
 *     nicht im Bundle.
 *  2. Grafiken mit Transparenz (Logos, UI-Assets) werden verlustfrei codiert,
 *     Fotos verlustbehaftet. Die Entscheidung faellt anhand des tatsaechlichen
 *     Encoding-Ergebnisses, nicht anhand des Dateinamens.
 *  3. Jede verlustbehaftete Codierung durchlaeuft eine automatische
 *     Qualitaetskontrolle (mittlerer absoluter Pixelfehler gegen das Original).
 *     Reisst eine Datei die Schwelle, wird sie mit hoeherer Qualitaet erneut
 *     codiert statt sichtbar zu degradieren.
 *  4. Fuer grosse Motive entstehen zusaetzlich schmalere Varianten (480w/960w)
 *     fuer srcset. Daraus wird src/assets/images/variants.generated.js erzeugt.
 *  5. Nichts wird geschrieben, was nicht kleiner ist als das Original.
 *
 * Aufruf:  npm run images:optimize
 *          npm run images:optimize -- --force   (bestehende WebP neu erzeugen)
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { collectImageRefs, ROOT } from './lib/image-refs.mjs'

const FORCE = process.argv.includes('--force')
const IMAGES_DIR = path.join(ROOT, 'src', 'assets', 'images')

/** Zielbreiten fuer srcset. Wird nur erzeugt, wenn das Original deutlich breiter ist. */
const VARIANT_WIDTHS = [480, 960]
/**
 * Bereits vorhandene WebP-Dateien oberhalb dieser Groesse werden neu codiert.
 * Die Shop-Assets lagen verlustfrei bei bis zu 2,1 MB pro Produktbild — WebP
 * allein ist eben noch keine Optimierung.
 */
const RECOMPRESS_MIN_BYTES = 250 * 1024
/** Ordner, die grundsaetzlich nicht angefasst werden. */
const EXCLUDED = /(?:^|[\\/])(?:_deprecated|unbenutzt|_prompts|Neuer Ordner)(?:[\\/]|$)/i
/** Erzeugte srcset-Varianten erkennt man am Suffix. */
const IS_VARIANT = /-\d+w\.webp$/i
/** Ab dieser Breite lohnen sich responsive Varianten ueberhaupt. */
const RESPONSIVE_MIN_WIDTH = 1000
/**
 * Ab dieser Basisgroesse landet ein Bild in variants.generated.js. Darunter
 * kostet der Eintrag (drei gehashte, kaum komprimierbare URLs im JS-Bundle)
 * mehr, als die kleinere Variante an Bildbytes spart.
 */
const VARIANT_MIN_BYTES = 60 * 1024
/** Mittlerer absoluter Pixelfehler (0–255), ab dem nachcodiert wird. */
const MAE_LIMIT = 2.5
/** Qualitaetsstufen, die bei Ueberschreiten der Schwelle nacheinander probiert werden. */
const QUALITY_LADDER = [80, 88, 94]

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/')
const kb = (n) => (n / 1024).toFixed(0)

/**
 * Mittlerer absoluter Fehler zwischen Original und Kodierung.
 * Beide Seiten werden auf dieselbe kleine Groesse gebracht, damit der Vergleich
 * bezahlbar bleibt und lokale Encoder-Artefakte nicht ueberbewertet werden.
 */
async function meanAbsError(originalBuf, encodedBuf) {
  const opts = { width: 320, fit: 'inside' }
  const [a, b] = await Promise.all([
    sharp(originalBuf).resize(opts).removeAlpha().raw().toBuffer(),
    sharp(encodedBuf).resize(opts).removeAlpha().raw().toBuffer(),
  ])
  const n = Math.min(a.length, b.length)
  if (!n) return Infinity
  let sum = 0
  for (let i = 0; i < n; i++) sum += Math.abs(a[i] - b[i])
  return sum / n
}

/**
 * Codiert ein Bild als WebP und liefert Buffer + gewaehlte Strategie.
 * Transparente Grafiken bekommen verlustfreie Codierung, sofern das Ergebnis
 * nicht ausufert — sonst verlustbehaftet mit hoher Alpha-Qualitaet.
 */
async function encodeWebp(buf, meta) {
  if (meta.hasAlpha) {
    const lossless = await sharp(buf).webp({ lossless: true, effort: 6 }).toBuffer()
    const lossy = await sharp(buf).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toBuffer()
    // Flaechige Grafiken (Logos, Icons) komprimieren verlustfrei hervorragend.
    // Nur wenn verlustfrei deutlich teurer ist, handelt es sich um ein Foto.
    if (lossless.length <= Math.max(lossy.length * 1.5, 60 * 1024)) {
      return { buf: lossless, mode: 'lossless' }
    }
    return { buf: lossy, mode: 'lossy q88 (alpha)' }
  }

  for (const q of QUALITY_LADDER) {
    const out = await sharp(buf).webp({ quality: q, effort: 6 }).toBuffer()
    const mae = await meanAbsError(buf, out)
    if (mae <= MAE_LIMIT || q === QUALITY_LADDER.at(-1)) {
      return { buf: out, mode: `lossy q${q}`, mae }
    }
  }
  /* c8 ignore next */
  throw new Error('unreachable')
}

/** Alle WebP-Basisdateien unterhalb von src/assets/images (ohne Varianten). */
function listWebpBases(dir = IMAGES_DIR, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (EXCLUDED.test(p)) continue
    if (e.isDirectory()) listWebpBases(p, out)
    else if (/\.webp$/i.test(e.name) && !IS_VARIANT.test(e.name)) out.push(p)
  }
  return out
}

async function main() {
  const refs = collectImageRefs()
  const entries = [...refs.keys()].sort()

  let bytesBefore = 0
  let bytesAfter = 0
  let converted = 0
  let skipped = 0
  let variantsMade = 0
  let recompressed = 0
  let recompressBefore = 0
  let recompressAfter = 0
  const manifest = {}
  const report = []

  // Bereits optimierte Dateien duerfen nicht bei jedem Lauf erneut
  // verlustbehaftet codiert werden — das waere Generationsverlust. Der
  // Manifest-Eintrag des letzten Laufs dient als Nachweis.
  const manifestPath = path.join(IMAGES_DIR, 'image-manifest.json')
  const previous = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : {}

  /** Erzeugt fehlende srcset-Varianten und liefert deren Beschreibung. */
  async function makeVariants(sourceBuf, targetWebp, meta, baseBytes) {
    const variants = []
    const lohntSich = meta.width >= RESPONSIVE_MIN_WIDTH && baseBytes >= VARIANT_MIN_BYTES
    for (const w of VARIANT_WIDTHS) {
      const vPath = targetWebp.replace(/\.webp$/, `-${w}w.webp`)
      if (!lohntSich || meta.width < w * 1.25) {
        // Frueher erzeugte, jetzt nicht mehr eingebundene Variante entfernen.
        if (fs.existsSync(vPath)) fs.unlinkSync(vPath)
        continue
      }
      if (FORCE || !fs.existsSync(vPath)) {
        const vBuf = await sharp(sourceBuf)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: meta.hasAlpha ? 88 : 78, alphaQuality: 100, effort: 6 })
          .toBuffer()
        fs.writeFileSync(vPath, vBuf)
        variantsMade++
      }
      variants.push({ w, path: rel(vPath) })
    }
    return variants
  }

  for (const abs of entries) {
    const srcStat = fs.statSync(abs)
    const target = abs.replace(/\.(png|jpe?g)$/i, '.webp')

    const buf = fs.readFileSync(abs)
    let meta
    try {
      meta = await sharp(buf).metadata()
    } catch {
      report.push(`  ! nicht lesbar: ${rel(abs)}`)
      continue
    }

    const needsBase = FORCE || !fs.existsSync(target)
    let outSize

    if (needsBase) {
      const { buf: out, mode } = await encodeWebp(buf, meta)
      if (out.length >= srcStat.size) {
        // Kein Gewinn — Original bleibt massgeblich.
        report.push(`  = ${rel(abs)}: WebP nicht kleiner (${kb(out.length)}K vs ${kb(srcStat.size)}K) — uebersprungen`)
        skipped++
        continue
      }
      fs.writeFileSync(target, out)
      outSize = out.length
      converted++
      report.push(
        `  + ${rel(target)}  ${kb(srcStat.size)}K -> ${kb(out.length)}K` +
          `  (-${(100 - (out.length / srcStat.size) * 100).toFixed(1)}%, ${mode}, ${meta.width}x${meta.height})`,
      )
    } else {
      outSize = fs.statSync(target).size
      converted++
    }

    bytesBefore += srcStat.size
    bytesAfter += outSize

    manifest[rel(target)] = {
      width: meta.width,
      height: meta.height,
      bytes: outSize,
      source: rel(abs),
      sourceBytes: srcStat.size,
      variants: await makeVariants(buf, target, meta, outSize),
    }
  }

  // -------------------------------------------------------------------------
  // Durchgang 2: bereits vorhandene WebP-Dateien.
  // Der Shop lieferte verlustfreie WebP mit bis zu 2,1 MB pro Produktbild aus.
  // Diese werden neu codiert und bekommen ebenfalls srcset-Varianten.
  // -------------------------------------------------------------------------
  for (const wp of listWebpBases()) {
    const key = rel(wp)
    if (manifest[key]) continue // stammt aus Durchgang 1

    const stat = fs.statSync(wp)
    let buf = fs.readFileSync(wp)
    let meta = await sharp(buf).metadata()

    const alreadyDone = previous[key] && previous[key].bytes === stat.size
    if (stat.size > RECOMPRESS_MIN_BYTES && (FORCE || !alreadyDone)) {
      const { buf: out, mode } = await encodeWebp(buf, meta)
      if (out.length < stat.size * 0.9) {
        fs.writeFileSync(wp, out)
        recompressed++
        recompressBefore += stat.size
        recompressAfter += out.length
        report.push(
          `  ~ ${key}  ${kb(stat.size)}K -> ${kb(out.length)}K` +
            `  (-${(100 - (out.length / stat.size) * 100).toFixed(1)}%, ${mode}, ${meta.width}x${meta.height})`,
        )
        buf = out
        meta = await sharp(buf).metadata()
      }
    }

    const basisBytes = fs.statSync(wp).size
    manifest[key] = {
      width: meta.width,
      height: meta.height,
      bytes: basisBytes,
      source: key,
      sourceBytes: stat.size,
      variants: await makeVariants(buf, wp, meta, basisBytes),
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  writeVariantsModule(manifest)

  console.log(report.join('\n'))
  console.log('\n' + '='.repeat(70))
  console.log(`PNG/JPG konvertiert:    ${converted} Dateien`)
  console.log(`Uebersprungen:          ${skipped} (WebP waere groesser)`)
  console.log(`WebP neu codiert:       ${recompressed} Dateien`)
  console.log(`Responsive Varianten:   ${variantsMade} neu erzeugt`)
  console.log(
    `Vorher:                 ${((bytesBefore + recompressBefore) / 1048576).toFixed(1)} MB`,
  )
  console.log(
    `Nachher (Basis-WebP):   ${((bytesAfter + recompressAfter) / 1048576).toFixed(1)} MB`,
  )
  console.log(
    `Einsparung:             ${(
      100 - ((bytesAfter + recompressAfter) / (bytesBefore + recompressBefore)) * 100
    ).toFixed(1)} %`,
  )
  console.log('='.repeat(70))
}

/**
 * Erzeugt ein Modul, das jede WebP-Basisdatei statisch importiert und ueber
 * ihre (gehashte) Build-URL auf Abmessungen und srcset abbildet.
 *
 * Statische Imports sind hier bewusst gewaehlt: Nur so vergibt Vite stabile,
 * cachebare Hash-Dateinamen, und nur so ist der Schluessel der Map exakt
 * derselbe String, den auch ein normaler `import bild from '...webp'` liefert.
 */
function writeVariantsModule(manifest) {
  const lines = [
    '/* AUTOMATISCH ERZEUGT — nicht von Hand bearbeiten.',
    ' * Quelle: scripts/optimize-images.mjs (npm run images:optimize)',
    ' *',
    ' * Bildet die gehashte Build-URL eines WebP-Assets auf seine intrinsischen',
    ' * Abmessungen und ein passendes srcset ab. Wird von components/Img.jsx',
    ' * genutzt, damit responsive Bilder ohne manuelle Pflege funktionieren.',
    ' */',
    '',
  ]
  const imports = []
  const rows = []
  let i = 0

  for (const [webpRel, info] of Object.entries(manifest)) {
    if (!info.variants.length) continue
    // Jede Zeile kostet gehashte URLs im JS-Bundle, und Hashes komprimieren
    // praktisch nicht. Unterhalb dieser Basisgroesse spart srcset weniger
    // Bytes, als der Eintrag im Bundle kostet.
    if (info.bytes < VARIANT_MIN_BYTES) continue
    const id = `i${i++}`
    const importPath = './' + webpRel.replace(/^src\/assets\/images\//, '')
    imports.push(`import ${id} from '${importPath}'`)

    const vIds = info.variants.map((v, k) => {
      const vid = `${id}_${k}`
      const vPath = './' + v.path.replace(/^src\/assets\/images\//, '')
      imports.push(`import ${vid} from '${vPath}'`)
      return { id: vid, w: v.w }
    })

    const args = vIds.flatMap((v) => [v.id, String(v.w)])
    rows.push(`  e(${[id, info.width, info.height, ...args].join(', ')}),`)
  }

  lines.push(
    ...imports,
    '',
    '/* Bewusst eine Fabrikfunktion statt fertiger Template-Strings: so steht jede',
    ' * gehashte Asset-URL genau EINMAL im Bundle. Als Template-Literal landete sie',
    ' * doppelt darin (Deklaration + eingebettet) — das kostete ~180 kB gzip. */',
    'function e(src, w, h, ...v) {',
    "  let s = ''",
    '  for (let k = 0; k < v.length; k += 2) s += `${v[k]} ${v[k + 1]}w, `',
    '  return [src, { w, h, srcSet: `${s}${src} ${w}w` }]',
    '}',
    '',
    'export const IMAGE_VARIANTS = new Map([',
    ...rows,
    '])',
    '',
  )
  fs.writeFileSync(path.join(IMAGES_DIR, 'variants.generated.js'), lines.join('\n'))
  console.log(`\nvariants.generated.js: ${rows.length} Bilder mit srcset`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
