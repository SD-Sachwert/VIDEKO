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
 * 2. Die Wortmarke wird umgefaerbt: auf dunklen Flaechen nach hellem Silber
 *    (Modus "mischung"), auf hellen Flaechen nach dunklem Metall (Modus
 *    "verlauf"). Beide Verfahren sind bei FASSUNGEN erklaert. Das Symbol
 *    behaelt in beiden Fassungen exakt seine Originalfarben (Silber/Gold).
 * 3. Nur fuer helle Flaechen bekommt das Symbol eine feine Keyline
 *    (siehe KEYLINE weiter unten).
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
 * Die Wortmarke bleibt ausgenommen (BIS_Y): eine Kontur wuerde die
 * Buchstaben nur fetter machen und damit die Originalform veraendern.
 *
 * Am oberen Bildrand sitzt das Symbol im Master buendig auf y = 0. Dort ist
 * fuer eine Aussenlinie kein Platz, die Kontur wird an der Kante beschnitten.
 * Das ist bewusst so: Der Bildausschnitt und damit das Seitenverhaeltnis
 * bleiben identisch zur dunklen Fassung, sonst wuerden die beiden im Header
 * uebereinanderliegenden Bilder beim Uebergang gegeneinander verrutschen.
 */
const KEYLINE = { radius: 13, bisY: 520, farbe: [34, 31, 26] }

/* Faerbung der Wortmarke — zwei Verfahren.
 *
 * "mischung" (dunkle Fassung): Die relative Helligkeit jedes Originalpixels
 * mischt zwischen VON und BIS. Auf dunklem Grund traegt das gut, weil die
 * Wortmarke dort ohnehin ins Helle laeuft.
 *
 * "verlauf" (helle Fassung): Dasselbe Verfahren lief hier gegen eine sehr
 * dunkle Spanne (20,18,15 bis 58,53,45) und presste die Wortmarke damit auf
 * nahezu Schwarz — gut lesbar, aber flach; vom Metall blieb nichts uebrig.
 * Stattdessen wird der Grundton jetzt ueber die Zeilenposition gesetzt
 * (OBEN -> MITTE -> UNTEN, weich ueberblendet), und aus dem Original kommt
 * nur noch die Abweichung des einzelnen Pixels vom Mittel SEINER Zeile
 * dazu. Das trennt beides sauber: der Ton ist gewaehlt, die Metalltextur
 * (Kanten, Schliff, Fasen) bleibt exakt die des Originals.
 *
 * AMPLITUDE skaliert diese Textur, DECKEL begrenzt sie nach oben — ohne den
 * Deckel kaemen aus den Glanzkanten des Masters weisse Spitzen und damit ein
 * Chromeffekt, der hier nicht gewollt ist.
 *
 * Die Toene sind gegen die cremefarbene Kopfleiste (#f0ece2) gemessen: bei
 * 104 px Anzeigebreite 5.5:1 Kontrast im Mittel, die hellsten zehn Prozent
 * der Wortmarke liegen noch bei 3.8:1. Die frueher verwendete fast schwarze
 * Spanne kam auf 12:1 — mehr, als hier gebraucht wird.
 */
const FASSUNGEN = [
  {
    name: 'logo-web-auf-hell.webp',
    modus: 'verlauf',
    oben: [120, 120, 116],
    mitte: [65, 65, 62],
    unten: [95, 95, 90],
    amplitude: 60,
    deckel: 200,
    keyline: KEYLINE,
  },
  {
    name: 'logo-web-auf-dunkel.webp',
    modus: 'mischung',
    von: [168, 163, 154],
    bis: [252, 249, 243],
    keyline: null,
  },
]

/* Weiche Ueberblendung (smoothstep) — linear gemischt entstehen an den
   Stuetzstellen sichtbare Knicke im Verlauf. */
const weich = (t) => t * t * (3 - 2 * t)

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

/* Helligkeit jedes Wortmarkenpixels und das Mittel seiner Zeile. Die
   Differenz aus beidem ist die Metalltextur, die der Modus "verlauf" ueber
   den gewaehlten Grundton legt. Zeilen mit zu wenig Deckung (An- und
   Auslauf der Buchstaben) liefern kein belastbares Mittel und bleiben
   deshalb aus der Wortmarkenspanne heraus. */
const helligkeit = new Float64Array(b * h)
const zeilenMittel = new Float64Array(h)
let wortVon = h
let wortBis = 0
for (let y = WORTMARKE_AB; y < h; y++) {
  let summe = 0
  let anzahl = 0
  for (let x = 0; x < b; x++) {
    const i = (y * b + x) * k
    if (data[i + 3] < 8) continue
    const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255
    helligkeit[y * b + x] = l
    if (data[i + 3] >= 200) { summe += l; anzahl++ }
  }
  if (anzahl > 40) {
    zeilenMittel[y] = summe / anzahl
    if (y < wortVon) wortVon = y
    if (y > wortBis) wortBis = y
  }
}

/* Silhouette des Originals — Grundlage der Keyline. */
const silhouette = new Uint8Array(b * h)
for (let i = 0; i < b * h; i++) silhouette[i] = data[i * k + 3] >= 128 ? 1 : 0
const abstand = distanzfeld(silhouette, b, h)

for (const f of FASSUNGEN) {
  const kopie = Buffer.from(data)

  if (f.modus === 'mischung') {
    for (let y = WORTMARKE_AB; y < h; y++) {
      for (let x = 0; x < b; x++) {
        const i = (y * b + x) * k
        if (kopie[i + 3] === 0) continue
        /* Relative Helligkeit des Originalpixels als Mischfaktor. */
        const l = (0.2126 * kopie[i] + 0.7152 * kopie[i + 1] + 0.0722 * kopie[i + 2]) / 255
        for (let c = 0; c < 3; c++) kopie[i + c] = Math.round(f.von[c] + (f.bis[c] - f.von[c]) * l)
      }
    }
  } else {
    for (let y = wortVon; y <= wortBis; y++) {
      const t = (y - wortVon) / (wortBis - wortVon)
      /* Dreipunktverlauf oben -> mitte -> unten. */
      const ton = []
      for (let c = 0; c < 3; c++) {
        ton[c] = t < 0.5
          ? f.oben[c] + (f.mitte[c] - f.oben[c]) * weich(t / 0.5)
          : f.mitte[c] + (f.unten[c] - f.mitte[c]) * weich((t - 0.5) / 0.5)
      }
      for (let x = 0; x < b; x++) {
        const i = (y * b + x) * k
        if (kopie[i + 3] === 0) continue
        /* Nur die oertliche Abweichung vom Zeilenmittel — sie traegt die
           Metalltextur, der Vertikalverlauf kommt aus ton[]. */
        const ab = helligkeit[y * b + x] - zeilenMittel[y]
        for (let c = 0; c < 3; c++) {
          kopie[i + c] = Math.max(0, Math.min(f.deckel, Math.round(ton[c] + ab * f.amplitude)))
        }
      }
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
  const bytes = statSync(join(ZIEL, f.name)).size
  console.log(f.name, `${m.width}x${m.height}`, `${(bytes / 1024).toFixed(1)} kB`, f.keyline ? `Keyline r=${f.keyline.radius}` : 'ohne Keyline')
}
