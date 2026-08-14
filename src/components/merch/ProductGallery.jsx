import { useEffect, useRef, useState } from 'react'
import { ZoomIn, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { KiBadge } from '../legal/KiKennzeichnung.jsx'
import Img from '../Img.jsx'

/**
 * Bildgalerie fuer Produktseite und Featured-Block.
 *
 * Aufbau: grosses Hauptbild oben, Thumbnails darunter. Frueher lagen die
 * Thumbnails in einer festen 88px-Spalte links – hatte ein Produkt nur ein
 * Bild, wurden gar keine Thumbnails gerendert und das Hauptbild landete in
 * dieser schmalen Spalte. Es war dann 88x88px gross. Deshalb steuert jetzt
 * die Anzahl der Bilder das Layout, nicht eine feste Spaltenbreite.
 *
 * Das Hauptbild nutzt object-fit: contain, damit nichts angeschnitten wird.
 * Die Quelldateien sind die hochaufloesenden Packshots (1000px), auch fuer
 * die Thumbnails – es gibt bewusst keine separaten Thumbnail-Dateien.
 */
export default function ProductGallery({ images, alt, layout = 'side', placeholder = null, ai = false }) {
  const bilder = images?.length ? images : []
  const [aktiv, setAktiv] = useState(0)
  const [zoom, setZoom] = useState(false)

  // Produktwechsel: waehrend des Renderns zuruecksetzen statt per Effekt,
  // sonst blitzt kurz das Bild des vorherigen Produkts auf
  const [letzte, setLetzte] = useState(images)
  if (letzte !== images) {
    setLetzte(images)
    setAktiv(0)
  }

  const mehrere = bilder.length > 1
  const blaettern = (schritt) =>
    setAktiv((i) => (i + schritt + bilder.length) % bilder.length)

  // Wisch-Geste (Lightbox mobil): horizontal blaettern
  const touchX = useRef(null)
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 45) blaettern(dx < 0 ? 1 : -1)
    touchX.current = null
  }

  useEffect(() => {
    if (!zoom) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setZoom(false)
      if (e.key === 'ArrowRight') blaettern(1)
      if (e.key === 'ArrowLeft') blaettern(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!bilder.length) return null

  // Hochwertiges Platzhalter-Panel: gleiche Bildfläche wie ein echtes Packshot,
  // aber klar gekennzeichnet – nie ein falsches/altes Produktbild.
  if (placeholder) {
    return (
      <div className={`pgal pgal--${layout} pgal--single`}>
        <div className="pgal__stage">
          <div className="pgal__ph" role="img" aria-label={`${placeholder.title}${placeholder.sub ? ' – ' + placeholder.sub : ''}`}>
            <span className="pgal__ph-mark">VIDEKO</span>
            <strong className="pgal__ph-title">{placeholder.title}</strong>
            {placeholder.sub && <span className="pgal__ph-sub">{placeholder.sub}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`pgal pgal--${layout} ${mehrere ? '' : 'pgal--single'}`.trim()}>
        <div className="pgal__stage">
          <button
            type="button"
            className="pgal__main"
            onClick={() => setZoom(true)}
            aria-label="Bild vergrößern"
          >
            <Img src={bilder[aktiv]} alt={alt} priority sizes="(max-width: 900px) 100vw, 620px" />
          </button>
          <span className="pgal__zoom" aria-hidden="true"><ZoomIn size={17} strokeWidth={1.7} /></span>
          {ai && <KiBadge variant="product" title="KI-generierte Produktvisualisierung – Abbildung kann abweichen" />}

          {mehrere && (
            <>
              <button type="button" className="pgal__nav pgal__nav--prev" onClick={() => blaettern(-1)} aria-label="Vorheriges Bild">
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <button type="button" className="pgal__nav pgal__nav--next" onClick={() => blaettern(1)} aria-label="Nächstes Bild">
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {mehrere && (
          <div className="pgal__thumbs" role="group" aria-label="Weitere Ansichten">
            {bilder.map((src, i) => (
              <button
                type="button"
                key={src + i}
                className={`pgal__thumb ${aktiv === i ? 'is-active' : ''}`.trim()}
                onClick={() => setAktiv(i)}
                aria-label={`Ansicht ${i + 1} von ${bilder.length}`}
                aria-current={aktiv === i}
              >
                <Img src={src} alt="" sizes="90px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {mehrere && <p className="pgal__hint">Klicke auf ein Bild, um es zu vergrößern.</p>}

      {zoom && (
        <div className="plight" role="dialog" aria-modal="true" aria-label={alt} onClick={() => setZoom(false)}>
          <button type="button" className="plight__close" onClick={() => setZoom(false)} aria-label="Schließen">
            <X size={20} strokeWidth={2} />
          </button>
          <img
            className="plight__img"
            src={bilder[aktiv]}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          />
          {ai && <KiBadge variant="product" title="KI-generierte Produktvisualisierung – Abbildung kann abweichen" />}
          {mehrere && (
            <>
              <button
                type="button"
                className="plight__nav plight__nav--prev"
                onClick={(e) => { e.stopPropagation(); blaettern(-1) }}
                aria-label="Vorheriges Bild"
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="plight__nav plight__nav--next"
                onClick={(e) => { e.stopPropagation(); blaettern(1) }}
                aria-label="Nächstes Bild"
              >
                <ChevronRight size={22} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
