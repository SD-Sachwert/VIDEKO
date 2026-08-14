/**
 * Sammel-Entry, den scripts/prerender.mjs per Vite-SSR-Build nach Node holt.
 *
 * Der Umweg über einen echten Vite-Build ist Absicht: Die Datenmodule nutzen
 * `import.meta.glob` und importieren Bilder. Beides versteht nur Vite. Ein
 * handgeschriebener Parser über journal.js oder merch.js wäre bei jeder
 * Datenänderung ein stiller Fehler.
 *
 * Die Bild-Importe werden beim SSR-Build durch das Plugin in prerender.mjs auf
 * die gehashten URLs aus dem Client-Manifest umgebogen, damit og:image auf die
 * tatsächlich ausgelieferte Datei zeigt.
 */
export { STATIC_ROUTES, ROUTE_META, REDIRECTS } from '../src/data/routes-meta.js'
export { journalArticles } from '../src/data/journal.js'
export { MERCH_PRODUCTS, MERCH_FAMILIES } from '../src/data/merch.js'
export { staticRouteHead, journalArticleHead, merchDetailHead } from '../src/data/head.js'
export { SITE, absUrl } from '../src/data/site.js'
export { IMAGE_VARIANTS } from '../src/assets/images/variants.generated.js'
