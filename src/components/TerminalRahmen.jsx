import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronsUp,
  Clock,
  Coins,
  Combine,
  Crown,
  Dices,
  Footprints,
  Gamepad2,
  Hammer,
  Hash,
  Heart,
  KeyRound,
  Layers,
  LayoutGrid,
  Lock,
  LogOut,
  Menu,
  Play,
  Puzzle,
  Scale,
  Sparkles,
  Ticket,
  Trophy,
  X,
  Zap,
} from 'lucide-react'

import Img from './Img.jsx'
import TerminalLabor from './TerminalLabor.jsx'
import logoAufDunkel from '../assets/brand/logo-web-auf-dunkel.webp'
import truhe from '../assets/images/terminal/terminal-truhe.webp'
import {
  SPEICHER_SITZUNG,
  SPEICHER_ZUGANG,
  introNochmal,
  merkeLesen,
  sitzungBeenden,
} from '../data/terminal-api.js'
import { GEWINNE } from '../data/terminal-gewinne.js'
import { TERMINAL_KAMPAGNE, TEXTE, restzeit } from '../data/terminal.js'

/**
 * Die gemeinsamen Bauteile der Aktionsseiten unter /terminal.
 *
 * Terminal, Live-Ziehung und Teilnahmebedingungen teilen sich Kopf, Fuss,
 * Truhe und Gewinnblock. Sie liegen hier, damit eine Textaenderung nicht an
 * drei Stellen nachgezogen werden muss.
 *
 * Die Seiten liegen ausserhalb von <Layout> (siehe App.jsx). Der Kopf hier
 * ersetzt deshalb nicht die Hauptnavigation — er ist bewusst klein: Marke,
 * Instagram, und ein Menue, das nur auf Ziele zeigt, die es wirklich gibt.
 */

/* ------------------------------------------------------------------ */

/**
 * Die Symbole der Erklaerkarten. Die Datenmodule nennen nur einen Schluessel
 * ('deckel', 'uhr', …) und bleiben damit frei von Importen aus lucide —
 * sonst koennte api/terminal.js sie nicht lesen.
 *
 * Jedes Symbol ist `aria-hidden`: daneben steht immer eine Ueberschrift, die
 * dasselbe in Worten sagt.
 */
/**
 * Instagram-Glyph. lucide-react fuehrt ab Version 1 keine Markenzeichen mehr,
 * deshalb steht es hier inline — dieselbe Geometrie und Strichstaerke wie das
 * Pendant auf /entdecken, damit beide Seiten gleich aussehen.
 */
export function Instagram({ size = 22, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

const IKONEN = {
  deckel: Ticket,
  instagram: Instagram,
  krone: Crown,
  lauf: Footprints,
  muenze: Coins,
  nummer: Hash,
  pokal: Trophy,
  raetsel: Puzzle,
  schloss: Lock,
  schluessel: KeyRound,
  spiel: Gamepad2,
  stapel: Layers,
  uhr: Clock,
  wuerfel: Dices,
  waage: Scale,
  raster: LayoutGrid,
  hoch: ChevronsUp,
  verbinden: Combine,
  blitz: Zap,
  funkeln: Sparkles,
  herz: Heart,
  hammer: Hammer,
}

export function Ikon({ name, size = 18, className }) {
  const Zeichen = IKONEN[name]
  if (!Zeichen) return null
  return <Zeichen size={size} className={className} aria-hidden="true" />
}

/* ------------------------------------------------------------------ */

/** Linie — Raute — Linie. Der Trenner der Marke, rein dekorativ. */
export function Raute({ className = '' }) {
  return (
    <div className={className ? `trm-raute ${className}` : 'trm-raute'} aria-hidden="true">
      <span className="trm-raute__stein" />
    </div>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Die Truhe. Ein Motiv, drei Zustaende — deshalb nimmt sie ihre Beschriftung
 * als Kinder entgegen statt sie selbst zu kennen.
 *
 * `zuerst` markiert sie als groesstes Bild ueber dem Fold (Zustand A). Dort
 * ist sie das LCP-Element und wird eager geladen; auf den anderen Seiten
 * steht sie weiter unten und darf warten.
 *
 * Die drei dekorativen Schichten geben dem Motiv Leben, ohne es zu veraendern:
 * Rauch zieht langsam hinter und unter der Truhe hoch, ein feiner Goldschein
 * sitzt auf der Deckelfuge, und ein Glanzpunkt wandert ganz langsam ueber das
 * Metall. Alles sehr langsam, alles `aria-hidden`, alles `pointer-events:none`
 * — Hotspots liegen darueber und muessen anklickbar bleiben. Wer
 * `prefers-reduced-motion` gesetzt hat, sieht die Schichten still stehen
 * (Regel am Ende von terminal.css).
 *
 * `className` nimmt Modifizierer der aufrufenden Seite auf (zum Beispiel den
 * Heranzoomen-Zustand nach dem Code) — damit bleibt die Choreografie dort, wo
 * sie hingehoert, und das Motiv hier eines.
 */
export function Truhe({ zuerst = false, className = '', schlag = null, children }) {
  /* `schlag` ist ein Schluessel wie "ruck-3", "intro" oder "gewaehrt". Jeder
     neue Wert haengt die Effektschichten neu ein — so laeuft der Stoss bei
     jedem Antippen von vorn, ohne das eigentliche Bild neu zu laden. Die
     Schlosskopie benutzt dieselbe Quelle und dieselben `sizes` wie das Bild:
     der Browser nimmt dieselbe Datei aus dem Speicher. */
  const art = schlag ? String(schlag).split('-')[0] : null
  return (
    <div className={className ? `trm-truhe ${className}` : 'trm-truhe'}>
      <span className="trm-truhe__rauch" aria-hidden="true" />
      <Img
        src={truhe}
        alt="Verschlossene Schatztruhe mit dem VIDEKO Zeichen am Schloss"
        className="trm-truhe__bild"
        sizes="(min-width: 768px) 720px, 100vw"
        priority={zuerst}
        defer={!zuerst}
      />
      <span className="trm-truhe__fuge" aria-hidden="true" />
      <span className="trm-truhe__glanz" aria-hidden="true" />
      {/* Das wandernde Licht der Zugangssequenz. Ausserhalb von
          ACCESS GRANTED ist diese Schicht unsichtbar und bewegt sich
          nicht - sie kostet dort nichts. */}
      <span className="trm-truhe__adern" aria-hidden="true" />
      {schlag ? (
        <span key={schlag} className={`trm-truhe__effekte trm-truhe__effekte--${art}`} aria-hidden="true">
          <span className="trm-truhe__puff" />
          <span className="trm-truhe__nische" />
          <span className="trm-truhe__schloss">
            <Img
              src={truhe}
              alt=""
              className="trm-truhe__schlossbild"
              sizes="(min-width: 768px) 720px, 100vw"
              loading="eager"
            />
          </span>
          <span className="trm-truhe__funkenflug" />
          <span className="trm-truhe__blitz" />
        </span>
      ) : null}
      {children}
    </div>
  )
}

/** Der handschriftliche Kampagnenschriftzug neben der Truhe. */
export function Schriftzug({ className = 'trm-truhe__skript' }) {
  return (
    <p className={`trm-skript ${className}`} aria-hidden="true">
      Kleine
      <br />
      Deckel.
      <br />
      Große
      <br />
      Gewinne.
    </p>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Der Gewinnblock. Gleicher Aufbau auf allen drei Seiten: zwei Hauptgewinne
 * gross, drei Merch-Artikel kleiner darunter.
 *
 * Bewusst nur ein Layout statt eines zweiten, engeren fuer das Dashboard:
 * fuenf gleich breite Karten waeren auf einem 320-px-Geraet 53 px breit,
 * und darunter passt keine lesbare Zeile mehr.
 *
 * In den Motiven steht keine Schrift — Titel und Zeile sind echter Text und
 * lassen sich in terminal-gewinne.js aendern, ohne ein Bild anzufassen.
 */
export function Gewinne({ id, className = '' }) {
  return (
    <section
      className={className ? `trm-karte trm-gewinne ${className}` : 'trm-karte trm-gewinne'}
      id={id}
    >
      <h2 className="trm-gewinne__titel trm-gold">{TEXTE.gewinneTitel}</h2>
      <p className="trm-gewinne__sub">Exklusive Gewinne. Echte Erlebnisse. Typisch VIDEKO.</p>

      <ul className="trm-gewinne__netz">
        {GEWINNE.map((g) => (
          <li key={g.key} className={`trm-gewinn${g.gross ? ' trm-gewinn--gross' : ''}`}>
            <Img
              src={g.bild}
              alt={g.alt}
              className="trm-gewinn__bild"
              sizes={g.gross ? '(min-width: 768px) 360px, 50vw' : '(min-width: 768px) 240px, 33vw'}
              defer
            />
            <div className="trm-gewinn__text">
              <h3 className="trm-gewinn__titel">{g.titel}</h3>
              <p className="trm-gewinn__zeile">{g.zeile}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Der Countdown bis zur naechsten Ziehung.
 *
 * Die aktuelle Uhrzeit kommt erst nach dem ersten Rendern. Das ist Absicht:
 * die Seite wird vorgerendert, und ein `Date.now()` im ersten Render waere
 * auf Server und Client garantiert verschieden — React wuerde die Hydration
 * verwerfen. Bis die Uhr laeuft, stehen Striche.
 *
 * Gibt null zurueck, wenn kein (gueltiger) Termin gesetzt ist. Der Aufrufer
 * zeigt dann seinen eigenen Hinweis, statt hier einen Nulltimer zu sehen.
 */
export function Uhr({ zielIso }) {
  const [jetzt, setJetzt] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJetzt(Date.now())
    const uhr = setInterval(() => setJetzt(Date.now()), 1000)
    return () => clearInterval(uhr)
  }, [])

  const ziel = zielIso ? new Date(zielIso).getTime() : Number.NaN
  if (!Number.isFinite(ziel)) return null

  const r = jetzt == null ? null : restzeit(ziel, jetzt)
  const kacheln = [
    { wort: 'TAGE', wert: r?.tage },
    { wort: 'STD', wert: r?.stunden },
    { wort: 'MIN', wert: r?.minuten },
    { wort: 'SEK', wert: r?.sekunden },
  ]

  return (
    <div className="trm-uhr" role="timer" aria-live="off">
      {kacheln.map((k) => (
        <div className="trm-uhr__kachel" key={k.wort}>
          <span className="trm-uhr__zahl">
            {k.wert == null ? '––' : String(k.wert).padStart(2, '0')}
          </span>
          <span className="trm-uhr__wort">{k.wort}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */

/**
 * Eine Messkarte: Beschriftung, Fortschrittsbalken, Zahl, Notiz.
 *
 * Der Balken ist `aria-hidden` — die Zahl darunter sagt dasselbe, und zwar
 * genauer. Solange die Werte noch laden (`wert == null`), steht ein Strich
 * statt einer erfundenen Null.
 */
export function Metrik({ ikon, label, wert, von, notiz }) {
  const anteil = wert != null && von ? Math.min(100, Math.round((wert / von) * 100)) : 0

  return (
    <div className="trm-metrik">
      <p className="trm-metrik__kopf">
        <Ikon name={ikon} size={15} />
        {label}
      </p>
      <div className="trm-balken" aria-hidden="true">
        <span className="trm-balken__fuellung" style={{ width: `${anteil}%` }} />
      </div>
      <p className="trm-metrik__zahl">
        {wert == null ? '––' : wert.toLocaleString('de-DE')} <small>/ {von.toLocaleString('de-DE')}</small>
      </p>
      {notiz ? <p className="trm-metrik__text">{notiz}</p> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Kopf() {
  const [offen, setOffen] = useState(false)
  const [abmeldbar, setAbmeldbar] = useState(false)
  const [wiederbar, setWiederbar] = useState(false)

  /* Ob dieses Geraet ueberhaupt etwas abzumelden hat, steht im Speicher des
     Browsers — und der ist beim Vorrendern nicht da. Deshalb erst, wenn das
     Menue aufgeht; dann ist die Hydration laengst durch, und der Punkt
     erscheint nur dort, wo er auch einen Sinn hat. */
  useEffect(() => {
    if (!offen) return
    /* Der Beleg liegt im Speicher des Browsers und nicht in React. Gelesen
       wird er erst, wenn das Menue aufgeht — im ersten Bild waere die
       Antwort nicht dieselbe wie im vorgerenderten Markup. */
    const sitzungDa = Boolean(merkeLesen(SPEICHER_SITZUNG))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAbmeldbar(sitzungDa || Boolean(merkeLesen(SPEICHER_ZUGANG)))
    /* Wer hier schon eingeloggt ist, braucht keinen Zugangslink. */
    setWiederbar(!sitzungDa)
  }, [offen])

  /**
   * Nur dieses Geraet abmelden.
   *
   * Geloescht werden ausschliesslich die lokalen Belege. Der Deckel bleibt
   * in der Datenbank aktiviert, die Teilnahme bleibt bestehen, die Ziehung
   * merkt davon nichts. Danach sieht der Browser wieder den Ersteinstieg.
   */
  function abmelden() {
    if (!window.confirm(TEXTE.abmelden.frage)) return
    sitzungBeenden()
    setOffen(false)
    try {
      window.location.assign('/terminal')
    } catch {
      /* nichts zu tun */
    }
  }

  return (
    <>
      <header className="trm-kopf">
        <Link to="/terminal" className="trm-kopf__marke">
          {/* Das Logo traegt den Schriftzug bereits. width/height stehen im
              Markup, damit beim Laden nichts springt. */}
          <img
            src={logoAufDunkel}
            alt="VIDEKO Küchen"
            className="trm-kopf__logo"
            width="340"
            height="249"
          />
        </Link>

        <a
          className="trm-ig"
          href={TERMINAL_KAMPAGNE.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Instagram size={17} aria-hidden="true" />
          <span className="trm-ig__name">@{TERMINAL_KAMPAGNE.instagramHandle}</span>
          <span className="trm-nur-sr">VIDEKO auf Instagram, öffnet in neuem Tab</span>
        </a>

        <button
          type="button"
          className="trm-menue"
          onClick={() => setOffen((v) => !v)}
          aria-expanded={offen}
          aria-controls="trm-menue-blatt"
        >
          {offen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          <span className="trm-nur-sr">Menü</span>
        </button>
      </header>

      {offen && (
        <nav className="trm-menue-blatt" id="trm-menue-blatt" aria-label="Aktionsseite">
          <Link to="/terminal" onClick={() => setOffen(false)}>
            Terminal
          </Link>
          <Link to="/terminal/ziehung" onClick={() => setOffen(false)}>
            Live-Ziehung
          </Link>
          <Link to="/terminal/rangliste" onClick={() => setOffen(false)}>
            Leaderboard
          </Link>
          <Link to="/terminal/teilnahmebedingungen" onClick={() => setOffen(false)}>
            Teilnahmebedingungen
          </Link>
          <Link to="/" onClick={() => setOffen(false)}>
            VIDEKO Küchen
          </Link>

          {/* Ein schlichter Link: von jeder Unterseite fuehrt er nach /terminal,
              auf /terminal selbst schlaegt er nur das Formular auf. */}
          {wiederbar && (
            <a className="trm-abmelden" href="/terminal#bereits-aktiviert" onClick={() => setOffen(false)}>
              <KeyRound size={14} aria-hidden="true" />
              {TEXTE.wieder.frage}
            </a>
          )}

          <button type="button" className="trm-abmelden" onClick={() => introNochmal('/terminal')}>
            <Play size={14} aria-hidden="true" />
            {TEXTE.intro.nochmal}
          </button>

          {abmeldbar && (
            <button type="button" className="trm-abmelden" onClick={abmelden}>
              <LogOut size={14} aria-hidden="true" />
              {TEXTE.abmelden.wort}
            </button>
          )}
        </nav>
      )}
    </>
  )
}

function Fuss() {
  return (
    <footer className="trm-fuss">
      <span className="trm-fuss__marke">
        <img
          src={logoAufDunkel}
          alt=""
          aria-hidden="true"
          className="trm-fuss__logo"
          width="340"
          height="249"
        />
        Küchen. Leben. Genießen.
      </span>
      {/* Impressum und Datenschutz sind die bestehenden Seiten der Website.
          Die Teilnahmebedingungen liegen bei der Aktion. */}
      <Link to="/impressum">Impressum</Link>
      <Link to="/datenschutz">Datenschutz</Link>
      <Link to="/terminal/teilnahmebedingungen">Teilnahmebedingungen</Link>
    </footer>
  )
}

/**
 * Der Rahmen jeder Terminalseite: eigener schwarzer Grund, eine Spalte,
 * Kopf oben, Fuss unten.
 *
 * `hinter` ist der Platz fuer alles, was hinter der Spalte liegt und
 * trotzdem zum Grund der Seite gehoert — heute die Schicht des
 * Ersteinstiegs mit Rauch, Lichtadern und dem fernen Lichtpunkt. Sie muss
 * ein direktes Kind von .trm sein und vor der Spalte stehen, damit die
 * Truhe in ihr steht statt dahinter zu verschwinden.
 *
 * Das Testlabor haengt bewusst ausserhalb von .trm. Die grossen Sequenzen
 * legen sich als Geschwister darueber; der Hinweis, dass hier nichts Echtes
 * passiert, darf von keiner davon verdeckt werden.
 */
export default function TerminalRahmen({ children, hinter = null }) {
  return (
    <>
      <main className="trm">
        {hinter}
        <div className="trm__spalte">
          <Kopf />
          {children}
          <Fuss />
        </div>
      </main>
      <TerminalLabor />
    </>
  )
}
