import { ArrowRight } from 'lucide-react'

/**
 * Primary CTA — large, metallic-gold, with a shimmer sweep and an arrow that
 * advances on hover. Stays put on hover (no magnetic drift); the hover feedback
 * is glow / shadow / shimmer / arrow only. Use sparingly (one per section).
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
  // eslint-disable-next-line no-unused-vars
  strength,
  ...props
}) {
  return (
    <Tag
      className={`btn btn--${variant} btn--${size} ${className}`.trim()}
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
