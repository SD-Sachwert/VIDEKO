import { motion } from 'framer-motion'
import { ArrowRight, Check, X } from 'lucide-react'
import CTAButton from '../CTAButton.jsx'

/**
 * One full-height overlay section. Section is pointer-events:none so scroll/hover
 * reaches the 3D canvas; only the frosted panel is interactive.
 */
export default function ExperienceSection({ id, align = 'left', eyebrow, lines, sub, compare, primary, secondary }) {
  return (
    <section className={`xp-sec xp-sec--${align}`} id={id}>
      <motion.div
        className="xp-sec__inner"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {eyebrow && <span className="xp-sec__eyebrow">{eyebrow}</span>}
        <h2 className="xp-sec__title">
          {lines.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </h2>
        {sub && <p className="xp-sec__sub">{sub}</p>}

        {compare && (
          <div className="xp-compare">
            <div className="xp-compare__col xp-compare__col--bad">
              <span className="xp-compare__head">{compare.left.title}</span>
              <ul>{compare.left.items.map((t) => <li key={t}><X size={13} strokeWidth={2.6} /> {t}</li>)}</ul>
            </div>
            <div className="xp-compare__col xp-compare__col--good">
              <span className="xp-compare__head">{compare.right.title}</span>
              <ul>{compare.right.items.map((t) => <li key={t}><Check size={13} strokeWidth={2.6} /> {t}</li>)}</ul>
            </div>
          </div>
        )}

        <div className="xp-sec__cta">
          {primary && (primary.to
            ? <CTAButton to={primary.to}>{primary.label}</CTAButton>
            : <a className="xp-link xp-link--solid" href={primary.href}>{primary.label}</a>)}
          {secondary && (
            <a className="xp-link" href={secondary.href || '#'}>
              {secondary.label} <ArrowRight size={16} strokeWidth={1.9} />
            </a>
          )}
        </div>
      </motion.div>
    </section>
  )
}
