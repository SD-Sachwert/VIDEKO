import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, ArrowLeft, ArrowRight, Check, Loader2, Mail, ShoppingBag, PartyPopper } from 'lucide-react'

import { useCart } from '../../shop/cart-context.js'
import { formatPrice } from '../../data/merch.js'
import { submitOrder, buildOrderMailto } from '../../shop/order.js'

/**
 * Geführte Angebots-Anfrage (Warenkorb → Kontakt → Lieferadresse → Prüfen →
 * fertig). Ersetzt den früheren mailto-Direktbutton durch einen Schritt-für-
 * Schritt-Ablauf, der alle Angaben sammelt, die wir für ein individuelles
 * Angebot brauchen, und diese zuverlässig per Serverless-Endpoint an uns mailt.
 *
 * Anfragemodell: unverbindliche ANGEBOTSANFRAGE, KEINE Bestellung, keine
 * Zahlungspflicht, kein Vertrag. Der verbindliche Preis (inkl. Versand) kommt
 * erst mit dem individuellen Angebot per E-Mail.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
// Adress-Plausibilität (gegen Fantasie-Eingaben) – gleiche Regeln wie serverseitig.
const L = "A-Za-zÀ-ÖØ-öø-ÿ"
const RE_NAME = new RegExp(`^[${L}][${L} .'-]{1,}$`)
const RE_ORT = RE_NAME
const RE_PLZ_DE = /^\d{5}$/
const hatBuchstabe = (s) => new RegExp(`[${L}]`).test(s)
const istDeutschland = (land) => !land || /deutsch|germany|^de$/i.test(String(land).trim())

const leer = {
  name: '', email: '', telefon: '', firma: '',
  strasse: '', plz: '', ort: '', land: 'Deutschland', anmerkung: '',
}

/** Feldweise Formatprüfung; liefert { feld: 'Meldung' }. */
function pruefeFelder(f) {
  const e = {}
  if (!RE_NAME.test(f.name.trim())) e.name = 'Bitte gib deinen vollständigen Namen an (Buchstaben, keine Zahlen).'
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Bitte gib eine gültige E-Mail-Adresse an.'
  const s = f.strasse.trim()
  if (!(hatBuchstabe(s) && /\d/.test(s) && s.length >= 5)) e.strasse = 'Bitte Straße und Hausnummer angeben, z. B. „Musterstraße 12".'
  const de = istDeutschland(f.land)
  if (de ? !RE_PLZ_DE.test(f.plz.trim()) : f.plz.trim().length < 3) e.plz = de ? 'Bitte eine gültige 5-stellige PLZ angeben.' : 'Bitte eine gültige PLZ angeben.'
  if (!RE_ORT.test(f.ort.trim())) e.ort = 'Bitte einen gültigen Ort angeben (Buchstaben, keine Zahlen).'
  return e
}

export default function CheckoutDialog() {
  const {
    inquiryItems, inquirySubtotal, checkoutOpen, closeCheckout, clearInquiry,
  } = useCart()

  const [step, setStep] = useState(0) // 0 Kontakt · 1 Lieferung · 2 Prüfen · 3 Erfolg
  const [form, setForm] = useState(leer)
  const [website, setWebsite] = useState('') // Honeypot
  const [consent, setConsent] = useState(false)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fehler, setFehler] = useState('')
  const [fallbackHref, setFallbackHref] = useState('')

  const alleMitPreis = inquiryItems.every((i) => i.unitPrice != null)

  // Beim Öffnen zurücksetzen (Erfolgsschritt aber stehen lassen, falls schon gesendet)
  useEffect(() => {
    if (checkoutOpen) {
      setStep(0); setFehler(''); setFallbackHref(''); setBusy(false); setTouched(false)
    }
  }, [checkoutOpen])

  useEffect(() => {
    if (!checkoutOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape' && !busy) closeCheckout() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [checkoutOpen, closeCheckout, busy])

  // Serverseitige Feldmeldung (z. B. „PLZ passt nicht zum Ort") pro Feld.
  const [serverFeld, setServerFeld] = useState({})
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (serverFeld[k]) setServerFeld((s) => { const n = { ...s }; delete n[k]; return n })
  }

  const errs = pruefeFelder(form)
  const meldung = (k) => serverFeld[k] || (touched ? errs[k] : null)
  const kontaktOk = !errs.name && !errs.email
  const lieferOk = !errs.strasse && !errs.plz && !errs.ort

  const anschrift = useMemo(
    () => [form.strasse, `${form.plz} ${form.ort}`.trim(), form.land].filter(Boolean).join(' · '),
    [form.strasse, form.plz, form.ort, form.land],
  )

  if (!checkoutOpen) return null

  // Sicherung: leerer Warenkorb → nichts anzufragen
  if (inquiryItems.length === 0 && step !== 3) {
    return (
      <div className="checkout" role="dialog" aria-modal="true" aria-label="Anfrage">
        <button type="button" className="checkout__backdrop" aria-label="Schließen" onClick={closeCheckout} />
        <div className="checkout__panel checkout__panel--slim">
          <button type="button" className="checkout__close" onClick={closeCheckout} aria-label="Schließen"><X size={20} /></button>
          <div className="checkout__done">
            <ShoppingBag size={40} strokeWidth={1.4} />
            <h2>Dein Warenkorb ist leer</h2>
            <p>Leg zuerst ein paar Shirts in den Warenkorb – dann führen wir dich hier durch die Anfrage.</p>
            <Link className="checkout__btn checkout__btn--primary" to="/merch" onClick={closeCheckout}>Zu den Shirts</Link>
          </div>
        </div>
      </div>
    )
  }

  const weiter = () => {
    setTouched(true)
    if (step === 0 && !kontaktOk) return
    if (step === 1 && !lieferOk) return
    setTouched(false); setFehler('')
    setStep((s) => Math.min(2, s + 1))
  }
  const zurueck = () => { setFehler(''); setStep((s) => Math.max(0, s - 1)) }

  const absenden = async () => {
    setTouched(true)
    if (!kontaktOk || !lieferOk || !consent) return
    setBusy(true); setFehler('')
    const res = await submitOrder({ contact: { ...form, website }, items: inquiryItems })
    setBusy(false)
    if (res.ok) {
      clearInquiry()
      setStep(3)
    } else if (res.error === 'address' && res.field) {
      // Der Server hat die Adresse als unplausibel erkannt (z. B. PLZ ≠ Ort).
      // Kein mailto-Rückfall – zurück zum passenden Schritt und Feld markieren.
      setServerFeld((s) => ({ ...s, [res.field]: res.message || 'Bitte prüfe diese Angabe.' }))
      setStep(['name', 'email'].includes(res.field) ? 0 : 1)
    } else {
      // Echter Server-/Netzausfall → vorbelegte Mail, damit nichts verloren geht.
      setFallbackHref(buildOrderMailto({ contact: form, items: inquiryItems }))
      setFehler('Die automatische Übermittlung hat gerade nicht geklappt. Du kannst deine Anfrage mit einem Klick als fertig ausgefüllte E-Mail senden – wir bekommen sie genauso.')
    }
  }

  const STEPS = ['Kontakt', 'Lieferadresse', 'Prüfen']

  return (
    <div className="checkout" role="dialog" aria-modal="true" aria-label="Angebots-Anfrage">
      <button type="button" className="checkout__backdrop" aria-label="Schließen" onClick={() => !busy && closeCheckout()} />
      <div className="checkout__panel">
        <button type="button" className="checkout__close" onClick={() => !busy && closeCheckout()} aria-label="Schließen"><X size={20} /></button>

        {step < 3 && (
          <ol className="checkout__steps" aria-label="Fortschritt">
            {STEPS.map((label, i) => (
              <li key={label} className={`checkout__stepdot ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}>
                <span>{i < step ? <Check size={13} strokeWidth={3} /> : i + 1}</span>{label}
              </li>
            ))}
          </ol>
        )}

        {/* Schritt 1 – Kontakt */}
        {step === 0 && (
          <div className="checkout__body">
            <h2 className="checkout__h">Wie können wir dich erreichen?</h2>
            <p className="checkout__lead">Damit wir dir dein persönliches Angebot schicken können.</p>
            <label className={`checkout__field ${meldung('name') ? 'has-err' : ''}`}>
              <span>Name *</span>
              <input type="text" value={form.name} onChange={set('name')} autoComplete="name" placeholder="Vor- und Nachname" />
              {meldung('name') && <em className="checkout__ferr">{meldung('name')}</em>}
            </label>
            <label className={`checkout__field ${meldung('email') ? 'has-err' : ''}`}>
              <span>E-Mail *</span>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="name@beispiel.de" />
              {meldung('email') && <em className="checkout__ferr">{meldung('email')}</em>}
            </label>
            <div className="checkout__grid2">
              <label className="checkout__field">
                <span>Telefon <em>(optional)</em></span>
                <input type="tel" value={form.telefon} onChange={set('telefon')} autoComplete="tel" placeholder="Für schnelle Rückfragen" />
              </label>
              <label className="checkout__field">
                <span>Firma <em>(optional)</em></span>
                <input type="text" value={form.firma} onChange={set('firma')} autoComplete="organization" placeholder="Falls geschäftlich" />
              </label>
            </div>
          </div>
        )}

        {/* Schritt 2 – Lieferadresse */}
        {step === 1 && (
          <div className="checkout__body">
            <h2 className="checkout__h">Wohin dürfen wir liefern?</h2>
            <p className="checkout__lead">Wir brauchen die Adresse, um dir die Versandkosten im Angebot exakt zu nennen.</p>
            <label className={`checkout__field ${meldung('strasse') ? 'has-err' : ''}`}>
              <span>Straße &amp; Hausnummer *</span>
              <input type="text" value={form.strasse} onChange={set('strasse')} autoComplete="street-address" placeholder="Musterstraße 12" />
              {meldung('strasse') && <em className="checkout__ferr">{meldung('strasse')}</em>}
            </label>
            <div className="checkout__grid2">
              <label className={`checkout__field checkout__field--plz ${meldung('plz') ? 'has-err' : ''}`}>
                <span>PLZ *</span>
                <input type="text" value={form.plz} onChange={set('plz')} autoComplete="postal-code" inputMode="numeric" placeholder="12345" />
                {meldung('plz') && <em className="checkout__ferr">{meldung('plz')}</em>}
              </label>
              <label className={`checkout__field ${meldung('ort') ? 'has-err' : ''}`}>
                <span>Ort *</span>
                <input type="text" value={form.ort} onChange={set('ort')} autoComplete="address-level2" placeholder="Musterstadt" />
                {meldung('ort') && <em className="checkout__ferr">{meldung('ort')}</em>}
              </label>
            </div>
            <label className="checkout__field">
              <span>Land</span>
              <input type="text" value={form.land} onChange={set('land')} autoComplete="country-name" />
            </label>
            <label className="checkout__field">
              <span>Anmerkung <em>(optional)</em></span>
              <textarea rows={3} value={form.anmerkung} onChange={set('anmerkung')} placeholder="Wunschtermin, Sonderwünsche, Fragen …" />
            </label>
          </div>
        )}

        {/* Schritt 3 – Prüfen & Absenden */}
        {step === 2 && (
          <div className="checkout__body">
            <h2 className="checkout__h">Passt alles?</h2>
            <p className="checkout__lead">Prüf kurz deine Angaben – dann schicken wir dir dein Angebot.</p>

            <ul className="checkout__review">
              {inquiryItems.map((it) => (
                <li key={it.sku}>
                  {it.image && <img src={it.image} alt="" width="48" height="48" loading="lazy" />}
                  <div>
                    <p className="checkout__rname">{it.productName} <span>×{it.qty || 1}</span></p>
                    <p className="checkout__rvar">
                      {[it.colorLabel, it.sizeLabel && `Gr. ${it.sizeLabel}`, it.logoLabel && it.logoLabel !== '—' ? it.logoLabel : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="checkout__rprice">{it.unitPrice != null ? formatPrice(it.unitPrice * (it.qty || 1)) : 'auf Anfrage'}</span>
                </li>
              ))}
            </ul>
            <div className="checkout__sum">
              <span>Unverbindliche Zwischensumme{alleMitPreis ? '' : ' (teilw. auf Anfrage)'}</span>
              <strong>{alleMitPreis ? formatPrice(inquirySubtotal) : 'auf Anfrage'}</strong>
            </div>
            <p className="checkout__ship">zzgl. Versand – die exakten Kosten stehen in deinem Angebot.</p>

            <dl className="checkout__summary">
              <div><dt>Name</dt><dd>{form.name}</dd></div>
              <div><dt>E-Mail</dt><dd>{form.email}</dd></div>
              {form.telefon && <div><dt>Telefon</dt><dd>{form.telefon}</dd></div>}
              {form.firma && <div><dt>Firma</dt><dd>{form.firma}</dd></div>}
              <div><dt>Lieferung</dt><dd>{anschrift}</dd></div>
              {form.anmerkung && <div><dt>Anmerkung</dt><dd>{form.anmerkung}</dd></div>}
              <button type="button" className="checkout__editlink" onClick={() => { setStep(0); setTouched(false) }}>Angaben ändern</button>
            </dl>

            <label className="checkout__consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>Ich bin einverstanden, dass VIDEKO meine Angaben zur Bearbeitung dieser unverbindlichen Anfrage verwendet. Details in der <Link to="/datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</Link>.</span>
            </label>
            {touched && !consent && <p className="checkout__err">Bitte bestätige die Einwilligung, damit wir dir antworten dürfen.</p>}

            {/* Honeypot – für Menschen unsichtbar */}
            <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="checkout__hp" aria-hidden="true" />

            {fehler && (
              <div className="checkout__fallback">
                <p>{fehler}</p>
                {fallbackHref && (
                  <a className="checkout__btn checkout__btn--primary" href={fallbackHref}>
                    Anfrage als E-Mail senden <Mail size={16} strokeWidth={1.9} />
                  </a>
                )}
              </div>
            )}

            <p className="checkout__legal">
              Unverbindliche Angebotsanfrage – keine Bestellung, keine Zahlungspflicht, kein Vertrag.
              Wir melden uns mit einem individuellen Angebot inkl. Versandkosten.
            </p>
          </div>
        )}

        {/* Schritt 4 – Erfolg */}
        {step === 3 && (
          <div className="checkout__body">
            <div className="checkout__done">
              <div className="checkout__doneicon"><PartyPopper size={38} strokeWidth={1.5} /></div>
              <h2>Anfrage ist raus! 🎉</h2>
              <p>Danke! Wir haben deine Anfrage erhalten und schicken dir gleich per E-Mail dein persönliches Angebot inkl. Versandkosten.</p>
              <p className="checkout__donesub">Eine Eingangsbestätigung ist auf dem Weg an <strong>{form.email}</strong>. Schau zur Sicherheit auch im Spam-Ordner nach.</p>
              <button type="button" className="checkout__btn checkout__btn--primary" onClick={closeCheckout}>Alles klar</button>
            </div>
          </div>
        )}

        {/* Fußzeile mit Navigation */}
        {step < 3 && (
          <div className="checkout__foot">
            {step > 0 ? (
              <button type="button" className="checkout__btn checkout__btn--ghost" onClick={zurueck} disabled={busy}>
                <ArrowLeft size={16} strokeWidth={2} /> Zurück
              </button>
            ) : <span />}
            {step < 2 ? (
              <button type="button" className="checkout__btn checkout__btn--primary" onClick={weiter}>
                Weiter <ArrowRight size={16} strokeWidth={2} />
              </button>
            ) : (
              <button type="button" className="checkout__btn checkout__btn--primary" onClick={absenden} disabled={busy}>
                {busy ? (<><Loader2 size={16} className="checkout__spin" /> Wird gesendet …</>) : (<>Anfrage absenden <ArrowRight size={16} strokeWidth={2} /></>)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
