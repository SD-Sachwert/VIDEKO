/**
 * VIDEKO PERFORMANCE – Sport- und Performance-Kollektion.
 *
 * Eigenständige, noch NICHT verkäufliche Kollektion (COMING SOON). Bewusst
 * getrennt von products.json / merch.js: Diese Artikel haben keine Preise,
 * Größen, Logo-Stile oder Warenkorb-Logik und sollen den Bekleidungs-Grid,
 * die Familien-Aggregation und die Tab-Filter nicht verändern.
 *
 * Bilder liegen in src/assets/images/performance/ (außerhalb des merch-Globs,
 * damit der Basename-Resolver in merch.js sauber bleibt) und werden hier über
 * ihren Dateinamen aufgelöst.
 */
const IMG = import.meta.glob('../assets/images/performance/*.webp', {
  eager: true,
  import: 'default',
})
const bild = (name) => IMG[`../assets/images/performance/${name}`]

const ONYX = { label: 'Onyx', hex: '#141312' }
const IVORY = { label: 'Ivory', hex: '#F4F1EA' }

/**
 * Produkttypen für die optionale Unterkategorie-Navigation. Reihenfolge = Anzeige.
 * `alle` ist der Standardfilter.
 */
export const PERFORMANCE_CATEGORIES = [
  { key: 'alle', label: 'Alle' },
  { key: 'shirt', label: 'Shirts' },
  { key: 'longsleeve', label: 'Longsleeve' },
  { key: 'tank', label: 'Tank' },
  { key: 'jacket', label: 'Jacke' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'cap', label: 'Caps' },
  { key: 'socks', label: 'Socken' },
  { key: 'bag', label: 'Taschen' },
  { key: 'shoe', label: 'Schuhe' },
]

const TYPE_LABEL = {
  shirt: 'Performance Shirt',
  longsleeve: 'Longsleeve',
  tank: 'Tanktop',
  jacket: 'Jacke',
  shorts: 'Shorts',
  cap: 'Cap',
  socks: 'Socken',
  bag: 'Sporttasche',
  shoe: 'Performance Schuh',
}

/**
 * Rohdaten. `files` sind die Bilddateien in Reihenfolge (Front zuerst, dann
 * Rückseite, falls vorhanden). Keine erfundenen Preise/Specs – nur was im
 * Bild tatsächlich zu sehen ist.
 */
const ROH = [
  { id: 'perf-core-tee', name: 'Performance Core', type: 'shirt', color: ONYX,
    sub: 'Cleaner Performance-Schnitt mit dezenter Gold-Paspel.',
    files: ['perf-core-tee-black.webp', 'perf-core-tee-black-back.webp'] },
  { id: 'perf-core-alt-tee', name: 'Performance Core (Alternative)', type: 'shirt', color: ONYX,
    sub: 'Alternative Front: VIDEKO-Emblem mit Schriftzug, mit Gold-Paspel.',
    files: ['perf-core-alt-tee-black.webp'] },
  { id: 'perf-apex-tee', name: 'Performance Apex', type: 'shirt', color: ONYX,
    sub: 'Sublimierte Gold-Geometrie an der Schulter.',
    files: ['perf-apex-tee-black.webp'] },
  { id: 'perf-goldrush-tee', name: 'Performance Gold Rush', type: 'shirt', color: ONYX,
    sub: 'Goldener Brush-Print auf Schwarz.',
    files: ['perf-goldrush-tee-black.webp'] },
  { id: 'perf-ignite-tee', name: 'Performance Ignite', type: 'shirt', color: ONYX,
    sub: 'Dynamisches Gold-Energy-Design.',
    files: ['perf-ignite-tee-black.webp'] },
  { id: 'perf-flow-tee', name: 'Performance Flow', type: 'shirt', color: IVORY,
    sub: 'Weißes Trikot mit Gold-Brush und schwarzen Ärmelakzenten.',
    files: ['perf-flow-tee-white.webp'] },
  { id: 'perf-statement-tee', name: 'Performance Statement', type: 'shirt', color: IVORY,
    sub: 'Weißes Trikot mit Gold-Brush und VIDEKO-Schriftzug.',
    files: ['perf-statement-tee-white-front.webp', 'perf-statement-tee-white-back.webp'] },
  { id: 'perf-essential-tee', name: 'Performance Essential', type: 'shirt', color: IVORY,
    sub: 'Reduziertes Weiß mit goldener Paspel.',
    files: ['perf-essential-tee-white-front.webp', 'perf-essential-tee-white-back.webp'] },
  { id: 'perf-longsleeve', name: 'Performance Longsleeve', type: 'longsleeve', color: ONYX,
    sub: 'Körpernahes Longsleeve mit goldener Linienführung.',
    files: ['perf-longsleeve-black.webp'] },
  { id: 'perf-tank', name: 'Performance Tank', type: 'tank', color: ONYX,
    sub: 'Leichtes Tank mit VIDEKO-Emblem.',
    files: ['perf-tank-black.webp'] },
  { id: 'perf-jacket', name: 'Performance Jacket', type: 'jacket', color: ONYX,
    sub: 'Kapuzenjacke mit Zip und dezenten Gold-Details.',
    files: ['perf-jacket-black.webp'] },
  { id: 'perf-shorts', name: 'Performance Training Shorts', type: 'shorts', color: ONYX,
    sub: 'Training Shorts mit seitlichem VIDEKO-Schriftzug.',
    files: ['perf-shorts-black.webp'] },
  { id: 'perf-cap', name: 'Performance Cap', type: 'cap', color: ONYX,
    sub: 'Sechs-Panel-Cap mit goldenem Emblem.',
    files: ['perf-cap-black.webp'] },
  { id: 'perf-socks', name: 'Performance Socks', type: 'socks', color: ONYX,
    sub: 'Performance-Socken mit VIDEKO am Schaft.',
    files: ['perf-socks-black.webp'] },
  { id: 'perf-bag', name: 'Performance Duffle Bag', type: 'bag', color: ONYX,
    sub: 'Geräumige Sporttasche mit VIDEKO-Schriftzug.',
    files: ['perf-bag-black.webp'] },
  // Schuhe: aus dem Accessoires-Bereich in die Performance-Reihe verschoben.
  // Bewusst nur EIN Bild je Schuh (kein Vorder-/Rückseiten-Umschalter), damit
  // keine zweite Ansicht faelschlich als „Rückseite" ausgegeben wird.
  { id: 'perf-sneaker', name: 'Performance Sneaker', type: 'shoe', color: IVORY,
    sub: 'Weißer Sneaker mit VIDEKO-Logo – in Gold oder dezent Ton-in-Ton.',
    files: ['perf-sneaker-white.webp'] },
  { id: 'perf-laufschuh', name: 'Performance Laufschuh', type: 'shoe', color: IVORY,
    sub: 'Leichter Laufschuh mit VIDEKO-Logo – in Gold oder dezent Ton-in-Ton.',
    files: ['perf-laufschuh-white.webp'] },
]

export const PERFORMANCE_PRODUCTS = ROH.map((p) => {
  const images = p.files.map(bild).filter(Boolean)
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    typeLabel: TYPE_LABEL[p.type] || 'Performance',
    color: p.color,
    sub: p.sub,
    images,
    hasBack: images.length > 1,
    alt: `VIDEKO ${p.name} – ${p.color.label}, ${TYPE_LABEL[p.type] || 'Performance'} (Musteransicht)`,
  }
})
