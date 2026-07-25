import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2, Mail, ShoppingBag } from 'lucide-react'

import { useCart } from '../../shop/cart-context.js'
import { formatPrice } from '../../data/merch.js'
import { openInquiryList, INQUIRY_DISCLAIMER } from '../../shop/inquiry.js'

/**
 * „Deine Anfrageliste" (§ 3/§ 4).
 *
 * Ein seitliches Panel, das die rein lokal gemerkten Signature-Shirt-Varianten
 * zeigt. Der Nutzer kann Positionen entfernen, die Menge ändern oder alles per
 * unverbindlicher E-Mail gemeinsam anfragen. Es ist KEIN Warenkorb im
 * Rechtssinne: kein Checkout, keine Bestellung, keine Zahlung, keine
 * Bestellnummer, keine Server-Speicherung.
 */
export default function AnfragelisteDrawer() {
  const {
    inquiryItems, updateInquiryQty, removeInquiry, clearInquiry,
    inquiryCount, inquirySubtotal, anfrageOpen, closeAnfrage,
  } = useCart()

  useEffect(() => {
    if (!anfrageOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') closeAnfrage() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [anfrageOpen, closeAnfrage])

  if (!anfrageOpen) return null

  const leer = inquiryItems.length === 0
  const alleMitPreis = inquiryItems.every((i) => i.unitPrice != null)

  return (
    <div className="anfrage" role="dialog" aria-modal="true" aria-label="Dein Warenkorb">
      <button type="button" className="anfrage__backdrop" aria-label="Schließen" onClick={closeAnfrage} />
      <aside className="anfrage__panel">
        <header className="anfrage__head">
          <h2 className="anfrage__title">
            <ShoppingBag size={18} strokeWidth={1.9} /> Dein Warenkorb
          </h2>
          <button type="button" className="anfrage__close" onClick={closeAnfrage} aria-label="Warenkorb schließen">
            <X size={20} strokeWidth={1.9} />
          </button>
        </header>

        {leer ? (
          <div className="anfrage__empty">
            <p>Dein Warenkorb ist noch leer.</p>
            <p className="anfrage__emptysub">
              Wähle auf einer Produktseite Farbe, Größe und Logoausführung und lege die
              Variante in den Warenkorb. Von hier aus schickst du deine Auswahl
              unverbindlich per E-Mail ab – wir melden uns mit einem Angebot.
            </p>
            <Link className="anfrage__shoplink" to="/merch" onClick={closeAnfrage}>Zu den Shirts</Link>
          </div>
        ) : (
          <>
            <ul className="anfrage__list">
              {inquiryItems.map((it) => (
                <li className="anfrage__item" key={it.sku}>
                  {it.image && <img className="anfrage__img" src={it.image} alt="" width="72" height="72" loading="lazy" />}
                  <div className="anfrage__meta">
                    <p className="anfrage__name">{it.productName}</p>
                    <p className="anfrage__variant">
                      {[it.colorLabel, it.sizeLabel && `Größe ${it.sizeLabel}`, it.logoLabel && it.logoLabel !== '—' ? it.logoLabel : null]
                        .filter(Boolean).join(' · ')}
                    </p>
                    {it.note && <p className="anfrage__note">{it.note}</p>}
                    <p className="anfrage__sku">Art.-Nr.: {it.sku}</p>
                    <div className="anfrage__row">
                      <div className="anfrage__qty">
                        <button type="button" onClick={() => updateInquiryQty(it.sku, (it.qty || 1) - 1)} aria-label="Menge verringern"><Minus size={13} strokeWidth={2.2} /></button>
                        <span>{it.qty || 1}</span>
                        <button type="button" onClick={() => updateInquiryQty(it.sku, (it.qty || 1) + 1)} aria-label="Menge erhöhen"><Plus size={13} strokeWidth={2.2} /></button>
                      </div>
                      <span className="anfrage__price">
                        {it.unitPrice != null ? formatPrice(it.unitPrice * (it.qty || 1)) : 'auf Anfrage'}
                      </span>
                      <button type="button" className="anfrage__remove" onClick={() => removeInquiry(it.sku)} aria-label="Position entfernen">
                        <Trash2 size={15} strokeWidth={1.9} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="anfrage__foot">
              <div className="anfrage__sum">
                <span>Unverbindliche Zwischensumme{alleMitPreis ? '' : ' (teilweise auf Anfrage)'}</span>
                <strong>{alleMitPreis ? formatPrice(inquirySubtotal) : 'auf Anfrage'}</strong>
              </div>
              <p className="anfrage__shipnote">zzgl. Versand – die Versandkosten nennen wir mit dem individuellen Angebot.</p>

              <button type="button" className="anfrage__send" onClick={() => openInquiryList(inquiryItems)}>
                Unverbindliche Anfrage per E-Mail senden <Mail size={16} strokeWidth={1.9} />
              </button>
              <p className="anfrage__disclaimer">{INQUIRY_DISCLAIMER}</p>

              <div className="anfrage__actions">
                <span className="anfrage__count">{inquiryCount} {inquiryCount === 1 ? 'Position' : 'Positionen'}</span>
                <button type="button" className="anfrage__clear" onClick={clearInquiry}>Liste leeren</button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
