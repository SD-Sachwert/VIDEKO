import { createContext, useContext } from 'react'

/** Getrennt von der Provider-Komponente, damit Fast Refresh sauber bleibt. */
export const CartContext = createContext(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart muss innerhalb von <CartProvider> verwendet werden')
  return ctx
}
