/* Erzeugt die beiden kleinen Web-Fassungen des Markenlogos aus dem Master.
 *
 * Ausgangspunkt ist immer src/assets/brand/logo-main-v2.png (902x760).
 * Die Geometrie des Logos wird NICHT angetastet — es wird weder neu
 * gezeichnet noch verzerrt noch beschnitten. Zwei Dinge passieren:
 *
 * 1. Der Zuschnitt endet unter der Wortmarke VIDEKO (y 0..659). Die Zeile
 *    KUECHEN darunter ist im Master nur 58 px hoch und landet im Header
 *    bei rund 6 px Zeichenhoehe — das ist keine Schrift mehr, sondern ein
 *    Strichmuster. In den kleinen Web-Groessen bleibt sie deshalb weg.
 * 2. Die Wortmarke wird umgefaerbt: auf hellen Flaechen nach Anthrazit,
 *    auf dunklen Flaechen nach hellem Silber. Die Helligkeitsverlaeufe des
 *    Originals bleiben dabei als Modulation erhalten, damit der metallische
 *    Charakter nicht zu einem flachen Aufkleber wird. Das Symbol behaelt in
 *    beiden Fassungen exakt seine Originalfarben (Silber/Gold).
 *
 * Aufruf: node scripts/logo-web-varianten.mjs
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..')
const MASTER = join(WURZEL, 'src/assets/brand/logo-main-v2.png')
const ZIEL = join(WURZEL, 'src/assets/brand')

/* Im Master gemessen: Symbol y 0..501, VIDEKO y 530..659,
   KUECHEN y 687..759. Geschnitten wird direkt unter VIDEKO. */
const SCHNITT_HOEHE = 660
const WORTMARKE_AB = 520

/* Exportbreite: die groesste Darstellung ist der Header mit 104 px,
   340 px deckt das bis DPR 3 ab. */
const EXPORT_BREITE = 340

const FASSUNGEN = [
  { name: 'logo-web-auf-hell.webp', von: [20, 18, 15], bis: [58, 53, 45] },
  { name: 'logo-web-auf-dunkel.webp', von: [168, 163, 154], bis: [252, 249, 243] },
]

const { data, info } = await sharp(MASTER)
  .extract({ left: 0, top: 0, width: 902, height: SCHNITT_HOEHE })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const { width: b, height: h, channels: k } = info

for (const f of FASSUNGEN) {
  const kopie = Buffer.from(data)
  for (let y = WORTMARKE_AB; y < h; y++) {
    for (let x = 0; x < b; x++) {
      const i = (y * b + x) * k
      if (kopie[i + 3] === 0) continue
      /* Relative Helligkeit des Originalpixels als Mischfaktor. */
      const l = (0.2126 * kopie[i] + 0.7152 * kopie[i + 1] + 0.0722 * kopie[i + 2]) / 255
      for (let c = 0; c < 3; c++) kopie[i + c] = Math.round(f.von[c] + (f.bis[c] - f.von[c]) * l)
    }
  }
  await sharp(kopie, { raw: { width: b, height: h, channels: k } })
    .resize({ width: EXPORT_BREITE })
    .webp({ quality: 92, effort: 6 })
    .toFile(join(ZIEL, f.name))
  const m = await sharp(join(ZIEL, f.name)).metadata()
  console.log(f.name, `${m.width}x${m.height}`, `${(m.size / 1024).toFixed(1)} kB`)
}
