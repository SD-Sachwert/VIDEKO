/* ==================================================================== *
 * Spektakel — fliegende Objekte und Goldfeuerwerk fuer „Drueck nicht."
 *
 * Diese Datei zeichnet ausschliesslich die neue Easter-Egg-Ebene. Die
 * bestehenden Kurzeffekte (Knopfdruck, Halo, Beben, Blitz, Countdown,
 * Video-Glut, Goldlinie, Hopser) liegen unveraendert in Entdecken.jsx und
 * werden hier nicht angefasst.
 *
 * Keine Library, keine externen Bilder, kein Sound, kein Netzaufruf: alle
 * Objekte sind Inline-SVG, das Feuerwerk sind wenige DOM-Knoten mit einer
 * einzigen CSS-Animation. Die Steuerung dazu steht in lib/spektakel.js.
 * ==================================================================== */

/* ------------------------------------------------------------------ *
 * Die Objekte — bewusst reduzierte Strichzeichnungen in Creme/Gold,
 * kein Comic. Alle im selben Koordinatenraum, damit die Flugbahnen
 * fuer jedes Objekt gleich funktionieren.
 * ------------------------------------------------------------------ */

const KONTUR = '#1a1714'
const KORPUS = '#f6f1e6'
const GOLD = '#c9a050'
const GOLD_HELL = '#e8c978'
const BRONZE = '#8b6b38'

const svgProps = {
  viewBox: '0 0 120 120',
  fill: 'none',
  stroke: KONTUR,
  strokeWidth: 2.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  focusable: 'false',
}

/* Spuelmaschine: Blende oben, Griffleiste, Sichtfenster mit Teller und
   zwei Tropfen. Genau die Details, die das Geraet erkennbar machen. */
const SvgSpuelmaschine = (
  <svg {...svgProps}>
    <rect x="30" y="13" width="60" height="92" rx="7" fill={KORPUS} />
    <path d="M30 39 H90" />
    <rect x="38" y="22" width="34" height="6" rx="3" fill={GOLD} strokeWidth="1.6" />
    <circle cx="81" cy="25" r="3.2" fill={BRONZE} strokeWidth="1.4" />
    <rect x="39" y="49" width="42" height="46" rx="5" fill="#fffdf7" strokeWidth="2.2" />
    <circle cx="60" cy="72" r="12.5" stroke={GOLD} strokeWidth="2.6" />
    <circle cx="60" cy="72" r="5" stroke={GOLD} strokeWidth="1.8" opacity="0.75" />
    <circle cx="47" cy="57" r="2.4" fill={GOLD_HELL} stroke="none" />
    <circle cx="73" cy="88" r="2.8" fill={GOLD_HELL} stroke="none" />
    <path d="M38 105 v6 M82 105 v6" strokeWidth="3.6" />
  </svg>
)

/* Luxusklo: goldenes WC mit Kroenchen. Das Kroenchen ist der ganze Gag —
   ohne es waere es nur eine Toilette. */
const SvgLuxusklo = (
  <svg {...svgProps}>
    <path d="M29 20 l3.5 -9 l4.5 4.5 l4.5 -7 l4.5 7 l4.5 -4.5 l3.5 9 z" fill={GOLD_HELL} strokeWidth="1.9" />
    <rect x="24" y="22" width="29" height="10" rx="4" fill={GOLD_HELL} />
    <rect x="27" y="31" width="23" height="30" rx="3" fill={GOLD} />
    <path d="M49 45 h33 a8 8 0 0 1 7 9 q-2 15 -15 20 l-3 13 h-15 l-3 -13 q-8 -8 -8 -20 z" fill={GOLD} />
    <ellipse cx="69" cy="45.5" rx="21" ry="6.5" fill={GOLD_HELL} />
    <path d="M56 91 h27" strokeWidth="3.4" />
    <path d="M33 39 h11" stroke={BRONZE} strokeWidth="2.2" opacity="0.7" />
  </svg>
)

/* Akkuschrauber: Korpus, Futter, Bit, Griff, Akkupack. */
const SvgAkkuschrauber = (
  <svg {...svgProps}>
    <rect x="24" y="40" width="50" height="26" rx="11" fill={KORPUS} />
    <rect x="73" y="45" width="14" height="16" rx="3" fill={GOLD} />
    <path d="M87 53 h16" strokeWidth="4.4" />
    <path d="M40 65 l-7 27 h20 l4 -27 z" fill={KORPUS} />
    <rect x="26" y="88" width="27" height="13" rx="4" fill={GOLD} />
    <path d="M44 68 h8" stroke={BRONZE} strokeWidth="4" />
    <path d="M34 48 h9 M34 55 h9" stroke={BRONZE} strokeWidth="2" opacity="0.65" />
    <circle cx="64" cy="53" r="4" stroke={BRONZE} strokeWidth="2" />
  </svg>
)

/* Billardkugel: schwarze Acht mit Goldrand. Die Acht ist gezeichnet,
   nicht gesetzt — so haengt nichts an einer Schriftart. */
const SvgBillard = (
  <svg {...svgProps}>
    <circle cx="60" cy="60" r="31" fill={KONTUR} stroke={GOLD} strokeWidth="2.8" />
    <ellipse cx="47" cy="45" rx="9" ry="5.5" fill={GOLD_HELL} stroke="none" opacity="0.4" transform="rotate(-32 47 45)" />
    <circle cx="60" cy="60" r="14.5" fill={KORPUS} stroke="none" />
    <circle cx="60" cy="54.5" r="4.7" stroke={KONTUR} strokeWidth="2.7" />
    <circle cx="60" cy="65.4" r="5.9" stroke={KONTUR} strokeWidth="2.7" />
  </svg>
)

/* Kaffeemaschine mit Tasse und zwei Dampffahnen. */
const SvgKaffee = (
  <svg {...svgProps}>
    <path d="M50 14 q5 -6 0 -12 M62 14 q5 -6 0 -12" stroke={GOLD} strokeWidth="2.6" opacity="0.8" />
    <rect x="26" y="18" width="52" height="31" rx="6" fill={KORPUS} />
    <rect x="26" y="49" width="13" height="29" fill={KORPUS} />
    <rect x="24" y="78" width="56" height="13" rx="4" fill={KORPUS} />
    <rect x="51" y="49" width="9" height="11" rx="2" fill={GOLD} />
    <path d="M47 62 h20 v9 a7 7 0 0 1 -7 7 h-6 a7 7 0 0 1 -7 -7 z" fill="#fffdf7" />
    <path d="M67 65 a6 6 0 0 1 0 11" />
    <circle cx="66" cy="29" r="3.6" fill={GOLD} strokeWidth="1.5" />
    <circle cx="66" cy="40" r="3.6" fill={BRONZE} strokeWidth="1.5" />
    <path d="M34 27 h20" stroke={BRONZE} strokeWidth="2.2" opacity="0.65" />
  </svg>
)

/* Kuechenmodul: Arbeitsplatte, zwei Unterschraenke, ein Hochschrank.
   Rein dekorativ — der echte Baustellenindex bleibt davon unberuehrt. */
const SvgKueche = (
  <svg {...svgProps}>
    <rect x="10" y="42" width="76" height="8" rx="2.5" fill={GOLD} />
    <rect x="14" y="50" width="68" height="42" rx="3" fill={KORPUS} />
    <path d="M48 50 v42" strokeWidth="2.2" />
    <rect x="24" y="58" width="15" height="4" rx="2" fill={GOLD} strokeWidth="1.4" />
    <rect x="57" y="58" width="15" height="4" rx="2" fill={GOLD} strokeWidth="1.4" />
    <rect x="88" y="16" width="24" height="76" rx="3" fill={KORPUS} />
    <rect x="92" y="48" width="4" height="15" rx="2" fill={GOLD} strokeWidth="1.4" />
    <path d="M18 92 v6 M78 92 v6 M92 92 v6 M108 92 v6" strokeWidth="3.2" />
    <circle cx="30" cy="37" r="4" stroke={BRONZE} strokeWidth="2" />
    <circle cx="42" cy="37" r="4" stroke={BRONZE} strokeWidth="2" />
  </svg>
)

/* Pendelleuchte mit Lichtkegel. */
const SvgLampe = (
  <svg {...svgProps}>
    <path d="M60 6 v22" strokeWidth="2.4" />
    <path d="M60 28 l27 35 h-54 z" fill={KORPUS} />
    <ellipse cx="60" cy="63" rx="27" ry="6" fill={GOLD_HELL} />
    <path d="M42 72 l-9 22 M60 73 v23 M78 72 l9 22" stroke={GOLD} strokeWidth="2.6" opacity="0.6" />
  </svg>
)

/* Werkzeugkiste mit Buegelgriff und zwei Verschluessen. */
const SvgWerkzeugkiste = (
  <svg {...svgProps}>
    <path d="M47 45 q13 -17 26 0" strokeWidth="3.2" />
    <rect x="20" y="47" width="80" height="44" rx="5" fill={KORPUS} />
    <path d="M20 62 H100" strokeWidth="2.2" />
    <rect x="42" y="41" width="36" height="8" rx="4" fill={GOLD} strokeWidth="1.8" />
    <rect x="33" y="57" width="11" height="10" rx="2" fill={GOLD} strokeWidth="1.8" />
    <rect x="76" y="57" width="11" height="10" rx="2" fill={GOLD} strokeWidth="1.8" />
    <path d="M28 91 v6 M92 91 v6" strokeWidth="3.4" />
  </svg>
)

const OBJEKT_SVG = {
  dishwasher: SvgSpuelmaschine,
  toilet: SvgLuxusklo,
  drill: SvgAkkuschrauber,
  billiard: SvgBillard,
  coffee: SvgKaffee,
  kitchen: SvgKueche,
  lamp: SvgLampe,
  toolbox: SvgWerkzeugkiste,
}

/* ------------------------------------------------------------------ *
 * Der Layer
 * ------------------------------------------------------------------ */

/**
 * Eigene Ebene im Hero: absolut, geclippt, ohne Maustreffer. Sie kann das
 * Layout nicht verschieben und erzeugt keine Scrollbreite — das Objekt
 * fliegt innerhalb dieses Kastens und wird an seinen Raendern beschnitten.
 *
 * Ohne laufendes Event steht hier ein leerer Kasten. Genau das braucht der
 * Prerender: gleiches Markup auf Server und Client, kein Zufall im Render.
 */
export function SpektakelLayer({ objekt, feuer }) {
  return (
    <div className="ent-fly" aria-hidden="true">
      {objekt ? (
        <div key={objekt.nr} className={`ent-fly__obj ent-fly__obj--${objekt.bahn}`}>
          {OBJEKT_SVG[objekt.art]}
        </div>
      ) : null}

      {feuer
        ? feuer.bursts.map((b) => (
            <span
              key={`${feuer.nr}-${b.id}`}
              className={`ent-fw${b.gross ? ' ent-fw--gross' : ''}`}
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
            >
              <b className="ent-fw__kern" style={{ animationDelay: `${b.verzug}ms` }} />
              {b.teile.map((t, i) => (
                <i
                  key={i}
                  style={{
                    '--fx': `${t.x}px`,
                    '--fy': `${t.y}px`,
                    '--fgr': `${t.gr}px`,
                    '--fc1': t.c1,
                    '--fc2': t.c2,
                    animationDuration: `${t.dauer}ms`,
                    animationDelay: `${b.verzug}ms`,
                  }}
                />
              ))}
            </span>
          ))
        : null}
    </div>
  )
}
