import { useEffect, useRef, useState } from 'react'
import { X, Bell, Check, Loader2, Mail, AlertCircle } from 'lucide-react'

import { useCart } from '../../shop/cart-context.js'
import { requestNotify } from '../../shop/notifyService.js'

/**
 * „Benachrichtige mich"-Modal.
 *
 * Übernimmt Produkt und gewählte Variante automatisch aus dem Cart-Context
 * (notifyTarget). Der eigentliche Dialog wird pro Öffnung frisch gemountet
 * (key), damit die Felder ohne setState-im-Effekt zurückgesetzt sind.
 */
export default function NotifyModal() {
  const { notifyTarget, closeNotify, markNotified } = useCart()
  if (!notifyTarget) return null
  return (
    <NotifyDialog
      key={notifyTarget.product.id}
      product={notifyTarget.product}
      variant={notifyTarget.variant}
      onClose={closeNotify}
      onDone={markNotified}
    />
  )
}

/**
 * Vollständig tastaturbedienbar: Escape schließt, der Fokus bleibt im Dialog
 * gefangen, beim Öffnen liegt er auf dem E-Mail-Feld.
 * Zustände: idle → sending → success | not_configured | error. Kein
 * gefälschter Erfolg, wenn kein Backend angebunden ist.
 */
function NotifyDialog({ product, variant, onClose, onDone }) {
  const [email, setEmail] = useState('')
  const [privacy, setPrivacy] = useState(false)
  const [status, setStatus] = useState('idle')
  const [fehler, setFehler] = useState('')
  const dialogRef = useRef(null)
  const emailRef = useRef(null)
  const zuvorFokussiert = useRef(typeof document !== 'undefined' ? document.activeElement : null)

  const schliessen = () => {
    onClose()
    if (zuvorFokussiert.current?.focus) zuvorFokussiert.current.focus()
  }

  // Fokus aufs erste Feld + Body-Scroll sperren (kein State)
  useEffect(() => {
    const t = setTimeout(() => emailRef.current?.focus(), 40)
    document.body.style.overflow = 'hidden'
    return () => { clearTimeout(t); document.body.style.overflow = '' }
  }, [])

  // Escape schließt, Tab bleibt im Dialog (Fokusfalle)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { schliessen(); return }
      if (e.key !== 'Tab') return
      const f = dialogRef.current?.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])')
      if (!f || !f.length) return
      const liste = [...f].filter((el) => !el.disabled && el.offsetParent !== null)
      const erster = liste[0]
      const letzter = liste[liste.length - 1]
      if (e.shiftKey && document.activeElement === erster) { e.preventDefault(); letzter.focus() }
      else if (!e.shiftKey && document.activeElement === letzter) { e.preventDefault(); erster.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const absenden = async (e) => {
    e.preventDefault()
    setFehler('')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStatus('error'); setFehler('Bitte gib eine gültige E-Mail-Adresse ein.'); return }
    if (!privacy) { setStatus('error'); setFehler('Bitte stimme der Datenschutzerklärung zu.'); return }
    setStatus('sending')
    const res = await requestNotify({ productId: product.id, productName: product.name, variant: variant || '', email })
    setStatus(res.status)
    if (res.status === 'success') onDone(product.id)
    if (res.status === 'error') setFehler('Das hat nicht geklappt. Bitte versuch es später erneut.')
  }

  const fertig = status === 'success' || status === 'not_configured'

  return (
    <div className="nmodal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) schliessen() }}>
      <div className="nmodal__box" role="dialog" aria-modal="true" aria-labelledby="nmodal-title" ref={dialogRef}>
        <button type="button" className="nmodal__close" onClick={schliessen} aria-label="Schließen">
          <X size={18} strokeWidth={2} />
        </button>

        {fertig ? (
          <div className="nmodal__done">
            <span className={`nmodal__icon ${status === 'success' ? 'is-ok' : 'is-info'}`}>
              {status === 'success' ? <Check size={26} strokeWidth={2} /> : <Mail size={24} strokeWidth={1.8} />}
            </span>
            <h2 id="nmodal-title">{status === 'success' ? 'Wir melden uns.' : 'Fast geschafft.'}</h2>
            <p>
              {status === 'success'
                ? <>Sobald <strong>{product.name}</strong> verfügbar ist, schreiben wir dir an <strong>{email}</strong>.</>
                : <>Deine Vormerkung für <strong>{product.name}</strong> ist lokal gespeichert. Der automatische
                  Versand ist in dieser Umgebung noch nicht angebunden – das Team richtet den Endpoint vor dem
                  Livegang ein.</>}
            </p>
            <button type="button" className="nmodal__submit" onClick={schliessen}>Schließen</button>
          </div>
        ) : (
          <>
            <span className="nmodal__eyebrow"><Bell size={14} strokeWidth={1.8} /> Benachrichtige mich</span>
            <h2 id="nmodal-title" className="nmodal__title">{product.name}</h2>
            {variant && <p className="nmodal__variant">{variant}</p>}
            <p className="nmodal__lead">
              Trag deine E-Mail ein – wir sagen dir Bescheid, sobald dieser Artikel bestellbar ist.
            </p>

            <form onSubmit={absenden} noValidate>
              <label className="nmodal__field">
                <span>E-Mail-Adresse</span>
                <input
                  ref={emailRef} type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de" autoComplete="email" required
                  aria-invalid={status === 'error' && !!fehler}
                  aria-describedby={fehler ? 'nmodal-error' : undefined}
                />
              </label>

              <label className="nmodal__check">
                <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
                <span>
                  Ich bin mit der Verarbeitung meiner E-Mail zum Zweck der Benachrichtigung einverstanden
                  (<a href="/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a>).
                </span>
              </label>

              {fehler && (
                <p className="nmodal__err" id="nmodal-error" role="alert">
                  <AlertCircle size={14} strokeWidth={2} /> {fehler}
                </p>
              )}

              <button type="submit" className="nmodal__submit" disabled={status === 'sending'}>
                {status === 'sending'
                  ? (<><Loader2 size={16} strokeWidth={2} className="nmodal__spin" /> Wird gesendet…</>)
                  : (<>Benachrichtigen <Bell size={15} strokeWidth={1.8} /></>)}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
