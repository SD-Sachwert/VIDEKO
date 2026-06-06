import Reveal from './Reveal.jsx'

/**
 * Standardised hero for sub-pages: optional 16:9 background image with a
 * legibility veil, kicker, large serif title and lead. `title` accepts JSX
 * (for gold accents).
 */
export default function PageHero({ kicker, title, lead, image, children, className = '' }) {
  return (
    <section className={`pagehero ${className}`.trim()}>
      {image && (
        <div className="pagehero__media" aria-hidden="true">
          <img src={image} alt="" className="pagehero__img" />
          <div className="pagehero__veil" />
        </div>
      )}
      <div className="container pagehero__inner">
        <Reveal>
          {kicker && <span className="kicker kicker--gold">{kicker}</span>}
          <h1 className="pagehero__title">{title}</h1>
          {lead && <p className="pagehero__lead">{lead}</p>}
          {children && <div className="pagehero__actions">{children}</div>}
        </Reveal>
      </div>
    </section>
  )
}
