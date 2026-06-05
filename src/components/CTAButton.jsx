import { Link } from 'react-router-dom'
import MagneticButton from './MagneticButton.jsx'

/**
 * Thin wrapper around the primary magnetic button that routes internally
 * (`to`) or links out (`href`). Keeps the button hierarchy consistent.
 */
export default function CTAButton({ to, href, children, ...rest }) {
  if (to) {
    return (
      <MagneticButton as={Link} to={to} {...rest}>
        {children}
      </MagneticButton>
    )
  }
  return (
    <MagneticButton as="a" href={href || '#'} {...rest}>
      {children}
    </MagneticButton>
  )
}
