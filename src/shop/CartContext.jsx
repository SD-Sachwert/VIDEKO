import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './cart-context.js'

/**
 * MERKLISTEN-Provider (früher „Warenkorb").
 *
 * Livegang-Audit / Anfragemodell: Der Merch-Bereich schließt über die Website
 * KEINEN Vertrag mehr ab und speichert nichts auf Klick. Es gibt daher
 *   - keinen Warenkorb / Checkout,
 *   - keine „Benachrichtige mich"-Vormerkung (kein Supabase, kein SMTP im Merch),
 *   - keine Zahlungs-/Bestelllogik.
 *
 * Übrig bleibt allein die rein lokale, funktionale MERKLISTE (Herz-Icon). Sie
 * lebt ausschließlich im localStorage des Browsers – es werden KEINE Daten an
 * uns oder Dritte übertragen (§ 25 Abs. 2 TDDDG, funktional erforderlich).
 *
 * Der Provider heißt aus Kompatibilitätsgründen weiterhin `CartProvider`, führt
 * aber nur noch `wishlist` / `toggleWish`.
 */

const WISH_KEY = 'videko-merch-wishlist'

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
    /* privater Modus o. ä. – Merkliste bleibt dann nur für die Sitzung */
  }
}

export function CartProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => readStore(WISH_KEY, []))

  useEffect(() => writeStore(WISH_KEY, wishlist), [wishlist])

  const toggleWish = useCallback((id) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]))
  }, [])

  const value = useMemo(() => ({ wishlist, toggleWish }), [wishlist, toggleWish])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
