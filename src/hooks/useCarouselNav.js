import { useRef, useEffect } from 'react'

/**
 * Macht ein Karussell per Mausrad/Trackpad und Touch-Swipe steuerbar.
 * Über dem Karussell fängt das Wheel die Eingabe ab (preventDefault) -> die Seite
 * scrollt in dem Moment nicht mit; gesteuert wird stattdessen das Karussell.
 * Gibt einen ref (für den Karussell-Container) + Touch-Handler zurück. Pfeile/Dots bleiben.
 */
export default function useCarouselNav(next, prev) {
  const ref = useRef(null)
  const lock = useRef(false)
  const touch = useRef(null)
  const fns = useRef({ next, prev })
  fns.current = { next, prev }

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const onWheel = (e) => {
      const d = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(d) < 4) return
      e.preventDefault()
      e.stopPropagation()
      if (lock.current) return
      lock.current = true
      if (d > 0) fns.current.next(); else fns.current.prev()
      setTimeout(() => { lock.current = false }, 300)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const onTouchStart = (e) => { touch.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touch.current == null) return
    const dx = e.changedTouches[0].clientX - touch.current
    if (Math.abs(dx) > 40) { if (dx < 0) fns.current.next(); else fns.current.prev() }
    touch.current = null
  }

  return { ref, onTouchStart, onTouchEnd }
}
