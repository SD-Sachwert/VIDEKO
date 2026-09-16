import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { spielBeenden, spielStarten } from '../data/terminal-api.js'

/**
 * Der Ablauf einer Spielrunde — fuer beide Spiele derselbe.
 *
 * Truhenknacker und Goldrausch unterscheiden sich im Spielfeld, nicht im
 * Drumherum: Runde beim Server anmelden, Uhr laufen lassen, Punkte zaehlen,
 * Ergebnis mit dem Laufticket zurueckschicken. Das steht deshalb hier und
 * nicht zweimal in zwei Komponenten.
 *
 * WAS SICH GEGENUEBER VERSION 1 GEAENDERT HAT
 * -------------------------------------------
 * Der Punktestand geht jetzt an den Server und steht in einer Tabelle. Was
 * sich NICHT geaendert hat: er hat keinen Einfluss auf die Ziehung und keinen
 * auf die Gewinnchance. Die haengt allein an der Deckelnummer. Punkte und
 * Lostopf sind zwei getrennte Tabellen, und das ist Absicht.
 *
 * DIE UHR LAEUFT NACH `Date.now()`, NICHT NACH FRAMES
 * ---------------------------------------------------
 * Ein Intervall von 200 ms vergleicht nur gegen einen Zeitstempel. Wer den
 * Tab wegschaltet, friert damit nicht die Restzeit ein, und die Anzeige kann
 * nicht langsam gegen die echte Zeit driften. Die Animation der Spiele laeuft
 * getrennt davon in ihrem eigenen requestAnimationFrame.
 *
 * ZEITSTRAFEN HABEN EINE OBERGRENZE
 * ---------------------------------
 * "SCHLOSS VERKANTET –2 SEK." zieht echte Sekunden ab, sonst waere es keine
 * Strafe. Die Summe aller Strafen ist aber begrenzt: der Server haelt einen
 * Lauf, der deutlich kuerzer ist als die Spielzeit, fuer verdaechtig. Eine
 * schwache Runde mit vielen Fehlern darf nicht in dieser Pruefung landen.
 */

const STRAFE_MAX_MS = 10000

/**
 * TESTLABOR: GAME OVER ERZWINGEN
 * ------------------------------
 * Das Testlabor schickt `trm-game-over` mit dem Spielschluessel als detail.
 * Jedes Spiel haengt sich mit `useTestEnde` daran und laeuft dann durch
 * seinen normalen Game-Over-Weg — keine Sonderabkuerzung, damit der Test
 * genau das prueft, was echte Spieler erleben.
 */
export const GAME_OVER_EREIGNIS = 'trm-game-over'

export function useTestEnde(game, laeuft, beenden) {
  const beendenRef = useRef(beenden)
  useEffect(() => {
    beendenRef.current = beenden
  }, [beenden])
  useEffect(() => {
    if (!laeuft || typeof window === 'undefined') return undefined
    const hoeren = (e) => {
      if (!e?.detail || e.detail === game) beendenRef.current?.()
    }
    window.addEventListener(GAME_OVER_EREIGNIS, hoeren)
    return () => window.removeEventListener(GAME_OVER_EREIGNIS, hoeren)
  }, [game, laeuft])
}

/**
 * TESTLABOR: DIREKTSTART
 * ----------------------
 * Die Szene eines Spiels startet die Runde sofort. Weil die neuen Spiele erst
 * nachgeladen werden, liegt der Wunsch hier bereit, bis die Karte einhaengt;
 * steht sie schon, kommt er zusaetzlich als Ereignis `trm-spiel-start`.
 */
export const START_EREIGNIS = 'trm-spiel-start'
let startWunsch = null

export function startWunschSetzen(game) {
  startWunsch = game
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(START_EREIGNIS, { detail: game }))
}

export function startWunschNehmen(game) {
  if (startWunsch !== game) return false
  startWunsch = null
  return true
}

/*
 * PRACTICE MODE
 * -------------
 * Ohne aktivierten Deckel ist genau ein Game spielbar. Die Seite legt es in
 * `PracticeKontext.Provider` — das Spiel selbst bleibt unveraendert. Innerhalb
 * dieses Kontexts meldet der Lauf nichts beim Server an und gibt nichts ab:
 * kein Laufticket, kein Score, kein Ranking, kein Tresorkoenig. Der Wert des
 * Kontexts traegt `onCta` fuer den Weg zur Aktivierung.
 */
export const PracticeKontext = createContext(null)

/** Wie oft die Restzeit nachgesehen wird. Fuer eine Sekundenanzeige reicht das. */
const UHR_MS = 200

/*
 * SOFORT (nur die Endlosspiele)
 * -----------------------------
 * Mit `sofort: true` wartet der Start nicht auf den Server: das Spielfeld
 * laeuft beim Tipp los, das Laufticket kommt parallel. `fertig` wartet dann
 * auf genau dieses Ticket, bevor es abgibt. NOCHMAL geht schon waehrend des
 * Speicherns — der alte Lauf wird trotzdem vollstaendig abgegeben, nur sein
 * Ergebnis ueberschreibt nicht mehr die Anzeige des neuen (Laufnummer).
 * Wer im Spielfeld eine Mindestzeit braucht, liest `ticketSeitRef`: 0, bis
 * das Ticket da ist, danach der Zeitpunkt seiner Ankunft.
 */
export function useSpielLauf({ sitzung, game, dauerVorgabe = 30000, onErgebnis, sofort = false }) {
  /* 'ruht' → 'startet' → 'laeuft' → 'sendet' → 'vorbei' */
  const [phase, setPhase] = useState('ruht')
  const [restMs, setRestMs] = useState(dauerVorgabe)
  const [punkte, setPunkte] = useState(0)
  const [antwort, setAntwort] = useState(null)
  const [fehler, setFehler] = useState(null)
  const practice = useContext(PracticeKontext) != null

  const ticketRef = useRef(null)
  const endeRef = useRef(0)
  const strafeRef = useRef(0)
  const punkteRef = useRef(0)
  const rundenRef = useRef(0)
  /* Gegen die doppelte Abgabe: Uhr und Spielfeld koennen beide beenden wollen. */
  const abgegebenRef = useRef(false)
  const lebtRef = useRef(true)
  const laufNrRef = useRef(0)
  const ticketWartenRef = useRef(null)
  const ticketSeitRef = useRef(0)

  useEffect(
    () => () => {
      lebtRef.current = false
    },
    [],
  )

  /** Punkte addieren. Nie unter null — ein negativer Punktestand liest sich wie ein Fehler. */
  const punkteGeben = useCallback((wieviel) => {
    const neu = Math.max(0, punkteRef.current + wieviel)
    punkteRef.current = neu
    setPunkte(neu)
  }, [])

  /** Runden mitzaehlen. Geht als technische Angabe mit ans Ergebnis. */
  const rundeZaehlen = useCallback(() => {
    rundenRef.current += 1
  }, [])

  const zeitStrafe = useCallback((ms) => {
    const moeglich = Math.max(0, STRAFE_MAX_MS - strafeRef.current)
    const wirkt = Math.min(ms, moeglich)
    strafeRef.current += wirkt
    endeRef.current -= wirkt
    return wirkt
  }, [])

  /**
   * Runde abschliessen und abgeben. Der Punktestand kommt aus dem Ref, nicht
   * aus dem State: der letzte Treffer kurz vor dem Ablauf soll zaehlen, auch
   * wenn React noch nicht neu gerendert hat.
   */
  const fertig = useCallback(async () => {
    if (abgegebenRef.current) return
    abgegebenRef.current = true

    const erreicht = punkteRef.current

    /* Practice: nur anzeigen, nichts abgeben. */
    if (practice) {
      setAntwort({ ok: true, practice: true })
      setPhase('vorbei')
      return
    }

    if (sofort) {
      const nr = laufNrRef.current
      const runden = rundenRef.current
      setPhase('sendet')
      const ticket = await ticketWartenRef.current
      if (!lebtRef.current) return
      if (!ticket) {
        if (nr === laufNrRef.current) setPhase('ruht')
        return
      }
      const daten = await spielBeenden({ sitzung, game, ticket, score: erreicht, runden })
      if (!lebtRef.current) return
      if (nr === laufNrRef.current) {
        setAntwort(daten)
        setPhase('vorbei')
      }
      if (daten?.ok && onErgebnis) onErgebnis(daten)
      return
    }

    const ticket = ticketRef.current
    ticketRef.current = null

    if (!ticket) {
      setPhase('vorbei')
      return
    }

    setPhase('sendet')
    const daten = await spielBeenden({
      sitzung,
      game,
      ticket,
      score: erreicht,
      runden: rundenRef.current,
    })
    if (!lebtRef.current) return

    setAntwort(daten)
    setPhase('vorbei')
    if (daten?.ok && onErgebnis) onErgebnis(daten)
  }, [sitzung, game, onErgebnis, sofort, practice])

  /* Die Uhr. Laeuft nur waehrend der Runde. */
  useEffect(() => {
    if (phase !== 'laeuft') return undefined

    const uhr = setInterval(() => {
      const rest = Math.max(0, endeRef.current - Date.now())
      setRestMs(rest)
      if (rest <= 0) fertig()
    }, UHR_MS)

    return () => clearInterval(uhr)
  }, [phase, fertig])

  /**
   * Runde anmelden. Ohne Laufticket wird nicht gespielt — ein Ergebnis, das
   * der Server hinterher nicht annehmen kann, waere vergeudete Spielzeit.
   */
  const starten = useCallback(async () => {
    setFehler(null)
    setAntwort(null)

    if (sofort) {
      const nr = laufNrRef.current + 1
      laufNrRef.current = nr
      ticketRef.current = null
      ticketSeitRef.current = 0
      endeRef.current = Date.now() + dauerVorgabe
      strafeRef.current = 0
      punkteRef.current = 0
      rundenRef.current = 0
      abgegebenRef.current = false
      setPunkte(0)
      setRestMs(dauerVorgabe)
      setPhase('laeuft')
      if (practice) {
        /* Kein Server: das "Ticket" ist sofort da, damit Mindestzeiten im
           Spielfeld genauso greifen wie im gewerteten Lauf. */
        ticketSeitRef.current = Date.now()
        ticketWartenRef.current = Promise.resolve('practice')
        return true
      }
      ticketWartenRef.current = spielStarten(sitzung, game).then((daten) => {
        if (!lebtRef.current) return null
        if (!daten?.ok || !daten.ticket) {
          /* Ohne Ticket kein Lauf: laeuft er noch, endet er mit der Meldung. */
          if (nr === laufNrRef.current) {
            setFehler(daten?.grund || 'server')
            if (!abgegebenRef.current) {
              abgegebenRef.current = true
              setPhase('ruht')
            }
          }
          return null
        }
        if (nr === laufNrRef.current) ticketSeitRef.current = Date.now()
        return daten.ticket
      })
      return true
    }

    let dauer = dauerVorgabe
    if (practice) {
      ticketRef.current = null
    } else {
      setPhase('startet')

      const daten = await spielStarten(sitzung, game)
      if (!lebtRef.current) return false

      if (!daten?.ok || !daten.ticket) {
        setFehler(daten?.grund || 'server')
        setPhase('ruht')
        return false
      }

      if (Number(daten.dauerMs) > 0) dauer = Number(daten.dauerMs)
      ticketRef.current = daten.ticket
    }
    endeRef.current = Date.now() + dauer
    strafeRef.current = 0
    punkteRef.current = 0
    rundenRef.current = 0
    abgegebenRef.current = false
    setPunkte(0)
    setRestMs(dauer)
    setPhase('laeuft')
    return true
  }, [sitzung, game, dauerVorgabe, sofort, practice])

  return {
    sofort,
    practice,
    ticketSeitRef,
    phase,
    laeuft: phase === 'laeuft',
    restMs,
    restSek: Math.ceil(restMs / 1000),
    punkte,
    punkteRef,
    antwort,
    fehler,
    starten,
    fertig,
    punkteGeben,
    rundeZaehlen,
    zeitStrafe,
  }
}
