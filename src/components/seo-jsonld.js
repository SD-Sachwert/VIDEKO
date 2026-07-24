/**
 * schema.org-Helfer fuer den Shop (aus Seo.jsx ausgelagert, damit die
 * Komponentendatei nur Komponenten exportiert – react-refresh-konform).
 */
const BASE = 'https://videko-kuechen.de'

/** Baut ein schema.org/Product-Objekt fuer eine Produktfamilie. */
export function familyJsonLd(family, priceEuro) {
  const offers = {
    '@type': 'Offer',
    priceCurrency: 'EUR',
    // Coming-Soon nicht als verfuegbar auszeichnen
    availability: family.anyLive ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
    url: BASE + '/merch/' + family.slug,
  }
  if (priceEuro != null) offers.price = priceEuro.toFixed(2)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: family.label + ' – VIDEKO Merch',
    brand: { '@type': 'Brand', name: 'VIDEKO' },
    category: family.productType,
    image: BASE + '/merch/' + family.slug,
    offers,
  }
}
