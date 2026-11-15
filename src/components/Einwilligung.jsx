/**
 * Einwilligungsbanner für Statistik- und Werbedienste (siehe src/lib/marketing.js).
 * Erscheint nur, wenn mindestens ein Dienst per ID aktiviert ist.
 * „Alle akzeptieren“ und „Nur notwendige“ sind gleich groß und gleich erreichbar, nichts ist vorangekreuzt.
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  EINWILLIGUNG_NOETIG, MARKETING_AKTIV, STATISTIK_AKTIV, EREIGNIS, OEFFNEN,
  aktiveDienste, diensteLaden, meldeSeitenwechsel,
} from '../lib/marketing.js'

const SCHLUESSEL = 'videko-einwilligung'
const FASSUNG = 1

function lesen() {
  try {
    const w = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? 'null')
    return w && w.fassung === FASSUNG ? w : null
  } catch {
    return null
  }
}

function cookieEinstellungenOeffnen() {
  window.dispatchEvent(new Event(OEFFNEN))
}

export function CookieEinstellungenLink() {
  if (!EINWILLIGUNG_NOETIG) return null
  return (
    <button type="button" onClick={cookieEinstellungenOeffnen} className="footer__cookie">
      Cookie-Einstellungen
    </button>
  )
}

export default function Einwilligung() {
  const [offen, setOffen] = useState(false)
  const [details, setDetails] = useState(false)
  const [statistik, setStatistik] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const { pathname } = useLocation()
  const ersterPfad = useRef(true)

  useEffect(() => {
    if (!EINWILLIGUNG_NOETIG) return
    const w = lesen()
    // Erst nach dem Hydrieren lesen, damit das vorgerenderte HTML gleich bleibt
    const raf = requestAnimationFrame(() => {
      if (w) {
        setStatistik(w.statistik)
        setMarketing(w.marketing)
        diensteLaden(w)
      } else setOffen(true)
    })
    const auf = () => { setDetails(true); setOffen(true) }
    window.addEventListener(OEFFNEN, auf)
    return () => { cancelAnimationFrame(raf); window.removeEventListener(OEFFNEN, auf) }
  }, [])

  // Seitenwechsel in der App melden (der erste Seitenaufruf zählt schon beim Laden der Dienste)
  useEffect(() => {
    if (ersterPfad.current) { ersterPfad.current = false; return }
    meldeSeitenwechsel()
  }, [pathname])

  function speichern(s, m) {
    const vorher = lesen()
    const w = { fassung: FASSUNG, statistik: s, marketing: m, zeit: new Date().toISOString() }
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(w)) } catch { /* privater Modus */ }
    setStatistik(s); setMarketing(m); setOffen(false); setDetails(false)
    window.dispatchEvent(new CustomEvent(EREIGNIS, { detail: w }))
    // Widerruf: geladene Dienste lassen sich nicht entladen, also Seite neu laden
    if ((vorher?.statistik && !s) || (vorher?.marketing && !m)) location.reload()
    else diensteLaden(w)
  }

  if (!offen || !EINWILLIGUNG_NOETIG) return null
  const dienste = aktiveDienste()
  const namen = (z) => dienste.filter((d) => d.zweck === z).map((d) => d.name).join(', ')

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="einwilligung-titel" className="einwilligung">
      <div className="einwilligung__karte">
        <p id="einwilligung-titel" className="einwilligung__titel">Dürfen wir messen, was unsere Werbung bringt?</p>
        <p className="einwilligung__text">
          Mit deiner Einwilligung nutzen wir {[namen('marketing'), namen('statistik')].filter(Boolean).join(' und ')}.
          Damit sehen wir, welche Anzeigen zu Anfragen führen, und können dich dort wieder ansprechen. Ohne Einwilligung bleibt das aus.
          Du kannst deine Wahl jederzeit über „Cookie-Einstellungen“ am Seitenende ändern.{' '}
          <a href="/datenschutz">Datenschutz</a>
        </p>

        {details && (
          <ul className="einwilligung__liste">
            <li>
              <span><b>Notwendig</b><br />Speichert nur deine Auswahl in diesem Browser. Immer aktiv.</span>
              <input type="checkbox" checked disabled aria-label="Notwendig, immer aktiv" />
            </li>
            {STATISTIK_AKTIV && (
              <li>
                <span><b>Statistik</b><br />{namen('statistik')}: wie die Website genutzt wird.</span>
                <input type="checkbox" checked={statistik} onChange={(e) => setStatistik(e.target.checked)} aria-label="Statistik" />
              </li>
            )}
            {MARKETING_AKTIV && (
              <li>
                <span><b>Marketing</b><br />{namen('marketing')}: Erfolg von Anzeigen messen und Besucher dort wieder ansprechen.</span>
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} aria-label="Marketing" />
              </li>
            )}
          </ul>
        )}

        <div className="einwilligung__knoepfe">
          <button type="button" onClick={() => speichern(false, false)} className="einwilligung__knopf">Nur notwendige</button>
          {details ? (
            <button type="button" onClick={() => speichern(statistik, marketing)} className="einwilligung__knopf">Auswahl speichern</button>
          ) : (
            <button type="button" onClick={() => setDetails(true)} className="einwilligung__knopf">Einstellungen</button>
          )}
          <button type="button" onClick={() => speichern(true, true)} className="einwilligung__knopf einwilligung__knopf--haupt">Alle akzeptieren</button>
        </div>
      </div>
    </div>
  )
}
