import { useCallback, useEffect, useRef, useState } from 'react'
import Seo from '../components/Seo.jsx'
import {
  FELD_GRENZEN,
  KANAELE,
  PHASEN_TEXTE,
  STADTFEST_EVENT,
  STADTFEST_FIRMEN,
  eventTagText,
  interessenFuer,
  phasenSchluessel,
  uhrzeitText,
  zeitraumText,
} from '../data/stadtfest.js'
import { DATENSCHUTZ_EVENT, TEILNAHMEBEDINGUNGEN } from '../data/stadtfest-recht.js'

/**
 * /stadtfest — die Registrierungsseite zum Aktionsstand.
 *
 * Das Formular ist immer da: vor dem Stadtfest, waehrend des Stadtfests und
 * Monate danach. Eine Registrierung ist aber ausdruecklich KEINE
 * Gewinnspielteilnahme. Drei Dinge, die hier sauber getrennt bleiben:
 *
 *   A) REGISTRIERUNG — passiert genau hier, auf dieser Seite.
 *   B) GEWINNSPIELTEILNAHME — entsteht erst am Stand, wenn ein Mitarbeiter
 *      den Vorgang bestaetigt und die Person das Gluecksrad dreht.
 *   C) HAUPTPREISQUALIFIKATION — nur, wenn das Rad auf HAUPTPREIS steht.
 *
 * Diese Seite kann ausschliesslich A. B und C entstehen im Studio, ueber die
 * geschuetzte Staff-API. Kein Text hier darf etwas anderes behaupten.
 *
 * Kein Header, kein Footer, keine acht Sections. Ein Flow: scannen,
 * ausfuellen, Bestaetigung vorzeigen. Die Seite liegt deshalb bewusst
 * ausserhalb von <Layout> und bringt ihr eigenes <Seo> mit (noindex,
 * nofollow — sie gehoert nicht in den Index und nicht in die Sitemap).
 *
 * Alles Eventbezogene kommt aus data/stadtfest.js, alle Rechtstexte aus
 * data/stadtfest-recht.js. Hier steht nur Ablauf und Darstellung.
 */

/* Vorschaumodus nur in eigens dafuer gebauten Builds. In der normalen
   Produktion ist die Konstante false, der Zweig faellt beim Minifizieren
   heraus und es gibt keinen Weg, einen Erfolgsschirm ohne echte
   Speicherung zu sehen. */
const VORSCHAU = import.meta.env.VITE_STADTFEST_VORSCHAU === '1'

const LEER = {
  vorname: '',
  nachname: '',
  email: '',
  telefon: '',
  plz: '',
  website: '', /* Honigtopf */
}

const EMAIL_MUSTER = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/* Eine einzige leere Liste statt eines neuen Arrays pro Render. */
const LEERE_MICROCOPY = []

function kurzName(vorname, nachname) {
  const initial = (nachname || '').trim().slice(0, 1)
  return `${(vorname || '').trim()} ${initial ? `${initial}.` : ''}`.trim()
}

/* ------------------------------------------------------------------ */
/* Rechtstext-Sheet                                                    */
/* ------------------------------------------------------------------ */

/**
 * Bottom-Sheet fuer Teilnahmebedingungen und Datenschutzhinweise.
 * Der volle Text muss vor dem Absenden erreichbar sein — aber nicht als
 * acht Seiten Fliesstext mitten im Formular.
 */
function RechtSheet({ dokument, onSchliessen }) {
  const schliessenRef = useRef(null)

  useEffect(() => {
    schliessenRef.current?.focus()
    const aufTaste = (e) => {
      if (e.key === 'Escape') onSchliessen()
    }
    document.addEventListener('keydown', aufTaste)
    const vorher = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aufTaste)
      document.body.style.overflow = vorher
    }
  }, [onSchliessen])

  return (
    <div
      className="stf-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={dokument.titel}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSchliessen()
      }}
    >
      <div className="stf-sheet__panel">
        <div className="stf-sheet__kopf">
          <h2 className="stf-sheet__titel">{dokument.titel}</h2>
          <button
            type="button"
            ref={schliessenRef}
            className="stf-sheet__zu"
            onClick={onSchliessen}
            aria-label="Schliessen"
          >
            ×
          </button>
        </div>

        <div className="stf-sheet__body">
          <p className="stf-sheet__warnung">{dokument.hinweis}</p>

          {dokument.abschnitte.map((abschnitt) => (
            <section className="stf-sheet__abschnitt" key={abschnitt.titel}>
              <h3 className="stf-sheet__h">{abschnitt.titel}</h3>
              {abschnitt.absaetze.map((absatz) => (
                <p className="stf-sheet__p" key={absatz.slice(0, 48)}>
                  {absatz}
                </p>
              ))}
            </section>
          ))}

          <p className="stf-sheet__p">
            Allgemeine Angaben zum Anbieter stehen im{' '}
            <a className="stf-sheet__extern" href="/impressum" target="_blank" rel="noreferrer">
              Impressum
            </a>{' '}
            und in der{' '}
            <a className="stf-sheet__extern" href="/datenschutz" target="_blank" rel="noreferrer">
              Datenschutzerklärung
            </a>
            .
          </p>

          <p className="stf-sheet__stand">Stand: {dokument.stand}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Seite                                                               */
/* ------------------------------------------------------------------ */

export default function Stadtfest() {
  /* Startwert null, und das ist hier die inhaltliche Entscheidung, nicht nur
     eine technische: /stadtfest ist dauerhaft oeffentlich, die vorgerenderte
     Datei aus dem Build kennt aber die Uhr des Besuchers nicht. Jeder feste
     Startwert waere deshalb irgendwann eine Falschaussage — ein eingebackenes
     Gewinnspielformular Monate nach dem Fest, oder eine Absage waehrend des
     Fests. Bis der Effekt unten die echte Phase gesetzt hat, steht deshalb nur
     der phasenneutrale Block (stillstand), der in PRE, EVENT und POST
     gleichermassen stimmt. Server- und erster Browser-Render sind identisch,
     es gibt also keinen Hydrationskonflikt. */
  const [phasenKey, setPhasenKey] = useState(null)
  const [ansicht, setAnsicht] = useState('formular')
  const [werte, setWerte] = useState(LEER)
  const [interessen, setInteressen] = useState([])
  const [agb, setAgb] = useState(false)
  const [alter, setAlter] = useState(false)
  const [consent, setConsent] = useState({}) /* { videko: ['email'], ... } */
  const [fehler, setFehler] = useState({})
  const [sammelfehler, setSammelfehler] = useState('')
  const [sendet, setSendet] = useState(false)
  const [beleg, setBeleg] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [microIndex, setMicroIndex] = useState(0)
  const [microWechsel, setMicroWechsel] = useState(false)
  const [jetzt, setJetzt] = useState(null)

  const laeuftRef = useRef(false)

  /* Die Texte der aktuellen Phase. Vor der Hydration steht hier null; dann
     rendert die Seite den phasenneutralen Block. */
  const texte = phasenKey ? PHASEN_TEXTE[phasenKey] : null

  /* Der eine Schalter, der ueber Pflichthaekchen, Wortwahl und
     Erfolgsschirm entscheidet — nicht darueber, ob gespeichert werden darf.
     Eintragen kann man sich in jeder Phase. */
  const gewinnspiel = texte ? texte.mitGewinnspiel : false
  const microcopy = texte ? texte.microcopy : LEERE_MICROCOPY
  const microAnzahl = microcopy.length

  /* --- Phase und Vorschau erst im Browser bestimmen -----------------
     Das vorgerenderte HTML kann die aktuelle Uhrzeit nicht kennen. Deshalb
     rendert die Seite zuerst den phasenneutralen Block und bestimmt die echte
     Phase erst hier. Die Regel set-state-in-effect ist genau dafuer
     ausgeschaltet: der "externe Zustand", mit dem hier abgeglichen wird, ist
     die Uhr. */
  useEffect(() => {
    const vorschau = VORSCHAU
      ? new URLSearchParams(window.location.search).get('vorschau')
      : null

    if (vorschau === 'vorher' || vorschau === 'event' || vorschau === 'nachher') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhasenKey(vorschau)
      return
    }

    setPhasenKey(phasenSchluessel(Date.now()))

    if (vorschau === 'erfolg' || vorschau === 'duplikat') {
      setBeleg({
        name: 'Dennis H.',
        code: '4827',
        zeitpunkt: Date.now(),
      })
      setJetzt(Date.now())
      setAnsicht(vorschau === 'duplikat' ? 'duplikat' : 'erfolg')
    }
    if (vorschau === 'fehler') {
      setWerte((w) => ({ ...w, email: 'dennis@' }))
      setFehler({
        vorname: 'Bitte trag deinen Vornamen ein.',
        email: 'Diese E-Mail-Adresse sieht nicht vollständig aus.',
        agb: 'Ohne die Teilnahmebedingungen geht es leider nicht.',
      })
      setSammelfehler('Da fehlt noch etwas. Die betroffenen Felder sind markiert.')
    }
  }, [])

  /* --- Microcopy erst nach der Hydration wechseln ------------------- */
  useEffect(() => {
    if (ansicht !== 'formular' || microAnzahl < 2) return undefined
    const takt = setInterval(() => {
      setMicroWechsel(true)
      setTimeout(() => {
        setMicroIndex((i) => (i + 1) % microAnzahl)
        setMicroWechsel(false)
      }, 380)
    }, 5200)
    return () => clearInterval(takt)
  }, [ansicht, microAnzahl])

  /* --- Laufende Uhr auf dem Erfolgsschirm --------------------------- */
  useEffect(() => {
    if (ansicht !== 'erfolg' && ansicht !== 'duplikat') return undefined
    /* Die Startzeit wird dort gesetzt, wo auf den Erfolgsschirm gewechselt
       wird. Hier laeuft nur noch der Sekundentakt weiter. */
    const takt = setInterval(() => setJetzt(Date.now()), 1000)
    return () => clearInterval(takt)
  }, [ansicht])

  const setzeWert = useCallback((feld, wert) => {
    setWerte((w) => ({ ...w, [feld]: wert }))
    setFehler((f) => (f[feld] ? { ...f, [feld]: undefined } : f))
  }, [])

  const chipUmschalten = useCallback((key) => {
    setInteressen((liste) =>
      liste.includes(key) ? liste.filter((k) => k !== key) : [...liste, key],
    )
  }, [])

  /**
   * Firma an- oder abwaehlen.
   *
   * Es wird bewusst KEIN Kanal vorausgewaehlt. Das Haekchen oeffnet nur die
   * Kanalauswahl; die Einwilligung entsteht erst, wenn mindestens ein Kanal
   * bewusst angetippt wurde. Eine Firma mit leerer Kanalliste wird beim
   * Absenden als Fehler gemeldet und nie gespeichert.
   */
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
      /* Leere Liste bleibt stehen: das Haekchen ist gesetzt, der Kanal fehlt
         noch. Abgehakt wird ausschliesslich ueber die Checkbox. */
      return { ...c, [firma]: neu }
    })
  }, [])

  /* --- Pruefung ---------------------------------------------------- */
  function pruefen() {
    const f = {}
    if (!werte.vorname.trim()) f.vorname = 'Bitte trag deinen Vornamen ein.'
    if (!werte.nachname.trim()) f.nachname = 'Bitte trag deinen Nachnamen ein.'
    if (!werte.email.trim()) f.email = 'Ohne E-Mail können wir dich nicht benachrichtigen.'
    else if (!EMAIL_MUSTER.test(werte.email.trim())) {
      f.email = 'Diese E-Mail-Adresse sieht nicht vollständig aus.'
    }
    if (werte.plz.trim() && !/^\d{5}$/.test(werte.plz.trim())) {
      f.plz = 'Fünf Ziffern, bitte.'
    }
    if (werte.telefon.trim() && werte.telefon.replace(/\D/g, '').length < 6) {
      f.telefon = 'Diese Nummer wirkt zu kurz.'
    }
    /* Teilnahmebedingungen und Mindestalter gehoeren zum Gewinnspiel. Nach
       dem Stadtfest gibt es keines mehr — ein Haekchen waere dann die
       Zustimmung zu etwas, das gar nicht mehr stattfindet. */
    if (gewinnspiel) {
      if (!agb) f.agb = 'Ohne die Teilnahmebedingungen geht es leider nicht.'
      if (STADTFEST_EVENT.minimumAge && !alter) {
        f.alter = `Die Teilnahme ist erst ab ${STADTFEST_EVENT.minimumAge} möglich.`
      }
    }
    /* Werbeeinwilligung: ein gesetztes Haekchen ohne Kanal ist keine
       Einwilligung. Statt still zu speichern oder still zu verwerfen wird
       nachgefragt — der Haken bleibt sichtbar, die Wahl wird bewusst. */
    for (const firma of STADTFEST_FIRMEN) {
      const kanaele = consent[firma.key]
      if (!kanaele) continue
      if (kanaele.length === 0) {
        f[`consent-${firma.key}`] = `Bitte wähl für ${firma.label} mindestens einen Weg — oder nimm das Häkchen wieder weg.`
      } else if (kanaele.includes('telefon') && !werte.telefon.trim()) {
        f.telefon = 'Für die Einwilligung per Telefon brauchen wir eine Nummer.'
      }
    }
    return f
  }

  async function absenden(e) {
    e.preventDefault()
    /* Doppelklickschutz: der Ref greift sofort, der State erst beim
       naechsten Render. */
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

    const jetztMs = Date.now()
    /* Defensiv: ein gesetztes Haekchen ohne Kanal wird nicht als Einwilligung
       uebertragen. Die Pruefung oben faengt den Fall bereits ab — aber eine
       inhaltsleere Einwilligung darf unter keinen Umstaenden im Datensatz
       landen. */
    const consentSauber = Object.fromEntries(
      Object.entries(consent).filter(([, kanaele]) => kanaele.length > 0),
    )
    const nutzlast = {
      eventId: STADTFEST_EVENT.id,
      vorname: werte.vorname.trim(),
      nachname: werte.nachname.trim(),
      email: werte.email.trim(),
      telefon: werte.telefon.trim(),
      plz: werte.plz.trim(),
      interessen,
      teilnahmebedingungen: gewinnspiel,
      mindestalterBestaetigt: gewinnspiel && STADTFEST_EVENT.minimumAge ? alter : null,
      consent: consentSauber,
      website: werte.website, /* Honigtopf — gefuellt heisst Bot */
      quelle: typeof window !== 'undefined' ? window.location.search : '',
    }

    try {
      const antwort = await fetch('/api/stadtfest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutzlast),
      })
      const daten = await antwort.json().catch(() => ({}))

      /* Erfolg gibt es ausschliesslich gegen eine bestaetigte Speicherung. */
      if (!antwort.ok || !daten.gespeichert) {
        setSammelfehler(
          daten.meldung
            || 'Das hat gerade nicht geklappt. Bitte noch einmal antippen — oder kurz beim Team melden.',
        )
        return
      }

      setBeleg({
        name: kurzName(nutzlast.vorname, nutzlast.nachname),
        code: daten.code,
        zeitpunkt: daten.zeitpunkt ? Date.parse(daten.zeitpunkt) : jetztMs,
      })
      setJetzt(Date.now())
      setAnsicht(daten.status === 'bekannt' ? 'duplikat' : 'erfolg')
    } catch {
      setSammelfehler('Keine Verbindung. Netz kurz prüfen und noch einmal antippen.')
    } finally {
      laeuftRef.current = false
      setSendet(false)
    }
  }

  /* --- Bausteine --------------------------------------------------- */

  const kopf = texte ? (
    <header className="stf-kopf">
      <p className="stf-kopf__marken">VIDEKO × ATLAS WEALTH</p>
      <h1 className="stf-kopf__titel">{texte.titel}</h1>
      <p className="stf-kopf__sub">{texte.subline}</p>
      <p className="stf-kopf__micro" data-wechsel={microWechsel ? '1' : '0'}>
        {microcopy[microIndex] ?? ''}
      </p>
      <div className="stf-trenner" />
    </header>
  ) : null

  function feld({ name, label, typ = 'text', autoComplete, inputMode, pflicht, platzhalter }) {
    return (
      <div className={`stf-feld${fehler[name] ? ' stf-feld--fehler' : ''}`}>
        <label className="stf-feld__label" htmlFor={`stf-${name}`}>
          {label}
          {!pflicht && <span className="stf-feld__opt"> · optional</span>}
        </label>
        <input
          id={`stf-${name}`}
          className="stf-feld__input"
          type={typ}
          name={name}
          value={werte[name]}
          onChange={(e) => setzeWert(name, e.target.value)}
          maxLength={FELD_GRENZEN[name]}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={platzhalter}
          required={pflicht}
          aria-invalid={fehler[name] ? 'true' : undefined}
          aria-describedby={fehler[name] ? `stf-${name}-fehler` : undefined}
        />
        {fehler[name] && (
          <span className="stf-feld__fehler" id={`stf-${name}-fehler`}>
            {fehler[name]}
          </span>
        )}
      </div>
    )
  }

  const formular = texte ? (
    <form className="stf-form" onSubmit={absenden} noValidate>
      <div>
        <p className="stf-gruppe__titel">{texte.formularTitel}</p>
        <p className="stf-gruppe__text">{texte.formularText}</p>
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
        <label htmlFor="stf-website">Website</label>
        <input
          id="stf-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={werte.website}
          onChange={(e) => setzeWert('website', e.target.value)}
        />
      </div>

      <div>
        <p className="stf-gruppe__titel">Was könnte bei dir irgendwann interessant werden?</p>
        <div className="stf-chips">
          {interessenFuer(gewinnspiel).map((interesse) => (
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

      {/* Teilnahmebedingungen. Bewusst eine eigene, neutrale Karte —
          hier steht nichts von Werbung.

          Ohne Gewinnspiel entfaellt diese Karte vollstaendig: es gibt dann
          nichts zu akzeptieren und kein Mindestalter zu bestaetigen. Der
          Datenschutzhinweis bleibt, denn gespeichert wird trotzdem. */}
      {gewinnspiel ? (
      <div className="stf-karte">
        <label className={`stf-check${fehler.agb ? ' stf-check--fehler' : ''}`} htmlFor="stf-agb">
          <input
            id="stf-agb"
            className="stf-check__box"
            type="checkbox"
            checked={agb}
            onChange={(e) => {
              setAgb(e.target.checked)
              setFehler((f) => ({ ...f, agb: undefined }))
            }}
          />
          <span className="stf-check__text">
            Ich akzeptiere die Teilnahmebedingungen.
            {fehler.agb && <span className="stf-feld__fehler"> {fehler.agb}</span>}
          </span>
        </label>

        {STADTFEST_EVENT.minimumAge ? (
          <label className={`stf-check${fehler.alter ? ' stf-check--fehler' : ''}`} htmlFor="stf-alter">
            <input
              id="stf-alter"
              className="stf-check__box"
              type="checkbox"
              checked={alter}
              onChange={(e) => {
                setAlter(e.target.checked)
                setFehler((f) => ({ ...f, alter: undefined }))
              }}
            />
            <span className="stf-check__text">
              Ich bin mindestens {STADTFEST_EVENT.minimumAge} Jahre alt.
              {fehler.alter && <span className="stf-feld__fehler"> {fehler.alter}</span>}
            </span>
          </label>
        ) : null}

        <div className="stf-linkreihe">
          <button type="button" className="stf-link" onClick={() => setSheet('teilnahme')}>
            Teilnahmebedingungen
          </button>
          <button type="button" className="stf-link" onClick={() => setSheet('datenschutz')}>
            Datenschutzhinweise
          </button>
        </div>
      </div>
      ) : (
        <div className="stf-linkreihe">
          <button type="button" className="stf-link" onClick={() => setSheet('datenschutz')}>
            Datenschutzhinweise
          </button>
        </div>
      )}

      {/* Marketing. Technisch und visuell getrennt von allem darueber.
          Nichts ist vorausgewaehlt, nichts ist Voraussetzung. */}
      <div className="stf-karte stf-karte--marketing">
        <h2 className="stf-karte__titel">Dürfen wir uns nochmal melden?</h2>
        <p className="stf-karte__frei">
          {gewinnspiel
            ? 'Freiwillig. Dein Gewinnspiel hängt nicht davon ab.'
            : 'Freiwillig. Ohne die Häkchen bleibt es einfach beim Eintrag.'}
        </p>

        {STADTFEST_FIRMEN.map((firma) => {
          const an = Boolean(consent[firma.key])
          return (
            <div className="stf-firma" key={firma.key}>
              <label className="stf-check" htmlFor={`stf-firma-${firma.key}`}>
                <input
                  id={`stf-firma-${firma.key}`}
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
                  <p className="stf-kanal__frage">Wie? Bitte mindestens einen Weg wählen.</p>
                  {KANAELE.map((kanal) => {
                    const gewaehlt = consent[firma.key]?.includes(kanal.key)
                    /* Telefon ist erst waehlbar, wenn eine Nummer dasteht.
                       Sonst entstuende eine Einwilligung ins Leere. */
                    const gesperrt = kanal.key === 'telefon' && !werte.telefon.trim()
                    return (
                      <button
                        key={kanal.key}
                        type="button"
                        className="stf-kanal__knopf"
                        aria-pressed={Boolean(gewaehlt)}
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
                  {fehler[`consent-${firma.key}`] && (
                    <p className="stf-feld__fehler" role="alert">{fehler[`consent-${firma.key}`]}</p>
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
        {sendet ? texte.ctaLaeuft : texte.cta}
      </button>

      <p className="stf-hinweis">
        {gewinnspiel
          ? `${STADTFEST_EVENT.name} · Teilnahme kostenlos · kein Kauf erforderlich`
          : `${STADTFEST_EVENT.name} · Registrierung ohne Gewinnspiel`}
      </p>
    </form>
  ) : null

  /* Der Beleg. Er bestaetigt genau eine Sache: die Registrierung ist
     gespeichert. Ob daraus eine Gewinnspielteilnahme wird, entscheidet
     spaeter der bestaetigte Dreh am Stand — deshalb steht das auch dort,
     wo man es sonst ueberlesen wuerde. */
  const erfolg =
    beleg && texte ? (
      <section className="stf-erfolg">
        <h1 className="stf-erfolg__haken">
          {ansicht === 'duplikat' ? texte.duplikatTitel : texte.erfolgTitel}
        </h1>
        <p className="stf-erfolg__zeig">
          {ansicht === 'duplikat' ? texte.duplikatText : texte.erfolgText}
        </p>

        <div className="stf-platte">
          {phasenKey === 'event' && (
            <span className="stf-platte__live">
              <span className="stf-platte__punkt" />
              Live
            </span>
          )}
          <p className="stf-platte__name">{beleg.name}</p>
          {phasenKey === 'event' && (
            <p className="stf-platte__uhr">{uhrzeitText(jetzt ?? beleg.zeitpunkt)}</p>
          )}
          <p className="stf-platte__zeile">
            {eventTagText(beleg.zeitpunkt)} ·{' '}
            <span className="stf-platte__code">Code {beleg.code}</span>
          </p>
        </div>

        {texte.erfolgHinweis ? (
          <p className="stf-phase__text">{texte.erfolgHinweis}</p>
        ) : null}

        {gewinnspiel && (
          <p className="stf-erfolg__fuss">Screenshot zählt nicht. Wahrscheinlich.</p>
        )}

        <div className="stf-linkreihe">
          {gewinnspiel && (
            <button type="button" className="stf-link" onClick={() => setSheet('teilnahme')}>
              Teilnahmebedingungen
            </button>
          )}
          <button type="button" className="stf-link" onClick={() => setSheet('datenschutz')}>
            Datenschutzhinweise
          </button>
        </div>
      </section>
    ) : null

  /* Was die Phase zusaetzlich zum Formular sagt.

     Vorher: die Eckdaten, damit klar ist, wohin man den Code mitbringt.
     Nachher: der Hinweis, dass das Gewinnspiel vorbei ist.
     Waehrend des Fests braucht es beides nicht — da steht man davor. */
  const phasenBlock =
    phasenKey === 'vorher' ? (
      <section className="stf-phase">
        <dl className="stf-eck">
          <div className="stf-eck__zeile">
            <dt className="stf-eck__dt">Wann</dt>
            <dd className="stf-eck__dd">{zeitraumText()}</dd>
          </div>
          <div className="stf-eck__zeile">
            <dt className="stf-eck__dt">Wo</dt>
            <dd className="stf-eck__dd">{STADTFEST_EVENT.ort}</dd>
          </div>
          <div className="stf-eck__zeile">
            <dt className="stf-eck__dt">Wer</dt>
            <dd className="stf-eck__dd">VIDEKO K&uuml;chen &times; ATLAS Wealth</dd>
          </div>
        </dl>
        <p className="stf-phase__text">
          Am Stand steht ein Gl&uuml;cksrad. Der Eintrag hier ist die Vorarbeit
          &mdash; die Teilnahme am Gewinnspiel entsteht erst vor Ort, mit dem
          best&auml;tigten Dreh.
        </p>
      </section>
    ) : phasenKey === 'nachher' ? (
      <section className="stf-phase">
        <p className="stf-phase__text">{texte?.hinweis}</p>
      </section>
    ) : null

  /* Der vorgerenderte Stand: Name, Termin, Ort. Alles drei gilt vor, waehrend
     und nach dem Fest. Was nicht gilt, steht hier auch nicht — kein Stempel,
     kein Lostopf, keine Absage. */
  const stillstand = (
    <section className="stf-phase">
      <h1 className="stf-phase__titel">{STADTFEST_EVENT.name}</h1>
      <p className="stf-phase__sub">
        {zeitraumText()} &middot; {STADTFEST_EVENT.ort}
      </p>
      <p className="stf-phase__text">
        VIDEKO K&uuml;chen &times; ATLAS Wealth.
      </p>
      <noscript>
        <p className="stf-phase__text">
          Diese Seite richtet sich nach dem Datum und braucht daf&uuml;r JavaScript.
          Ohne bleibt es bei diesem Hinweis: Teilgenommen wird ausschlie&szlig;lich
          w&auml;hrend des Stadtfests am Stand.
        </p>
      </noscript>
      <div className="stf-linkreihe">
        <a className="stf-link" href="/entdecken">VIDEKO entdecken</a>
      </div>
    </section>
  )

  /* Das Formular gibt es in jeder Phase. Unterschiedlich sind die Texte, die
     Pflichthaken und der Beleg — nicht die Frage, ob gespeichert wird. */
  let inhalt
  if (phasenKey === null) inhalt = stillstand
  else if (ansicht === 'erfolg' || ansicht === 'duplikat') inhalt = erfolg
  else
    inhalt = (
      <>
        {phasenBlock}
        {formular}
      </>
    )

  return (
    <>
      <Seo
        title={`${STADTFEST_EVENT.name} | VIDEKO Küchen`}
        description="Aktionsseite zum Stadtfest. Nur über den Event-QR-Code erreichbar."
        canonicalPath="/stadtfest"
        noindex
        nofollow
      />

      <main className="stf">
        <div className="stf__spalte">
          {/* Der Erfolgsschirm ersetzt das Formular vollstaendig — inklusive
              Hero. Stehen bleibt nur die Markenzeile, damit klar ist, wessen
              Bildschirm das Team da vor sich hat. */}
          {ansicht === 'formular' && kopf ? (
            kopf
          ) : (
            <header className="stf-kopf">
              <p className="stf-kopf__marken">VIDEKO × ATLAS WEALTH</p>
            </header>
          )}
          {inhalt}
        </div>

        {sheet && (
          <RechtSheet
            dokument={sheet === 'teilnahme' ? TEILNAHMEBEDINGUNGEN : DATENSCHUTZ_EVENT}
            onSchliessen={() => setSheet(null)}
          />
        )}
      </main>
    </>
  )
}
