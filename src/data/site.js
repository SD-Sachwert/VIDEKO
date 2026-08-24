/**
 * Zentrale Site-Konfiguration und schema.org-Bausteine.
 *
 * Single Source of Truth für alles, was sowohl die React-Seiten (Seo.jsx) als
 * auch die Build-Skripte (Prerender-Kopf, Sitemap) brauchen. Die Datei wird
 * bewusst auch von Node importiert und enthält deshalb keinen JSX- und keinen
 * Browser-Code.
 *
 * Rechtsträger, Anschrift und Kontakt kommen ausschließlich aus company.js —
 * hier wird nichts dupliziert und nichts erfunden.
 */
import { BRAND, ACTIVE_OPERATOR } from './company.js'

export const SITE = {
  /** Produktionsdomain. Canonicals zeigen IMMER hierhin, nie auf Preview-URLs. */
  origin: 'https://videko-kuechen.de',
  name: BRAND.name,
  locale: 'de_DE',
  /** Statisch in public/ — bleibt über Builds hinweg unter derselben URL. */
  defaultOgImage: '/og-image.jpg',
  logo: '/favicon-512.png',
}

/**
 * Bestätigte Social-Profile.
 *
 * NUR belegte URLs eintragen. Ein geratenes Profil in `sameAs` verknüpft die
 * Marke im Zweifel mit einem fremden Account. Facebook, TikTok, LinkedIn und
 * YouTube sind derzeit NICHT bestätigt und bleiben deshalb bewusst leer; die
 * Struktur ist so gebaut, dass eine bestätigte URL nur ergänzt werden muss.
 */
export const SOCIAL_PROFILES = [
  { key: 'instagram', label: 'Instagram', url: 'https://instagram.com/videko.kuechen' },
  // LinkedIn und XING am 2026-08-24 live verifiziert: beide Seiten führen
  // „VIDEKO Küchen eG", Hertzstraße 4 / 97076 Würzburg und info@videko-kuechen.de,
  // LinkedIn zusätzlich Dennis Himmel als Beschäftigten. Damit sind sie als offizielle
  // Profile belegt und gehören in `sameAs`.
  // Siehe docs/GBP-NAP-ARBEITSBERICHT-2026-08-24.md, Abschnitt 3.
  { key: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/videko-kuechen-eg' },
  { key: 'xing', label: 'XING', url: 'https://www.xing.com/pages/videko-kuechen-eg' },
  // { key: 'facebook',  label: 'Facebook',  url: null },  // offen – nicht raten
  // { key: 'tiktok',    label: 'TikTok',    url: null },  // offen – nicht raten
]

/** `sameAs` für schema.org – enthält nur tatsächlich bestätigte Profile. */
export const SAME_AS = SOCIAL_PROFILES.filter((p) => p.url).map((p) => p.url)

export function absUrl(pathOrUrl) {
  if (!pathOrUrl) return null
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return SITE.origin + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`)
}

/* ------------------------------------------------------------------ *
 * schema.org
 * ------------------------------------------------------------------ */

/**
 * Die Organisation hinter der Marke. `legalName` ist der tatsächlich
 * eingetragene Rechtsträger aus company.js, `name` die Marke.
 */
export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.origin}/#organization`,
    name: BRAND.name,
    legalName: ACTIVE_OPERATOR.legalName,
    url: SITE.origin,
    logo: absUrl(SITE.logo),
    image: absUrl(SITE.defaultOgImage),
    email: BRAND.contactEmail,
    telephone: `+49${BRAND.phoneHref.replace(/^\+49/, '')}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ACTIVE_OPERATOR.street,
      postalCode: ACTIVE_OPERATOR.postalCode,
      addressLocality: ACTIVE_OPERATOR.city,
      addressCountry: 'DE',
    },
    ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
  }
}

/**
 * Das Küchenstudio als Ort.
 *
 * BEWUSST OHNE `openingHours`/`openingHoursSpecification`: Das Studio befindet
 * sich im Aufbau, Termine laufen über die Beratungsanfrage. Erfundene
 * Öffnungszeiten wären in den Suchergebnissen eine falsche Zusage. Sobald
 * verbindliche Zeiten feststehen, gehören sie hierher.
 */
export function localBusinessLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['HomeAndConstructionBusiness', 'FurnitureStore'],
    '@id': `${SITE.origin}/#studio`,
    name: `${BRAND.name} Studio Würzburg`,
    parentOrganization: { '@id': `${SITE.origin}/#organization` },
    url: `${SITE.origin}/studio`,
    image: absUrl(SITE.defaultOgImage),
    telephone: BRAND.phoneHref,
    email: BRAND.contactEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.studio.street,
      postalCode: BRAND.studio.postalCode,
      addressLocality: BRAND.studio.city,
      addressRegion: 'Bayern',
      addressCountry: 'DE',
    },
    areaServed: { '@type': 'City', name: 'Würzburg' },
    // Terminbasiert statt offener Ladenöffnung – ehrlich abgebildet.
    availableService: { '@type': 'Service', name: 'Küchenplanung nach Terminvereinbarung' },
    // Nur wenn in company.js freigegebene Zeiten hinterlegt sind – sonst gar nicht.
    ...(BRAND.openingHours ? { openingHoursSpecification: BRAND.openingHours } : {}),
  }
}

export function webSiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.origin}/#website`,
    name: BRAND.name,
    url: SITE.origin,
    inLanguage: 'de-DE',
    publisher: { '@id': `${SITE.origin}/#organization` },
  }
}

/** `items`: [{ name, path }] – der letzte Eintrag ist die aktuelle Seite. */
export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  }
}

export function webPageLd({ path, title, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absUrl(path)}#webpage`,
    url: absUrl(path),
    name: title,
    description,
    inLanguage: 'de-DE',
    isPartOf: { '@id': `${SITE.origin}/#website` },
    about: { '@id': `${SITE.origin}/#organization` },
  }
}

/**
 * Artikel im Journal.
 *
 * OHNE `datePublished`: für die bestehenden Beiträge liegt kein belegtes
 * Veröffentlichungsdatum vor. Ein erfundenes Datum wäre für Google ein falsches
 * Signal — lieber das Feld weglassen.
 *
 * `dateModified` NUR, wenn am Artikel ein gepflegtes `lastModified` steht (siehe
 * data/journal.js). Das ist dieselbe belegte Quelle wie das <lastmod> der
 * Sitemap — beide Signale bleiben damit automatisch konsistent.
 */
export function articleLd(article, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${absUrl(path)}#article`,
    headline: article.title,
    description: article.metaDescription || article.teaser,
    articleSection: article.category,
    image: absUrl(article.image),
    inLanguage: 'de-DE',
    mainEntityOfPage: absUrl(path),
    author: { '@id': `${SITE.origin}/#organization` },
    publisher: { '@id': `${SITE.origin}/#organization` },
    ...(article.lastModified ? { dateModified: article.lastModified } : {}),
  }
}

/**
 * Eine einzelne Leistung als `Service`.
 *
 * Anbieter ist immer die Organisation, das Einzugsgebiet Würzburg — beides
 * belegt durch company.js. BEWUSST OHNE `offers`, Preis oder Bewertung: Die
 * Seiten nennen keine Preise, und erfundene Angaben hätten in einem Rich
 * Result unmittelbare Folgen. `serviceType` und `name` stehen so auch sichtbar
 * auf der jeweiligen Seite.
 *
 * @param {{ name: string, description: string, path: string, serviceType?: string }} s
 */
export function serviceLd({ name, description, path, serviceType }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${absUrl(path)}#service`,
    name,
    description,
    serviceType: serviceType || name,
    provider: { '@id': `${SITE.origin}/#organization` },
    areaServed: { '@type': 'City', name: 'Würzburg' },
    url: absUrl(path),
  }
}

/** FAQPage – nur einsetzen, wo die Fragen auch sichtbar auf der Seite stehen. */
export function faqLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}
