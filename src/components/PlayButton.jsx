import { Play } from 'lucide-react'

/**
 * Secondary action — a play control with a slowly rotating dashed ring.
 * Deliberately a different shape/size from the primary button so the
 * hierarchy reads at a glance.
 */
export default function PlayButton({ label, href = '#', light = true }) {
  return (
    <a className={`playbtn ${light ? 'playbtn--light' : ''}`} href={href}>
      <span className="playbtn__disc">
        <span className="playbtn__ring" aria-hidden="true" />
        <span className="playbtn__core">
          <Play size={15} strokeWidth={0} fill="currentColor" />
        </span>
      </span>
      <span className="playbtn__label">{label}</span>
    </a>
  )
}
