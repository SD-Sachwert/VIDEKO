/**
 * Zugriff auf Breite, Hoehe und srcSet eines Bildes.
 *
 * Liegt bewusst neben der generierten Variantenliste und nicht in Img.jsx: So
 * koennen auch Stellen darauf zugreifen, die kein <img> rendern — Preload-Links
 * oder ein motion.img mit Parallax — ohne die Komponente zu importieren.
 */
import { IMAGE_VARIANTS } from '../assets/images/variants.generated.js'

export function imageMeta(src) {
  return IMAGE_VARIANTS.get(src)
}
