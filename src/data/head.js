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
} from './site.js'

/** Seiten, auf denen das Studio als Ort auch tatsächlich Thema ist. */
const STUDIO_ROUTES = new Set(['/', '/studio', '/showroom'])

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
export function merchDetailHead({ name, tagline, slug, image, extraLd }) {
  const pfad = `/merch/${slug}`
  const title = `${name} – VIDEKO Merch`
  return {
    title,
    description: tagline,
    canonicalPath: pfad,
    image,
    imageAlt: name,
    ogType: 'website',
    noindex: false,
    jsonLd: [
      organizationLd(),
      webPageLd({ path: pfad, title, description: tagline }),
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
