import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChefHat,
  Droplets,
  Layers,
  Lightbulb,
  Megaphone,
  PanelTop,
  ShieldCheck,
  Sun,
  Zap,
} from 'lucide-react'
import Reveal from './Reveal.jsx'
import haus from '../assets/images/entdecken/gewerke-haus.webp'

/* Die neun VIDEKO-Gewerke — eine einzige Liste, aus der Label, Verbindungs-
 * linie, Hotspot und Detailkarte gleichermassen entstehen. Es gibt bewusst
 * keine zweite Aufzaehlung irgendwo im Markup.
 *
 * hotspot.x / hotspot.y sind Prozentwerte auf dem Hausbild selbst, nicht auf
 * der Section — das Bild skaliert ueber alle Breakpoints proportional, damit
 * bleiben die Punkte an ihrem Motivdetail. Die Werte sind am fertig
 * zugeschnittenen Asset abgelesen und nicht geschaetzt: PV liegt mitten im
 * Paneelfeld, Wasser & Heizung auf dem Speicher mit den rot-blauen Leitungen,
 * Elektro auf dem Wandpanel im Technikgeschoss.
 *
 * seite steuert nur das Desktoplayout: vier Gewerke links, vier rechts, das
 * neunte unter dem Haus.
 */
const GEWERKE = [
  {
    id: 'pv',
    label: 'Photovoltaik',
    kurz: 'Nachhaltige Energie für Generationen.',
    icon: Sun,
    hotspot: { x: 67, y: 13 },
    seite: 'rechts',
    route: null,
  },
  {
    id: 'immobilien',
    label: 'Immobilien & Versicherungen',
    kurz: 'Sicher in die Zukunft.',
    icon: ShieldCheck,
    hotspot: { x: 76, y: 37 },
    seite: 'rechts',
    route: null,
  },
  {
    id: 'licht',
    label: 'Licht & Sound',
    kurz: 'Atmosphäre in Perfektion.',
    icon: Lightbulb,
    hotspot: { x: 68, y: 59 },
    seite: 'rechts',
    route: null,
  },
  {
    id: 'elektro',
    label: 'Elektro & Smart Home',
    kurz: 'Intelligent. Komfortabel. Zukunftsfähig.',
    icon: Zap,
    hotspot: { x: 68, y: 78 },
    seite: 'rechts',
    route: null,
  },
  {
    id: 'spanndecken',
    label: 'Spanndecken',
    kurz: 'Modern. Stilvoll. Individuell.',
    icon: PanelTop,
    hotspot: { x: 46, y: 31 },
    seite: 'links',
    route: null,
  },
  {
    id: 'kuechen',
    label: 'Küchen & Bäder',
    kurz: 'Design trifft Funktion.',
    icon: ChefHat,
    hotspot: { x: 36, y: 59 },
    seite: 'links',
    /* Einziger Link in dieser Section. /leistungen statt /kuechen-nach-mass:
       das Gewerk umfasst Kueche UND Bad, die Uebersichtsseite fuehrt das
       gesamte Leistungsspektrum, die Massanfertigungsseite nur einen Teil
       davon. Fuer die anderen acht Gewerke gibt es keine bestehende Route —
       sie bekommen deshalb keinen Link. */
    route: '/leistungen',
  },
  {
    id: 'boden',
    label: 'Boden & Innenausbau',
    kurz: 'Räume zum Wohlfühlen.',
    icon: Layers,
    hotspot: { x: 48, y: 64 },
    seite: 'links',
    route: null,
  },
  {
    id: 'wasser',
    label: 'Wasser & Heizung',
    kurz: 'Effizient. Zuverlässig. Zukunftssicher.',
    icon: Droplets,
    hotspot: { x: 48, y: 82 },
    seite: 'links',
    route: null,
  },
  {
    id: 'marketing',
    label: 'Marketing & Werbetechnik',
    kurz: 'Starke Marken. Sichtbarer Erfolg.',
    icon: Megaphone,
    /* Bewusst am beleuchteten Aussenrand: das Gewerk sitzt nicht in einem
       Zimmer, es ist die Aussenwirkung des Hauses. */
    hotspot: { x: 76, y: 87 },
    seite: 'unten',
    route: null,
  },
]

const LINKS = GEWERKE.filter((g) => g.seite === 'links')
const RECHTS = GEWERKE.filter((g) => g.seite === 'rechts')
const UNTEN = GEWERKE.filter((g) => g.seite === 'unten')

/* Ab dieser Breite steht das Haus mittig zwischen zwei Labelspalten und die
   Verbindungslinien werden gezeichnet. Darunter liegt das Haus oben und die
   Gewerke darunter im Raster — dort braucht es keine Linien. */
const DESKTOP = '(min-width: 1200px)'

/* Kurzer Ansatz direkt am Label, damit die Linie sauber aus der Schrift
   herauslaeuft, statt schraeg an ihr zu kleben. */
const ANSATZ = 20

function pfadFuer(l) {
  if (l.seite === 'unten') {
    return `M ${l.x1} ${l.y1} V ${l.y1 - ANSATZ} L ${l.x2} ${l.y2}`
  }
  const stummel = l.seite === 'links' ? l.x1 + ANSATZ : l.x1 - ANSATZ
  return `M ${l.x1} ${l.y1} H ${stummel} L ${l.x2} ${l.y2}`
}

export default function EntdeckenGewerkeHaus() {
  const [aktiv, setAktiv] = useState(null)
  const [schwebt, setSchwebt] = useState(null)
  const [istDesktop, setIstDesktop] = useState(false)
  const [linien, setLinien] = useState([])
  const [mass, setMass] = useState({ breite: 0, hoehe: 0 })

  const buehneRef = useRef(null)
  const hausRef = useRef(null)
  const labelRefs = useRef({})

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const an = () => setIstDesktop(mq.matches)
    an()
    mq.addEventListener('change', an)
    return () => mq.removeEventListener('change', an)
  }, [])

  /* Die Linien laufen vom Label zum Punkt am Haus. Beide Enden haengen an der
     tatsaechlichen Textlaenge und an der Bildhoehe, deshalb werden sie
     gemessen statt gerechnet — und bei jeder Groessenaenderung neu. */
  const messen = useCallback(() => {
    const buehne = buehneRef.current
    const bild = hausRef.current
    if (!buehne || !bild || !window.matchMedia(DESKTOP).matches) {
      setLinien([])
      return
    }
    const b = buehne.getBoundingClientRect()
    const h = bild.getBoundingClientRect()
    if (!b.width || !h.width) return
    const neu = []
    for (const g of GEWERKE) {
      const el = labelRefs.current[g.id]
      if (!el) continue
      const r = el.getBoundingClientRect()
      const x2 = h.left - b.left + (h.width * g.hotspot.x) / 100
      const y2 = h.top - b.top + (h.height * g.hotspot.y) / 100
      let x1
      let y1
      if (g.seite === 'unten') {
        x1 = r.left + r.width / 2 - b.left
        y1 = r.top - b.top
      } else {
        x1 = (g.seite === 'links' ? r.right : r.left) - b.left
        y1 = r.top + r.height / 2 - b.top
      }
      neu.push({ id: g.id, seite: g.seite, x1, y1, x2, y2 })
    }
    setMass({ breite: b.width, hoehe: b.height })
    setLinien(neu)
  }, [])

  useLayoutEffect(() => {
    messen()
    const buehne = buehneRef.current
    if (!buehne || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(messen)
    ro.observe(buehne)
    return () => ro.disconnect()
  }, [messen, istDesktop])

  const umschalten = (id) => setAktiv((v) => (v === id ? null : id))

  const hervor = schwebt || aktiv
  const aktivesGewerk = GEWERKE.find((g) => g.id === aktiv) || null

  /* Die Detailkarte existiert genau einmal. Auf dem Desktop haengt sie am
     Haus, darunter klappt sie unter dem angetippten Gewerk auf. */
  const karte = aktivesGewerk ? (
    <div
      className="ent-gewerke__karte"
      data-oben={aktivesGewerk.hotspot.y < 52 ? 'ja' : 'nein'}
      data-rechts={aktivesGewerk.hotspot.x < 52 ? 'ja' : 'nein'}
    >
      <span className="ent-gewerke__karte-name">{aktivesGewerk.label}</span>
      <span className="ent-gewerke__karte-kurz">{aktivesGewerk.kurz}</span>
      {aktivesGewerk.route && (
        <Link className="ent-gewerke__karte-link" to={aktivesGewerk.route}>
          Mehr erfahren <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  ) : null

  const labelFuer = (g) => {
    const Icon = g.icon
    const ist = aktiv === g.id
    return (
      <li className="ent-gewerke__eintrag" key={g.id}>
        <button
          type="button"
          ref={(el) => {
            labelRefs.current[g.id] = el
          }}
          className={`ent-gewerke__label ${ist ? 'is-aktiv' : ''}`}
          aria-pressed={ist}
          aria-expanded={istDesktop ? undefined : ist}
          onClick={() => umschalten(g.id)}
          onMouseEnter={() => setSchwebt(g.id)}
          onMouseLeave={() => setSchwebt((v) => (v === g.id ? null : v))}
          onFocus={() => setSchwebt(g.id)}
          onBlur={() => setSchwebt((v) => (v === g.id ? null : v))}
        >
          <span className="ent-gewerke__icon" aria-hidden="true">
            <Icon size={17} strokeWidth={1.7} />
          </span>
          <span className="ent-gewerke__text">
            <span className="ent-gewerke__name">{g.label}</span>
            <span className="ent-gewerke__kurz">{g.kurz}</span>
          </span>
          <span className="ent-gewerke__marke" aria-hidden="true" />
        </button>
        {!istDesktop && ist ? karte : null}
      </li>
    )
  }

  return (
    <div className={`ent-gewerke ${aktiv ? 'hat-aktiv' : ''}`}>
      <Reveal className="ent-gewerke__kopf">
        <span className="kicker kicker--gold">Was VIDEKO ist</span>
        <h2 className="ent-h2">
          Nicht nur ein <span className="grad">Küchenstudio.</span>
        </h2>
        <p className="ent-gewerke__lead">
          Von der Küche bis zur Energie, vom Innenausbau bis zur Immobilie – wir denken das ganze
          Haus.
        </p>
        <p className="ent-gewerke__hinweis">Klick dich durchs Haus.</p>
      </Reveal>

      <div className="ent-gewerke__buehne" ref={buehneRef}>
        {istDesktop && linien.length > 0 && mass.breite > 0 && (
          <svg
            className="ent-gewerke__linien"
            viewBox={`0 0 ${mass.breite} ${mass.hoehe}`}
            aria-hidden="true"
            focusable="false"
          >
            {linien.map((l) => {
              const d = pfadFuer(l)
              const zustand = aktiv === l.id ? 'aktiv' : hervor === l.id ? 'hover' : 'ruhe'
              return (
                <g key={l.id} data-zustand={zustand}>
                  <path className="ent-gewerke__linie" d={d} />
                  {aktiv === l.id && (
                    <path key={`puls-${l.id}`} className="ent-gewerke__puls" d={d} pathLength="1" />
                  )}
                </g>
              )
            })}
          </svg>
        )}

        <ul className="ent-gewerke__spalte ent-gewerke__spalte--links">{LINKS.map(labelFuer)}</ul>

        <div className={`ent-gewerke__haus ${aktiv === 'immobilien' ? 'ist-huelle' : ''}`}>
          <img
            ref={hausRef}
            className="ent-gewerke__bild"
            src={haus}
            width="1381"
            height="1001"
            loading="lazy"
            decoding="async"
            onLoad={messen}
            alt="Schnitt durch ein modernes Wohnhaus: Photovoltaik auf dem Dach, Küche, Wohnbereich, Innenausbau, Technikgeschoss mit Heizung und Wasserspeicher, Smart-Home-Panel und Garage."
          />
          {GEWERKE.map((g) => {
            const ist = aktiv === g.id
            return (
              <button
                key={g.id}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className={`ent-gewerke__punkt ${ist ? 'is-aktiv' : ''} ${
                  hervor === g.id ? 'is-hover' : ''
                }`}
                style={{ left: `${g.hotspot.x}%`, top: `${g.hotspot.y}%` }}
                onClick={() => umschalten(g.id)}
                onMouseEnter={() => setSchwebt(g.id)}
                onMouseLeave={() => setSchwebt((v) => (v === g.id ? null : v))}
              >
                <span className="ent-gewerke__punkt-schein" />
                <span className="ent-gewerke__punkt-kern" />
              </button>
            )
          })}
          {istDesktop ? karte : null}
        </div>

        <ul className="ent-gewerke__spalte ent-gewerke__spalte--rechts">{RECHTS.map(labelFuer)}</ul>

        <ul className="ent-gewerke__spalte ent-gewerke__spalte--unten">{UNTEN.map(labelFuer)}</ul>
      </div>
    </div>
  )
}
