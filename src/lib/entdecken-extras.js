import { useEffect, useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { baustellenIndex, INDEX_BASIS } from './baustellenindex.js'
import { BAUSTELLEN_BEREICHE, BAUSTELLEN_GATES, LIVE_TICKER, QR_BADGE } from '../data/entdecken.js'

/**
 * Zwei kleine Helfer fuer /entdecken: die QR-Plakette im Hero und die
 * Live-Zeile darunter.
 *
 * Beide liegen bewusst hier und nicht in der Seite: In einer .jsx-Datei
 * duerfen nur Komponenten exportiert werden (react-refresh).
 *
 * Beide brauchen einen Wert, den es beim Vorrendern (scripts/prerender.mjs)
 * noch nicht geben kann — ob jemand gescannt hat, weiss erst der Browser.
 * Dafuer steht useSyncExternalStore: Waehrend Build und Hydration liefert er
 * den neutralen Wert, danach den echten. So sind vorgerendertes HTML und
 * erster Render im Browser identisch, und Math.random laeuft nie waehrend
 * eines Renders, auf den die Hydration schaut.
 */

/** Beide Werte stehen nach dem ersten Lesen fest — es gibt nichts zu abonnieren. */
const ohneAenderung = () => () => {}

/* ------------------------------------------------------------------ *
 * QR-Plakette
 * ------------------------------------------------------------------ */

/**
 * Kommt dieser Besuch nachweislich von einem gedruckten QR-Code?
 *
 * Gelesen wird nur, was der Browser ohnehin mitbringt: der Query-String
 * der aufgerufenen Adresse und `document.referrer`. Nichts wird gezaehlt,
 * gespeichert oder gesendet, keine Adresszeile wird veraendert, und am
 * Kurzlink-Dienst unter go.videko-kuechen.de aendert sich nichts.
 *
 * Im Zweifel lautet die Antwort nein: Wir behaupten niemandem gegenueber,
 * er habe gescannt, nur weil er die Seite geoeffnet hat.
 */
function qrHerkunft() {
  if (typeof window === 'undefined') return false
  try {
    const suche = new URLSearchParams(window.location.search)
    const istQuelle = (wert) => QR_BADGE.quellen.includes(String(wert || '').trim().toLowerCase())

    if (istQuelle(suche.get('utm_source'))) return true
    if (istQuelle(suche.get('utm_medium'))) return true
    if (QR_BADGE.parameter.some((name) => suche.has(name))) return true

    const verweis = typeof document === 'undefined' ? '' : document.referrer
    if (verweis) {
      const host = new URL(verweis).hostname.toLowerCase()
      if (QR_BADGE.referrer.some((h) => host === h || host.endsWith(`.${h}`))) return true
    }
  } catch {
    return false
  }
  return false
}

/**
 * Der Text wird genau einmal pro Seitenaufruf gezogen und liegt danach im
 * Modul — die Plakette wechselt ihren Spruch also nicht, waehrend jemand
 * die Seite liest.
 */
let plakette = null

function plaketteImBrowser() {
  if (plakette === null) {
    const liste = QR_BADGE.texte
    plakette = qrHerkunft() && liste.length ? liste[Math.floor(Math.random() * liste.length)] : ''
  }
  return plakette
}

/** Beim Vorrendern und waehrend der Hydration zeigt die Plakette nichts. */
const plaketteBeimBauen = () => ''

/** Liefert den Text der Plakette — oder null, wenn nichts auf einen Scan deutet. */
export function useQrBadge() {
  const text = useSyncExternalStore(ohneAenderung, plaketteImBrowser, plaketteBeimBauen)
  return text || null
}

/* ------------------------------------------------------------------ *
 * Live-Ticker
 * ------------------------------------------------------------------ */

/**
 * Die Zahlen der Meldungen — aus genau derselben Rechnung wie der
 * Baustellenindex weiter unten auf der Seite. Der Ticker erfindet nichts
 * und hat keine eigene Datenquelle.
 */
function tickerWerte(heute, stand) {
  const daten = baustellenIndex(BAUSTELLEN_BEREICHE, heute || INDEX_BASIS, BAUSTELLEN_GATES)
  const prozent = (id) => {
    const b = daten.bereiche.find((x) => x.id === id)
    return b ? b.prozent : 0
  }
  return {
    index: daten.gesamt,
    days: stand && stand.tage !== null ? stand.tage : 0,
    delay: stand && stand.art === 'verzug' ? stand.tage : 0,
    kuechen: prozent('kuechen'),
    klo: prozent('luxusklo'),
    klo1: prozent('mitarbeiterklo-1'),
    klo2: prozent('mitarbeiterklo-2'),
    bar: prozent('bar'),
    light: prozent('beleuchtung'),
    empfang: prozent('empfang'),
    ausstellung: prozent('ausstellung'),
    breakroom: prozent('aufenthaltsraum'),
  }
}

/** Passt eine Meldung zum aktuellen Zustand der Baustelle? */
function passt(meldung, stand) {
  if (!meldung.nur) return true
  if (meldung.nur === 'gate-offen') return Boolean(BAUSTELLEN_GATES.kitchensDeliveredAt)
  if (meldung.nur === 'gate-zu') return !BAUSTELLEN_GATES.kitchensDeliveredAt
  return stand ? stand.art === meldung.nur : false
}

/**
 * Die heute gueltigen Meldungen, fertig ausgefuellt. Meldungen, die nicht
 * zum Zustand passen (Verzug, gefallenes Lieferdatum), fallen raus — so
 * behauptet der Ticker nie etwas, das gerade nicht stimmt.
 */
export function tickerZeilen(heute, stand) {
  const werte = tickerWerte(heute, stand)
  return LIVE_TICKER.meldungen
    .filter((m) => passt(m, stand))
    .map((m) => m.text.replace(/\{(\w+)\}/g, (roh, schluessel) =>
      schluessel in werte ? String(werte[schluessel]) : roh
    ))
}

/**
 * Wo im Meldungsvorrat dieser Besuch einsteigt. Einmal pro Seitenaufruf
 * gezogen, damit nicht jeder Gast mit derselben Zeile begruesst wird; die
 * Reihenfolge danach bleibt die aus entdecken.js.
 */
let einstieg = null
const einstiegImBrowser = () => {
  if (einstieg === null) einstieg = Math.floor(Math.random() * 997)
  return einstieg
}
const einstiegBeimBauen = () => 0

/**
 * Eine Meldung nach der anderen: stehen lassen, sanft ausblenden, naechste
 * einblenden. Keine Laufschrift, kein Marquee.
 *
 * Solange der Tag noch nicht feststeht — beim Vorrendern und im ersten
 * Render im Browser — steht die zahlenfreie Startzeile da. Erst wenn
 * useHeute den Tag gemeldet hat, laufen echte Zahlen ein.
 *
 * `pausieren` haelt bei Mauszeiger und Tastaturfokus an. Pausiert wird nur,
 * solange eine Meldung vollstaendig sichtbar ist; ein Hover mitten in der
 * Blende wuerde die Zeile sonst unsichtbar stehen lassen.
 */
export function useLiveTicker(heute, stand) {
  const zeilen = useMemo(() => tickerZeilen(heute, stand), [heute, stand])
  const start = useSyncExternalStore(ohneAenderung, einstiegImBrowser, einstiegBeimBauen)

  const [schritt, setSchritt] = useState(0)
  const [sichtbar, setSichtbar] = useState(true)
  const [halt, setHalt] = useState(false)

  const anzahl = zeilen.length
  const bereit = Boolean(heute) && anzahl > 0

  useEffect(() => {
    if (!bereit || anzahl < 2) return undefined
    if (halt && sichtbar) return undefined

    const { standzeit, blende } = LIVE_TICKER
    // Die Standzeit streut leicht, damit der Wechsel nicht metronomisch wirkt.
    const dauer = sichtbar
      ? standzeit.min + Math.round(Math.random() * (standzeit.max - standzeit.min))
      : blende

    const id = setTimeout(() => {
      if (sichtbar) {
        setSichtbar(false)
      } else {
        setSchritt((n) => n + 1)
        setSichtbar(true)
      }
    }, dauer)

    return () => clearTimeout(id)
  }, [bereit, anzahl, sichtbar, halt])

  const pausieren = useCallback(() => setHalt(true), [])
  const weiter = useCallback(() => setHalt(false), [])

  return {
    text: bereit ? zeilen[(start + schritt) % anzahl] : LIVE_TICKER.start,
    sichtbar,
    pausiert: halt,
    anzahl,
    pausieren,
    weiter,
  }
}
