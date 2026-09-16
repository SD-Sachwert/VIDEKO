import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  BREITE,
  DECKEL_MS,
  FALL_MS,
  FINALE_FAKTOR,
  FREI_FRUEH_MS,
  FROST_MS,
  HOEHE,
  MISCHEN_MS,
  SERIE_MS,
  SPANNUNG_MS,
  START_MS,
  TAUSCH_MS,
  aufloesungMs,
  benachbart,
  ersterZug,
  imFeld,
  istFinale,
  neuesSpiel,
  schrittDauerMs,
  serieWeiter,
  tauschen,
  tempoFaktor,
  vertauscht,
  zugPunkte,
  zugZeit,
} from './crush-logik.js'
import {
  HAPTIK,
  comboStufe,
  domRuetteln,
  domSchicht,
  klang,
  klangSchliessen,
  sanftHoeren,
  vibrieren,
} from './spielgefuehl.js'
import './spielgefuehl.css'
import './crush.css'

/**
 * KUECHEN-CRUSH — drei gleiche in einer Reihe.
 *
 * Die Regeln stehen in crush-logik.js und sind dort getestet. Ein Tausch
 * wird dort vollstaendig aufgeloest; hier wird das Ergebnis Schritt fuer
 * Schritt abgespielt: Tausch, Raeumen, Fallen, naechster Schritt.
 *
 * STEUERUNG
 * ---------
 * Von einem Stein zum Nachbarn wischen tauscht. Wer lieber tippt: erst den
 * einen Stein, dann den Nachbarn. Tastatur: Pfeile bewegen den Rahmen,
 * Enter waehlt und tauscht. Welche Zelle gemeint ist, rechnet sich aus der
 * Fingerposition im Gitter — nicht aus dem Element darunter, das gerade
 * noch unterwegs sein kann.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Jeder gueltige Tausch ist eine Runde. Waehrend eine Aufloesung laeuft,
 * ist die Eingabe gesperrt — genau aufloesungMs() lang, mindestens
 * SPERRE_MS (300), auch ohne Animation. So bleibt jeder Lauf ueber der
 * Grenze msJeRunde. Die Freigabe kommt kurz bevor der letzte Fall liegt.
 *
 * COMBO
 * -----
 * Multiplikator = Kaskadenfaktor × Tempostufe (siehe crush-logik.js). Er
 * steht als "KOMBO ×…" in der Leiste, als Plakette ueber dem Feld und als
 * data-combo an der Buehne. In den letzten 5 Sekunden zaehlt alles doppelt:
 * data-finale="1", roter-goldener Rahmen, pulsierende Uhr, "FINALE ×2".
 *
 * DIE UHR LAEUFT ZURUECK — UND WIEDER VOR
 * ---------------------------------------
 * Die Runde startet mit START_MS (45 s). Jeder Treffer gibt Zeit zurueck,
 * ein Vierer mehr als ein Dreier, eine Kaskade mehr als beides, ein
 * geraeumter Kuehlschrank FROST_MS am Stueck. Wer traege spielt, kommt
 * damit nicht gegen den Verbrauch an und bleibt bei rund einer Minute; wer
 * schnell und in Ketten spielt, haelt die Runde offen — bis zur harten
 * Decke DECKEL_MS. Die letzte Kaskade laeuft immer zu Ende: solange eine
 * Aufloesung laeuft, steht nachspielSetzen(true), und wenn dabei noch
 * Zeitbonus entsteht, geht die Runde ganz regulaer weiter. Ein Tabwechsel
 * haelt die Uhr nicht an; eine Pause gibt es deshalb nicht.
 *
 * GEMEINSAMES GAME FEEL
 * ---------------------
 * Ruetteln, Funken, schwebende Zahlen, Haptik und Klang kommen aus
 * spielgefuehl.js, damit alle fuenf Spiele dieselbe Sprache sprechen. Die
 * eigenen CSS-Effekte des Gitters (Strahlen, Explosionen, Einblendungen)
 * bleiben daneben bestehen — sie sind Crush-eigen und zeigen, welche Zelle
 * genau gezuendet hat.
 *
 * WIE ES FLUESSIG BLEIBT
 * ----------------------
 * Die Steine sind 56 kleine DOM-Elemente, nach Id sortiert, damit React sie
 * nie umhaengt. Ihre Lage ist ein transform; das Gleiten und Fallen macht
 * CSS. React rendert je Schritt einmal zum Markieren und einmal nach dem
 * Fallen — nie pro Frame. Strahlen, Explosionen und Einblendungen sind
 * eigene kurze Elemente mit CSS-Animation; sie blockieren die Eingabe nie.
 */

const SPIEL = SPIEL_NACH_KEY.kuechen_crush

/* Typischer Wert eines Tauschs, der einen Booster baut und ihn spaeter
   zuendet: 90 + 150 fuer den Bau, eine volle Reihe beim Zuenden. */
const HEBEL_PUNKTE = 450
const WISCH_ANTEIL = 0.35
const HINWEIS_MS = 5000
const MELDUNG_MS = 1100
const NEIN_MS = 320
const RAND = 10
/* Effekte leben laenger als der Schritt, der sie ausloest. */
const EFFEKT_LEBEN_MS = 480
const SANFT_EFFEKT_LEBEN_MS = 260
const BANNER_MS = 820
const SANFT_BANNER_MS = 700

/* Das echte Markenzeichen, nicht ein nachgemaltes V. Dieselbe Datei wie in
   VIDEKO Jump — ein Bild, das der Browser ohnehin schon geladen hat. */
const WILD_QUELLE = '/favicon-512.png'

/* Ab dieser Kaskadentiefe gilt ein Schritt auch ohne Sonderteil als gross.
   Mit KASKADE_FAKTOREN (6 Stufen) ist das der vorletzte Sprung — selten
   genug, dass die oberste Stufe etwas bleibt, das man sich verdient. */
const MEGA_KOMBO = 5

/* Trockene Sprueche fuer den grossen Moment. Reihum statt zufaellig: so
   kommt nie zweimal hintereinander derselbe Satz. */
const SPRUCH_MEGA = [
  'JETZT WIRD ES UNVERNÜNFTIG.',
  'DAS GEHT AUF REGIE.',
  'BAUSTELLE ESKALIERT.',
  'SO WAR DAS NICHT GEPLANT.',
  'WER HAT DAS AUFGEMESSEN?',
  'DAS WAR NICHT IM LEISTUNGSVERZEICHNIS.',
]

/* Wie lange die Uhr nach einem Kuehlschrank eingefroren aussieht. */
const FROST_ZEIGE_MS = FROST_MS

const LEER = {}
const KEINE = []

const jetzt = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** ×2,4 statt ×2.4 */
const malText = (m) => `×${String(m).replace('.', ',')}`

/** 2000 → "+2,0 SEK." */
const sekText = (ms) => `+${(Math.round(ms / 100) / 10).toFixed(1).replace('.', ',')} SEK.`

/**
 * Was ein Kaskadenschritt zu sehen gibt: Strahlen und Explosionen, Glanz an
 * neuen Sonderteilen, die Einblendung fuer 4er/5er und wie stark das Feld
 * schlaegt (0 nichts, 1 Booster, 2 Bombe gebaut/Kreuz, 3 Bombe gezuendet).
 */
const GLANZ = { bombe: 'glanz5', ofen: 'glanz5', frost: 'glanzFrost' }

function schrittBild(schritt) {
  const effekte = schritt.effekte.map((f) => ({ art: f.art, x: f.x, y: f.y, stark: !!f.stark }))
  for (const n of schritt.neuSpezial) {
    if (n.platz) effekte.push({ art: GLANZ[n.art] || 'glanz4', x: n.platz[0], y: n.platz[1] })
  }
  const arten = new Set(schritt.effekte.map((f) => f.art))
  const wuchtig = schritt.effekte.some((f) => f.stark)
  const neuBombe = schritt.neuSpezial.find((n) => n.art === 'bombe')
  const neuOfen = schritt.neuSpezial.find((n) => n.art === 'ofen')
  const neuBooster = schritt.neuSpezial.find((n) => n.art === 'reihe' || n.art === 'spalte')
  let banner = null
  let schlag = 0
  if (arten.has('mega')) {
    banner = { stufe: '5', gross: 'MEGA-KOMBO', klein: wuchtig ? 'DAS WAR NICHT NORMAL.' : 'BEIDE ZUENDEN' }
    schlag = 3
  } else if (arten.has('feld')) {
    banner = { stufe: '5', gross: 'DOPPEL-SYMBOL', klein: 'FELD LEER' }
    schlag = 3
  } else if (neuBombe) {
    banner = { stufe: '5', gross: `${neuBombe.form}ER`, klein: 'VIDEKO-SYMBOL' }
    schlag = 2
  } else if (neuOfen) {
    banner = { stufe: '5', gross: 'L-FORM', klein: 'BACKOFEN' }
    schlag = 2
  } else if (arten.has('bombe')) {
    banner = { stufe: '5', gross: 'SYMBOL', klein: 'ALLE DES TYPS' }
    schlag = 3
  } else if (arten.has('ofen')) {
    banner = { stufe: '5', gross: 'BACKOFEN', klein: wuchtig ? '5 × 5' : '3 × 3' }
    schlag = 2
  } else if (neuBooster) {
    banner = { stufe: '4', gross: '4ER', klein: neuBooster.art === 'reihe' ? 'BLASTER ↔' : 'BLASTER ↕' }
    schlag = 1
  } else if (arten.has('reihe') && arten.has('spalte')) {
    banner = { stufe: '4', gross: 'KREUZ', klein: 'REIHE + SPALTE' }
    schlag = 2
  } else if (arten.has('frost')) {
    banner = { stufe: '4', gross: 'KUEHLSCHRANK', klein: 'UHR EINGEFROREN' }
    schlag = 1
  }
  if (arten.has('bombe') || arten.has('feld') || arten.has('mega')) schlag = 3
  else if (!schlag && (arten.has('reihe') || arten.has('spalte') || arten.has('ofen'))) schlag = 1
  /* Die oberste Stufe ist absichtlich selten: zwei Sonderteile zuenden
     zusammen, das Feld raeumt sich leer, oder die Kette traegt ueber fuenf
     Schritte. Ein gewoehnlicher Dreier kommt hier nie an. */
  const mega = arten.has('mega') || arten.has('feld') || schritt.kombo >= MEGA_KOMBO
  if (mega) {
    schlag = 4
    /* Eine tiefe Kaskade ohne Sonderteil haette sonst keine Ansage. */
    if (!banner) banner = { stufe: '5', gross: 'MEGA-KOMBO', klein: 'DIE KETTE REISST NICHT AB' }
  }
  return {
    effekte,
    banner,
    schlag,
    mega,
    wuchtig,
    frost: schritt.frost || 0,
    booster: arten.has('reihe') || arten.has('spalte') || arten.has('ofen'),
  }
}

/**
 * Mitte der geraeumten Steine, als Zellkoordinate. Dort schweben Punkte,
 * Zeit und Combo auf. 56 Felder durchzaehlen ist billiger als die Liste
 * durch die halbe Logik mitzuschleifen.
 */
function schwerpunkt(schritt, rueck) {
  const weg = new Set(schritt.weg)
  let sx = 0
  let sy = 0
  let n = 0
  for (let y = 0; y < HOEHE; y += 1) {
    for (let x = 0; x < BREITE; x += 1) {
      const s = schritt.vorher[y][x]
      if (s && weg.has(s.id)) {
        sx += x
        sy += y
        n += 1
      }
    }
  }
  return n ? [sx / n, sy / n] : rueck
}

/**
 * Die sechs Gegenstaende als Linienzeichnung. Sie kommen aus sechs
 * verschiedenen Gewerken — Kueche und Bad, Boden, Wand, Licht, Elektro,
 * Photovoltaik — und nicht mehr alle aus der Kueche: VIDEKO ist die
 * Dachmarke ueber allen. Fremde Firmenzeichen kommen keine vor.
 *
 * Wichtiger als das Motiv ist die Silhouette: hoch-schlank, liegendes
 * Rechteck, Walze, Dreieck, Kreis, Diagonale. So bleiben sechs Sorten auch
 * ohne Farbsehen und auf einem 44-Pixel-Feld auseinanderzuhalten.
 */
function Zeichen({ typ }) {
  const linie = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  let inhalt
  if (typ === 1) {
    /* Armatur — Kueche und Bad. Hoch und schlank. */
    inhalt = (
      <>
        <path d="M6.5 21h11" />
        <path d="M9 21v-6.5h6V21" />
        <path d="M12 14.5V6.2a2.7 2.7 0 0 1 2.7-2.7h4.1" />
        <path d="M18.8 2.1v2.8" />
        <path d="M8.6 10.5h6.8" />
      </>
    )
  } else if (typ === 2) {
    /* Bodendiele — liegendes Rechteck mit Maserung. */
    inhalt = (
      <>
        <rect x="2.6" y="7.5" width="18.8" height="9" rx="1.2" />
        <path d="M9 7.5v9M15.4 7.5v9" strokeOpacity="0.55" />
        <path d="M4.6 11h2.6M11 13h2.6M17.4 10.6h2.2" strokeOpacity="0.5" strokeWidth="1.4" />
      </>
    )
  } else if (typ === 3) {
    /* Farbrolle — Wand. Walze plus abgewinkelter Stiel. */
    inhalt = (
      <>
        <rect x="3" y="4.2" width="12.5" height="6" rx="1.6" />
        <path d="M15.5 7.2h3.3v3.6h-6.5v2.4" />
        <path d="M12.3 13.2v7.4" strokeWidth="2.4" />
      </>
    )
  } else if (typ === 4) {
    /* Pendelleuchte — Licht. Dreieck am Draht, mit Lichtkegel. */
    inhalt = (
      <>
        <path d="M12 2.2v4" />
        <path d="M12 6.2 4.6 15h14.8z" />
        <path d="M8.4 19.2h7.2" strokeOpacity="0.55" />
        <path d="M6.6 21.4h10.8" strokeOpacity="0.35" />
      </>
    )
  } else if (typ === 5) {
    /* Steckdose — Elektro und Smart Home. Der einzige volle Kreis. */
    inhalt = (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="8.6" cy="12" r="1.1" strokeWidth="2.4" />
        <circle cx="15.4" cy="12" r="1.1" strokeWidth="2.4" />
        <path d="M12 3.6v2.2M12 18.2v2.2" strokeOpacity="0.5" />
      </>
    )
  } else {
    /* Photovoltaik-Modul — schraeg gestelltes Gitter, die Diagonale. */
    inhalt = (
      <>
        <path d="M5.4 4.5h14.2l-2.6 12H2.8z" />
        <path d="M4.1 10.5h14.5M11.3 4.5l-1.7 12" strokeOpacity="0.55" />
        <path d="M9.6 16.5 8.4 21.5M13.2 21.5h-7" />
      </>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...linie}>
      {inhalt}
    </svg>
  )
}

/**
 * Das VIDEKO-Wild: das echte Markenzeichen als Bild, kein nachgemaltes V.
 * Es raeumt alles eines Typs — und ist das einzige Teil im Feld, das keinen
 * eigenen Typ zeigt, damit es nie mit einem gewoehnlichen Stein verwechselt
 * wird.
 */
function Wild() {
  return (
    <img
      className="trm-crush-wild"
      src={WILD_QUELLE}
      alt=""
      aria-hidden="true"
      draggable="false"
      decoding="async"
    />
  )
}

/** Zwei goldene Pfeilspitzen in Wirkrichtung — der Booster ist auf einen Blick klar. */
function Pfeile() {
  return (
    <svg className="trm-crush-pfeil" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M0.6 12 5 7.6v8.8zM23.4 12 19 7.6v8.8z" />
    </svg>
  )
}

/**
 * Backofen und Kuehlschrank bekommen ein Abzeichen statt eines eigenen
 * Bildes: beide bleiben ganz normale Steine ihres Typs und muessen deshalb
 * weiter erkennbar sein, mit wem sie zusammenpassen.
 */
function Flamme() {
  return (
    <svg className="trm-crush-marke" data-art="ofen" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.4c3.6 3.2 5.4 5.9 5.4 8.6a5.4 5.4 0 0 1-10.8 0c0-1.6.6-3 1.9-4.5.3 1.6 1 2.4 2.1 2.4 1 0 1.5-1 1.4-2.8z" />
    </svg>
  )
}

function Kristall() {
  return (
    <svg className="trm-crush-marke" data-art="frost" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.4v19.2M3.7 7.2l16.6 9.6M20.3 7.2 3.7 16.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Ein Stein. Memo: je Schritt rendern nur die, die sich bewegt oder geaendert haben. */
const Stein = memo(function Stein({ stein, x, y, weg, neu, gewaehlt, fokus, hinweis, nein }) {
  const booster = stein.spezial === 'reihe' || stein.spezial === 'spalte'
  return (
    <div
      className="trm-crush-stein"
      data-zelle={`${x},${y}`}
      data-typ={stein.typ}
      data-spezial={stein.spezial || undefined}
      data-weg={weg ? '1' : undefined}
      data-neu={neu ? neu : undefined}
      data-gewaehlt={gewaehlt ? '1' : undefined}
      data-fokus={fokus ? '1' : undefined}
      data-hinweis={hinweis ? '1' : undefined}
      data-nein={nein ? '1' : undefined}
      style={{ transform: `translate(${x * 100}%, ${y * 100}%)`, '--neu': neu || 0 }}
    >
      <span className="trm-crush-kachel" key={stein.spezial || 'n'}>
        {stein.spezial === 'bombe' ? <Wild /> : <Zeichen typ={stein.typ} />}
        {booster && <Pfeile />}
        {stein.spezial === 'ofen' && <Flamme />}
        {stein.spezial === 'frost' && <Kristall />}
      </span>
    </div>
  )
})

const gleicheZelle = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1]

export default function KuechenCrush({ sitzung, best = null, onErgebnis }) {
  /* Was gerade zu sehen ist: Feld, markierte Ids, frisch gefallene Ids. */
  const [bild, setBild] = useState(null)
  const [frei, setFrei] = useState(true)
  const [auswahl, setAuswahl] = useState(null)
  const [cursor, setCursor] = useState([3, 4])
  const [tastaturAn, setTastaturAn] = useState(false)
  const [hinweisAn, setHinweisAn] = useState(false)
  /* Der aktuelle Multiplikator: waehrend einer Kaskade Kaskade × Tempo,
     in Ruhe die gehaltene Tempostufe. */
  const [combo, setCombo] = useState(1)
  const [effekte, setEffekte] = useState(KEINE)
  const [banner, setBanner] = useState(null)
  const [schlag, setSchlag] = useState(null)
  const [meldung, setMeldung] = useState(null)
  const [masse, setMasse] = useState({ breite: 320, hoehe: 480 })
  const [sanft, setSanft] = useState(false)
  const [frost, setFrost] = useState(false)

  const buehneRef = useRef(null)
  const gitterRef = useRef(null)
  const schichtElRef = useRef(null)
  const schichtRef = useRef(null)
  const standRef = useRef(null)
  const sanftRef = useRef(false)
  const sperreRef = useRef(false)
  const beendetRef = useRef(false)
  const uhrenRef = useRef([])
  const fingerRef = useRef(null)
  const nrRef = useRef(0)
  const restRef = useRef(START_MS)
  const serieRef = useRef(0)
  const freiSeitRef = useRef(0)
  const zugNrRef = useRef(0)
  const tickRef = useRef(0)
  /* Zeiger in SPRUCH_MEGA. Reihum statt zufaellig — so kann derselbe Satz
     nicht zweimal hintereinander fallen, was den Moment entwerten wuerde. */
  const spruchRef = useRef(-1)
  /* domRuetteln haengt einen Timer an die Buehne und gibt die Aufraeumfunktion
     zurueck. Sie wird hier festgehalten, damit ein Unmount mitten im Beben den
     Timer loest, statt 420 ms spaeter auf ein abgehaengtes Element zu greifen. */
  const bebenLoesenRef = useRef(null)

  /* dauerMaxVorgabe ist die harte Decke: alle Zeitboni zusammen koennen die
     Runde nie ueber DECKEL_MS hinaus tragen. */
  const lauf = useSpielLauf({
    sitzung,
    game: 'kuechen_crush',
    dauerVorgabe: START_MS,
    dauerMaxVorgabe: DECKEL_MS,
    onErgebnis,
  })
  const {
    laeuft,
    punkteGeben,
    rundeZaehlen,
    fertig,
    starten: laufStarten,
    restMs,
    zeitBonus,
    nachspielSetzen,
  } = lauf
  const finale = laeuft && istFinale(restMs)
  const spannung = laeuft && restMs <= SPANNUNG_MS
  /* Die Buehne erscheint erst, wenn das Feld liegt — erst dann messen. */
  const buehneDa = laeuft && !!bild

  useEffect(() => {
    restRef.current = restMs
  }, [restMs])

  /* Die letzten drei Sekunden ticken hoerbar, einmal je Sekunde. */
  useEffect(() => {
    if (!laeuft || restMs > 3000) return
    const s = Math.ceil(restMs / 1000)
    if (s <= 0 || tickRef.current === s) return
    tickRef.current = s
    klang('tick')
  }, [laeuft, restMs])

  /* Reduced Motion wird mitgehoert, nicht nur einmal gelesen: wer die
     Einstellung mitten in der Runde umlegt, merkt es sofort. Die Quelle ist
     fuer alle Spiele dieselbe — spielgefuehl.js. */
  useEffect(() => {
    const setzen = (wert) => {
      sanftRef.current = wert
      setSanft(wert)
    }
    return sanftHoeren(setzen)
  }, [])

  /* Der Klang haengt am AudioContext. Beim Verlassen wird er geschlossen,
     damit kein Ton im Hintergrund weiterlebt. */
  useEffect(() => () => klangSchliessen(), [])

  /* Die gemeinsame Effektschicht liegt UEBER dem Gitter, nicht darin: das
     Gitter schneidet ab (overflow:hidden), die Zahlen sollen aber ueber den
     Rand hinaus aufsteigen duerfen. */
  useEffect(() => {
    const el = schichtElRef.current
    if (!el) return undefined
    const schicht = domSchicht(el)
    schichtRef.current = schicht
    return () => {
      schichtRef.current = null
      schicht.schliessen()
    }
  }, [buehneDa])

  /** Zellmitte als Prozentwert der Buehne — so rechnet die Schicht. */
  const zellePunkt = useCallback((zx, zy) => {
    const g = gitterRef.current
    const b = buehneRef.current
    if (!g || !b) return { x: 50, y: 50 }
    const rg = g.getBoundingClientRect()
    const rb = b.getBoundingClientRect()
    if (!rb.width || !rb.height) return { x: 50, y: 50 }
    const kante = rg.width / BREITE
    return {
      x: ((rg.left - rb.left + (zx + 0.5) * kante) / rb.width) * 100,
      y: ((rg.top - rb.top + (zy + 0.5) * kante) / rb.height) * 100,
    }
  }, [])

  /* Buehne messen. Rendert nur bei echter Groessenaenderung. */
  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    const messen = () => {
      const breite = el.clientWidth || 320
      const hoehe = el.clientHeight || 480
      setMasse((alt) => (alt.breite === breite && alt.hoehe === hoehe ? alt : { breite, hoehe }))
    }
    messen()
    el.focus({ preventScroll: true })
    if (typeof ResizeObserver !== 'function') {
      window.addEventListener('resize', messen)
      return () => window.removeEventListener('resize', messen)
    }
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [buehneDa])

  const alleStoppen = useCallback(() => {
    for (const uhr of uhrenRef.current) clearTimeout(uhr)
    uhrenRef.current = []
    if (bebenLoesenRef.current) {
      bebenLoesenRef.current()
      bebenLoesenRef.current = null
    }
  }, [])

  const planen = useCallback((ms, fn) => {
    uhrenRef.current.push(setTimeout(fn, ms))
  }, [])

  /* Endet die Runde (Uhr oder Testlabor), bleibt keine Aufloesung haengen. */
  useEffect(() => {
    if (!laeuft) return undefined
    return () => {
      alleStoppen()
      beendetRef.current = true
      fingerRef.current = null
    }
  }, [laeuft, alleStoppen])

  useEffect(() => () => alleStoppen(), [alleStoppen])

  const melden = useCallback((art, text) => {
    nrRef.current += 1
    setMeldung({ nr: nrRef.current, art, text })
  }, [])

  useEffect(() => {
    if (!meldung) return undefined
    const uhr = setTimeout(() => setMeldung(null), MELDUNG_MS)
    return () => clearTimeout(uhr)
  }, [meldung])

  const einblenden = useCallback(
    (inhalt) => {
      nrRef.current += 1
      const nr = nrRef.current
      setBanner({ nr, ...inhalt })
      planen(sanftRef.current ? SANFT_BANNER_MS : BANNER_MS, () => setBanner((b) => (b && b.nr === nr ? null : b)))
    },
    [planen],
  )

  /* Die letzten fuenf Sekunden zaehlen doppelt — einmal gross ansagen. */
  useEffect(() => {
    if (!finale) return undefined
    const uhr = setTimeout(() => {
      einblenden({ stufe: 'finale', gross: 'FINALE', klein: `${malText(FINALE_FAKTOR)} PUNKTE` })
      vibrieren(HAPTIK.fieber)
      klang('kraft')
    }, 0)
    return () => clearTimeout(uhr)
  }, [finale, einblenden])

  /* Wer eine Weile nichts findet, bekommt einen Zug gezeigt. */
  useEffect(() => {
    if (!laeuft || !frei || !bild) return undefined
    const an = setTimeout(() => setHinweisAn(true), HINWEIS_MS)
    return () => {
      clearTimeout(an)
      setHinweisAn(false)
    }
  }, [laeuft, frei, bild])

  /** Der normale Weg ins Ende — fuer das Testlabor. */
  const beenden = useCallback(() => {
    if (beendetRef.current) return
    beendetRef.current = true
    sperreRef.current = true
    fingerRef.current = null
    alleStoppen()
    fertig()
  }, [alleStoppen, fertig])

  useTestEnde('kuechen_crush', laeuft, beenden)

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    alleStoppen()
    standRef.current = neuesSpiel()
    beendetRef.current = false
    sperreRef.current = false
    fingerRef.current = null
    serieRef.current = 0
    freiSeitRef.current = 0
    zugNrRef.current = 0
    tickRef.current = 0
    spruchRef.current = -1
    restRef.current = START_MS
    schichtRef.current?.leeren()
    setFrost(false)
    setBild({ feld: standRef.current.feld, weg: null, neuVon: LEER, nein: null })
    setFrei(true)
    setAuswahl(null)
    setCursor([3, 4])
    setCombo(1)
    setEffekte(KEINE)
    setBanner(null)
    setSchlag(null)
    setMeldung(null)
    return true
  }, [laufStarten, alleStoppen])

  /** Effekte zeigen und nach ihrer Lebenszeit wieder abraeumen. */
  const effekteZeigen = useCallback(
    (liste) => {
      if (!liste.length) return
      const nrs = new Set()
      const neu = liste.map((f) => {
        nrRef.current += 1
        nrs.add(nrRef.current)
        return { ...f, nr: nrRef.current }
      })
      setEffekte((alt) => [...alt, ...neu])
      planen(sanftRef.current ? SANFT_EFFEKT_LEBEN_MS : EFFEKT_LEBEN_MS, () =>
        setEffekte((alt) => {
          const rest = alt.filter((f) => !nrs.has(f.nr))
          return rest.length ? rest : KEINE
        }),
      )
    },
    [planen],
  )

  /** Ein Tausch. Gueltig: werten und abspielen. Ungueltig: zuruecktauschen. */
  const zugVersuchen = useCallback(
    (a, b) => {
      const stand = standRef.current
      if (!stand || beendetRef.current || sperreRef.current || !benachbart(a, b)) return false
      const leise = sanftRef.current
      const alt = stand.feld
      const ergebnis = tauschen(stand, a, b)

      if (!ergebnis.gueltig) {
        const ids = [alt[a[1]][a[0]].id, alt[b[1]][b[0]].id]
        /* Ein Fehltausch beendet die Tempo-Serie. */
        serieRef.current = 0
        setCombo(1)
        sperreRef.current = true
        setFrei(false)
        if (leise) {
          setBild({ feld: alt, weg: null, neuVon: LEER, nein: ids })
        } else {
          setBild({ feld: vertauscht(alt, a, b), weg: null, neuVon: LEER, nein: null })
          planen(TAUSCH_MS, () => setBild({ feld: alt, weg: null, neuVon: LEER, nein: ids }))
        }
        planen(leise ? 60 : 2 * TAUSCH_MS, () => {
          sperreRef.current = false
          setFrei(true)
        })
        planen(NEIN_MS + (leise ? 0 : TAUSCH_MS), () =>
          setBild((b2) => (b2 && b2.nein ? { ...b2, nein: null } : b2)),
        )
        vibrieren(HAPTIK.fehler)
        klang('fehler')
        return false
      }

      rundeZaehlen()
      sperreRef.current = true
      /* Ab hier laeuft eine Aufloesung. Faellt die Uhr waehrenddessen auf
         null, wird die Kette trotzdem zu Ende gerechnet — und wenn dabei
         Zeit zurueckkommt, geht die Runde ganz regulaer weiter. */
      nachspielSetzen(true)
      zugNrRef.current += 1
      const zugNr = zugNrRef.current

      /* Tempo: wie schnell nach der letzten Freigabe getauscht wurde. */
      const stufe = freiSeitRef.current ? serieWeiter(serieRef.current, jetzt() - freiSeitRef.current) : 0
      serieRef.current = stufe
      const wertung = zugPunkte(ergebnis.schritte, { tempoStufe: stufe, finale: istFinale(restRef.current) })
      const zeit = zugZeit(ergebnis.schritte, { tempoStufe: stufe })
      const sperrMs = aufloesungMs(ergebnis)

      setFrei(false)
      setAuswahl(null)
      setBild({ feld: ergebnis.getauscht, weg: null, neuVon: LEER, nein: null })

      let t = TAUSCH_MS
      let neuVon = LEER
      ergebnis.schritte.forEach((schritt, i) => {
        const vorherNeu = neuVon
        const dauer = schrittDauerMs(schritt)
        /* Weniger Bewegung: nichts faellt sichtbar, aber der Takt ist derselbe. */
        const fall = leise ? FREI_FRUEH_MS : FALL_MS
        planen(t, () => {
          setBild({ feld: schritt.vorher, weg: new Set(schritt.weg), neuVon: vorherNeu, nein: null })
          punkteGeben(wertung.jeSchritt[i])
          /* Zeit kommt Schritt fuer Schritt zurueck, nicht als Klumpen am
             Ende — so sieht man in der Kaskade, was sie wert war. */
          const gabe = zeit.jeSchritt[i] ? zeitBonus(zeit.jeSchritt[i]) : 0
          setCombo(wertung.multi[i])
          const zu = schrittBild(schritt)
          effekteZeigen(zu.effekte)
          if (zu.banner && zu.mega) {
            spruchRef.current = (spruchRef.current + 1) % SPRUCH_MEGA.length
            einblenden({ ...zu.banner, klein: SPRUCH_MEGA[spruchRef.current] })
          } else if (zu.banner) {
            einblenden(zu.banner)
          }
          if (zu.schlag && !leise) {
            nrRef.current += 1
            setSchlag({ nr: nrRef.current, stufe: zu.schlag })
          }

          const schicht = schichtRef.current
          const [mx, my] = schwerpunkt(schritt, b)
          const p = zellePunkt(mx, my)
          /* Die grosse Zahl gibt es nur im grossen Moment. Sie ist auch bei
             reduzierter Bewegung zu sehen — sie ist Information, kein Effekt. */
          schicht?.popup({ x: p.x, y: p.y, text: `+${wertung.jeSchritt[i]}`, art: zu.mega ? 'gross' : 'punkte' })
          if (gabe > 0) {
            schicht?.popup({ x: p.x, y: Math.max(6, p.y - 9), text: sekText(gabe), art: 'zeit' })
          }
          const stufeWort = comboStufe(schritt.kombo)
          if (stufeWort) schicht?.popup({ x: p.x, y: Math.max(4, p.y - 18), text: stufeWort.wort, art: 'combo' })
          if (!leise) {
            schicht?.funken({
              x: p.x,
              y: p.y,
              anzahl: zu.schlag >= 4 ? 26 : zu.schlag >= 3 ? 16 : zu.schlag === 2 ? 12 : 8,
              art: zu.frost ? 'creme' : 'gold',
              weite: zu.schlag >= 4 ? 96 : zu.schlag >= 3 ? 66 : 46,
            })
            /* Das Gitter ruettelt ohnehin bei jedem Schlag. Die ganze Buehne
               bewegt sich nur bei den grossen Momenten. */
            if (zu.schlag >= 3) {
              schicht?.blitz('gold')
              bebenLoesenRef.current?.()
              bebenLoesenRef.current = domRuetteln(buehneRef.current, 2)
            }
            /* Oberste Stufe: eine zweite, weite Welle in Creme ueber dem
               Gold — dazu zoomt das Feld kurz heran (data-schlag='4'). */
            if (zu.schlag >= 4) schicht?.funken({ x: p.x, y: p.y, anzahl: 14, art: 'creme', weite: 140 })
          }
          if (zu.frost > 0) {
            setFrost(true)
            planen(FROST_ZEIGE_MS, () => setFrost(false))
          }

          if (stufeWort) melden('gold', stufeWort.wort)
          else if (schritt.kombo >= 2) melden(schritt.kombo >= 3 ? 'gold' : 'gut', `KOMBO ${malText(wertung.multi[i])}`)
          else if (zu.booster && !zu.banner) melden('gut', 'BOOSTER')

          if (zu.schlag >= 3) vibrieren(HAPTIK.explosion)
          else if (zu.schlag === 2 || schritt.kombo >= 3) vibrieren(HAPTIK.gut)
          else if (zu.schlag === 1 || schritt.kombo === 2) vibrieren(HAPTIK.treffer)
          else vibrieren(HAPTIK.tipp)

          /* Der zweite Wert ist die Tonhoehe: 0,72 zieht die Explosion tiefer,
             sie klingt dadurch groesser statt nur lauter. */
          if (zu.schlag >= 4) klang('explosion', 0.72)
          else if (zu.schlag >= 3) klang('explosion')
          else if (zu.schlag === 2) klang('kraft')
          else if (schritt.kombo >= 3) klang('combo', 1 + 0.06 * Math.min(8, schritt.kombo))
          else if (zu.frost > 0) klang('zeit')
          else klang('pop', 1 + 0.05 * (schritt.kombo - 1))
        })
        t += dauer - fall
        planen(t, () => setBild({ feld: schritt.nachher, weg: null, neuVon: schritt.neuVon, nein: null }))
        t += fall
        neuVon = schritt.neuVon
      })

      if (ergebnis.gemischt) {
        const gemischt = ergebnis.gemischt
        planen(t, () => {
          setBild({ feld: gemischt, weg: null, neuVon: LEER, nein: null })
          melden('treffer', 'NEU GEMISCHT')
        })
      }

      /* Freigabe: sobald der letzte Fall fast liegt, nie vor SPERRE_MS. */
      planen(Math.max(sperrMs, ergebnis.gemischt ? t + MISCHEN_MS : 0), () => {
        sperreRef.current = false
        nachspielSetzen(false)
        freiSeitRef.current = jetzt()
        setFrei(true)
        setCombo(tempoFaktor(stufe))
        /* Wer das Tempofenster verstreichen laesst, faellt auf ×1 zurueck. */
        if (stufe > 0) {
          planen(SERIE_MS + 20, () => {
            if (zugNrRef.current !== zugNr) return
            serieRef.current = 0
            setCombo(1)
          })
        }
      })
      return true
    },
    [einblenden, effekteZeigen, melden, nachspielSetzen, planen, punkteGeben, rundeZaehlen, zeitBonus, zellePunkt],
  )

  /* ---------------------------------------------------------------- */
  /* Eingaben                                                          */
  /* ---------------------------------------------------------------- */

  const zelleAus = (e) => {
    const g = gitterRef.current
    if (!g) return null
    const r = g.getBoundingClientRect()
    const z = r.width / BREITE
    if (!z) return null
    const x = Math.floor((e.clientX - r.left) / z)
    const y = Math.floor((e.clientY - r.top) / z)
    return imFeld(x, y) ? [x, y] : null
  }

  const waehlen = (zelle) => {
    setCursor(zelle)
    if (auswahl && benachbart(auswahl, zelle)) {
      setAuswahl(null)
      zugVersuchen(auswahl, zelle)
    } else if (gleicheZelle(auswahl, zelle)) {
      setAuswahl(null)
    } else {
      setAuswahl(zelle)
    }
  }

  const zeigerRunter = (e) => {
    if (!laeuft || beendetRef.current) return
    e.preventDefault()
    e.currentTarget.focus?.({ preventScroll: true })
    const zelle = zelleAus(e)
    if (!zelle) return
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* Capture ist nur Komfort */
    }
    setTastaturAn(false)
    fingerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, zelle, verbraucht: false }
  }

  const zeigerZieht = (e) => {
    const f = fingerRef.current
    if (!f || f.verbraucht || f.id !== e.pointerId) return
    const g = gitterRef.current
    const z = g ? g.getBoundingClientRect().width / BREITE : 40
    const dx = e.clientX - f.x
    const dy = e.clientY - f.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < z * WISCH_ANTEIL) return
    f.verbraucht = true
    const ziel =
      Math.abs(dx) > Math.abs(dy) ? [f.zelle[0] + Math.sign(dx), f.zelle[1]] : [f.zelle[0], f.zelle[1] + Math.sign(dy)]
    if (!imFeld(ziel[0], ziel[1]) || sperreRef.current) return
    setAuswahl(null)
    zugVersuchen(f.zelle, ziel)
  }

  const zeigerHoch = (e) => {
    const f = fingerRef.current
    fingerRef.current = null
    if (!f || f.verbraucht || f.id !== e.pointerId || sperreRef.current || beendetRef.current) return
    waehlen(f.zelle)
  }

  const tastatur = (e) => {
    const schritte = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const k = e.key
    if (!schritte[k] && k !== 'Enter' && k !== ' ') return
    e.preventDefault()
    if (!laeuft || beendetRef.current) return
    setTastaturAn(true)
    if (schritte[k]) {
      const [dx, dy] = schritte[k]
      setCursor(([x, y]) => [Math.min(BREITE - 1, Math.max(0, x + dx)), Math.min(HOEHE - 1, Math.max(0, y + dy))])
      return
    }
    if (e.repeat || sperreRef.current) return
    waehlen(cursor)
  }

  /* ---------------------------------------------------------------- */
  /* Bild                                                              */
  /* ---------------------------------------------------------------- */

  const z = Math.max(16, Math.floor(Math.min((masse.breite - 2 * RAND) / BREITE, (masse.hoehe - 2 * RAND) / HOEHE)))
  const gitterOben = Math.round((masse.hoehe - z * HOEHE) / 2)
  const gitterStil = {
    width: z * BREITE,
    height: z * HOEHE,
    left: Math.round((masse.breite - z * BREITE) / 2),
    top: gitterOben,
    '--z': `${z}px`,
  }

  /* Nach Id sortiert: React haengt dann nie Knoten um, und die Transition
     der wandernden Steine bleibt erhalten. */
  const steine = useMemo(() => {
    if (!bild) return []
    const liste = []
    bild.feld.forEach((reihe, y) =>
      reihe.forEach((stein, x) => {
        if (stein) liste.push({ stein, x, y })
      }),
    )
    return liste.sort((a, b) => a.stein.id - b.stein.id)
  }, [bild])

  /* Ein gueltiger Zug fuer den Hinweis — und fuer automatische Tests als
     data-hinweis an der Buehne. ersterZug tauscht nur probeweise und stellt
     das Feld sofort wieder her. */
  const zug = useMemo(() => (bild && frei ? ersterZug(bild.feld.map((r) => r.slice())) : null), [bild, frei])
  const zugText = zug ? `${zug[0].join(',')};${zug[1].join(',')}` : undefined

  return (
    <SpielKarte
      spiel={{ ...SPIEL, hebel: { wort: 'BOOSTER', punkte: HEBEL_PUNKTE } }}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span
          className="trm-spiel__combo"
          data-an={finale || combo > 1 ? '1' : '0'}
          data-crush-finale={finale ? '1' : undefined}
        >
          {finale ? `FINALE ${malText(FINALE_FAKTOR)}` : combo > 1 ? `KOMBO ${malText(combo)}` : ''}
        </span>
      }
    >
      {laeuft && bild && (
        <>
          <div
            className="trm-crush-buehne"
            ref={buehneRef}
            role="application"
            tabIndex={0}
            aria-label="Küchen-Crush Spielfeld. Wischen oder zwei Nachbarn antippen zum Tauschen. Pfeiltasten bewegen den Rahmen, Enter wählt und tauscht."
            data-sanft={sanft ? '1' : '0'}
            data-frei={frei ? '1' : '0'}
            data-endspurt={finale ? '1' : '0'}
            data-finale={finale ? '1' : '0'}
            data-spannung={spannung ? '1' : '0'}
            data-frost={frost ? '1' : '0'}
            data-combo={String(combo)}
            data-hinweis={zugText}
            onPointerDown={zeigerRunter}
            onPointerMove={zeigerZieht}
            onPointerUp={zeigerHoch}
            onPointerCancel={() => {
              fingerRef.current = null
            }}
            onKeyDown={tastatur}
          >
            <div
              className="trm-crush-gitter"
              ref={gitterRef}
              style={gitterStil}
              aria-hidden="true"
              data-schlag={schlag ? schlag.stufe : undefined}
              data-takt={schlag ? (schlag.nr % 2 ? 'a' : 'b') : undefined}
            >
              {steine.map(({ stein, x, y }) => (
                <Stein
                  key={stein.id}
                  stein={stein}
                  x={x}
                  y={y}
                  weg={bild.weg ? bild.weg.has(stein.id) : false}
                  neu={bild.neuVon[stein.id] || 0}
                  gewaehlt={gleicheZelle(auswahl, [x, y])}
                  fokus={tastaturAn && cursor[0] === x && cursor[1] === y}
                  hinweis={hinweisAn && !!zug && (gleicheZelle(zug[0], [x, y]) || gleicheZelle(zug[1], [x, y]))}
                  nein={!!bild.nein && bild.nein.includes(stein.id)}
                />
              ))}
              {effekte.map((f) => (
                <span
                  key={f.nr}
                  className="trm-crush-effekt"
                  data-art={f.art}
                  data-stark={f.stark ? '1' : undefined}
                  style={{ '--x': f.x, '--y': f.y }}
                />
              ))}
            </div>

            <p
              className="trm-crush-multi"
              data-an={combo > 1 ? '1' : '0'}
              style={{ top: Math.max(4, gitterOben - 28) }}
              aria-hidden="true"
            >
              <span key={combo}>{malText(combo)}</span>
            </p>

            {banner && (
              <p
                key={banner.nr}
                className="trm-crush-banner"
                data-stufe={banner.stufe}
                /* Zeichenzahl und gemessene Buehnenbreite gehen ins CSS:
                   DOPPEL-SYMBOL darf nicht dieselbe Schriftgroesse bekommen
                   wie 4ER, sonst laeuft es aus der Buehne. Die Breite kommt
                   aus der Messung, nicht aus vw — die Buehne ist am Desktop
                   schmaler als das Fenster. */
                style={{ '--lang': banner.gross.length, '--buehne-w': `${masse.breite}px` }}
                aria-hidden="true"
              >
                <span className="trm-crush-banner__gross">{banner.gross}</span>
                <span className="trm-crush-banner__klein">{banner.klein}</span>
              </p>
            )}

            {/* Randpuls der letzten Sekunden. */}
            <span className="trm-crush-rand" aria-hidden="true" />

            {/* Gemeinsame Effektschicht: Zahlen, Funken, Blitz. */}
            <div className="sg-schicht" ref={schichtElRef} aria-hidden="true" />

            {/* Der Tonschalter sitzt in der gemeinsamen Game-Shell
                (SpielKarte), nicht mehr hier. */}
          </div>

          {meldung && (
            <p key={meldung.nr} className={`trm-spiel__ruf trm-spiel__ruf--${meldung.art}`}>
              {meldung.text}
            </p>
          )}
        </>
      )}
    </SpielKarte>
  )
}
