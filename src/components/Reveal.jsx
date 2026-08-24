import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-triggered reveal via IntersectionObserver + CSS (no animation library
 * in the visibility path, so it is robust and easy to verify). Children fade +
 * lift into place once, when they enter the viewport.
 *
 * `bgImage` (Performance 1.1): optionales Hintergrundbild, das erst gesetzt
 * wird, wenn das Element in Viewportnaehe kommt (400 px Vorlauf, also frueher
 * als der Reveal selbst). Grund wie bei LazyBg.jsx: `background-image` kennt
 * kein `loading="lazy"` und wuerde sonst sofort geladen. Reveal haelt bereits
 * eine eigene ref auf demselben Element — deshalb hier ein Prop statt eines
 * LazyBg-Wrappers, der zusaetzliches Markup erzeugt haette.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
  bgImage,
  ...rest
}) {
  const ref = useRef(null)
  // Feste Startwerte, damit das im Build erzeugte HTML und der erste Render im
  // Browser exakt uebereinstimmen (siehe LazyBg.jsx). Ohne
  // IntersectionObserver wird im Effekt sofort aufgedeckt; ganz ohne
  // JavaScript uebernimmt die CSS-Regel unter `@media (scripting: none)`.
  const [shown, setShown] = useState(false)
  const [bgNah, setBgNah] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Einmaliger Notausstieg fuer Browser ohne IntersectionObserver: einmal
    // beim Mounten, danach nie wieder, und im Build laeuft der Effekt gar
    // nicht. Es gibt hier also keine Kaskade, die die Regel verhindern will.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!bgImage) return
    const el = ref.current
    if (!el) return
    // Einmaliger Notausstieg fuer Browser ohne IntersectionObserver: einmal
    // beim Mounten, danach nie wieder, und im Build laeuft der Effekt gar
    // nicht. Es gibt hier also keine Kaskade, die die Regel verhindern will.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof IntersectionObserver === 'undefined') { setBgNah(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setBgNah(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [bgImage])

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'reveal--in' : ''} ${className}`.trim()}
      style={{
        transitionDelay: `${delay}s`,
        ...(bgImage && bgNah ? { backgroundImage: `url(${bgImage})` } : null),
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
