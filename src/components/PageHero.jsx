import Reveal from './Reveal.jsx'
import { KiHinweis } from './legal/KiKennzeichnung.jsx'

/**
 * Standardised hero for sub-pages: optional 16:9 background image with a
 * legibility veil, kicker, large serif title and lead. `title` accepts JSX
 * (for gold accents). `aiImage` blendet eine dezente KI-Bildunterschrift ein,
 * wenn das Hintergrundbild KI-generiert ist (EU AI Act Art. 50).
 */
export default function PageHero({ kicker, title, lead, image, children, className = '', aiImage = false }) {
  return (
    <section className={`pagehero ${className}`.trim()}>
      {image && (
        <div className="pagehero__media">
          <img src={image} alt="" className="pagehero__img" aria-hidden="true" />
          <div className="pagehero__veil" aria-hidden="true" />
          {aiImage && <KiHinweis className="pagehero__ainote" />}
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
