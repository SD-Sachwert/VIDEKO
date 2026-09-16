/**
 * Die gemeinsame Huelle unter allen Spielen: Seitensperre und Vollbild.
 *
 * Das Problem ist auf dem Handy immer dasselbe. Ein Spiel liegt mitten in
 * einer langen Seite; ein Wisch, der eigentlich einen Stein schieben soll,
 * scrollt stattdessen das Terminal, und die Adresszeile klappt auf und zu.
 * `touch-action: none` auf der Buehne verhindert nur die Geste innerhalb des
 * Feldes — die Seite darunter bleibt beweglich, und iOS scrollt beim
 * Ueberziehen trotzdem weiter.
 *
 * Deshalb zwei Massnahmen, beide hier zentral statt elfmal im Spiel:
 *
 * 1. Waehrend eine Runde laeuft, wird der Seitenkoerper eingefroren. Nicht
 *    per `overflow: hidden` — das allein reicht auf iOS nicht —, sondern als
 *    `position: fixed` mit gemerktem Versatz. Optisch aendert sich dadurch
 *    nichts, die Seite kann aber nicht mehr weglaufen. Beim Freigeben wird
 *    exakt an dieselbe Stelle zurueckgesprungen.
 * 2. Auf Wunsch legt sich die Karte als Vollbild ueber alles. Die echte
 *    Fullscreen-API wird nur versucht, wenn ein echter Tipp sie ausgeloest
 *    hat — automatisch geht das ohnehin nirgends. Wo sie fehlt (iPhone kennt
 *    sie fuer normale Elemente nicht), uebernimmt eine feste Schicht ueber
 *    dem Dokument. Fuer den Spieler sieht beides gleich aus.
 *
 * Die Sperre zaehlt mit: sollten je zwei Karten gleichzeitig sperren wollen,
 * gibt erst die letzte die Seite wieder frei.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

let tiefe = 0
let merk = null

function sperren() {
  tiefe += 1
  if (tiefe > 1) return
  const y = window.scrollY || window.pageYOffset || 0
  const k = document.body.style
  const w = document.documentElement.style
  merk = {
    y,
    position: k.position,
    top: k.top,
    left: k.left,
    width: k.width,
    overflow: k.overflow,
    ueberzug: w.overscrollBehavior,
  }
  k.position = 'fixed'
  k.top = `-${y}px`
  k.left = '0'
  k.width = '100%'
  k.overflow = 'hidden'
  w.overscrollBehavior = 'none'
}

function freigeben() {
  if (tiefe === 0) return
  tiefe -= 1
  if (tiefe > 0 || !merk) return
  const k = document.body.style
  const w = document.documentElement.style
  k.position = merk.position
  k.top = merk.top
  k.left = merk.left
  k.width = merk.width
  k.overflow = merk.overflow
  w.overscrollBehavior = merk.ueberzug
  /* Erst die Stile zurueck, dann springen — sonst landet der Sprung im noch
     eingefrorenen Dokument und verpufft. */
  window.scrollTo(0, merk.y)
  merk = null
}

/** Kennt der Browser echtes Vollbild fuer beliebige Elemente? */
export function vollbildMoeglich() {
  if (typeof document === 'undefined') return false
  return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled)
}

function laufendesVollbild() {
  if (typeof document === 'undefined') return null
  return document.fullscreenElement || document.webkitFullscreenElement || null
}

function vollbildBeenden() {
  if (!laufendesVollbild()) return
  const weg = document.exitFullscreen || document.webkitExitFullscreen
  try {
    weg?.call(document)
  } catch {
    /* Schon zu, oder der Browser mag nicht. Beides egal. */
  }
}

/**
 * @param aktiv  laeuft gerade eine Runde? Nur dann wird die Seite gesperrt.
 * @returns huelleRef (an die Spielkarte haengen), vollbild, echt, vollbildSetzen
 */
export function useSpielShell(aktiv) {
  const huelleRef = useRef(null)
  const [vollbild, setVollbild] = useState(false)
  const [echt, setEcht] = useState(false)

  /* Gesperrt wird, solange gespielt wird ODER das Vollbild steht. Nach dem
     Game Over faellt die Sperre also von selbst — es sei denn, der Spieler
     sitzt noch im Vollbild und will gleich nochmal. */
  useEffect(() => {
    if (!aktiv && !vollbild) return undefined
    sperren()
    return freigeben
  }, [aktiv, vollbild])

  /* Verlaesst der Browser das echte Vollbild von sich aus — Escape, Wischen
     von oben, Systemtaste —, muss unsere Schicht mitgehen. Sonst bliebe eine
     feste Auflage ohne Ausweg stehen. */
  useEffect(() => {
    if (!echt) return undefined
    const wechsel = () => {
      if (laufendesVollbild()) return
      setEcht(false)
      setVollbild(false)
    }
    document.addEventListener('fullscreenchange', wechsel)
    document.addEventListener('webkitfullscreenchange', wechsel)
    return () => {
      document.removeEventListener('fullscreenchange', wechsel)
      document.removeEventListener('webkitfullscreenchange', wechsel)
    }
  }, [echt])

  /* Im Pseudo-Vollbild gibt es keine Browsertaste. Escape muss sie ersetzen,
     sonst sitzt man auf dem Desktop fest. */
  useEffect(() => {
    if (!vollbild || echt) return undefined
    const taste = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setVollbild(false)
    }
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [vollbild, echt])

  /* Ausbau der Karte: nichts darf zurueckbleiben. Die Seitensperre raeumt
     ihr eigener Effekt ab, das Vollbild hier. */
  useEffect(
    () => () => {
      vollbildBeenden()
    },
    [],
  )

  const vollbildSetzen = useCallback((an) => {
    if (!an) {
      setVollbild(false)
      setEcht(false)
      vollbildBeenden()
      return
    }
    /* Die Schicht kommt in jedem Fall — sie ist die Anzeige. Das echte
       Vollbild ist nur die Kuer und darf still scheitern. */
    setVollbild(true)
    const el = huelleRef.current
    if (!el || !vollbildMoeglich()) return
    const bitte = el.requestFullscreen || el.webkitRequestFullscreen
    if (!bitte) return
    try {
      const antwort = bitte.call(el, { navigationUI: 'hide' })
      if (antwort?.then) antwort.then(() => setEcht(true), () => setEcht(false))
      else setEcht(true)
    } catch {
      setEcht(false)
    }
  }, [])

  return { huelleRef, vollbild, echt, vollbildSetzen }
}
