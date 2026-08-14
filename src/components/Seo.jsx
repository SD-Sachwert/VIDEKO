import { useEffect } from 'react'

import { SITE, absUrl } from '../data/site.js'

/**
 * Leichtgewichtiges SEO ohne zusätzliche Bibliothek.
 *
 * Setzt Titel, Meta-Description, Robots, Canonical, Open Graph, Twitter Card
 * und optionale strukturierte Daten (JSON-LD) imperativ in den <head> und
 * stellt beim Verlassen exakt den vorherigen Zustand wieder her.
 *
 * Wichtig für den Shop:
 *  - Der Canonical zeigt IMMER auf den Pfad OHNE Query-Parameter, damit
 *    Varianten-URLs (?style=…&color=…) keinen Duplicate Content erzeugen.
 *  - Coming-Soon-Produkte werden in den Angeboten NICHT als verfügbar
 *    ausgezeichnet (availability = PreOrder statt InStock).
 *
 * `jsonLd` nimmt ein einzelnes Objekt oder ein Array entgegen; jeder Eintrag
 * wird als eigenes <script type="application/ld+json"> ausgegeben.
 */
// Absolute URLs kommen aus site.js — eine zweite Implementierung hier waere
// eine zweite Stelle, an der die Domain haengt.
const BASE = SITE.origin

/**
 * Setzt ein <meta>-Tag und liefert eine Funktion, die den vorherigen Zustand
 * wiederherstellt — inklusive der statisch in index.html vorhandenen Tags, die
 * beim Verlassen einer Seite nicht verschwinden dürfen.
 */
function upsertMeta(attr, key, content) {
  const vorhanden = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (vorhanden) {
    const alt = vorhanden.getAttribute('content')
    vorhanden.setAttribute('content', content)
    return () => vorhanden.setAttribute('content', alt ?? '')
  }
  const el = document.createElement('meta')
  el.setAttribute(attr, key)
  el.setAttribute('content', content)
  document.head.appendChild(el)
  return () => el.parentNode?.removeChild(el)
}

function upsertLink(rel, href) {
  const vorhanden = document.head.querySelector(`link[rel="${rel}"]`)
  if (vorhanden) {
    const alt = vorhanden.getAttribute('href')
    vorhanden.setAttribute('href', href)
    return () => alt && vorhanden.setAttribute('href', alt)
  }
  const el = document.createElement('link')
  el.setAttribute('rel', rel)
  el.setAttribute('href', href)
  document.head.appendChild(el)
  return () => el.parentNode?.removeChild(el)
}

export default function Seo({
  title,
  description,
  canonicalPath,
  image,
  imageAlt,
  jsonLd,
  noindex = false,
  ogType,
}) {
  // Arrays/Objekte aus dem JSX erzeugen bei jedem Render eine neue Referenz.
  // Serialisiert vergleicht der Effekt den Inhalt statt der Identität.
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : null

  useEffect(() => {
    const prevTitle = document.title
    if (title) document.title = title

    const restore = []
    const setName = (name, val) => { if (val != null) restore.push(upsertMeta('name', name, val)) }
    const setProp = (prop, val) => { if (val != null) restore.push(upsertMeta('property', prop, val)) }

    if (description) setName('description', description)
    // Utility-, Bestätigungs- und Fehlerseiten nicht indexieren.
    setName('robots', noindex ? 'noindex, follow' : 'index, follow')

    // Canonical immer ohne Query-Parameter und immer auf die Produktionsdomain.
    const canonicalHref = BASE + (canonicalPath || '/')
    restore.push(upsertLink('canonical', canonicalHref))

    const bild = absUrl(image) || absUrl(SITE.defaultOgImage)
    const typ = ogType || (jsonLd && [].concat(jsonLd).some((d) => d?.['@type'] === 'Product')
      ? 'product'
      : 'website')

    setProp('og:site_name', SITE.name)
    setProp('og:locale', 'de_DE')
    setProp('og:type', typ)
    setProp('og:url', canonicalHref)
    if (title) setProp('og:title', title)
    if (description) setProp('og:description', description)
    if (bild) {
      setProp('og:image', bild)
      setProp('og:image:alt', imageAlt || title || SITE.name)
    }

    setName('twitter:card', 'summary_large_image')
    if (title) setName('twitter:title', title)
    if (description) setName('twitter:description', description)
    if (bild) {
      setName('twitter:image', bild)
      setName('twitter:image:alt', imageAlt || title || SITE.name)
    }

    const skripte = (jsonLd ? [].concat(jsonLd) : []).filter(Boolean).map((daten) => {
      const el = document.createElement('script')
      el.type = 'application/ld+json'
      el.textContent = JSON.stringify(daten)
      document.head.appendChild(el)
      return el
    })

    return () => {
      document.title = prevTitle
      restore.forEach((fn) => fn())
      skripte.forEach((el) => el.parentNode?.removeChild(el))
    }
  }, [title, description, canonicalPath, image, imageAlt, jsonLdKey, noindex, ogType, jsonLd])

  return null
}
