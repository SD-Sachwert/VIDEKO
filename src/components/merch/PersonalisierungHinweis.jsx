import { Info } from 'lucide-react'
import { LEAD_TIME_PERSONALIZED } from '../../data/merch.js'

/**
 * Hinweis zu individuell angefertigten Artikeln.
 *
 * TODO (rechtlich): Der Wortlaut ist eine verstaendliche Zusammenfassung,
 * KEIN gepruefter Rechtstext. Vor dem Livegang durch die finale, anwaltlich
 * freigegebene Fassung ersetzen – idealerweise nur die Texte in HINWEISE
 * austauschen, damit Platzierung und Gestaltung erhalten bleiben.
 *
 * Die Komponente wird an allen Stellen verwendet, an denen eine
 * Personalisierung angeboten wird. Aenderungen wirken damit ueberall.
 */
const HINWEISE = [
  'Personalisierte Artikel werden individuell für dich angefertigt.',
  `Die Lieferzeit beträgt dann ${LEAD_TIME_PERSONALIZED}.`,
  'Bei individuell angefertigten Produkten können Widerruf und Rückgabe eingeschränkt sein.',
]

export default function PersonalisierungHinweis({ className = '' }) {
  return (
    <div className={`persnote ${className}`.trim()} role="note">
      <Info size={16} strokeWidth={1.8} aria-hidden="true" />
      <div>
        <strong className="persnote__title">Wichtig bei Namensdruck</strong>
        <ul className="persnote__list">
          {HINWEISE.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <p className="persnote__legal">
          Einzelheiten findest du in unseren{' '}
          <a href="/rueckgabe-widerruf">Rückgabe- und Widerrufsinformationen</a>.
        </p>
      </div>
    </div>
  )
}
