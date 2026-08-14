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
  // Ohne IntersectionObserver (sehr alte Browser) wird sofort geladen — das
  // wird direkt beim ersten Render entschieden, nicht nachtraeglich im Effekt.
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return
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
