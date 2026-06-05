import { X, Check } from 'lucide-react'
import Reveal from './Reveal.jsx'

/**
 * Two-column comparison: left = the thing to avoid, right = VIDEKO.
 * left/right = { title, items: string[] }
 */
export default function ComparisonTable({ left, right }) {
  return (
    <div className="cmp">
      <Reveal className="cmp__col cmp__col--bad">
        <h3 className="cmp__title">{left.title}</h3>
        <ul>
          {left.items.map((i) => (
            <li key={i}>
              <X size={16} strokeWidth={2.4} />
              {i}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal className="cmp__col cmp__col--good" delay={0.08}>
        <h3 className="cmp__title">{right.title}</h3>
        <ul>
          {right.items.map((i) => (
            <li key={i}>
              <Check size={16} strokeWidth={2.4} />
              {i}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  )
}
