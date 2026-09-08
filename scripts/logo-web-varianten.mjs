/* Erzeugt die beiden kleinen Web-Fassungen des Markenlogos aus dem Master.
 *
 * Ausgangspunkt ist immer src/assets/brand/logo-main-v2.png (902x760).
 * Die Geometrie des Logos wird NICHT angetastet — es wird weder neu
 * gezeichnet noch verzerrt noch beschnitten. Drei Dinge passieren:
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
 * 3. Nur fuer helle Flaechen bekommt das Symbol eine feine Keyline
 *    (siehe KEYLINE weiter unten).
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

/* Keyline fuer helle Untergruende.
 *
 * Das Symbol ist Silber und Gold. Auf der cremefarbenen Kopfleiste
 * (#f0ece2) treffen damit zwei helle Flaechen aufeinander, und die feine
 * dunkle Kante, die der Master bereits mitbringt, ueberlebt die doppelte
 * Verkleinerung 902 -> 340 -> 104 px nicht. Genau diese vorhandene Kante
 * wird hier nachgezogen — es kommt keine neue Form dazu.
 *
 * RADIUS ist in Masterpixeln angegeben und liegt AUSSEN an der Silhouette.
 * Aussen deshalb, weil eine nach innen gelegte Kontur bei 104 px Anzeige
 * die schmalen Metallstege sichtbar auffressen wuerde. Die Deckung wird
 * ueber die exakte euklidische Distanztransformation weich abgestuft, das
 * ergibt eine antialiaste Linie statt einer Treppe.
 *
 * 13 Masterpixel entsprechen im Header 13 * 104/902 = 1.50 px. Auf der
 * schmalen Kopfleiste (88 px Logobreite) sind es 1.27 px.
 *
 * Die Wortmarke bleibt ausgenommen (BIS_Y): sie ist bereits anthrazit, eine
 * anthrazitfarbene Kontur wuerde die Buchstaben nur fetter machen und damit
 * die Originalform der Wortmarke veraendern.
 *
 * Am oberen Bildrand sitzt das Symbol im Master buendig auf y = 0. Dort ist
 * fuer eine Aussenlinie kein Platz, die Kontur wird an der Kante beschnitten.
 * Das ist bewusst so: Der Bildausschnitt und damit das Seitenverhaeltnis
 * bleiben identisch zur dunklen Fassung, sonst wuerden die beiden im Header
 * uebereinanderliegenden Bilder beim Uebergang gegeneinander verrutschen.
 */
const KEYLINE = { radius: 13, bisY: 520, farbe: [34, 31, 26] }

const FASSUNGEN = [
  { name: 'logo-web-auf-hell.webp', von: [20, 18, 15], bis: [58, 53, 45], keyline: KEYLINE },
  { name: 'logo-web-auf-dunkel.webp', von: [168, 163, 154], bis: [252, 249, 243], keyline: null },
]

/* Exakte Distanztransformation nach Felzenszwalb/Huttenlocher: erst
   spaltenweise, dann zeilenweise die untere Einhuellende der Parabeln. */
function distanz1d(f, n) {
  const d = new Float64Array(n)
  const v = new Int32Array(n)
  const z = new Float64Array(n + 1)
  let k = 0
  v[0] = 0; z[0] = -Infinity; z[1] = Infinity
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    while (s <= z[k]) {
      k--
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])
    }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity
  }
  k = 0
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]
  }
  return d
}

/* Abstand jedes Pixels zur naechsten gesetzten Maskenstelle, in Pixeln. */
function distanzfeld(maske, breite, hoehe) {
  const UNENDLICH = 1e12
  const spur = new Float64Array(Math.max(breite, hoehe))
  const d = new Float64Array(breite * hoehe)
  for (let i = 0; i < breite * hoehe; i++) d[i] = maske[i] ? 0 : UNENDLICH
  for (let x = 0; x < breite; x++) {
    for (let y = 0; y < hoehe; y++) spur[y] = d[y * breite + x]
    const r = distanz1d(spur, hoehe)
    for (let y = 0; y < hoehe; y++) d[y * breite + x] = r[y]
  }
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) spur[x] = d[y * breite + x]
    const r = distanz1d(spur, breite)
    for (let x = 0; x < breite; x++) d[y * breite + x] = Math.sqrt(r[x])
  }
  return d
}

const { data, info } = await sharp(MASTER)
  .extract({ left: 0, top: 0, width: 902, height: SCHNITT_HOEHE })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const { width: b, height: h, channels: k } = info

/* Silhouette des Originals — Grundlage der Keyline. */
const silhouette = new Uint8Array(b * h)
for (let i = 0; i < b * h; i++) silhouette[i] = data[i * k + 3] >= 128 ? 1 : 0
const abstand = distanzfeld(silhouette, b, h)

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

  if (f.keyline) {
    const { radius, bisY, farbe } = f.keyline
    for (let y = 0; y < bisY; y++) {
      for (let x = 0; x < b; x++) {
        const p = y * b + x
        const i = p * k
        const deckungLogo = kopie[i + 3] / 255
        /* Die Linie liegt hinter der Zeichnung; wo das Logo voll deckt,
           bleibt alles unveraendert. */
        if (deckungLogo >= 1) continue
        const deckungLinie = Math.max(0, Math.min(1, radius + 0.5 - abstand[p])) * (1 - deckungLogo)
        if (deckungLinie <= 0) continue
        const gesamt = deckungLogo + deckungLinie
        for (let c = 0; c < 3; c++) {
          kopie[i + c] = Math.round((kopie[i + c] * deckungLogo + farbe[c] * deckungLinie) / gesamt)
        }
        kopie[i + 3] = Math.round(gesamt * 255)
      }
    }
  }

  await sharp(kopie, { raw: { width: b, height: h, channels: k } })
    .resize({ width: EXPORT_BREITE })
    .webp({ quality: 92, effort: 6 })
    .toFile(join(ZIEL, f.name))
  const m = await sharp(join(ZIEL, f.name)).metadata()
  console.log(f.name, `${m.width}x${m.height}`, `${(m.size / 1024).toFixed(1)} kB`, f.keyline ? `Keyline r=${f.keyline.radius}` : 'ohne Keyline')
}
