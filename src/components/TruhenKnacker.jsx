import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from './SpielKarte.jsx'
import { useSpielLauf } from './spiel-lauf.js'
import {
  MITTE,
  RUNDEN_BONUS,
  STRAFE_MS,
  abstand,
  guete,
  punkteFuer,
  rundeBauen,
} from './truhen-regeln.js'
import { SPIEL_NACH_KEY, TEXTE, fuelle } from '../data/terminal.js'

/**
 * TRUHENKNACKER — das goldene Safe-Schloss.
 *
 * Drei Ringe drehen sich, jeder traegt ein kurzes goldenes Feld. Oben steht
 * eine feste Markierung. Wer tippt, stoppt den aktiven Ring: liegt sein
 * goldenes Feld unter der Markierung, rastet er ein, sonst verkantet das
 * Schloss und kostet Spielzeit. Sind alle Ringe eingerastet, beginnt die
 * naechste Runde — schneller, mit engeren Feldern, mit Gegenlauf, mit
 * Richtungswechseln mitten im Lauf und mit falschen Markierungen, die genauso
 * aussehen wollen wie die echte.
 *
 * Wie steil das ansteigt, steht nicht hier, sondern in truhen-regeln.js.
 *
 * WAS MIT DER ZIEHUNG ZU TUN HAT: NICHTS
 * --------------------------------------
 * Das Ergebnis wird gespeichert — anders als in Version 1 geht es an den
 * Server und steht in einer eigenen Punktetabelle. Es hat aber keinen
 * Einfluss auf die Ziehung und keinen auf die Gewinnchance. Die haengt allein
 * an der Deckelnummer. Ein Gewinnspiel, dessen Chancen sich erspielen lassen,
 * waere ein anderes Gewinnspiel.
 *
 * WARUM KEINE BIBLIOTHEK
 * ----------------------
 * Vier gedrehte SVG-Gruppen brauchen kein Paket. Die Winkel liegen in einem
 * Ref und werden in einem requestAnimationFrame direkt als Attribut
 * geschrieben — React rendert nur, wenn ein Ring einrastet oder eine Runde
 * wechselt. Das sind wenige Renderdurchlaeufe pro Runde statt sechzig pro
 * Sekunde, und genau deshalb laeuft es auch auf einem mittleren Telefon.
 */

const SPIEL = SPIEL_NACH_KEY.truhenknacker
const T = TEXTE.g

/* Tempo, Trefferzonen, Punkte und Combostufen stehen in truhen-regeln.js.
   Sie sind dort ausgelagert, weil scripts/truhen-simulation.mjs sie einliest
   und die Schwierigkeit daran nachrechnet — eine Simulation mit anderen
   Zahlen als denen im Spiel waere wertlos. Hier steht nur noch Darstellung. */

/** Bogenlaenge eines Kreisausschnitts in Nutzereinheiten. */
const bogen = (r, grad) => (2 * Math.PI * r * grad) / 360

function Ring({ ring, zustand, bahnRef }) {
  const { bahn, zone } = ring
  const umfang = 2 * Math.PI * bahn.r
  const feld = bogen(bahn.r, zone)

  return (
    <g className={`trm-ring trm-ring--${zustand}`}>
      {/* Die Bahn selbst. Sie dreht sich nicht. */}
      <circle
        className="trm-ring__bahn"
        cx={MITTE}
        cy={MITTE}
        r={bahn.r}
        strokeWidth={bahn.dicke}
      />
      {/* Alles, was sich dreht, haengt in dieser Gruppe. */}
      <g ref={bahnRef} transform={`rotate(${ring.start} ${MITTE} ${MITTE})`}>
        {ring.attrappen.map((a) => (
          <circle
            key={a.winkel}
            className="trm-ring__attrappe"
            cx={MITTE}
            cy={MITTE}
            r={bahn.r}
            strokeWidth={bahn.dicke}
            strokeDasharray={`${bogen(bahn.r, a.breite)} ${umfang}`}
            transform={`rotate(${-90 + a.winkel - a.breite / 2} ${MITTE} ${MITTE})`}
          />
        ))}
        <circle
          className="trm-ring__zone"
          cx={MITTE}
          cy={MITTE}
          r={bahn.r}
          strokeWidth={bahn.dicke}
          strokeDasharray={`${feld} ${umfang}`}
          transform={`rotate(${-90 - zone / 2} ${MITTE} ${MITTE})`}
        />
      </g>
      {/* Die Markierung des aktiven Rings: ein kurzer goldener Strich oben. */}
      {zustand === 'aktiv' && (
        <line
          className="trm-ring__marke"
          x1={MITTE}
          y1={MITTE - bahn.r - bahn.dicke / 2 - 3}
          x2={MITTE}
          y2={MITTE - bahn.r + bahn.dicke / 2 + 3}
        />
      )}
    </g>
  )
}

export default function TruhenKnacker({ sitzung, best = null, onErgebnis }) {
  const [runde, setRunde] = useState(1)
  const [ringe, setRinge] = useState([])
  const [aktiv, setAktiv] = useState(0)
  const [combo, setCombo] = useState(0)
  const [meldung, setMeldung] = useState(null)

  /* Der Spielzustand, den die Animation sechzigmal pro Sekunde anfasst. Er
     liegt bewusst nicht im State: sonst waere jeder Frame ein Render. */
  const zustandRef = useRef([])
  const bahnRefs = useRef([])
  const aktivRef = useRef(0)
  const comboRef = useRef(0)
  const meldungNrRef = useRef(0)
  const sanftRef = useRef(false)

  const lauf = useSpielLauf({ sitzung, game: 'truhenknacker', onErgebnis })
  const { laeuft, punkteGeben, rundeZaehlen, zeitStrafe, starten: laufStarten } = lauf

  /* Einmal nachsehen, ob jemand weniger Bewegung moechte. */
  useEffect(() => {
    try {
      sanftRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      sanftRef.current = false
    }
  }, [])

  const rundeStarten = useCallback((nummer) => {
    const neu = rundeBauen(nummer, sanftRef.current)
    zustandRef.current = neu.map((ring) => ({
      winkel: ring.start,
      richtung: ring.richtung,
      wechselMs: ring.wechselMs,
      letzterWechsel: 0,
      fest: false,
    }))
    bahnRefs.current = []
    aktivRef.current = 0
    setRinge(neu)
    setAktiv(0)
    setRunde(nummer)
  }, [])

  /**
   * Eigener Start: erst beim Server anmelden, dann das Schloss aufbauen. So
   * haengt der Spielaufbau am Ergebnis der Anmeldung und nicht an einem
   * Effekt, der den Phasenwechsel nachtraeglich bemerkt.
   */
  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    comboRef.current = 0
    setCombo(0)
    setMeldung(null)
    rundeStarten(1)
    return true
  }, [laufStarten, rundeStarten])

  /* Die Einblendung verschwindet von selbst. Ohne diesen Zeitgeber bliebe sie
     bei abgeschalteten Animationen dauerhaft stehen. */
  useEffect(() => {
    if (!meldung) return undefined
    const uhr = setTimeout(() => setMeldung(null), 950)
    return () => clearTimeout(uhr)
  }, [meldung])

  /* Die Drehung. Ein einziger Frame-Zyklus fuer alle Ringe. */
  useEffect(() => {
    if (!laeuft) return undefined

    let frame = 0
    let vorher = performance.now()

    const schritt = (jetzt) => {
      const dt = Math.min(0.05, (jetzt - vorher) / 1000)
      vorher = jetzt

      const stand = zustandRef.current
      for (let i = 0; i < stand.length; i += 1) {
        const s = stand[i]
        if (s.fest) continue

        if (s.wechselMs > 0 && jetzt - s.letzterWechsel > s.wechselMs) {
          s.richtung *= -1
          s.letzterWechsel = jetzt
        }

        const ring = ringe[i]
        if (!ring) continue
        s.winkel = (s.winkel + ring.tempo * dt * s.richtung + 360) % 360

        const el = bahnRefs.current[i]
        if (el) el.setAttribute('transform', `rotate(${s.winkel.toFixed(2)} ${MITTE} ${MITTE})`)
      }

      frame = requestAnimationFrame(schritt)
    }

    frame = requestAnimationFrame(schritt)
    return () => cancelAnimationFrame(frame)
  }, [laeuft, ringe])

  /** Eine kurze Einblendung in der Feldmitte. Der Zaehler startet die Animation neu. */
  const melden = useCallback((art, text) => {
    meldungNrRef.current += 1
    setMeldung({ nr: meldungNrRef.current, art, text })
  }, [])

  /**
   * Der Tipp. Er trifft immer den aktiven Ring, egal wo im Feld er landet —
   * auf einem Telefon will niemand einen zwoelf Pixel breiten Bogen treffen.
   */
  const stoppen = useCallback(() => {
    if (!laeuft) return

    const i = aktivRef.current
    const ring = ringe[i]
    const stand = zustandRef.current[i]
    if (!ring || !stand || stand.fest) return

    const weg = Math.abs(abstand(stand.winkel))
    const art = guete(weg, ring.zone)

    /* Vorbei. Das Schloss verkantet, die Combo ist weg, Sekunden sind weg. */
    if (art === null) {
      comboRef.current = 0
      setCombo(0)
      const abgezogen = zeitStrafe(STRAFE_MS)
      melden(
        'verkantet',
        abgezogen > 0
          ? `${T.verkantet} ${fuelle(T.strafe, { sek: Math.round(abgezogen / 1000) })}`
          : T.verkantet,
      )
      return
    }

    /* Getroffen. Die Combo waechst nur bei gut und perfekt weiter — ein gerade
       noch erwischter Ring haelt sie, hebt sie aber nicht. */
    if (art === 'treffer') {
      if (comboRef.current < 1) comboRef.current = 1
    } else {
      comboRef.current += 1
    }
    setCombo(comboRef.current)

    const wert = punkteFuer(art, comboRef.current)
    punkteGeben(wert)
    melden(art, `${art === 'perfekt' ? T.perfekt : art === 'gut' ? T.gut : T.treffer} +${wert}`)

    stand.fest = true
    const naechster = i + 1

    if (naechster < ringe.length) {
      aktivRef.current = naechster
      setAktiv(naechster)
      return
    }

    /* Runde geschafft. Bonus, dann eine Stufe schwerer. */
    rundeZaehlen()
    punkteGeben(RUNDEN_BONUS * runde)
    rundeStarten(runde + 1)
  }, [
    laeuft,
    ringe,
    runde,
    melden,
    punkteGeben,
    rundeZaehlen,
    zeitStrafe,
    rundeStarten,
  ])

  function taste(ereignis) {
    if (ereignis.key === ' ' || ereignis.key === 'Enter') {
      ereignis.preventDefault()
      stoppen()
    }
  }

  return (
    <SpielKarte
      spiel={SPIEL}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span className="trm-spiel__combo" data-an={combo >= 2 ? '1' : '0'}>
          {combo >= 2 ? fuelle(T.combo, { n: combo }) : ''}
        </span>
      }
    >
      {laeuft && (
        <>
          <p className="trm-ring-runde">
            {T.runde} <span className="trm-spiel__wert">{runde}</span>
          </p>

          <button
            type="button"
            className="trm-ring-taste"
            onPointerDown={stoppen}
            onKeyDown={taste}
            aria-label={T.stoppen}
          >
            <svg className="trm-ring-feld" viewBox="0 0 220 220" aria-hidden="true">
              {/* Der feste Zeiger ueber dem aeussersten Ring. */}
              <path className="trm-ring__zeiger" d="M110 3 L103 15 L117 15 Z" />
              {/* Der Kern. Nur Optik — ein Schloss braucht eine Mitte. */}
              <circle className="trm-ring__kern" cx={MITTE} cy={MITTE} r={18} />
              {/* Die Ringe rasten von aussen nach innen ein, also sagt der
                  aktive Index alles: davor fest, danach offen. */}
              {ringe.map((ring, i) => (
                <Ring
                  key={`${runde}-${i}`}
                  ring={ring}
                  zustand={i < aktiv ? 'fest' : i === aktiv ? 'aktiv' : 'offen'}
                  bahnRef={(el) => {
                    bahnRefs.current[i] = el
                  }}
                />
              ))}
            </svg>
          </button>

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
