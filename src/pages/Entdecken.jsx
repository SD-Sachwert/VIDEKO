import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLenis } from 'lenis/react'
import {
  ArrowUpRight,
  Bath,
  ChefHat,
  DoorOpen,
  Droplets,
  LayoutGrid,
  Lightbulb,
  Lock,
  MapPin,
  Martini,
  Pause,
  ShowerHead,
  Sofa,
  Volume2,
  VolumeX,
} from 'lucide-react'
import Reveal from '../components/Reveal.jsx'
import LazyVideo from '../components/LazyVideo.jsx'
import LazyBg from '../components/LazyBg.jsx'
import CTAButton from '../components/CTAButton.jsx'
import { SpektakelLayer } from '../components/EntdeckenSpektakel.jsx'
import { spektakelNachId, useSpektakel } from '../lib/spektakel.js'
import { BRAND } from '../data/company.js'
import { baustellenIndex, heutigerTag, INDEX_BASIS, tageZwischen } from '../lib/baustellenindex.js'
import {
  BAUSTELLEN_BEREICHE,
  BAUSTELLEN_GATES,
  BAUSTELLEN_TEXTE,
  DRUECK_NICHT,
  ENTDECKEN_CONFIG,
  ENTDECKEN_SOCIALS,
  ENTDECKEN_SPOTIFY,
  ENTDECKEN_SPOTIFY_KACHEL,
  OPENING,
  SOUNDTRACK,
  STUDIO_ADRESSE,
  STUDIO_KARTE,
  STUDIO_MAPS_URL,
  STUDIO_ROUTE_URL,
} from '../data/entdecken.js'

/**
 * /entdecken — dauerhaftes Ziel der Offline-QR-Codes (Aufkleber, Banner,
 * Taschen, Stadtfest).
 *
 * Kein eigenes Tracking, kein Scan-Zaehler, keine Redirect-Logik: der QR-Code
 * zeigt direkt hierher, angehaengte UTM-Parameter bleiben unangetastet stehen.
 *
 * Reihenfolge der Seite — hell und dunkel wechseln sich ab, damit jeder Block
 * seine eigene Buehne bekommt:
 *   1) Hero            hell   — Headline, CTA, grosser Countdown, grosses Video
 *   2) Socials         dunkel — direkt nach dem Hero, harter Kontrastwechsel,
 *                               sechs hochformatige Kacheln
 *   3) Baustellenindex hell   — automatisch gerechnetes Bau-Dashboard
 *   4) Marke + Egg     dunkel — wofuer VIDEKO steht, „Drueck nicht."
 *   5) Standort        hell   — Text links, echte Karte rechts
 *   6) Beratung        dunkel — grossflaechiger Abschluss
 *
 * Die Seite laeuft in einem eigenen, breiteren Raster (.ent-wide) statt im
 * globalen .container — der ist fuer Fliesstext gebaut und waere hier zu eng.
 * Das globale Raster bleibt davon unberuehrt.
 *
 * Nichts auf dieser Seite behauptet etwas, das nicht belegt ist: keine
 * Followerzahlen, keine Bewertungen, keine erfundenen Links, kein erfundenes
 * Gebaeudefoto. Die Prozente des Baustellenindex sind ausdruecklich als
 * gerechnetes Stimmungsbarometer gekennzeichnet, nicht als gemessener
 * Baufortschritt. Alle Inhalte stammen aus src/data/entdecken.js, site.js und
 * company.js.
 */

/* ------------------------------------------------------------------ *
 * Marken-Glyphen
 * ------------------------------------------------------------------ */

/**
 * lucide liefert keine Markenlogos aus. Statt eine zweite Icon-Library zu
 * laden, stehen die sechs benoetigten Glyphen hier inline — gleiche
 * Strichstaerke und Groesse wie die uebrigen Icons der Seite.
 */
function Glyph({ size = 22, children, ...rest }) {
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
      {children}
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <Glyph {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </Glyph>
  )
}

function TikTokIcon(props) {
  return (
    <Glyph {...props}>
      <path d="M15 3v11.2a3.8 3.8 0 1 1-3.3-3.77" />
      <path d="M15 3c.5 2.6 2.2 4.2 5 4.4" />
    </Glyph>
  )
}

function YoutubeIcon(props) {
  return (
    <Glyph {...props}>
      <rect x="2" y="5.5" width="20" height="13" rx="4" />
      <path d="M10.2 9.4v5.2l4.6-2.6z" />
    </Glyph>
  )
}

function FacebookIcon(props) {
  return (
    <Glyph {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Glyph>
  )
}

function LinkedinIcon(props) {
  return (
    <Glyph {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </Glyph>
  )
}

function SpotifyIcon(props) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M7.2 9.3c3.2-.9 6.7-.6 9.4 1.1" />
      <path d="M7.9 12.5c2.6-.7 5.6-.4 7.9 1" />
      <path d="M8.6 15.5c2.1-.5 4.3-.3 6.1.8" />
    </Glyph>
  )
}

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  youtube: YoutubeIcon,
  facebook: FacebookIcon,
  linkedin: LinkedinIcon,
}

// Bereichs-Icons des Baustellenindex — aus lucide, also aus dem bereits
// vorhandenen Bestand. Keine neue Icon-Library.
const BEREICH_ICONS = {
  ausstellung: LayoutGrid,
  kuechen: ChefHat,
  bar: Martini,
  empfang: DoorOpen,
  beleuchtung: Lightbulb,
  luxusklo: Bath,
  dusche: ShowerHead,
  tropfen: Droplets,
  aufenthalt: Sofa,
}

/* ------------------------------------------------------------------ *
 * Goldadern
 * ------------------------------------------------------------------ */

/**
 * Rein dekorative Lichtadern fuer die dunklen Baender — feine, verzweigte
 * Goldlinien wie in einer Marmorplatte. Bewusst als SVG statt als Bild: kein
 * zusaetzliches Asset, keine externe Grafik, frei skalierbar. Sie liegen sehr
 * schwach ueber dem Grund und sollen Material andeuten, nicht glitzern.
 */
function Goldadern({ seite = 'links' }) {
  return (
    <svg
      className={`ent-adern ent-adern--${seite}`}
      viewBox="0 0 200 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M8 -10 L46 118 L22 176 L74 296 L48 372 L96 508 L78 612" />
      <path d="M46 118 L104 92 L146 34" />
      <path d="M74 296 L128 268 L188 292" />
      <path d="M96 508 L152 470 L196 486" />
      <path d="M22 176 L-14 232" />
    </svg>
  )
}

/**
 * Dunkle Buehne. Die Seite hat davon zwei — einmal fuer die Socials direkt
 * unter dem Hero, einmal fuer Marke und Easter Egg. Gleiche Textur, gleiche
 * Adern, damit beide als dasselbe Material lesbar bleiben.
 */
function Nachtband({ textur, klasse = '', children }) {
  return (
    <div className={`ent-nacht ${klasse}`.trim()}>
      <LazyBg className="ent-nacht__tex" image={textur} aria-hidden="true" />
      <span className="ent-nacht__schleier" aria-hidden="true" />
      <Goldadern seite="links" />
      <Goldadern seite="rechts" />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Soundtrack
 * ------------------------------------------------------------------ */

/**
 * Hintergrundton der Seite.
 *
 * Regeln, die hier verdrahtet sind:
 *   - Es gibt nur eine Quelle: die eigene Datei aus SOUNDTRACK.datei. Steht da
 *     nichts, existiert der Player nicht — lieber kein Ton als ein kaputter
 *     Player oder fremdes Audio.
 *   - Der Ton gilt als gewollt, solange ihn niemand ausdruecklich abgewaehlt
 *     hat. Direkt nach der Hydration versucht die Seite deshalb sofort zu
 *     spielen — mit Ton, nicht stumm. Keine Browser-Policy wird dabei
 *     umgangen: es ist ein ganz normaler play()-Aufruf.
 *   - Lehnt der Browser ab (ohne vorherige Geste tun das die meisten), bleibt
 *     es still: kein Konsolenfehler, kein Overlay, kein Modal. Die Seite
 *     wartet dann auf den ersten echten Nutzerkontakt — pointerdown,
 *     touchstart, click oder keydown — und startet in dem Moment. Reines
 *     Scrollen zaehlt ausdruecklich nicht.
 *   - Wer den Ton abschaltet, bekommt ihn nie wieder von selbst: die
 *     Entscheidung liegt in localStorage und wird vor jedem Start geprueft.
 *   - Zwei Zustaende, damit die Oberflaeche nicht luegt: `an` ist der Wunsch
 *     (Symbol und Text), `laeuft` ist die Wirklichkeit (Equalizer). Solange
 *     der Browser blockiert, stehen die Balken still.
 *   - Der Speicher wird erst nach der Hydration gelesen (siehe lib/hydration.js
 *     zum Warum) — der erste Render muss dem vorgerenderten HTML entsprechen.
 */
function useSoundtrack() {
  const verfuegbar = Boolean(SOUNDTRACK.datei)
  const audioRef = useRef(null)
  const [an, setAn] = useState(false)
  const [laeuft, setLaeuft] = useState(false)
  const wahl = useRef(null)

  const merken = useCallback((wert) => {
    wahl.current = wert
    try {
      window.localStorage.setItem(SOUNDTRACK.speicher, wert)
    } catch {
      /* Privater Modus oder gesperrter Speicher — dann eben ohne Gedaechtnis. */
    }
  }, [])

  /**
   * Startversuch. Die zurueckgegebene Zusage sagt, ob wirklich Ton laeuft.
   * Ein abgelehntes play() ist hier ein normaler Zustand, kein Fehler — es
   * wird abgefangen und erzeugt darum auch keine Konsolenausgabe.
   */
  const abspielen = useCallback(() => {
    const el = audioRef.current
    if (!el) return Promise.resolve(false)
    el.volume = SOUNDTRACK.lautstaerke
    el.muted = false
    // Geladen wird erst hier: Wer den Ton abgewaehlt hat, holt die Datei nie.
    // metadata reicht zum Anspielen, den Rest streamt der Browser nach.
    if (el.preload !== 'metadata') el.preload = 'metadata'
    let zusage
    try {
      zusage = el.play()
    } catch {
      zusage = null
    }
    return Promise.resolve(zusage).then(
      () => {
        setAn(true)
        setLaeuft(true)
        return true
      },
      () => {
        // Autoplay verweigert. Der Wunsch bleibt sichtbar, die Balken stehen
        // still — die Seite behauptet nicht, dass etwas laeuft.
        setAn(true)
        setLaeuft(false)
        return false
      }
    )
  }, [])

  /** Eindeutiger Nutzerwille, z. B. der Klick auf „Baustelle betreten". */
  const starten = useCallback(() => {
    if (!verfuegbar || wahl.current === 'aus') return
    const el = audioRef.current
    if (!el || !el.paused) return
    merken('an')
    abspielen()
  }, [verfuegbar, merken, abspielen])

  useEffect(() => {
    if (!verfuegbar) return
    // Erst hier — nach der Hydration — darf der Speicher gelesen werden.
    try {
      wahl.current = window.localStorage.getItem(SOUNDTRACK.speicher)
    } catch {
      wahl.current = null
    }
    // Ohne gespeicherte Entscheidung gilt der Ton als gewollt.
    if (wahl.current === 'aus') return

    const typen = ['pointerdown', 'touchstart', 'click', 'keydown']
    let abgemeldet = false
    const abmelden = () => {
      if (abgemeldet) return
      abgemeldet = true
      typen.forEach((typ) => window.removeEventListener(typ, beiGeste))
    }
    function beiGeste() {
      if (wahl.current === 'aus') {
        abmelden()
        return
      }
      const el = audioRef.current
      if (!el) return
      if (!el.paused) {
        abmelden()
        return
      }
      merken('an')
      abspielen().then((gelungen) => {
        if (gelungen) abmelden()
      })
    }
    // Scrollen steht hier bewusst nicht in der Liste: sonst faengt die Seite
    // unaufgefordert an zu spielen, sobald jemand nur weiterliest.
    typen.forEach((typ) => window.addEventListener(typ, beiGeste, { passive: true }))

    // Der Sofortversuch. Klappt er, ist die Geste-Reserve ueberfluessig.
    abspielen().then((gelungen) => {
      if (!gelungen) return
      merken('an')
      abmelden()
    })

    return abmelden
  }, [verfuegbar, merken, abspielen])

  const umschalten = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      merken('an')
      abspielen()
    } else {
      el.pause()
      setAn(false)
      setLaeuft(false)
      merken('aus')
    }
  }, [merken, abspielen])

  // Der Browser ist die letzte Instanz: pausiert das Betriebssystem den Ton,
  // faellt der Equalizer von selbst zurueck.
  const beiPlay = useCallback(() => setLaeuft(true), [])
  const beiPause = useCallback(() => setLaeuft(false), [])

  return { verfuegbar, an, laeuft, starten, umschalten, audioRef, beiPlay, beiPause }
}

/**
 * Kleiner, dauerhafter Schalter unten rechts. Zeigt den Zustand doppelt an —
 * Lautsprechersymbol und Klartext — und lebt beim Spielen ueber vier
 * Equalizer-Balken. Die sind reines CSS, keine Library.
 */
function SoundSchalter({ an, laeuft, umschalten }) {
  return (
    <button
      type="button"
      className={`ent-sound${an ? ' is-an' : ''}${laeuft ? ' is-laeuft' : ''}`}
      onClick={umschalten}
      aria-pressed={an}
      aria-label={an ? 'Soundtrack ausschalten' : 'Soundtrack einschalten'}
      title={SOUNDTRACK.titel}
    >
      <span className="ent-sound__icon" aria-hidden="true">
        {an ? <Volume2 size={17} strokeWidth={1.9} /> : <VolumeX size={17} strokeWidth={1.9} />}
      </span>
      <span className="ent-sound__eq" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="ent-sound__txt">{an ? SOUNDTRACK.labelAn : SOUNDTRACK.labelAus}</span>
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * Countdown
 * ------------------------------------------------------------------ */

/**
 * Eroeffnungstermin ausgeschrieben — aus demselben ISO-Wert wie die Zaehlung,
 * damit Datum und Countdown nie auseinanderlaufen koennen. Feste Zeitzone,
 * damit „1. Dezember 2026“ auch fuer Besucher stimmt, deren Geraet auf einer
 * anderen Zone steht.
 */
const DATUM_LANG = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Berlin',
})

const EROEFFNUNG_LABEL = ENTDECKEN_CONFIG.openingDate
  ? DATUM_LANG.format(new Date(ENTDECKEN_CONFIG.openingDate))
  : null

/**
 * Restzeit bis zum Zieltermin, in Millisekunden — `null`, solange noch nicht
 * gemessen wurde.
 *
 * Der Startwert ist bewusst kein Zeitwert: Seit dem Body-Prerendering
 * (scripts/prerender.mjs) liegt auch diese Seite als fertiges HTML im Build und
 * wird im Browser hydriert (main.jsx). Der erste Render muss deshalb exakt das
 * reproduzieren, was der Build geschrieben hat — eine Uhrzeit kann das nicht,
 * sie waere bei jedem Aufruf eine andere und React verwuerfe den Teilbaum.
 *
 * Der Effekt misst darum unmittelbar nach dem ersten Commit und haelt den Wert
 * danach im Sekundentakt aktuell; bis dahin zeigt Countdown() Platzhalter.
 */
function useRestzeit(iso) {
  const ziel = useMemo(() => (iso ? new Date(iso).getTime() : NaN), [iso])
  const [rest, setRest] = useState(null)

  useEffect(() => {
    if (!Number.isFinite(ziel)) return
    const messen = () => setRest(ziel - Date.now())
    messen()
    const id = setInterval(messen, 1000)
    return () => clearInterval(id)
  }, [ziel])

  return { gueltig: Number.isFinite(ziel), rest }
}

function zweistellig(n) {
  return String(n).padStart(2, '0')
}

/**
 * Kalendertag des geplanten Termins („2026-12-01“), in Europa/Berlin gelesen.
 * Der Umschlag von Countdown auf Verzug haengt genau an diesem Tageswechsel —
 * nicht an der Uhrzeit des Besuchergeraets.
 */
const PLAN_TAG = OPENING.plannedDate ? heutigerTag(new Date(OPENING.plannedDate)) : null

/** Derselbe Termin als Zeitstempel — fuer die Restzeit auf Stundenebene. */
const PLAN_ZEIT = OPENING.plannedDate ? new Date(OPENING.plannedDate).getTime() : null

/** Tage zwischen geplantem und tatsaechlichem Eroeffnungstag. 0, solange zu ist. */
const VERSPAETUNG =
  OPENING.actualOpen && OPENING.actualOpeningDate && PLAN_TAG
    ? Math.max(0, tageZwischen(PLAN_TAG, OPENING.actualOpeningDate))
    : 0

/** `3` -> `3 Tage`, `1` -> `1 Tag`. */
function tageWort(n) {
  return `${n} ${n === 1 ? 'Tag' : 'Tage'}`
}

/**
 * Heutiges Datum als `YYYY-MM-DD` — `null`, solange noch nicht gemessen wurde.
 *
 * Wie beim Countdown darf im ersten Render keine Uhr gelesen werden: Die Seite
 * liegt als fertiges HTML im Build (scripts/prerender.mjs) und wird hydriert.
 * Der Effekt setzt den echten Tag einen Frame spaeter und haelt ihn ueber
 * Mitternacht hinweg aktuell.
 */
function useHeute() {
  const [tag, setTag] = useState(null)

  useEffect(() => {
    const messen = () => setTag(heutigerTag())
    messen()
    const id = setInterval(messen, 60000)
    return () => clearInterval(id)
  }, [])

  return tag
}

/**
 * Der Terminzustand der Seite. Eine Funktion, zwei Anzeigeorte (Countdown im
 * Hero und Kopf des Baustellenindex) — damit beide nie Verschiedenes behaupten.
 *
 * Wichtig: `offen` entsteht ausschliesslich aus `OPENING.actualOpen`. Ein
 * verstrichenes Datum macht kein Studio auf, deshalb zaehlt die Seite danach
 * einfach in die andere Richtung weiter.
 */
function terminStand(heute) {
  if (OPENING.actualOpen) return { art: 'offen', tage: VERSPAETUNG }
  if (!PLAN_TAG || heute === null) return { art: 'vorher', tage: null }
  const differenz = tageZwischen(PLAN_TAG, heute)
  // Vorher zaehlt die Seite dieselben ganzen Tage wie die grosse Zahl im
  // Countdown, damit Hero und Index nie zwei verschiedene Zahlen behaupten.
  if (differenz < 0) {
    const rest = PLAN_ZEIT === null ? -differenz : Math.floor((PLAN_ZEIT - Date.now()) / 86400000)
    return { art: 'vorher', tage: Math.max(0, rest) }
  }
  if (differenz === 0) return { art: 'heute', tage: 0 }
  return { art: 'verzug', tage: differenz }
}

/** Die eine Zeile, die den Terminzustand in Worte fasst. */
function standZeile(stand) {
  if (stand.art === 'offen') return 'Wir haben geöffnet.'
  if (stand.art === 'heute') return 'Heute war der Plan.'
  if (stand.art === 'verzug') return `${tageWort(stand.tage)} im Verzug.`
  if (stand.tage === null) return 'Noch –– Tage.'
  return stand.tage === 0 ? 'Nur noch heute.' : `Noch ${tageWort(stand.tage)}.`
}

function Countdown() {
  const { gueltig, rest } = useRestzeit(ENTDECKEN_CONFIG.openingDate)
  const stand = terminStand(useHeute())

  // Ohne belegtes Datum bleibt der ehrliche Zustand. Mit dem Termin aus
  // entdecken.js wird dieser Zweig nicht erreicht.
  if (!gueltig) {
    return (
      <div className="ent-count ent-count--offen">
        <span className="kicker">Eröffnung</span>
        <h2 className="ent-count__title">Eröffnung in Vorbereitung.</h2>
        <p className="ent-count__foot">Wir zählen schon. Das Datum fehlt uns nur noch offiziell.</p>
      </div>
    )
  }

  // Geoeffnet wird ausschliesslich behauptet, wenn es in OPENING so steht.
  // Kein Kalendertag schaltet das von selbst um.
  if (stand.art === 'offen') {
    return (
      <div className="ent-count ent-count--offen">
        <span className="kicker">Eröffnung</span>
        <h2 className="ent-count__title">Wir haben geöffnet.</h2>
        <p className="ent-count__foot">
          {VERSPAETUNG > 0
            ? `Hat nur ${tageWort(VERSPAETUNG)} länger gedauert als gedacht.`
            : `${STUDIO_ADRESSE}. Tür ist auf.`}
        </p>
      </div>
    )
  }

  // Der Termintag selbst. Noch kein Verzug — aber auch keine Eroeffnung.
  // Erst ab dem Folgetag wird gezaehlt (sonst stuende schon um 00:05 Uhr
  // „1 Tag im Verzug“ da, und das waere schlicht falsch).
  if (stand.art === 'heute') {
    return (
      <div className="ent-count ent-count--plan">
        <h2 className="ent-count__title ent-count__title--gross">Heute war der Plan.</h2>
        <p className="ent-count__sub">Schauen wir mal.</p>
        <p className="ent-count__foot">
          <span className="ent-count__badge">Plan war {PLAN_TAG ? deutschesDatum(PLAN_TAG) : ''}</span>
        </p>
      </div>
    )
  }

  // Ab dem Folgetag laeuft derselbe Zaehler weiter, nur mit umgedrehter
  // Aussage. Kein Fehlerzustand, keine Alarmfarbe — dieselbe Typografie,
  // dieselbe Flaeche, ein Satz weniger Zuversicht.
  if (stand.art === 'verzug') {
    return (
      <div className="ent-count ent-count--verzug">
        <div className="ent-count__grid ent-count__grid--eins" aria-live="off">
          <div className="ent-count__unit">
            <span className="ent-count__num">{stand.tage}</span>
            <span className="ent-count__lab">{stand.tage === 1 ? 'Tag' : 'Tage'}</span>
          </div>
        </div>
        <h2 className="ent-count__title">Im Verzug.</h2>
        <p className="ent-count__foot">
          Der Plan war der <strong className="ent-count__date">{EROEFFNUNG_LABEL}</strong>. Die
          Baustelle hatte andere Pläne. <span className="ent-count__badge">Offiziell drüber</span>
        </p>
      </div>
    )
  }

  // Vor der ersten Messung — also im vorgerenderten HTML und waehrend der
  // Hydration — steht ueberall der Platzhalter. Struktur, Groessen und Labels
  // sind dieselben wie danach, nur die Ziffern fehlen; der Effekt ersetzt sie
  // einen Frame spaeter. `?? 0` haelt dabei alle Labels im Plural, damit auch
  // der Platzhalter-Render deterministisch ist.
  const gemessen = Math.max(0, rest ?? 0)
  const tage = Math.floor(gemessen / 86400000)
  const stunden = Math.floor((gemessen % 86400000) / 3600000)
  const minuten = Math.floor((gemessen % 3600000) / 60000)
  const sekunden = Math.floor((gemessen % 60000) / 1000)
  const ziffern = (n) => (rest === null ? '––' : zweistellig(n))

  // Vier Einheiten inklusive Sekunden. Damit die Zeile im Sekundentakt nicht
  // springt, stehen die Ziffern als Versalziffern mit fester Breite
  // (lnum/tnum in .ent-count__num) — ohne das wandern Trennlinien und
  // Labels bei jedem Wechsel.
  const einheiten = [
    { wert: ziffern(tage), label: tage === 1 ? 'Tag' : 'Tage' },
    { wert: ziffern(stunden), label: stunden === 1 ? 'Stunde' : 'Stunden' },
    { wert: ziffern(minuten), label: minuten === 1 ? 'Minute' : 'Minuten' },
    { wert: ziffern(sekunden), label: sekunden === 1 ? 'Sekunde' : 'Sekunden' },
  ]

  // Reihenfolge bewusst: erst die Ziffern, dann die Erklaerung. Kein Kasten,
  // kein Rahmen, keine Karte — die Ziffern stehen gross direkt in der Flaeche,
  // nur feine Goldhaarlinien trennen die vier Einheiten.
  return (
    <div className="ent-count">
      <div className="ent-count__grid" aria-live="off">
        {einheiten.map((e) => (
          <div className="ent-count__unit" key={e.label}>
            <span className="ent-count__num">{e.wert}</span>
            <span className="ent-count__lab">{e.label}</span>
          </div>
        ))}
      </div>
      <h2 className="ent-count__title">Bis wir aufmachen.</h2>
      <p className="ent-count__foot">
        Eröffnung am <strong className="ent-count__date">{EROEFFNUNG_LABEL}</strong>
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * VIDEKO-Baustellenindex
 * ------------------------------------------------------------------ */

const RING_R = 52
const RING_U = 2 * Math.PI * RING_R

/** `2026-09-02` -> `02.09.2026`. Ohne Intl, damit Build und Browser gleich rechnen. */
function deutschesDatum(iso) {
  const [jahr, monat, tag] = iso.split('-')
  return `${tag}.${monat}.${jahr}`
}

/**
 * Rechte Spalte der Kartenkopfzeile.
 *
 * Normalerweise die Tagesdifferenz. Steht ein Bereich dagegen an einem Gate —
 * er wartet auf ein echtes Ereignis und nicht auf den Kalender —, waere „±0 seit
 * gestern“ nur eine langweilige Halbwahrheit. Dann steht dort der Grund.
 */
function DeltaBadge({ delta, live, hinweis }) {
  if (hinweis) return <span className="ent-idxk__delta is-gate">{hinweis}</span>
  if (!live) return <span className="ent-idxk__delta" aria-hidden="true" />
  if (delta > 0) {
    return <span className="ent-idxk__delta is-plus">+{delta} seit gestern</span>
  }
  return <span className="ent-idxk__delta">±0 seit gestern</span>
}

/**
 * Eine Bereichskarte des Dashboards: Kopfzeile mit Icon und Bereichsname,
 * darunter die grosse Zahl mit der Tagesdifferenz, ein Balken, der handgeschriebene
 * Text des Bereichs und als kleine zweite Zeile die automatische Statusstufe.
 *
 * Blockierte Bereiche sehen bewusst anders aus als langsame: Schloss- oder
 * Pausenzeichen, eine ruhige Plakette, gedaempfter Balken. Kein Rot, kein
 * Warnzeichen — hier ist nichts kaputt, hier ist nur nichts geliefert.
 */
function IndexKarte({ bereich, live, delay }) {
  const Icon = BEREICH_ICONS[bereich.icon] || LayoutGrid
  const GateIcon = bereich.gateBadge === 'Pausiert' ? Pause : Lock

  return (
    <Reveal
      className={`ent-idxk${bereich.akzent ? ' ent-idxk--akzent' : ''}${
        bereich.gesperrt ? ' ent-idxk--gate' : ''
      }`}
      delay={delay}
    >
      <span className="ent-idxk__kopf">
        <span className="ent-idxk__icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.6} />
        </span>
        <span className="ent-idxk__label">{bereich.label}</span>
        {bereich.gesperrt && bereich.gateBadge ? (
          <span className="ent-idxk__gate">
            <GateIcon size={12} strokeWidth={2} aria-hidden="true" />
            {bereich.gateBadge}
          </span>
        ) : null}
      </span>

      <span className="ent-idxk__zeile">
        <span className="ent-idxk__wert">
          {bereich.prozent}
          <span className="ent-idxk__pct">%</span>
        </span>
        <DeltaBadge delta={bereich.delta} live={live} hinweis={bereich.hinweis} />
      </span>

      <span className="ent-idxk__bar">
        <span className="ent-idxk__fill" style={{ width: `${bereich.prozent}%` }} />
      </span>

      <p className="ent-idxk__text">{bereich.text}</p>
      <p className="ent-idxk__stufe">{bereich.stufe}</p>
    </Reveal>
  )
}

/**
 * Das Dashboard.
 *
 * Der Tag wird erst im Effekt gesetzt (useHeute): Das vorgerenderte HTML kennt
 * nur den Basistag, und genau den rendert auch der erste Durchlauf im Browser —
 * sonst gaebe es eine Hydrationsdifferenz, sobald jemand die Seite an einem
 * anderen Tag aufruft als dem, an dem gebaut wurde. Einen Frame spaeter steht
 * das echte Datum, und alle Werte springen einmalig auf heute.
 *
 * Gerechnet wird ausschliesslich in lib/baustellenindex.js — hier steht keine
 * Zahl, kein Zufall und kein Datum. Die Gates kommen aus entdecken.js.
 *
 * Der Kopf zeigt Restzeit und Index absichtlich nebeneinander: Die Tage werden
 * weniger, der Index waechst in aller Ruhe. Genau diese Diskrepanz ist der Witz
 * und sie bleibt auch nach dem Termin stehen.
 */
function BaustellenIndex() {
  const heute = useHeute()
  const live = heute !== null
  const daten = useMemo(
    () => baustellenIndex(BAUSTELLEN_BEREICHE, heute || INDEX_BASIS, BAUSTELLEN_GATES),
    [heute]
  )
  const stand = terminStand(heute)
  const gefuellt = (daten.gesamt / 100) * RING_U

  return (
    <>
      <Reveal className="ent-head ent-head--mitte">
        <span className="kicker">{BAUSTELLEN_TEXTE.kicker}</span>
        <h2 className="ent-h2">
          Der VIDEKO
          <br />
          <span className="grad">Baustellenindex.</span>
        </h2>
        <p className="ent-lead">{BAUSTELLEN_TEXTE.sub}</p>
      </Reveal>

      {/* Gesamtindex — Mittelwert aller Bereiche, ebenfalls automatisch. */}
      <Reveal className="ent-idxg">
        <span className="ent-idxg__ring">
          <svg viewBox="0 0 120 120" className="ent-idxg__svg" aria-hidden="true">
            <circle className="ent-idxg__track" cx="60" cy="60" r={RING_R} />
            <circle
              className="ent-idxg__arc"
              cx="60"
              cy="60"
              r={RING_R}
              style={{ strokeDasharray: `${gefuellt} ${RING_U}` }}
            />
          </svg>
          <span className="ent-idxg__mid">
            <span className="ent-idxg__num">{daten.gesamt}</span>
            <span className="ent-idxg__pct">%</span>
          </span>
        </span>

        <span className="ent-idxg__text">
          <span className="kicker kicker--gold">{BAUSTELLEN_TEXTE.gesamtLabel}</span>
          <span className="ent-idxg__tage">{standZeile(stand)}</span>
          <span className="ent-idxg__status">{daten.status}</span>
          <span className="ent-idxg__note">{BAUSTELLEN_TEXTE.gesamtNote}</span>
          <span className="ent-idxg__meta">
            <span className="ent-idxg__stand">
              {BAUSTELLEN_TEXTE.standLabel}: {deutschesDatum(daten.tag)}
            </span>
            {live && daten.gesamtDelta > 0 ? (
              <span className="ent-idxg__delta">+{daten.gesamtDelta} seit gestern</span>
            ) : null}
          </span>
          <span className="ent-idxg__hint">{BAUSTELLEN_TEXTE.hinweis}</span>
        </span>
      </Reveal>

      <div className="ent-idxgrid">
        {daten.bereiche.map((b, i) => (
          <IndexKarte key={b.id} bereich={b} live={live} delay={Math.min(i, 5) * 0.05} />
        ))}
      </div>

      {/* Ausdrueckliche Einordnung. Der Index darf lustig sein, aber er darf
          niemandem einen belegten Baufortschritt vorspielen. */}
      <Reveal className="ent-idxhint">
        <span className="ent-idxhint__dot" aria-hidden="true" />
        {BAUSTELLEN_TEXTE.disclaimer}
      </Reveal>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Social-Kachel
 * ------------------------------------------------------------------ */

/**
 * Grosse, hochformatige Kachel: Bildflaeche als Grund, darauf Icon, Name,
 * kurze Zeile und ein Button am Fuss.
 *
 * Das Motiv ist bewusst KEIN Screenshot eines echten Beitrags — solche Bilder
 * liegen nicht im Repo und duerften nicht erfunden werden. Es sind eigene
 * VIDEKO-Studio-Renderings, in styles.css stark abgedunkelt und entsaettigt.
 * Sie tragen die Kachel als Material und Licht und behaupten keinen Inhalt.
 */
function SocialKachel({ daten, Icon, href, aus = false, delay = 0 }) {
  const inhalt = (
    <>
      {daten.bild ? <LazyBg className="ent-soc__bild" image={daten.bild} aria-hidden="true" /> : null}
      <span className="ent-soc__schleier" aria-hidden="true" />
      <span className="ent-soc__kopf">
        <span className="ent-soc__icon" aria-hidden="true">
          {Icon ? <Icon size={24} /> : null}
        </span>
        <span className="ent-soc__name">{daten.label}</span>
        <span className="ent-soc__note">{daten.note}</span>
      </span>
      {aus ? (
        <span className="ent-soc__cta ent-soc__cta--aus">{daten.badge}</span>
      ) : (
        <span className="ent-soc__cta">
          {daten.cta}
          <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </span>
      )}
    </>
  )

  if (aus) {
    return (
      <Reveal className={`ent-soc ent-soc--${daten.key} is-aus`} delay={delay}>
        {inhalt}
      </Reveal>
    )
  }

  return (
    <Reveal
      as="a"
      className={`ent-soc ent-soc--${daten.key}`}
      delay={delay}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`VIDEKO auf ${daten.label} — öffnet in neuem Tab`}
    >
      {inhalt}
    </Reveal>
  )
}

/* ------------------------------------------------------------------ *
 * „Drueck nicht."
 * ------------------------------------------------------------------ */

/* Die kurzen Effekte, die ein Klick ausloesen darf. Jeder Druck bekommt den
   Knopf-Effekt (Eindruecken, Halo, Karte) plus genau einen Zusatzeffekt aus
   dieser Liste; die festen Meilensteine bekommen mehrere gleichzeitig.
   Nichts davon laeuft dauerhaft, und `prefers-reduced-motion` ersetzt im
   Stylesheet jede Bewegung durch ein reines Aufleuchten. */
const EGG_FX_ZUSATZ = ['beben', 'blitz', 'ziffern', 'video', 'linie', 'hopser']

/* Laufzeit je Effekt in Millisekunden — muss zu den @keyframes in styles.css
   passen. Danach nimmt der Hero die Klasse wieder ab, es bleibt nichts
   haengen. */
const EGG_FX_DAUER = {
  beben: 380,
  blitz: 460,
  ziffern: 420,
  video: 640,
  linie: 720,
  hopser: 440,
}

/** Laufzeit des Knopf-Effekts (Halo ist der laengste Teil davon). */
const EGG_DRUCK_MS = 560

/* Die festen Klickzahlen reagieren deutlich groesser als ein normaler
   Druck — aber immer noch aus denselben sechs Effekten. */
const EGG_FX_MEILEN = {
  1: ['hopser'],
  3: ['blitz'],
  5: ['ziffern'],
  7: ['beben', 'hopser'],
  10: ['beben', 'blitz'],
  15: ['video', 'linie'],
  20: ['beben', 'ziffern'],
  25: ['blitz', 'video', 'ziffern'],
  50: ['beben', 'blitz', 'linie'],
  100: ['blitz', 'beben', 'video', 'ziffern', 'linie'],
  250: ['blitz', 'linie', 'hopser'],
}

/** Zufaelliges Element — nur im Klick-Handler benutzt, nie beim Render. */
function ausListe(liste) {
  return liste[Math.floor(Math.random() * liste.length)]
}

/** Zwei verschiedene Effekte aus der Liste — fuer die seltenen Sprueche. */
function zweiAus(liste) {
  const a = Math.floor(Math.random() * liste.length)
  const b = (a + 1 + Math.floor(Math.random() * (liste.length - 1))) % liste.length
  return [liste[a], liste[b]]
}

/**
 * Die Zahlen, die in den Sprüchen auftauchen duerfen — aus genau derselben
 * Rechnung wie der Baustellenindex weiter unten. Der Knopf erfindet nichts:
 * Steht der Index auf 12 %, sagt auch der Spruch 12 %.
 */
function eggWerte(heute) {
  const stand = terminStand(heute)
  const daten = baustellenIndex(BAUSTELLEN_BEREICHE, heute || INDEX_BASIS, BAUSTELLEN_GATES)
  const prozent = (id) => {
    const b = daten.bereiche.find((x) => x.id === id)
    return b ? b.prozent : 0
  }
  return {
    days: stand.tage === null ? 0 : stand.tage,
    index: daten.gesamt,
    kuechen: prozent('kuechen'),
    klo: prozent('luxusklo'),
  }
}

/**
 * Reines Spassmodul. Kein Modal, keine Library, kein Tracking, kein
 * Netzaufruf, keine Speicherung. Der Zaehler lebt nur in dieser Session —
 * beim Neuladen faengt er wieder bei null an, und genau das ist gewollt.
 *
 * Der Startzustand ist absichtlich leer: vorgerendertes HTML und erster
 * Render im Browser muessen identisch sein (siehe useRestzeit oben). Deshalb
 * faellt auch kein Math.random beim Render — der Zufall passiert
 * ausschliesslich im Klick-Handler.
 *
 * Drei Ebenen in dieser Reihenfolge: fester Meilenstein schlaegt seltenen
 * Spruch schlaegt normalen Spruch.
 *
 * `onDruck` haengt den Klick an die bereits vorhandene Sound-Logik
 * (`tonStarten`) — hier entsteht keine zweite Audio-Logik. `onEffekt` meldet
 * dem Hero, welcher kurze Effekt laufen darf.
 */
function DrueckNicht({ onDruck, onEffekt, onSpektakel, onLaeuft }) {
  const heute = useHeute()
  const werte = useMemo(() => eggWerte(heute), [heute])

  const [zaehler, setZaehler] = useState(0)
  const [meldung, setMeldung] = useState(null)
  const timer = useRef(null)
  const anzahl = useRef(0)
  const letzter = useRef(null)

  // Der Knopf-Effekt laeuft absichtlich am React-Zustand vorbei: eine
  // CSS-Animation startet nur dann neu, wenn die Klasse wirklich kurz weg
  // war. Ueber setState laesst sich das nicht zuverlaessig erzwingen (React
  // fasst beide Updates zu einem Render zusammen, der Browser sieht keinen
  // Wechsel und spielt nichts ab). Deshalb hier direkt am Knoten:
  // Klasse ab, Reflow erzwingen, Klasse dran.
  const eggRef = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const druecken = useCallback(() => {
    // Der Klick ist eindeutige Nutzerabsicht: der bereits laufende oder noch
    // blockierte Soundtrack darf hier starten.
    if (onDruck) onDruck()

    const n = anzahl.current + 1
    anzahl.current = n
    setZaehler(n)

    const fertig = (t) =>
      t
        .replace('{count}', String(n))
        .replace('{days}', String(werte.days))
        .replace('{tage}', String(werte.days))
        .replace('{index}', String(werte.index))
        .replace('{kuechen}', String(werte.kuechen))
        .replace('{klo}', String(werte.klo))

    const fest = DRUECK_NICHT.meilensteine[n]

    // Spektakel-Ebene: fragt zentral nach, ob dieser Klick ein Easter-Egg
    // bekommt (ca. jeder zehnte, feste Klickzahlen immer). Gibt das Event
    // zurueck, damit die passende Meldung dazu erscheint — null heisst:
    // ganz normaler Klick. Der garantierte Knopfdruck weiter unten und
    // alle bestehenden Kurzeffekte bleiben davon unberuehrt.
    // Vor dem Ausloesen fragen: fliegt gerade noch ein Objekt aus einem
    // frueheren Klick? Dann bleibt dessen Meldung stehen, damit Text und
    // Objekt als ein Ereignis lesbar bleiben.
    const nochUnterwegs = onLaeuft ? onLaeuft() : false
    const ereignis = onSpektakel ? onSpektakel(n, Boolean(fest)) : null
    let roh
    let art
    if (fest) {
      roh = fest
      art = 'fest'
    } else if (ereignis && ereignis.message) {
      roh = ereignis.message
      art = 'selten'
    } else if (DRUECK_NICHT.selten.length && Math.random() < DRUECK_NICHT.seltenChance) {
      roh = ausListe(DRUECK_NICHT.selten)
      art = 'selten'
    } else {
      const liste = DRUECK_NICHT.meldungen
      let i = Math.floor(Math.random() * liste.length)
      // Nicht zweimal hintereinander dieselbe Zeile — das wirkt wie ein Bug.
      if (liste.length > 1 && liste[i] === letzter.current) i = (i + 1) % liste.length
      roh = liste[i]
      art = 'normal'
    }
    letzter.current = roh

    // Ein Zwischenklick waehrend eines laufenden Flugs bekommt seine
    // Effekte und zaehlt normal weiter, ersetzt die Meldung aber nicht.
    // Ein Meilenstein und ein neues Ereignis duerfen sie ablosen.
    if (fest || ereignis || !nochUnterwegs) {
      setMeldung({ text: fertig(roh), art, nr: n })
    }

    // Jeder Druck: Knopf faehrt in den Sockel, Halo blitzt auf, Karte
    // reagiert. Kein Zufall, keine Ausnahme.
    const el = eggRef.current
    if (el) {
      clearTimeout(timer.current)
      el.classList.remove('is-druck')
      void el.offsetWidth
      el.classList.add('is-druck')
      timer.current = setTimeout(() => {
        el.classList.remove('is-druck')
      }, EGG_DRUCK_MS + 40)
    }

    // Dazu immer genau ein weiterer Effekt — bei Meilensteinen mehrere.
    // Ein Spektakel legt seine eigenen Effekte oben drauf, ersetzt die
    // Basis aber nicht: jeder Klick behaelt seinen sichtbaren Zusatz.
    if (onEffekt) {
      let basis
      if (art === 'fest') basis = EGG_FX_MEILEN[n] || zweiAus(EGG_FX_ZUSATZ)
      else if (art === 'selten') basis = zweiAus(EGG_FX_ZUSATZ)
      else basis = [ausListe(EGG_FX_ZUSATZ)]
      onEffekt(ereignis && ereignis.effects ? basis.concat(ereignis.effects) : basis)
    }
  }, [onDruck, onEffekt, onLaeuft, onSpektakel, werte])

  return (
    <div className="ent-egg" ref={eggRef}>
      <div className="ent-egg__pult">
        <span className="ent-knopf__sockel" aria-hidden="true" />
        <button
          type="button"
          className="ent-knopf"
          onClick={druecken}
          aria-describedby="ent-egg-out"
        >
          <span className="ent-knopf__halo" aria-hidden="true" />
          <span className="ent-knopf__rand" aria-hidden="true" />
          <span className="ent-knopf__cap" aria-hidden="true" />
          <span className="ent-knopf__glanz" aria-hidden="true" />
          <span className="ent-knopf__sr">{DRUECK_NICHT.label}</span>
        </button>
      </div>

      <div className="ent-egg__text">
        {/* Der Knopf traegt denselben Text schon als Screenreader-Label —
            diese Zeile ist reine Optik. */}
        <p className="ent-egg__label" aria-hidden="true">
          Drück <span className="grad">nicht.</span>
        </p>
        <p className="ent-egg__sub">{DRUECK_NICHT.sub}</p>

        {/* Die Rueckmeldung steht direkt am Knopf, nicht in einem Overlay.
            Feste Hoehe, damit beim Wechsel nichts springt. */}
        <p
          className={`ent-egg__out${meldung ? ` is-${meldung.art}` : ''}`}
          id="ent-egg-out"
          aria-live="polite"
        >
          {meldung ? (
            <span className="ent-egg__zeile" key={meldung.nr}>
              {meldung.text}
            </span>
          ) : (
            DRUECK_NICHT.ruhe
          )}
        </p>

        <p className="ent-egg__count">{zaehler > 0 ? DRUECK_NICHT.zaehler(zaehler) : ' '}</p>
      </div>
    </div>
  )
}


/* ------------------------------------------------------------------ *
 * Standort — echte Karte
 * ------------------------------------------------------------------ */

/**
 * Echte Geografie statt gezeichneter Platzhalterstadt.
 *
 * Die Flaeche ist ein selbst gehosteter Kartenausschnitt aus OpenStreetMap
 * (Zoom 17, Hertzstrasse 4 exakt in der Bildmitte). Bewusst KEIN eingebetteter
 * Fremd-Frame: unsere Datenschutzerklaerung sagt zu, dass ohne Einwilligung
 * keine Drittinhalte nachgeladen werden, und /studio dokumentiert dieselbe
 * Entscheidung. Ein Raster im eigenen Bundle laedt nichts nach, setzt keine
 * Cookies, braucht keinen API-Key und kann auch nicht ausfallen.
 *
 * Weil der Standort in der Bildmitte liegt, sitzt der Pin bei jedem
 * Seitenverhaeltnis richtig — `object-fit: cover` beschneidet symmetrisch.
 */
function Kartenflaeche() {
  return (
    <figure className="ent-karte">
      <img
        className="ent-karte__bild"
        src={STUDIO_KARTE.bild}
        alt={STUDIO_KARTE.alt}
        width="880"
        height="640"
        loading="lazy"
        decoding="async"
      />
      <span className="ent-karte__vignette" aria-hidden="true" />
      <span className="ent-karte__pin" aria-hidden="true">
        <span className="ent-karte__puls" />
        <span className="ent-karte__nadel">
          <MapPin size={19} strokeWidth={2.1} />
        </span>
      </span>
      <figcaption className="ent-karte__fuss">
        <span className="ent-karte__adr">
          <span className="ent-karte__marke">{BRAND.name}</span>
          <span className="ent-karte__zeile">{BRAND.studio.street}</span>
          <span className="ent-karte__zeile">
            {BRAND.studio.postalCode} {BRAND.studio.city}
          </span>
        </span>
        <a
          className="ent-karte__quelle"
          href={STUDIO_KARTE.attributionUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {STUDIO_KARTE.attribution}
        </a>
      </figcaption>
    </figure>
  )
}
/* ------------------------------------------------------------------ *
 * Seite
 * ------------------------------------------------------------------ */

export default function Entdecken() {
  const { video, texturen } = ENTDECKEN_CONFIG
  const socials = ENTDECKEN_SOCIALS.filter((s) => s.url)
  const lenis = useLenis()
  const {
    verfuegbar: tonDa,
    an: tonAn,
    laeuft: tonLaeuft,
    starten: tonStarten,
    umschalten: tonUmschalten,
    audioRef,
    beiPlay,
    beiPause,
  } = useSoundtrack()

  // Sprung in die Baustelle, ohne die Adresszeile anzufassen: angehaengte
  // UTM-Parameter bleiben dadurch unveraendert stehen (ein Router-Link mit
  // #anker wuerde den Query-String verlieren). Ohne JS bleibt der Anker als
  // normaler #-Link funktionsfaehig.
  //
  // Der Klick ist zugleich die eindeutige Nutzerabsicht, an der der Soundtrack
  // starten darf — erst Ton, dann Scroll.
  const zurBaustelle = useCallback(
    (e) => {
      tonStarten()
      const el = typeof document !== 'undefined' ? document.getElementById('fortschritt') : null
      if (!el) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(el, { offset: -80 })
      else el.scrollIntoView({ behavior: 'smooth' })
    },
    [lenis, tonStarten]
  )

  // Die kurzen Effekte pro Klick haengen als Klasse am Hero, weil Countdown,
  // Video, Lichtschein und Knopf alle darin liegen. Gesetzt wird sie direkt
  // am Knoten statt ueber setState: eine CSS-Animation startet nur neu, wenn
  // die Klasse zwischendurch wirklich weg war — mit React-Zustand landen
  // Entfernen und Setzen im selben Render, der Browser sieht keinen Wechsel
  // und spielt beim zweiten gleichen Effekt nichts ab. Reflow dazwischen
  // erzwingen loest genau das. Jeder Effekt hat seinen eigenen Timer, damit
  // mehrere gleichzeitig laufen koennen (Meilensteine) und keiner haengen
  // bleibt.
  const heroRef = useRef(null)
  const fxTimer = useRef({})

  // Die Spektakel-Ebene (fliegende Objekte, Goldfeuerwerk) haelt ihren
  // eigenen Zustand. Sie liegt ueber dem Hero und aendert nichts an den
  // bestehenden Effekten oder an irgendeinem echten Baustellenwert.
  const {
    objekt: flugObjekt,
    feuer: goldFeuer,
    ausloesen,
    vormerken,
    objektLaeuft,
  } = useSpektakel()

  useEffect(() => {
    const laufend = fxTimer.current
    return () => {
      for (const name of Object.keys(laufend)) clearTimeout(laufend[name])
    }
  }, [])

  const effektAus = useCallback((namen) => {
    const hero = heroRef.current
    if (!hero || !namen || !namen.length) return
    for (const name of namen) {
      const dauer = EGG_FX_DAUER[name]
      if (!dauer) continue
      const klasse = `is-fx-${name}`
      clearTimeout(fxTimer.current[name])
      hero.classList.remove(klasse)
      // Erzwingt den Reflow. Ohne diese Zeile laeuft derselbe Effekt beim
      // zweiten Klick nicht noch einmal.
      void hero.offsetWidth
      hero.classList.add(klasse)
      fxTimer.current[name] = setTimeout(() => {
        hero.classList.remove(klasse)
        delete fxTimer.current[name]
      }, dauer + 40)
    }
  }, [])

  // Deterministischer Ausloeser fuer genau ein Event — ohne ihn liesse
  // sich ein 10-%-Zufallsereignis nicht gezielt pruefen. Er stellt das
  // Ereignis nur scharf; ausgeloest wird es vom naechsten echten Klick,
  // damit Meldung, Effekte und Objekt exakt denselben Weg nehmen wie im
  // Normalbetrieb. Bewusst nur eine Funktion am window-Objekt: kein
  // Debug-Menue, kein sichtbarer Schalter, keine geaenderte Chance.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    window.__videkoSpektakel = (id) => {
      const ereignis = spektakelNachId(id)
      if (!ereignis) return false
      vormerken(ereignis)
      return true
    }
    return () => {
      delete window.__videkoSpektakel
    }
  }, [vormerken])

  return (
    <div className="ent">
      {/* Der Player wird nur gerendert, wenn wirklich eine eigene Audiodatei
          im Projekt liegt (SOUNDTRACK.datei). Lieber gar kein Player als ein
          kaputter — eine fremde Streaming-URL kommt hier nicht rein. */}
      {tonDa ? (
        <audio
          ref={audioRef}
          src={SOUNDTRACK.datei}
          loop
          preload="none"
          playsInline
          onPlay={beiPlay}
          onPause={beiPause}
          aria-hidden="true"
        />
      ) : null}
      {tonDa ? (
        <SoundSchalter an={tonAn} laeuft={tonLaeuft} umschalten={tonUmschalten} />
      ) : null}

      {/* ---------- Hero: Copy links, Countdown in der Mitte, der Knopf
           rechts, darunter das grosse Baustellenvideo ueber die volle
           Breite. Alles drei liegt damit im ersten Screen. ---------- */}
      <section className="ent-hero" ref={heroRef}>
        <span className="ent-hero__glow" aria-hidden="true" />
        <span className="ent-hero__blitz" aria-hidden="true" />
        <span className="ent-hero__linie" aria-hidden="true" />
        <SpektakelLayer objekt={flugObjekt} feuer={goldFeuer} />
        <div className="ent-wide ent-hero__inner">
          <div className="ent-hero__copy">
            {/* Kein zweites Logo im Hero: der Header steht auf /entdecken
                in seinem hellen Zustand (HELLE_SEITEN in Header.jsx) direkt
                darueber, sein Logo ist voll sichtbar. Ein kleineres Duplikat
                150px darunter schwaecht beide. */}
            <span className="kicker">Küchenstudio · Würzburg</span>
            <h1 className="ent-hero__title">
              Wir bauen
              <br />
              <span className="grad">da was.</span>
            </h1>
            <p className="ent-hero__lead">
              VIDEKO Küchen entsteht in Würzburg. Ein Studio für echte Küche, ehrliches Handwerk und
              verdammt gute Gespräche.
            </p>
            <div className="ent-hero__btns">
              <CTAButton href="#fortschritt" onClick={zurBaustelle}>
                Baustelle betreten
              </CTAButton>
              <CTAButton to="/beratung" variant="dark">
                Küche planen
              </CTAButton>
            </div>
          </div>

          {/* Bewusst ohne Reveal: der Countdown ist sofort sichtbar und darf
              nicht erst eingeblendet werden. */}
          <div className="ent-hero__count" id="eroeffnung">
            <Countdown />
          </div>

          {/* Ebenfalls ohne Reveal — der Knopf muss ohne Scrollen und ohne
              Wartezeit da sein, sonst ist der Gag keiner. */}
          <div className="ent-hero__egg">
            <DrueckNicht
              onDruck={tonStarten}
              onEffekt={effektAus}
              onSpektakel={ausloesen}
              onLaeuft={objektLaeuft}
            />
          </div>

          <div className="ent-hero__media">
            <div className="ent-vid">
              <LazyVideo
                className="ent-vid__el"
                src={video.src}
                poster={video.poster}
                rootMargin="600px"
                aria-hidden="true"
              />
              <span className="ent-vid__veil" aria-hidden="true" />
              <span className="ent-vid__tag">{video.label}</span>
            </div>
            <p className="ent-hero__note">Wir nehmen dich von Anfang an mit. Staub inklusive.</p>
          </div>
        </div>
      </section>

      {/* ---------- Dunkles Band 1: Socials ----------
          Direkt hinter dem hellen Hero. Der harte Wechsel von Marmor auf
          Nacht ist der Bruch, der den Abschnitt traegt. */}
      <Nachtband textur={texturen.nacht}>
        <section className="ent-band ent-band--social" id="socials">
          <div className="ent-wide">
            <Reveal className="ent-head ent-head--hell ent-head--mitte">
              <span className="kicker kicker--gold">Socials</span>
              <h2 className="ent-h2">
                Folge dem <span className="grad">Wahnsinn.</span>
              </h2>
              <p className="ent-lead">
                Behind the Scenes, Baufortschritt und echte Einblicke. Ungefiltert.
              </p>
            </Reveal>

            <div className="ent-socialgrid">
              {socials.map((s, i) => (
                <SocialKachel
                  key={s.key}
                  daten={s}
                  Icon={SOCIAL_ICONS[s.key]}
                  href={s.url}
                  delay={Math.min(i, 5) * 0.05}
                />
              ))}

              {/* Spotify: nur mit belegter Profil-URL verlinkt. Solange keine
                  existiert, bleibt die Kachel sichtbar, aber deaktiviert —
                  statt eine URL zu erfinden (Begruendung in site.js). */}
              <SocialKachel
                daten={ENTDECKEN_SPOTIFY_KACHEL}
                Icon={SpotifyIcon}
                href={ENTDECKEN_SPOTIFY || undefined}
                aus={!ENTDECKEN_SPOTIFY}
                delay={0.28}
              />
            </div>
          </div>
        </section>
      </Nachtband>

      {/* ---------- Heller Baustellenindex ---------- */}
      <section className="ent-sec ent-sec--idx" id="fortschritt">
        <div className="ent-wide">
          <BaustellenIndex />
        </div>
      </section>

      {/* ---------- Dunkles Band 2: Marke + Easter Egg ---------- */}
      <Nachtband textur={texturen.nacht}>
        {/* Marke */}
        <section className="ent-band ent-band--marke">
          <div className="ent-wide">
            <Reveal className="ent-brand">
              <div className="ent-brand__kopf">
                <span className="kicker kicker--gold">Was VIDEKO ist</span>
                <h2 className="ent-h2">
                  Nicht nur ein <span className="grad">Küchenstudio.</span>
                </h2>
              </div>
              <div className="ent-brand__cols">
                <p className="ent-brand__text">
                  Wir bauen in Würzburg ein Küchenstudio. Gleichzeitig bauen wir eine Marke, einen
                  Shop und ungefähr zehn Dinge, die noch keinen richtigen Namen haben.
                </p>
                <p className="ent-brand__text">
                  Das meiste davon passiert öffentlich: Planung, Umbau, Fortschritt, Staub und
                  gelegentlich Chaos. Wer will, schaut zu.
                </p>
              </div>
              <ul className="ent-chips">
                {['Küche', 'Umbau', 'Planung', 'Chaos', 'Fortschritt'].map((c) => (
                  <li className="ent-chip" key={c}>
                    {c}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      </Nachtband>

      {/* ---------- Standort: Text links, echte Karte rechts ---------- */}
      <section className="ent-sec ent-sec--ort" id="komm-vorbei">
        <div className="ent-wide">
          <div className="ent-ort">
            <Reveal className="ent-ort__copy">
              <span className="kicker">Standort</span>
              <h2 className="ent-h2 ent-ort__h2">
                Schön hier.
                <br />
                Aber warst du schon mal
                <br />
                in der <span className="grad">Hertzstraße 4</span>?
              </h2>
              <address className="ent-ort__adr">
                <MapPin size={22} strokeWidth={1.9} aria-hidden="true" />
                <span>
                  {BRAND.studio.street}
                  <br />
                  {BRAND.studio.postalCode} {BRAND.studio.city}
                </span>
              </address>
              <p className="ent-ort__note">
                Unser zukünftiges Zuhause. Noch Baustelle, bald Studio. Komm vorbei, wenn du in der
                Nähe bist.
              </p>
              <div className="ent-ort__btns">
                <CTAButton href={STUDIO_ROUTE_URL} target="_blank" rel="noopener noreferrer">
                  {STUDIO_KARTE.routeCta}
                </CTAButton>
                <a
                  className="ent-link"
                  href={STUDIO_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Auf der Karte ansehen
                </a>
              </div>
            </Reveal>

            <Reveal className="ent-ort__media" delay={0.08}>
              <Kartenflaeche />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Beratung ---------- */}
      <section className="ent-final">
        <LazyBg className="ent-final__tex" image={texturen.finale} aria-hidden="true" />
        <span className="ent-final__schleier" aria-hidden="true" />
        <div className="ent-wide">
          <Reveal className="ent-final__inner">
            <span className="kicker kicker--gold">Schon jetzt</span>
            <h2 className="ent-h2">
              Du willst nicht nur
              <br />
              <span className="grad">zuschauen?</span>
            </h2>
            <p className="ent-lead">
              Dann lass uns über deine Küche sprechen. Gemeinsam planen wir etwas, das bleibt.
            </p>
            <div className="ent-final__btns">
              <CTAButton to="/beratung">Beratung starten</CTAButton>
              <Link className="ent-link" to="/leistungen">
                Was wir machen
              </Link>
            </div>
            {/* Haltung, keine Kennzahl: dieselbe Markenzeile, die auch im
                globalen Footer steht (Footer.jsx). Keine Bewertungen, keine
                Zahlen, keine Auszeichnungen. */}
            <ul className="ent-final__werte">
              {['Persönlich', 'Ehrlich', 'Anspruchsvoll'].map((w) => (
                <li key={w}>
                  <span className="ent-final__punkt" aria-hidden="true" />
                  {w}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
