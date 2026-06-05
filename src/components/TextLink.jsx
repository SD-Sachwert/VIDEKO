import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Tertiary action — an elegant text link with a trailing arrow and a fine
 * gold underline that draws in on hover.
 *
 * Internal routes (href starting with "/") render a react-router <Link> for
 * SPA navigation; everything else (anchors, mailto, …) stays a plain <a>.
 * tone: "ink" (default, on light) | "light" (on dark imagery)
 */
export default function TextLink({ children, href = '#', tone = 'ink', className = '', ...props }) {
  const internal = typeof href === 'string' && href.startsWith('/')
  const cls = `tlink tlink--${tone} ${className}`.trim()
  const inner = (
    <>
      <span className="tlink__label">{children}</span>
      <ArrowRight className="tlink__arrow" size={16} strokeWidth={1.9} />
      <span className="tlink__line" aria-hidden="true" />
    </>
  )
  if (internal) {
    return <Link className={cls} to={href} {...props}>{inner}</Link>
  }
  return <a className={cls} href={href} {...props}>{inner}</a>
}
