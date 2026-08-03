import { Sparkles } from 'lucide-react'

/**
 * Einheitliche, bewusst zurückhaltende KI-Kennzeichnung für synthetisch
 * erzeugte Bilder.
 *
 * Rechtlicher Hintergrund: EU AI Act (VO 2024/1689) Art. 50 Abs. 4 verlangt ab
 * dem 02.08.2026 eine klar erkennbare Offenlegung KI-generierter, real wirkender
 * Bilder; zusätzlich vermeidet die Kennzeichnung eine Irreführung nach § 5 UWG.
 * Details und To-do: docs/compliance/AI-ACT-KI-KENNZEICHNUNG.md.
 *
 * Ziel der Gestaltung: sichtbar, aber nicht aufdringlich.
 *   <KiBadge>   – kleines Overlay-Label in einer Bildecke (Galerien, Slider)
 *   <KiHinweis> – dezente Zeile als Bildunterschrift (Hero-/Seitenbilder)
 */
export function KiBadge({ label = 'KI-Bild', title = 'Mit KI erstelltes Bild', className = '' }) {
  return (
    <span className={`kimark kimark--badge ${className}`.trim()} title={title}>
      <Sparkles size={11} strokeWidth={1.9} aria-hidden="true" />
      {label}
    </span>
  )
}

export function KiHinweis({ text = 'Darstellung: KI-generiert', className = '' }) {
  return (
    <span className={`kimark kimark--note ${className}`.trim()}>
      <Sparkles size={11} strokeWidth={1.9} aria-hidden="true" />
      {text}
    </span>
  )
}
