import { useEffect, useRef, useState } from 'react'

/**
 * Dekoratives Hintergrundvideo, das erst laedt, wenn es in Sichtweite kommt.
 *
 * WARUM
 * -----
 * Die Videos auf Start-, Leistungs- und Studioseite stehen weit unter dem
 * Falz, waren aber als `autoPlay preload="metadata"` im Markup. Damit beginnt
 * der Browser den Download sofort und konkurriert mit dem LCP-Bild um
 * Bandbreite — auf der Startseite mobil war das ein spuerbarer Teil der 33 MB
 * aus dem Audit.
 *
 * Hier wird `src` erst gesetzt, wenn ein IntersectionObserver das Element
 * meldet. Vorher steht nur das Poster im DOM, die Sektion sieht also von
 * Anfang an richtig aus — kein Layout-Sprung, kein leeres Rechteck.
 *
 * Das Hero-Video ist bewusst NICHT hierueber eingebunden: Es ist above the
 * fold und soll ohne Verzoegerung laufen.
 *
 * Props: `src` (Pflicht), `poster`, `rootMargin` sowie alle ueblichen
 * <video>-Attribute (className, aria-label, …).
 */
export default function LazyVideo({ src, poster, rootMargin = '300px', ...rest }) {
  const ref = useRef(null)
  // Ohne IntersectionObserver (sehr alte Browser) lieber sofort laden als ein
  // Video, das nie startet — deshalb schon im Startwert entschieden.
  const [sichtbar, setSichtbar] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const obs = new IntersectionObserver((eintraege) => {
      if (eintraege.some((e) => e.isIntersecting)) {
        setSichtbar(true)
        obs.disconnect()
      }
    }, { rootMargin })
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])

  return (
    <video
      ref={ref}
      // Ohne src laedt der Browser nichts — autoPlay bleibt wirkungslos, bis
      // der Observer ausloest.
      src={sichtbar ? src : undefined}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload={sichtbar ? 'auto' : 'none'}
      {...rest}
    />
  )
}
