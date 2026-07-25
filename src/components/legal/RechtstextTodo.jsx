import { AlertTriangle } from 'lucide-react'

/**
 * Platzhalter fuer einen noch fehlenden, rechtlich verbindlichen Text.
 *
 * Bewusst deutlich sichtbar: Diese Bloecke sollen VOR dem Livegang durch
 * gepruefte Texte ersetzt werden. Zum Ersetzen einfach die Komponente durch
 * den fertigen Inhalt austauschen – Ueberschrift und Seitengeruest bleiben.
 *
 * `npm run build` laesst die Bloecke stehen; eine Suche nach "RechtstextTodo"
 * zeigt alle offenen Stellen.
 */
export default function RechtstextTodo({ titel, children }) {
  return (
    <div className="legaltodo" role="note">
      <p className="legaltodo__head">
        <AlertTriangle size={15} strokeWidth={2} aria-hidden="true" />
        <span>Noch nicht final: {titel}</span>
      </p>
      {children && <div className="legaltodo__body">{children}</div>}
      <p className="legaltodo__foot">
        Dieser Abschnitt wird vor dem Verkaufsstart durch die geprüfte Fassung ersetzt.
      </p>
    </div>
  )
}
