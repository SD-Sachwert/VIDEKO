import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'

import Seo from '../components/Seo.jsx'
import TerminalRahmen, { Ikon, Raute, Schriftzug, Truhe } from '../components/TerminalRahmen.jsx'
import {
  SPEICHER_SITZUNG,
  SPEICHER_TRESOR,
  einladungPruefen,
  gastAnlegen,
  merkeLesen,
  merkeSchreiben,
} from '../data/terminal-api.js'
import {
  EMAIL_MUSTER,
  FELD_GRENZEN,
  TERMINAL_KAMPAGNE,
  TEXTE,
  fuelle,
  instagramNormalisieren,
  zahl,
} from '../data/terminal.js'

/**
 * /terminal/einladung/:token — die Landingpage hinter einem Einladungslink.
 *
 * Hier kommt jemand an, der von der Aktion vermutlich noch nie gehoert hat,
 * und zwar fast immer auf dem Handy, weil der Link aus WhatsApp oder einer
 * Story kommt. Die Seite hat deshalb genau eine Aufgabe: ehrlich sagen, was
 * die Einladung ist — und dann den Weg hinein.
 *
 * WAS HIER BEWUSST GANZ OBEN STEHT
 * --------------------------------
 * „Du bist eingeladen." Wer hier hereinkommt, ist ein vollwertiger Spieler:
 * alle Games, gewertete Scores, alle Ranglisten, das Gesamtranking, die
 * Preise in den Games und drei eigene Einladungen. Nichts davon haengt an
 * einem Deckel.
 *
 * Getrennt davon steht genau eine Sache, und die steht ebenfalls oben und
 * nicht im Kleingedruckten: die grosse Verlosung der 5.000 nummerierten
 * Deckel. Dort kommt nur hinein, wer einen echten physischen Deckel hat.
 * Eine Einladung erzeugt kein Los — das zu behaupten waere ein Versprechen,
 * das wir nicht halten koennten.
 *
 * INSTAGRAM IST PFLICHT, UND ZWAR IN BEIDEN WEGEN
 * -----------------------------------------------
 * Ein Instagram-Name und die Bestaetigung „Ich folge @videko.kuechen" sind
 * Bedingung fuer gewertete Scores — hier genauso wie bei der Aktivierung
 * eines Deckels. Der Haken ist eine Selbstauskunft; automatisch verifizieren
 * laesst sich ein Follow nicht. Vor einer Preisausgabe schaut jemand von
 * Hand nach. Die Einwilligung fuer die oeffentliche Bestenliste daneben ist
 * ausdruecklich freiwillig und aendert an der Teilnahme nichts.
 *
 * WAS HIER NICHT ENTSCHIEDEN WIRD
 * -------------------------------
 * Ob der Link gueltig ist, ob er schon eingeloest wurde, wer eingeladen hat
 * und ob daraus ein Account werden darf — das entscheidet ausschliesslich
 * der Server. Diese Seite zeigt nur an, was zurueckkommt. Der Token steht in
 * der Adresse und geht an /api/terminal; im Bundle steht nichts, womit sich
 * einer erraten liesse.
 *
 * Am Ende steht derselbe Sitzungsbeleg wie nach einer Aktivierung, und der
 * Weg fuehrt auf /terminal. Ob jemand zusaetzlich in der Deckel-Ziehung
 * steht, entscheidet allein sein Deckel und steht in der Datenbank, nicht in
 * diesem Beleg.
 */

const GESAMT = zahl(TERMINAL_KAMPAGNE.deckelGesamt)
const HANDLE = TERMINAL_KAMPAGNE.instagramHandle

/* Gruende, bei denen der ganze Bildschirm nicht mehr gilt. Alles andere ist
   ein Feldfehler und bleibt im Formular stehen. */
const SEITE_ENDE = ['link', 'widerrufen', 'verbraucht', 'abgelaufen']
const LEER = {
  instagram: '',
  email: '',
  folgt: false,
  leaderboard: false,
  bedingungen: false,
}

export default function TerminalEinladung() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const T = TEXTE.einladung

  /* 'laedt' | 'offen' | <Fehlergrund> */
  const [stand, setStand] = useState('laedt')
  const [einladung, setEinladung] = useState(null)
  const [formular, setFormular] = useState(LEER)
  const [feldFehler, setFeldFehler] = useState({})
  const [sendet, setSendet] = useState(false)

  /* Liegt auf diesem Geraet schon ein Zugang? Dann ist das Einloesen fast
     immer ein Versehen — und es wuerde den Platz der einladenden Person
     verbrauchen. Erst nach dem ersten Rendern gelesen: die Seite wird beim
     Bauen vorgerendert, und im Browserspeicher steht dort nichts. */
  const [schonDa, setSchonDa] = useState(false)
  const [trotzdem, setTrotzdem] = useState(false)

  useEffect(() => {
    const abbruch = new AbortController()

    async function pruefen() {
      setSchonDa(Boolean(merkeLesen(SPEICHER_SITZUNG)))

      const antwort = await einladungPruefen(token, abbruch.signal)
      if (abbruch.signal.aborted) return

      if (antwort.ok && antwort.einladung) {
        setEinladung(antwort.einladung)
        setStand('offen')
        return
      }
      setStand(antwort.grund && T.fehler[antwort.grund] ? antwort.grund : 'link')
    }

    pruefen()
    return () => abbruch.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function aendern(feld, wert) {
    setFormular((alt) => ({ ...alt, [feld]: wert }))
    setFeldFehler((alt) => (alt[feld] ? { ...alt, [feld]: undefined } : alt))
  }

  /* Hoeflichkeitspruefung im Browser. Verbindlich prueft der Server. */
  async function absenden(ereignis) {
    ereignis.preventDefault()
    if (sendet) return

    const instagram = instagramNormalisieren(formular.instagram)
    const email = formular.email.trim()

    const fehler = {}
    if (!instagram) fehler.instagram = T.fehler.instagram
    if (!EMAIL_MUSTER.test(email)) fehler.email = T.fehler.email
    /* Ohne diesen Haken werden Scores nicht gewertet. Der Server lehnt die
       Anmeldung ohne ihn ab — hier steht er nur, damit niemand erst nach dem
       Absenden erfaehrt, woran es lag. */
    if (!formular.folgt) fehler.folgt = fuelle(T.fehler.folgt, { handle: HANDLE })
    if (!formular.bedingungen) fehler.bedingungen = T.fehler.bedingungen
    setFeldFehler(fehler)
    if (Object.keys(fehler).length > 0) return

    setSendet(true)
    const antwort = await gastAnlegen({
      token,
      instagram,
      email,
      folgt: true,
      leaderboard: formular.leaderboard,
      bedingungen: true,
    })
    setSendet(false)

    if (antwort.ok && antwort.sitzung) {
      /* Derselbe Speicherplatz wie nach einer Aktivierung: von hier an ist
         der Spieler ganz normal angemeldet. Kein Zugangsbeleg — den
         Raetselcode hat er nie gesehen und braucht ihn auch nicht. */
      merkeSchreiben(SPEICHER_SITZUNG, antwort.sitzung)
      merkeSchreiben(SPEICHER_TRESOR, '1')
      navigate('/terminal')
      return
    }

    /* Der Server sagt mit, welche Felder er beanstandet. Sie direkt am Feld
       zu zeigen erspart das Suchen — die Sammelmeldung bleibt daneben. */
    if (antwort.grund === 'felder') {
      const markiert = { allgemein: T.fehler.felder }
      for (const feld of Array.isArray(antwort.felder) ? antwort.felder : []) {
        if (T.fehler[feld]) markiert[feld] = fuelle(T.fehler[feld], { handle: HANDLE })
      }
      setFeldFehler(markiert)
      return
    }
    if (antwort.status === 429 || antwort.grund === 'bremse') {
      setFeldFehler({ allgemein: T.fehler.bremse })
      return
    }
    /* Der Link ist zwischen Aufschlagen und Absenden verbraucht oder
       zurueckgezogen worden: dann gilt der ganze Bildschirm nicht mehr.
       Ausdrueckliche Liste statt „steht in T.fehler": Feldfehler wie `folgt`
       duerfen die Seite nicht abraeumen, sie gehoeren ans Feld. */
    if (SEITE_ENDE.includes(antwort.grund)) {
      setStand(antwort.grund)
      return
    }
    setFeldFehler({ allgemein: T.fehler.allgemein })
  }

  const seo = (
    <Seo
      title="Einladung | VIDEKO Küchen"
      description="Spiel mit im VIDEKO Tresor."
      canonicalPath="/terminal"
      noindex
      nofollow
    />
  )

  if (stand === 'laedt') {
    return (
      <>
        {seo}
        <TerminalRahmen>
          <h1 className="trm-titel trm-gold">{T.titel}</h1>
          <p className="trm-sub">{T.pruefen}</p>
          <Raute />
          <Truhe>
            <Schriftzug />
          </Truhe>
        </TerminalRahmen>
      </>
    )
  }

  if (stand !== 'offen') {
    return (
      <>
        {seo}
        <TerminalRahmen>
          <h1 className="trm-titel trm-gold">{T.fehlerTitel}</h1>
          <p className="trm-sub">{T.fehler[stand] ?? T.fehler.link}</p>
          <Raute />

          <Truhe>
            <Schriftzug />
          </Truhe>

          <p className="trm-fuss-notiz">{T.fehlerText}</p>
          <Link className="trm-cta" to="/terminal">
            <ArrowLeft size={18} aria-hidden="true" />
            {T.zurueck}
          </Link>
        </TerminalRahmen>
      </>
    )
  }

  const formularZeigen = !schonDa || trotzdem

  return (
    <>
      {seo}
      <TerminalRahmen>
        <div className="trm-abzeichen trm-abzeichen--gast">
          <Ikon name="schluessel" size={28} className="trm-abzeichen__haken" />
          <span className="trm-abzeichen__wort">{T.marke}</span>
        </div>

        <h1 className="trm-titel trm-gold">{T.titel}</h1>

        {einladung?.einladerInstagram ? (
          <p className="trm-einladung__von">
            <span className="trm-einladung__wer">{T.vonLabel}</span>
            <span className="trm-einladung__name">@{einladung.einladerInstagram}</span>
          </p>
        ) : null}

        <p className="trm-sub">{T.sub}</p>

        <Raute />

        <Truhe>
          <Schriftzug />
        </Truhe>

        {/* Der wichtigste Bildschirm der Seite. Er steht ueber dem Formular
            und nicht darunter: wer seine Daten eintraegt, hat vorher gelesen,
            was er bekommt — und dass die Deckel-Verlosung davon getrennt
            laeuft. */}
        <section className="trm-karte trm-klartext" aria-labelledby="trm-klartext-titel">
          <div className="trm-karte__kopf">
            <Ikon name="schloss" size={22} className="trm-ikon" />
            <h2 className="trm-karte__titel" id="trm-klartext-titel">
              {T.klartextTitel}
            </h2>
          </div>
          <p className="trm-karte__sub">{fuelle(T.klartext, { gesamt: GESAMT })}</p>

          <ul className="trm-klartext__liste">
            {T.was.map((zeile) => (
              <li key={zeile}>
                <Check size={17} aria-hidden="true" />
                <span>{zeile}</span>
              </li>
            ))}
          </ul>
        </section>

        {schonDa && !trotzdem ? (
          <section className="trm-karte" aria-labelledby="trm-schon-titel">
            <div className="trm-karte__kopf">
              <Ikon name="deckel" size={22} className="trm-ikon" />
              <h2 className="trm-karte__titel" id="trm-schon-titel">
                {T.schonDaCta}
              </h2>
            </div>
            <p className="trm-karte__sub">{T.schonDa}</p>
            <Link className="trm-cta" to="/terminal">
              {T.schonDaCta}
            </Link>
            <button
              type="button"
              className="trm-team__zurueck"
              onClick={() => setTrotzdem(true)}
            >
              {T.trotzdem}
            </button>
          </section>
        ) : null}

        {formularZeigen ? (
          <form className="trm-karte trm-gast-weg" id="trm-gast" onSubmit={absenden} noValidate>
            <div className="trm-karte__kopf">
              <Ikon name="schluessel" size={22} className="trm-ikon" />
              <h2 className="trm-karte__titel">{T.cta}</h2>
            </div>

            <div className="trm-feld">
              <label className="trm-feld__label" htmlFor="trm-gast-instagram">
                {T.felder.instagram}
              </label>
              <input
                id="trm-gast-instagram"
                className="trm-eingabe"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={FELD_GRENZEN.instagram + 1 /* ein @ darf mit */}
                value={formular.instagram}
                onChange={(e) => aendern('instagram', e.target.value)}
                placeholder={T.felder.instagramPlatz}
                aria-describedby={feldFehler.instagram ? 'trm-gast-instagram-fehler' : undefined}
                aria-invalid={feldFehler.instagram ? 'true' : undefined}
                required
              />
              {feldFehler.instagram ? (
                <p className="trm-feld__fehler" id="trm-gast-instagram-fehler" role="alert">
                  {feldFehler.instagram}
                </p>
              ) : null}
            </div>

            {/* Die Adresse ist der einzige Weg zurueck in den eigenen Account:
                geloeschter Browserspeicher, neues Handy, anderer Browser. Ohne
                sie waere „DEINE SCORES SIND SICHER." nicht wahr. */}
            <div className="trm-feld">
              <label className="trm-feld__label" htmlFor="trm-gast-email">
                {T.felder.email}
              </label>
              <input
                id="trm-gast-email"
                className="trm-eingabe"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={FELD_GRENZEN.email}
                value={formular.email}
                onChange={(e) => aendern('email', e.target.value)}
                placeholder={T.felder.emailPlatz}
                aria-describedby={
                  ['trm-gast-email-hilfe', feldFehler.email ? 'trm-gast-email-fehler' : '']
                    .filter(Boolean)
                    .join(' ')
                }
                aria-invalid={feldFehler.email ? 'true' : undefined}
                required
              />
              <p className="trm-feld__hilfe" id="trm-gast-email-hilfe">
                {T.felder.emailHilfe}
              </p>
              {feldFehler.email ? (
                <p className="trm-feld__fehler" id="trm-gast-email-fehler" role="alert">
                  {feldFehler.email}
                </p>
              ) : null}
            </div>

            {/* Pflichthaken. Wortgleich mit der Deckel-Aktivierung, damit
                beide Wege dieselbe Bedingung stellen — und derselbe Satz
                steht in beiden Formularen. */}
            <label className="trm-haken" htmlFor="trm-gast-folgt">
              <input
                id="trm-gast-folgt"
                type="checkbox"
                checked={formular.folgt}
                onChange={(e) => aendern('folgt', e.target.checked)}
                aria-describedby={
                  ['trm-gast-folgt-hilfe', feldFehler.folgt ? 'trm-gast-folgt-fehler' : '']
                    .filter(Boolean)
                    .join(' ')
                }
                aria-invalid={feldFehler.folgt ? 'true' : undefined}
                required
              />
              <span>{fuelle(T.felder.haken, { handle: HANDLE })}</span>
            </label>
            <p className="trm-feld__hilfe" id="trm-gast-folgt-hilfe">
              {T.felder.hakenHilfe}
            </p>
            {feldFehler.folgt ? (
              <p className="trm-feld__fehler" id="trm-gast-folgt-fehler" role="alert">
                {feldFehler.folgt}
              </p>
            ) : null}

            {/* Freiwillig und ausdruecklich getrennt vom Pflichthaken: ohne
                sie spielt man genauso mit, der Name steht dann nur auf
                keiner oeffentlichen Liste. */}
            <label className="trm-haken" htmlFor="trm-gast-leaderboard">
              <input
                id="trm-gast-leaderboard"
                type="checkbox"
                checked={formular.leaderboard}
                onChange={(e) => aendern('leaderboard', e.target.checked)}
                aria-describedby="trm-gast-leaderboard-hilfe"
              />
              <span>{T.felder.leaderboard}</span>
            </label>
            <p className="trm-feld__hilfe" id="trm-gast-leaderboard-hilfe">
              {T.felder.leaderboardHilfe}
            </p>

            <label className="trm-haken" htmlFor="trm-gast-bedingungen">
              <input
                id="trm-gast-bedingungen"
                type="checkbox"
                checked={formular.bedingungen}
                onChange={(e) => aendern('bedingungen', e.target.checked)}
                aria-describedby={feldFehler.bedingungen ? 'trm-gast-bedingungen-fehler' : undefined}
                aria-invalid={feldFehler.bedingungen ? 'true' : undefined}
                required
              />
              <span>
                Ich akzeptiere die{' '}
                <Link to="/terminal/teilnahmebedingungen">Teilnahmebedingungen</Link> und die{' '}
                <Link to="/datenschutz">Datenschutzerklärung</Link>.
              </span>
            </label>
            {feldFehler.bedingungen ? (
              <p className="trm-feld__fehler" id="trm-gast-bedingungen-fehler" role="alert">
                {feldFehler.bedingungen}
              </p>
            ) : null}

            <button type="submit" className="trm-cta" disabled={sendet}>
              {sendet ? T.laeuft : T.cta}
            </button>

            {feldFehler.allgemein ? (
              <p className="trm-meldung trm-meldung--fehler" role="alert">
                {feldFehler.allgemein}
              </p>
            ) : null}

            <p className="trm-fuss-notiz">{T.gastKeinRanking}</p>
          </form>
        ) : null}
      </TerminalRahmen>
    </>
  )
}
