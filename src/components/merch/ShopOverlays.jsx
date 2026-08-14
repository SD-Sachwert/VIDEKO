import { Suspense, lazy } from 'react'

import { useCart } from '../../shop/cart-context.js'

/**
 * Anfragelisten-Drawer und Checkout-Dialog haengen im Layout, also auf jeder
 * Route — beide rendern aber `null`, solange sie geschlossen sind.
 *
 * Vor Performance 1.1 lagen sie trotzdem samt `data/merch.js` (23 kB),
 * `shop/order.js` und `shop/inquiry.js` im Startbundle jeder Seite. Sie werden
 * jetzt erst geladen, wenn sie tatsaechlich geoeffnet werden.
 *
 * Kein Verhaltensunterschied: geschlossen war vorher `null`, jetzt ebenfalls.
 */
const AnfragelisteDrawer = lazy(() => import('./AnfragelisteDrawer.jsx'))
const CheckoutDialog = lazy(() => import('./CheckoutDialog.jsx'))

export default function ShopOverlays() {
  const { anfrageOpen, checkoutOpen } = useCart()

  if (!anfrageOpen && !checkoutOpen) return null

  return (
    <Suspense fallback={null}>
      {anfrageOpen && <AnfragelisteDrawer />}
      {checkoutOpen && <CheckoutDialog />}
    </Suspense>
  )
}
