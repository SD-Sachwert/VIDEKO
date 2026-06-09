import { useRef, useEffect } from 'react'

/**
 * Macht ein Karussell per Mausrad/Trackpad (horizontal) und Touch-Swipe steuerbar.
 * Gibt einen ref (für das Stage-Element) + Touch-Handler zurück. Pfeile/Dots bleiben zusätzlich.
 */
export default function useCarouselNav(next, prev) {
  const ref = useRef(null)
  const lock = useRef(false)
  const touch = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const onWheel = (e) => {
      const d = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(d) < 6) return
      e.preventDefault()
      if (lock.current) return
      lock.current = true
      if (d > 0) next(); else prev()
      setTimeout(() => { lock.current = false }, 360)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [next, prev])

  const onTouchStart = (e) => { touch.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touch.current == null) return
    const dx = e.changedTouches[0].clientX - touch.current
    if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev() }
    touch.current = null
  }

  return { ref, onTouchStart, onTouchEnd }
}
