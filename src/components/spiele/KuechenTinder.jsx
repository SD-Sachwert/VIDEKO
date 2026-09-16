import { useCallback, useEffect, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import { ABSTAND_MS, AUFGABE_SPERRE_MS, antwortWerten, meldungFuer, rundeErzeugen } from './tinder-logik.js'
import './tinder.css'

/**
 * KUECHEN-TINDER — Reaktions- und Wissensspiel, dreissig Sekunden lang.
 *
 * Aufgabentypen, Karten und Wertung stehen in tinder-karten.js und
 * tinder-logik.js und sind dort getestet. Hier geht es um Zeit, Finger, Bild.
 *
 * STEUERUNG
 * ---------
 * Die Karte folgt dem Finger, dreht sich mit und zeigt den Stempel der
 * Richtung. Losgelassen jenseits von 30 % der Kartenbreite — oder mit einem
 * schnellen Wisch — ist entschieden, sonst springt sie zurueck. Darunter
 * zwei grosse Tasten NEIN und JA, auf der Tastatur ← und →.
 *
 * FEHLER
 * ------
 * Falsch kostet 2 s (sichtbar „−2 s“), die Combo faellt sichtbar auf 0 und
 * unter der Karte steht fuer 0,9 s ein Satz, warum. Nichts davon blockiert:
 * die naechste Karte ist sofort spielbar.
 *
 * TEST-HOOKS
 * ----------
 * Buehne: data-aufgabe, data-combo, data-schwierigkeit. Karte: data-karte.
 * Strafe: .trm-tinder-strafe[data-strafe]. Erklaerung: .trm-tinder-warum.
 *
 * DER SERVER RECHNET MIT
 * ----------------------
 * Jede beantwortete Karte ist eine Runde. Die naechste Karte erscheint
 * fruehestens ABSTAND_MS nach der Antwort, nach einem Aufgabenwechsel ist
 * sie zusaetzlich AUFGABE_SPERRE_MS gesperrt.
 */

const SPIEL = SPIEL_NACH_KEY.kuechen_tinder

/* Typischer Wert einer richtigen Karte in laufender Combo (×2 plus Tempo). */
const HEBEL_PUNKTE = 200
const SCHWELLE_ANTEIL = 0.3
const WISCH_PX = 36
const WISCH_TEMPO = 0.5
const DREH_MAX = 16
const MELDUNG_MS = 1100
const WARUM_MS = 900
const STRAFE_ANZEIGE_MS = 900
const KARTE_MIN = 240
const KARTE_MAX = 400
const LANGER_NAME = 30

function summen(muster) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(muster)
  } catch {
    /* kein Vibrationsmotor, kein Problem */
  }
}

/* ------------------------------------------------------------------ */
/* Linienbilder                                                        */
/* ------------------------------------------------------------------ */

const LINIEN = {
  armatur: (
    <>
      <path d="M22 56V26a14 14 0 0 1 28 0v6" />
      <path d="M46 32h8M14 56h20" />
      <path d="M22 40h-9M13 36v8" />
      <path d="M50 38v4M50 46v2" />
    </>
  ),
  backofen: (
    <>
      <rect x="10" y="8" width="44" height="48" rx="4" />
      <path d="M10 19h44" />
      <rect x="16" y="25" width="32" height="24" rx="2" />
      <path d="M17 14h.01M24 14h.01M36 14h12M22 31h20" />
    </>
  ),
  brett: (
    <>
      <path d="M8 22a6 6 0 0 1 6-6h36a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z" />
      <circle cx="47" cy="24" r="3" />
      <path d="M16 38h18M16 43h10" />
    </>
  ),
  frage: (
    <>
      <circle cx="32" cy="32" r="24" />
      <path d="M24 25a8 8 0 1 1 11 7.4c-2 .9-3 2.4-3 4.6v3" />
      <path d="M32 47h.01" strokeWidth="3.5" />
    </>
  ),
  griff: (
    <>
      <rect x="8" y="8" width="48" height="48" rx="3" />
      <path d="M22 22v20M22 22h4M22 42h4" />
      <circle cx="44" cy="32" r="4" />
    </>
  ),
  grundriss: (
    <>
      <path d="M6 8h52v48H6z" />
      <path d="M6 20h40V8M18 56V36h26v20" />
      <rect x="12" y="11" width="10" height="6" rx="2" />
      <circle cx="36" cy="14" r="3" />
      <path d="M52 30v12" strokeDasharray="2 3" />
    </>
  ),
  haube: (
    <>
      <path d="M26 6h12v18l16 12v6H10v-6l16-12z" />
      <path d="M8 54h48M20 48v3M32 48v3M44 48v3" />
    </>
  ),
  kanne: (
    <>
      <path d="M20 24l4-8h14l4 8" />
      <path d="M16 24h26v26a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" />
      <path d="M42 30h4a6 6 0 0 1 0 12h-4M29 12v4" />
    </>
  ),
  kochfeld: (
    <>
      <rect x="6" y="12" width="52" height="40" rx="4" />
      <circle cx="22" cy="30" r="9" />
      <circle cx="22" cy="30" r="4" />
      <circle cx="43" cy="24" r="5" />
      <circle cx="43" cy="40" r="5" />
    </>
  ),
  pfanne: (
    <>
      <circle cx="25" cy="32" r="17" />
      <circle cx="25" cy="32" r="11" />
      <path d="M42 32h18" strokeWidth="4" />
    </>
  ),
  platte: (
    <>
      <path d="M4 32l20-12h36L40 32z" />
      <path d="M4 32v8h36v-8M40 40l20-12v-8" />
      <path d="M16 28c6 1 10-3 18-1M26 24c4 0 8-1 12 0" />
    </>
  ),
  schrank: (
    <>
      <rect x="10" y="6" width="44" height="52" rx="3" />
      <path d="M32 6v52M27 24v12M37 24v12" />
    </>
  ),
  spuele: (
    <>
      <rect x="6" y="20" width="52" height="32" rx="4" />
      <rect x="12" y="26" width="40" height="20" rx="5" />
      <path d="M46 20V11a5 5 0 0 0-10 0" />
      <circle cx="32" cy="36" r="2" />
    </>
  ),
  spueler: (
    <>
      <rect x="10" y="6" width="44" height="52" rx="3" />
      <path d="M10 17h44M22 11.5h20" />
      <path d="M18 32c4-4 8 4 14 0s10 4 14 0" />
    </>
  ),
  stecker: (
    <>
      <rect x="18" y="4" width="28" height="56" rx="5" />
      <circle cx="32" cy="20" r="7" />
      <circle cx="32" cy="44" r="7" />
      <path d="M29 20h.01M35 20h.01M29 44h.01M35 44h.01" />
    </>
  ),
  topf: (
    <>
      <path d="M12 26c4-9 36-9 40 0M29 15h6" />
      <path d="M12 26h40v22a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z" />
      <path d="M5 30h7M52 30h7" />
    </>
  ),
  'zeile-glatt': (
    <>
      <path d="M4 10h56M4 30h56v26H4z" />
      <path d="M4 10v12h56V10" />
      <path d="M23 30v26M41 30v26M4 34h56" />
    </>
  ),
  'zeile-kassette': (
    <>
      <path d="M2 8h60M4 11h56v12H4zM4 30h56v26H4z" />
      <path d="M23 30v26M41 30v26" />
      <rect x="8" y="35" width="11" height="17" rx="1" />
      <rect x="27" y="35" width="10" height="17" rx="1" />
      <rect x="45" y="35" width="11" height="17" rx="1" />
      <path d="M21 17h.01M43 17h.01" strokeWidth="3" />
    </>
  ),
}

function Bild({ name }) {
  return (
    <svg
      className="trm-tinder-svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {LINIEN[name] || LINIEN.schrank}
    </svg>
  )
}

export default function KuechenTinder({ sitzung, best = null, onErgebnis }) {
  const [aktuell, setAktuell] = useState(null)
  const [combo, setCombo] = useState(0)
  const [comboWeg, setComboWeg] = useState(0)
  const [meldung, setMeldung] = useState(null)
  const [strafe, setStrafe] = useState(null)
  const [warum, setWarum] = useState(null)
  const [flash, setFlash] = useState(0)
  const [gesperrt, setGesperrt] = useState(false)
  const [urteil, setUrteil] = useState('')
  const [sanft, setSanft] = useState(false)

  const buehneRef = useRef(null)
  const karteRef = useRef(null)
  const zustandRef = useRef(null)
  const freiAbRef = useRef(0)
  const flugRef = useRef(false)
  const endeRef = useRef(false)
  const fingerRef = useRef(null)
  const uhrenRef = useRef(new Set())
  const kartenBreiteRef = useRef(320)
  const nrRef = useRef(0)
  const sanftRef = useRef(false)

  const lauf = useSpielLauf({ sitzung, game: 'kuechen_tinder', dauerVorgabe: 30000, onErgebnis })
  const { laeuft, punkteGeben, rundeZaehlen, zeitStrafe, fertig, starten: laufStarten } = lauf

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

  /** Zeitgeber, die beim Ende des Laufs sicher mit abgeraeumt werden. */
  const spaeter = useCallback((fn, ms) => {
    const uhr = setTimeout(() => {
      uhrenRef.current.delete(uhr)
      fn()
    }, ms)
    uhrenRef.current.add(uhr)
  }, [])

  const uhrenStoppen = useCallback(() => {
    for (const uhr of uhrenRef.current) clearTimeout(uhr)
    uhrenRef.current.clear()
  }, [])

  /* Buehne messen: die Karte ist so breit wie moeglich, hoechstens 400 px. */
  useEffect(() => {
    const el = buehneRef.current
    if (!el) return undefined
    const messen = () => {
      const breite = el.clientWidth || 320
      const karte = Math.round(Math.max(Math.min(KARTE_MIN, breite - 24), Math.min(KARTE_MAX, breite - 32)))
      kartenBreiteRef.current = karte
      el.style.setProperty('--tinder-kb', `${karte}px`)
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
  }, [laeuft])

  /* Laeuft die Runde nicht mehr, bleibt kein Zeitgeber haengen. */
  useEffect(() => {
    if (laeuft) return undefined
    uhrenStoppen()
    return undefined
  }, [laeuft, uhrenStoppen])

  useEffect(() => uhrenStoppen, [uhrenStoppen])

  const naechsteNr = () => {
    nrRef.current += 1
    return nrRef.current
  }

  const melden = useCallback((art, text) => {
    nrRef.current += 1
    setMeldung({ nr: nrRef.current, art, text })
  }, [])

  useEffect(() => {
    if (!meldung) return undefined
    const uhr = setTimeout(() => setMeldung(null), MELDUNG_MS)
    return () => clearTimeout(uhr)
  }, [meldung])

  useEffect(() => {
    if (!warum) return undefined
    const uhr = setTimeout(() => setWarum(null), WARUM_MS)
    return () => clearTimeout(uhr)
  }, [warum])

  useEffect(() => {
    if (!strafe) return undefined
    const uhr = setTimeout(() => setStrafe(null), STRAFE_ANZEIGE_MS)
    return () => clearTimeout(uhr)
  }, [strafe])

  /** Eine Karte zeigen. Die erste einer Aufgabe ist kurz gesperrt. */
  const karteZeigen = useCallback(
    (eintrag) => {
      flugRef.current = false
      fingerRef.current = null
      setUrteil('')
      setAktuell(eintrag)
      if (eintrag.neu) {
        freiAbRef.current = Date.now() + AUFGABE_SPERRE_MS
        setFlash(eintrag.nr)
        setGesperrt(true)
        spaeter(() => setGesperrt(false), AUFGABE_SPERRE_MS)
      } else {
        freiAbRef.current = Date.now()
      }
    },
    [spaeter],
  )

  /** Der Weg ins Ende — fuer das Testlabor sofort, sonst beendet die Uhr. */
  const beenden = useCallback(() => {
    if (endeRef.current) return
    endeRef.current = true
    flugRef.current = true
    uhrenStoppen()
    fertig()
  }, [fertig, uhrenStoppen])

  useTestEnde('kuechen_tinder', laeuft, beenden)

  const starten = useCallback(async () => {
    uhrenStoppen()
    setAktuell(null)
    const begonnen = await laufStarten()
    if (!begonnen) return false
    const zustand = rundeErzeugen()
    zustandRef.current = zustand
    endeRef.current = false
    setCombo(0)
    setComboWeg(0)
    setMeldung(null)
    setStrafe(null)
    setWarum(null)
    karteZeigen(zustand.aktuell)
    return true
  }, [laufStarten, karteZeigen, uhrenStoppen])

  /* ---------------------------------------------------------------- */
  /* Antworten                                                         */
  /* ---------------------------------------------------------------- */

  /** Die Karte hinausfliegen lassen — von dort, wo der Finger sie liess. */
  const hinausfliegen = (ja) => {
    const el = karteRef.current
    if (!el) return
    el.dataset.zieht = '0'
    el.style.setProperty('--ja', ja ? '1' : '0')
    el.style.setProperty('--nein', ja ? '0' : '1')
    const dauer = ABSTAND_MS - 20
    if (sanftRef.current) {
      el.style.transition = `opacity ${dauer}ms linear`
      el.style.opacity = '0'
      return
    }
    const weg = kartenBreiteRef.current * 1.5 * (ja ? 1 : -1)
    el.style.transition = `transform ${dauer}ms cubic-bezier(0.4, 0, 1, 1), opacity ${dauer}ms ease-in`
    el.style.transform = `translate(${weg}px, -24px) rotate(${ja ? DREH_MAX + 10 : -DREH_MAX - 10}deg)`
    el.style.opacity = '0'
  }

  /** Eine Antwort. Gibt false, wenn sie (noch) nicht zaehlen darf. */
  const antworten = (ja) => {
    if (!laeuft || endeRef.current || flugRef.current) return false
    const zustand = zustandRef.current
    if (!zustand) return false
    const jetzt = Date.now()
    if (jetzt < freiAbRef.current) return false

    const ereignis = antwortWerten(zustand, ja, jetzt - freiAbRef.current)
    zustandRef.current = ereignis.zustand
    flugRef.current = true
    fingerRef.current = null

    rundeZaehlen()
    if (ereignis.punkte) punkteGeben(ereignis.punkte)
    if (ereignis.strafeMs) {
      const wirkt = zeitStrafe(ereignis.strafeMs)
      setStrafe({ nr: naechsteNr(), ms: wirkt })
      setWarum({ nr: naechsteNr(), loesung: ereignis.loesung, text: ereignis.warum })
    }
    if (ereignis.comboVerloren) setComboWeg(ereignis.comboVorher)
    else if (ereignis.richtig) setComboWeg(0)

    setCombo(ereignis.combo)
    setUrteil(ereignis.richtig ? 'richtig' : 'falsch')
    const m = meldungFuer(ereignis)
    melden(m.art, m.text)
    summen(ereignis.richtig ? 8 : [40, 30, 40])
    hinausfliegen(ja)

    spaeter(() => {
      if (endeRef.current) return
      karteZeigen(ereignis.zustand.aktuell)
    }, ABSTAND_MS)
    return true
  }

  const zurueckspringen = () => {
    const el = karteRef.current
    if (!el) return
    el.dataset.zieht = '0'
    el.style.transform = ''
    el.style.setProperty('--ja', '0')
    el.style.setProperty('--nein', '0')
  }

  const zeigerRunter = (e) => {
    if (!laeuft || flugRef.current || e.button > 0) return
    e.preventDefault()
    buehneRef.current?.focus?.({ preventScroll: true })
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* Capture ist nur Komfort */
    }
    const jetzt = performance.now()
    fingerRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, px: e.clientX, pt: jetzt, vx: 0 }
    if (karteRef.current) karteRef.current.dataset.zieht = '1'
  }

  const zeigerZieht = (e) => {
    const f = fingerRef.current
    const el = karteRef.current
    if (!f || f.id !== e.pointerId || !el || flugRef.current) return
    const jetzt = performance.now()
    const dt = jetzt - f.pt
    if (dt > 0) f.vx = f.vx * 0.3 + ((e.clientX - f.px) / dt) * 0.7
    f.px = e.clientX
    f.pt = jetzt
    const dx = e.clientX - f.x
    const dy = e.clientY - f.y
    const b = kartenBreiteRef.current
    const anteil = Math.max(-1, Math.min(1, dx / (b * SCHWELLE_ANTEIL)))
    const dreh = sanftRef.current ? 0 : (dx / b) * DREH_MAX
    el.style.transform = `translate(${dx}px, ${dy * 0.2}px) rotate(${dreh}deg)`
    el.style.setProperty('--ja', String(Math.max(0, anteil)))
    el.style.setProperty('--nein', String(Math.max(0, -anteil)))
  }

  const zeigerHoch = (e) => {
    const f = fingerRef.current
    if (!f || f.id !== e.pointerId) return
    fingerRef.current = null
    const dx = e.clientX - f.x
    const b = kartenBreiteRef.current
    const weit = Math.abs(dx) >= b * SCHWELLE_ANTEIL
    const wisch = Math.abs(dx) >= WISCH_PX && Math.abs(f.vx) >= WISCH_TEMPO && Math.sign(f.vx) === Math.sign(dx)
    if ((weit || wisch) && antworten(dx > 0)) return
    zurueckspringen()
  }

  const zeigerAbbruch = () => {
    fingerRef.current = null
    if (!flugRef.current) zurueckspringen()
  }

  const tastatur = (e) => {
    if (!laeuft) return
    const k = e.key
    if (k !== 'ArrowLeft' && k !== 'ArrowRight') return
    e.preventDefault()
    if (e.repeat) return
    antworten(k === 'ArrowRight')
  }

  const { aufgabe, karte } = aktuell || {}
  const comboText = combo >= 2 ? `COMBO ×${combo}` : comboWeg >= 2 ? `COMBO ×${comboWeg} ✕` : ''

  return (
    <SpielKarte
      spiel={{ ...SPIEL, hebel: { wort: 'RICHTIGE', punkte: HEBEL_PUNKTE } }}
      lauf={{ ...lauf, starten }}
      best={best}
      leiste={
        <span
          className="trm-spiel__combo trm-tinder-serie"
          data-an={comboText ? '1' : '0'}
          data-weg={combo < 2 && comboWeg >= 2 ? '1' : '0'}
        >
          {comboText}
        </span>
      }
    >
      {laeuft && (
        <>
          <div
            className="trm-tinder-buehne"
            ref={buehneRef}
            role="application"
            tabIndex={0}
            aria-label="Küchen-Tinder. Pfeil rechts heißt Ja, Pfeil links heißt Nein."
            data-sanft={sanft ? '1' : '0'}
            data-gesperrt={gesperrt ? '1' : '0'}
            data-aufgabe={aktuell?.typ || ''}
            data-combo={combo}
            data-schwierigkeit={aktuell?.stufe || 1}
            onKeyDown={tastatur}
          >
            {aufgabe && (
              <div className="trm-tinder-aufgabe" key={`a-${flash}`} data-neu={gesperrt ? '1' : '0'} aria-live="polite">
                <span className="trm-tinder-aufgabe__label">
                  AUFGABE <span className="trm-tinder-aufgabe__stufe">{'◆'.repeat(aktuell.stufe)}</span>
                </span>
                <p className="trm-tinder-aufgabe__frage">{aufgabe.titel}</p>
                <p className="trm-tinder-aufgabe__hinweis">{aufgabe.ja}</p>
              </div>
            )}

            <div className="trm-tinder-stapel">
              <span className="trm-tinder-karte trm-tinder-karte--hinten" aria-hidden="true" />
              {karte && (
                <article
                  key={aktuell.nr}
                  ref={karteRef}
                  className="trm-tinder-karte"
                  data-karte={karte.id}
                  data-typ={karte.typ}
                  data-urteil={urteil}
                  data-zieht="0"
                  aria-label={`${karte.name}${karte.fakten.length ? `: ${karte.fakten.join(', ')}` : ''}`}
                  onPointerDown={zeigerRunter}
                  onPointerMove={zeigerZieht}
                  onPointerUp={zeigerHoch}
                  onPointerCancel={zeigerAbbruch}
                >
                  <span className="trm-tinder-stempel trm-tinder-stempel--ja" aria-hidden="true">
                    JA
                  </span>
                  <span className="trm-tinder-stempel trm-tinder-stempel--nein" aria-hidden="true">
                    NEIN
                  </span>
                  <div className="trm-tinder-bild">
                    <Bild name={karte.bild} />
                    {karte.farben && (
                      <div className="trm-tinder-farben" aria-hidden="true">
                        {karte.farben.map((feld) => (
                          <span key={feld.t} className="trm-tinder-farbe">
                            <i style={{ background: feld.f }} />
                            {feld.t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <h3 className="trm-tinder-name" data-lang={karte.name.length > LANGER_NAME ? '1' : '0'}>
                    {karte.name}
                  </h3>
                  {karte.fakten.length > 0 && (
                    <ul className="trm-tinder-fakten">
                      {karte.fakten.map((fakt) => (
                        <li key={fakt}>{fakt}</li>
                      ))}
                    </ul>
                  )}
                </article>
              )}
              {gesperrt && (
                <p key={`f-${flash}`} className="trm-tinder-flash" aria-hidden="true">
                  NEUE AUFGABE
                </p>
              )}
              {strafe && strafe.ms > 0 && (
                <p key={strafe.nr} className="trm-tinder-strafe" data-strafe={strafe.ms}>
                  −{Math.round(strafe.ms / 1000)} s
                </p>
              )}
            </div>

            <div className="trm-tinder-warumzeile" aria-live="polite">
              {warum && (
                <p key={warum.nr} className="trm-tinder-warum" onClick={() => setWarum(null)}>
                  <b>{warum.loesung ? 'JA' : 'NEIN'} wäre richtig:</b> {warum.text}
                </p>
              )}
            </div>

            <div className="trm-tinder-tasten">
              <button
                type="button"
                className="trm-tinder-taste trm-tinder-taste--nein"
                data-antwort="nein"
                aria-keyshortcuts="ArrowLeft"
                onClick={() => antworten(false)}
              >
                <span aria-hidden="true">✕</span> NEIN
              </button>
              <button
                type="button"
                className="trm-tinder-taste trm-tinder-taste--ja"
                data-antwort="ja"
                aria-keyshortcuts="ArrowRight"
                onClick={() => antworten(true)}
              >
                <span aria-hidden="true">✓</span> JA
              </button>
            </div>
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
