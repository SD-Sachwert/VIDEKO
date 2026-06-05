import { useRef } from 'react'

/**
 * Material slab staged like an exhibition object: real photo, deep shadow,
 * gold/silver light edge, cursor-driven 3D tilt and a moving light reflex.
 */
export default function MaterialCard({ name, image, descriptors = [], className = '' }) {
  const ref = useRef(null)

  function handleMove(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${(0.5 - py) * 9}deg`)
    el.style.setProperty('--ry', `${(px - 0.5) * 11}deg`)
    el.style.setProperty('--lx', `${px * 100}%`)
    el.style.setProperty('--ly', `${py * 100}%`)
  }

  function reset() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <article
      ref={ref}
      className={`slab ${className}`.trim()}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <div className="slab__inner">
        <div
          className="slab__image"
          style={{ backgroundImage: `url(${image})` }}
          aria-hidden="true"
        />
        <div className="slab__reflex" aria-hidden="true" />
        <div className="slab__edge" aria-hidden="true" />
        <div className="slab__scrim" aria-hidden="true" />
        <div className="slab__content">
          <h3 className="slab__name">{name}</h3>
          <ul className="slab__desc">
            {descriptors.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
