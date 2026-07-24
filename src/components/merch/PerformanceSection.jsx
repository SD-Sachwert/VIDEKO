import { useMemo, useState } from 'react'
import { ArrowRight, Clock, Repeat, Bell, Check } from 'lucide-react'

import Reveal from '../Reveal.jsx'
import { useCart } from '../../shop/cart-context.js'
import {
  PERFORMANCE_PRODUCTS,
  PERFORMANCE_CATEGORIES,
} from '../../data/performance.js'

/**
 * Einzelne Performance-Produktkarte.
 *
 * COMING SOON: kein Preis, kein Kauf-Button. Produkte mit Vorder- UND
 * Rückseite (hasBack) zeigen einen kleinen Umschalter direkt in der Karte –
 * so bleibt es EINE Karte pro Produkt statt doppelter Bilder.
 */
function PerfCard({ product, delay = 0 }) {
  const { notify, notified } = useCart()
  const [idx, setIdx] = useState(0)
  const bild = product.images[idx] || product.images[0]
  const seite = idx === 0 ? 'Vorderseite' : 'Rückseite'
  const gemeldet = notified.includes(product.id)

  return (
    <Reveal className="perf-card" delay={delay}>
      <div className="perf-card__media">
        <img
          src={bild}
          alt={`${product.alt} – ${seite}`}
          loading="lazy"
          decoding="async"
          width="1000"
          height="1000"
        />
        <span className="perf-card__badge"><Clock size={12} strokeWidth={2} /> Coming Soon</span>
        {product.hasBack && (
          <button
            type="button"
            className="perf-card__flip"
            onClick={() => setIdx((i) => (i === 0 ? 1 : 0))}
            aria-label={idx === 0 ? `${product.name} Rückseite ansehen` : `${product.name} Vorderseite ansehen`}
          >
            <Repeat size={13} strokeWidth={1.9} /> {idx === 0 ? 'Rückseite' : 'Vorderseite'}
          </button>
        )}
      </div>

      <div className="perf-card__body">
        <span className="perf-card__type">{product.typeLabel}</span>
        <strong className="perf-card__name">{product.name}</strong>
        <p className="perf-card__sub">{product.sub}</p>
        <span className="perf-card__color">
          <span className="perf-card__dot" style={{ background: product.color.hex }} aria-hidden="true" />
          {product.color.label}
        </span>
        <button
          type="button"
          className={`perf-card__notify ${gemeldet ? 'is-done' : ''}`.trim()}
          onClick={() => notify(product, product.color?.label || null)}
        >
          {gemeldet
            ? (<><Check size={14} strokeWidth={2} /> Vorgemerkt</>)
            : (<><Bell size={14} strokeWidth={1.8} /> Benachrichtige mich</>)}
        </button>
      </div>
    </Reveal>
  )
}

/**
 * VIDEKO PERFORMANCE – eigenständige, klar abgegrenzte Sektion für die
 * kommende Sport-/Performance-Kollektion. Bewusst ohne Preise/Kauf, dafür mit
 * COMING SOON. Nutzt die bestehende Bild- und Kartensprache des Shops.
 */
export default function PerformanceSection() {
  const [cat, setCat] = useState('alle')

  const gefiltert = useMemo(
    () => (cat === 'alle'
      ? PERFORMANCE_PRODUCTS
      : PERFORMANCE_PRODUCTS.filter((p) => p.type === cat)),
    [cat],
  )

  return (
    <section className="perf" id="performance" aria-labelledby="perf-title">
      {/* Sportlicher Gold-Akzent, dezent im Hintergrund */}
      <span className="perf__accent" aria-hidden="true" />

      <div className="container">
        <Reveal as="header" className="perf__head">
          <span className="perf__eyebrow">Neue Kollektion</span>
          <h2 className="perf__title" id="perf-title">VIDEKO <em>PERFORMANCE</em></h2>
          <p className="perf__tagline">Performance trifft Design.</p>
          <span className="perf__soon"><Clock size={13} strokeWidth={2} /> Coming Soon</span>
          <p className="perf__intro">
            Entwickelt für Bewegung. Gemacht für Aufmerksamkeit. Die neue VIDEKO Performance
            Collection verbindet funktionale Sportswear mit unserem unverwechselbaren Design.
          </p>
        </Reveal>

        <div className="perf__cats" role="group" aria-label="Performance-Kategorie filtern">
          {PERFORMANCE_CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.key}
              className={`perf__cat ${cat === c.key ? 'is-active' : ''}`.trim()}
              onClick={() => setCat(c.key)}
              aria-pressed={cat === c.key}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="perf__grid">
          {gefiltert.map((p, i) => (
            <PerfCard key={p.id} product={p} delay={(i % 4) * 0.05} />
          ))}
        </div>

        <p className="perf__note">
          Die Performance-Kollektion ist noch nicht bestellbar. Abbildungen sind Musteransichten –
          sobald die ersten Serien produziert sind, folgen echte Produktfotos und Verkaufsstart.
          <ArrowRight size={14} strokeWidth={2} />
        </p>
      </div>
    </section>
  )
}
