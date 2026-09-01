import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'

import Reveal from '../components/Reveal.jsx'
import LazyVideo from '../components/LazyVideo.jsx'
import CTAButton from '../components/CTAButton.jsx'
import { BRAND } from '../data/company.js'
import {
  ENTDECKEN_CONFIG,
  ENTDECKEN_SOCIALS,
  ENTDECKEN_SPOTIFY,
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
 * AUFBAU
 * ------
 * Hero mit Video (beides oben, damit nach dem Scan sofort klar ist, worum es
 * geht) -> Countdown -> Socials -> Spotify -> Marke -> Standort -> Beratung.
 *
 * Alles Sichtbare kommt aus belegten Quellen: Adresse aus company.js,
 * Social-URLs aus site.js, Eroeffnung und Video aus entdecken.js. Wo eine
 * Angabe fehlt, faellt der Block weg oder zeigt seinen ehrlichen Zustand —
 * nichts wird geschaetzt.
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

  return (
    <div className="ent-count">
      <span className="kicker">Noch</span>
      <h2 className="ent-count__title">Bis wir aufmachen.</h2>
      <div className="ent-count__grid" aria-live="off">
        {einheiten.map((e) => (
          <div className="ent-count__unit" key={e.label}>
            <span className="ent-count__num">{e.wert}</span>
            <span className="ent-count__lab">{e.label}</span>
          </div>
        ))}
      </div>
      <p className="ent-count__foot">
        Eröffnung am <strong className="ent-count__date">{EROEFFNUNG_LABEL}</strong>
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Seite
 * ------------------------------------------------------------------ */

export default function Entdecken() {
  const { video } = ENTDECKEN_CONFIG
  const socials = ENTDECKEN_SOCIALS.filter((s) => s.url)
  const instagram = socials.find((s) => s.key === 'instagram')

  return (
    <div className="ent">
      {/* ---------- Hero + Video ---------- */}
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
              Noch nicht ganz fertig. Aber langweilig wird&rsquo;s hier definitiv nicht.
            </p>
            <p className="ent-hero__note">
              Wir bauen in Würzburg ein Küchenstudio – und nehmen dich von Anfang an mit.
              {EROEFFNUNG_LABEL && (
                <>
                  {' '}
                  Aufgemacht wird am <strong className="ent-hero__date">{EROEFFNUNG_LABEL}</strong>.
                </>
              )}
            </p>
            <div className="ent-hero__btns">
              {instagram && (
                <CTAButton
                  href={instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="md"
                >
                  Auf Instagram
                </CTAButton>
              )}
              <CTAButton to="/beratung" variant="dark" size="md">
                Küche planen
              </CTAButton>
            </div>
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

      {/* ---------- Countdown ---------- */}
      <section className="ent-sec ent-sec--band" id="eroeffnung">
        <div className="container">
          <Reveal>
            <Countdown />
          </Reveal>
        </div>
      </section>

      {/* ---------- Socials ---------- */}
      <section className="ent-sec" id="socials">
        <div className="container">
          <Reveal className="ent-head">
            <span className="kicker">Socials</span>
            <h2 className="ent-h2">
              Folge dem <span className="grad">Wahnsinn.</span>
            </h2>
            <p className="ent-lead">
              Überall dieselbe Baustelle – nur anders geschnitten. Such dir aus, wo du zuschaust.
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
                  <span className="ent-social__icon" aria-hidden="true">
                    {Icon ? <Icon size={22} strokeWidth={1.7} /> : null}
                  </span>
                  <span className="ent-social__body">
                    <span className="ent-social__name">{s.label}</span>
                    <span className="ent-social__note">{s.note}</span>
                  </span>
                  <ArrowUpRight className="ent-social__go" size={20} strokeWidth={1.7} aria-hidden="true" />
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- Spotify: nur mit belegter Profil-URL ---------- */}
      {ENTDECKEN_SPOTIFY && (
        <section className="ent-sec">
          <div className="container">
            <Reveal
              as="a"
              className="ent-spotify"
              href={ENTDECKEN_SPOTIFY}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="VIDEKO auf Spotify anhören — öffnet in neuem Tab"
            >
              <span className="ent-spotify__icon" aria-hidden="true">
                <SpotifyIcon size={30} />
              </span>
              <span className="ent-spotify__body">
                <span className="kicker">Musik</span>
                <span className="ent-spotify__title">VIDEKO klingt übrigens auch so.</span>
                <span className="ent-spotify__note">Eigene Musik. Auf Spotify anhören.</span>
              </span>
              <ArrowUpRight className="ent-social__go" size={22} strokeWidth={1.7} aria-hidden="true" />
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- Marke ---------- */}
      <section className="ent-sec ent-sec--dark">
        <div className="container">
          <Reveal className="ent-brand">
            <span className="kicker kicker--gold">Was VIDEKO ist</span>
            <h2 className="ent-h2">
              Nicht nur ein <span className="grad">Küchenstudio.</span>
            </h2>
            <p className="ent-brand__text">
              Wir bauen in Würzburg ein Küchenstudio. Gleichzeitig bauen wir eine Marke, einen Shop
              und ungefähr zehn Dinge, die noch keinen richtigen Namen haben.
            </p>
            <p className="ent-brand__text">
              Das meiste davon passiert öffentlich: Planung, Umbau, Fortschritt, Staub und
              gelegentlich Chaos. Wer will, schaut zu.
            </p>
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

      {/* ---------- Standort ---------- */}
      <section className="ent-sec" id="komm-vorbei">
        <div className="container">
          <Reveal className="ent-ort">
            <span className="kicker">Standort</span>
            <h2 className="ent-h2">
              Komm <span className="grad">vorbei.</span>
            </h2>
            <address className="ent-ort__adr">
              {BRAND.studio.street}
              <br />
              {BRAND.studio.postalCode} {BRAND.studio.city}
            </address>
            <p className="ent-ort__note">Noch Baustelle. Die Adresse stimmt aber schon.</p>
            <div className="ent-ort__btns">
              <CTAButton href={STUDIO_MAPS_URL} target="_blank" rel="noopener noreferrer" size="md">
                <span className="ent-ort__btnlabel">
                  <MapPin size={17} strokeWidth={1.9} aria-hidden="true" /> Route starten
                </span>
              </CTAButton>
              <Link className="ent-link" to="/studio">
                Was im Studio entsteht
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Beratung ---------- */}
      <section className="ent-sec ent-final">
        <div className="container">
          <Reveal className="ent-final__inner">
            <span className="kicker">Schon jetzt</span>
            <h2 className="ent-h2">
              Schon eine Küche <span className="grad">im Kopf?</span>
            </h2>
            <p className="ent-lead">
              Dann fang nicht bei Pinterest an. Erzähl uns, was du vorhast – den Rest sortieren wir
              gemeinsam.
            </p>
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
