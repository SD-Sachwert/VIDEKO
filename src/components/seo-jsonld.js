/**
 * schema.org-Helfer fuer den Shop (aus Seo.jsx ausgelagert, damit die
 * Komponentendatei nur Komponenten exportiert – react-refresh-konform).
 */
const BASE = 'https://videko-kuechen.de'

/** Baut ein schema.org/Product-Objekt fuer eine Produktfamilie. */
export function familyJsonLd(family, priceEuro) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: family.label + ' – VIDEKO Merch',
    brand: { '@type': 'Brand', name: 'VIDEKO' },
    category: family.productType,
    image: BASE + '/merch/' + family.slug,
  }
  // Anfragemodell (Livegang-Audit): Ohne oeffentlichen Preis wird KEIN
  // schema.org/Offer ausgezeichnet. Ein Offer ohne Preis waere ungueltig und
  // ein „InStock"-Angebot ohne Kaufmoeglichkeit irrefuehrend. Erst wenn
  // oeffentliche Preise freigegeben sind (priceEuro != null), entsteht ein Offer.
  if (priceEuro != null) {
    ld.offers = {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      availability: family.anyLive ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      url: BASE + '/merch/' + family.slug,
      price: priceEuro.toFixed(2),
    }
  }
  return ld
}
