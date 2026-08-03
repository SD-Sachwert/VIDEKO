import { Sparkles } from 'lucide-react'

/**
 * Einheitliche KI-Kennzeichnung – EINE Komponente (`KiTag`) mit Varianten.
 *
 * Rechtlicher Hintergrund (Stand 08/2026):
 *  - EU AI Act (VO 2024/1689) Art. 50 Abs. 4: Ab 02.08.2026 müssen KI-generierte
 *    Bilder, die real/plausibel echt wirkende Personen, Orte, Objekte oder
 *    Situationen zeigen, klar und bereits beim ersten Kontakt erkennbar
 *    offengelegt werden (Deepfake-Transparenz).
 *  - § 5 UWG: Unabhängig vom AI Act darf keine Irreführung entstehen – z. B.
 *    KI-Personen als echte Kund:innen/Mitarbeitende oder KI-Renderings als
 *    dokumentierte reale Kundenprojekte.
 *  Diese Kennzeichnung ist eine nach bestem Stand umgesetzte technische
 *  Maßnahme, KEINE juristische Freigabe. Details: docs/compliance/AI-ACT-KI-KENNZEICHNUNG.md.
 *
 * Varianten (Wortlaut je nach Motiv möglichst präzise, nicht pauschal):
 *  - symbolic          → „KI-generiertes Symbolbild“ (Personen-/Szenen-Symbolbilder)
 *  - visualization     → „KI-generierte Visualisierung“ (Räume/Studio)
 *  - product           → „KI-generierte Produktvisualisierung – Abbildung kann abweichen“ (Shop-Renderings)
 *  - not-real-project  → „Beispielhafte KI-Visualisierung – kein reales Kundenprojekt“
 *  - section-notice    → Sammel-Hinweis für eine klar abgegrenzte KI-Bildgruppe
 *  - generic           → neutraler Fallback
 *
 * Darstellungsform (`format`):
 *  - badge → kleines Overlay-Label in einer Bildecke
 *  - note  → dezente Hinweiszeile (Bildunterschrift / Sammelhinweis)
 */
const VARIANT_TEXT = {
  symbolic: 'KI-generiertes Symbolbild',
  visualization: 'KI-generierte Visualisierung',
  'not-real-project': 'Beispielhafte KI-Visualisierung – kein reales Kundenprojekt',
  'section-notice': 'KI-generierte Symbolbilder',
  product: 'KI-generierte Produktvisualisierung – Abbildung kann abweichen',
  generic: 'Darstellung: KI-generiert',
}

const VARIANT_FORMAT = {
  symbolic: 'badge',
  visualization: 'note',
  'not-real-project': 'note',
  'section-notice': 'note',
  product: 'badge',
  generic: 'note',
}

export function KiTag({
  variant = 'generic',
  format,
  text,
  className = '',
  title,
}) {
  const fmt = format || VARIANT_FORMAT[variant] || 'note'
  const content = text ?? VARIANT_TEXT[variant] ?? VARIANT_TEXT.generic
  const base = fmt === 'badge' ? 'kimark kimark--badge' : 'kimark kimark--note'
  return (
    <span
      className={`${base} ${className}`.trim()}
      role="note"
      aria-label={`Bildkennzeichnung: ${content}`}
      title={title || content}
    >
      <Sparkles size={11} strokeWidth={1.9} aria-hidden="true" />
      {content}
    </span>
  )
}

/**
 * Rückwärtskompatible Wrapper – bauen intern auf der EINEN Quelle `KiTag` auf,
 * damit bestehende Aufrufe (Shop-Galerie, PageHero, Hero-Overlays …) unverändert
 * funktionieren. Kein zweites Badge-System.
 */
export function KiBadge({ label, title = 'Mit KI erstelltes Bild', className = '', variant = 'symbolic' }) {
  return <KiTag variant={variant} format="badge" text={label} title={title} className={className} />
}

export function KiHinweis({ text, className = '', variant = 'generic' }) {
  return <KiTag variant={variant} format="note" text={text} className={className} />
}
