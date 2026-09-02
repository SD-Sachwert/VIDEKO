import { useCallback, useEffect, useRef, useState } from 'react'

import {
  SPEKTAKEL_CHANCE,
  SPEKTAKEL_EVENTS,
  SPEKTAKEL_GEWICHT,
  SPEKTAKEL_MEILEN,
  SPEKTAKEL_OBJEKTE,
} from '../data/entdecken'

/* ==================================================================== *
 * Spektakel — Steuerung der Easter-Egg-Ebene fuer „Drueck nicht."
 *
 * Hier liegt alles ohne Markup: Auswahl des Ereignisses, Aufbau des
 * Goldfeuerwerks und der Zustand der Ebene. Die Darstellung (Inline-SVG
 * und der Layer selbst) steht in components/EntdeckenSpektakel.jsx.
 *
 * Keine Library, keine externen Bilder, kein Sound, kein Netzaufruf.
 * Zufall laeuft ausschliesslich im Klick-Handler, nie beim Render — der
 * Prerender muss auf Server und Client dasselbe Markup ergeben.
 * ==================================================================== */

/* Farben ausschliesslich warm: Gold, Champagner, Warmweiss, Bronze. */
const GOLD = '#c9a050'
const GOLD_HELL = '#e8c978'
const BRONZE = '#8b6b38'

/* ------------------------------------------------------------------ *
 * Feuerwerk
 * ------------------------------------------------------------------ */

/* Nur warme Toene: Gold, Champagner, Warmweiss, Bronze. Kein Regenbogen. */
const FW_FARBEN = [
  ['#fffdf3', GOLD_HELL],
  ['#f3e3bd', GOLD],
  [GOLD_HELL, BRONZE],
  ['#fff6e0', GOLD],
]

/* Ein Burst. Bewusst wenige, dafuer deutlich sichtbare Partikel — 300
   DOM-Knoten pro Klick waeren weder schoen noch fluessig. */
function burstTeile(gross) {
  const anzahl = gross ? 13 : 11
  const teile = []
  for (let i = 0; i < anzahl; i += 1) {
    const winkel = (i / anzahl) * Math.PI * 2 + Math.random() * 0.44
    const weite = (gross ? 104 : 72) * (0.6 + Math.random() * 0.55)
    const farbe = FW_FARBEN[Math.floor(Math.random() * FW_FARBEN.length)]
    teile.push({
      x: Math.round(Math.cos(winkel) * weite),
      y: Math.round(Math.sin(winkel) * weite * 0.88),
      gr: Math.round((gross ? 7 : 6) + Math.random() * 4),
      // Laenger unterwegs und am Ende langsam ausgluehend statt abrupt
      // weg — die Kurve dazu steht in ent-fw-teil.
      dauer: (gross ? 1500 : 1150) + Math.round(Math.random() * (gross ? 260 : 220)),
      c1: farbe[0],
      c2: farbe[1],
    })
  }
  return teile
}

/* Mehrere kleine Bursts an unterschiedlichen Stellen im Hero. Der letzte
   Burst startet spaet genug, dass es nach Kette aussieht: klein endet nach
   rund 1,6 s, gross nach rund 2,1 s. */
function feuerwerkBauen(gross) {
  const anzahl = gross ? 5 : 3
  const bursts = []
  for (let j = 0; j < anzahl; j += 1) {
    bursts.push({
      id: j,
      x: 13 + Math.random() * 74,
      y: 15 + Math.random() * 50,
      verzug: j * (gross ? 80 : 100),
      gross,
      teile: burstTeile(gross),
    })
  }
  return bursts
}

const FW_GESAMT = { klein: 1600, gross: 2120 }

/* ------------------------------------------------------------------ *
 * Auswahl
 * ------------------------------------------------------------------ */

/** Gewichtete Zufallsauswahl. Laeuft nur im Klick-Handler, nie beim Render. */
function gewichtetWaehlen(liste) {
  let summe = 0
  for (const e of liste) summe += SPEKTAKEL_GEWICHT[e.rarity] || 1
  let wurf = Math.random() * summe
  for (const e of liste) {
    wurf -= SPEKTAKEL_GEWICHT[e.rarity] || 1
    if (wurf <= 0) return e
  }
  return liste[liste.length - 1]
}

/** Ereignis per id — nur fuer den internen Testtrigger, ohne Zufall. */
export function spektakelNachId(id) {
  const treffer = SPEKTAKEL_EVENTS.find((e) => e.id === id)
  if (treffer) return treffer
  for (const n of Object.keys(SPEKTAKEL_MEILEN)) {
    if (SPEKTAKEL_MEILEN[n].id === id) return SPEKTAKEL_MEILEN[n]
  }
  return null
}

/* ------------------------------------------------------------------ *
 * Steuerung
 * ------------------------------------------------------------------ */

/**
 * Haelt den Zustand der Spektakel-Ebene. `ausloesen(n)` entscheidet fuer
 * den n-ten Klick, ob es ein Event gibt, und gibt es zurueck, damit der
 * Knopf die passende Meldung anzeigen kann (null = ganz normaler Klick).
 *
 * Regel gegen Event-Spam: hoechstens EIN fliegendes Objekt gleichzeitig.
 * Ein zufaelliges Event mit Objekt wird komplett verworfen, solange noch
 * eines fliegt; ein fester Meilenstein loest das laufende sauber ab.
 * Feuerwerk darf parallel laufen.
 */
export function useSpektakel() {
  const [objekt, setObjekt] = useState(null)
  const [feuer, setFeuer] = useState(null)
  const lauf = useRef(0)
  const objTimer = useRef(null)
  const fwTimer = useRef(null)
  const vorgemerkt = useRef(null)

  useEffect(
    () => () => {
      clearTimeout(objTimer.current)
      clearTimeout(fwTimer.current)
    },
    [],
  )

  const starten = useCallback((ereignis, erzwingen) => {
    if (!ereignis) return null
    const bahn = ereignis.object ? SPEKTAKEL_OBJEKTE[ereignis.object] : null

    if (bahn) {
      if (objTimer.current !== null && !erzwingen) return null
      clearTimeout(objTimer.current)
      lauf.current += 1
      // Die Laufzeit geht als CSS-Variable mit an das Element: die drei
      // Phasen stehen in der Animation in Prozent, die absolute Laenge
      // bestimmt das Objekt.
      setObjekt({
        nr: lauf.current,
        art: ereignis.object,
        bahn: bahn.bahn,
        dauer: bahn.dauer,
      })
      objTimer.current = setTimeout(() => {
        objTimer.current = null
        setObjekt(null)
      }, bahn.dauer + 60)
    }

    if (ereignis.effects && ereignis.effects.includes('firework')) {
      const gross = ereignis.firework === 'gross'
      clearTimeout(fwTimer.current)
      lauf.current += 1
      setFeuer({ nr: lauf.current, bursts: feuerwerkBauen(gross) })
      fwTimer.current = setTimeout(
        () => {
          fwTimer.current = null
          setFeuer(null)
        },
        (gross ? FW_GESAMT.gross : FW_GESAMT.klein) + 120,
      )
    }

    return ereignis
  }, [])

  /**
   * Merkt ein bestimmtes Ereignis fuer den naechsten Knopfdruck vor. Das
   * ist der einzige Weg, ein 10-%-Ereignis gezielt zu pruefen, ohne die
   * normale Wahrscheinlichkeit anzufassen: der Klick laeuft danach ganz
   * regulaer durch, samt passender Meldung und den ueblichen Effekten.
   */
  const vormerken = useCallback((ereignis) => {
    vorgemerkt.current = ereignis || null
  }, [])

  /**
   * Fliegt gerade ein Objekt? Der Knopf fragt das vor dem Klick ab, um
   * die Meldung des laufenden Ereignisses stehen zu lassen: Objekt und
   * Text gehoeren zusammen und duerfen nicht von einem Zwischenklick
   * ueberschrieben werden. Alles andere am Klick bleibt unberuehrt.
   */
  const objektLaeuft = useCallback(() => objTimer.current !== null, [])

  const ausloesen = useCallback(
    (n, hatFestenText) => {
      const vor = vorgemerkt.current
      if (vor) {
        vorgemerkt.current = null
        return starten(vor, true)
      }
      const fest = SPEKTAKEL_MEILEN[n]
      if (fest) return starten(fest, true)
      // Hat dieser Klick schon einen festen Meilensteintext, faellt das
      // Zufallsereignis aus: sonst wuerde die Meldung des Ereignisses vom
      // Meilenstein verschluckt und ein Objekt floege ohne seinen Spruch.
      if (hatFestenText) return null
      if (Math.random() >= SPEKTAKEL_CHANCE) return null
      return starten(gewichtetWaehlen(SPEKTAKEL_EVENTS), false)
    },
    [starten],
  )

  return { objekt, feuer, ausloesen, vormerken, objektLaeuft }
}

