import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

/**
 * Primary CTA — large, metallic-gold, magnetic, with a shimmer sweep and an
 * arrow that advances on hover. This is the loudest element in its section;
 * use it sparingly (one per section).
 *
 * variant: "primary" (default, gold) | "dark" (graphite on light bg)
 * size:    "lg" (default) | "md"
 */
export default function MagneticButton({
  children,
  variant = 'primary',
  size = 'lg',
  as: Tag = 'button',
  arrow = true,
  className = '',
  strength = 0.35,
  ...props
}) {
  const ref = useRef(null)

  function handleMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    el.style.transform = `translate(${x * strength}px, ${y * strength * 0.7}px)`
  }

  function reset() {
    const el = ref.current
    if (el) el.style.transform = 'translate(0, 0)'
  }

  return (
    <Tag
      ref={ref}
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      {...props}
    >
      <span className="btn__shimmer" aria-hidden="true" />
      <span className="btn__label">{children}</span>
      {arrow && (
        <span className="btn__arrow" aria-hidden="true">
          <ArrowRight size={size === 'lg' ? 20 : 18} strokeWidth={2} />
        </span>
      )}
    </Tag>
  )
}
