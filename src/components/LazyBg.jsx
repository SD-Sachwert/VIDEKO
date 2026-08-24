import { useEffect, useRef, useState } from 'react'

/**
 * Verzoegertes Laden von CSS-Hintergrundbildern.
 *
 * Warum (Performance 1.1, Messung vom 14.08.2026):
 * `background-image` kennt kein `loading="lazy"`. Jedes inline gesetzte
 * Hintergrundbild wird geladen, sobald das Element im Render-Tree steht — auch
 * wenn es 6000 px unterhalb des Viewports liegt. Auf `/` waren das 15 Bilder
 * mit zusammen ~1,5 MB von 3,1 MB, die alle VOR dem LCP starteten. Da der
 * simulierte LCP von Lighthouse an den bis dahin uebertragenen Bytes haengt,
 * hat das den mobilen LCP direkt nach oben gezogen.
 *
 * Die Komponente aendert nichts am CSS und nichts am Layout: dasselbe Element,
 * dieselbe Klasse, dieselben uebrigen Inline-Styles. Nur `backgroundImage` wird
 * erst gesetzt, wenn das Element in die Naehe des Viewports kommt.
 *
 * Nur fuer Elemente unterhalb des Folds verwenden — ein LCP-Hintergrund wuerde
 * dadurch spaeter entdeckt.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useNearViewport(rootMargin = '400px') {
  const ref = useRef(null)
  // Startwert ist bewusst fest `false` und wird NICHT von der Umgebung
  // abgeleitet: Der Build rendert dieselbe Komponente in Node, wo es weder
  // IntersectionObserver noch ein Viewport gibt. Haenge der Startwert an
  // `typeof IntersectionObserver`, waere das ausgelieferte HTML „geladen" und
  // der erste Browser-Render „nicht geladen" — React wuerde die Bilder direkt
  // nach der Hydration wieder entfernen (sichtbares Flackern, doppelte
  // Requests). Der Sonderfall „Browser ohne IntersectionObserver" ist deshalb
  // in den Effekt gewandert; dort laedt er eine Runde spaeter, aber sicher.
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Einmaliger Notausstieg fuer Browser ohne IntersectionObserver: einmal
    // beim Mounten, danach nie wieder, und im Build laeuft der Effekt gar
    // nicht. Es gibt hier also keine Kaskade, die die Regel verhindern will.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  return [ref, near]
}

export default function LazyBg({
  image,
  as: Tag = 'span',
  style,
  rootMargin = '400px',
  children,
  ...rest
}) {
  const [ref, near] = useNearViewport(rootMargin)

  return (
    <Tag
      ref={ref}
      style={near ? { ...style, backgroundImage: `url(${image})` } : style}
      {...rest}
    >
      {children}
    </Tag>
  )
}
