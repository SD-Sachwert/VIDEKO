import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { istPausiert } from './spiel-pause.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  FRONTEN_MAX,
  SPIELZEIT_MS,
  STRAFE_MS,
  chaosAktiv,
  frostAktiv,
  meldungFuer,
  offeneFronten,
  schlagen,
  spielStart,
  spruch,
  takt,
} from './slam-logik.js'
import { HAPTIK, domSchicht, klang, klangSchliessen, sanftHoeren, vibrieren } from './spielgefuehl.js'
import './spielgefuehl.css'
import './slam.css'

/**
 * VIDEKO SLAM — sechstes Hauptgame, kein Testslot mehr.
 *
 * Aus neun Fronten kommt das ganze VIDEKO-Feld heraus: Werkzeug, Licht, Bad,
 * Boden, Decke, Elektro, Photovoltaik — und ebenso oft Mist, der in den
 * Container gehoert. Wer das Richtige antippt, bekommt Punkte; wer danebengreift,
 * verliert die Serie und Zeit. Katalog und Wertung stehen in slam-objekte.js und
 * slam-logik.js und sind in scripts/spiele/slam-logik-test.mjs geprueft — hier
 * geht es nur um Finger, Bild und Ton.
 *
 * STEUERUNG
 * ---------
 * Eine Front ist eine grosse Taste. Tippen schlaegt zu. Auf der Tastatur
 * liegen die Ziffern 1 bis 9 auf denselben Plaetzen wie auf dem Feld.
 *
 * WENIG TEXT
 * ----------
 * Unter jedem Bild steht ein Wort, sonst nichts. Die Rufe ueber dem Feld sind
 * kurz und laufen reihum, damit nicht zweimal derselbe faellt.
 *
 * TEST-HOOKS
 * ----------
 * Buehne: data-stufe, data-combo, data-frost, data-chaos.
 * Front: [data-front], data-belegt, data-ding, data-art.
 */

const SPIEL = SPIEL_NACH_KEY.videko_slam

/** Das echte VIDEKO-Zeichen. Kein nachgebautes V. */
const EMBLEM = '/favicon-512.png'

/* Ein guter Treffer in laufender Serie: 100 Basis, mal 2 Combo, plus Tempo. */
const HEBEL_PUNKTE = 220
/** Was ein Fehlgriff kostet — dieselbe Zahl wie in der Logik, mit Komma. */
const STRAFE_TEXT = `−${String(STRAFE_MS / 1000).replace('.', ',')} s`
const MELDUNG_MS = 1000
const SCHLAG_MS = 340
const VERPASST_RUF = 3

/* ------------------------------------------------------------------ */
/* Strichzeichnungen                                                   */
/* ------------------------------------------------------------------ */

/**
 * Ein Motiv je `bild`-Schluessel aus slam-objekte.js. Alles ist Strich auf
 * durchsichtigem Grund, damit Gutes und Mist gleich aussehen: erkannt wird das
 * Ding, nicht die Farbe. Nur die Speziale duerfen leuchten.
 */
const LINIEN = {
  schrauber: (
    <>
      <path d="M14 20h22v14H14z" />
      <path d="M36 24h8v6h-8" />
      <path d="M44 27h6" />
      <path d="M20 34v10h12V34" />
      <path d="M18 44h16v6H18z" />
    </>
  ),
  pv: (
    <>
      <path d="M10 16h44l-6 26H16z" />
      <path d="M18 16 14 42M32 16v26M46 16l4 26" />
      <path d="M13 29h38" />
      <path d="M32 42v8M24 50h16" />
    </>
  ),
  leuchte: (
    <>
      <path d="M32 8v10" />
      <path d="M18 34 32 18l14 16z" />
      <path d="M22 34h20" />
      <path d="M26 44l-3 6M32 46v6M38 44l3 6" />
    </>
  ),
  armatur: (
    <>
      <path d="M20 50h24" />
      <path d="M24 50V30c0-8 6-12 12-12s10 4 10 10v6" />
      <path d="M46 34v8" />
      <path d="M18 40h10" />
      <path d="M40 14c2-2 2-4 0-6M46 12c2-2 2-4 0-6" />
    </>
  ),
  stuhl: (
    <>
      <path d="M18 34h28" />
      <path d="M20 34 22 12h20l2 22" />
      <path d="M22 22h20" />
      <path d="M20 34l-4 18M44 34l4 18" />
      <path d="M18 44h28" />
    </>
  ),
  waschtisch: (
    <>
      <path d="M10 28h44" />
      <path d="M14 28c0 12 8 18 18 18s18-6 18-18" />
      <path d="M32 20v-6h10v8" />
      <path d="M28 36h8" />
    </>
  ),
  kochmuetze: (
    <>
      <path d="M20 40V26a8 8 0 0 1 6-8 8 8 0 0 1 12-2 8 8 0 0 1 6 10v14" />
      <path d="M18 40h28v8H18z" />
      <path d="M26 26v14M38 26v14" />
    </>
  ),
  schluessel: (
    <>
      <path d="M14 26 26 14l12 12" />
      <path d="M18 26v10h16V26" />
      <path d="M34 34h16" />
      <path d="M44 34v8M50 34v6" />
      <circle cx="26" cy="30" r="3" />
    </>
  ),
  barren: (
    <>
      <path d="M12 44h40l-6-16H18z" />
      <path d="M18 28l4-6h20l4 6" />
      <path d="M22 36h20" />
    </>
  ),
  diele: (
    <>
      <path d="M8 22h48v20H8z" />
      <path d="M8 30h48M8 36h48" />
      <path d="M24 22v8M40 30v6M18 36v6" />
      <path d="M56 26h4M56 38h4" />
    </>
  ),
  dose: (
    <>
      <circle cx="32" cy="32" r="16" />
      <circle cx="26" cy="32" r="2.6" />
      <circle cx="38" cy="32" r="2.6" />
      <path d="M32 16v-6M32 48v6" />
    </>
  ),
  decke: (
    <>
      <path d="M8 18h48" />
      <path d="M8 18v6h48v-6" />
      <path d="M26 24v4h12v-4" />
      <path d="M28 34c0 6 8 6 8 0" />
      <path d="M20 40l-4 8M32 40v10M44 40l4 8" />
    </>
  ),
  klobuerste: (
    <>
      <path d="M32 8v20" />
      <circle cx="32" cy="34" r="8" />
      <path d="M24 30l-4-3M40 30l4-3M24 38l-4 3M40 38l4 3" />
      <path d="M22 46h20l-3 10H25z" />
    </>
  ),
  ziegel: (
    <>
      <path d="M10 22h44v20H10z" />
      <path d="M30 22l4 8-6 4 5 8" />
      <path d="M14 46l-2 6M50 46l2 6" />
    </>
  ),
  schuh: (
    <>
      <path d="M10 42c0-10 4-14 4-22h10l4 8 14 4c8 2 12 4 12 10z" />
      <path d="M10 42h44v6H10z" />
      <path d="M24 28l-4 4M30 32l-4 4" />
    </>
  ),
  kabelsalat: (
    <>
      <path d="M12 40c6-14 14 8 20-4s10 12 18 0" />
      <path d="M16 20c8 10 20-6 26 6s8 8 8 8" />
      <path d="M12 52h6M46 52h6" />
    </>
  ),
  toast: (
    <>
      <path d="M16 30c0-6 4-10 8-10h16c4 0 8 4 8 10v18H16z" />
      <path d="M12 26c0-4 3-6 4-2M52 26c0-4-3-6-4-2" />
      <path d="M26 20c0-6 6-4 4-10M38 20c0-6 6-4 4-10" />
    </>
  ),
  muellsack: (
    <>
      <path d="M22 18c0 6-8 10-8 20 0 10 8 16 18 16s18-6 18-16c0-10-8-14-8-20" />
      <path d="M22 18l10 4 10-4" />
      <path d="M26 34c2 6 10 6 12 0" />
    </>
  ),
  saege: (
    <>
      <path d="M8 24h36l-4 10H12z" />
      <path d="M12 34l4 4 4-4 4 4 4-4 4 4 4-4 4 4" />
      <path d="M44 24l10-6 4 6-8 8" />
    </>
  ),
  kuehlschrank: (
    <>
      <path d="M16 8h32v48H16z" />
      <path d="M16 26h32" />
      <path d="M22 16v6M22 34v8" />
      <path d="M38 40v-6M34 37h8M35 34l6 6M41 34l-6 6" />
    </>
  ),
  backofen: (
    <>
      <path d="M12 12h40v40H12z" />
      <path d="M12 24h40" />
      <circle cx="20" cy="18" r="2" />
      <circle cx="28" cy="18" r="2" />
      <path d="M20 32h24v14H20z" />
      <path d="M30 44c-4-4 2-6 0-10 6 2 6 8 4 10" />
    </>
  ),
  sirene: (
    <>
      <path d="M22 40c0-12 4-20 10-20s10 8 10 20z" />
      <path d="M16 40h32v6H16z" />
      <path d="M22 46v6M42 46v6" />
      <path d="M12 26c0-6 2-10 2-10M52 26c0-6-2-10-2-10" />
    </>
  ),
  ente: (
    <>
      <path d="M14 40c0-8 8-12 18-12 4-8 12-10 16-4 4 6-2 10-2 10 6 2 8 6 8 10H20z" />
      <path d="M48 24h8" />
      <circle cx="44" cy="20" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 44h40" />
    </>
  ),
}

function Bild({ name }) {
  if (name === 'emblem') {
    return <img className="trm-slam-emblem" src={EMBLEM} alt="" width="52" height="52" draggable="false" />
  }
  return (
    <svg
      className="trm-slam-svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {LINIEN[name] || LINIEN.ziegel}
    </svg>
  )
}

/* ------------------------------------------------------------------ */

/* Der Schluessel dieses Spiels — er steht im Lauf und im Pause-Register. */
const GAME = 'videko_slam'

export default function VidekoSlam({ sitzung, best, onErgebnis }) {
  const [fronten, setFronten] = useState(() => Array.from({ length: FRONTEN_MAX }, () => null))
  const [offen, setOffen] = useState(6)
  const [stufe, setStufe] = useState(1)
  const [combo, setCombo] = useState(0)
  const [frost, setFrost] = useState(false)
  const [chaos, setChaos] = useState(false)
  const [schlag, setSchlag] = useState(null)
  const [meldung, setMeldung] = useState(null)
  const [sanft, setSanft] = useState(false)

  const buehneRef = useRef(null)
  const feldRef = useRef(null)
  const schichtElRef = useRef(null)
  const schichtRef = useRef(null)
  const knoepfeRef = useRef([])
  const zustandRef = useRef(null)
  const sanftRef = useRef(false)
  const endeRef = useRef(false)
  const nrRef = useRef(0)
  const spruchRef = useRef({ fehler: 0, verpasst: 0, serie: 0 })

  const lauf = useSpielLauf({ sitzung, game: GAME, dauerVorgabe: SPIELZEIT_MS, onErgebnis })
  const { laeuft, punkteGeben, rundeZaehlen, zeitStrafe, fertig, starten: laufStarten } = lauf

  /* Reduced Motion wird mitgehoert, nicht nur einmal gelesen. */
  useEffect(() => {
    const setzen = (wert) => {
      sanftRef.current = wert
      setSanft(wert)
    }
    return sanftHoeren(setzen)
  }, [])

  /* Kein Ton lebt im Hintergrund weiter. */
  useEffect(() => () => klangSchliessen(), [])

  /* Die Effektschicht liegt ueber dem Feld: Zahlen duerfen ueber den Rand
     einer Front hinaus aufsteigen. */
  useEffect(() => {
    const el = schichtElRef.current
    if (!el) return undefined
    const schicht = domSchicht(el)
    schichtRef.current = schicht
    return () => {
      schichtRef.current = null
      schicht.schliessen()
    }
  }, [laeuft])

  /** Mitte einer Front als Prozentwert des Feldes — so rechnet die Schicht. */
  const frontPunkt = useCallback((platz) => {
    const feld = feldRef.current
    const el = knoepfeRef.current[platz]
    if (!feld || !el) return { x: 50, y: 50 }
    const rf = feld.getBoundingClientRect()
    const re = el.getBoundingClientRect()
    return {
      x: ((re.left + re.width / 2 - rf.left) / (rf.width || 1)) * 100,
      y: ((re.top + re.height / 2 - rf.top) / (rf.height || 1)) * 100,
    }
  }, [])

  const melden = useCallback((art, text, klein) => {
    nrRef.current += 1
    setMeldung({ nr: nrRef.current, art, text, klein: klein || '' })
  }, [])

  useEffect(() => {
    if (!meldung) return undefined
    const uhr = setTimeout(() => setMeldung(null), MELDUNG_MS)
    return () => clearTimeout(uhr)
  }, [meldung])

  useEffect(() => {
    if (!schlag) return undefined
    const uhr = setTimeout(() => setSchlag(null), SCHLAG_MS)
    return () => clearTimeout(uhr)
  }, [schlag])

  /** Den gerechneten Zustand auf die Anzeige spiegeln — nur bei Aenderung. */
  const spiegeln = useCallback((z) => {
    setFronten((alt) => (alt === z.fronten ? alt : z.fronten))
    setOffen((alt) => {
      const neu = offeneFronten(z)
      return alt === neu ? alt : neu
    })
    setStufe((alt) => (alt === z.stufe ? alt : z.stufe))
    setCombo((alt) => (alt === z.combo ? alt : z.combo))
    setFrost((alt) => {
      const neu = frostAktiv(z)
      return alt === neu ? alt : neu
    })
    setChaos((alt) => {
      const neu = chaosAktiv(z)
      return alt === neu ? alt : neu
    })
  }, [])

  const beenden = useCallback(() => {
    if (endeRef.current) return
    endeRef.current = true
    fertig()
  }, [fertig])

  useTestEnde('videko_slam', laeuft, beenden)

  const starten = useCallback(async () => {
    const begonnen = await laufStarten()
    if (!begonnen) return false
    const zustand = spielStart()
    zustandRef.current = zustand
    endeRef.current = false
    spruchRef.current = { fehler: 0, verpasst: 0, serie: 0 }
    schichtRef.current?.leeren()
    setMeldung(null)
    setSchlag(null)
    spiegeln(zustand)
    return true
  }, [laufStarten, spiegeln])

  /* ---------------------------------------------------------------- */
  /* Die Uhr des Feldes                                                */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!laeuft) return undefined
    let frame = 0
    let letzte = performance.now()
    const schleife = (jetzt) => {
      /* Minimiert steht die Runde still. Der Zeitanker wandert mit,
         sonst kaeme der erste Frame danach mit einem dt von mehreren
         Sekunden zurueck und rechnete die Runde in einem Schritt zu
         Ende. */
      if (istPausiert(GAME)) {
        letzte = jetzt
        frame = requestAnimationFrame(schleife)
        return
      }
      const dt = jetzt - letzte
      letzte = jetzt
      const z = zustandRef.current
      if (z) {
        const { zustand, ereignisse } = takt(z, dt)
        zustandRef.current = zustand
        for (const e of ereignisse) {
          if (e.art !== 'weg' || !e.abgelaufen || e.eintrag.art !== 'gut') continue
          const p = frontPunkt(e.platz)
          schichtRef.current?.popup({ x: p.x, y: p.y, text: 'WEG', art: 'minus' })
          const n = spruchRef.current.verpasst
          spruchRef.current.verpasst = n + 1
          if (n % VERPASST_RUF === 0) melden('verkantet', spruch('verpasst', n / VERPASST_RUF))
        }
        spiegeln(zustand)
      }
      frame = requestAnimationFrame(schleife)
    }
    frame = requestAnimationFrame(schleife)
    return () => cancelAnimationFrame(frame)
  }, [laeuft, frontPunkt, melden, spiegeln])

  /* ---------------------------------------------------------------- */
  /* Zuschlagen                                                        */
  /* ---------------------------------------------------------------- */

  const treffen = useCallback(
    (platz) => {
      const z = zustandRef.current
      if (!laeuft || !z) return
      const { zustand, ereignis } = schlagen(z, platz)
      zustandRef.current = zustand
      if (ereignis.art === 'leer') {
        spiegeln(zustand)
        return
      }

      rundeZaehlen()
      if (ereignis.punkte > 0) punkteGeben(ereignis.punkte)
      if (ereignis.strafeMs) zeitStrafe(ereignis.strafeMs)

      nrRef.current += 1
      setSchlag({ nr: nrRef.current, platz, art: ereignis.art })

      const schicht = schichtRef.current
      const p = frontPunkt(platz)
      const leise = sanftRef.current

      switch (ereignis.art) {
        case 'mist': {
          schicht?.popup({ x: p.x, y: p.y, text: STRAFE_TEXT, art: 'minus' })
          if (!leise) schicht?.funken({ x: p.x, y: p.y, anzahl: 6, art: 'rauch', weite: 30 })
          klang('fehler')
          vibrieren(HAPTIK.fehler)
          break
        }
        case 'gold': {
          schicht?.popup({ x: p.x, y: p.y, text: `+${ereignis.punkte}`, art: 'gross' })
          if (!leise) {
            schicht?.funken({ x: p.x, y: p.y, anzahl: 14, art: 'gold', weite: 60 })
            schicht?.blitz('gold')
          }
          klang('perfekt', 1.2)
          vibrieren(HAPTIK.perfekt)
          break
        }
        case 'frost': {
          if (!leise) schicht?.blitz('weiss')
          klang('zeit', 0.7)
          vibrieren(HAPTIK.gut)
          break
        }
        case 'hitze': {
          if (ereignis.punkte > 0) schicht?.popup({ x: p.x, y: p.y, text: `+${ereignis.punkte}`, art: 'punkte' })
          if (!leise) schicht?.funken({ x: p.x, y: p.y, anzahl: 12, art: 'rot', weite: 66 })
          klang('explosion')
          vibrieren(HAPTIK.explosion)
          break
        }
        case 'chaos': {
          if (!leise) schicht?.blitz('gold')
          klang('kraft', 0.9)
          vibrieren(HAPTIK.fieber)
          break
        }
        case 'ente': {
          schicht?.popup({ x: p.x, y: p.y, text: `+${ereignis.punkte}`, art: 'punkte' })
          klang('pop', 0.55)
          vibrieren(HAPTIK.tipp)
          break
        }
        default: {
          schicht?.popup({ x: p.x, y: p.y, text: `+${ereignis.punkte}`, art: ereignis.combo >= 6 ? 'combo' : 'punkte' })
          if (!leise && ereignis.combo >= 6) {
            schicht?.funken({ x: p.x, y: p.y, anzahl: 6, art: 'gold', weite: 40 })
          }
          klang('treffer', 1 + Math.min(8, ereignis.combo) * 0.045)
          vibrieren(ereignis.serie ? HAPTIK.gut : HAPTIK.treffer)
          break
        }
      }

      const ruf = meldungFuer(
        ereignis,
        ereignis.art === 'mist' ? spruchRef.current.fehler : spruchRef.current.serie,
      )
      if (ruf) {
        if (ereignis.art === 'mist') spruchRef.current.fehler += 1
        if (ereignis.serie) spruchRef.current.serie += 1
        /* Die reine Punktzahl steht schon ueber der Front — der Ruf oben
           bleibt den Momenten vorbehalten, die etwas zu sagen haben. */
        if (ruf.klein || ereignis.art !== 'treffer') melden(ruf.art, ruf.text, ruf.klein)
      }

      spiegeln(zustand)
    },
    [laeuft, frontPunkt, melden, punkteGeben, rundeZaehlen, spiegeln, zeitStrafe],
  )

  const zeigerRunter = (platz) => (e) => {
    e.preventDefault()
    treffen(platz)
  }

  const tastatur = (e) => {
    if (!laeuft) return
    const zahl = Number(e.key)
    if (!Number.isInteger(zahl) || zahl < 1 || zahl > FRONTEN_MAX) return
    e.preventDefault()
    if (e.repeat) return
    treffen(zahl - 1)
  }

  const comboText = combo >= 3 ? `SERIE ×${combo}` : ''

  return (
    <SpielKarte
      spiel={{ ...SPIEL, hebel: { wort: 'TREFFER', punkte: HEBEL_PUNKTE } }}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span className="trm-spiel__combo trm-slam-serie" data-an={comboText ? '1' : '0'}>
          {comboText}
        </span>
      }
    >
      {laeuft && (
        <>
          <div
            className="trm-slam-buehne"
            ref={buehneRef}
            role="application"
            tabIndex={0}
            aria-label="VIDEKO Slam. Tippe an, was ins Haus gehört. Die Ziffern 1 bis 9 liegen auf den Fronten."
            data-sanft={sanft ? '1' : '0'}
            data-stufe={stufe}
            data-combo={combo}
            data-frost={frost ? '1' : '0'}
            data-chaos={chaos ? '1' : '0'}
            onKeyDown={tastatur}
          >
            <div className="trm-slam-feldbox">
              <div className="trm-slam-feld" ref={feldRef}>
                {fronten.map((eintrag, platz) => {
                  const zu = platz >= offen
                  const getroffen = schlag && schlag.platz === platz ? schlag : null
                  return (
                    <button
                      key={platz}
                      type="button"
                      ref={(el) => {
                        knoepfeRef.current[platz] = el
                      }}
                      className="trm-slam-front"
                      data-front={platz}
                      data-zu={zu ? '1' : '0'}
                      data-belegt={eintrag ? '1' : '0'}
                      data-ding={eintrag?.id || ''}
                      data-art={eintrag?.art || ''}
                      data-wirkung={eintrag?.wirkung || ''}
                      disabled={zu}
                      aria-hidden={zu ? 'true' : undefined}
                      aria-label={eintrag ? eintrag.name : 'Front frei'}
                      onPointerDown={zeigerRunter(platz)}
                    >
                      <span className="trm-slam-front__tuer" aria-hidden="true" />
                      <span className="trm-slam-front__griff" aria-hidden="true" />
                      {eintrag && (
                        <span key={eintrag.nr} className="trm-slam-ding">
                          <Bild name={eintrag.bild} />
                          <b className="trm-slam-ding__wort">{eintrag.name}</b>
                        </span>
                      )}
                      {getroffen && (
                        <span
                          key={getroffen.nr}
                          className="trm-slam-knall"
                          data-art={getroffen.art}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="trm-slam-fx" ref={schichtElRef} aria-hidden="true" />
              {frost && <span className="trm-slam-lage trm-slam-lage--frost">EINGEFROREN</span>}
              {chaos && <span className="trm-slam-lage trm-slam-lage--chaos">CHAOS ×2</span>}
            </div>
          </div>

          {meldung && (
            <p key={meldung.nr} className={`trm-spiel__ruf trm-spiel__ruf--${meldung.art}`}>
              {meldung.text}
              {meldung.klein && <small className="trm-slam-klein">{meldung.klein}</small>}
            </p>
          )}
        </>
      )}
    </SpielKarte>
  )
}
