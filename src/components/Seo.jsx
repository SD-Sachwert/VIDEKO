import { useEffect } from 'react'

/**
 * Leichtgewichtiges SEO ohne zusätzliche Bibliothek.
 *
 * Setzt Titel, Meta-Description, Canonical, Open-Graph und optionale
 * strukturierte Produktdaten (JSON-LD) imperativ in den <head> und räumt beim
 * Verlassen wieder auf.
 *
 * Wichtig für den Shop:
 *  - Der Canonical zeigt IMMER auf den Pfad OHNE Query-Parameter, damit
 *    Varianten-URLs (?style=…&color=…) keinen Duplicate Content erzeugen.
 *  - Coming-Soon-Produkte werden in den Angeboten NICHT als verfügbar
 *    ausgezeichnet (availability = PreOrder statt InStock).
 */
const BASE = 'https://videko-kuechen.de'

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
  return el
}

export default function Seo({ title, description, canonicalPath, image, jsonLd, noindex = false }) {
  useEffect(() => {
    const prevTitle = document.title
    if (title) document.title = title

    const created = []
    const setName = (name, val) => { if (val != null) created.push(upsertMeta('name', name, val)) }
    const setProp = (prop, val) => { if (val != null) created.push(upsertMeta('property', prop, val)) }

    if (description) setName('description', description)
    // Utility-/Bestätigungsseiten nicht indexieren.
    if (noindex) setName('robots', 'noindex, nofollow')

    // Canonical ohne Query-Parameter
    const canonicalHref = BASE + (canonicalPath || '/')
    let canon = document.head.querySelector('link[rel="canonical"]')
    const canonExisted = Boolean(canon)
    const prevCanon = canon?.getAttribute('href')
    if (!canon) { canon = document.createElement('link'); canon.setAttribute('rel', 'canonical'); document.head.appendChild(canon) }
    canon.setAttribute('href', canonicalHref)

    if (title) setProp('og:title', title)
    if (description) setProp('og:description', description)
    setProp('og:url', canonicalHref)
    setProp('og:type', jsonLd?.['@type'] === 'Product' ? 'product' : 'website')
    if (image) setProp('og:image', image.startsWith('http') ? image : BASE + image)

    let ld
    if (jsonLd) {
      ld = document.createElement('script')
      ld.type = 'application/ld+json'
      ld.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(ld)
    }

    return () => {
      document.title = prevTitle
      created.forEach((el) => el.parentNode && el.parentNode.removeChild(el))
      if (ld && ld.parentNode) ld.parentNode.removeChild(ld)
      if (!canonExisted && canon.parentNode) canon.parentNode.removeChild(canon)
      else if (canonExisted && prevCanon) canon.setAttribute('href', prevCanon)
    }
  }, [title, description, canonicalPath, image, jsonLd])

  return null
}
