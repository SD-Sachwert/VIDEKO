import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MERCH_PRODUCTS,
  SHIPPING_COST,
  FREE_SHIPPING_FROM,
  PERSONALIZATION_MAX,
  ORDER_MAIL,
  personalizationPrice,
  formatPrice,
} from '../data/merch.js'
import { CartContext } from './cart-context.js'
import { pingInterest } from './notifyService.js'

const STORAGE_KEY = 'videko-merch-cart'
const WISH_KEY = 'videko-merch-wishlist'
const NOTIFY_KEY = 'videko-merch-notify'

const readStore = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeStore = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* privater Modus o. ae. – Warenkorb bleibt dann nur fuer die Sitzung */
  }
}

/**
 * Warenkorb-Zeile eindeutig ueber Produkt + Groesse + Farbe + Namensdruck.
 * Zwei Shirts mit unterschiedlichem Namen sind zwei Zeilen, kein Mengen-Plus.
 */
const lineKey = (id, size, color, pers, placement) =>
  `${id}::${size || '-'}::${color || '-'}::${pers || '-'}::${placement || '-'}`

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => readStore(STORAGE_KEY, []))
  const [wishlist, setWishlist] = useState(() => readStore(WISH_KEY, []))
  const [notified, setNotified] = useState(() => readStore(NOTIFY_KEY, []))
  const [open, setOpen] = useState(false)

  useEffect(() => writeStore(STORAGE_KEY, lines), [lines])
  useEffect(() => writeStore(WISH_KEY, wishlist), [wishlist])
  useEffect(() => writeStore(NOTIFY_KEY, notified), [notified])

  const add = useCallback((product, opts = {}) => {
    if (product.soon || product.price == null) return
    const { size = null, color = null, qty = 1, placement = null, placementLabel = null } = opts
    const pers = product.personalizable && opts.pers
      ? String(opts.pers).trim().slice(0, PERSONALIZATION_MAX)
      : null
    const key = lineKey(product.id, size, color, pers, placement)
    setLines((prev) => {
      const hit = prev.find((l) => l.key === key)
      if (hit) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, 99) } : l))
      return [...prev, { key, id: product.id, size, color, pers: pers || null, placement, placementLabel, qty }]
    })
    setOpen(true)
  }, [])

  const setQty = useCallback((key, qty) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 99) } : l))
    )
  }, [])

  const remove = useCallback((key) => setLines((prev) => prev.filter((l) => l.key !== key)), [])
  const clear = useCallback(() => setLines([]), [])

  const toggleWish = useCallback((id) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]))
  }, [])

  /**
   * Benachrichtigung fuer noch nicht bestellbare Artikel.
   * `notify` oeffnet das Modal mit vorbelegtem Produkt und (optional) Variante.
   * Die eigentliche Anfrage laeuft ueber den notifyService; erst bei Erfolg
   * markiert die UI das Produkt via `markNotified` als vorgemerkt.
   */
  const [notifyTarget, setNotifyTarget] = useState(null)
  const notify = useCallback((product, variant = null) => {
    setNotifyTarget({ product, variant })
    // Interesse sofort ans Team melden – nicht erst beim Absenden der E-Mail.
    pingInterest({ productId: product.id, productName: product.name, variant })
  }, [])
  const closeNotify = useCallback(() => setNotifyTarget(null), [])
  const markNotified = useCallback((id) => {
    setNotified((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  /** Zeilen mit Produktdaten anreichern; unbekannte IDs fallen raus */
  const detailed = useMemo(
    () =>
      lines
        .map((l) => {
          const product = MERCH_PRODUCTS.find((p) => p.id === l.id)
          if (!product || product.price == null) return null
          const unit = product.price + (l.pers ? personalizationPrice(product) : 0)
          return { ...l, product, unit, total: unit * l.qty }
        })
        .filter(Boolean),
    [lines]
  )

  const count = useMemo(() => detailed.reduce((n, l) => n + l.qty, 0), [detailed])
  const subtotal = useMemo(() => detailed.reduce((n, l) => n + l.total, 0), [detailed])
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  /**
   * Bestellung per Mail. Ersetzt spaeter den Checkout eines Shopsystems –
   * die Zeilenstruktur bleibt dabei dieselbe.
   */
  const checkout = useCallback(() => {
    if (!detailed.length) return
    const zeilen = detailed
      .map(
        (l) =>
          `${l.qty}x ${l.product.name}` +
          (l.size ? `, Größe ${l.size}` : '') +
          (l.color ? `, Farbe ${l.color}` : '') +
          (l.placementLabel ? `, ${l.placementLabel}` : '') +
          (l.pers ? `, Namensdruck „${l.pers}"` : '') +
          ` – ${formatPrice(l.total)}`
      )
      .join('\n')

    const body =
      `Hallo VIDEKO-Team,\n\nich möchte folgende Artikel bestellen:\n\n${zeilen}\n\n` +
      `Zwischensumme: ${formatPrice(subtotal)}\n` +
      `Versand: ${shipping === 0 ? 'kostenlos' : formatPrice(shipping)}\n` +
      `Gesamt: ${formatPrice(total)}\n\n` +
      `Lieferadresse:\n\n\nViele Grüße\n`

    window.location.href =
      `mailto:${ORDER_MAIL}?subject=${encodeURIComponent('Merch-Bestellung VIDEKO')}` +
      `&body=${encodeURIComponent(body)}`
  }, [detailed, subtotal, shipping, total])

  const value = useMemo(
    () => ({
      lines: detailed,
      count,
      subtotal,
      shipping,
      total,
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
      wishlist,
      toggleWish,
      notified,
      notify,
      notifyTarget,
      closeNotify,
      markNotified,
      checkout,
    }),
    [detailed, count, subtotal, shipping, total, open, add, setQty, remove, clear, wishlist, toggleWish, notified, notify, notifyTarget, closeNotify, markNotified, checkout]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
