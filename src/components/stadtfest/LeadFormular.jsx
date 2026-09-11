import { useCallback, useRef, useState } from 'react'
import {
  FELD_GRENZEN,
  KANAELE,
  LEAD_CTA_TEXT,
  LEAD_CTA_TEXT_LAEUFT,
  LEAD_INTERESSEN,
  STADTFEST_EVENT,
  STADTFEST_FIRMEN,
} from '../../data/stadtfest.js'

/**
 * Kontaktformular fuer die Phasen PRE und POST von /stadtfest.
 *
 * Bewusst NICHT das Gewinnspielformular mit abgeschalteten Feldern, sondern
 * ein eigenes, kuerzeres Formular mit eigenem Endpunkt und eigener Tabelle.
 * Der Grund ist fachlich, nicht kosmetisch: wer hier etwas eintraegt, hat am
 * Gewinnspiel NICHT teilgenommen. Es gibt deshalb hier
 *
 *   - keine Teilnahmebedingungen und keine Alterscheckbox,
 *   - keinen Stempel und keinen Anzeigecode,
 *   - keine Hauptpreisqualifikation und keinen Lostopf.
 *
 * Was bleibt: die sauber getrennten, niemals vorausgewaehlten
 * Werbeeinwilligungen je Marke mit bewusster Kanalwahl.
 */

const LEER = {
  vorname: '',
  nachname: '',
  email: '',
  telefon: '',
  plz: '',
  website: '',
}

const EMAIL_MUSTER = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function LeadFormular({ phase, titel, text, onErfolg }) {
  const [werte, setWerte] = useState(LEER)
  const [interessen, setInteressen] = useState([])
  const [consent, setConsent] = useState({})
  const [fehler, setFehler] = useState({})
  const [sammelfehler, setSammelfehler] = useState('')
  const [sendet, setSendet] = useState(false)

  const laeuftRef = useRef(false)

  const setzeWert = useCallback((feld, wert) => {
    setWerte((w) => ({ ...w, [feld]: wert }))
    setFehler((f) => (f[feld] ? { ...f, [feld]: undefined } : f))
  }, [])

  const chipUmschalten = useCallback((key) => {
    setInteressen((liste) => (
      liste.includes(key) ? liste.filter((k) => k !== key) : [...liste, key]
    ))
  }, [])

  /* Das Haekchen oeffnet nur die Kanalauswahl. Die Einwilligung entsteht
     erst, wenn mindestens ein Kanal bewusst angetippt wurde. */
  const firmaUmschalten = useCallback((key) => {
    setConsent((c) => {
      const naechste = { ...c }
      if (naechste[key]) delete naechste[key]
      else naechste[key] = []
      return naechste
    })
  }, [])

  const kanalUmschalten = useCallback((firma, kanal) => {
    setConsent((c) => {
      const aktuell = c[firma]
      if (!aktuell) return c
      const neu = aktuell.includes(kanal)
        ? aktuell.filter((k) => k !== kanal)
        : [...aktuell, kanal]
      return { ...c, [firma]: neu }
    })
  }, [])

  function pruefen() {
    const f = {}
    if (!werte.vorname.trim()) f.vorname = 'Bitte trag deinen Vornamen ein.'
    if (!werte.nachname.trim()) f.nachname = 'Bitte trag deinen Nachnamen ein.'
    if (!werte.email.trim()) f.email = 'Ohne E-Mail koennen wir uns nicht melden.'
    else if (!EMAIL_MUSTER.test(werte.email.trim())) {
      f.email = 'Diese E-Mail-Adresse sieht nicht vollstaendig aus.'
    }
    if (werte.plz.trim() && !/^\d{5}$/.test(werte.plz.trim())) {
      f.plz = 'Fuenf Ziffern, bitte.'
    }
    if (werte.telefon.trim() && werte.telefon.replace(/\D/g, '').length < 6) {
      f.telefon = 'Diese Nummer wirkt zu kurz.'
    }
    for (const firma of STADTFEST_FIRMEN) {
      const kanaele = consent[firma.key]
      if (!kanaele) continue
      if (kanaele.length === 0) {
        f['consent-' + firma.key] = 'Bitte waehl mindestens einen Weg aus oder nimm das Haekchen wieder weg.'
      } else if (kanaele.includes('telefon') && !werte.telefon.trim()) {
        f.telefon = 'Fuer die Einwilligung per Telefon brauchen wir eine Nummer.'
      }
    }
    return f
  }

  async function absenden(e) {
    e.preventDefault()
    if (laeuftRef.current) return
    const f = pruefen()
    setFehler(f)
    if (Object.keys(f).length > 0) {
      setSammelfehler('Da fehlt noch etwas. Die betroffenen Felder sind markiert.')
      return
    }
    setSammelfehler('')
    laeuftRef.current = true
    setSendet(true)

    const consentSauber = Object.fromEntries(
      Object.entries(consent).filter(([, kanaele]) => kanaele.length > 0),
    )
    const nutzlast = {
      eventId: STADTFEST_EVENT.id,
      phase,
      vorname: werte.vorname.trim(),
      nachname: werte.nachname.trim(),
      email: werte.email.trim(),
      telefon: werte.telefon.trim(),
      plz: werte.plz.trim(),
      interessen,
      consent: consentSauber,
      website: werte.website,
      quelle: typeof window === 'undefined' ? '' : window.location.search,
    }

    try {
      const antwort = await fetch('/api/stadtfest-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutzlast),
      })
      const daten = await antwort.json().catch(() => ({}))

      /* Erfolg gibt es ausschliesslich gegen eine bestaetigte Speicherung.
         Ohne erreichbares Backend meldet dieser Zweig nie Erfolg. */
      if (!antwort.ok || !daten.gespeichert) {
        setSammelfehler(daten.meldung || 'Das hat gerade nicht geklappt. Bitte noch einmal antippen.')
        return
      }

      onErfolg({ consent: consentSauber })
    } catch {
      setSammelfehler('Keine Verbindung. Netz kurz pruefen und noch einmal antippen.')
    } finally {
      laeuftRef.current = false
      setSendet(false)
    }
  }

  function feld({ name, label, typ = 'text', autoComplete, inputMode, pflicht, platzhalter }) {
    return (
      <div className={'stf-feld' + (fehler[name] ? ' stf-feld--fehler' : '')}>
        <label className="stf-feld__label" htmlFor={'stfl-' + name}>
          {label}
          {!pflicht && <span className="stf-feld__opt"> &middot; optional</span>}
        </label>
        <input
          id={'stfl-' + name}
          className="stf-feld__input"
          type={typ}
          name={name}
          value={werte[name]}
          onChange={(e) => setzeWert(name, e.target.value)}
          maxLength={FELD_GRENZEN[name]}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={platzhalter}
          aria-invalid={fehler[name] ? 'true' : undefined}
          aria-describedby={fehler[name] ? 'stfl-' + name + '-fehler' : undefined}
        />
        {fehler[name] && (
          <span className="stf-feld__fehler" id={'stfl-' + name + '-fehler'}>
            {fehler[name]}
          </span>
        )}
      </div>
    )
  }

  return (
    <form className="stf-form" onSubmit={absenden} noValidate>
      <div>
        <p className="stf-gruppe__titel">{titel}</p>
        {text && <p className="stf-gruppe__text">{text}</p>}
        <div className="stf-reihe stf-reihe--zwei">
          {feld({ name: 'vorname', label: 'Vorname', autoComplete: 'given-name', pflicht: true })}
          {feld({ name: 'nachname', label: 'Nachname', autoComplete: 'family-name', pflicht: true })}
        </div>
        <div className="stf-reihe" style={{ marginTop: 14 }}>
          {feld({
            name: 'email',
            label: 'E-Mail',
            typ: 'email',
            autoComplete: 'email',
            inputMode: 'email',
            pflicht: true,
            platzhalter: 'du@beispiel.de',
          })}
        </div>
        <div className="stf-reihe stf-reihe--zwei" style={{ marginTop: 14 }}>
          {feld({
            name: 'telefon',
            label: 'Mobilnummer',
            typ: 'tel',
            autoComplete: 'tel',
            inputMode: 'tel',
          })}
          {feld({
            name: 'plz',
            label: 'PLZ',
            autoComplete: 'postal-code',
            inputMode: 'numeric',
          })}
        </div>
      </div>

      {/* Honigtopf. Menschen sehen das Feld nicht, Bots fuellen es aus. */}
      <div className="stf-honig" aria-hidden="true">
        <label htmlFor="stfl-website">Website</label>
        <input
          id="stfl-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={werte.website}
          onChange={(e) => setzeWert('website', e.target.value)}
        />
      </div>

      <div>
        <p className="stf-gruppe__titel">Worum geht es bei dir?</p>
        <div className="stf-chips">
          {LEAD_INTERESSEN.map((interesse) => (
            <button
              key={interesse.key}
              type="button"
              className="stf-chip"
              aria-pressed={interessen.includes(interesse.key)}
              onClick={() => chipUmschalten(interesse.key)}
            >
              {interesse.label}
            </button>
          ))}
        </div>
      </div>

      {/* Einwilligungen. Getrennt je Marke, nichts vorausgewaehlt. */}
      <div className="stf-karte stf-karte--marketing">
        <h2 className="stf-karte__titel">D&uuml;rfen wir uns melden?</h2>
        <p className="stf-karte__frei">
          Freiwillig. Ohne H&auml;kchen speichern wir deine Angaben und melden uns nicht.
        </p>

        {STADTFEST_FIRMEN.map((firma) => {
          const an = Boolean(consent[firma.key])
          return (
            <div className="stf-firma" key={firma.key}>
              <label className="stf-check" htmlFor={'stfl-firma-' + firma.key}>
                <input
                  id={'stfl-firma-' + firma.key}
                  className="stf-check__box"
                  type="checkbox"
                  checked={an}
                  onChange={() => firmaUmschalten(firma.key)}
                />
                <span className="stf-check__text">
                  <span className="stf-firma__name">{firma.label}</span>
                  <span className="stf-check__klein">{firma.text}</span>
                </span>
              </label>

              {an && (
                <div className="stf-kanal">
                  <p className="stf-kanal__frage">Wie? Bitte mindestens einen Weg w&auml;hlen.</p>
                  {KANAELE.map((kanal) => {
                    const gewaehlt = (consent[firma.key] || []).includes(kanal.key)
                    const gesperrt = kanal.key === 'telefon' && !werte.telefon.trim()
                    return (
                      <button
                        key={kanal.key}
                        type="button"
                        className="stf-kanal__knopf"
                        aria-pressed={gewaehlt}
                        disabled={gesperrt}
                        onClick={() => kanalUmschalten(firma.key, kanal.key)}
                      >
                        {kanal.label}
                      </button>
                    )
                  })}
                  {!werte.telefon.trim() && (
                    <p className="stf-kanal__hinweis">
                      Telefon geht erst, wenn oben eine Mobilnummer steht.
                    </p>
                  )}
                  {fehler['consent-' + firma.key] && (
                    <p className="stf-feld__fehler" role="alert">
                      {fehler['consent-' + firma.key]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sammelfehler && (
        <p className="stf-sammelfehler" role="alert">
          {sammelfehler}
        </p>
      )}

      <button type="submit" className="stf-cta" disabled={sendet}>
        {sendet ? LEAD_CTA_TEXT_LAEUFT : LEAD_CTA_TEXT}
      </button>

      <p className="stf-hinweis">
        Kein Gewinnspiel &middot; keine Teilnahme &middot; jederzeit widerrufbar
      </p>
    </form>
  )
}
