/**
 * Ableitung der Shop-Daten aus den zentralen Datenquellen.
 *
 * Einzige Wahrheit fuer Produkte und Preise ist products.json, fuer shopweite
 * Werte shop-config.json, fuer Passformen size-guides.json. In Komponenten
 * steht weder ein Preis noch ein Produktattribut fest verdrahtet.
 *
 * Intern rechnen wir in Cent, damit Zwischensummen und Aufpreise nicht durch
 * Gleitkomma-Rundung verrutschen. Nach aussen formatiert formatPrice().
 */
import roh from './products.json'
import config from './shop-config.json'
import sizeGuides from './size-guides.json'

/**
 * Bilder werden ueber ihren Dateinamen referenziert und hier aufgeloest.
 * So laesst sich ein Platzhalter gegen ein echtes Produktfoto tauschen,
 * indem nur die Datei ersetzt wird – ohne Aenderung an Daten oder Komponenten.
 */
// Bilder liegen nach Kleidungsstueck in Unterordnern (tshirts/, hoodies/,
// polos/, vnecks/, crewnecks/, sneaker/, workwear/, accessories/, _shared/).
// products.json referenziert nur den Dateinamen (ohne Pfad), daher wird hier
// rekursiv geladen und ueber den Basename aufgeloest. _deprecated/ ist bewusst
// vom Glob ausgeschlossen, damit ersetzte Alt-Assets nicht mitgebundelt werden.
const BILDER = import.meta.glob(
  ['../assets/images/merch/**/*.webp', '!../assets/images/merch/_deprecated/**'],
  { eager: true, import: 'default' },
)

const NACH_NAME = {}
for (const pfad in BILDER) {
  const name = pfad.slice(pfad.lastIndexOf('/') + 1)
  NACH_NAME[name] = BILDER[pfad]
}

const bild = (datei) => NACH_NAME[datei]

const cent = (euro) => (euro == null ? null : Math.round(euro * 100))

export const SHIPPING_COST = cent(config.shipping.cost)
export const FREE_SHIPPING_FROM = cent(config.shipping.freeFrom)
export const LEAD_TIME_DEFAULT = config.shipping.leadTimeDefault
export const LEAD_TIME_PERSONALIZED = config.shipping.leadTimePersonalized
export const PERSONALIZATION_MAX = config.personalization.maxLength
export const PERSONALIZATION_LABEL = config.personalization.label
export const ORDER_MAIL = config.orderMail
export const NOTIFY_MAIL = config.notifyMail

export const SIZE_GUIDES = sizeGuides.guides
export const getSizeGuide = (id) => (id ? SIZE_GUIDES[id] || null : null)

/**
 * Sichtbare Produktfamilie aus Typ und Schnitt ableiten. Kunden sehen im Grid
 * je Familie EINE Karte; Logo-Stil, Platzierung und Farbe waehlen sie erst auf
 * der Produktseite. Workwear und Accessoires sind keine sammelbaren Familien.
 */
const FAMILY_LABEL = {
  'tshirt-regular': 'T-Shirt Regular',
  vneck: 'V-Neck',
  polo: 'Polo',
  hoodie: 'Hoodie',
  'zip-hoodie': 'Zip Hoodie',
  crewneck: 'Crewneck',
}
export const FAMILY_ORDER = Object.keys(FAMILY_LABEL)

/**
 * Standard-Garnfarbe je Familie fuer das Uebersichts-Kartenbild. Damit die
 * Uebersicht von Anfang an hell und einheitlich wirkt, zeigt jede Familie eine
 * bewusst gewaehlte Farbe – NUR wenn davon ein echtes Bild existiert, sonst
 * greift die normale Repraesentanten-Wahl. T-Shirt bleibt bewusst Schwarz.
 */
const FAMILY_REP_COLOR = {
  'tshirt-regular': 'black',
  vneck: 'white',
  polo: 'beige',
  hoodie: 'white',
  crewneck: 'white',
}

const familyKey = (p) => {
  if (p.collection === 'WORKWEAR') return 'workwear' // eigener Teaser, nicht im Grid
  if (p.category === 'Accessoires') return null // Einzelprodukte
  if (p.productType === 'tshirt') return 'tshirt-regular'
  return p.productType
}

/** Sichtbarer Logo-Stil je Linie. TONAL/BLACK LINE/WHITE LINE gibt es nicht mehr. */
const LOGO_STYLE = { SIGNATURE: 'SIGNATURE', PURE: 'PURE', ONE: 'ONE', PRESTIGE: 'PRESTIGE' }
export const LOGO_STYLE_ORDER = ['SIGNATURE', 'PURE', 'ONE', 'PRESTIGE']
export const LOGO_STYLE_INFO = {
  SIGNATURE: { key: 'SIGNATURE', label: 'SIGNATURE', desc: 'Klassisches VIDEKO Küchen Logo.' },
  PURE: { key: 'PURE', label: 'PURE', desc: 'Druck mit Emblem und VIDEKO.' },
  ONE: { key: 'ONE', label: 'ONE', desc: 'Nur das Emblem – klein auf der Brust.' },
  PRESTIGE: { key: 'PRESTIGE', label: 'PRESTIGE', desc: 'Flock-Veredelung in verschiedenen Farben.' },
}

/**
 * Logo-/Flock-Farben. Eine dritte Konfigurationsachse: Auf einem Shirt kann das
 * gleiche Logo in mehreren Farben gedruckt (PURE/ONE) oder als Flock veredelt
 * (PRESTIGE) werden. Reihenfolge = Anzeigereihenfolge der Auswahl.
 */
export const LOGO_COLOR_ORDER = ['classic', 'schwarz', 'weiss', 'normal', 'gold', 'silber']
// Premium-Farbnamen (Marke) statt „normal/schwarz/weiß". Der interne `key`
// bleibt stabil (Bilddateien, URL-Parameter); nur das Label ist hochwertig.
export const LOGO_COLOR_INFO = {
  // Classic = das zweifarbige Marken-Lockup (Silber + Gold) – unsere Standard-
  // Logofarbe. Der Swatch ist bewusst ein Zwei-Ton-Verlauf; `hex` ist eine
  // CSS-`background`-Angabe (wird nur als Farbfeld gerendert).
  classic: { key: 'classic', label: 'Classic', hex: 'linear-gradient(135deg, #C7CCD1 0%, #C7CCD1 46%, #C9A227 54%, #C9A227 100%)' },
  schwarz: { key: 'schwarz', label: 'Onyx', hex: '#141312' },
  weiss: { key: 'weiss', label: 'Ivory', hex: '#F4F1EA' },
  normal: { key: 'normal', label: 'Champagne', hex: '#C6A664' },
  gold: { key: 'gold', label: 'Gold', hex: '#C9A227' },
  silber: { key: 'silber', label: 'Silver', hex: '#C7CCD1' },
}

/**
 * Referenzgröße für ALLE kleinen Brustlogos: das schwarze V-Neck mit
 * Gold-Emblem. Diese Datei ist die verbindliche Zielgröße/-position
 * (Start ca. 8 cm unter dem Kragen). ONE, PURE-chest, PRESTIGE-chest,
 * SIGNATURE-chest, Polos und Hoodies mit Brustlogo richten sich danach.
 */
export const CHEST_LOGO_REFERENCE = 'pure-vneck-schwarz-brust-schwarz.webp'

/**
 * Bildstatus. Alles außer `final`/`existing_but_review` zeigt im Shop den
 * hochwertigen Platzhalter – niemals ein falsches/altes Bild (keine stillen
 * Fallbacks). `needs_regeneration` und `incorrect_old_asset` behalten den
 * Ursprungs-Dateinamen nur zur Nachverfolgung (assetFile), werden aber nicht
 * angezeigt.
 */
const PLACEHOLDER_IMG = 'v5-coming-soon.webp'
export const PLACEHOLDER_STATUS = new Set(['placeholder', 'needs_regeneration', 'incorrect_old_asset'])
export const isPlaceholderStatus = (s) => PLACEHOLDER_STATUS.has(s)
export const IMAGE_STATUS_TITLE = {
  placeholder: 'Produktbild folgt',
  needs_regeneration: 'Neu zu generieren',
  incorrect_old_asset: 'Neu zu generieren',
}

const basis = roh.map((p) => ({
  ...p,
  price: cent(p.price),
  personalizationPrice: cent(p.personalization_price) || 0,
  soon: p.status !== 'live',
  // Kaufbarkeit ist eine EIGENE Wahrheit aus products.json (nicht nur aus dem
  // Status abgeleitet). Nur `purchasable: true` darf in den Warenkorb/Checkout.
  // Fehlt das Feld, gilt bewusst NICHT kaufbar (Fail-safe).
  purchasable: p.purchasable === true,
  family: familyKey(p),
  familyLabel: FAMILY_LABEL[familyKey(p)] || null,
  logoStyle: LOGO_STYLE[p.collection] || null,
  badge: p.status === 'live' ? null : 'Coming Soon',
  image: bild(p.image),
  gallery: (p.gallery?.length ? p.gallery : [p.image]).map(bild).filter(Boolean),
  // Logo-Platzierungen mit aufgeloesten Bildpfaden; das Kartenbild ist die erste
  placements: (p.placements?.length ? p.placements : [{ key: 'single', label: 'Standard', gallery: p.gallery || [p.image], imageStatus: p.imageStatus }]).map((pl) => {
    const platz = isPlaceholderStatus(pl.imageStatus)
    return {
      key: pl.key,
      label: pl.label,
      slot: pl.slot,
      slotLabel: pl.slotLabel,
      logoColor: pl.logoColor,
      imageStatus: pl.imageStatus,
      regenNote: pl.regenNote || null,
      // Ursprungsdatei (evtl. altes/fehlerhaftes Asset) nur als Nachweis – nicht angezeigt.
      assetFile: pl.image && pl.image !== PLACEHOLDER_IMG ? pl.image : null,
      // Platzhalter-Status zeigt garantiert den neutralen Platzhalter, kein Fremdbild.
      gallery: platz
        ? [bild(PLACEHOLDER_IMG)].filter(Boolean)
        : (pl.gallery?.length ? pl.gallery : [pl.image]).map(bild).filter(Boolean),
    }
  }),
}))

/**
 * Farbvarianten desselben Schnitts zusammenfassen.
 *
 * Produkte mit gleichem `variantGroup` sind derselbe Schnitt in anderer Farbe
 * und verlinken untereinander. Unterschiedliche Schnitte (Regular, Oversized,
 * Fitted, Polo) bleiben bewusst eigene Produkte – sie teilen keine Gruppe.
 * Die Liste wird hier abgeleitet, damit sie nicht in jedem Produkt doppelt
 * gepflegt werden muss.
 */
const nachGruppe = new Map()
basis.forEach((p) => {
  if (!p.variantGroup) return
  if (!nachGruppe.has(p.variantGroup)) nachGruppe.set(p.variantGroup, [])
  nachGruppe.get(p.variantGroup).push(p)
})

export const MERCH_PRODUCTS = basis.map((p) => ({
  ...p,
  variants: (nachGruppe.get(p.variantGroup) || []).map((v) => ({
    slug: v.slug,
    label: v.colors?.[0]?.label || v.name,
    hex: v.colors?.[0]?.hex || '#141312',
    soon: v.soon,
    istDieses: v.id === p.id,
  })),
}))

/**
 * Varianten-Unit: eine konkrete, anzeigbare Kombination aus Logo-Stil, Farbe und
 * Platzierung. Jede Platzierung eines Produkts wird zu einer eigenen Unit. So
 * bilden mehrere interne Produkte (z. B. Signature-Front 4,99 € und
 * Signature-Brust 7,99 €) gemeinsam eine Familie ab, ohne dass Karten oder
 * Preise verloren gehen.
 */
const unitsOf = (produkt) =>
  produkt.placements.map((pl) => ({
    style: produkt.logoStyle,
    styleLabel: LOGO_STYLE_INFO[produkt.logoStyle]?.label || produkt.logoStyle,
    color: produkt.colors?.[0]?.label || 'Standard',
    colorKey: produkt.colors?.[0]?.key || 'std',
    colorHex: produkt.colors?.[0]?.hex || '#141312',
    placementKey: pl.slot || pl.key,
    placementLabel: pl.slotLabel || pl.label,
    logoColorKey: pl.logoColor || null,
    logoColorLabel: pl.logoColor ? (LOGO_COLOR_INFO[pl.logoColor]?.label || pl.logoColor) : null,
    logoColorHex: pl.logoColor ? (LOGO_COLOR_INFO[pl.logoColor]?.hex || '#141312') : null,
    gallery: pl.gallery,
    image: pl.gallery[0],
    imageStatus: pl.imageStatus,
    regenNote: pl.regenNote || null,
    assetFile: pl.assetFile || null,
    price: produkt.price,
    priceNote: produkt.priceNote,
    personalizable: produkt.personalizable,
    personalizationPrice: produkt.personalizationPrice,
    sizes: produkt.sizes,
    sizeGuide: produkt.sizeGuide,
    soon: produkt.soon,
    sourceId: produkt.id,
    sourceSlug: produkt.slug,
    fit: produkt.fit,
    fitNote: produkt.fitNote,
    material: produkt.material,
    refinement: produkt.refinement || 'print',
    requiresRerender: !!produkt.requiresRerender,
  }))

// Reihenfolge fuer die Repraesentanten-Auswahl. Es gibt (noch) keine echten
// Fotos – alle vorhandenen Bilder sind KI-Mockups.
const bildStatusRang = {
  final: 0, real_photo: 0, existing_but_review: 1, ai_mockup: 1,
  placeholder: 3, needs_regeneration: 3, incorrect_old_asset: 3, missing: 4,
}

/**
 * Familien aus den Produkten aggregieren. Eine Familie kennt ihre Units, die
 * verfuegbaren Logo-Stile und Farben sowie ein repraesentatives Kartenbild.
 */
function baueFamilien() {
  const map = new Map()
  MERCH_PRODUCTS.forEach((p) => {
    if (!p.family || p.family === 'workwear') return
    if (!map.has(p.family)) map.set(p.family, [])
    map.get(p.family).push(p)
  })

  const familien = [...map.entries()].map(([key, produkte]) => {
    const units = produkte.flatMap(unitsOf)
    const styles = LOGO_STYLE_ORDER.filter((s) => units.some((u) => u.style === s))
    const preise = units.map((u) => u.price).filter((x) => x != null)
    const priceFrom = preise.length ? Math.min(...preise) : null
    // Repraesentatives Kartenbild: bestes Bild (final vor mockup vor placeholder),
    // dabei live-Units bevorzugen und das grosse Frontlogo vor der Brustansicht.
    // Bevorzugte Standard-Garnfarbe der Familie zuerst – aber nur, wenn davon ein
    // echtes Bild vorliegt (kein Platzhalter erzwingen).
    const prefColor = FAMILY_REP_COLOR[key] || null
    const prefRank = (u) => (prefColor && u.colorKey === prefColor && !isPlaceholderStatus(u.imageStatus)) ? 0 : 1
    const sortRep = (a, b) =>
      (prefRank(a) - prefRank(b))
      || (a.soon - b.soon)
      || (bildStatusRang[a.imageStatus] - bildStatusRang[b.imageStatus])
      || ((a.placementKey === 'chest') - (b.placementKey === 'chest'))
    const repUnit = [...units].sort(sortRep)[0]
    const colors = []
    units.forEach((u) => { if (!colors.some((c) => c.key === u.colorKey)) colors.push({ key: u.colorKey, label: u.color, hex: u.colorHex }) })
    // Kartenbild einer Farbe = exakt das Bild, das die Produktseite beim Oeffnen
    // dieser Farbe als Erstes zeigt. Sonst wirkt die Uebersicht wie ein anderes
    // Produkt als die Detailansicht. Die Produktseite waehlt ihre Default-Variante
    // so: erste Platzierung (Slot) mit echtem Bild – in Platzierungs-Reihenfolge –,
    // darin die erste Logo-Farbe nach LOGO_COLOR_ORDER mit echtem Bild. Genau das
    // bildet detailStartUnit() nach (nur auf den Units des Einstiegs-Produkts).
    const detailStartUnit = (produktUnits) => {
      const slots = []
      produktUnits.forEach((u) => { if (!slots.includes(u.placementKey)) slots.push(u.placementKey) })
      const slot = slots.find((s) => produktUnits.some((u) => u.placementKey === s && !isPlaceholderStatus(u.imageStatus))) || slots[0]
      const su = produktUnits.filter((u) => u.placementKey === slot)
      const lcs = []
      su.forEach((u) => { if (u.logoColorKey && !lcs.includes(u.logoColorKey)) lcs.push(u.logoColorKey) })
      lcs.sort((a, b) => LOGO_COLOR_ORDER.indexOf(a) - LOGO_COLOR_ORDER.indexOf(b))
      if (!lcs.length) return su[0]
      const lc = lcs.find((l) => su.some((u) => u.logoColorKey === l && !isPlaceholderStatus(u.imageStatus))) || lcs[0]
      return su.find((u) => u.logoColorKey === lc) || su[0]
    }

    // Farboptionen fuer den Wechsel direkt in der Karte: je Garn-Farbe der
    // Einstiegs-Slug (bestes Bild) und dazu GENAU dessen Detail-Startbild.
    // Hat eine Farbe nur Platzhalter, zeigt sie ehrlich den Platzhalter.
    const colorOptions = []
    units.forEach((u) => {
      if (colorOptions.some((c) => c.key === u.colorKey)) return
      const farbUnits = [...units].filter((x) => x.colorKey === u.colorKey)
      const beste = [...farbUnits].sort(sortRep)[0]
      const einstiegUnits = farbUnits.filter((x) => x.sourceSlug === beste.sourceSlug)
      const anzeige = detailStartUnit(einstiegUnits)
      colorOptions.push({
        key: u.colorKey, label: u.color, hex: u.colorHex,
        image: anzeige.image, imageStatus: anzeige.imageStatus,
        slug: beste.sourceSlug, soon: beste.soon,
        hasRealImage: !isPlaceholderStatus(anzeige.imageStatus),
      })
    })
    const repOption = colorOptions.find((c) => c.key === repUnit.colorKey) || colorOptions[0]
    return {
      key,
      label: FAMILY_LABEL[key],
      productType: produkte[0].productType,
      slug: repUnit.sourceSlug, // Einstieg in die Produktseite
      units,
      styles,
      colors,
      colorOptions,
      repColorKey: repUnit.colorKey,
      priceFrom,
      anyLive: units.some((u) => !u.soon),
      allSoon: units.every((u) => u.soon),
      hasRealImage: units.some((u) => !isPlaceholderStatus(u.imageStatus)),
      // Fallback-Kartenbild = Detail-Startbild der Repraesentanten-Farbe (siehe oben).
      image: repOption.image,
      imageStatus: repOption.imageStatus,
      badge: units.some((u) => !u.soon) ? null : 'Coming Soon',
      rank: FAMILY_ORDER.indexOf(key),
    }
  })
  familien.sort((a, b) => a.rank - b.rank)
  return familien
}

export const MERCH_FAMILIES = baueFamilien()
export const getFamily = (key) => MERCH_FAMILIES.find((f) => f.key === key)
export const getFamilyOfProduct = (product) => MERCH_FAMILIES.find((f) => f.key === product.family)

/** Accessoires als Einzelprodukte (keine sammelbare Familie). */
export const ACCESSORY_PRODUCTS = MERCH_PRODUCTS.filter((p) => p.category === 'Accessoires')
/** Workwear für die eigene Teaser-Sektion. */
export const WORKWEAR_PRODUCTS = MERCH_PRODUCTS.filter((p) => p.collection === 'WORKWEAR')

/** Aufpreis fuer den Namensdruck – kommt je Produkt aus products.json. */
export const personalizationPrice = (product) => product?.personalizationPrice || 0

// Produktlinien in Anzeige-Reihenfolge. `collection` traegt das Anzeigelabel.
export const COLLECTIONS = ['SIGNATURE', 'PURE', 'ONE', 'PRESTIGE', 'WORKWEAR', 'ACCESSOIRES']

/**
 * Filter der Bekleidungs-Sektion. Bewusst schlank: Accessoires haben eine eigene
 * Sektion, die Logo-Stile ihre eigene Auswahl. `test` arbeitet auf Familien.
 */
export const MERCH_TABS = [
  { key: 'alle', label: 'Alle', test: () => true },
  { key: 'tshirts', label: 'T-Shirts', test: (f) => f.productType === 'tshirt' },
  { key: 'vneck', label: 'V-Neck', test: (f) => f.productType === 'vneck' },
  { key: 'hoodies', label: 'Hoodies & Sweater', test: (f) => ['hoodie', 'zip-hoodie', 'crewneck'].includes(f.productType) },
  { key: 'polos', label: 'Polos', test: (f) => f.productType === 'polo' },
  { key: 'bald', label: 'Coming Soon', test: (f) => f.allSoon },
]

export const passtZuTab = (f, tab) => {
  const t = MERCH_TABS.find((x) => x.key === tab)
  return t ? t.test(f) : true
}

export const MERCH_SORTS = [
  { key: 'beliebt', label: 'Beliebtheit' },
  { key: 'neu', label: 'Neueste' },
  { key: 'preis-auf', label: 'Preis aufsteigend' },
  { key: 'preis-ab', label: 'Preis absteigend' },
]

export const formatPrice = (cents) =>
  cents == null
    ? ''
    : (cents / 100).toLocaleString('de-DE', {
        style: 'currency',
        currency: config.currency,
      })

export const getProduct = (slug) => MERCH_PRODUCTS.find((p) => p.slug === slug)

/**
 * Empfehlungen: erst gleicher Produkttyp, dann gleiche Kollektion, dann Rest.
 * Farbvarianten desselben Schnitts bleiben aussen vor – die stehen bereits
 * als Variantenauswahl auf der Seite.
 */
export const getRelated = (product, limit = 5) => {
  const andere = MERCH_PRODUCTS.filter(
    (p) => p.id !== product.id && !(product.variantGroup && p.variantGroup === product.variantGroup),
  )
  const gewicht = (p) =>
    (p.productType === product.productType ? 0 : 2) + (p.collection === product.collection ? 0 : 1)
  return [...andere].sort((a, b) => gewicht(a) - gewicht(b) || a.rank - b.rank).slice(0, limit)
}
