import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './cart-context.js'

/**
 * Provider für die beiden rein LOKALEN Merkzustände des Merch-Bereichs.
 *
 * WICHTIG – Anfragemodell, KEIN Verkauf über die Website:
 *   1. `wishlist` / `toggleWish` – funktionale Merkliste (Herz). Nur localStorage.
 *   2. `inquiry*` – „Deine Anfrageliste". Sammelt die vom Nutzer gewählten
 *      Signature-Shirt-Varianten (Farbe/Größe/Logoausführung/Anzahl) AUSSCHLIESSLICH
 *      im localStorage des Browsers, um daraus eine unverbindliche E-Mail-Anfrage
 *      zusammenzustellen.
 *
 * Es entsteht dadurch KEIN Warenkorb im Rechtssinne, KEINE Bestellung, KEIN
 * Vertrag, KEINE Zahlung, KEINE Bestellnummer und KEINE Speicherung auf einem
 * Server (kein Supabase, kein SMTP beim Hinzufügen). Es werden KEINE Daten an uns
 * oder Dritte übertragen (§ 25 Abs. 2 TDDDG, funktional erforderlich). Die Liste
 * lässt sich vom Nutzer jederzeit ändern oder leeren.
 *
 * Der Provider heißt aus Kompatibilitätsgründen weiterhin `CartProvider`.
 */

const WISH_KEY = 'videko-merch-wishlist'
const INQUIRY_KEY = 'videko-anfrageliste'

const MAX_QTY = 99

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
    /* privater Modus o. ä. – Liste bleibt dann nur für die Sitzung */
  }
}

const clampQty = (n) => Math.max(1, Math.min(MAX_QTY, Math.round(Number(n) || 1)))

export function CartProvider({ children }) {
  // Beide Listen starten leer und werden erst NACH dem ersten Commit aus dem
  // localStorage nachgeladen.
  //
  // Grund: Die Seite wird im Build vorgerendert (scripts/prerender.mjs). Dort
  // gibt es keinen localStorage, das ausgelieferte HTML zeigt also immer die
  // leere Anfrageliste. Laese der Startwert hier den echten Speicher, waere der
  // erste Render im Browser ein anderer als das HTML — React verwuerfe den
  // Teilbaum und Badge/Drawer flackerten. Eine Runde spaeter ist der Zustand da.
  const [wishlist, setWishlist] = useState([])
  // Anfrageliste: Array von Positionen mit stabiler `sku` als Identität.
  const [inquiryItems, setInquiryItems] = useState([])
  // Solange false, wurde noch nicht aus dem Speicher gelesen — bis dahin darf
  // auch nichts zurueckgeschrieben werden, sonst ueberschriebe der leere
  // Startwert eine bestehende Liste.
  const [geladen, setGeladen] = useState(false)
  // Reine UI-Sichtbarkeit des Anfragelisten-Panels (nicht persistiert).
  const [anfrageOpen, setAnfrageOpen] = useState(false)
  // Sichtbarkeit des geführten Anfrage-Dialogs (Kontakt-/Lieferdaten → Absenden).
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // Bewusst synchron im Effekt: Genau dieses Nachladen haelt das im Build
  // erzeugte HTML und den ersten Render im Browser identisch (siehe oben).
  // Es laeuft einmal beim Mounten mit leerer Abhaengigkeitsliste und kann
  // sich nicht wiederholen. Ein Startwert aus dem localStorage waere genau
  // der Hydrationsfehler, den dieser Umbau beseitigt hat.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setWishlist(readStore(WISH_KEY, []))
    const stored = readStore(INQUIRY_KEY, [])
    setInquiryItems(Array.isArray(stored) ? stored.filter((i) => i && i.sku) : [])
    setGeladen(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  useEffect(() => { if (geladen) writeStore(WISH_KEY, wishlist) }, [geladen, wishlist])
  useEffect(() => { if (geladen) writeStore(INQUIRY_KEY, inquiryItems) }, [geladen, inquiryItems])

  const toggleWish = useCallback((id) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]))
  }, [])

  /**
   * Position zur Anfrageliste hinzufügen. Erwartet ein Objekt mit mindestens
   * `sku`. Gibt es die SKU schon, wird die Menge erhöht (bis MAX_QTY).
   * Nur anfragbare Produkte dürfen hier landen – das entscheidet die aufrufende
   * Produktseite (Coming-soon-Artikel bieten keinen „Zur Anfrageliste"-Button).
   */
  const addInquiry = useCallback((item) => {
    if (!item || !item.sku) return
    setInquiryItems((prev) => {
      const idx = prev.findIndex((i) => i.sku === item.sku)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: clampQty((next[idx].qty || 1) + (item.qty || 1)) }
        return next
      }
      return [...prev, { ...item, qty: clampQty(item.qty || 1) }]
    })
  }, [])

  const openAnfrage = useCallback(() => setAnfrageOpen(true), [])
  const closeAnfrage = useCallback(() => setAnfrageOpen(false), [])

  // Vom Warenkorb-Panel aus in den geführten Anfrage-Dialog wechseln.
  const openCheckout = useCallback(() => { setAnfrageOpen(false); setCheckoutOpen(true) }, [])
  const closeCheckout = useCallback(() => setCheckoutOpen(false), [])

  const removeInquiry = useCallback((sku) => {
    setInquiryItems((prev) => prev.filter((i) => i.sku !== sku))
  }, [])

  const updateInquiryQty = useCallback((sku, qty) => {
    setInquiryItems((prev) => prev.map((i) => (i.sku === sku ? { ...i, qty: clampQty(qty) } : i)))
  }, [])

  const clearInquiry = useCallback(() => setInquiryItems([]), [])

  const hasInquiry = useCallback((sku) => inquiryItems.some((i) => i.sku === sku), [inquiryItems])

  // Gesamtstückzahl und Zwischensumme (Cent). Positionen ohne belegten Preis
  // fließen nicht in die Summe ein (kein erfundener Betrag).
  const inquiryCount = useMemo(
    () => inquiryItems.reduce((n, i) => n + (i.qty || 1), 0),
    [inquiryItems],
  )
  const inquirySubtotal = useMemo(
    () => inquiryItems.reduce((sum, i) => sum + (i.unitPrice != null ? i.unitPrice * (i.qty || 1) : 0), 0),
    [inquiryItems],
  )

  const value = useMemo(
    () => ({
      wishlist,
      toggleWish,
      inquiryItems,
      addInquiry,
      removeInquiry,
      updateInquiryQty,
      clearInquiry,
      hasInquiry,
      inquiryCount,
      inquirySubtotal,
      anfrageOpen,
      openAnfrage,
      closeAnfrage,
      checkoutOpen,
      openCheckout,
      closeCheckout,
    }),
    [
      wishlist, toggleWish, inquiryItems, addInquiry, removeInquiry,
      updateInquiryQty, clearInquiry, hasInquiry, inquiryCount, inquirySubtotal,
      anfrageOpen, openAnfrage, closeAnfrage,
      checkoutOpen, openCheckout, closeCheckout,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
