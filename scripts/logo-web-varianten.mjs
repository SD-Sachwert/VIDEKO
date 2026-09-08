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
 * 2. Nur die Wortmarke wird umgefaerbt, in beiden Fassungen unterschiedlich
 *    (siehe FASSUNGEN). Das V/D-Symbol bleibt in beiden Dateien exakt das
 *    Original — dieselben Pixel, dasselbe Silber, dasselbe Gold, keine
 *    Kontur, keine Keyline. Der Bereich oberhalb von WORTMARKE_AB wird von
 *    keinem der beiden Verfahren angefasst.
 *
 * Aufruf: node scripts/logo-web-varianten.mjs
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..')
const MASTER = join(WURZEL, 'src/assets/brand/logo-main-v2.png')
const ZIEL = join(WURZEL, 'src/assets/brand')

/* Im Master gemessen: Symbol y 0..502, VIDEKO y 530..659, KUECHEN y 687..759.
   Geschnitten wird direkt unter VIDEKO. Zwischen Symbol und Wortmarke liegen
   27 vollstaendig leere Zeilen — WORTMARKE_AB darf deshalb irgendwo dazwischen
   liegen und trennt beide Bereiche sauber. */
const SCHNITT_HOEHE = 660
const WORTMARKE_AB = 510

/* Exportbreite: die groesste Darstellung ist der Header mit 104 px,
   340 px deckt das bis DPR 3 ab. */
const EXPORT_BREITE = 340

/* Der silberne Metallarm links im V/D-Symbol. Aus diesem Bereich stammen die
   Tonwerte der hellen Fassung — das Gold faellt ueber die Saettigung heraus. */
const SILBERPROBE = { x0: 90, x1: 470, y0: 0, y1: 503, maxSaettigung: 14 }

/* Faerbung der Wortmarke — zwei Verfahren.
 *
 * "mischung" (dunkle Fassung): Die relative Helligkeit jedes Originalpixels
 * mischt zwischen VON und BIS. Auf dunklem Grund traegt das gut, weil die
 * Wortmarke dort ohnehin ins Helle laeuft. Unveraendert seit der ersten
 * Fassung — der dunkle Headerzustand soll exakt so bleiben, wie er ist.
 *
 * "silber" (helle Fassung): Auf der cremefarbenen Kopfleiste (#f0ece2) wirkte
 * dieselbe helle Wortmarke milchig; gemessen kam sie dort auf 1.29:1 Kontrast.
 * Ein frei gewaehlter Grauverlauf hat das zwar lesbar gemacht, aber flach.
 * Deshalb kommen die Tonwerte jetzt aus dem Logo selbst: Die Wortmarke wird
 * per Histogrammabgleich auf die Helligkeitsverteilung des silbernen
 * Symbolarms gelegt (SILBERPROBE). Jeder Pixel behaelt seinen Rang, bekommt
 * aber den Ton, den das Metall an dieser Stelle der Verteilung im Symbol
 * wirklich hat. Die Schliffstruktur der Buchstaben — Fase, Kernschatten,
 * Reflexkante — bleibt dabei exakt die des Originals; sie ist es, die den
 * Verlauf organisch macht statt "oben hell, unten dunkel".
 *
 * Danach legt eine Tonkurve die drei Stuetzstellen des Silbers auf die
 * Zielspanne: Schatten (Silber p02), mittleres Silber (p50), Reflex (p98).
 * Der Reflex wird dabei bewusst gedeckelt — im Symbol geht das Silber bis 235
 * hoch, und das waere auf Creme (236) wieder unsichtbar. Gemessen bei 104 px
 * Anzeigebreite: 2.27:1 im Mittel, 4.13:1 im dunkelsten Viertel.
 */
const FASSUNGEN = [
  {
    name: 'logo-web-auf-hell.webp',
    modus: 'silber',
    schatten: 52,
    mitte: 132,
    reflex: 196,
  },
  {
    name: 'logo-web-auf-dunkel.webp',
    modus: 'mischung',
    von: [168, 163, 154],
    bis: [252, 249, 243],
  },
]

const helligkeit = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b

const { data, info } = await sharp(MASTER)
  .extract({ left: 0, top: 0, width: 902, height: SCHNITT_HOEHE })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const { width: b, height: h, channels: k } = info

/* Referenzverteilung des Silbers im Symbol. */
const silber = []
let sr = 0
let sg = 0
let sb = 0
for (let y = SILBERPROBE.y0; y < SILBERPROBE.y1; y++) {
  for (let x = SILBERPROBE.x0; x < SILBERPROBE.x1; x++) {
    const i = (y * b + x) * k
    if (data[i + 3] < 200) continue
    const r = data[i]
    const g = data[i + 1]
    const bl = data[i + 2]
    if (Math.max(r, g, bl) - Math.min(r, g, bl) > SILBERPROBE.maxSaettigung) continue
    silber.push(helligkeit(r, g, bl))
    sr += r
    sg += g
    sb += bl
  }
}
silber.sort((a, c) => a - c)
const silberQuantil = (p) =>
  silber[Math.min(silber.length - 1, Math.max(0, Math.round(p * (silber.length - 1))))]
const S02 = silberQuantil(0.02)
const S50 = silberQuantil(0.5)
const S98 = silberQuantil(0.98)

/* Das Silber ist fast neutral, aber eben nur fast. Die winzige Abweichung der
   drei Kanaele wird mitgenommen, damit die Wortmarke denselben Ton bekommt und
   nicht in reines Neutralgrau kippt. */
const anzahlSilber = silber.length
const mittelL = helligkeit(sr / anzahlSilber, sg / anzahlSilber, sb / anzahlSilber)
const KANAL = [sr / anzahlSilber / mittelL, sg / anzahlSilber / mittelL, sb / anzahlSilber / mittelL]

/* Verteilung der Original-Wortmarke, Grundlage des Histogrammabgleichs.
   Nur volldeckende Pixel — die weichen Kanten wuerden die Raenge verzerren. */
const wortmarke = []
for (let y = WORTMARKE_AB; y < h; y++) {
  for (let x = 0; x < b; x++) {
    const i = (y * b + x) * k
    if (data[i + 3] < 128) continue
    wortmarke.push(helligkeit(data[i], data[i + 1], data[i + 2]))
  }
}
wortmarke.sort((a, c) => a - c)

/* Anteil der Wortmarkenpixel, die dunkler sind als v. */
function rang(v) {
  let lo = 0
  let hi = wortmarke.length - 1
  while (lo < hi) {
    const m = (lo + hi) >> 1
    if (wortmarke[m] < v) lo = m + 1
    else hi = m
  }
  return lo / (wortmarke.length - 1)
}

/* Tonkurve durch die drei Silber-Stuetzstellen, dazwischen linear. Oberhalb
   von p98 laeuft sie flach weiter, damit die Glanzkanten des Masters nicht in
   einen Chromeffekt kippen. */
function tonkurve(L, f) {
  if (L <= S02) return f.schatten * (L / S02)
  if (L <= S50) return f.schatten + ((f.mitte - f.schatten) * (L - S02)) / (S50 - S02)
  if (L <= S98) return f.mitte + ((f.reflex - f.mitte) * (L - S50)) / (S98 - S50)
  return f.reflex + (L - S98) * 0.25
}

/* Nachschlagetabelle Originalhelligkeit -> Zielhelligkeit. Leicht geglaettet
   und monoton gemacht, sonst zieht die Quantisierung der Raenge Stufen in den
   Verlauf. */
function tabelle(f) {
  const roh = new Float64Array(256)
  for (let v = 0; v < 256; v++) roh[v] = tonkurve(silberQuantil(rang(v)), f)
  const lut = new Float64Array(256)
  for (let v = 0; v < 256; v++) {
    let summe = 0
    let anzahl = 0
    for (let d = -3; d <= 3; d++) {
      const u = v + d
      if (u < 0 || u > 255) continue
      summe += roh[u]
      anzahl++
    }
    lut[v] = summe / anzahl
  }
  for (let v = 1; v < 256; v++) if (lut[v] < lut[v - 1]) lut[v] = lut[v - 1]
  return lut
}

console.log(
  `Silberprobe: ${anzahlSilber} Pixel, p02 ${S02.toFixed(0)}, p50 ${S50.toFixed(0)}, ` +
    `p98 ${S98.toFixed(0)}, Kanal ${KANAL.map((v) => v.toFixed(4)).join('/')}`,
)

for (const f of FASSUNGEN) {
  const kopie = Buffer.from(data)

  if (f.modus === 'mischung') {
    for (let y = WORTMARKE_AB; y < h; y++) {
      for (let x = 0; x < b; x++) {
        const i = (y * b + x) * k
        if (kopie[i + 3] === 0) continue
        /* Relative Helligkeit des Originalpixels als Mischfaktor. */
        const l = helligkeit(kopie[i], kopie[i + 1], kopie[i + 2]) / 255
        for (let c = 0; c < 3; c++) kopie[i + c] = Math.round(f.von[c] + (f.bis[c] - f.von[c]) * l)
      }
    }
  } else {
    const lut = tabelle(f)
    for (let y = WORTMARKE_AB; y < h; y++) {
      for (let x = 0; x < b; x++) {
        const i = (y * b + x) * k
        if (kopie[i + 3] === 0) continue
        const v = Math.round(
          Math.min(255, Math.max(0, helligkeit(kopie[i], kopie[i + 1], kopie[i + 2]))),
        )
        for (let c = 0; c < 3; c++) {
          kopie[i + c] = Math.min(255, Math.max(0, Math.round(lut[v] * KANAL[c])))
        }
      }
    }
  }

  await sharp(kopie, { raw: { width: b, height: h, channels: k } })
    .resize({ width: EXPORT_BREITE })
    .webp({ quality: 92, effort: 6 })
    .toFile(join(ZIEL, f.name))
  const m = await sharp(join(ZIEL, f.name)).metadata()
  const bytes = statSync(join(ZIEL, f.name)).size
  console.log(f.name, `${m.width}x${m.height}`, `${(bytes / 1024).toFixed(1)} kB`, f.modus)
}
