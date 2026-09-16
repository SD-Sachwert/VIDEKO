import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  ARTEN,
  FLAGGE,
  LANG_MS,
  OFFEN,
  REIHEN,
  SERIE_ANTEIL,
  SERIE_MS,
  SPALTEN,
  VERDECKT,
  bohrFreigabe,
  bohren,
  faktorFuer,
  index,
  lage,
  markieren,
  neueWand,
  restFuer,
  serieStufe,
  serieWeiter,
} from './leitung-logik.js'
import './leitung.css'

/**
 * LEITUNGSFINDER — bohren, wo keine Leitung liegt.
 *
 * Die Regeln stehen in leitung-logik.js und sind dort getestet. Hier geht
 * es nur um Zeit, Finger und Bild.
 *
 * MARKIEREN OHNE ZWEIFEL
 * ----------------------
 * Auf dem Handy gibt es zwei Wege: lange druecken (LANG_MS) oder den
 * Schalter MARKIEREN umlegen, dann markiert jeder Tipp. Beim langen Druck
 * laeuft ein Ring um die Fliese voll — wer loslaesst, bevor er voll ist,
 * bohrt; wer haelt, markiert, und das Loslassen danach tut nichts mehr.
 * Wer den Finger weiter als eine halbe Fliese zieht, bricht ab. Ein Tipp
 * auf eine markierte Fliese bohrt nie. Maus: Rechtsklick markiert.
 *
 * SERIE
 * -----
 * Jede sichere Bohrung binnen SERIE_MS nach der vorigen zaehlt die Serie
 * hoch; ein Balken unter der Wand zeigt, wie lange das Fenster noch offen
 * ist. Waehrend WAND GESCHAFFT steht die Uhr still, ein Tab-Wechsel beendet
 * die Serie.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Jede Bohrung, die Fliesen oeffnet, ist eine Runde; der Server verlangt
 * mindestens 90 ms je Runde ab Ausgabe des Laufscheins. Die k-te Bohrung
 * geht deshalb fruehestens k × TAKT_MS nach Ankunft des Tickets durch
 * (bohrFreigabe). Kommt ein Tipp zu frueh, wird er nicht verworfen: die
 * Fliese zeigt kurz den Bohrer und oeffnet sich, sobald sie darf.
 *
 * WARUM KEIN CANVAS
 * -----------------
 * 80 Fliesen, die sich nur bei einem Tipp aendern: das ist ein Raster aus
 * Knoepfen, kein Bild. So hat jede Fliese `data-zelle`, ist fuer Tests
 * direkt anklickbar und fuer Screenreader beschriftet.
 */

const SPIEL = SPIEL_NACH_KEY.leitungsfinder

const CRASH_MS = 650
const WAND_PAUSE_MS = 750
const WAND_PAUSE_SANFT_MS = 550
const ZIEH_PX = 14
const RAND = 6
const KOPF = 40
const FUSS = 40
const FUGE = 2
const KNAPP_AB = 3
/* Typischer Wert einer freien Wand um Wand 3: 67 Fliesen × 30 plus 1200 Bonus. */
const HEBEL_PUNKTE = 3200

const ART_NAME = { wasser: 'WASSERROHR', strom: 'STROMKABEL', abwasser: 'ABWASSER' }
const ART_LABEL = { wasser: 'Wasser', strom: 'Strom', abwasser: 'Abwasser' }

function summen(muster) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(muster)
  } catch {
    /* kein Vibrationsmotor, kein Problem */
  }
}

/** Fliesengroesse fuer die Buehne. Nie kleiner als 24 px, auch wenn es eng wird. */
function fliesenMass(breite, hoehe) {
  const b = (breite - 2 * RAND - (SPALTEN - 1) * FUGE) / SPALTEN
  const h = (hoehe - KOPF - FUSS - RAND - (REIHEN - 1) * FUGE) / REIHEN
  return Math.max(24, Math.floor(Math.min(b, h)))
}

function zeichenFuer(zustand) {
  if (zustand === FLAGGE) return 'markiert'
  if (zustand === OFFEN) return 'offen'
  return 'verdeckt'
}

/** Ein Leitungsmarker: Warndreieck mit Ausrufezeichen. */
function Marker() {
  return (
    <svg className="trm-leitung-marker" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 1.8 19 17.8H1z" />
      <path className="trm-leitung-marker-zeichen" d="M9 6.6h2l-.3 6h-1.4zM9 14.2h2v2H9z" />
    </svg>
  )
}

/** Symbol je Leitungsart: Tropfen, Blitz, Welle mit Pfeil. Farbe kommt aus CSS. */
function ArtSymbol({ art }) {
  return (
    <svg className="trm-leitung-symbol" data-art={art} viewBox="0 0 20 20" aria-hidden="true">
      {art === 'wasser' && <path className="trm-leitung-symbol-flaeche" d="M10 2.4C7.1 6.6 5 9.4 5 12.3a5 5 0 0 0 10 0c0-2.9-2.1-5.7-5-9.9z" />}
      {art === 'strom' && <path className="trm-leitung-symbol-flaeche" d="M11.6 1.8 4.4 11.4h4.6L7.8 18.2l7.8-10h-4.8z" />}
      {art === 'abwasser' && (
        <path
          className="trm-leitung-symbol-linie"
          d="M2.8 5.6c2.4-2 4.8 2 7.2 0s4.8 2 7.2 0M2.8 10.2c2.4-2 4.8 2 7.2 0s4.8 2 7.2 0M10 12.4v5.2M7.2 15l2.8 2.8 2.8-2.8"
        />
      )}
    </svg>
  )
}

export default function Leitungsfinder({ sitzung, best = null, onErgebnis }) {
  const [wand, setWand] = useState(() => neueWand(1))
  const [modus, setModus] = useState('bohren')
  const [cursor, setCursor] = useState(index(3, 4))
  const [tastatur, setTastatur] = useState(false)
  const [bohrt, setBohrt] = useState(-1)
  const [halten, setHalten] = useState(-1)
  const [z, setZ] = useState(32)
  const [meldung, setMeldung] = useState(null)
  const [pause, setPause] = useState(false)
  const [crash, setCrash] = useState(false)
  const [crashArt, setCrashArt] = useState('')
  const [sanft, setSanft] = useState(false)
  const [serie, setSerie] = useState({ n: 0, stufe: 0, nr: 0 })
  const [geschafft, setGeschafft] = useState(null)

  const buehneRef = useRef(null)
  const wandRef = useRef(wand)
  const modusRef = useRef('bohren')
  const rundenRef = useRef(0)
  const wartetRef = useRef({ i: -1, uhr: 0 })
  const fingerRef = useRef(null)
  const uhrenRef = useRef(new Set())
  const nrRef = useRef(0)
  const pauseRef = useRef(false)
  const crashRef = useRef(false)
  const wechselRef = useRef(false)
  const weiterSeitRef = useRef(0)
  /* n: laufende Serie, letzte: performance.now() der letzten Bohrung, uhr: Ablauf. */
  const serieRef = useRef({ n: 0, letzte: 0, uhr: 0 })

  const lauf = useSpielLauf({ sitzung, game: 'leitungsfinder', dauerVorgabe: 540000, onErgebnis, sofort: true })
  const { laeuft, punkteGeben, rundeZaehlen, fertig, starten: laufStarten, ticketSeitRef } = lauf

  /* Jede Wand-Aenderung geht durch hier: Ref fuer die Handler, State fuers Bild. */
  const wandSetzen = useCallback((neu) => {
    wandRef.current = neu
    setWand(neu)
  }, [])

  /* Eigene Uhren merken, damit ein Neustart oder das Aushaengen keine alten
     Rueckrufe mehr ausloest. */
  const spaeter = useCallback((fn, ms) => {
    const uhr = setTimeout(() => {
      uhrenRef.current.delete(uhr)
      fn()
    }, ms)
    uhrenRef.current.add(uhr)
    return uhr
  }, [])

  const uhrStoppen = useCallback((uhr) => {
    if (!uhr) return
    clearTimeout(uhr)
    uhrenRef.current.delete(uhr)
  }, [])

  const uhrenStoppen = useCallback(() => {
    for (const uhr of uhrenRef.current) clearTimeout(uhr)
    uhrenRef.current.clear()
    wartetRef.current = { i: -1, uhr: 0 }
    serieRef.current = { n: 0, letzte: 0, uhr: 0 }
    if (fingerRef.current?.uhr) clearTimeout(fingerRef.current.uhr)
    fingerRef.current = null
  }, [])

  useEffect(() => () => uhrenStoppen(), [uhrenStoppen])

  useEffect(() => {
    let wert
    try {
      wert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      wert = false
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSanft(wert)
  }, [])

  /* Groesse messen, Fliesenmass daraus. */
  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    const messen = () => setZ(fliesenMass(el.clientWidth || 300, el.clientHeight || 480))
    messen()
    el.focus({ preventScroll: true })
    if (typeof ResizeObserver !== 'function') {
      window.addEventListener('resize', messen)
      return () => window.removeEventListener('resize', messen)
    }
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [laeuft])

  const melden = useCallback((art, text) => {
    nrRef.current += 1
    setMeldung({ nr: nrRef.current, art, text })
  }, [])

  useEffect(() => {
    if (!meldung) return undefined
    const uhr = setTimeout(() => setMeldung(null), 1100)
    return () => clearTimeout(uhr)
  }, [meldung])

  /* ---------------------------------------------------------------- */
  /* Serie                                                             */
  /* ---------------------------------------------------------------- */

  /** Serie beenden (Ablauf, Pause, Crash). */
  const serieAbbrechen = useCallback(() => {
    const s = serieRef.current
    uhrStoppen(s.uhr)
    serieRef.current = { n: 0, letzte: 0, uhr: 0 }
    setSerie((alt) => (alt.n ? { n: 0, stufe: 0, nr: alt.nr } : alt))
  }, [uhrStoppen])

  /** Ablaufuhr ab jetzt neu stellen. */
  const serieUhrStellen = useCallback(() => {
    const s = serieRef.current
    uhrStoppen(s.uhr)
    s.letzte = performance.now()
    s.uhr = s.n > 0 ? spaeter(() => serieAbbrechen(), SERIE_MS) : 0
  }, [serieAbbrechen, spaeter, uhrStoppen])

  /** Wartende Bohrung und laufenden Druck verwerfen. */
  const wartendeVerwerfen = useCallback(() => {
    const w = wartetRef.current
    uhrStoppen(w.uhr)
    wartetRef.current = { i: -1, uhr: 0 }
    if (fingerRef.current?.uhr) clearTimeout(fingerRef.current.uhr)
    fingerRef.current = null
    setBohrt(-1)
    setHalten(-1)
  }, [uhrStoppen])

  /* Wer den Tab wechselt, findet das Spiel angehalten vor. Der Tipp zum
     Weiterspielen bohrt nichts und markiert nichts. Die Serie endet. */
  useEffect(() => {
    if (!laeuft) return undefined
    const wechsel = () => {
      if (document.hidden && !crashRef.current) {
        pauseRef.current = true
        wartendeVerwerfen()
        serieAbbrechen()
        setPause(true)
      }
    }
    document.addEventListener('visibilitychange', wechsel)
    return () => document.removeEventListener('visibilitychange', wechsel)
  }, [laeuft, wartendeVerwerfen, serieAbbrechen])

  /** Der normale Weg ins Game Over — auch fuer das Testlabor. */
  const aufgeben = useCallback(
    (art) => {
      if (crashRef.current) return
      crashRef.current = true
      pauseRef.current = false
      wartendeVerwerfen()
      serieAbbrechen()
      setPause(false)
      setGeschafft(null)
      setCrash(true)
      setCrashArt(typeof art === 'string' && ART_NAME[art] ? art : '')
      melden('verkantet', typeof art === 'string' && ART_NAME[art] ? `${ART_NAME[art]} GETROFFEN` : 'LEITUNG GETROFFEN')
      summen([90, 30, 140])
      spaeter(() => fertig(), CRASH_MS)
    },
    [fertig, melden, serieAbbrechen, spaeter, wartendeVerwerfen],
  )

  useTestEnde('leitungsfinder', laeuft, aufgeben)

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    uhrenStoppen()
    wandSetzen(neueWand(1))
    rundenRef.current = 0
    pauseRef.current = false
    crashRef.current = false
    wechselRef.current = false
    modusRef.current = 'bohren'
    setModus('bohren')
    setCursor(index(3, 4))
    setTastatur(false)
    setBohrt(-1)
    setHalten(-1)
    setMeldung(null)
    setPause(false)
    setCrash(false)
    setCrashArt('')
    setSerie({ n: 0, stufe: 0, nr: 0 })
    setGeschafft(null)
    return true
  }, [laufStarten, uhrenStoppen, wandSetzen])

  /** Ist gerade Eingabe moeglich? Nicht in Pause, Crash oder beim Wandwechsel. */
  const spielbar = () => laeuft && !pauseRef.current && !crashRef.current && !wechselRef.current

  /** Die Bohrung wirklich ausfuehren. Freigabe ist hier schon geprueft. */
  const bohrenJetzt = (i) => {
    const s = serieRef.current
    const jetzt = performance.now()
    const naechste = serieWeiter(s.n, s.n > 0 && s.letzte ? jetzt - s.letzte : null)
    const { wand: neu, ereignis } = bohren(wandRef.current, i, Math.random, naechste)
    if (ereignis.art === 'nichts') return
    wandSetzen(neu)
    if (ereignis.art === 'leitung') {
      aufgeben(ereignis.leitung)
      return
    }
    rundenRef.current += 1
    rundeZaehlen()
    punkteGeben(ereignis.punkte)

    s.n = naechste
    const stufeVorher = serieStufe(naechste - 1)
    setSerie({ n: naechste, stufe: ereignis.serieStufe, nr: rundenRef.current })

    if (!ereignis.frei) {
      serieUhrStellen()
      if (ereignis.serieStufe > stufeVorher) {
        melden('gut', `SERIE ${naechste} · +${Math.round(ereignis.serieStufe * SERIE_ANTEIL * 100)}%`)
        summen([10, 24, 10])
      } else {
        summen(ereignis.neu > 8 ? [8, 30, 8] : 6)
      }
      return
    }

    /* Wand frei: kurz alle Leitungen zeigen und WAND GESCHAFFT, dann sofort
       die naechste, dichtere Wand. Die Serie wartet so lange. */
    uhrStoppen(s.uhr)
    s.uhr = 0
    wechselRef.current = true
    setGeschafft({ nr: neu.nr, bonus: ereignis.bonus })
    summen([14, 24, 14, 24, 30])
    spaeter(
      () => {
        if (crashRef.current) return
        wechselRef.current = false
        setGeschafft(null)
        wandSetzen(neueWand(neu.nr + 1))
        serieUhrStellen()
      },
      sanft ? WAND_PAUSE_SANFT_MS : WAND_PAUSE_MS,
    )
  }

  /* Die Freigabe-Pruefung laeuft ueber einen Ref, damit die Uhr immer die
     aktuelle Fassung von bohrenJetzt ruft. */
  const pruefenRef = useRef(null)
  useEffect(() => {
    pruefenRef.current = () => {
      const w = wartetRef.current
      if (w.i < 0 || crashRef.current || pauseRef.current) return
      const warten = bohrFreigabe({ jetzt: Date.now(), ticketSeit: ticketSeitRef.current, runden: rundenRef.current })
      if (warten === 0) {
        wartetRef.current = { i: -1, uhr: 0 }
        setBohrt(-1)
        bohrenJetzt(w.i)
      } else {
        w.uhr = spaeter(() => pruefenRef.current?.(), warten > 0 ? warten : 60)
      }
    }
  })

  const bohrWunsch = (i) => {
    if (!spielbar() || wartetRef.current.i >= 0) return
    if (wandRef.current.zustand[i] !== VERDECKT) return
    const warten = bohrFreigabe({ jetzt: Date.now(), ticketSeit: ticketSeitRef.current, runden: rundenRef.current })
    if (warten === 0) {
      bohrenJetzt(i)
      return
    }
    wartetRef.current = { i, uhr: 0 }
    setBohrt(i)
    wartetRef.current.uhr = spaeter(() => pruefenRef.current?.(), warten > 0 ? warten : 60)
  }

  const flaggeSetzen = (i) => {
    if (!spielbar() || wartetRef.current.i === i) return
    const erg = markieren(wandRef.current, i)
    if (!erg) return
    wandSetzen(erg.wand)
    summen(erg.gesetzt ? [12, 40, 12] : 8)
  }

  const tippen = (i) => {
    if (modusRef.current === 'markieren') flaggeSetzen(i)
    else bohrWunsch(i)
  }

  const modusWechseln = () => {
    /* Der Tipp, der die Pause beendet, schaltet nicht zugleich den Modus. */
    if (pauseRef.current || performance.now() - weiterSeitRef.current < 400) return
    const neu = modusRef.current === 'markieren' ? 'bohren' : 'markieren'
    modusRef.current = neu
    setModus(neu)
    summen(8)
  }

  const weiter = () => {
    pauseRef.current = false
    weiterSeitRef.current = performance.now()
    setPause(false)
  }

  /* ---------------------------------------------------------------- */
  /* Finger, Maus, Tastatur                                            */
  /* ---------------------------------------------------------------- */

  const zelleUnter = (ziel) => {
    const el = ziel?.closest?.('[data-zelle]')
    if (!el) return -1
    const [x, y] = el.dataset.zelle.split(',').map(Number)
    return index(x, y)
  }

  const zeigerRunter = (e) => {
    if (!laeuft || crashRef.current) return
    if (e.target.closest?.('[data-modus]')) {
      if (pauseRef.current) weiter()
      return
    }
    e.preventDefault()
    e.currentTarget.focus?.({ preventScroll: true })
    if (pauseRef.current) {
      weiter()
      fingerRef.current = { id: e.pointerId, verbraucht: true }
      return
    }
    if (fingerRef.current?.uhr) clearTimeout(fingerRef.current.uhr)
    fingerRef.current = null
    const i = zelleUnter(e.target)
    if (i < 0) return
    setTastatur(false)
    if (e.button === 2) {
      flaggeSetzen(i)
      return
    }
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* Capture ist nur Komfort */
    }
    const finger = { id: e.pointerId, i, x: e.clientX, y: e.clientY, verbraucht: false, uhr: 0 }
    if (wandRef.current.zustand[i] !== OFFEN && spielbar()) {
      finger.uhr = setTimeout(() => {
        if (fingerRef.current !== finger || finger.verbraucht) return
        finger.verbraucht = true
        finger.uhr = 0
        setHalten(-1)
        flaggeSetzen(i)
      }, LANG_MS)
      setHalten(i)
    }
    fingerRef.current = finger
  }

  const fingerLoesen = (f) => {
    if (f?.uhr) clearTimeout(f.uhr)
    setHalten(-1)
  }

  const zeigerZieht = (e) => {
    const f = fingerRef.current
    if (!f || f.verbraucht || f.id !== e.pointerId) return
    if (Math.abs(e.clientX - f.x) > ZIEH_PX || Math.abs(e.clientY - f.y) > ZIEH_PX) {
      f.verbraucht = true
      fingerLoesen(f)
    }
  }

  const zeigerHoch = (e) => {
    const f = fingerRef.current
    if (!f || f.id !== e.pointerId) return
    fingerRef.current = null
    fingerLoesen(f)
    if (f.verbraucht || f.i === undefined) return
    tippen(f.i)
  }

  const zeigerAbbruch = () => {
    fingerLoesen(fingerRef.current)
    fingerRef.current = null
  }

  const tastaturGedrueckt = (e) => {
    if (!laeuft || crashRef.current) return
    if (e.target.closest?.('[data-modus]') && (e.key === 'Enter' || e.key === ' ')) return
    const k = e.key
    const bekannt = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'f', 'F', 'm', 'M']
    if (!bekannt.includes(k)) return
    e.preventDefault()
    if (pauseRef.current) {
      weiter()
      return
    }
    setTastatur(true)
    const [x, y] = lage(cursor)
    if (k === 'ArrowLeft') setCursor(index(Math.max(0, x - 1), y))
    else if (k === 'ArrowRight') setCursor(index(Math.min(SPALTEN - 1, x + 1), y))
    else if (k === 'ArrowUp') setCursor(index(x, Math.max(0, y - 1)))
    else if (k === 'ArrowDown') setCursor(index(x, Math.min(REIHEN - 1, y + 1)))
    else if (k === 'f' || k === 'F') flaggeSetzen(cursor)
    else if (k === 'm' || k === 'M') modusWechseln()
    else if (!e.repeat) bohrWunsch(cursor)
  }

  /* ---------------------------------------------------------------- */
  /* Bild                                                              */
  /* ---------------------------------------------------------------- */

  const zeigeLeitungen = crash || wand.frei
  const markerRest = Math.max(0, wand.anzahl - wand.markiert)
  const noch = Math.max(0, restFuer(wand))
  const knapp = wand.offen > 0 && noch > 0 && noch <= KNAPP_AB && !crash
  const serieAn = serie.n >= 2 && !crash
  const serieProzent = Math.round(serie.stufe * SERIE_ANTEIL * 100)
  const faktor = faktorFuer(wand.nr)

  const fliesen = []
  for (let y = 0; y < REIHEN; y += 1) {
    for (let x = 0; x < SPALTEN; x += 1) {
      const i = index(x, y)
      const zustand = wand.zustand[i]
      const istLeitung = wand.angelegt && wand.leitung[i] === 1
      const zeigen = zeigeLeitungen && istLeitung
      const zahl = zustand === OFFEN ? wand.zahl[i] : 0
      const art = zeigen ? wand.art[i] || 'wasser' : ''
      let text = zeichenFuer(zustand)
      if (zustand === OFFEN) text = zahl ? `${zahl} Leitungen ringsum` : 'frei'
      if (zeigen) text = `${ART_LABEL[art]}leitung`
      fliesen.push(
        <button
          key={i}
          type="button"
          tabIndex={-1}
          className="trm-leitung-zelle"
          data-zelle={`${x},${y}`}
          data-zustand={zeichenFuer(zustand)}
          data-zahl={zahl || undefined}
          data-leitung={zeigen ? art : undefined}
          data-getroffen={wand.getroffen === i ? '1' : undefined}
          data-falsch={zeigeLeitungen && zustand === FLAGGE && !istLeitung ? '1' : undefined}
          data-bohrt={bohrt === i ? '1' : undefined}
          data-halten={halten === i ? '1' : undefined}
          data-cursor={tastatur && cursor === i ? '1' : undefined}
          aria-label={`Spalte ${x + 1}, Reihe ${y + 1}: ${text}`}
        >
          {zeigen && <span className="trm-leitung-rohr" aria-hidden="true" />}
          {zeigen && (
            <span className="trm-leitung-art" aria-hidden="true">
              <ArtSymbol art={art} />
            </span>
          )}
          {zustand === FLAGGE && !zeigen && <Marker />}
          {zahl > 0 && <span className="trm-leitung-zahl">{zahl}</span>}
        </button>,
      )
    }
  }

  return (
    <SpielKarte
      spiel={{ ...SPIEL, leisteLabel: 'WAND', leisteWert: wand.nr, hebel: { wort: 'WAND', punkte: HEBEL_PUNKTE } }}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span className="trm-spiel__combo trm-leitung-faktor" data-an="1" data-serie-stufe={serie.stufe}>
          ×{faktor}
          {serieProzent > 0 && <small className="trm-leitung-faktor-serie"> +{serieProzent}%</small>}
        </span>
      }
    >
      {laeuft && (
        <>
          <div
            className="trm-leitung-buehne"
            ref={buehneRef}
            role="application"
            tabIndex={0}
            aria-label="Leitungsfinder Wand. Pfeiltasten wählen eine Fliese, Enter oder Leertaste bohrt, F markiert eine Leitung, M schaltet den Markiermodus."
            style={{ '--trm-leitung-z': `${z}px`, '--trm-leitung-serie-ms': `${SERIE_MS}ms` }}
            data-sanft={sanft ? '1' : '0'}
            data-crash={crash ? '1' : '0'}
            data-crash-art={crashArt || undefined}
            data-pause={pause ? '1' : '0'}
            data-frei={wand.frei ? '1' : '0'}
            data-geschafft={geschafft ? '1' : '0'}
            data-modus-an={modus === 'markieren' ? '1' : '0'}
            data-wand={wand.nr}
            data-rest={noch}
            data-knapp={knapp ? '1' : '0'}
            data-combo={serie.n}
            data-serie-stufe={serie.stufe}
            onPointerDown={zeigerRunter}
            onPointerMove={zeigerZieht}
            onPointerUp={zeigerHoch}
            onPointerCancel={zeigerAbbruch}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={tastaturGedrueckt}
          >
            <div className="trm-leitung-kopf">
              <span className="trm-leitung-info">
                WAND <b>{wand.nr}</b>
                <span className="trm-leitung-trenner" aria-hidden="true">·</span>
                <span className="trm-leitung-noch">
                  NOCH <b>{noch}</b>
                </span>
              </span>
              <button
                type="button"
                className="trm-leitung-modus"
                data-modus
                aria-pressed={modus === 'markieren'}
                onClick={modusWechseln}
              >
                <Marker />
                MARKIEREN
              </button>
            </div>

            <div className="trm-leitung-wand" key={wand.nr}>
              {fliesen}
            </div>

            <div className="trm-leitung-fuss" aria-hidden="true">
              <div className="trm-leitung-fuss-zeile">
                <span className="trm-leitung-legenden">
                  {ARTEN.filter((art) => wand.arten?.[art] > 0).map((art) => (
                    <span key={art} className="trm-leitung-legende" data-art={art} title={ART_LABEL[art]}>
                      <ArtSymbol art={art} />
                      {wand.arten[art]}
                    </span>
                  ))}
                  <span className="trm-leitung-legende" data-art="marker">
                    <Marker />
                    {markerRest}
                  </span>
                </span>
                <span className="trm-leitung-serie" data-an={serieAn ? '1' : '0'} data-stufe={serie.stufe}>
                  SERIE <b>{serie.n}</b>
                  {serieProzent > 0 && <span className="trm-leitung-serie-bonus">+{serieProzent}%</span>}
                  {serieAn && !geschafft && <i key={serie.nr} className="trm-leitung-serie-zeit" />}
                </span>
              </div>
              <p className="trm-leitung-hinweis">
                {modus === 'markieren' ? 'TIPPEN MARKIERT · SCHALTER AUS ZUM BOHREN' : 'TIPPEN BOHRT · LANG DRÜCKEN MARKIERT'}
              </p>
            </div>

            {geschafft && (
              <div className="trm-leitung-geschafft" role="status">
                <span className="trm-leitung-geschafft-titel">WAND {geschafft.nr} GESCHAFFT</span>
                <span className="trm-leitung-geschafft-bonus">+{geschafft.bonus}</span>
              </div>
            )}

            {crash && <div className="trm-leitung-blitz" data-art={crashArt || undefined} aria-hidden="true" />}
          </div>

          {pause && <p className="trm-spiel__pause">PAUSE — zum Weiterspielen tippen</p>}

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
