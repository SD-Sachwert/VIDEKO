import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Trophy } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import TerminalRahmen, {
  Gewinne,
  Ikon,
  Metrik,
  Raute,
  Schriftzug,
  Truhe,
  Uhr,
} from '../components/TerminalRahmen.jsx'
import { terminalRuf } from '../data/terminal-api.js'
import {
  EMAIL_MUSTER,
  FELD_GRENZEN,
  TERMINAL_KAMPAGNE,
  TEXTE,
  ZIEHUNG_KARTEN,
  deckelNummer,
  deckelText,
  fuelle,
  missionStand,
  instagramNormalisieren,
  terminText,
  zahl,
} from '../data/terminal.js'

/**
 * /terminal/ziehung — die oeffentliche Live-Ziehung (Zustand D).
 *
 * Diese Seite braucht keinen Code, keine Aktivierung und erst recht keinen
 * Adminzugang: sie ist die Leinwand, auf die waehrend der Ziehung alle
 * schauen. Sie zeigt deshalb ausschliesslich oeffentliche Werte — die
 * gezogene Nummer, die Anzahl aktivierter Deckel, Termin und Meldefrist.
 *
 * KEINE TEILNEHMERDATEN. Die Seite fragt /api/terminal ohne Sitzungsbeleg
 * und bekommt von dort auch keine Namen, Handles oder E-Mail-Adressen —
 * eine gezogene Nummer ist eine Zahl, nicht eine Person.
 *
 * Die gezogene Nummer kommt vom Server und wird dort kryptografisch aus den
 * aktivierten Nummern gelost (api/terminal-admin.js). Hier wird nichts
 * gewuerfelt; diese Seite liest nur ab.
 *
 * GEWINN MELDEN sammelt Deckelnummer, Instagram-Name, E-Mail und optional
 * eine Nachricht. Das ist eine Meldung, keine Gewinnbestaetigung: geprueft
 * wird von Hand — Originaldeckel, Teilnahme, Follow, Frist.
 */

const ABSTAND_MS = 20000 /* so oft holt die Seite den Stand neu */

const LEERE_MELDUNG = {
  deckel: '',
  instagram: '',
  email: '',
  nachricht: '',
  website: '' /* Honigtopf */,
}

const GESAMT = zahl(TERMINAL_KAMPAGNE.deckelGesamt)

export default function TerminalZiehung() {
  const [kennzahlen, setKennzahlen] = useState(null)
  const [ansicht, setAnsicht] = useState('ziehung')

  const [formular, setFormular] = useState(LEERE_MELDUNG)
  const [feldFehler, setFeldFehler] = useState({})
  const [sendet, setSendet] = useState(false)

  const melden = useRef(null)

  /* ---------------------------------------------------------------- */
  /* Stand holen — beim Ankommen und danach im Takt                   */
  /* ---------------------------------------------------------------- */

  const holen = useCallback(async (signal) => {
    const antwort = await terminalRuf({ aktion: 'zustand' }, signal)
    if (signal?.aborted) return
    if (antwort.ok) {
      setKennzahlen({ aktiviert: antwort.aktiviert ?? 0, ...antwort.einstellungen })
    }
  }, [])

  useEffect(() => {
    const abbruch = new AbortController()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    holen(abbruch.signal)

    /* Nachladen nur, wenn die Seite wirklich angeschaut wird. Ein Tab im
       Hintergrund muss die Funktion nicht alle zwanzig Sekunden wecken. */
    const takt = setInterval(() => {
      if (document.visibilityState === 'visible') holen(abbruch.signal)
    }, ABSTAND_MS)

    const beiRueckkehr = () => {
      if (document.visibilityState === 'visible') holen(abbruch.signal)
    }
    document.addEventListener('visibilitychange', beiRueckkehr)

    return () => {
      abbruch.abort()
      clearInterval(takt)
      document.removeEventListener('visibilitychange', beiRueckkehr)
    }
  }, [holen])

  /* ---------------------------------------------------------------- */
  /* Gewinn melden                                                    */
  /* ---------------------------------------------------------------- */

  function aendern(feld, wert) {
    setFormular((alt) => ({ ...alt, [feld]: wert }))
    setFeldFehler((alt) => (alt[feld] ? { ...alt, [feld]: undefined } : alt))
  }

  function meldungOeffnen() {
    setAnsicht('melden')
    /* Nach dem Umschalten steht das Formular im Markup — dann dorthin
       springen, damit auf einem Handy nicht unklar bleibt, was passiert ist. */
    requestAnimationFrame(() => {
      melden.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      melden.current?.querySelector('input')?.focus()
    })
  }

  async function meldungSenden(ereignis) {
    ereignis.preventDefault()
    if (sendet) return

    const nummer = deckelNummer(formular.deckel)
    const handle = instagramNormalisieren(formular.instagram)
    const email = formular.email.trim()

    const fehler = {}
    if (nummer == null) fehler.deckel = fuelle(TEXTE.b.fehler.nummer, { gesamt: GESAMT })
    if (!handle) fehler.instagram = TEXTE.b.fehler.instagram
    if (!EMAIL_MUSTER.test(email)) fehler.email = TEXTE.b.fehler.email

    setFeldFehler(fehler)
    if (Object.keys(fehler).length > 0) return

    setSendet(true)
    const antwort = await terminalRuf({
      aktion: 'melden',
      deckel: nummer,
      instagram: handle,
      email,
      nachricht: formular.nachricht.trim().slice(0, FELD_GRENZEN.nachricht),
      website: formular.website,
    })
    setSendet(false)

    if (antwort.ok) {
      setFormular(LEERE_MELDUNG)
      setAnsicht('dank')
      return
    }

    setFeldFehler({ allgemein: TEXTE.b.fehler.allgemein })
  }

  /* ---------------------------------------------------------------- */

  const live = Boolean(kennzahlen?.live)
  const gezogen = kennzahlen?.gezogeneNummer ?? null
  const termin = terminText(kennzahlen?.naechsteZiehung)
  const frist = terminText(kennzahlen?.meldefristBis)
  /* Die Mission hat Stufen: angezeigt wird immer die naechste. */
  const mission = missionStand(kennzahlen?.followerZahl ?? 0, kennzahlen?.meilensteinGewinne)
  const followerZiel = mission.naechste?.ziel ?? mission.stufen[mission.stufen.length - 1].ziel
  const uhr = <Uhr zielIso={kennzahlen?.naechsteZiehung} />

  return (
    <>
      <Seo
        title="Live-Ziehung | VIDEKO Küchen"
        description="Die öffentliche Ziehung der VIDEKO Bierdeckel-Aktion."
        canonicalPath="/terminal/ziehung"
        noindex
        nofollow
      />

      <TerminalRahmen>
        {/* Rot kommt auf dieser Seite genau einmal vor, und nur solange die
            Ziehung wirklich laeuft. Der Punkt pulsiert, das Wort steht
            daneben — die Aussage haengt nicht an der Farbe. */}
        {live ? (
          <p className="trm-live">
            <span className="trm-live__punkt" aria-hidden="true" />
            <span className="trm-live__wort">{TEXTE.d.live}</span>
            <span className="trm-live__zusatz">{TEXTE.d.liveZusatz}</span>
          </p>
        ) : null}

        <h1 className="trm-titel trm-gold">{TEXTE.d.titel}</h1>
        <p className="trm-sub">{fuelle(TEXTE.d.sub, { gesamt: GESAMT })}</p>
        <Raute />

        <div className="trm-gesucht" aria-live="polite">
          {gezogen != null ? (
            <>
              <span className="trm-gesucht__wort">{TEXTE.d.gesucht}</span>
              <strong className="trm-gesucht__nummer">{deckelText(gezogen)}</strong>
            </>
          ) : (
            <span className="trm-gesucht__leer">
              {kennzahlen == null ? 'Stand wird geladen …' : TEXTE.d.nochNicht}
            </span>
          )}
        </div>

        <Truhe>
          <Schriftzug />
        </Truhe>

        {gezogen != null ? (
          <section className="trm-karte" aria-labelledby="trm-gewonnen-titel">
            <div className="trm-karte__kopf">
              <Trophy size={22} className="trm-ikon" aria-hidden="true" />
              <h2 className="trm-karte__titel" id="trm-gewonnen-titel">
                {TEXTE.d.gewonnenTitel}
              </h2>
            </div>
            <p className="trm-karte__sub">{TEXTE.d.gewonnenText}</p>

            {frist ? (
              <p className="trm-feld__hilfe">
                {TEXTE.d.fristLabel}: {frist} Uhr
              </p>
            ) : null}

            {ansicht === 'ziehung' ? (
              <button type="button" className="trm-cta" onClick={meldungOeffnen}>
                {TEXTE.d.cta}
              </button>
            ) : null}

            <p className="trm-fuss-notiz">{TEXTE.d.ohne}</p>
          </section>
        ) : null}

        {/* ---------------- Meldeformular ---------------- */}

        {ansicht === 'melden' ? (
          <section className="trm-karte" ref={melden} aria-labelledby="trm-melden-titel">
            <h2 className="trm-karte__titel" id="trm-melden-titel">
              {TEXTE.m.titel}
            </h2>
            <p className="trm-karte__sub">{TEXTE.m.sub}</p>

            <form onSubmit={meldungSenden} noValidate>
              <div className="trm-feld">
                <label className="trm-feld__label" htmlFor="trm-m-deckel">
                  {TEXTE.b.felder.nummer} <span className="trm-feld__pflicht">*</span>
                </label>
                <div className="trm-feld__zeile">
                  <input
                    id="trm-m-deckel"
                    className="trm-eingabe"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formular.deckel}
                    onChange={(e) =>
                      aendern('deckel', e.target.value.replace(/\D/g, '').slice(0, 7))
                    }
                    placeholder={TEXTE.b.felder.nummerPlatz}
                    aria-invalid={feldFehler.deckel ? 'true' : undefined}
                    aria-describedby={feldFehler.deckel ? 'trm-m-deckel-fehler' : undefined}
                    required
                  />
                  <span className="trm-feld__von" aria-hidden="true">
                    / {TERMINAL_KAMPAGNE.deckelGesamt}
                  </span>
                </div>
                {feldFehler.deckel ? (
                  <p className="trm-feld__fehler" id="trm-m-deckel-fehler" role="alert">
                    {feldFehler.deckel}
                  </p>
                ) : null}
              </div>

              <div className="trm-feld">
                <label className="trm-feld__label" htmlFor="trm-m-instagram">
                  {TEXTE.b.felder.instagram} <span className="trm-feld__pflicht">*</span>
                </label>
                <input
                  id="trm-m-instagram"
                  className="trm-eingabe"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={FELD_GRENZEN.instagram + 1}
                  value={formular.instagram}
                  onChange={(e) => aendern('instagram', e.target.value)}
                  placeholder={TEXTE.b.felder.instagramPlatz}
                  aria-invalid={feldFehler.instagram ? 'true' : undefined}
                  aria-describedby={feldFehler.instagram ? 'trm-m-instagram-fehler' : undefined}
                  required
                />
                {feldFehler.instagram ? (
                  <p className="trm-feld__fehler" id="trm-m-instagram-fehler" role="alert">
                    {feldFehler.instagram}
                  </p>
                ) : null}
              </div>

              <div className="trm-feld">
                <label className="trm-feld__label" htmlFor="trm-m-email">
                  {TEXTE.b.felder.email} <span className="trm-feld__pflicht">*</span>
                </label>
                <input
                  id="trm-m-email"
                  className="trm-eingabe"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={FELD_GRENZEN.email}
                  value={formular.email}
                  onChange={(e) => aendern('email', e.target.value)}
                  placeholder={TEXTE.b.felder.emailPlatz}
                  aria-invalid={feldFehler.email ? 'true' : undefined}
                  aria-describedby={
                    [
                      'trm-m-email-hilfe',
                      feldFehler.email ? 'trm-m-email-fehler' : null,
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  required
                />
                <p className="trm-feld__hilfe" id="trm-m-email-hilfe">
                  {TEXTE.b.felder.emailHilfe}
                </p>
                {feldFehler.email ? (
                  <p className="trm-feld__fehler" id="trm-m-email-fehler" role="alert">
                    {feldFehler.email}
                  </p>
                ) : null}
              </div>

              <div className="trm-feld">
                <label className="trm-feld__label" htmlFor="trm-m-nachricht">
                  Nachricht (optional)
                </label>
                <textarea
                  id="trm-m-nachricht"
                  className="trm-eingabe"
                  maxLength={FELD_GRENZEN.nachricht}
                  value={formular.nachricht}
                  onChange={(e) => aendern('nachricht', e.target.value)}
                  placeholder="Wann und wo hast du den Deckel bekommen?"
                />
              </div>

              {/* Honigtopf — unsichtbar, aber beliebt bei Formularrobotern. */}
              <div className="trm-topf" aria-hidden="true">
                <label htmlFor="trm-m-website">Website</label>
                <input
                  id="trm-m-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formular.website}
                  onChange={(e) => aendern('website', e.target.value)}
                />
              </div>

              <button type="submit" className="trm-cta" disabled={sendet}>
                {sendet ? 'Wird gesendet …' : TEXTE.m.cta}
              </button>

              {feldFehler.allgemein ? (
                <p className="trm-meldung trm-meldung--fehler" role="alert">
                  {feldFehler.allgemein}
                </p>
              ) : null}

              <p className="trm-feld__hilfe">{TEXTE.m.hinweis}</p>
            </form>
          </section>
        ) : null}

        {ansicht === 'dank' ? (
          <section className="trm-karte" aria-labelledby="trm-dank-titel">
            <div className="trm-karte__kopf">
              <CheckCircle2 size={24} className="trm-ikon" aria-hidden="true" />
              <h2 className="trm-karte__titel" id="trm-dank-titel">
                {TEXTE.m.dank}
              </h2>
            </div>
            <p className="trm-karte__sub">{TEXTE.m.dankText}</p>
          </section>
        ) : null}

        {/* ---------------- Zahlen und Termine ---------------- */}

        <div className="trm-metriken">
          <Metrik
            ikon="deckel"
            label={TEXTE.c.deckelLabel}
            wert={kennzahlen?.aktiviert ?? null}
            von={TERMINAL_KAMPAGNE.deckelGesamt}
            notiz={TEXTE.d.behaltenText}
          />
          <Metrik
            ikon="instagram"
            label={TEXTE.c.followerLabel}
            wert={kennzahlen?.followerZahl ?? null}
            von={followerZiel}
            notiz={fuelle(
              mission.megaNaechste || mission.megaFrei ? TEXTE.c.followerNotizMega : TEXTE.c.followerNotiz,
              { ziel: zahl(followerZiel) },
            )}
          />
        </div>

        <section
          className={uhr ? 'trm-karte' : 'trm-karte trm-karte--kompakt'}
          aria-labelledby="trm-naechste-titel"
        >
          <div className="trm-karte__kopf">
            <Ikon name="uhr" size={22} className="trm-ikon" />
            <h2 className="trm-karte__titel" id="trm-naechste-titel">
              {TEXTE.d.naechsteLabel}
            </h2>
          </div>
          {uhr ? (
            <>
              {uhr}
              <p className="trm-fuss-notiz">
                {termin ? `${termin} Uhr. ` : ''}
                {live ? TEXTE.d.liveZusatz : TEXTE.d.ruhig}
              </p>
            </>
          ) : (
            <p className="trm-metrik__text">{TEXTE.c.countdownOffen}</p>
          )}
        </section>

        <section className="trm-karte" aria-labelledby="trm-ablauf-titel">
          <h2 className="trm-karte__titel" id="trm-ablauf-titel">
            {TEXTE.d.ablaufTitel}
          </h2>

          <ul className="trm-infos trm-infos--vier">
            {ZIEHUNG_KARTEN.map((karte, index) => (
              <li className="trm-info" key={karte.key}>
                <span className="trm-info__nr" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="trm-info__titel">{karte.titel}</h3>
                <span className="trm-info__ikon">
                  <Ikon name={karte.icon} size={17} />
                </span>
                <p className="trm-info__text">{karte.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <Gewinne />

        <p className="trm-hinweis">{TEXTE.d.behalten}</p>

        <p className="trm-zeile">
          <span className="trm-zeile__text">{TEXTE.d.zeile}</span>
          <Link className="trm-cta trm-cta--umriss trm-cta--klein" to="/terminal">
            <ArrowLeft size={16} aria-hidden="true" />
            Zum Terminal
          </Link>
        </p>
      </TerminalRahmen>
    </>
  )
}
