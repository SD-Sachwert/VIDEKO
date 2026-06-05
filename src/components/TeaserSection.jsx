import Reveal from './Reveal.jsx'
import CTAButton from './CTAButton.jsx'

/**
 * Alternating image/copy teaser that points to a sub-page.
 * reverse → image right; tone="dark" → dark band.
 */
export default function TeaserSection({
  kicker, title, text, image, to, ctaLabel = 'Mehr entdecken', reverse = false, tone = 'light',
}) {
  return (
    <section className={`teaser ${reverse ? 'teaser--reverse' : ''} ${tone === 'dark' ? 'teaser--dark' : ''}`.trim()}>
      <div className="container teaser__inner">
        <Reveal className="teaser__media">
          <div className="teaser__frame">
            <img src={image} alt="" loading="lazy" />
            <span className="teaser__rim" aria-hidden="true" />
          </div>
        </Reveal>
        <Reveal className="teaser__copy" delay={0.06}>
          {kicker && <span className="kicker">{kicker}</span>}
          <h2 className="teaser__title">{title}</h2>
          {text && <p className="teaser__text">{text}</p>}
          <CTAButton to={to}>{ctaLabel}</CTAButton>
        </Reveal>
      </div>
    </section>
  )
}
