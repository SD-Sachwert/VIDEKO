import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

import { useCart } from '../../shop/cart-context.js'
import { formatPrice, FREE_SHIPPING_FROM } from '../../data/merch.js'

export default function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, subtotal, shipping, total, checkout } = useCart()

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const fehlt = FREE_SHIPPING_FROM - subtotal

  return (
    <>
      <div
        className={`cartdr__backdrop ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`cartdr ${open ? 'is-open' : ''}`}
        aria-label="Warenkorb"
        aria-hidden={!open}
        inert={!open}
      >
        <header className="cartdr__head">
          <span className="cartdr__title">Dein Warenkorb ({lines.length})</span>
          <button type="button" className="cartdr__close" onClick={() => setOpen(false)} aria-label="Warenkorb schließen">
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="cartdr__empty">
            <ShoppingBag size={26} strokeWidth={1.4} />
            <p>Noch nichts drin.</p>
            <button type="button" className="cartdr__ghost" onClick={() => setOpen(false)}>
              Weiter stöbern
            </button>
          </div>
        ) : (
          <>
            <div className="cartdr__lines">
              {lines.map((l) => (
                <div className="cartline" key={l.key}>
                  <img className="cartline__img" src={l.product.image} alt="" loading="lazy" />
                  <div className="cartline__body">
                    <span className="cartline__name">{l.product.name}</span>
                    <span className="cartline__meta">
                      {[l.color, l.size && `Größe ${l.size}`, l.placementLabel].filter(Boolean).join(' · ') || l.product.variant}
                    </span>
                    {l.pers && <span className="cartline__meta cartline__meta--pers">Namensdruck: „{l.pers}“</span>}
                    <span className="cartline__price">{formatPrice(l.total)}</span>
                  </div>
                  <div className="cartline__actions">
                    <div className="cartline__qty">
                      <button type="button" onClick={() => setQty(l.key, l.qty - 1)} aria-label="Menge verringern">
                        <Minus size={13} strokeWidth={2.2} />
                      </button>
                      <span>{l.qty}</span>
                      <button type="button" onClick={() => setQty(l.key, l.qty + 1)} aria-label="Menge erhöhen">
                        <Plus size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                    <button type="button" className="cartline__del" onClick={() => remove(l.key)} aria-label={`${l.product.name} entfernen`}>
                      <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <footer className="cartdr__foot">
              <div className="cartdr__row">
                <span>Zwischensumme</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="cartdr__row">
                <span>Versandkosten</span>
                <span>{shipping === 0 ? 'kostenlos' : formatPrice(shipping)}</span>
              </div>
              <div className="cartdr__row cartdr__row--total">
                <span>Gesamtsumme</span>
                <span>{formatPrice(total)}</span>
              </div>
              <span className="cartdr__vat">inkl. MwSt.</span>

              <button type="button" className="cartdr__cta" onClick={checkout}>
                Zur Kasse
              </button>
              <p className="cartdr__hint">
                {fehlt > 0
                  ? `Noch ${formatPrice(fehlt)} bis zum kostenlosen Versand.`
                  : 'Versand kostenlos.'}
              </p>
              <p className="cartdr__note">
                Der Online-Checkout ist noch nicht angebunden – „Zur Kasse“ öffnet eine
                vorausgefüllte Bestell-Mail an uns. Der Kaufvertrag kommt erst mit unserer
                Auftragsbestätigung zustande.
              </p>
              <nav className="cartdr__legal" aria-label="Rechtliche Informationen">
                <Link to="/agb" onClick={() => setOpen(false)}>AGB</Link>
                <Link to="/rueckgabe-widerruf" onClick={() => setOpen(false)}>Widerruf</Link>
                <Link to="/versand-lieferung" onClick={() => setOpen(false)}>Versand</Link>
                <Link to="/datenschutz" onClick={() => setOpen(false)}>Datenschutz</Link>
              </nav>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
