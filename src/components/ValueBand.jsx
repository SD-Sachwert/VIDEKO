import { Gem, Hammer, Layers, MessageSquare } from 'lucide-react'

const VALUES = [
  {
    icon: Gem,
    title: 'Design mit Seele',
    text: 'Ästhetik, die berührt und bleibt.',
  },
  {
    icon: Hammer,
    title: 'Handwerk auf höchstem Niveau',
    text: 'Präzision, Erfahrung und Leidenschaft.',
  },
  {
    icon: Layers,
    title: 'Materialien für Generationen',
    text: 'Ausgewählt für Qualität, Beständigkeit und Wert.',
  },
  {
    icon: MessageSquare,
    title: 'Beratung auf Augenhöhe',
    text: 'Individuell, ehrlich und inspirierend.',
  },
]

/**
 * Floating glass/stone panel of brand values. Sits over the hero image.
 */
export default function ValueBand() {
  return (
    <div className="valueband">
      {VALUES.map(({ icon: Icon, title, text }, i) => (
        <div className="valueband__item" key={title}>
          <span className="valueband__icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.5} />
          </span>
          <div className="valueband__copy">
            <span className="valueband__title">{title}</span>
            <span className="valueband__text">{text}</span>
          </div>
          {i < VALUES.length - 1 && (
            <span className="valueband__divider" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}
