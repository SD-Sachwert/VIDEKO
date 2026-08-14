/**
 * Re-Encoding der Hintergrundvideos.
 *
 * AUSGANGSLAGE (Audit vom 14.08.2026)
 * -----------------------------------
 * Fuenf MP4s mit zusammen ~98 MB liegen im Production-Bundle. Header.mp4 kam
 * mit 1920x1080 bei 60 fps und 26,5 Mbit/s — Masterqualitaet, nicht Web. Dazu
 * trug jede Datei eine AAC-Tonspur, obwohl saemtliche <video>-Elemente `muted`
 * sind. Die Tonspur wird also nie abgespielt und ist reiner Ballast.
 *
 * VORGEHEN
 * --------
 * Konservativ statt maximal: H.264 High bleibt (universell abspielbar), die
 * Aufloesung bleibt bei 1080p, nur Bitrate und Framerate werden auf ein
 * web-uebliches Mass gebracht und die Tonspur entfaellt. `+faststart` schiebt
 * den Index an den Dateianfang, damit die Wiedergabe beginnt, bevor die Datei
 * komplett geladen ist.
 *
 * CRF 24 bei `preset slow` ist fuer flaechige Kuechenaufnahmen visuell
 * unauffaellig. 60 fps braucht ein langsamer Kameraschwenk nicht; 30 fps halbiert
 * die Datenmenge, ohne dass die Bewegung ruckelt.
 *
 * Die Dateien werden an Ort und Stelle ersetzt, damit kein Import angefasst
 * werden muss. Die Originale liegen in der Git-Historie — bei Zweifeln an der
 * Qualitaet ist ein `git checkout` der Weg zurueck.
 *
 * Aufruf:
 *   node scripts/optimize-videos.mjs            nur noch nicht bearbeitete
 *   node scripts/optimize-videos.mjs --force    alles neu (Achtung: Generationsverlust)
 *   node scripts/optimize-videos.mjs --dry      nur anzeigen
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import ffmpegPath from 'ffmpeg-static'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = path.join(ROOT, 'src', 'assets')
const MANIFEST = path.join(ROOT, 'scripts', '.video-manifest.json')

const FORCE = process.argv.includes('--force')
const DRY = process.argv.includes('--dry')

/** Zielwerte. Bewusst konservativ — das Nutzererlebnis geht vor Punktestand. */
const CRF = 24
const MAX_FPS = 30
const MAX_HEIGHT = 1080

const mb = (b) => `${(b / 1024 / 1024).toFixed(2)} MB`

function sammle(dir, treffer = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) sammle(p, treffer)
    else if (e.name.toLowerCase().endsWith('.mp4')) treffer.push(p)
  }
  return treffer
}

/**
 * Nur Videos anfassen, die auch importiert werden. Alles andere landet gar
 * nicht erst im Bundle — es neu zu kodieren, aendert nur unnoetig Dateien.
 */
function referenzierteNamen() {
  const namen = new Set()
  const scan = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name !== 'assets' && e.name !== 'node_modules') scan(p)
        continue
      }
      if (!/\.(jsx?|tsx?|css)$/.test(e.name)) continue
      for (const m of fs.readFileSync(p, 'utf8').matchAll(/([\w .()-]+\.mp4)/g)) {
        namen.add(path.posix.basename(m[1]).toLowerCase())
      }
    }
  }
  scan(path.join(ROOT, 'src'))
  return namen
}

const vorher = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {}
const nachher = {}

const referenziert = referenzierteNamen()
const alle = sammle(ASSETS).sort()
const dateien = alle.filter((d) => referenziert.has(path.basename(d).toLowerCase()))
const uebersprungen = alle.length - dateien.length
let summeVor = 0
let summeNach = 0
let bearbeitet = 0

for (const datei of dateien) {
  const rel = path.relative(ROOT, datei).split(path.sep).join('/')
  const groesse = fs.statSync(datei).size
  summeVor += groesse

  // Schon einmal durchgelaufen und seitdem unveraendert? Ein zweiter Durchlauf
  // wuerde nur Qualitaet kosten.
  const erledigt = vorher[rel]?.bytes === groesse
  if (!FORCE && erledigt) {
    nachher[rel] = vorher[rel]
    summeNach += groesse
    console.log(`·  ${rel} — bereits optimiert (${mb(groesse)})`)
    continue
  }

  const tmp = `${datei}.tmp.mp4`
  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', datei,
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', String(CRF),
    // Nie hochskalieren, nie ueber 1080p, gerade Kantenlaengen fuer yuv420p.
    '-vf', `scale=-2:'min(${MAX_HEIGHT},ih)':flags=lanczos,fps='min(${MAX_FPS},source_fps)'`,
    '-pix_fmt', 'yuv420p',
    // Alle <video> sind muted — die Tonspur wird nie gebraucht.
    '-an',
    '-movflags', '+faststart',
    tmp,
  ]

  if (DRY) {
    console.log(`?  ${rel} — ${mb(groesse)} (dry run)`)
    nachher[rel] = { bytes: groesse }
    summeNach += groesse
    continue
  }

  console.log(`→  ${rel} — ${mb(groesse)} …`)
  execFileSync(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'inherit'] })

  const neu = fs.statSync(tmp).size
  if (neu >= groesse) {
    // Groesser geworden: Original behalten, aber im Manifest vermerken, damit
    // der naechste Lauf nicht wieder rechnet.
    fs.unlinkSync(tmp)
    nachher[rel] = { bytes: groesse, note: 'Original war bereits kleiner' }
    summeNach += groesse
    console.log(`   behalten — Neukodierung waere groesser (${mb(neu)})`)
    continue
  }

  fs.rmSync(datei)
  fs.renameSync(tmp, datei)
  nachher[rel] = { bytes: neu }
  summeNach += neu
  bearbeitet++
  console.log(`   ${mb(groesse)} → ${mb(neu)}  (−${(100 - (neu / groesse) * 100).toFixed(1)} %)`)
}

if (!DRY) fs.writeFileSync(MANIFEST, `${JSON.stringify(nachher, null, 2)}\n`)

console.log(`\n${dateien.length} referenzierte Videos, ${bearbeitet} neu kodiert`)
if (uebersprungen) console.log(`${uebersprungen} nicht referenzierte MP4 uebersprungen (landen nicht im Bundle)`)
console.log(`gesamt ${mb(summeVor)} → ${mb(summeNach)}  (−${(100 - (summeNach / summeVor) * 100).toFixed(1)} %)`)
