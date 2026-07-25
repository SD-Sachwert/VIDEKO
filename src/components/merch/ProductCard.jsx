import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Eye, ShoppingBag, BellRing } from 'lucide-react'

import Reveal from '../Reveal.jsx'
import { useCart } from '../../shop/cart-context.js'
import { formatPrice, SHOW_PUBLIC_PRICES, PRICE_ON_REQUEST } from '../../data/merch.js'
import { canInquire } from '../../data/release.js'
import { sendInterest } from '../../shop/notify.js'

/**
 * Produktkarte im Grid.
 *
 * Farbwechsel fuehrt auf das Schwesterprodukt derselben Variantengruppe –
 * gleicher Schnitt, andere Farbe ist ein eigenes Produkt mit eigenem Slug.
 */
export default function ProductCard({ product, delay = 0 }) {
  const { wishlist, toggleWish } = useCart()
  const mehrereGroessen = product.sizes?.length > 1
  const [size, setSize] = useState(product.sizes ? product.sizes[2] || product.sizes[0] : null)
  const gemerkt = wishlist.includes(product.id)
  const kannAnfragen = canInquire(product)

  // § 7: Herz auf Coming-soon-Produkten meldet beim Aktivieren einmalig
  // anonymes Interesse (ohne personenbezogene Daten). Sonst nur lokal merken.
  const merkenUndInteresse = () => {
    if (product.soon && !gemerkt) sendInterest({ productName: product.name, productId: product.id, variant: '' })
    toggleWish(product.id)
  }

  // Farbwechsel innerhalb desselben Produkts (z. B. Sneaker Gold-Logo /
  // Ton-in-Ton): mehrere Farben, die 1:1 auf die Galeriebilder abgebildet sind.
  // Nur wenn es KEINE Schwesterprodukte (variantGroup) gibt – die sind eigene
  // Slugs und werden weiter unten als Links gezeigt.
  const geschwister = product.variants?.length > 1
  const intraFarben =
    !geschwister && product.colors?.length > 1 && product.gallery?.length === product.colors.length
      ? product.colors.map((c, i) => ({ ...c, image: product.gallery[i] }))
      : null
  const [farbIdx, setFarbIdx] = useState(0)
  const aktiveFarbe = intraFarben ? intraFarben[farbIdx] : null
  const kartenBild = aktiveFarbe?.image ?? product.image

  return (
    <Reveal className={`pcard ${product.soon ? 'pcard--soon' : ''}`.trim()} delay={delay}>
      <Link className="pcard__media" to={`/merch/${product.slug}`} aria-label={`${product.name} ansehen`}>
        <img src={kartenBild} alt={`${product.name}${aktiveFarbe ? ` – ${aktiveFarbe.label}` : ''} – Produktansicht`} loading="lazy" decoding="async" width="1000" height="1000" />
        {product.badge && <span className="pcard__badge">{product.badge}</span>}
      </Link>

      <button
        type="button"
        className={`pcard__wish ${gemerkt ? 'is-on' : ''}`.trim()}
        onClick={merkenUndInteresse}
        aria-pressed={gemerkt}
        aria-label={gemerkt ? `${product.name} von der Merkliste entfernen` : product.soon ? `Interesse an ${product.name} markieren` : `${product.name} merken`}
      >
        <Heart size={15} strokeWidth={1.8} fill={gemerkt ? 'currentColor' : 'none'} />
      </button>

      <div className="pcard__body">
        <span className="pcard__coll">{product.collection}</span>
        <Link className="pcard__name" to={`/merch/${product.slug}`}>{product.name}</Link>
        <span className={`pcard__price ${!SHOW_PUBLIC_PRICES || product.price == null ? 'pcard__price--offen' : ''}`.trim()}>
          {!SHOW_PUBLIC_PRICES ? PRICE_ON_REQUEST : product.price == null ? product.priceNote : formatPrice(product.price)}
        </span>

        {geschwister ? (
          <div className="pcard__colors" role="group" aria-label="Farbe wählen">
            {product.variants.map((v) => (
              <Link
                key={v.slug}
                to={`/merch/${v.slug}`}
                className={`pcard__color ${v.istDieses ? 'is-active' : ''}`.trim()}
                title={v.label}
                aria-label={`${product.name} in ${v.label}`}
                aria-current={v.istDieses}
              >
                <span style={{ background: v.hex }} aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : intraFarben && (
          <div className="pcard__colors" role="group" aria-label="Farbe wählen">
            {intraFarben.map((c, i) => (
              <button
                type="button"
                key={c.key || c.label}
                className={`pcard__color ${i === farbIdx ? 'is-active' : ''}`.trim()}
                title={c.label}
                aria-label={`${product.name} in ${c.label}`}
                aria-pressed={i === farbIdx}
                onClick={() => setFarbIdx(i)}
              >
                <span style={{ background: c.hex }} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {/* Einheitsgroesse braucht keine Auswahl */}
        {mehrereGroessen && (
          <div className="pcard__sizes" role="group" aria-label={`Größe wählen für ${product.name}`}>
            {product.sizes.map((s) => (
              <button
                type="button"
                key={s}
                className={`pcard__size ${size === s ? 'is-active' : ''}`.trim()}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                disabled={product.soon}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {product.soon ? (
          <Link className="pcard__add pcard__add--notify" to={`/merch/${product.slug}?benachrichtigen=1`}>
            Benachrichtige mich <BellRing size={14} strokeWidth={1.9} />
          </Link>
        ) : kannAnfragen ? (
          <Link className="pcard__add" to={`/merch/${product.slug}`}>
            In den Warenkorb <ShoppingBag size={14} strokeWidth={1.9} />
          </Link>
        ) : (
          <Link className="pcard__add pcard__add--preview" to={`/merch/${product.slug}`}>
            Vorschau ansehen <Eye size={14} strokeWidth={1.9} />
          </Link>
        )}
      </div>
    </Reveal>
  )
}
