/* Erzeugt das Hausmotiv fuer die Gewerkehaus-Section auf /entdecken.
 *
 * Der Master (gewerke-haus-master.png, 1536x1024) ist bereits freigestellt:
 * 43.7 % der Flaeche sind vollstaendig transparent, kein einziges Pixel ist
 * voll deckend (Maximum 254), und der Alphakanal beruehrt keinen Bildrand.
 * Es gibt also keinen dunklen Hintergrund, der weggerechnet werden muesste —
 * das Haus wird ganz normal ueber den dunklen Sectionuntergrund komponiert.
 *
 * Zwei Schritte passieren hier:
 *
 * 1. Zuschnitt auf die tatsaechliche Bounding-Box des Alphakanals
 *    (x 70..1450, y 11..1011). Der Master hat rundherum leeren Rand; ohne
 *    Zuschnitt braeuchte das <img> im Layout rund 11 % mehr Breite, ohne dass
 *    davon Haus zu sehen waere. Der Zuschnitt liegt bewusst auf a>=4, also
 *    inklusive des weichen Lichtsaums — der soll erhalten bleiben, er ist es,
 *    der den Uebergang in die dunkle Section traegt.
 * 2. Export als WebP mit Alphakanal in Originalbreite. Nicht hochskaliert:
 *    das Haus laeuft im Desktoplayout auf hoechstens rund 856 CSS-Pixel, die
 *    1381 px des Zuschnitts decken das mit Faktor 1.6 ab. Mehr Pixel wuerden
 *    nur die Datei aufblaehen, ohne Detail hinzuzufuegen.
 *
 * Aufruf: node scripts/gewerkehaus-asset.mjs
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORDNER = join(WURZEL, 'src/assets/images/entdecken')
const MASTER = join(ORDNER, 'gewerke-haus-master.png')
const ZIEL = join(ORDNER, 'gewerke-haus.webp')

/* Am Master gemessene Alpha-Bounding-Box bei Schwelle 4. */
const ZUSCHNITT = { left: 70, top: 11, width: 1381, height: 1001 }

/* Qualitaet 84 liegt an der Stelle, an der die naechste Stufe die Datei
   deutlich groesser macht, ohne dass sich im Direktvergleich noch etwas
   sichtbar aendert — geprueft an den Solarpaneelen und der Treppe, den
   beiden Bereichen mit der feinsten Struktur. */
const QUALITAET = 84

const master = await sharp(MASTER).metadata()

await sharp(MASTER)
  .extract(ZUSCHNITT)
  .webp({ quality: QUALITAET, effort: 6, alphaQuality: 100 })
  .toFile(ZIEL)

const m = await sharp(ZIEL).metadata()
const bytes = statSync(ZIEL).size
console.log(
  `Master  ${master.width}x${master.height}  ${(statSync(MASTER).size / 1024).toFixed(0)} kB`,
)
console.log(
  `Ziel    ${m.width}x${m.height}  ${(bytes / 1024).toFixed(1)} kB  ` +
    `Alpha ${m.hasAlpha ? 'ja' : 'nein'}  q${QUALITAET}`,
)
