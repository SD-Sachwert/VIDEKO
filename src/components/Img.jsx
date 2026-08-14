import { imageMeta } from '../data/image-meta.js'
import { useNearViewport } from './LazyBg.jsx'

/**
 * Bild-Komponente mit responsiven Quellen, korrekten Ladeprioritaeten und
 * gesetzten Abmessungen.
 *
 * Warum das noetig ist (SEO-/Performance-Audit vom 14.08.2026):
 * `srcset`, `sizes` und `<picture>` kamen im Projekt praktisch nicht vor, und
 * `fetchPriority` stand an genau drei Stellen. Ein 1672 px breites Motiv wurde
 * auch dann vollstaendig geladen, wenn es in einer 360 px breiten Karte
 * erschien.
 *
 * Die Aufloesung passiert ueber die gehashte Build-URL: `variants.generated.js`
 * importiert dieselben Dateien statisch, also ist der URL-String identisch mit
 * dem, den ein normales `import bild from '...webp'` liefert. Dadurch
 * funktionieren responsive Bilder auch dort, wo die Quelle aus einer Datenzeile
 * (journal.js, merch.js) statt aus einem Import in der Komponente kommt.
 *
 * Props:
 *  - `src`      importiertes WebP (Pflicht)
 *  - `alt`      Alternativtext; leerer String kennzeichnet dekorative Bilder
 *  - `sizes`    CSS-Groessenangabe; ohne sie bringt srcset nichts
 *  - `priority` true fuer LCP-Bilder: eager, fetchPriority=high, kein lazy
 *  - `defer`    true fuer schwere Motive weit unterhalb des Folds
 *
 * Zu `defer` (Performance 1.1): Chromes eingebautes `loading="lazy"` benutzt
 * auf schnellen Verbindungen eine Distanzschwelle von rund 1250 px und
 * bewertet sie beim ersten Layout. Auf der Startseite hat das dazu gefuehrt,
 * dass Motive aus Abschnitt 3 und 4 noch vor dem LCP geladen wurden. `defer`
 * setzt `src`/`srcSet` erst, wenn das Bild per IntersectionObserver in
 * Viewportnaehe kommt. Abmessungen stehen von Anfang an im Markup, das Layout
 * ist also identisch und es entsteht kein Layoutsprung.
 * Niemals fuer das LCP-Bild verwenden.
 */
export default function Img({
  src,
  alt = '',
  sizes,
  priority = false,
  defer = false,
  className,
  width,
  height,
  loading,
  ...rest
}) {
  const meta = imageMeta(src)
  const [ref, near] = useNearViewport('400px')
  const zeigen = !defer || near

  return (
    <img
      ref={defer ? ref : undefined}
      src={zeigen ? src : undefined}
      alt={alt}
      className={className}
      srcSet={zeigen ? meta?.srcSet : undefined}
      sizes={meta?.srcSet ? sizes || '100vw' : undefined}
      width={width ?? meta?.w}
      height={height ?? meta?.h}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      {...rest}
    />
  )
}
