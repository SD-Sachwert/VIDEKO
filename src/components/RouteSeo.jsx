import { useLocation } from 'react-router-dom'

import Seo from './Seo.jsx'
import { ROUTE_META } from '../data/routes-meta.js'
import { staticRouteHead } from '../data/head.js'

/**
 * Setzt die Metadaten jeder statischen Route zentral aus routes-meta.js.
 *
 * Liegt im Layout, damit keine der Seiten ohne eigenen Title, Description,
 * Canonical und OG-Tags bleibt. Seiten mit dynamischen Daten (Journalartikel,
 * Produktdetail) rendern ihr eigenes <Seo> und werden hier übersprungen —
 * erkennbar daran, dass ihr Pfad nicht in ROUTE_META steht.
 *
 * Die Werte kommen aus derselben Funktion, die auch scripts/prerender.mjs
 * benutzt. Das ausgelieferte HTML und das, was React setzt, sind deshalb
 * identisch.
 */
export default function RouteSeo() {
  const { pathname } = useLocation()
  // Trailing Slash gehört nicht zur kanonischen Form (siehe vercel.json).
  const pfad = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const meta = ROUTE_META.get(pfad)
  if (!meta) return null

  return <Seo {...staticRouteHead(meta)} />
}
