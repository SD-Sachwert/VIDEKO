import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ArrowRight } from 'lucide-react'

import Reveal from '../Reveal.jsx'
import { useCart } from '../../shop/cart-context.js'
import { formatPrice, LOGO_STYLE_INFO, SHOW_PUBLIC_PRICES, PRICE_ON_REQUEST } from '../../data/merch.js'

/**
 * Karte einer Produktfamilie im Grid.
 *
 * Zeigt bewusst nur Bild, Name, Preis ab, Farbtupfer, Badge, CTA und Wishlist –
 * Groesse und Logo-Platzierung werden erst auf der Produktseite gewaehlt. So
 * ersetzt eine Karte die frueheren bis zu zwölf Einzelvarianten.
 */
export default function FamilyCard({ family, delay = 0 }) {
  const { wishlist, toggleWish } = useCart()
  const gemerkt = wishlist.includes(family.slug)
  const preis = !SHOW_PUBLIC_PRICES
    ? PRICE_ON_REQUEST
    : family.priceFrom == null
      ? 'Preis folgt'
      : `ab ${formatPrice(family.priceFrom)}`

  // Farbwechsel direkt in der Karte: die gewaehlte Farbe bestimmt Bild und den
  // Einstiegs-Slug. Start ist die repraesentative Farbe (dieselbe wie das
  // Standard-Kartenbild). Ohne echte Farbauswahl bleibt alles wie gehabt.
  const optionen = family.colorOptions || []
  const mehrfarbig = optionen.length > 1
  const [aktivKey, setAktivKey] = useState(family.repColorKey ?? optionen[0]?.key ?? null)
  const aktiv = optionen.find((c) => c.key === aktivKey) || null

  const bild = aktiv?.image ?? family.image
  const ziel = aktiv?.slug ?? family.slug
  // „Produktbild folgt" nur, wenn auch die aktuell gewaehlte Farbe kein echtes
  // Bild hat – sonst waere die Kennzeichnung irrefuehrend.
  const nurPlatzhalter = aktiv ? !aktiv.hasRealImage : !family.hasRealImage

  return (
    <Reveal className={`pcard pcard--family ${family.allSoon ? 'pcard--soon' : ''}`.trim()} delay={delay}>
      <Link className="pcard__media" to={`/merch/${ziel}`} aria-label={`${family.label} ansehen`}>
        <img src={bild} alt={`${family.label}${aktiv ? ` – ${aktiv.label}` : ''} – VIDEKO Merch`} loading="lazy" decoding="async" width="1000" height="1000" className={nurPlatzhalter ? "is-placeholder" : undefined} />
        {family.badge && <span className="pcard__badge">{family.badge}</span>}
      </Link>

      <button
        type="button"
        className={`pcard__wish ${gemerkt ? 'is-on' : ''}`.trim()}
        onClick={() => toggleWish(family.slug)}
        aria-pressed={gemerkt}
        aria-label={gemerkt ? `${family.label} von der Merkliste entfernen` : `${family.label} merken`}
      >
        <Heart size={15} strokeWidth={1.8} fill={gemerkt ? 'currentColor' : 'none'} />
      </button>

      <div className="pcard__body">
        <span className="pcard__coll">{family.styles.map((s) => LOGO_STYLE_INFO[s].label).join(' · ')}</span>
        <Link className="pcard__name" to={`/merch/${ziel}`}>{family.label}</Link>
        <span className={`pcard__price ${!SHOW_PUBLIC_PRICES || family.priceFrom == null ? 'pcard__price--offen' : ''}`.trim()}>{preis}</span>

        {mehrfarbig ? (
          <div className="pcard__colors" role="group" aria-label="Farbe wählen">
            {optionen.map((c) => (
              <button
                type="button"
                key={c.key}
                className={`pcard__color ${c.key === aktivKey ? 'is-active' : ''}`.trim()}
                title={c.label}
                aria-label={`${family.label} in ${c.label}`}
                aria-pressed={c.key === aktivKey}
                onClick={() => setAktivKey(c.key)}
              >
                <span style={{ background: c.hex }} aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : optionen.length === 1 && (
          <div className="pcard__colors" aria-label="Verfügbare Farbe">
            <span className="pcard__color pcard__color--static" title={optionen[0].label}>
              <span style={{ background: optionen[0].hex }} aria-hidden="true" />
            </span>
          </div>
        )}

        <Link className="pcard__add pcard__add--ghost" to={`/merch/${ziel}`}>
          Modell ansehen <ArrowRight size={14} strokeWidth={1.9} />
        </Link>
      </div>
    </Reveal>
  )
}
