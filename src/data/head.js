/**
 * Baut die Kopfdaten einer Seite — Title, Description, Canonical, OG-Bild und
 * JSON-LD — aus den Datenquellen.
 *
 * Bewusst frei von React und Browser-APIs, damit exakt dieselbe Funktion von
 * zwei Stellen genutzt wird:
 *
 *   • zur Laufzeit von `RouteSeo` / `JournalArticle` / `ProductDetail`
 *   • zur Build-Zeit von `scripts/prerender.mjs`
 *
 * Nur so ist garantiert, dass das vorgerenderte HTML und das, was React später
 * setzt, identisch sind. Zwei getrennte Implementierungen laufen sonst
 * unweigerlich auseinander.
 */
import {
  organizationLd, localBusinessLd, webSiteLd, webPageLd, breadcrumbLd, articleLd,
  serviceLd, faqLd,
} from './site.js'

/**
 * Seiten, auf denen das Studio als Ort auch tatsächlich Thema ist.
 *
 * /showroom ist entfallen und leitet dauerhaft auf /studio. /beratung und
 * /kuechenmontage-wuerzburg sind dazugekommen: Beide nennen den Standort und
 * das Einzugsgebiet sichtbar im Text — nur dann gehört LocalBusiness dorthin.
 */
const STUDIO_ROUTES = new Set(['/', '/studio', '/beratung', '/kuechenmontage-wuerzburg'])

/**
 * Stabile Kennung eines JSON-LD-Blocks für das Attribut `data-seo-id`.
 *
 * `scripts/prerender.mjs` schreibt sie ins ausgelieferte HTML, `Seo.jsx` sucht
 * damit zur Laufzeit den bereits vorhandenen Block und aktualisiert ihn, statt
 * einen zweiten danebenzuhängen. Ohne diese Kennung stand nach der Hydration
 * jeder vorgerenderte Block doppelt im <head>.
 *
 * `@id` ist die eindeutigste Kennung. Blöcke ohne `@id` — BreadcrumbList,
 * FAQPage, Product — kommen pro Seite genau einmal vor; dort genügt der Typ.
 * Fremde ld+json-Skripte ohne `data-seo-id` fasst `Seo.jsx` nie an.
 */
export function ldSlotId(block) {
  if (block?.['@id']) return String(block['@id'])
  const typ = block?.['@type']
  return Array.isArray(typ) ? typ.join('+') : String(typ ?? 'unbekannt')
}

/**
 * Kopfdaten einer statischen Route aus routes-meta.js.
 * @param {object} meta Eintrag aus STATIC_ROUTES
 */
export function staticRouteHead(meta) {
  const pfad = meta.path
  const istStart = pfad === '/'
  return {
    title: meta.title,
    description: meta.description,
    canonicalPath: pfad,
    image: meta.ogImage,
    noindex: !!meta.noindex,
    ogType: 'website',
    preload: meta.preload || null,
    jsonLd: [
      organizationLd(),
      webSiteLd(),
      webPageLd({ path: pfad, title: meta.title, description: meta.description }),
      STUDIO_ROUTES.has(pfad) ? localBusinessLd() : null,
      !istStart && meta.crumb
        ? breadcrumbLd([{ name: 'Start', path: '/' }, { name: meta.crumb, path: pfad }])
        : null,
      // Leistungsseiten beschreiben eine konkrete Dienstleistung mit
      // Einzugsgebiet. Nur dort gesetzt, wo das auch stimmt.
      meta.service ? serviceLd({ ...meta.service, path: pfad }) : null,
      // FAQPage nur, wenn dieselben Fragen sichtbar auf der Seite stehen. Die
      // Sätze kommen aus data/leistungsseiten.js, aus dem sich auch die
      // Seitenkomponente bedient — zwei Fassungen kann es damit nicht geben.
      meta.faqs?.length ? faqLd(meta.faqs) : null,
    ].filter(Boolean),
  }
}

/** Kopfdaten eines Journalartikels aus journal.js. */
export function journalArticleHead(article) {
  const pfad = `/journal/${article.slug}`
  return {
    title: article.metaTitle || `${article.title} | VIDEKO Küchen`,
    description: article.metaDescription || article.teaser,
    canonicalPath: pfad,
    image: article.image,
    imageAlt: article.title,
    ogType: 'article',
    noindex: false,
    // Artikelbild ist auf jeder Artikelseite das LCP-Element (Audit: 18,8 s mobil).
    preload: [{ src: article.image, sizes: '100vw' }],
    jsonLd: [
      organizationLd(),
      webSiteLd(),
      articleLd(article, pfad),
      breadcrumbLd([
        { name: 'Start', path: '/' },
        { name: 'Journal', path: '/journal' },
        { name: article.title, path: pfad },
      ]),
    ],
  }
}

/**
 * Kopfdaten einer Shop-Detailseite.
 *
 * Kein Product-JSON-LD mit Preis: Der Shop zeigt öffentlich keine Preise
 * (SHOW_PUBLIC_PRICES = false) und arbeitet mit Anfragen statt Bestellungen.
 * Ein `Offer` mit Preis im Markup wäre eine Angabe, die die Seite nicht macht.
 */
export function merchDetailHead({ name, tagline, slug, image, extraLd, canonicalSlug }) {
  const pfad = `/merch/${slug}`
  // Farbvarianten zeigen auf die fuehrende Seite ihrer Gruppe (merch.js).
  // Ohne Gruppe ist das der eigene Pfad — dann aendert sich nichts.
  const kanonisch = `/merch/${canonicalSlug || slug}`
  const title = `${name} – VIDEKO Merch`
  // Die sechs Familien-Einstiegsseiten fuehren keine eigene Tagline, weil sie
  // mehrere Linien buendeln. Statt eines leeren description-Tags eine Angabe
  // aus vorhandenen Daten: Produktname und Kollektion. Nichts hinzuerfunden.
  const description = (tagline || '').trim()
    || `${name} aus der VIDEKO Kollektion – Ausführungen, Farben und Größen im Überblick.`
  return {
    title,
    description,
    canonicalPath: kanonisch,
    image,
    imageAlt: name,
    ogType: 'website',
    noindex: false,
    jsonLd: [
      organizationLd(),
      webPageLd({ path: kanonisch, title, description }),
      breadcrumbLd([
        { name: 'Start', path: '/' },
        { name: 'Merch', path: '/merch' },
        { name, path: pfad },
      ]),
      // Product-JSON-LD baut die Seite selbst — sie kennt Varianten und
      // Verfuegbarkeit. Preise stehen dort bewusst nur, wenn sie oeffentlich sind.
      ...(extraLd ? [].concat(extraLd) : []),
    ],
  }
}
