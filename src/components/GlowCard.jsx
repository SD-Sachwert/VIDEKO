import { useRef } from 'react'
import TextLink from './TextLink.jsx'

/**
 * Feature / experience card. Cover image with a heavy mask, an index, an icon
 * and a tertiary text link. Tracks the cursor for a radial glow and a subtle
 * 3D tilt. Proportions vary per card via the `className` modifier.
 */
export default function GlowCard({
  index,
  eyebrow,
  title,
  body,
  image,
  icon: Icon,
  cta,
  href = '#',
  className = '',
}) {
  const ref = useRef(null)

  function handleMove(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
    el.style.setProperty('--rx', `${(0.5 - py) * 5}deg`)
    el.style.setProperty('--ry', `${(px - 0.5) * 7}deg`)
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
      className={`fcard ${className}`.trim()}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      <div
        className="fcard__image"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div className="fcard__scrim" aria-hidden="true" />
      <div className="fcard__glow" aria-hidden="true" />
      <div className="fcard__edge" aria-hidden="true" />

      <div className="fcard__content">
        <div className="fcard__top">
          <span className="fcard__index">{index}</span>
          {Icon && (
            <span className="fcard__icon" aria-hidden="true">
              <Icon size={20} strokeWidth={1.4} />
            </span>
          )}
        </div>

        <div className="fcard__body">
          {eyebrow && <span className="fcard__eyebrow">{eyebrow}</span>}
          <h3 className="fcard__title">{title}</h3>
          <p className="fcard__text">{body}</p>
          <TextLink href={href} tone="light" className="fcard__cta">
            {cta}
          </TextLink>
        </div>
      </div>
    </article>
  )
}
