import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, BellRing, Check, Loader2 } from 'lucide-react'

import { subscribeNotify, NOTIFY_CONSENT_TEXT } from '../../shop/notify.js'

/**
 * „Benachrichtige mich" – Anmeldeformular für die Produktvormerkung (§ 6).
 *
 * Ablauf: E-Mail + (optional) Farbe/Größe + PFLICHT-Einwilligung (nicht
 * vorausgewählt, getrennt von jeglichem Newsletter) → Double-Opt-in.
 * Das bloße Öffnen dieses Formulars löst KEINE interne E-Mail aus. Erst nach
 * Klick auf den Bestätigungslink in der zugesandten E-Mail wird die Vormerkung
 * aktiv und intern gemeldet.
 *
 * @param {object}   props
 * @param {string}   props.product      Produktname (wird mitgesendet)
 * @param {string}   props.productId    stabile Produkt-/Varianten-ID
 * @param {string[]} [props.colors]     optionale Farbauswahl (Labels)
 * @param {string[]} [props.sizes]      optionale Größenauswahl
 * @param {() => void} props.onClose
 */
export default function NotifyModal({ product, productId, colors = [], sizes = [], onClose }) {
  const [email, setEmail] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('idle') // idle | sending | done | error | unconfigured
  const [fehler, setFehler] = useState('')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  const absenden = async (e) => {
    e.preventDefault()
    setFehler('')
    if (!emailOk) { setFehler('Bitte gib eine gültige E-Mail-Adresse ein.'); return }
    if (!consent) { setFehler('Bitte bestätige die Einwilligung, damit wir dich benachrichtigen dürfen.'); return }
    setStatus('sending')
    const variant = [color, size].filter(Boolean).join(' · ')
    try {
      const r = await subscribeNotify({ email: email.trim(), product, productId, variant, consent: true })
      if (r.configured === false) { setStatus('unconfigured'); return }
      if (r.ok || r.doubleOptIn) { setStatus('done'); return }
      setStatus('error')
      setFehler('Das hat leider nicht geklappt. Bitte versuche es später erneut.')
    } catch {
      setStatus('error')
      setFehler('Verbindung fehlgeschlagen. Bitte versuche es später erneut.')
    }
  }

  return (
    <div className="notify" role="dialog" aria-modal="true" aria-label={`Benachrichtigung für ${product}`}>
      <button type="button" className="notify__backdrop" aria-label="Schließen" onClick={onClose} />
      <div className="notify__panel">
        <button type="button" className="notify__close" onClick={onClose} aria-label="Schließen">
          <X size={20} strokeWidth={1.9} />
        </button>

        {status === 'done' ? (
          <div className="notify__done">
            <span className="notify__doneicon"><Check size={26} strokeWidth={2.2} /></span>
            <h2>Fast geschafft</h2>
            <p>
              Wir haben dir eine E-Mail an <strong>{email.trim()}</strong> geschickt. Bitte
              bestätige darin deine Vormerkung – erst danach ist sie aktiv (Double-Opt-in).
              Ohne Bestätigung speichern wir nichts.
            </p>
            <button type="button" className="notify__ok" onClick={onClose}>Alles klar</button>
          </div>
        ) : status === 'unconfigured' ? (
          <div className="notify__done">
            <h2>Vormerkung noch nicht aktiv</h2>
            <p>
              Die Benachrichtigungsfunktion für <strong>{product}</strong> ist gerade noch nicht
              freigeschaltet. Schau bald wieder vorbei – wir richten den Versand in Kürze ein.
            </p>
            <button type="button" className="notify__ok" onClick={onClose}>Schließen</button>
          </div>
        ) : (
          <form className="notify__form" onSubmit={absenden} noValidate>
            <h2 className="notify__title"><BellRing size={19} strokeWidth={1.9} /> Benachrichtige mich</h2>
            <p className="notify__intro">
              Trag dich ein und wir melden uns <strong>einmalig</strong> per E-Mail, sobald
              <strong> {product}</strong> verfügbar ist.
            </p>

            <label className="notify__field">
              <span>E-Mail-Adresse *</span>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="dein.name@beispiel.de" autoComplete="email" required
              />
            </label>

            {colors.length > 1 && (
              <label className="notify__field">
                <span>Farbe (optional)</span>
                <select value={color} onChange={(e) => setColor(e.target.value)}>
                  <option value="">Keine Angabe</option>
                  {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            )}

            {sizes.length > 1 && (
              <label className="notify__field">
                <span>Größe (optional)</span>
                <select value={size} onChange={(e) => setSize(e.target.value)}>
                  <option value="">Keine Angabe</option>
                  {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            )}

            <label className="notify__consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
              <span>{NOTIFY_CONSENT_TEXT}</span>
            </label>

            <p className="notify__privacy">
              Hinweise zur Verarbeitung findest du in unserer{' '}
              <Link to="/datenschutz" onClick={onClose}>Datenschutzerklärung</Link>. Du kannst die
              Vormerkung jederzeit formlos widerrufen.
            </p>

            {fehler && <p className="notify__error" role="alert">{fehler}</p>}

            <button type="submit" className="notify__submit" disabled={status === 'sending'}>
              {status === 'sending'
                ? (<><Loader2 size={16} strokeWidth={2} className="notify__spin" /> Wird gesendet …</>)
                : (<>Benachrichtigung anfordern <BellRing size={16} strokeWidth={1.9} /></>)}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
