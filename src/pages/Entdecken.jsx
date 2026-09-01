import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLenis } from 'lenis/react'
import {
  ArrowUpRight,
  ChefHat,
  Coffee,
  DoorOpen,
  Droplets,
  LayoutGrid,
  Lightbulb,
  MapPin,
} from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import LazyVideo from '../components/LazyVideo.jsx'
import LazyBg from '../components/LazyBg.jsx'
import CTAButton from '../components/CTAButton.jsx'
import { BRAND } from '../data/company.js'
import {
  DRUECK_NICHT,
  ENTDECKEN_CONFIG,
  ENTDECKEN_FORTSCHRITT,
  ENTDECKEN_SOCIALS,
  ENTDECKEN_SPOTIFY,
  ENTDECKEN_SPOTIFY_KACHEL,
  FORTSCHRITT_HINWEIS,
  STUDIO_ADRESSE,
  STUDIO_MAPS_URL,
} from '../data/entdecken.js'


/**
 * /entdecken — Landeseite fuer alle, die VIDEKO offline finden.
 *
 * KONTEXT
 * -------
 * Ziel der gedruckten QR-Codes. Die Codes zeigen auf go.videko-kuechen.de,
 * dort wird gezaehlt und hierher weitergeleitet. Diese Seite baut deshalb
 * KEIN eigenes Tracking und wertet keine Parameter aus — angehaengte
 * UTM-Parameter stoeren sie nicht und werden auch nicht entfernt.
 *
 * ANSPRUCH
 * --------
 * Wer den Code scannt, soll nicht „Infos ueber VIDEKO" lesen, sondern mitten
 * in der Baustelle stehen. Dramaturgie: hell (Hero, Fortschritt) -> dunkles
 * Band (Marke, Socials, Easter Egg) -> hell (Standort) -> dunkel (Beratung).
 * Marmor ist Buehne, Schwarz ist Kontrast, Gold ist Akzent, die echte
 * Baustelle ist der Inhalt.
 *
 * AUFBAU
 * ------
 * Hero mit Countdown und Video -> Baufortschritt -> dunkles Band
 * (Marke, Socials, „Drueck nicht.") -> Standort -> Beratung.
 *
 * Alles Sichtbare kommt aus belegten Quellen: Adresse aus company.js,
 * Social-URLs aus site.js, Eroeffnung, Video und Fortschritt aus
 * entdecken.js. Wo eine Angabe fehlt, faellt der Block weg oder zeigt seinen
 * ehrlichen Zustand — nichts wird geschaetzt. Insbesondere gibt es KEINE
 * erfundenen Fortschritts-Prozente (Begruendung in entdecken.js).
 */

/* ------------------------------------------------------------------ *
 * Marken-Glyphen als Inline-SVG.
 *
 * Die im Projekt vorhandene lucide-Version liefert keine Marken-Icons mehr
 * (Instagram, YouTube, Facebook, LinkedIn wurden entfernt, TikTok und Spotify
 * gab es nie). Statt dafuer eine zweite Icon-Library aufzunehmen, stehen die
 * sechs Glyphen hier — gleiches 24er-Raster, gleiche Strichstaerke wie der
 * Rest der Seite.
 * ------------------------------------------------------------------ */

function Glyph({ size = 22, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
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
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" stroke="none" />
    </Glyph>
  )
}

function TikTokIcon({ size = 22 }) {
  // Der TikTok-Notenkopf funktioniert nur als Flaeche, nicht als Kontur.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3h-3v12.4a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12V9.7a6.1 6.1 0 0 0-.78-.05 5.7 5.7 0 1 0 5.7 5.7V8.4a7.3 7.3 0 0 0 4.3 1.38V6.7A4.3 4.3 0 0 1 16.5 3Z" />
    </svg>
  )
}

function YoutubeIcon(props) {
  return (
    <Glyph {...props}>
      <rect x="2.5" y="5.4" width="19" height="13.2" rx="4.2" />
      <path d="M10.5 9.5v5l4.4-2.5z" fill="currentColor" stroke="none" />
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

// Bereichs-Icons des Baufortschritts — aus lucide, also aus dem bereits
// vorhandenen Bestand. Keine neue Icon-Library.
const FORTSCHRITT_ICONS = {
  ausstellung: LayoutGrid,
  kuechen: ChefHat,
  bar: Coffee,
  empfang: DoorOpen,
  beleuchtung: Lightbulb,
  toiletten: Droplets,
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

function Countdown() {
  const { gueltig, rest } = useRestzeit(ENTDECKEN_CONFIG.openingDate)

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

  // Ab dem Termin: umschalten statt ins Minus weiterzaehlen. `null` heisst
  // "noch nicht gemessen" und darf hier nicht als erreichter Termin gelten.
  if (rest !== null && rest <= 0) {
    return (
      <div className="ent-count ent-count--offen">
        <span className="kicker">Eröffnung</span>
        <h2 className="ent-count__title">Wir haben geöffnet.</h2>
        <p className="ent-count__foot">{STUDIO_ADRESSE}. Tür ist auf.</p>
      </div>
    )
  }

  // Vor der ersten Messung — also im vorgerenderten HTML und waehrend der
  // Hydration — steht ueberall der Platzhalter. Struktur, Groessen und Labels
  // sind dieselben wie danach, nur die Ziffern fehlen; der Effekt ersetzt sie
  // einen Frame spaeter. `?? 0` haelt dabei alle Labels im Plural, damit auch
  // der Platzhalter-Render deterministisch ist.
  const gemessen = rest ?? 0
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

  // Reihenfolge bewusst: erst die Ziffern, dann die Erklaerung. Der Zaehler
  // steht im Hero und ist dort das Auffaelligste — ein Kicker oder eine
  // Ueberschrift davor wuerde ihn wieder zu einer Beschriftung machen.
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
 * Baufortschritt
 * ------------------------------------------------------------------ */

const RING_R = 34
const RING_U = 2 * Math.PI * RING_R

/**
 * Eine Bereichs-Karte.
 *
 * Ohne bestaetigten Wert (`percent === null`) zeigt der Ring bewusst KEINEN
 * Fuellstand, sondern eine gestrichelte, fuer alle Bereiche identische Spur.
 * Damit behauptet die Grafik nichts. Sobald in entdecken.js eine echte Zahl
 * steht, faehrt der Bogen anteilig aus und die Zahl steht in der Mitte.
 */
function FortschrittKarte({ bereich, delay }) {
  const Icon = FORTSCHRITT_ICONS[bereich.icon] || LayoutGrid
  const hatWert = typeof bereich.percent === 'number' && Number.isFinite(bereich.percent)
  const anteil = hatWert ? Math.max(0, Math.min(100, bereich.percent)) : 0

  return (
    <Reveal className="ent-prog" delay={delay}>
      <span className="ent-prog__ring" aria-hidden="true">
        <svg viewBox="0 0 80 80" className="ent-prog__svg">
          <circle className="ent-prog__track" cx="40" cy="40" r={RING_R} />
          {hatWert ? (
            <circle
              className="ent-prog__arc"
              cx="40"
              cy="40"
              r={RING_R}
              style={{ strokeDasharray: `${(anteil / 100) * RING_U} ${RING_U}` }}
            />
          ) : (
            <circle className="ent-prog__spur" cx="40" cy="40" r={RING_R} />
          )}
        </svg>
        <span className="ent-prog__mid">
          {hatWert ? (
            <span className="ent-prog__pct">{anteil}%</span>
          ) : (
            <Icon size={21} strokeWidth={1.6} />
          )}
        </span>
      </span>
      <h3 className="ent-prog__label">{bereich.label}</h3>
      <p className="ent-prog__status">{bereich.status}</p>
      <p className="ent-prog__note">{bereich.note}</p>
    </Reveal>
  )
}

/* ------------------------------------------------------------------ *
 * „Drueck nicht."
 * ------------------------------------------------------------------ */

/**
 * Reines Spassmodul. Kein Audio, kein Modal, keine Confetti-Library, kein
 * Tracking, keine Speicherung. Der Zaehler lebt nur in dieser Session — beim
 * Neuladen faengt er wieder bei null an, und genau das ist gewollt.
 *
 * Der Startzustand ist absichtlich leer: vorgerendertes HTML und erster
 * Render im Browser muessen identisch sein (siehe useRestzeit oben).
 */
function DrueckNicht() {
  const [zaehler, setZaehler] = useState(0)
  const [meldung, setMeldung] = useState(null)
  const [puls, setPuls] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const druecken = useCallback(() => {
    setZaehler((n) => n + 1)

    const ziel = new Date(ENTDECKEN_CONFIG.openingDate).getTime()
    const tage = Number.isFinite(ziel) ? Math.max(0, Math.ceil((ziel - Date.now()) / 86400000)) : 0
    const fertig = (t) => t.replace('{tage}', String(tage))

    setMeldung((vorher) => {
      const liste = DRUECK_NICHT.meldungen
      let text = liste[Math.floor(Math.random() * liste.length)]
      // Nicht zweimal hintereinander dieselbe Zeile — das wirkt wie ein Bug.
      if (liste.length > 1 && fertig(text) === vorher) {
        text = liste[(liste.indexOf(text) + 1) % liste.length]
      }
      return fertig(text)
    })

    setPuls(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPuls(false), 640)
  }, [])

  return (
    <div className="ent-egg">
      <span className="kicker kicker--gold">Nicht anfassen</span>
      <h2 className="ent-h2 ent-egg__h2">{DRUECK_NICHT.label}</h2>
      <p className="ent-egg__sub">{DRUECK_NICHT.sub}</p>

      <button type="button" className={`ent-knopf${puls ? ' is-puls' : ''}`} onClick={druecken}>
        <span className="ent-knopf__halo" aria-hidden="true" />
        <span className="ent-knopf__cap">Drück nicht</span>
      </button>

      {/* Hoeflich statt aufdringlich: die Meldung wird angesagt, der Zaehler
          steht daneben als stiller Text. */}
      <p className="ent-egg__out" aria-live="polite">
        {meldung || DRUECK_NICHT.ruhe}
      </p>
      <p className="ent-egg__count">{zaehler > 0 ? DRUECK_NICHT.zaehler(zaehler) : ' '}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Standort — abstrakte Kartenflaeche
 * ------------------------------------------------------------------ */

/**
 * Bewusst KEIN Karten-API und kein erfundenes Gebaeudefoto: im Repo existiert
 * kein Bild der Hertzstrasse 4. Stattdessen eine rein dekorative, abstrakte
 * Stadtflaeche aus SVG — sie behauptet keine Geografie. Die einzige Aussage
 * macht die Adresse darunter, und die ist belegt (company.js).
 */
function Kartenflaeche() {
  return (
    <div className="ent-karte">
      <svg
        viewBox="0 0 400 320"
        className="ent-karte__svg"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="entKarteGrund" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d1a16" />
            <stop offset="100%" stopColor="#0a0908" />
          </linearGradient>
        </defs>
        <rect width="400" height="320" fill="url(#entKarteGrund)" />
        <g className="ent-karte__block">
          <rect x="18" y="26" width="86" height="58" rx="6" />
          <rect x="122" y="14" width="112" height="70" rx="6" />
          <rect x="262" y="30" width="118" height="54" rx="6" />
          <rect x="18" y="112" width="112" height="76" rx="6" />
          <rect x="156" y="112" width="84" height="76" rx="6" />
          <rect x="300" y="112" width="80" height="76" rx="6" />
          <rect x="18" y="216" width="96" height="82" rx="6" />
          <rect x="136" y="216" width="126" height="82" rx="6" />
          <rect x="290" y="216" width="90" height="82" rx="6" />
        </g>
        <g className="ent-karte__strasse">
          <path d="M0 100 H400" />
          <path d="M0 202 H400" />
          <path d="M146 0 V320" />
          <path d="M278 0 V320" />
        </g>
        <path className="ent-karte__route" d="M40 300 L40 202 L146 202 L146 152 L252 152" />
        <circle className="ent-karte__start" cx="40" cy="300" r="4.5" />
      </svg>
      <span className="ent-karte__pin" aria-hidden="true">
        <span className="ent-karte__puls" />
        <MapPin size={19} strokeWidth={2} />
      </span>
      <p className="ent-karte__label">{STUDIO_ADRESSE}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Seite
 * ------------------------------------------------------------------ */

export default function Entdecken() {
  const { video, texturen } = ENTDECKEN_CONFIG
  const socials = ENTDECKEN_SOCIALS.filter((s) => s.url)
  const lenis = useLenis()

  // Sprung in die Baustelle, ohne die Adresszeile anzufassen: angehaengte
  // UTM-Parameter bleiben dadurch unveraendert stehen (ein Router-Link mit
  // #anker wuerde den Query-String verlieren). Ohne JS bleibt der Anker als
  // normaler #-Link funktionsfaehig.
  const zurBaustelle = useCallback(
    (e) => {
      const el = typeof document !== 'undefined' ? document.getElementById('fortschritt') : null
      if (!el) return
      e.preventDefault()
      if (lenis) lenis.scrollTo(el, { offset: -80 })
      else el.scrollIntoView({ behavior: 'smooth' })
    },
    [lenis]
  )

  return (
    <div className="ent">
      {/* ---------- Hero + Countdown + Video ---------- */}
      <section className="ent-hero">
        <span className="ent-hero__glow" aria-hidden="true" />
        <div className="container ent-hero__inner">
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
            {/* Ohne Datum: es steht knapp darunter gross unter den Ziffern.
                Zweimal derselbe Termin auf einer halben Bildschirmhoehe
                schwaecht beide Stellen. */}
            <p className="ent-hero__note">Wir nehmen dich von Anfang an mit. Staub inklusive.</p>
            <div className="ent-hero__btns">
              <CTAButton href="#fortschritt" onClick={zurBaustelle} size="md">
                Baustelle betreten
              </CTAButton>
              <CTAButton to="/beratung" variant="dark" size="md">
                Küche planen
              </CTAButton>
            </div>
          </div>

          {/* Countdown direkt unter dem Hero-Text — nicht als eigener,
              spaeter Abschnitt. Auf 390px liegt er damit im ersten Screen,
              ab 900px in der linken Spalte neben dem Video (Raster in
              styles.css). Bewusst ohne Reveal: der Block ist sofort sichtbar
              und darf nicht erst eingeblendet werden. */}
          <div className="ent-hero__count" id="eroeffnung">
            <Countdown />
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
          </div>
        </div>
      </section>

      {/* ---------- Baufortschritt ---------- */}
      <section className="ent-sec ent-sec--prog" id="fortschritt">
        <div className="container">
          <Reveal className="ent-head ent-head--breit">
            <div className="ent-head__main">
              <span className="kicker">Wie weit sind wir?</span>
              <h2 className="ent-h2">
                Du kommst gerade
                <br />
                <span className="grad">mitten rein.</span>
              </h2>
            </div>
            <p className="ent-lead">
              Sechs Baustellen, ein Termin. Wir schreiben lieber ehrlich hin, dass etwas im Aufbau
              ist, als eine hübsche Prozentzahl zu erfinden.
            </p>
          </Reveal>

          <div className="ent-proggrid">
            {ENTDECKEN_FORTSCHRITT.map((b, i) => (
              <FortschrittKarte key={b.key} bereich={b} delay={Math.min(i, 5) * 0.05} />
            ))}
          </div>

          <Reveal className="ent-proghint">
            <span className="ent-proghint__dot" aria-hidden="true" />
            {FORTSCHRITT_HINWEIS}
          </Reveal>
        </div>
      </section>

      {/* ---------- Dunkles Band: Marke, Socials, Easter Egg ----------
          Ein durchgehender Kontrastbereich statt drei einzelner dunkler
          Abschnitte: eine Flaeche, eine Textur, ein Rhythmus. */}
      <div className="ent-nacht">
        <LazyBg className="ent-nacht__tex" image={texturen.nacht} aria-hidden="true" />
        <span className="ent-nacht__schleier" aria-hidden="true" />

        {/* Marke */}
        <section className="ent-band">
          <div className="container">
            <Reveal className="ent-brand">
              <span className="kicker kicker--gold">Was VIDEKO ist</span>
              <h2 className="ent-h2">
                Nicht nur ein <span className="grad">Küchenstudio.</span>
              </h2>
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

        {/* Socials */}
        <section className="ent-band" id="socials">
          <div className="container">
            <Reveal className="ent-head ent-head--breit">
              <div className="ent-head__main">
                <span className="kicker kicker--gold">Socials</span>
                <h2 className="ent-h2">
                  Folge dem
                  <br />
                  <span className="grad">Wahnsinn.</span>
                </h2>
              </div>
              <p className="ent-lead">
                Behind the Scenes, Baufortschritt und echte Einblicke. Ungefiltert.
              </p>
            </Reveal>

            <div className="ent-socialgrid">
              {socials.map((s, i) => {
                const Icon = SOCIAL_ICONS[s.key]
                return (
                  <Reveal
                    key={s.key}
                    as="a"
                    delay={Math.min(i, 4) * 0.06}
                    className={`ent-social ent-social--${s.key}${i === 0 ? ' ent-social--lead' : ''}`}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`VIDEKO auf ${s.label} — öffnet in neuem Tab`}
                  >
                    <span className="ent-social__ghost" aria-hidden="true">
                      {Icon ? <Icon size={170} /> : null}
                    </span>
                    <span className="ent-social__icon" aria-hidden="true">
                      {Icon ? <Icon size={24} /> : null}
                    </span>
                    <span className="ent-social__body">
                      <span className="ent-social__name">{s.label}</span>
                      <span className="ent-social__note">{s.note}</span>
                    </span>
                    <span className="ent-social__cta">
                      Ansehen
                      <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
                    </span>
                  </Reveal>
                )
              })}

              {/* Spotify: nur mit belegter Profil-URL verlinkt. Solange keine
                  existiert, bleibt die Kachel sichtbar, aber deaktiviert —
                  statt eine URL zu erfinden (Begruendung in site.js). */}
              {ENTDECKEN_SPOTIFY ? (
                <Reveal
                  as="a"
                  delay={0.3}
                  className="ent-social ent-social--spotify"
                  href={ENTDECKEN_SPOTIFY}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="VIDEKO auf Spotify — öffnet in neuem Tab"
                >
                  <span className="ent-social__ghost" aria-hidden="true">
                    <SpotifyIcon size={170} />
                  </span>
                  <span className="ent-social__icon" aria-hidden="true">
                    <SpotifyIcon size={24} />
                  </span>
                  <span className="ent-social__body">
                    <span className="ent-social__name">{ENTDECKEN_SPOTIFY_KACHEL.label}</span>
                    <span className="ent-social__note">{ENTDECKEN_SPOTIFY_KACHEL.note}</span>
                  </span>
                  <span className="ent-social__cta">
                    Anhören
                    <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
                  </span>
                </Reveal>
              ) : (
                <Reveal delay={0.3} className="ent-social ent-social--spotify is-aus">
                  <span className="ent-social__ghost" aria-hidden="true">
                    <SpotifyIcon size={170} />
                  </span>
                  <span className="ent-social__icon" aria-hidden="true">
                    <SpotifyIcon size={24} />
                  </span>
                  <span className="ent-social__body">
                    <span className="ent-social__name">{ENTDECKEN_SPOTIFY_KACHEL.label}</span>
                    <span className="ent-social__note">{ENTDECKEN_SPOTIFY_KACHEL.note}</span>
                  </span>
                  <span className="ent-social__badge">{ENTDECKEN_SPOTIFY_KACHEL.badge}</span>
                </Reveal>
              )}
            </div>
          </div>
        </section>

        {/* Easter Egg */}
        <section className="ent-band ent-band--egg">
          <div className="container">
            <Reveal className="ent-eggwrap">
              <DrueckNicht />
            </Reveal>
          </div>
        </section>
      </div>

      {/* ---------- Standort ---------- */}
      <section className="ent-sec ent-sec--ort" id="komm-vorbei">
        <div className="container">
          <div className="ent-ort">
            <Reveal className="ent-ort__copy">
              <span className="kicker">Standort</span>
              <h2 className="ent-h2 ent-ort__h2">
                Schön hier.
                <br />
                Aber warst du schon mal in der <span className="grad">Hertzstraße 4</span>?
              </h2>
              <address className="ent-ort__adr">
                {BRAND.studio.street}
                <br />
                {BRAND.studio.postalCode} {BRAND.studio.city}
              </address>
              <p className="ent-ort__note">Noch Baustelle. Die Adresse stimmt aber schon.</p>
              <div className="ent-ort__btns">
                <CTAButton href={STUDIO_MAPS_URL} target="_blank" rel="noopener noreferrer">
                  <span className="ent-ort__btnlabel">
                    <MapPin size={17} strokeWidth={1.9} aria-hidden="true" /> Route starten
                  </span>
                </CTAButton>
                <Link className="ent-link" to="/studio">
                  Was im Studio entsteht
                </Link>
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
        <div className="container">
          <Reveal className="ent-final__inner">
            <span className="kicker kicker--gold">Schon jetzt</span>
            <h2 className="ent-h2">
              Du willst nicht nur
              <br />
              <span className="grad">zuschauen?</span>
            </h2>
            <p className="ent-lead">Dann lass uns über deine Küche sprechen.</p>
            <div className="ent-final__btns">
              <CTAButton to="/beratung">Beratung starten</CTAButton>
              <Link className="ent-link" to="/leistungen">
                Was wir machen
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
