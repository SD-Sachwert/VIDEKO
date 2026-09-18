import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from './SpielKarte.jsx'
import { useSpielLauf } from './spiel-lauf.js'
import { istPausiert } from './spiele/spiel-pause.js'
import { SPIEL_NACH_KEY, TEXTE } from '../data/terminal.js'

/**
 * KUECHEN-STACK — ein Tipp, ein Modul.
 *
 * Ein Kuechenmodul faehrt ueber dem Turm hin und her. Ein Tipp setzt es ab.
 * Was ueber das Modul darunter hinaussteht, wird abgeschnitten und faellt
 * herunter; das naechste Modul ist nur noch so breit wie der Rest. Wer ganz
 * danebentippt, beendet die Runde.
 *
 * Genau getroffen heisst PERFECT: nichts wird abgeschnitten, und jede weitere
 * perfekte Landung in Folge hebt den Faktor auf ×2, ×3 und ×4. Ab drei
 * perfekten Landungen waechst das Modul ein kleines Stueck zurueck — sonst
 * waere eine gute Serie nur ein Aufschub.
 *
 * Die ersten fuenf Module sind mit Absicht leicht: langsamer und mit einer
 * grosszuegigeren PERFECT-Toleranz. Wer das Spiel zum ersten Mal sieht, soll
 * PERFECT einmal erleben, bevor es ernst wird.
 *
 * DER SERVER RECHNET MIT
 * ---------------------
 * Je Modul hoechstens 4 × 100 Punkte und mindestens 280 ms bis zum Absetzen
 * (api/_terminal-kern.js, SPIELE.kuechen_stack). Deshalb zaehlt jedes Modul als
 * Runde, und ein Tipp innerhalb von SPERRE_MS nach dem Auftauchen wird
 * ignoriert. Weil das Spielfeld sofort startet und das Laufticket parallel
 * kommt, zaehlt die Sperre ab dem spaeteren der beiden Zeitpunkte. Ein
 * ehrlicher Lauf kommt so nie in die Naehe der Grenzen.
 *
 * WIE ES FLUESSIG BLEIBT
 * ----------------------
 * Das fahrende Modul schreibt ein einziges requestAnimationFrame direkt als
 * `transform`. React rendert nur beim Absetzen. Vom Turm stehen hoechstens
 * SICHTBAR Module im DOM — was darunter liegt, ist ohnehin aus dem Bild.
 *
 * Und wie bei allen Spielen: kein Einfluss auf die Ziehung.
 */

const SPIEL = SPIEL_NACH_KEY.kuechen_stack
const T = TEXTE.g

const START_BREITE = 0.62 // Anteil der Feldbreite
const MODUL_HOEHE = 0.09 // Anteil der Feldhoehe
const SICHTBAR = 14
const PERFEKT_TOLERANZ = 0.016 // Anteil der Feldbreite
const PERFEKT_TOLERANZ_START = 0.03 // die ersten LEICHT_BIS Module
const LEICHT_BIS = 5
const FAKTOR_MAX = 4
const SPERRE_MS = 300
const NACHWACHSEN = 0.03
const CRASH_MS = 450

/** Punkte je Modul: perfekt 100 × Faktor, sonst nach getroffenem Anteil. */
function punkteFuer(perfekt, faktor, anteil) {
  if (perfekt) return 100 * faktor
  return Math.round(30 + 60 * anteil)
}

/**
 * Das Tempo zur Hoehe. Die ersten fuenf Module sind gemuetlich, danach zieht
 * es spuerbar an. Ab Modul 8 kommt die Richtung von einer zufaelligen Seite,
 * ab 14 schwankt das Tempo innerhalb einer Bahn, ab 22 kann das Modul
 * einmal unterwegs umdrehen. Jede Aenderung bleibt lesbar: nie mehr als
 * eine Ueberraschung je Modul.
 */
function bahnFuer(hoehe) {
  const tempo = Math.min(1.4, 0.36 + hoehe * 0.018 + Math.max(0, hoehe - LEICHT_BIS) * 0.022)
  return {
    tempo,
    zufallsSeite: hoehe >= 8,
    schwanken: hoehe >= 14,
    umdrehen: hoehe >= 22 && Math.random() < 0.35,
  }
}

function summen(stark) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(stark)
  } catch {
    /* kein Vibrationsmotor, kein Problem */
  }
}

/** Ein Kuechenmodul: Korpus, Arbeitsplatte, Griffleiste. Rein dekorativ. */
function Modul({ perfekt = false }) {
  return (
    <span className={`trm-stack-modul__koerper${perfekt ? ' trm-stack-modul__koerper--perfekt' : ''}`}>
      <span className="trm-stack-modul__platte" />
      <span className="trm-stack-modul__griff" />
    </span>
  )
}

/* Der Schluessel dieses Spiels — er steht im Lauf und im Pause-Register. */
const GAME = 'kuechen_stack'

export default function KuechenStack({ sitzung, best = null, onErgebnis }) {
  const [turm, setTurm] = useState([])
  const [abfall, setAbfall] = useState([])
  const [meldung, setMeldung] = useState(null)
  const [funken, setFunken] = useState(null)
  const [faktor, setFaktor] = useState(1)
  const [pause, setPause] = useState(false)
  const [crash, setCrash] = useState(false)
  const [sanft, setSanft] = useState(false)

  const buehneRef = useRef(null)
  const fahrerRef = useRef(null)
  const masseRef = useRef({ breite: 300, hoehe: 300 })
  const turmRef = useRef([])
  const fahrt = useRef({ x: 0, b: START_BREITE, richtung: 1, bahn: bahnFuer(0), seit: 0, umgedreht: false, t: 0 })
  const serieRef = useRef(0)
  const nrRef = useRef(0)
  const pauseRef = useRef(false)
  const crashRef = useRef(false)
  const sanftRef = useRef(false)

  const lauf = useSpielLauf({ sitzung, game: GAME, dauerVorgabe: 540000, onErgebnis, sofort: true })
  const { laeuft, punkteGeben, rundeZaehlen, fertig, starten: laufStarten, ticketSeitRef } = lauf

  useEffect(() => {
    let wert
    try {
      wert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      wert = false
    }
    sanftRef.current = wert
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSanft(wert)
  }, [])

  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    const messen = () => {
      masseRef.current = { breite: el.clientWidth || 300, hoehe: el.clientHeight || 300 }
    }
    messen()
    if (typeof ResizeObserver !== 'function') {
      window.addEventListener('resize', messen)
      return () => window.removeEventListener('resize', messen)
    }
    const beobachter = new ResizeObserver(messen)
    beobachter.observe(el)
    return () => beobachter.disconnect()
  }, [laeuft])

  /* Wer den Tab wechselt, findet das Spiel angehalten vor. Weiter geht es
     mit einem Tipp — und dieser Tipp setzt kein Modul ab. */
  useEffect(() => {
    if (!laeuft) return undefined
    const wechsel = () => {
      if (document.hidden && !crashRef.current) {
        pauseRef.current = true
        setPause(true)
      }
    }
    document.addEventListener('visibilitychange', wechsel)
    return () => document.removeEventListener('visibilitychange', wechsel)
  }, [laeuft])

  const melden = useCallback((art, text) => {
    nrRef.current += 1
    setMeldung({ nr: nrRef.current, art, text })
  }, [])

  useEffect(() => {
    if (!meldung) return undefined
    const uhr = setTimeout(() => setMeldung(null), 900)
    return () => clearTimeout(uhr)
  }, [meldung])

  useEffect(() => {
    if (!abfall.length) return undefined
    const uhr = setTimeout(() => setAbfall([]), 900)
    return () => clearTimeout(uhr)
  }, [abfall])

  useEffect(() => {
    if (!funken) return undefined
    const uhr = setTimeout(() => setFunken(null), 700)
    return () => clearTimeout(uhr)
  }, [funken])

  /** Das naechste Modul auf die Bahn schicken. */
  const neuesModul = useCallback(() => {
    const hoehe = turmRef.current.length
    const oben = turmRef.current[hoehe - 1]
    const bahn = bahnFuer(hoehe)
    const richtung = bahn.zufallsSeite ? (Math.random() < 0.5 ? 1 : -1) : hoehe % 2 ? -1 : 1
    const b = oben ? oben.b : START_BREITE
    fahrt.current = {
      x: richtung === 1 ? -b * 0.55 : 1 - b * 0.45,
      b,
      richtung,
      bahn,
      seit: Date.now(),
      umgedreht: false,
      umdrehBei: 0.3 + Math.random() * 0.35,
      t: 0,
    }
  }, [])

  /* Die Bewegung des fahrenden Moduls. */
  useEffect(() => {
    if (!laeuft) return undefined
    let frame = 0
    let vorher = performance.now()

    const schritt = (jetzt) => {
      /* Minimiert steht die Runde still. Der Zeitanker wandert mit,
         sonst kaeme der erste Frame danach mit einem dt von mehreren
         Sekunden zurueck und rechnete die Runde in einem Schritt zu
         Ende. */
      if (istPausiert(GAME)) {
        vorher = jetzt
        frame = requestAnimationFrame(schritt)
        return
      }
      const dt = Math.min(0.05, (jetzt - vorher) / 1000)
      vorher = jetzt

      const f = fahrt.current
      if (!pauseRef.current && !crashRef.current) {
        f.t += dt
        let tempo = f.bahn.tempo * (sanftRef.current ? 0.8 : 1)
        if (f.bahn.schwanken) tempo *= 0.75 + 0.35 * (0.5 + 0.5 * Math.sin(f.t * 4.2))
        f.x += f.richtung * tempo * dt

        const links = -f.b * 0.55
        const rechts = 1 - f.b * 0.45
        const mitte = (f.x + f.b / 2 - links) / (rechts + f.b / 2 - links)
        if (f.bahn.umdrehen && !f.umgedreht && (f.richtung === 1 ? mitte > f.umdrehBei + 0.2 : mitte < 0.8 - f.umdrehBei)) {
          f.umgedreht = true
          f.richtung *= -1
        }
        if (f.x < links) {
          f.x = links
          f.richtung = 1
        } else if (f.x > rechts) {
          f.x = rechts
          f.richtung = -1
        }
      }

      const el = fahrerRef.current
      if (el) {
        const { breite } = masseRef.current
        el.style.width = `${(f.b * breite).toFixed(1)}px`
        el.style.transform = `translateX(${(f.x * breite).toFixed(1)}px)`
      }
      frame = requestAnimationFrame(schritt)
    }

    frame = requestAnimationFrame(schritt)
    return () => cancelAnimationFrame(frame)
  }, [laeuft])

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    const basis = { x: (1 - START_BREITE) / 2, b: START_BREITE, nr: 0, perfekt: false }
    turmRef.current = [basis]
    serieRef.current = 0
    pauseRef.current = false
    crashRef.current = false
    setTurm([basis])
    setAbfall([])
    setMeldung(null)
    setFunken(null)
    setFaktor(1)
    setPause(false)
    setCrash(false)
    neuesModul()
    return true
  }, [laufStarten, neuesModul])

  /** Der eine Tipp. */
  const tippen = useCallback(() => {
    if (!laeuft || crashRef.current) return
    if (pauseRef.current) {
      pauseRef.current = false
      setPause(false)
      return
    }
    const f = fahrt.current
    const ticketSeit = ticketSeitRef.current
    if (!ticketSeit || Date.now() - Math.max(f.seit, ticketSeit) < SPERRE_MS) return

    const liste = turmRef.current
    const oben = liste[liste.length - 1]
    const links = Math.max(f.x, oben.x)
    const rechts = Math.min(f.x + f.b, oben.x + oben.b)
    const ueberlapp = rechts - links

    /* Ganz daneben: das Modul faellt, die Runde ist vorbei. */
    if (ueberlapp <= 0.004) {
      crashRef.current = true
      setCrash(true)
      setAbfall([{ id: `weg-${liste.length}`, x: f.x, b: f.b, stufe: liste.length, seite: f.x < oben.x ? -1 : 1 }])
      melden('verkantet', T.daneben)
      summen([60, 40, 90])
      setTimeout(() => fertig(), CRASH_MS)
      return
    }

    const toleranz = liste.length <= LEICHT_BIS ? PERFEKT_TOLERANZ_START : PERFEKT_TOLERANZ
    const perfekt = Math.abs(f.x - oben.x) <= toleranz
    let neu
    if (perfekt) {
      serieRef.current += 1
      const b = serieRef.current >= 3 ? Math.min(START_BREITE, oben.b + NACHWACHSEN) : oben.b
      const x = oben.x - (b - oben.b) / 2
      neu = { x, b, nr: liste.length, perfekt: true }
    } else {
      serieRef.current = 0
      neu = { x: links, b: ueberlapp, nr: liste.length, perfekt: false }
      /* Der Ueberstand faellt ab — links oder rechts, je nachdem wo er war. */
      const abX = f.x < oben.x ? f.x : rechts
      const abB = f.b - ueberlapp
      if (abB > 0.002) {
        setAbfall([{ id: `ab-${liste.length}`, x: abX, b: abB, stufe: liste.length, seite: f.x < oben.x ? -1 : 1 }])
      }
    }

    const stufeFaktor = perfekt ? Math.min(FAKTOR_MAX, serieRef.current) : 1
    const wert = punkteFuer(perfekt, stufeFaktor, ueberlapp / f.b)
    turmRef.current = [...liste, neu]
    setTurm(turmRef.current.slice(-SICHTBAR))
    rundeZaehlen()
    punkteGeben(wert)
    setFaktor(stufeFaktor)

    if (perfekt) {
      melden('perfekt', stufeFaktor > 1 ? `${T.perfekt} ×${stufeFaktor}` : T.perfekt)
      if (!sanftRef.current) setFunken({ nr: liste.length, x: neu.x + neu.b / 2 })
      summen(stufeFaktor > 1 ? [18, 30, 18] : 16)
    } else {
      summen(8)
    }

    neuesModul()
  }, [laeuft, fertig, melden, neuesModul, punkteGeben, rundeZaehlen, ticketSeitRef])

  const tastatur = useCallback(
    (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        tippen()
      }
    },
    [tippen],
  )

  /* Die Kamera: ab der sechsten Etage wandert der Turm nach unten, damit das
     fahrende Modul immer im oberen Drittel bleibt. */
  const hoehe = Math.max(0, turm.length ? turm[turm.length - 1].nr : 0)
  const kamera = Math.max(0, hoehe - 5)

  return (
    <SpielKarte
      spiel={{ ...SPIEL, leisteLabel: T.hoehe, leisteWert: hoehe }}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span className="trm-spiel__combo" data-an={faktor >= 2 ? '1' : '0'}>
          {faktor >= 2 ? `×${faktor}` : ''}
        </span>
      }
    >
      {laeuft && (
        <>
          <div
            className="trm-stack-buehne"
            ref={buehneRef}
            role="button"
            tabIndex={0}
            aria-label={T.stapeln}
            data-sanft={sanft ? '1' : '0'}
            data-crash={crash ? '1' : '0'}
            style={{ '--stack-h': MODUL_HOEHE, '--stack-kamera': kamera }}
            onPointerDown={(e) => {
              e.preventDefault()
              tippen()
            }}
            onKeyDown={tastatur}
          >
            <span className="trm-stack-boden" aria-hidden="true" />
            <div className="trm-stack-turm" aria-hidden="true">
              {turm.map((m) => (
                <span
                  key={m.nr}
                  className="trm-stack-modul"
                  style={{ '--x': m.x, '--b': m.b, '--stufe': m.nr }}
                >
                  <Modul perfekt={m.perfekt} />
                </span>
              ))}
              {abfall.map((m) => (
                <span
                  key={m.id}
                  className="trm-stack-modul trm-stack-modul--faellt"
                  style={{ '--x': m.x, '--b': m.b, '--stufe': m.stufe, '--seite': m.seite }}
                >
                  <Modul />
                </span>
              ))}
              {funken && (
                <span
                  key={funken.nr}
                  className="trm-stack-funken"
                  style={{ '--x': funken.x, '--stufe': funken.nr }}
                >
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i} style={{ '--w': `${i * 45}deg` }} />
                  ))}
                </span>
              )}
            </div>
            {!crash && (
              <span
                className="trm-stack-modul trm-stack-modul--faehrt"
                ref={fahrerRef}
                aria-hidden="true"
                style={{ '--stufe': hoehe + 1 }}
              >
                <Modul />
              </span>
            )}
            <span className="trm-stack-tipp" aria-hidden="true">
              {T.tippen}
            </span>
          </div>

          {pause && <p className="trm-spiel__pause">{T.pause}</p>}

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
