import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, X, Loader2 } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import { confirmNotify } from '../shop/notify.js'

/**
 * Bestätigungsseite für den Double-Opt-in-Link aus der Vormerkungs-E-Mail (§ 6).
 * Ruft mit dem Token `action:'confirm'` auf; erst dadurch wird die Vormerkung
 * serverseitig aktiviert und intern gemeldet.
 */
export default function VormerkungBestaetigen() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState('pending') // pending | ok | invalid | unconfigured | error
  const lief = useRef(false)

  useEffect(() => {
    if (lief.current) return
    lief.current = true
    if (!token) { setStatus('invalid'); return }
    confirmNotify(token)
      .then((r) => {
        if (r.configured === false) setStatus('unconfigured')
        else if (r.confirmed) setStatus('ok')
        else if (r.error === 'token-invalid') setStatus('invalid')
        else setStatus('error')
      })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <main className="legal">
      <Seo title="Vormerkung bestätigen – VIDEKO" description="Bestätigung deiner Produktvormerkung." noindex />
      <div className="container legal__inner">
        <div className="confirm">
          {status === 'pending' && (
            <>
              <span className="confirm__icon"><Loader2 size={30} strokeWidth={2} className="notify__spin" /></span>
              <h1>Wird bestätigt …</h1>
              <p>Einen Moment, wir aktivieren deine Vormerkung.</p>
            </>
          )}
          {status === 'ok' && (
            <>
              <span className="confirm__icon confirm__icon--ok"><Check size={30} strokeWidth={2.4} /></span>
              <h1>Vormerkung bestätigt</h1>
              <p>
                Danke! Deine Vormerkung ist jetzt aktiv. Wir benachrichtigen dich
                <strong> einmalig</strong>, sobald das Produkt verfügbar ist, und löschen deine
                Adresse anschließend wieder. Es erfolgt kein Newsletter.
              </p>
              <Link className="confirm__link" to="/merch">Zurück zum Shop</Link>
            </>
          )}
          {status === 'invalid' && (
            <>
              <span className="confirm__icon confirm__icon--bad"><X size={30} strokeWidth={2.4} /></span>
              <h1>Link ungültig oder abgelaufen</h1>
              <p>
                Dieser Bestätigungslink ist nicht mehr gültig (er läuft nach 48 Stunden ab).
                Bitte fordere die Benachrichtigung bei Bedarf einfach neu an.
              </p>
              <Link className="confirm__link" to="/merch">Zum Shop</Link>
            </>
          )}
          {status === 'unconfigured' && (
            <>
              <h1>Bestätigung derzeit nicht möglich</h1>
              <p>Die Benachrichtigungsfunktion ist gerade nicht aktiv. Bitte versuche es später erneut.</p>
              <Link className="confirm__link" to="/merch">Zum Shop</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <span className="confirm__icon confirm__icon--bad"><X size={30} strokeWidth={2.4} /></span>
              <h1>Etwas ist schiefgelaufen</h1>
              <p>Wir konnten deine Vormerkung nicht bestätigen. Bitte versuche es später noch einmal.</p>
              <Link className="confirm__link" to="/merch">Zum Shop</Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
