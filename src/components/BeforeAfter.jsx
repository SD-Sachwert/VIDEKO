import { useState } from 'react'

/**
 * Interactive before/after comparison slider.
 * Drag the range (covers the whole image) to reveal more "after".
 */
export default function BeforeAfter({
  before, after, beforeAlt = 'Vorher', afterAlt = 'Nachher',
  beforeLabel = 'Vorher', afterLabel = 'Nachher',
}) {
  const [pos, setPos] = useState(50)
  return (
    <div className="ba" style={{ '--p': `${pos}%` }}>
      <img className="ba__base" src={after} alt={afterAlt} loading="lazy" />
      <img
        className="ba__overlay"
        src={before}
        alt={beforeAlt}
        loading="lazy"
        style={{ clipPath: `inset(0 calc(100% - ${pos}%) 0 0)` }}
      />
      <span className="ba__label ba__label--l">{beforeLabel}</span>
      <span className="ba__label ba__label--r">{afterLabel}</span>
      <span className="ba__divider" style={{ left: `${pos}%` }} aria-hidden="true" />
      <input
        className="ba__range"
        type="range"
        min="0"
        max="100"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Vorher-Nachher-Regler"
      />
    </div>
  )
}
