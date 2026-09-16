import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import SpielKarte from '../SpielKarte.jsx'
import { useSpielLauf, useTestEnde } from '../spiel-lauf.js'
import { SPIEL_NACH_KEY } from '../../data/terminal.js'
import {
  BREITE,
  FALL_MS,
  FINALE_FAKTOR,
  FREI_FRUEH_MS,
  HOEHE,
  MISCHEN_MS,
  SERIE_MS,
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
} from './crush-logik.js'
import './crush.css'

/**
 * KUECHEN-CRUSH — drei gleiche in einer Reihe, 40 Sekunden.
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
 * DIE UHR
 * -------
 * Wie beim Goldrausch: die Runde laeuft nach der Uhr des Hooks und endet
 * dort. Ein Tabwechsel haelt sie nicht an; eine Pause gibt es deshalb nicht.
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

const LEER = {}
const KEINE = []

function summen(muster) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(muster)
  } catch {
    /* kein Vibrationsmotor, kein Problem */
  }
}

const jetzt = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

/** ×2,4 statt ×2.4 */
const malText = (m) => `×${String(m).replace('.', ',')}`

/**
 * Was ein Kaskadenschritt zu sehen gibt: Strahlen und Explosionen, Glanz an
 * neuen Sonderteilen, die Einblendung fuer 4er/5er und wie stark das Feld
 * schlaegt (0 nichts, 1 Booster, 2 Bombe gebaut/Kreuz, 3 Bombe gezuendet).
 */
function schrittBild(schritt) {
  const effekte = schritt.effekte.map((f) => ({ art: f.art, x: f.x, y: f.y }))
  for (const n of schritt.neuSpezial) {
    if (n.platz) effekte.push({ art: n.art === 'bombe' ? 'glanz5' : 'glanz4', x: n.platz[0], y: n.platz[1] })
  }
  const arten = new Set(schritt.effekte.map((f) => f.art))
  const neuBombe = schritt.neuSpezial.find((n) => n.art === 'bombe')
  const neuBooster = schritt.neuSpezial.find((n) => n.art !== 'bombe')
  let banner = null
  let schlag = 0
  if (arten.has('feld')) {
    banner = { stufe: '5', gross: 'DOPPEL-BOMBE', klein: 'FELD LEER' }
    schlag = 3
  } else if (neuBombe) {
    banner = { stufe: '5', gross: neuBombe.form === 'kreuz' ? 'L-FORM' : `${neuBombe.form}ER`, klein: 'VIDEKO-BOMBE' }
    schlag = 2
  } else if (arten.has('bombe')) {
    banner = { stufe: '5', gross: 'BOMBE', klein: 'VIDEKO-BOMBE' }
    schlag = 3
  } else if (neuBooster) {
    banner = { stufe: '4', gross: '4ER', klein: neuBooster.art === 'reihe' ? 'BOOSTER ↔' : 'BOOSTER ↕' }
    schlag = 1
  } else if (arten.has('reihe') && arten.has('spalte')) {
    banner = { stufe: '4', gross: 'KREUZ', klein: 'REIHE + SPALTE' }
    schlag = 2
  }
  if (arten.has('bombe') || arten.has('feld')) schlag = 3
  else if (!schlag && (arten.has('reihe') || arten.has('spalte'))) schlag = 1
  return { effekte, banner, schlag, booster: arten.has('reihe') || arten.has('spalte') }
}

/** Die sechs Gegenstaende als Linienzeichnung, dazu die VIDEKO-BOMBE. */
function Zeichen({ typ, spezial }) {
  const linie = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  let inhalt
  if (spezial === 'bombe') {
    inhalt = (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M8.3 9.6 12 17l3.7-7.4" strokeWidth="2.3" />
        <path d="M16.5 5.5 18 3.5M19.5 7.5l2-1M18.8 4.2l.9 2.1" />
      </>
    )
  } else if (typ === 1) {
    /* Kaffeetasse */
    inhalt = (
      <>
        <path d="M4.5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
        <path d="M15.5 11h1.7a2.4 2.4 0 0 1 0 4.8h-1.9" />
        <path d="M8.5 3.5c-.9 1 .9 2.1 0 3.2M12 3.5c-.9 1 .9 2.1 0 3.2" />
        <path d="M3.5 21h14" />
      </>
    )
  } else if (typ === 2) {
    /* Topf */
    inhalt = (
      <>
        <path d="M3.5 10h17" />
        <path d="M5.5 10v7.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V10" />
        <path d="M1.8 12h3.7M18.5 12h3.7" />
        <path d="M8 7.5c1-1.4 7-1.4 8 0M12 5v1.4" />
      </>
    )
  } else if (typ === 3) {
    /* Pfanne */
    inhalt = (
      <>
        <circle cx="9" cy="14" r="6.5" />
        <circle cx="9" cy="14" r="3.6" strokeOpacity="0.55" />
        <path d="M14 9.2 21.5 3" strokeWidth="3" />
      </>
    )
  } else if (typ === 4) {
    /* Messer */
    inhalt = (
      <>
        <path d="M8.2 15.8 18.6 3.9c1.7-.5 2.6.6 2.2 2.3L10.4 18z" />
        <path d="M3 21l4.3-4.3" strokeWidth="3.2" />
      </>
    )
  } else if (typ === 5) {
    /* Schneidebrett */
    inhalt = (
      <>
        <rect x="4" y="7" width="16" height="14" rx="2.6" />
        <path d="M10 7V4.2a2 2 0 0 1 4 0V7" />
        <path d="M8.5 12v5M12 12v5M15.5 12v5" strokeOpacity="0.6" />
      </>
    )
  } else {
    /* Gewuerzglas */
    inhalt = (
      <>
        <rect x="7" y="2.8" width="10" height="4" rx="1" />
        <path d="M6.5 6.8h11V19a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2z" />
        <path d="M6.5 11h11v5.5h-11" />
        <path d="M10 4.8h.01M12 4.8h.01M14 4.8h.01" strokeWidth="2.2" />
      </>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...linie}>
      {inhalt}
    </svg>
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
        <Zeichen typ={stein.typ} spezial={stein.spezial} />
        {booster && <Pfeile />}
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

  const buehneRef = useRef(null)
  const gitterRef = useRef(null)
  const standRef = useRef(null)
  const sanftRef = useRef(false)
  const sperreRef = useRef(false)
  const beendetRef = useRef(false)
  const uhrenRef = useRef([])
  const fingerRef = useRef(null)
  const nrRef = useRef(0)
  const restRef = useRef(40000)
  const serieRef = useRef(0)
  const freiSeitRef = useRef(0)
  const zugNrRef = useRef(0)

  const lauf = useSpielLauf({ sitzung, game: 'kuechen_crush', dauerVorgabe: 40000, onErgebnis })
  const { laeuft, punkteGeben, rundeZaehlen, fertig, starten: laufStarten, restMs } = lauf
  const finale = laeuft && istFinale(restMs)
  /* Die Buehne erscheint erst, wenn das Feld liegt — erst dann messen. */
  const buehneDa = laeuft && !!bild

  useEffect(() => {
    restRef.current = restMs
  }, [restMs])

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
      summen([30, 40, 30])
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
        summen(8)
        return false
      }

      rundeZaehlen()
      sperreRef.current = true
      zugNrRef.current += 1
      const zugNr = zugNrRef.current

      /* Tempo: wie schnell nach der letzten Freigabe getauscht wurde. */
      const stufe = freiSeitRef.current ? serieWeiter(serieRef.current, jetzt() - freiSeitRef.current) : 0
      serieRef.current = stufe
      const wertung = zugPunkte(ergebnis.schritte, { tempoStufe: stufe, finale: istFinale(restRef.current) })
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
          setCombo(wertung.multi[i])
          const zu = schrittBild(schritt)
          effekteZeigen(zu.effekte)
          if (zu.banner) einblenden(zu.banner)
          if (zu.schlag && !leise) {
            nrRef.current += 1
            setSchlag({ nr: nrRef.current, stufe: zu.schlag })
          }
          if (schritt.kombo >= 2) melden(schritt.kombo >= 3 ? 'gold' : 'gut', `KOMBO ${malText(wertung.multi[i])}`)
          else if (zu.booster && !zu.banner) melden('gut', 'BOOSTER')
          if (zu.schlag >= 3) summen([20, 30, 40])
          else if (zu.schlag === 2) summen([16, 24, 16])
          else if (schritt.kombo >= 3) summen([14, 24, 14])
          else if (zu.schlag === 1 || schritt.kombo === 2) summen(14)
          else summen(6)
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
    [einblenden, effekteZeigen, melden, planen, punkteGeben, rundeZaehlen],
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
              <p key={banner.nr} className="trm-crush-banner" data-stufe={banner.stufe} aria-hidden="true">
                <span className="trm-crush-banner__gross">{banner.gross}</span>
                <span className="trm-crush-banner__klein">{banner.klein}</span>
              </p>
            )}
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
