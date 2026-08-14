import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { useLenis } from 'lenis/react'

import AmbientBackground from './AmbientBackground.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import RouteSeo from './RouteSeo.jsx'
// Anfragemodell (§ 3/§ 4): „Deine Anfrageliste" ist ein rein lokales Merk-Panel
// für die unverbindliche E-Mail-Sammelanfrage – KEIN Warenkorb/Checkout, keine
// Bestellung, keine Server-Speicherung.
import { CartProvider } from '../shop/CartContext.jsx'
import ShopOverlays from './merch/ShopOverlays.jsx'

// Scrollposition je History-Eintrag (location.key) in sessionStorage sichern.
// Das ist dasselbe Muster wie React Routers eingebautes <ScrollRestoration>
// und funktioniert daher auch mit dem Browser-Zurueck-Button und nach Reload.
const SCROLL_PREFIX = 'videko:scroll:'

const leseScroll = (key) => {
  try {
    const roh = sessionStorage.getItem(SCROLL_PREFIX + key)
    return roh == null ? null : (parseFloat(roh) || 0)
  } catch { return null }
}
const schreibeScroll = (key, wert) => {
  try { sessionStorage.setItem(SCROLL_PREFIX + key, String(Math.round(wert))) } catch { /* Storage evtl. gesperrt */ }
}

export default function Layout() {
  const { pathname, hash, key } = useLocation()
  const navType = useNavigationType() // 'POP' = Verlaufssprung (Zurueck/Vorwaerts, auch Browser-Button)
  const lenis = useLenis()

  // Laufende Scrollposition des aktuellen Eintrags festhalten.
  const scrollRef = useRef(0)
  const keyRef = useRef(key)
  keyRef.current = key
  const letzterWrite = useRef(0)

  useLenis((l) => {
    scrollRef.current = l.scroll
    // Gedrosselt persistieren (Reload-Sicherheit); die exakte Position beim
    // Verlassen sichert zusaetzlich der Cleanup weiter unten.
    const jetzt = performance.now()
    if (jetzt - letzterWrite.current > 200) {
      letzterWrite.current = jetzt
      schreibeScroll(keyRef.current, l.scroll)
    }
  })

  // Scroll-Wiederherstellung VOR dem Paint, damit es kein sichtbares Springen
  // oder kurzes Scrollen von oben gibt. Bei einem #anker uebernimmt der Effekt
  // darunter (weiches Scrollen zum Ziel).
  useLayoutEffect(() => {
    if (hash) return
    // Nur bei Verlaufsspruengen (POP) die gemerkte Position wiederherstellen,
    // ansonsten (neue Seite via Link) an den Anfang.
    const gemerkt = navType === 'POP' ? leseScroll(key) : null
    const ziel = gemerkt != null ? gemerkt : 0

    let raf
    let versuche = 0
    const anwenden = () => {
      if (lenis) {
        lenis.resize()
        lenis.scrollTo(ziel, { immediate: true, force: true })
      } else {
        window.scrollTo(0, ziel)
      }
      // Nur falls die Zielseite noch Hoehe aufbaut, ueber wenige Frames
      // nachfuehren – aber nur bis die Position erreicht ist.
      const ist = lenis ? lenis.scroll : window.scrollY
      versuche += 1
      if (ziel > 0 && Math.abs(ist - ziel) > 2 && versuche < 20) {
        raf = requestAnimationFrame(anwenden)
      }
    }
    anwenden()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      // Beim Verlassen dieses Eintrags die exakte Endposition sichern.
      schreibeScroll(key, scrollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, key, lenis])

  // #anker aus Footer-/Sektions-Links anspringen (weiches Scrollen).
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    const t = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) {
        if (lenis) lenis.scrollTo(el, { offset: -80 })
        else el.scrollIntoView({ behavior: 'smooth' })
      }
    }, 320)
    return () => clearTimeout(t)
  }, [hash, key, lenis])

  return (
    <CartProvider>
      <div className="app" id="top">
        <RouteSeo />
        <AmbientBackground />
        <Header />
        <main>
          {/* Alle Routen ausser der Startseite werden als eigener Chunk
              nachgeladen (siehe App.jsx). Der Platzhalter haelt waehrenddessen
              die Viewporthoehe, damit Header und Footer nicht springen. */}
          <Suspense fallback={<div className="route-fallback" aria-hidden="true" />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
        <ShopOverlays />
      </div>
    </CartProvider>
  )
}
