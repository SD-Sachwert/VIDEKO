/**
 * Generic premium card. Supports an optional 16:9 image, a lucide icon,
 * eyebrow, title and text. Used for Lebenssituationen, Werte, Service, Benefits.
 */
export default function FeatureCard({ icon: Icon, image, eyebrow, title, text, className = '' }) {
  return (
    <article className={`featcard ${image ? 'featcard--media' : ''} ${className}`.trim()}>
      {image && (
        <div className="featcard__media">
          <img src={image} alt="" loading="lazy" />
          <span className="featcard__scrim" aria-hidden="true" />
        </div>
      )}
      <div className="featcard__body">
        {Icon && (
          <span className="featcard__icon" aria-hidden="true">
            <Icon size={22} strokeWidth={1.4} />
          </span>
        )}
        {eyebrow && <span className="featcard__eyebrow">{eyebrow}</span>}
        <h3 className="featcard__title">{title}</h3>
        {text && <p className="featcard__text">{text}</p>}
      </div>
    </article>
  )
}
